import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

const VERIFIER_KEY = 'exact_answer_v1'
const CHALLENGE_ID_PATTERN = /^[A-Za-z0-9._-]{1,100}$/
const MAX_CHALLENGES = 100
const MAX_ACCEPTED_ANSWERS = 20
const MAX_ANSWER_LENGTH = 240

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function issue(path, code, message) {
  return { path, code, message }
}

function normalizeAnswer(value, options) {
  let normalized = String(value ?? '').normalize('NFKC')
  if (options.trim !== false) normalized = normalized.trim()
  if (options.caseSensitive !== true) normalized = normalized.toLocaleLowerCase('en-US')
  return normalized
}

function hashAnswer(salt, answer) {
  return createHash('sha256').update(`${salt}\0${answer}`).digest()
}

function safeHashEqual(leftHex, rightBuffer) {
  if (typeof leftHex !== 'string' || !/^[0-9a-f]{64}$/i.test(leftHex)) return false
  const left = Buffer.from(leftHex, 'hex')
  return left.length === rightBuffer.length && timingSafeEqual(left, rightBuffer)
}

function verifierConfig(mechanic) {
  return mechanic?.config?.private?.verifier
}

export function validateCustomGameDefinition(mechanic, basePath = 'mechanic') {
  const errors = []
  if (mechanic?.type !== 'custom_game') return errors

  if (!mechanic.attemptPolicy) {
    errors.push(issue(
      `${basePath}.attemptPolicy`,
      'CAMPAIGN_CUSTOM_GAME_ATTEMPT_POLICY_REQUIRED',
      'custom_game requires an attemptPolicy',
    ))
  }

  const verifier = verifierConfig(mechanic)
  if (!isObject(verifier) || verifier.key !== VERIFIER_KEY) {
    errors.push(issue(
      `${basePath}.config.private.verifier`,
      'CAMPAIGN_CUSTOM_GAME_VERIFIER_INVALID',
      `custom_game verifier must use ${VERIFIER_KEY}`,
    ))
    return errors
  }

  if (verifier.caseSensitive !== undefined && typeof verifier.caseSensitive !== 'boolean') {
    errors.push(issue(
      `${basePath}.config.private.verifier.caseSensitive`,
      'CAMPAIGN_CUSTOM_GAME_VERIFIER_INVALID',
      'caseSensitive must be boolean when provided',
    ))
  }
  if (verifier.trim !== undefined && typeof verifier.trim !== 'boolean') {
    errors.push(issue(
      `${basePath}.config.private.verifier.trim`,
      'CAMPAIGN_CUSTOM_GAME_VERIFIER_INVALID',
      'trim must be boolean when provided',
    ))
  }

  if (!Array.isArray(verifier.challenges) || verifier.challenges.length < 1 || verifier.challenges.length > MAX_CHALLENGES) {
    errors.push(issue(
      `${basePath}.config.private.verifier.challenges`,
      'CAMPAIGN_CUSTOM_GAME_CHALLENGES_INVALID',
      `custom_game requires 1-${MAX_CHALLENGES} verifier challenges`,
    ))
    return errors
  }

  const ids = new Set()
  verifier.challenges.forEach((challenge, index) => {
    const path = `${basePath}.config.private.verifier.challenges[${index}]`
    if (!isObject(challenge)) {
      errors.push(issue(path, 'CAMPAIGN_CUSTOM_GAME_CHALLENGE_INVALID', 'challenge must be an object'))
      return
    }

    if (!CHALLENGE_ID_PATTERN.test(challenge.id ?? '') || ids.has(challenge.id)) {
      errors.push(issue(`${path}.id`, 'CAMPAIGN_CUSTOM_GAME_CHALLENGE_ID_INVALID', 'challenge id must be unique and path-safe'))
    } else {
      ids.add(challenge.id)
    }

    if (!isObject(challenge.prompt)) {
      errors.push(issue(`${path}.prompt`, 'CAMPAIGN_CUSTOM_GAME_PROMPT_INVALID', 'challenge prompt must be a localized object'))
    } else {
      const promptEntries = Object.entries(challenge.prompt)
      if (
        promptEntries.length === 0 ||
        promptEntries.some(([locale, value]) => !['en', 'fa'].includes(locale) || typeof value !== 'string' || !value.trim() || value.length > 500)
      ) {
        errors.push(issue(`${path}.prompt`, 'CAMPAIGN_CUSTOM_GAME_PROMPT_INVALID', 'challenge prompt supports non-empty en/fa strings up to 500 characters'))
      }
    }

    if (
      !Array.isArray(challenge.acceptedAnswers) ||
      challenge.acceptedAnswers.length < 1 ||
      challenge.acceptedAnswers.length > MAX_ACCEPTED_ANSWERS ||
      challenge.acceptedAnswers.some(answer => typeof answer !== 'string' || !answer.trim() || answer.length > MAX_ANSWER_LENGTH)
    ) {
      errors.push(issue(
        `${path}.acceptedAnswers`,
        'CAMPAIGN_CUSTOM_GAME_ANSWERS_INVALID',
        `acceptedAnswers must contain 1-${MAX_ACCEPTED_ANSWERS} non-empty strings up to ${MAX_ANSWER_LENGTH} characters`,
      ))
    }
  })

  return errors
}

