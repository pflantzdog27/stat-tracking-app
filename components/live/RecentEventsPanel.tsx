'use client'

interface GameEvent {
  id: string
  event_type: string
  period: number
  time_in_period: string
  description?: string
  created_at: string
  players: {
    first_name: string
    last_name: string
    jersey_number: number
    position: string
  }
}

interface RecentEventsPanelProps {
  events: GameEvent[]
  className?: string
}

export default function RecentEventsPanel({ events, className = '' }: RecentEventsPanelProps) {
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'goal':
        return '⚽'
      case 'assist':
        return '🅰️'
      case 'shot':
        return '🏒'
      case 'penalty':
        return '⚠️'
      case 'save':
        return '🥅'
      case 'hit':
        return '💥'
      case 'takeaway':
        return '👍'
      case 'giveaway':
        return '👎'
      case 'faceoff_win':
        return '🏆'
      case 'faceoff_loss':
        return '❌'
      default:
        return '🏒'
    }
  }

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'goal':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'assist':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'shot':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'penalty':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'save':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'hit':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatEventType = (eventType: string) => {
    return eventType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const eventTime = new Date(timestamp)
    const diff = now.getTime() - eventTime.getTime()
    const seconds = Math.floor(diff / 1000)
    
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  if (events.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm">No events recorded yet</p>
          <p className="text-xs text-gray-400 mt-1">Events will appear here as you enter stats</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Recent Events</h3>
        <span className="text-sm text-gray-500">{events.length} event{events.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {events.map((event) => (
          <div key={event.id} className={`flex items-start space-x-3 p-3 rounded-lg border ${getEventColor(event.event_type)}`}>
            <div className="flex-shrink-0 text-lg">
              {getEventIcon(event.event_type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm capitalize">
                  {formatEventType(event.event_type)}
                </p>
                <span className="text-xs opacity-75">
                  {formatTimeAgo(event.created_at)}
                </span>
              </div>
              
              <div className="mt-1">
                <p className="text-sm font-medium">
                  #{event.players.jersey_number} {event.players.first_name} {event.players.last_name}
                </p>
                <p className="text-xs opacity-75">
                  Period {event.period} • {event.time_in_period}
                  {event.description && ` • ${event.description}`}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {events.length > 10 && (
        <div className="text-center mt-3 pt-3 border-t">
          <p className="text-xs text-gray-500">
            Showing latest 10 events
          </p>
        </div>
      )}
    </div>
  )
}