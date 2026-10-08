import { formatArea } from '@/shared/lib/format'
import { Button } from '@/shared/ui/button'

/** Step 1 panel: drawing instructions and live sketch numbers. */
export function OutlineStep({ vertices, areaSqm, onCancel, onUndoLastPoint }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="font-semibold">Draw the outline of your land</h3>
        <p className="mt-1 text-sm text-muted">
          Click on the map to place each corner of your land. Close the shape to
          continue to the details.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-[8px] bg-surface-muted p-3">
            <p className="text-xs text-muted">Points</p>
            <p className="font-semibold">{vertices}</p>
          </div>
          <div className="rounded-[8px] bg-surface-muted p-3">
            <p className="text-xs text-muted">Area so far</p>
            <p className="font-semibold">{areaSqm > 0 ? formatArea(areaSqm) : '—'}</p>
          </div>
        </div>

        <table className="mt-4 w-full text-sm">
          <tbody>
            {[
              ['Click', 'Add a point'],
              ['Double-click', 'Close the outline'],
              ['Ctrl + Z', 'Undo last point'],
              ['Esc', 'Cancel the current drawing'],
            ].map(([key, action]) => (
              <tr key={key} className="border-b border-line last:border-0">
                <td className="py-2 pr-3">
                  <kbd className="rounded-[6px] bg-surface-muted px-1.5 py-0.5 font-mono text-xs">
                    {key}
                  </kbd>
                </td>
                <td className="py-2 text-muted">{action}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-3 text-xs text-muted">
          Points snap to the corners of existing lands, so neighboring plots can
          share a boundary without overlapping.
        </p>
      </div>

      <footer className="flex gap-2 border-t border-line p-4">
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="ghost" className="flex-1" onClick={onUndoLastPoint}>
          Undo last point
        </Button>
      </footer>
    </div>
  )
}