export function prepareCustomGameAttemptContext({ mechanic, attemptId }) {
  const validation = validateCustomGameDefinition(mechanic)
  if (validation.length > 0) {
    return { ok: false, code: 'CAMPAIGN_CUSTOM_GAME_CONFIG_INVALID' }
  }

  const verifier = verifierConfig(mechanic)
  const digest = createHash('sha256').update(attemptId).digest()
  const challenge = verifier.challenges[digest.readUInt32BE(0) % verifier.challenges.length]
  const normalize = {
    caseSensitive: verifier.caseSensitive === true,
    trim: verifier.trim !== false,
  }
  const salt = randomBytes(16).toString('hex')
  const acceptedAnswerHashes = challenge.acceptedAnswers.map((answer) => {
    const normalized = normalizeAnswer(answer, normalize)
    return hashAnswer(salt, normalized).toString('hex')
  })

  return {
    ok: true,
    privateContext: {
      kind: 'custom_game',
      verifier: {
        key: VERIFIER_KEY,
        salt,
        acceptedAnswerHashes,
        normalize,
      },
      publicContext: {
        kind: VERIFIER_KEY,
        challenge: {
          id: challenge.id,
          prompt: { ...challenge.prompt },
        },
      },
    },
  }
}

export function validateCustomGameSubmission({ attempt, payload, evidence }) {
  if (!isObject(payload) || Object.keys(payload).length !== 1 || typeof payload.answer !== 'string') {
    return { ok: false, code: 'CAMPAIGN_ACTION_SCHEMA_INVALID' }
  }
  if (payload.answer.length > MAX_ANSWER_LENGTH) {
    return { ok: false, code: 'CAMPAIGN_ACTION_SCHEMA_INVALID' }
  }
  if (
    !isObject(evidence) || Object.keys(evidence).length !== 1 ||
    typeof evidence.attemptId !== 'string' || evidence.attemptId !== attempt.id
  ) {
    return { ok: false, code: 'CAMPAIGN_ACTION_SCHEMA_INVALID' }
  }

  const verifier = attempt.privateContext?.verifier
  if (
    attempt.privateContext?.kind !== 'custom_game' ||
    !isObject(verifier) || verifier.key !== VERIFIER_KEY ||
    typeof verifier.salt !== 'string' ||
    !Array.isArray(verifier.acceptedAnswerHashes) || verifier.acceptedAnswerHashes.length === 0 ||
    !isObject(verifier.normalize)
  ) {
    return { ok: false, code: 'CAMPAIGN_CUSTOM_GAME_CONFIG_INVALID' }
  }

  const normalized = normalizeAnswer(payload.answer, verifier.normalize)
  const candidate = hashAnswer(verifier.salt, normalized)
  const won = verifier.acceptedAnswerHashes.some(hash => safeHashEqual(hash, candidate))
  return { ok: true, outcome: won ? 'win' : 'lose' }
}
