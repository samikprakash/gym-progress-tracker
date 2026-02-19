import { createHash } from 'node:crypto'

import {
  createUser,
  ensureAuthTables,
  getUserByUsername,
  normalizeUsername,
} from '../src/server/auth-core'
import { seedDefaultPlansForToday } from '../src/server/plan-seed'

const seed = async () => {
  await ensureAuthTables()

  const username = normalizeUsername(process.env.SEED_USERNAME ?? 'demo')
  const passwordDigest = createHash('sha256')
    .update(process.env.SEED_PASSWORD ?? 'demo12345')
    .digest('hex')

  let user = await getUserByUsername({
    username,
  })

  if (!user) {
    const createdUser = await createUser({
      username,
      passwordDigest,
    })
    user = await getUserByUsername({
      username: createdUser.username,
    })
  }

  if (!user) {
    throw new Error('Unable to create or load seed user')
  }

  const result = await seedDefaultPlansForToday({
    userId: user.id,
    force: true,
  })

  console.info(
    `Seeded workout plan + diet plan for ${user.username} on ${result.todayDate} (workoutPlanId=${result.workoutPlanId}, dietPlanId=${result.dietPlanId}).`,
  )
}

seed().catch((error) => {
  console.error('Seeding failed:', error)
  process.exit(1)
})
