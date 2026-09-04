import {
  getPromptDraftById,
  listPromptDrafts,
  upsertPromptDraft,
} from './database.mjs'
import {
  awardCloudDraftCreatedScore,
  getUserScoreState,
} from './userScore.mjs'

function isJsonRequest(request) {
  const contentType = request.headers['content-type'] ?? ''
  return contentType.split(';', 1)[0].trim().toLowerCase() === 'application/json'
}

async function readJsonBody(request) {
  const chunks = []

  for await (const chunk of request) {
    chunks.push(chunk)
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function parsePromptDraftId(value) {
  try {
    const decoded = decodeURIComponent(value).trim()

    if (
      decoded.length === 0 ||
      decoded.length > 200 ||
      /[\u0000-\u001f\u007f]/.test(decoded)
    ) {
      return null
    }

    return decoded
  } catch {
    return null
  }
}

function normalizeIsoTimestamp(value) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    return null
  }

  return new Date(value).toISOString()
}

function validatePromptDraftSnapshot(snapshot) {
  const errors = []

  if (!isPlainObject(snapshot)) {
    return [{ field: 'snapshot', message: 'snapshot must be an object' }]
  }

  if (snapshot.version !== 1) {
    errors.push({
      field: 'snapshot.version',
      message: 'snapshot.version must be 1',
    })
  }

  if (
    !Array.isArray(snapshot.selectedModuleKeys) ||
    snapshot.selectedModuleKeys.some((value) => typeof value !== 'string')
  ) {
    errors.push({
      field: 'snapshot.selectedModuleKeys',
      message: 'snapshot.selectedModuleKeys must be an array of strings',
    })
  }

  if (!isPlainObject(snapshot.moduleValues)) {
    errors.push({
      field: 'snapshot.moduleValues',
      message: 'snapshot.moduleValues must be an object',
    })
  }

  if (!isPlainObject(snapshot.modulePanelStates)) {
    errors.push({
      field: 'snapshot.modulePanelStates',
      message: 'snapshot.modulePanelStates must be an object',
    })
  }

  if (!isPlainObject(snapshot.promptSettings)) {
    errors.push({
      field: 'snapshot.promptSettings',
      message: 'snapshot.promptSettings must be an object',
    })
  }

  if (!['modular', 'natural', 'json'].includes(snapshot.outputFormat)) {
    errors.push({
      field: 'snapshot.outputFormat',
      message: 'snapshot.outputFormat must be modular, natural, or json',
    })
  }

  return errors
}

function validatePromptDraftInput(body) {
  const errors = []

  if (!isPlainObject(body)) {
    return [{ field: 'body', message: 'JSON body must be an object' }]
  }

  if (
    typeof body.title !== 'string' ||
    body.title.trim().length === 0 ||
    body.title.trim().length > 500
  ) {
    errors.push({
      field: 'title',
      message: 'title must be a non-empty string up to 500 characters',
    })
  }

  if (!normalizeIsoTimestamp(body.createdAt)) {
    errors.push({
      field: 'createdAt',
      message: 'createdAt must be a valid timestamp',
    })
  }

  if (!normalizeIsoTimestamp(body.updatedAt)) {
    errors.push({
      field: 'updatedAt',
      message: 'updatedAt must be a valid timestamp',
    })
  }

  errors.push(...validatePromptDraftSnapshot(body.snapshot))
  return errors
}

function normalizePromptDraftSnapshot(snapshot) {
  return {
    version: 1,
    selectedModuleKeys: snapshot.selectedModuleKeys,
    moduleValues: snapshot.moduleValues,
    modulePanelStates: snapshot.modulePanelStates,
    promptSettings: snapshot.promptSettings,
    outputFormat: snapshot.outputFormat,
  }
}

function createPromptDraft(id, body) {
  return {
    id,
    title: body.title.trim(),
    createdAt: normalizeIsoTimestamp(body.createdAt),
    updatedAt: normalizeIsoTimestamp(body.updatedAt),
    snapshot: normalizePromptDraftSnapshot(body.snapshot),
  }
}

function encodePromptDraftCursor(draft) {
  return Buffer.from(
    JSON.stringify({
      updatedAt: draft.updatedAt,
      id: draft.id,
    }),
    'utf8',
  ).toString('base64url')
}

function decodePromptDraftCursor(value) {
  try {
    const decoded = Buffer.from(value, 'base64url').toString('utf8')
    const cursor = JSON.parse(decoded)

    if (
      !isPlainObject(cursor) ||
      typeof cursor.updatedAt !== 'string' ||
      Number.isNaN(Date.parse(cursor.updatedAt)) ||
      typeof cursor.id !== 'string' ||
      cursor.id.length === 0 ||
      cursor.id.length > 200
    ) {
      return null
    }

    return {
      updatedAt: new Date(cursor.updatedAt).toISOString(),
      id: cursor.id,
    }
  } catch {
    return null
  }
}

