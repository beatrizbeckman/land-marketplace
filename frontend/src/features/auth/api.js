import { request } from '@/shared/lib/http'

/** 201 with an empty body: the caller must log in afterwards to get a token. */
export function registerUser(input) {
  return request('/auth/register', { method: 'POST', body: input })
}

export function loginUser(input) {
  return request('/auth/login', { method: 'POST', body: input })
}
