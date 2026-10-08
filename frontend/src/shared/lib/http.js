import { API_URL } from '@/shared/config'
import { tokenStorage } from '@/shared/lib/token'

export class ApiError extends Error {
  status
  problem

  constructor(problem) {
    super(problem.detail ?? `Request failed with status ${problem.status}`)
    this.name = 'ApiError'
    this.status = problem.status
    this.problem = problem
  }
}

/** 401 on a protected call: the token was cleared, the caller must redirect to login. */
export class UnauthorizedError extends ApiError {
  constructor(problem) {
    super(problem)
    this.name = 'UnauthorizedError'
  }
}

async function parseProblem(response) {
  try {
    return (await response.json())
  } catch {
    return { status: response.status, detail: 'An unexpected error occurred' }
  }
}

export async function request(path, options = {}) {
  const { method = 'GET', body, signal, anonymousRetryOn401 = false } = options

  const execute = (token) =>
    fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token !== null && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })

  const token = tokenStorage.get()
  let response = await execute(token)

  if (response.status === 401 && token !== null) {
    tokenStorage.clear()
    if (anonymousRetryOn401) {
      response = await execute(null)
    }
  }

  if (!response.ok) {
    const problem = await parseProblem(response)
    throw response.status === 401 ? new UnauthorizedError(problem) : new ApiError(problem)
  }

  // POST /api/auth/register answers 201 with an empty body.
  const text = await response.text()
  return (text.length > 0 ? JSON.parse(text) : undefined)
}
