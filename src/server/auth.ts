import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import type { AuthStatus } from '@/lib/types'
import {
  claimUnownedDailyLogsForUser,
  clearSessionForCurrentRequest,
  createSessionAndSetCookie,
  createUser,
  ensureAuthTables,
  getSessionUserForCurrentRequest,
  getUserByUsername,
  isSignupEnabled,
  normalizeUsername,
  verifyUserPassword,
} from '@/server/auth-core'

const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters.')
  .max(32, 'Username must be 32 characters or fewer.')
  .regex(
    /^[a-zA-Z0-9._-]+$/,
    'Username may only contain letters, numbers, dots, underscores, and hyphens.',
  )

const passwordDigestSchema = z
  .string()
  .regex(/^[a-f0-9]{64}$/, 'Invalid password digest.')

const authCredentialsSchema = z.object({
  username: usernameSchema,
  passwordDigest: passwordDigestSchema,
})

const buildAuthStatus = async (): Promise<AuthStatus> => {
  await ensureAuthTables()

  const sessionUser = await getSessionUserForCurrentRequest()

  return {
    isAuthenticated: sessionUser !== null,
    username: sessionUser?.username ?? null,
    canWrite: sessionUser !== null,
    canSignup: isSignupEnabled(),
  }
}

export const getAuthStatus = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    return await buildAuthStatus()
  } catch (error) {
    console.error('getAuthStatus failed:', error)
    throw new Error('Failed to load auth status')
  }
})

export const signup = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => authCredentialsSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      await ensureAuthTables()

      if (!isSignupEnabled()) {
        throw new Error('Signup is disabled by server configuration.')
      }

      const username = normalizeUsername(data.username)
      const existingUser = await getUserByUsername({
        username,
      })

      if (existingUser) {
        throw new Error('Username is already taken.')
      }

      const createdUser = await createUser({
        username,
        passwordDigest: data.passwordDigest,
      })

      await claimUnownedDailyLogsForUser({
        userId: createdUser.id,
      })

      await createSessionAndSetCookie({
        userId: createdUser.id,
      })

      return {
        username: createdUser.username,
      }
    } catch (error) {
      console.error('signup failed:', error)
      throw error instanceof Error ? error : new Error('Failed to sign up')
    }
  })

export const login = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => authCredentialsSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      await ensureAuthTables()

      const username = normalizeUsername(data.username)
      const storedUser = await getUserByUsername({
        username,
      })

      if (
        !storedUser ||
        !verifyUserPassword({
          passwordDigest: data.passwordDigest,
          passwordSalt: storedUser.passwordSalt,
          passwordHash: storedUser.passwordHash,
        })
      ) {
        throw new Error('Invalid username or password.')
      }

      await createSessionAndSetCookie({
        userId: storedUser.id,
      })

      return {
        username: storedUser.username,
      }
    } catch (error) {
      console.error('login failed:', error)
      throw error instanceof Error ? error : new Error('Failed to log in')
    }
  })

export const logout = createServerFn({ method: 'POST' }).handler(async () => {
  try {
    await ensureAuthTables()
    await clearSessionForCurrentRequest()

    return {
      success: true,
    }
  } catch (error) {
    console.error('logout failed:', error)
    throw new Error('Failed to log out')
  }
})
