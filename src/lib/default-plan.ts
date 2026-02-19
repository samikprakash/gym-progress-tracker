export type DefaultWorkoutExercise = {
  name: string
  sets: string | null
  reps: string | null
  notes?: string | null
}

export type DefaultWorkoutDay = {
  dayOfWeek: number
  title: string
  exercises: Array<DefaultWorkoutExercise>
}

export type DefaultDietMeal = {
  name: string
  description: string
  protein: string
  calories: string
}

export const DEFAULT_WORKOUT_PLAN = {
  name: 'Fat Loss PPL + Conditioning',
  days: [
    {
      dayOfWeek: 1,
      title: 'Push',
      exercises: [
        { name: 'Bench Press', sets: '4', reps: '6-8' },
        { name: 'Incline Dumbbell Press', sets: '3', reps: '8-10' },
        { name: 'Overhead Shoulder Press', sets: '3', reps: '6-8' },
        { name: 'Lateral Raises', sets: '4', reps: '12-15' },
        { name: 'Tricep Pushdowns', sets: '3', reps: '10-12' },
      ],
    },
    {
      dayOfWeek: 2,
      title: 'Pull',
      exercises: [
        { name: 'Deadlifts', sets: '3', reps: '5' },
        { name: 'Pull-ups / Lat Pulldown', sets: '4', reps: '8-10' },
        { name: 'Barbell Rows', sets: '3', reps: '6-8' },
        { name: 'Face Pulls', sets: '3', reps: '12-15' },
        { name: 'Bicep Curls', sets: '3', reps: '10-12' },
      ],
    },
    {
      dayOfWeek: 3,
      title: 'Legs + Abs',
      exercises: [
        { name: 'Squats', sets: '4', reps: '5-8' },
        { name: 'Romanian Deadlift', sets: '3', reps: '8-10' },
        { name: 'Leg Press', sets: '3', reps: '10-12' },
        { name: 'Hamstring Curl', sets: '3', reps: '10-12' },
        { name: 'Calf Raises', sets: '4', reps: '12-15' },
        { name: 'Hanging Leg Raises', sets: '3', reps: '12' },
        { name: 'Cable Crunch', sets: '3', reps: '15' },
        { name: 'Plank', sets: '3', reps: '45-60 sec' },
      ],
    },
    {
      dayOfWeek: 4,
      title: 'Rest / Active Recovery',
      exercises: [],
    },
    {
      dayOfWeek: 5,
      title: 'Upper Strength',
      exercises: [
        { name: 'Incline Bench Press', sets: '4', reps: '5' },
        { name: 'Weighted Pull-ups', sets: '4', reps: '6' },
        { name: 'Dumbbell Press', sets: '3', reps: '8' },
        { name: 'Row Variation', sets: '3', reps: '8' },
        { name: 'Lateral Raises', sets: '3', reps: '15' },
      ],
    },
    {
      dayOfWeek: 6,
      title: 'Conditioning + Abs',
      exercises: [
        { name: 'HIIT', sets: '1', reps: '15-20 min' },
        { name: 'Leg Raises', sets: '3 rounds', reps: '15' },
        { name: 'Russian Twists', sets: '3 rounds', reps: '20' },
        { name: 'Plank', sets: '3 rounds', reps: '60 sec' },
      ],
    },
    {
      dayOfWeek: 7,
      title: 'Rest',
      exercises: [],
    },
  ] satisfies Array<DefaultWorkoutDay>,
} as const

export const DEFAULT_DIET_PLAN = {
  name: '2000 Cal High Protein',
  targetCalories: '2000-2100 kcal',
  targetProtein: '150-170g',
  meals: [
    {
      name: 'Breakfast',
      description: '4 eggs (2 whole + 2 whites) + toast/oats',
      protein: '30g',
      calories: '~400',
    },
    {
      name: 'Lunch',
      description: '150-200g chicken/paneer + roti/rice + sabzi',
      protein: '40g',
      calories: '~600',
    },
    {
      name: 'Snack (Post-workout)',
      description: 'Whey protein + banana',
      protein: '25g',
      calories: '~250',
    },
    {
      name: 'Dinner',
      description: 'Chicken/fish/paneer + vegetables',
      protein: '35g',
      calories: '~500',
    },
    {
      name: 'Optional',
      description: 'Yogurt / eggs',
      protein: '15-20g',
      calories: '~200',
    },
  ] satisfies Array<DefaultDietMeal>,
} as const
