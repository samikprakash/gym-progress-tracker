import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'

const DARK_MODE_STORAGE_KEY = 'fitness-tracker-theme'

export function DarkModeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const savedMode = window.localStorage.getItem(DARK_MODE_STORAGE_KEY)
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldUseDarkMode = savedMode
      ? savedMode === 'dark'
      : systemPrefersDark

    setIsDarkMode(shouldUseDarkMode)
    document.documentElement.classList.toggle('dark', shouldUseDarkMode)
  }, [])

  const toggleTheme = () => {
    const nextMode = !isDarkMode
    setIsDarkMode(nextMode)
    document.documentElement.classList.toggle('dark', nextMode)
    window.localStorage.setItem(DARK_MODE_STORAGE_KEY, nextMode ? 'dark' : 'light')
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={toggleTheme}>
      {isDarkMode ? (
        <>
          <Sun className="size-4" />
          Light
        </>
      ) : (
        <>
          <Moon className="size-4" />
          Dark
        </>
      )}
    </Button>
  )
}
