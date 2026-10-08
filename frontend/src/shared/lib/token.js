const TOKEN_KEY = 'landplot.token'
const USER_KEY = 'landplot.user'

/** Fired on window whenever the stored token is removed (expiry, logout, 401). */
export const TOKEN_CLEARED_EVENT = 'auth:token-cleared'

export const tokenStorage = {
  get() {
    return localStorage.getItem(TOKEN_KEY)
  },
  set(token) {
    localStorage.setItem(TOKEN_KEY, token)
  },
  clear() {
    if (localStorage.getItem(TOKEN_KEY) === null) return
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    window.dispatchEvent(new Event(TOKEN_CLEARED_EVENT))
  },
}

export const userStorage = {
  get() {
    return localStorage.getItem(USER_KEY)
  },
  set(name) {
    localStorage.setItem(USER_KEY, name)
  },
}
