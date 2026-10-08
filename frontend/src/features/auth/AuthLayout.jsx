import { Link } from 'react-router'

import { APP_NAME } from '@/shared/config'
import { LogoMark } from '@/shared/ui/logo'

/** Shared chrome for the Login and Register pages (no map). */
export function AuthLayout({ children }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-surface-muted px-4 py-10">
      <div className="mb-5 flex items-center gap-2">
        <LogoMark />
        <span className="text-lg font-semibold">{APP_NAME}</span>
      </div>
      <div className="w-full max-w-[400px] rounded-[14px] bg-surface p-7 shadow-panel">
        {children}
      </div>
      <Link to="/" className="mt-5 text-sm text-muted-strong underline">
        Back to the map
      </Link>
    </div>
  )
}
