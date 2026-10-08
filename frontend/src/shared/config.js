/** Single place to rename the app later. */
export const APP_NAME = 'Landplot'

/** API base path; "/api" is proxied by Vite in dev and by Nginx in production. */
export const API_URL = import.meta.env.VITE_API_URL ?? '/api'
