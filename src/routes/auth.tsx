import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { sha256Hex } from '@/lib/security/client-crypto'
import { logsQueryKeys } from '@/lib/query-keys'
import { getAuthStatus, login, signup } from '@/server/auth'

export const Route = createFileRoute('/auth')({
  component: AuthPage,
})

type AuthMode = 'login' | 'signup'

function AuthPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [mode, setMode] = useState<AuthMode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const authStatusQuery = useQuery({
    queryKey: logsQueryKeys.authStatus(),
    queryFn: async () => getAuthStatus(),
  })

  const authMutation = useMutation({
    mutationFn: async () => {
      const trimmedUsername = username.trim()
      if (!trimmedUsername || !password) {
        throw new Error('Username and password are required.')
      }

      const passwordDigest = await sha256Hex(password)

      if (mode === 'signup') {
        return signup({
          data: {
            username: trimmedUsername,
            passwordDigest,
          },
        })
      }

      return login({
        data: {
          username: trimmedUsername,
          passwordDigest,
        },
      })
    },
    onSuccess: async () => {
      setPassword('')
      await queryClient.invalidateQueries({ queryKey: logsQueryKeys.authStatus() })
      await navigate({ to: '/' })
    },
  })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    if (mode === 'signup' && authStatusQuery.data && !authStatusQuery.data.canSignup) {
      setFormError('Signup is currently disabled by server settings.')
      return
    }

    try {
      await authMutation.mutateAsync()
    } catch {
      // useMutation already exposes typed error state for rendering
    }
  }

  const isBusy = authMutation.isPending || authStatusQuery.isLoading
  const canSignup = authStatusQuery.data?.canSignup ?? false

  return (
    <main className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center px-3 py-6 sm:px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Account Access</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sign in to view and manage your own fitness data.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {authStatusQuery.data?.isAuthenticated ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You are already signed in as {authStatusQuery.data.username ?? 'user'}.
              </p>
              <Button type="button" onClick={() => void navigate({ to: '/' })}>
                Go To Dashboard
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={mode === 'login' ? 'default' : 'outline'}
                  onClick={() => setMode('login')}
                  disabled={isBusy}
                >
                  Log In
                </Button>
                <Button
                  type="button"
                  variant={mode === 'signup' ? 'default' : 'outline'}
                  onClick={() => setMode('signup')}
                  disabled={isBusy || !canSignup}
                >
                  Sign Up
                </Button>
              </div>

              <form className="space-y-3" onSubmit={handleSubmit}>
                <div className="space-y-1">
                  <label htmlFor="username" className="text-xs font-medium text-muted-foreground">
                    Username
                  </label>
                  <Input
                    id="username"
                    value={username}
                    autoComplete="username"
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="your-username"
                    disabled={isBusy}
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="password" className="text-xs font-medium text-muted-foreground">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    autoComplete={
                      mode === 'login' ? 'current-password' : 'new-password'
                    }
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="********"
                    disabled={isBusy}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isBusy || (mode === 'signup' && !canSignup)}
                  className="w-full"
                >
                  {mode === 'signup'
                    ? authMutation.isPending
                      ? 'Creating Account...'
                      : 'Create Account'
                    : authMutation.isPending
                      ? 'Signing In...'
                      : 'Sign In'}
                </Button>
              </form>

              {!canSignup ? (
                <p className="text-xs text-muted-foreground">
                  Signup is currently disabled by server settings.
                </p>
              ) : null}

              <p className="text-xs text-muted-foreground">
                Passwords are hashed in the browser before submission and stored as
                salted hashes on the server.
              </p>
            </>
          )}

          {formError ? (
            <p className="text-sm text-destructive">{formError}</p>
          ) : null}

          {authMutation.isError ? (
            <p className="text-sm text-destructive">
              {authMutation.error instanceof Error
                ? authMutation.error.message
                : 'Authentication failed.'}
            </p>
          ) : null}

          {authStatusQuery.isError ? (
            <p className="text-sm text-destructive">
              {authStatusQuery.error instanceof Error
                ? authStatusQuery.error.message
                : 'Failed to load auth status.'}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </main>
  )
}
