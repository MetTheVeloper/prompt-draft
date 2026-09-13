import { randomUUID } from 'node:crypto'
import { withDatabaseTransaction } from './database.mjs'
import {
  canonicalizeCampaignDefinition,
  hashCampaignDefinition,
  validateCampaignDefinition,
} from './campaignDefinition.mjs'

export {
  createCampaignHead,
  getCampaignHead,
  replaceCampaignDraft,
} from './campaignsFoundation.mjs'

async function writeAudit(execute, actorUserId, action, metadata) {
  await execute(
    `
      INSERT INTO admin_audit_log (id, actor_user_id, action, metadata)
      VALUES ($1, $2, $3, $4::jsonb)
    `,
    [randomUUID(), actorUserId, action, JSON.stringify(metadata ?? {})],
  )
}

export async function seedCampaignRewardBudgets(execute, versionId, definition) {
  for (const reward of definition.rewards ?? []) {
    if (!reward?.budget) continue
    await execute(
      `
        INSERT INTO campaign_reward_budgets (
          campaign_version_id,
          reward_definition_id,
          max_amount
        )
        VALUES ($1, $2, $3)
        ON CONFLICT (campaign_version_id, reward_definition_id) DO NOTHING
      `,
      [versionId, reward.id, reward.budget.maxAmount],
    )
  }
}

export async function publishCampaign({
  id,
  expectedDraftRevision,
  idempotencyKey,
  actorUserId,
}, { transactionRunner = withDatabaseTransaction } = {}) {
  if (
    typeof idempotencyKey !== 'string' ||
    !idempotencyKey.trim() ||
    idempotencyKey.length > 240
  ) {
    return { ok: false, code: 'CAMPAIGN_PUBLISH_IDEMPOTENCY_KEY_INVALID' }
  }

  return transactionRunner(async client => {
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
          definition_hash AS "definitionHash",
          definition
        FROM campaign_versions
        WHERE campaign_id = $1
          AND publish_idempotency_key = $2
        LIMIT 1
      `,
      [id, idempotencyKey.trim()],
    )
    if (existing.rows[0]) {
      await seedCampaignRewardBudgets(execute, existing.rows[0].id, existing.rows[0].definition)
      return {
        ok: true,
        duplicate: true,
        version: {
          id: existing.rows[0].id,
          versionNumber: Number(existing.rows[0].versionNumber),
          definitionHash: existing.rows[0].definitionHash,
        },
      }
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

    await seedCampaignRewardBudgets(execute, versionId, canonical)

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
