import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router'

import { useAuth } from '@/features/auth/AuthContext'
import { initialsOf } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'

/** Top-right actions: Log in / signed-in pill and "List your land". */
export function TopRightNav() {
  const { isAuthenticated, displayName, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
      {isAuthenticated ? (
        <button
          type="button"
          title="Log out"
          onClick={logout}
          className="flex h-11 items-center gap-2 rounded-full bg-surface py-1 pl-1 pr-4 shadow-control hover:bg-surface-muted"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-primary-tint text-sm font-semibold text-primary">
            {initialsOf(displayName ?? '?')}
          </span>
          <span className="text-sm font-medium">{displayName}</span>
        </button>
      ) : (
        <Button size="map" variant="outline" className="shadow-control" onClick={() => navigate('/login')}>
          Log in
        </Button>
      )}
      <Button size="map" className="shadow-control" onClick={() => navigate('/lands/new')}>
        <Plus className="size-4" />
        List your land
      </Button>
    </div>
  )
}
