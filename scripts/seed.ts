import { seedDefaultPlanTemplates } from '../src/server/plan-seed'

const seed = async () => {
  const result = await seedDefaultPlanTemplates()

  console.info(
    `Seeded workout plan + diet plan templates (workoutPlanId=${result.workoutPlanId}, dietPlanId=${result.dietPlanId}).`,
  )
}

seed().catch((error) => {
  console.error('Seeding failed:', error)
  process.exit(1)
})
