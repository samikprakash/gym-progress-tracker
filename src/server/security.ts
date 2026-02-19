import { createMiddleware } from '@tanstack/react-start'

import {
  ensureAuthTables,
  getSessionUserFromRequest,
} from '@/server/auth-core'

const DEFAULT_WRITE_RATE_LIMIT_MAX_REQUESTS = 120
const DEFAULT_WRITE_RATE_LIMIT_WINDOW_MS = 60_000

type RateLimitBucket = {
  count: number
  resetAt: number
}

const writeRateLimitBuckets = new Map<string, RateLimitBucket>()

const parsePositiveInteger = ({
  value,
  fallback,
}: {
  value: string | undefined
  fallback: number
}) => {
  if (!value) {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

const getWriteRateLimitConfig = () => ({
  maxRequests: parsePositiveInteger({
    value: process.env.WRITE_RATE_LIMIT_MAX_REQUESTS,
    fallback: DEFAULT_WRITE_RATE_LIMIT_MAX_REQUESTS,
  }),
  windowMs: parsePositiveInteger({
    value: process.env.WRITE_RATE_LIMIT_WINDOW_MS,
    fallback: DEFAULT_WRITE_RATE_LIMIT_WINDOW_MS,
  }),
})

const cleanupExpiredBuckets = (now: number) => {
  for (const [key, bucket] of writeRateLimitBuckets.entries()) {
    if (bucket.resetAt <= now) {
      writeRateLimitBuckets.delete(key)
    }
  }
}

const getClientIp = (request: Request) => {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const [firstIp] = forwardedFor.split(',')
    if (firstIp.trim()) {
      return firstIp.trim()
    }
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp?.trim()) {
    return cfConnectingIp.trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp?.trim()) {
    return realIp.trim()
  }

  return 'unknown'
}

const enforceWriteRateLimit = ({
  request,
  pathname,
}: {
  request: Request
  pathname: string
}) => {
  const { maxRequests, windowMs } = getWriteRateLimitConfig()
  const now = Date.now()
  cleanupExpiredBuckets(now)

  const key = `${pathname}:${getClientIp(request)}`
  const existingBucket = writeRateLimitBuckets.get(key)

  if (!existingBucket || existingBucket.resetAt <= now) {
    writeRateLimitBuckets.set(key, {
      count: 1,
      resetAt: now + windowMs,
    })
    return
  }

  if (existingBucket.count >= maxRequests) {
    throw new Error('Too many write requests. Please try again in a minute.')
  }

  writeRateLimitBuckets.set(key, {
    ...existingBucket,
    count: existingBucket.count + 1,
  })
}

export const writeAccessMiddleware = createMiddleware().server(
  async ({ request, pathname, next }) => {
    enforceWriteRateLimit({
      request,
      pathname,
    })

    await ensureAuthTables()
    const sessionUser = await getSessionUserFromRequest({
      request,
    })

    if (!sessionUser) {
      throw new Error('Unauthorized: login is required to write data.')
    }

    return next()
  },
)
