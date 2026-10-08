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
import { registerSchema } from './schemas'

export function RegisterPage() {
  const { register: registerAccount } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState(null)

  const from = (location.state)?.from ?? '/'

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema) })

  const onSubmit = handleSubmit(async (input) => {
    setFormError(null)
    try {
      await registerAccount(input)
      navigate(from, { replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setError('email', {
          message: 'This e-mail is already registered. Log in instead',
        })
      } else if (error instanceof ApiError && error.problem.errors) {
        for (const violation of error.problem.errors) {
          if (violation.field === 'name' || violation.field === 'email' || violation.field === 'password') {
            setError(violation.field, { message: violation.message })
          }
        }
      } else if (error instanceof ApiError) {
        setFormError(error.problem.detail ?? 'Something went wrong. Try again.')
      } else {
        setFormError("Couldn't reach the server. Check your connection and try again.")
      }
    }
  })

  return (
    <AuthLayout>
      <h1 className="text-xl font-semibold">Create your account</h1>
      <form onSubmit={onSubmit} noValidate className="mt-5 flex flex-col gap-4">
        <div>
          <Label htmlFor="register-name">Name</Label>
          <Input
            id="register-name"
            autoComplete="name"
            invalid={!!errors.name}
            {...register('name')}
          />
          <FieldError message={errors.name?.message} />
        </div>
        <div>
          <Label htmlFor="register-email">E-mail</Label>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            invalid={!!errors.email}
            {...register('email')}
          />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <Label htmlFor="register-password">Password</Label>
          <Input
            id="register-password"
            type="password"
            autoComplete="new-password"
            invalid={!!errors.password}
            {...register('password')}
          />
          <p className="mt-1 text-xs text-muted">8 to 72 characters</p>
          <FieldError message={errors.password?.message} />
        </div>
        <FieldError message={formError ?? undefined} />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create account'}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" state={{ from }} className="font-medium text-primary underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  )
}
