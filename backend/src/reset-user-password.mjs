import { randomBytes, scrypt } from 'node:crypto'
import { promisify } from 'node:util'
import { closeDatabase, queryDatabase, withDatabaseTransaction } from './database.mjs'

const scryptAsync = promisify(scrypt)
const MAX_PASSWORD_LENGTH = 200

function normalizeIdentifier(value) {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  if (!normalized) return null

  if (normalized.includes('@')) {
    if (
      normalized.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
    ) {
      return null
    }

    return { field: 'email', value: normalized }
  }

  if (!/^[a-z0-9._-]{3,64}$/.test(normalized)) {
    return null
  }

  return { field: 'username', value: normalized }
}

function validatePassword(password) {
  return (
    typeof password === 'string' &&
    password.length >= 8 &&
    password.length <= MAX_PASSWORD_LENGTH &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password)
  )
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString('base64url')
  const derivedKey = await scryptAsync(password, salt, 64)
  return `scrypt$${salt}$${Buffer.from(derivedKey).toString('base64url')}`
}

function readHidden(prompt) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    throw new Error('An interactive TTY is required to enter the password securely')
  }

  return new Promise((resolve, reject) => {
    const stdin = process.stdin
    const previousRawMode = stdin.isRaw
    const previousEncoding = stdin.readableEncoding
    let value = ''

    const cleanup = () => {
      stdin.off('data', onData)
      stdin.setRawMode(Boolean(previousRawMode))
      stdin.pause()
      if (previousEncoding) stdin.setEncoding(previousEncoding)
    }

    const finish = () => {
      process.stdout.write('\n')
      cleanup()
      resolve(value)
    }

    const cancel = () => {
      process.stdout.write('\n')
      cleanup()
      reject(new Error('Password reset cancelled'))
    }

    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === '\u0003') {
          cancel()
          return
        }

        if (character === '\r' || character === '\n') {
          finish()
          return
        }

        if (character === '\u007f' || character === '\b') {
          value = value.slice(0, -1)
          continue
        }

        if (character >= ' ') {
          value += character
        }
      }
    }

    process.stdout.write(prompt)
    stdin.setEncoding('utf8')
    stdin.setRawMode(true)
    stdin.resume()
    stdin.on('data', onData)
  })
}

async function main() {
  const identifier = normalizeIdentifier(process.argv[2])

  if (!identifier) {
    console.error('Usage: node src/reset-user-password.mjs <username-or-email>')
    process.exitCode = 1
    return
  }

  const result = await queryDatabase(
    `
      SELECT id, username, email, role, status
      FROM users
      WHERE LOWER(${identifier.field}) = $1
      LIMIT 1
    `,
    [identifier.value],
  )

  const user = result.rows[0]
  if (!user) {
    console.error('User not found')
    process.exitCode = 1
    return
  }

  const password = await readHidden('New password: ')
  const confirmation = await readHidden('Confirm new password: ')

  if (password !== confirmation) {
    console.error('Passwords do not match')
    process.exitCode = 1
    return
  }

  if (!validatePassword(password)) {
    console.error('Password must be 8-200 characters and include an English letter and a number')
    process.exitCode = 1
    return
  }

  const passwordHash = await hashPassword(password)

  await withDatabaseTransaction(async (client) => {
    await client.query(
      `
        UPDATE users
        SET password_hash = $2,
            updated_at = NOW()
        WHERE id = $1
      `,
      [user.id, passwordHash],
    )

    await client.query(
      'DELETE FROM auth_sessions WHERE user_id = $1',
      [user.id],
    )
  })

  const displayIdentifier = user.username ?? user.email ?? identifier.value
  console.log(`Password updated for ${displayIdentifier} (${user.role}, ${user.status}). Existing sessions revoked.`)
}

try {
  await main()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await closeDatabase()
}