function parsePromptDraftListQuery(url) {
  const errors = []
  const rawLimit = url.searchParams.get('limit')
  let limit = 50

  if (rawLimit !== null) {
    if (!/^\d+$/.test(rawLimit)) {
      errors.push({
        field: 'limit',
        message: 'limit must be an integer between 1 and 100',
      })
    } else {
      limit = Number(rawLimit)

      if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
        errors.push({
          field: 'limit',
          message: 'limit must be an integer between 1 and 100',
        })
      }
    }
  }

  const rawCursor = url.searchParams.get('cursor')
  let cursor = null

  if (rawCursor !== null) {
    cursor = rawCursor.length > 0 ? decodePromptDraftCursor(rawCursor) : null

    if (!cursor) {
      errors.push({
        field: 'cursor',
        message: 'cursor must be a valid draft cursor',
      })
    }
  }

  return { errors, limit, cursor }
}

export async function handleCloudDraftRequest({
  request,
  response,
  url,
  corsHeaders,
  sendJson,
  user,
}) {
  if (request.method === 'GET' && url.pathname === '/api/drafts') {
    const { errors, limit, cursor } = parsePromptDraftListQuery(url)

    if (errors.length > 0) {
      sendJson(
        response,
        400,
        {
          ok: false,
          message: 'Invalid draft list query',
          errors,
        },
        corsHeaders,
      )
      return
    }

    try {
      const page = await listPromptDrafts({
        userId: user.id,
        limit,
        cursor,
      })
      const lastDraft = page.drafts.at(-1) ?? null
      const nextCursor = page.hasMore && lastDraft
        ? encodePromptDraftCursor(lastDraft)
        : null

      sendJson(
        response,
        200,
        {
          ok: true,
          drafts: page.drafts,
          pageInfo: {
            nextCursor,
            hasMore: page.hasMore,
          },
        },
        corsHeaders,
      )
    } catch (error) {
      console.error('[Prompt Draft API] account draft list failed', error)
      sendJson(
        response,
        500,
        { ok: false, message: 'Failed to list drafts' },
        corsHeaders,
      )
    }

    return
  }

  const detailMatch = url.pathname.match(/^\/api\/drafts\/([^/]+)$/)

  if (detailMatch && ['GET', 'PUT'].includes(request.method ?? '')) {
    const draftId = parsePromptDraftId(detailMatch[1])

    if (!draftId) {
      sendJson(
        response,
        400,
        { ok: false, message: 'Invalid draft id' },
        corsHeaders,
      )
      return
    }

    if (request.method === 'GET') {
      try {
        const draft = await getPromptDraftById(user.id, draftId)

        if (!draft) {
          sendJson(
            response,
            404,
            { ok: false, message: 'Draft not found' },
            corsHeaders,
          )
          return
        }

        sendJson(response, 200, { ok: true, draft }, corsHeaders)
      } catch (error) {
        console.error('[Prompt Draft API] account draft detail failed', error)
        sendJson(
          response,
          500,
          { ok: false, message: 'Failed to read draft' },
          corsHeaders,
        )
      }

      return
    }

    if (!isJsonRequest(request)) {
      sendJson(
        response,
        415,
        { ok: false, message: 'Content-Type must be application/json' },
        corsHeaders,
      )
      return
    }

    let body

    try {
      body = await readJsonBody(request)
    } catch {
      sendJson(
        response,
        400,
        { ok: false, message: 'Request body must contain valid JSON' },
        corsHeaders,
      )
      return
    }

    const validationErrors = validatePromptDraftInput(body)

    if (validationErrors.length > 0) {
      sendJson(
        response,
        400,
        {
          ok: false,
          message: 'Validation failed',
          errors: validationErrors,
        },
        corsHeaders,
      )
      return
    }

    try {
      const savedDraft = await upsertPromptDraft(
        user.id,
        createPromptDraft(draftId, body),
      )

      let score = null

      try {
        await awardCloudDraftCreatedScore(user.id, draftId)
        score = await getUserScoreState(user.id)
      } catch (scoreError) {
        // Gamification must not make the primary Draft save fail. A later save or
        // auth refresh will retry the idempotent award and heal the read model.
        console.error('[Prompt Draft API] draft creation score award failed', scoreError)
      }

      sendJson(
        response,
        200,
        {
          ok: true,
          draft: savedDraft,
          ...(score ? { score } : {}),
        },
        corsHeaders,
      )
    } catch (error) {
      console.error('[Prompt Draft API] account draft upsert failed', error)
      sendJson(
        response,
        500,
        { ok: false, message: 'Failed to save draft' },
        corsHeaders,
      )
    }

    return
  }

  sendJson(response, 404, { ok: false, message: 'Not Found' }, corsHeaders)
}
