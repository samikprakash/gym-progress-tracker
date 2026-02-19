import { seedDefaultPlansForToday } from '../src/server/plan-seed'

const seed = async () => {
  const result = await seedDefaultPlansForToday({ force: true })

  console.info(
    `Seeded workout plan + diet plan and assigned to ${result.todayDate} (workoutPlanId=${result.workoutPlanId}, dietPlanId=${result.dietPlanId}).`,
  )
}

seed().catch((error) => {
  console.error('Seeding failed:', error)
  process.exit(1)
})
