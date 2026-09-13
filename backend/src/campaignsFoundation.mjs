import { randomUUID } from 'node:crypto'
import { queryDatabase, withDatabaseTransaction } from './database.mjs'
import {
  canonicalizeCampaignDefinition,
  hashCampaignDefinition,
  validateCampaignDefinition,
  validateCampaignHeadInput,
} from './campaignDefinition.mjs'

function mapCampaign(row) {
  if (!row) return null
  return {
    id: row.id,
    slug: row.slug,
    internalName: row.internalName,
    draftDefinition: row.draftDefinition,
    draftRevision: Number(row.draftRevision),
    currentPublishedVersionId: row.currentPublishedVersionId ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

async function writeAudit(execute, actorUserId, action, metadata) {
  await execute(
    `
      INSERT INTO admin_audit_log (id, actor_user_id, action, metadata)
      VALUES ($1, $2, $3, $4::jsonb)
    `,
    [randomUUID(), actorUserId, action, JSON.stringify(metadata ?? {})],
  )
}

export async function createCampaignHead({
  slug,
  internalName,
  definition = {},
  actorUserId,
}) {
  const headErrors = validateCampaignHeadInput({ slug, internalName })
  const draftValidation = validateCampaignDefinition(definition, {
    mode: 'draft',
    headSlug: slug,
  })

  if (headErrors.length || draftValidation.errors.length) {
    return {
      ok: false,
      code: 'CAMPAIGN_DRAFT_INVALID',
      validation: {
        publishable: false,
        errors: [...headErrors, ...draftValidation.errors],
        warnings: draftValidation.warnings,
      },
    }
  }

  return withDatabaseTransaction(async client => {
    const execute = client.query.bind(client)
    const id = randomUUID()
    const canonical = canonicalizeCampaignDefinition(definition)
    const result = await execute(
      `
        INSERT INTO campaigns (
          id,
          slug,
          internal_name,
          draft_definition,
          created_by,
          updated_by
        )
        VALUES ($1, $2, $3, $4::jsonb, $5, $5)
        RETURNING
          id,
          slug,
          internal_name AS "internalName",
          draft_definition AS "draftDefinition",
          draft_revision AS "draftRevision",
          current_published_version_id AS "currentPublishedVersionId",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [id, slug, internalName.trim(), JSON.stringify(canonical), actorUserId],
    )

    await writeAudit(
      execute,
      actorUserId,
      'marketing.campaign_created',
      { campaignId: id, slug },
    )

    return { ok: true, campaign: mapCampaign(result.rows[0]) }
  })
}

export async function getCampaignHead(id, executor = queryDatabase) {
  const result = await executor(
    `
      SELECT
        id,
        slug,
        internal_name AS "internalName",
        draft_definition AS "draftDefinition",
        draft_revision AS "draftRevision",
        current_published_version_id AS "currentPublishedVersionId",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM campaigns
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  )
  return mapCampaign(result.rows[0])
}

export async function replaceCampaignDraft({
  id,
  expectedRevision,
  definition,
  actorUserId,
}) {
  return withDatabaseTransaction(async client => {
    const execute = client.query.bind(client)
    const locked = await execute(
      `
        SELECT slug, draft_revision AS "draftRevision"
        FROM campaigns
        WHERE id = $1
        FOR UPDATE
      `,
      [id],
    )
    const head = locked.rows[0]

    if (!head) return { ok: false, code: 'CAMPAIGN_NOT_FOUND' }
    if (Number(head.draftRevision) !== Number(expectedRevision)) {
      return { ok: false, code: 'CAMPAIGN_DRAFT_REVISION_CONFLICT' }
    }

    const validation = validateCampaignDefinition(definition, {
      mode: 'draft',
      headSlug: head.slug,
    })
    if (validation.errors.length) {
      return {
        ok: false,
        code: 'CAMPAIGN_DRAFT_INVALID',
        validation,
      }
    }

    const canonical = canonicalizeCampaignDefinition(definition)
    const currentHash = hashCampaignDefinition(canonicalizeCampaignDefinition(
      (await execute(
        `SELECT draft_definition AS definition FROM campaigns WHERE id = $1`,
        [id],
      )).rows[0]?.definition ?? {},
    ))
    const nextHash = hashCampaignDefinition(canonical)

    if (currentHash === nextHash) {
      return {
        ok: true,
        changed: false,
        draftRevision: Number(head.draftRevision),
        validation,
      }
    }

    const result = await execute(
      `
        UPDATE campaigns
        SET
          draft_definition = $2::jsonb,
          draft_revision = draft_revision + 1,
          updated_by = $3,
          updated_at = NOW()
        WHERE id = $1
        RETURNING draft_revision AS "draftRevision"
      `,
      [id, JSON.stringify(canonical), actorUserId],
    )

    await writeAudit(
      execute,
      actorUserId,
      'marketing.campaign_draft_updated',
      {
        campaignId: id,
        draftRevision: Number(result.rows[0].draftRevision),
      },
    )

    return {
      ok: true,
      changed: true,
      draftRevision: Number(result.rows[0].draftRevision),
      validation,
    }
  })
}

export async function publishCampaign({
  id,
  expectedDraftRevision,
  idempotencyKey,
  actorUserId,
}) {
  if (
    typeof idempotencyKey !== 'string' ||
    !idempotencyKey.trim() ||
    idempotencyKey.length > 240
  ) {
    return { ok: false, code: 'CAMPAIGN_PUBLISH_IDEMPOTENCY_KEY_INVALID' }
  }

  return withDatabaseTransaction(async client => {
    const execute = client.query.bind(client)
    const locked = await execute(
      `
        SELECT
          slug,
          draft_definition AS definition,
          draft_revision AS "draftRevision"
        FROM campaigns
        WHERE id = $1
        FOR UPDATE
      `,
      [id],
    )
    const campaign = locked.rows[0]

    if (!campaign) return { ok: false, code: 'CAMPAIGN_NOT_FOUND' }

    const existing = await execute(
      `
        SELECT
          id,
          version_number AS "versionNumber",
          definition_hash AS "definitionHash"
        FROM campaign_versions
        WHERE campaign_id = $1
          AND publish_idempotency_key = $2
        LIMIT 1
      `,
      [id, idempotencyKey.trim()],
    )
    if (existing.rows[0]) {
      return { ok: true, duplicate: true, version: existing.rows[0] }
    }

    if (Number(campaign.draftRevision) !== Number(expectedDraftRevision)) {
      return { ok: false, code: 'CAMPAIGN_DRAFT_REVISION_CONFLICT' }
    }

    const validation = validateCampaignDefinition(campaign.definition, {
      mode: 'publish',
      headSlug: campaign.slug,
    })
    if (!validation.publishable) {
      return {
        ok: false,
        code: 'CAMPAIGN_NOT_PUBLISHABLE',
        validation,
      }
    }

    const numberResult = await execute(
      `
        SELECT COALESCE(MAX(version_number), 0) + 1 AS next
        FROM campaign_versions
        WHERE campaign_id = $1
      `,
      [id],
    )
    const versionNumber = Number(numberResult.rows[0].next)
    const canonical = canonicalizeCampaignDefinition(campaign.definition)
    const definitionHash = hashCampaignDefinition(canonical)
    const versionId = randomUUID()

    await execute(
      `
        INSERT INTO campaign_versions (
          id,
          campaign_id,
          version_number,
          schema_version,
          definition,
          definition_hash,
          publish_idempotency_key,
          published_by
        )
        VALUES ($1, $2, $3, 'campaign.v1', $4::jsonb, $5, $6, $7)
      `,
      [
        versionId,
        id,
        versionNumber,
        JSON.stringify(canonical),
        definitionHash,
        idempotencyKey.trim(),
        actorUserId,
      ],
    )

    await execute(
      `
        UPDATE campaigns
        SET
          current_published_version_id = $2,
          updated_by = $3,
          updated_at = NOW()
        WHERE id = $1
      `,
      [id, versionId, actorUserId],
    )

    await writeAudit(
      execute,
      actorUserId,
      'marketing.campaign_published',
      { campaignId: id, versionId, versionNumber, definitionHash },
    )

    return {
      ok: true,
      duplicate: false,
      version: { id: versionId, versionNumber, definitionHash },
    }
  })
}
