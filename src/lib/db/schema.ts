import { sql } from 'drizzle-orm'
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

export const workoutPlans = sqliteTable(
  'workout_plans',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    nameUnique: uniqueIndex('workout_plans_name_unique').on(table.name),
  }),
)

export const workoutDays = sqliteTable(
  'workout_days',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    workoutPlanId: integer('workout_plan_id')
      .notNull()
      .references(() => workoutPlans.id, { onDelete: 'cascade' }),
    dayOfWeek: integer('day_of_week').notNull(),
    title: text('title').notNull(),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    planDayUnique: uniqueIndex('workout_days_plan_day_unique').on(
      table.workoutPlanId,
      table.dayOfWeek,
    ),
    planIdx: index('workout_days_plan_idx').on(table.workoutPlanId),
  }),
)

export const workoutExercises = sqliteTable(
  'workout_exercises',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    workoutDayId: integer('workout_day_id')
      .notNull()
      .references(() => workoutDays.id, { onDelete: 'cascade' }),
    exerciseOrder: integer('exercise_order').notNull(),
    name: text('name').notNull(),
    sets: text('sets'),
    reps: text('reps'),
    notes: text('notes'),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    dayOrderUnique: uniqueIndex('workout_exercises_day_order_unique').on(
      table.workoutDayId,
      table.exerciseOrder,
    ),
    dayIdx: index('workout_exercises_day_idx').on(table.workoutDayId),
  }),
)

export const dietPlans = sqliteTable(
  'diet_plans',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    targetCalories: text('target_calories').notNull(),
    targetProtein: text('target_protein').notNull(),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    nameUnique: uniqueIndex('diet_plans_name_unique').on(table.name),
  }),
)

export const dietMeals = sqliteTable(
  'diet_meals',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    dietPlanId: integer('diet_plan_id')
      .notNull()
      .references(() => dietPlans.id, { onDelete: 'cascade' }),
    mealOrder: integer('meal_order').notNull(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    protein: text('protein').notNull(),
    calories: text('calories').notNull(),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    planOrderUnique: uniqueIndex('diet_meals_plan_order_unique').on(
      table.dietPlanId,
      table.mealOrder,
    ),
    planIdx: index('diet_meals_plan_idx').on(table.dietPlanId),
  }),
)

export const dailyLogs = sqliteTable('daily_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull().unique(),
  weight: real('weight'),
  calories: integer('calories'),
  protein: integer('protein'),
  steps: integer('steps'),
  workoutCompleted: integer('workout_completed', { mode: 'boolean' })
    .notNull()
    .default(false),
  notes: text('notes'),
  workoutPlanId: integer('workout_plan_id').references(() => workoutPlans.id),
  dietPlanId: integer('diet_plan_id').references(() => dietPlans.id),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

export type DailyLogRecord = typeof dailyLogs.$inferSelect
export type NewDailyLogRecord = typeof dailyLogs.$inferInsert
