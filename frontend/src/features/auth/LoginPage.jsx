import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router'

import { ApiError } from '@/shared/lib/http'
import { Button } from '@/shared/ui/button'
import { FieldError } from '@/shared/ui/field-error'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

import { useAuth } from './AuthContext'
import { AuthLayout } from './AuthLayout'
import { loginSchema } from './schemas'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState(null)

  const from = (location.state)?.from ?? '/'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) })

  const onSubmit = handleSubmit(async (input) => {
    setFormError(null)
    try {
      await login(input)
      navigate(from, { replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        // Generic on purpose: never reveal whether the e-mail exists.
        setFormError('Invalid e-mail or password')
      } else if (error instanceof ApiError) {
        setFormError(error.problem.detail ?? 'Something went wrong. Try again.')
      } else {
        setFormError("Couldn't reach the server. Check your connection and try again.")
      }
    }
  })

  return (
    <AuthLayout>
      <h1 className="text-xl font-semibold">Log in</h1>
      <p className="mt-1 text-sm text-muted">
        You need an account to list a land. Browsing and searching are open to everyone.
      </p>
      <form onSubmit={onSubmit} noValidate className="mt-5 flex flex-col gap-4">
        <div>
          <Label htmlFor="login-email">E-mail</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            invalid={!!errors.email}
            {...register('email')}
          />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <Label htmlFor="login-password">Password</Label>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            invalid={!!errors.password}
            {...register('password')}
          />
          <FieldError message={errors.password?.message} />
        </div>
        <FieldError message={formError ?? undefined} />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        No account yet?{' '}
        <Link to="/register" state={{ from }} className="font-medium text-primary underline">
          Create one
        </Link>
      </p>
    </AuthLayout>
  )
}
