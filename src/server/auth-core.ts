import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

import { and, eq, gt, isNull, lte, sql } from 'drizzle-orm'
import { deleteCookie, getCookie, setCookie } from '@tanstack/react-start/server'

import { db } from '@/lib/db'
import { authSessions, authUsers, dailyLogs } from '@/lib/db/schema'

const AUTH_SESSION_COOKIE_NAME = 'gym_auth_session'
const AUTH_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30
const PASSWORD_SALT_BYTES = 16
const PASSWORD_HASH_BYTES = 64

type SessionUser = {
  id: number
  username: string
}

const nowIsoString = () => new Date().toISOString()

const hashSessionToken = (token: string) =>
  createHash('sha256').update(token).digest('hex')

const getCookieFromHeader = ({
  cookieHeader,
  cookieName,
}: {
  cookieHeader: string | null
  cookieName: string
}) => {
  if (!cookieHeader) {
    return null
  }

  const parts = cookieHeader.split(';')

  for (const part of parts) {
    const [rawName, ...rawValueParts] = part.trim().split('=')
    if (rawName !== cookieName) {
      continue
    }

    const rawValue = rawValueParts.join('=')
    if (!rawValue) {
      return null
    }

    try {
      return decodeURIComponent(rawValue)
    } catch {
      return rawValue
    }
  }

  return null
}

const secureHashEqual = (leftHex: string, rightHex: string) => {
  const leftBuffer = Buffer.from(leftHex, 'hex')
  const rightBuffer = Buffer.from(rightHex, 'hex')

  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }

  return timingSafeEqual(leftBuffer, rightBuffer)
}

const cleanupExpiredSessions = async () => {
  await db.delete(authSessions).where(lte(authSessions.expiresAt, nowIsoString()))
}

export const ensureAuthTables = async () => {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS auth_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
    )
  `)

  await db.run(sql`
    CREATE INDEX IF NOT EXISTS auth_sessions_user_idx
    ON auth_sessions(user_id)
  `)

  await db.run(sql`
    CREATE INDEX IF NOT EXISTS auth_sessions_expires_at_idx
    ON auth_sessions(expires_at)
  `)
}

export const normalizeUsername = (username: string) => username.trim().toLowerCase()

export const isSignupEnabled = () => {
  const flag = process.env.AUTH_ALLOW_SIGNUP?.trim().toLowerCase()
  return flag !== 'false'
}

export const getUserByUsername = async ({
  username,
}: {
  username: string
}) => {
  const rows = await db
    .select({
      id: authUsers.id,
      username: authUsers.username,
      passwordHash: authUsers.passwordHash,
      passwordSalt: authUsers.passwordSalt,
    })
    .from(authUsers)
    .where(eq(authUsers.username, username))
    .limit(1)

  return rows.at(0) ?? null
}

export const hashPasswordDigest = ({
  passwordDigest,
  saltHex,
}: {
  passwordDigest: string
  saltHex: string
}) =>
  scryptSync(
    passwordDigest,
    Buffer.from(saltHex, 'hex'),
    PASSWORD_HASH_BYTES,
  ).toString('hex')

export const createUser = async ({
  username,
  passwordDigest,
}: {
  username: string
  passwordDigest: string
}) => {
  const passwordSalt = randomBytes(PASSWORD_SALT_BYTES).toString('hex')
  const passwordHash = hashPasswordDigest({
    passwordDigest,
    saltHex: passwordSalt,
  })
  const updatedAt = nowIsoString()

  await db.insert(authUsers).values({
    username,
    passwordHash,
    passwordSalt,
    updatedAt,
  })

  const createdUser = await getUserByUsername({
    username,
  })

  if (!createdUser) {
    throw new Error('Unable to create user')
  }

  return {
    id: createdUser.id,
    username: createdUser.username,
  }
}

export const verifyUserPassword = ({
  passwordDigest,
  passwordSalt,
  passwordHash,
}: {
  passwordDigest: string
  passwordSalt: string
  passwordHash: string
}) => {
  const computedHash = hashPasswordDigest({
    passwordDigest,
    saltHex: passwordSalt,
  })
  return secureHashEqual(computedHash, passwordHash)
}

const createSession = async ({ userId }: { userId: number }) => {
  const sessionToken = randomBytes(32).toString('hex')
  const tokenHash = hashSessionToken(sessionToken)
  const updatedAt = nowIsoString()
  const expiresAt = new Date(
    Date.now() + AUTH_SESSION_MAX_AGE_SECONDS * 1000,
  ).toISOString()

  await cleanupExpiredSessions()

  await db.insert(authSessions).values({
    userId,
    tokenHash,
    expiresAt,
    updatedAt,
  })

  return sessionToken
}

export const createSessionAndSetCookie = async ({ userId }: { userId: number }) => {
  const sessionToken = await createSession({
    userId,
  })

  setCookie(AUTH_SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
  })
}

const getSessionUserByTokenHash = async ({
  tokenHash,
}: {
  tokenHash: string
}): Promise<SessionUser | null> => {
  await cleanupExpiredSessions()

  const rows = await db
    .select({
      sessionId: authSessions.id,
      userId: authUsers.id,
      username: authUsers.username,
      expiresAt: authSessions.expiresAt,
    })
    .from(authSessions)
    .innerJoin(authUsers, eq(authUsers.id, authSessions.userId))
    .where(and(eq(authSessions.tokenHash, tokenHash), gt(authSessions.expiresAt, nowIsoString())))
    .limit(1)

  const session = rows.at(0) ?? null
  if (!session) {
    return null
  }

  return {
    id: session.userId,
    username: session.username,
  }
}

export const getSessionUserFromToken = async ({
  token,
}: {
  token: string | null
}): Promise<SessionUser | null> => {
  if (!token) {
    return null
  }

  return getSessionUserByTokenHash({
    tokenHash: hashSessionToken(token),
  })
}

export const getSessionUserForCurrentRequest = async () => {
  const token = getCookie(AUTH_SESSION_COOKIE_NAME) ?? null

  return getSessionUserFromToken({
    token,
  })
}

export const requireAuthenticatedUserForCurrentRequest = async () => {
  await ensureAuthTables()
  const sessionUser = await getSessionUserForCurrentRequest()

  if (!sessionUser) {
    throw new Error('Unauthorized: please log in.')
  }

  return sessionUser
}

export const getSessionUserFromRequest = async ({
  request,
}: {
  request: Request
}) => {
  const token = getCookieFromHeader({
    cookieHeader: request.headers.get('cookie'),
    cookieName: AUTH_SESSION_COOKIE_NAME,
  })

  return getSessionUserFromToken({
    token,
  })
}

export const clearSessionForCurrentRequest = async () => {
  const token = getCookie(AUTH_SESSION_COOKIE_NAME) ?? null

  if (token) {
    await db
      .delete(authSessions)
      .where(eq(authSessions.tokenHash, hashSessionToken(token)))
  }

  deleteCookie(AUTH_SESSION_COOKIE_NAME, {
    path: '/',
  })
}

export const claimUnownedDailyLogsForUser = async ({ userId }: { userId: number }) => {
  const updatedAt = nowIsoString()

  await db
    .update(dailyLogs)
    .set({
      userId,
      updatedAt,
    })
    .where(isNull(dailyLogs.userId))
}
