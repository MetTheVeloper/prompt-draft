import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import { handleAuthRequest } from './auth.mjs'
import {
  getDatabaseStatus,
  getPromptDraftById,
  getWizardRunById,
  insertWizardRun,
  listWizardRuns,
  upsertPromptDraft,
} from './database.mjs'
import {
  getTranslationServiceStatus,
  translateText,
} from './translation.mjs'

const host = process.env.HOST ?? '0.0.0.0'
const port = Number(process.env.PORT ?? 4000)

const TRANSLATION_MAX_TEXT_LENGTH = 5000
const TRANSLATION_SOURCES = new Set(['auto', 'fa', 'en'])
const TRANSLATION_TARGETS = new Set(['fa', 'en'])

const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS ?? 'http://localhost:3030,http://127.0.0.1:3030')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
)

function getCorsHeaders(request) {
  const origin = request.headers.origin

  if (!origin || !allowedOrigins.has(origin)) {
    return {}
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  }
}

function sendJson(response, statusCode, body, headers = {}) {
  response.writeHead(statusCode, {
    ...headers,
    'Content-Type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify(body))
}

async function readJsonBody(request) {
  const chunks = []

  for await (const chunk of request) {
    chunks.push(chunk)
  }

  const rawBody = Buffer.concat(chunks).toString('utf8')
  return JSON.parse(rawBody)
}

function isJsonRequest(request) {
  const contentType = request.headers['content-type'] ?? ''
  const mediaType = contentType.split(';', 1)[0].trim().toLowerCase()
  return mediaType === 'application/json'
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isUuid(value) {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  )
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

function encodeWizardRunCursor(run) {
  return Buffer.from(
    JSON.stringify({
      createdAt: run.createdAt,
      id: run.id,
    }),
    'utf8',
  ).toString('base64url')
}

function decodeWizardRunCursor(value) {
  try {
    const decoded = Buffer.from(value, 'base64url').toString('utf8')
    const cursor = JSON.parse(decoded)

    if (
      !isPlainObject(cursor) ||
      typeof cursor.createdAt !== 'string' ||
      Number.isNaN(Date.parse(cursor.createdAt)) ||
      !isUuid(cursor.id)
    ) {
      return null
    }

    return {
      createdAt: new Date(cursor.createdAt).toISOString(),
      id: cursor.id,
    }
  } catch {
    return null
  }
}

function parseWizardRunListQuery(url) {
  const errors = []
  const rawLimit = url.searchParams.get('limit')
  let limit = 20

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
    cursor = rawCursor.length > 0 ? decodeWizardRunCursor(rawCursor) : null

    if (!cursor) {
      errors.push({
        field: 'cursor',
        message: 'cursor must be a valid Wizard run cursor',
      })
    }
  }

  const rawWizardId = url.searchParams.get('wizardId')
  let wizardId = null

  if (rawWizardId !== null) {
    wizardId = rawWizardId.trim()

    if (wizardId.length === 0) {
      errors.push({
        field: 'wizardId',
        message: 'wizardId must be a non-empty string',
      })
    }
  }

  return {
    errors,
    limit,
    cursor,
    wizardId,
  }
}

function validateTranslationInput(body) {
  const errors = []

  if (!isPlainObject(body)) {
    return [
      {
        field: 'body',
        message: 'JSON body must be an object',
      },
    ]
  }

  if (
    typeof body.text !== 'string' ||
    body.text.length > TRANSLATION_MAX_TEXT_LENGTH
  ) {
    errors.push({
      field: 'text',
      message: `text must be a string up to ${TRANSLATION_MAX_TEXT_LENGTH} characters`,
    })
  }

  if (body.source !== undefined && !TRANSLATION_SOURCES.has(body.source)) {
    errors.push({
      field: 'source',
      message: 'source must be auto, fa, or en',
    })
  }

  if (body.target !== undefined && !TRANSLATION_TARGETS.has(body.target)) {
    errors.push({
      field: 'target',
      message: 'target must be fa or en',
    })
  }

  if (
    body.alternatives !== undefined &&
    (!Number.isInteger(body.alternatives) ||
      body.alternatives < 0 ||
      body.alternatives > 5)
  ) {
    errors.push({
      field: 'alternatives',
      message: 'alternatives must be an integer between 0 and 5',
    })
  }

  return errors
}

function normalizeTranslationInput(body) {
  return {
    text: body.text.trim(),
    source: body.source ?? 'auto',
    target: body.target ?? 'en',
    alternatives: body.alternatives ?? 3,
  }
}

function validateWizardRunSnapshot(snapshot) {
  const errors = []

  if (!isPlainObject(snapshot)) {
    return [
      {
        field: 'snapshot',
        message: 'snapshot must be an object',
      },
    ]
  }

  if (snapshot.schemaVersion !== 1) {
    errors.push({
      field: 'snapshot.schemaVersion',
      message: 'snapshot.schemaVersion must be 1',
    })
  }

  if (!isPlainObject(snapshot.session)) {
    errors.push({
      field: 'snapshot.session',
      message: 'snapshot.session must be an object',
    })
  } else {
    if (
      typeof snapshot.session.currentStepId !== 'string' ||
      snapshot.session.currentStepId.trim().length === 0
    ) {
      errors.push({
        field: 'snapshot.session.currentStepId',
        message: 'snapshot.session.currentStepId must be a non-empty string',
      })
    }

    if (!isPlainObject(snapshot.session.answers)) {
      errors.push({
        field: 'snapshot.session.answers',
        message: 'snapshot.session.answers must be an object',
      })
    }

    if (!isPlainObject(snapshot.session.derived)) {
      errors.push({
        field: 'snapshot.session.derived',
        message: 'snapshot.session.derived must be an object',
      })
    }
  }

  if (!isPlainObject(snapshot.finalDraft)) {
    errors.push({
      field: 'snapshot.finalDraft',
      message: 'snapshot.finalDraft must be an object',
    })
  } else if (snapshot.finalDraft.version !== 1) {
    errors.push({
      field: 'snapshot.finalDraft.version',
      message: 'snapshot.finalDraft.version must be 1',
    })
  }

  return errors
}

function validateWizardRunInput(body) {
  const errors = []

  if (!isPlainObject(body)) {
    return [
      {
        field: 'body',
        message: 'JSON body must be an object',
      },
    ]
  }

  if (typeof body.wizardId !== 'string' || body.wizardId.trim().length === 0) {
    errors.push({
      field: 'wizardId',
      message: 'wizardId must be a non-empty string',
    })
  }

  if (!Number.isInteger(body.wizardVersion) || body.wizardVersion <= 0) {
    errors.push({
      field: 'wizardVersion',
      message: 'wizardVersion must be a positive integer',
    })
  }

  if (typeof body.output !== 'string' || body.output.trim().length === 0) {
    errors.push({
      field: 'output',
      message: 'output must be a non-empty string',
    })
  }

  errors.push(...validateWizardRunSnapshot(body.snapshot))

  return errors
}

function validatePromptDraftSnapshot(snapshot) {
  const errors = []

  if (!isPlainObject(snapshot)) {
    return [
      {
        field: 'snapshot',
        message: 'snapshot must be an object',
      },
    ]
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
    return [
      {
        field: 'body',
        message: 'JSON body must be an object',
      },
    ]
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

function normalizeWizardRunSnapshot(snapshot) {
  return {
    schemaVersion: 1,
    session: {
      currentStepId: snapshot.session.currentStepId.trim(),
      answers: snapshot.session.answers,
      derived: snapshot.session.derived,
    },
    finalDraft: snapshot.finalDraft,
  }
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

function createWizardRun(body) {
  return {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    wizardId: body.wizardId.trim(),
    wizardVersion: body.wizardVersion,
    output: body.output,
    snapshot: normalizeWizardRunSnapshot(body.snapshot),
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

const server = createServer(async (request, response) => {
  const url = new URL(
    request.url ?? '/',
    `http://${request.headers.host ?? 'localhost'}`,
  )

  const corsHeaders = getCorsHeaders(request)

  if (request.method === 'OPTIONS') {
    response.writeHead(204, corsHeaders)
    response.end()
    return
  }

  if (request.method === 'GET' && url.pathname === '/api/hello') {
    sendJson(
      response,
      200,
      {
        ok: true,
        message: 'Hello from Prompt Draft API',
      },
      corsHeaders,
    )
    return
  }

  if (request.method === 'GET' && url.pathname === '/api/db-check') {
    try {
      const databaseStatus = await getDatabaseStatus()

      sendJson(
        response,
        200,
        {
          ok: true,
          database: databaseStatus.database,
          user: databaseStatus.user,
          serverTime: databaseStatus.serverTime,
        },
        corsHeaders,
      )
    } catch (error) {
      console.error('[Prompt Draft API] database check failed', error)

      sendJson(
        response,
        503,
        {
          ok: false,
          message: 'Database unavailable',
        },
        corsHeaders,
      )
    }

    return
  }

  if (request.method === 'GET' && url.pathname === '/api/translate/status') {
    const status = await getTranslationServiceStatus()

    sendJson(
      response,
      200,
      {
        ok: true,
        available: status.available,
        languages: status.languages,
      },
      corsHeaders,
    )
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/translate') {
    if (!isJsonRequest(request)) {
      sendJson(
        response,
        415,
        {
          ok: false,
          message: 'Content-Type must be application/json',
        },
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
        {
          ok: false,
          message: 'Request body must contain valid JSON',
        },
        corsHeaders,
      )
      return
    }

    const validationErrors = validateTranslationInput(body)

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

    const input = normalizeTranslationInput(body)

    if (!input.text) {
      sendJson(
        response,
        200,
        {
          ok: true,
          translatedText: '',
          alternatives: [],
          detectedLanguage: null,
        },
        corsHeaders,
      )
      return
    }

    try {
      const result = await translateText(input)

      sendJson(
        response,
        200,
        {
          ok: true,
          ...result,
        },
        corsHeaders,
      )
    } catch (error) {
      console.error('[Prompt Draft API] translation failed', error)

      sendJson(
        response,
        503,
        {
          ok: false,
          message: 'Translation service is not available',
        },
        corsHeaders,
      )
    }

    return
  }

  if (
    await handleAuthRequest({
      request,
      response,
      url,
      corsHeaders,
      sendJson,
    })
  ) {
    return
  }

  const promptDraftDetailMatch = url.pathname.match(/^\/api\/drafts\/([^/]+)$/)

  if (promptDraftDetailMatch && ['GET', 'PUT'].includes(request.method ?? '')) {
    const draftId = parsePromptDraftId(promptDraftDetailMatch[1])

    if (!draftId) {
      sendJson(
        response,
        400,
        {
          ok: false,
          message: 'Invalid draft id',
        },
        corsHeaders,
      )
      return
    }

    if (request.method === 'GET') {
      try {
        const draft = await getPromptDraftById(draftId)

        if (!draft) {
          sendJson(
            response,
            404,
            {
              ok: false,
              message: 'Draft not found',
            },
            corsHeaders,
          )
          return
        }

        sendJson(
          response,
          200,
          {
            ok: true,
            draft,
          },
          corsHeaders,
        )
      } catch (error) {
        console.error('[Prompt Draft API] draft detail failed', error)

        sendJson(
          response,
          500,
          {
            ok: false,
            message: 'Failed to read draft',
          },
          corsHeaders,
        )
      }

      return
    }

    if (!isJsonRequest(request)) {
      sendJson(
        response,
        415,
        {
          ok: false,
          message: 'Content-Type must be application/json',
        },
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
        {
          ok: false,
          message: 'Request body must contain valid JSON',
        },
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
      const savedDraft = await upsertPromptDraft(createPromptDraft(draftId, body))

      sendJson(
        response,
        200,
        {
          ok: true,
          draft: savedDraft,
        },
        corsHeaders,
      )
    } catch (error) {
      console.error('[Prompt Draft API] draft upsert failed', error)

      sendJson(
        response,
        500,
        {
          ok: false,
          message: 'Failed to save draft',
        },
        corsHeaders,
      )
    }

    return
  }

  const wizardRunDetailMatch = url.pathname.match(/^\/api\/wizard-runs\/([^/]+)$/)

  if (request.method === 'GET' && wizardRunDetailMatch) {
    const runId = wizardRunDetailMatch[1]

    if (!isUuid(runId)) {
      sendJson(
        response,
        400,
        {
          ok: false,
          message: 'Invalid Wizard run id',
        },
        corsHeaders,
      )
      return
    }

    try {
      const run = await getWizardRunById(runId)

      if (!run) {
        sendJson(
          response,
          404,
          {
            ok: false,
            message: 'Wizard run not found',
          },
          corsHeaders,
        )
        return
      }

      sendJson(
        response,
        200,
        {
          ok: true,
          run,
        },
        corsHeaders,
      )
    } catch (error) {
      console.error('[Prompt Draft API] wizard run detail failed', error)

      sendJson(
        response,
        500,
        {
          ok: false,
          message: 'Failed to read Wizard run',
        },
        corsHeaders,
      )
    }

    return
  }

  if (request.method === 'GET' && url.pathname === '/api/wizard-runs') {
    const { errors, limit, cursor, wizardId } = parseWizardRunListQuery(url)

    if (errors.length > 0) {
      sendJson(
        response,
        400,
        {
          ok: false,
          message: 'Invalid Wizard run list query',
          errors,
        },
        corsHeaders,
      )
      return
    }

    try {
      const page = await listWizardRuns({ limit, cursor, wizardId })
      const lastRun = page.runs.at(-1) ?? null
      const nextCursor = page.hasMore && lastRun
        ? encodeWizardRunCursor(lastRun)
        : null

      sendJson(
        response,
        200,
        {
          ok: true,
          runs: page.runs,
          pageInfo: {
            nextCursor,
            hasMore: page.hasMore,
          },
        },
        corsHeaders,
      )
    } catch (error) {
      console.error('[Prompt Draft API] wizard run list failed', error)

      sendJson(
        response,
        500,
        {
          ok: false,
          message: 'Failed to list Wizard runs',
        },
        corsHeaders,
      )
    }

    return
  }

  if (request.method === 'POST' && url.pathname === '/api/wizard-runs') {
    if (!isJsonRequest(request)) {
      sendJson(
        response,
        415,
        {
          ok: false,
          message: 'Content-Type must be application/json',
        },
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
        {
          ok: false,
          message: 'Request body must contain valid JSON',
        },
        corsHeaders,
      )
      return
    }

    const validationErrors = validateWizardRunInput(body)

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

    const run = createWizardRun(body)

    try {
      const savedRun = await insertWizardRun(run)

      sendJson(
        response,
        201,
        {
          ok: true,
          run: savedRun,
        },
        corsHeaders,
      )
    } catch (error) {
      console.error('[Prompt Draft API] wizard run insert failed', error)

      sendJson(
        response,
        500,
        {
          ok: false,
          message: 'Failed to create Wizard run',
        },
        corsHeaders,
      )
    }

    return
  }

  sendJson(
    response,
    404,
    {
      ok: false,
      message: 'Not Found',
    },
    corsHeaders,
  )
})

server.listen(port, host, () => {
  console.log(`Prompt Draft API listening on http://${host}:${port}`)
})
