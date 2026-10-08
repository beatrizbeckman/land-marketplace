import { MousePointer2 } from 'lucide-react'

import { cn } from '@/shared/lib/cn'

/** Floating toolbar next to the panel: "Select" and "Search area". */
export function Toolbar({ tool, onToolChange, showSearchHint }) {
  return (
    <div className="absolute left-[412px] top-4 z-10 flex items-center gap-2 max-md:hidden">
      <div className="flex gap-1 rounded-[12px] bg-surface p-1 shadow-control">
        <button
          type="button"
          aria-pressed={tool === 'select'}
          onClick={() => onToolChange('select')}
          className={cn(
            'flex h-11 items-center gap-2 rounded-[10px] px-3 text-sm font-medium transition-colors duration-150',
            tool === 'select' ? 'bg-primary-soft text-primary' : 'hover:bg-surface-muted',
          )}
        >
          <MousePointer2 className="size-4" />
          Select
        </button>
        <button
          type="button"
          aria-pressed={tool === 'search'}
          onClick={() => onToolChange('search')}
          className={cn(
            'flex h-11 items-center gap-2 rounded-[10px] px-3 text-sm font-medium transition-colors duration-150',
            tool === 'search' ? 'bg-search-soft text-search' : 'hover:bg-surface-muted',
          )}
        >
          <svg aria-hidden viewBox="0 0 16 16" className="size-4">
            <circle
              cx="8"
              cy="8"
              r="6.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="3 2.5"
            />
          </svg>
          Search area
        </button>
      </div>
      {showSearchHint && (
        <span className="rounded-[12px] bg-surface px-3 py-2 text-sm text-muted-strong shadow-control">
          Drag to set the radius, release to search
        </span>
      )}
    </div>
  )
}
