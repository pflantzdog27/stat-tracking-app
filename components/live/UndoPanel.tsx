'use client'

import { UndoableEvent } from '@/lib/services/live-stats-service'
import Button from '@/components/ui/Button'

interface UndoPanelProps {
  undoStack: UndoableEvent[]
  onUndo: () => void
  onClearStack: () => void
  loading?: boolean
}

export default function UndoPanel({ 
  undoStack, 
  onUndo, 
  onClearStack, 
  loading = false 
}: UndoPanelProps) {
  const canUndo = undoStack.length > 0
  const lastEvent = undoStack[undoStack.length - 1]

  const getEventDisplay = (event: UndoableEvent) => {
    const eventType = event.eventData.eventType.replace('_', ' ')
    return `${eventType} - ${event.playerName}`
  }

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const seconds = Math.floor(diff / 1000)
    
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  if (!canUndo) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-center text-gray-500">
          <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">No recent actions to undo</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">Recent Actions</h3>
        <span className="text-sm text-gray-500">{undoStack.length} action{undoStack.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Last Event Display */}
      {lastEvent && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-yellow-900 capitalize">
                {getEventDisplay(lastEvent)}
              </p>
              <p className="text-sm text-yellow-700">
                Period {lastEvent.eventData.period} • {lastEvent.eventData.timeInPeriod} • {formatTimeAgo(lastEvent.timestamp)}
              </p>
            </div>
            <Button
              size="sm"
              onClick={onUndo}
              loading={loading}
              disabled={loading}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Undo
            </Button>
          </div>
        </div>
      )}

      {/* Recent Events List */}
      {undoStack.length > 1 && (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Previous Actions</p>
          {undoStack.slice(0, -1).reverse().slice(0, 5).map((event, index) => (
            <div key={event.id} className="bg-gray-50 rounded p-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {getEventDisplay(event)}
                  </p>
                  <p className="text-xs text-gray-600">
                    P{event.eventData.period} • {event.eventData.timeInPeriod} • {formatTimeAgo(event.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {undoStack.length > 6 && (
            <p className="text-xs text-gray-500 text-center">
              +{undoStack.length - 6} more actions
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-2 mt-4 pt-3 border-t">
        <Button
          size="sm"
          variant="ghost"
          onClick={onClearStack}
          disabled={loading}
          className="flex-1"
        >
          Clear All
        </Button>
        <Button
          size="sm"
          onClick={onUndo}
          loading={loading}
          disabled={loading || !canUndo}
          className="flex-1"
        >
          Undo Last
        </Button>
      </div>
    </div>
  )
}