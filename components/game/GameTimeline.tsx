'use client'

import { useState } from 'react'

interface GameTimelineProps {
  events: GameEvent[]
  gameData: {
    homeTeam: {
      id: string
      name: string
      abbreviation: string
      logo: string
    }
    awayTeam: {
      id: string
      name: string
      abbreviation: string
      logo: string
    }
  }
  className?: string
}

interface GameEvent {
  id: string
  period: number
  time: string
  type: 'goal' | 'penalty' | 'hit' | 'save' | 'faceoff' | 'period_start' | 'period_end'
  team: 'home' | 'away'
  players: string[]
  description: string
  video?: string
}

type EventFilter = 'all' | 'goals' | 'penalties' | 'major'

export default function GameTimeline({
  events,
  gameData,
  className = ''
}: GameTimelineProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<number | 'all'>('all')
  const [eventFilter, setEventFilter] = useState<EventFilter>('all')
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)

  const periods = [...new Set(events.map(event => event.period))].sort((a, b) => a - b)

  const filteredEvents = events.filter(event => {
    // Period filter
    if (selectedPeriod !== 'all' && event.period !== selectedPeriod) return false
    
    // Event type filter
    if (eventFilter === 'goals' && event.type !== 'goal') return false
    if (eventFilter === 'penalties' && event.type !== 'penalty') return false
    if (eventFilter === 'major' && !['goal', 'penalty', 'period_start', 'period_end'].includes(event.type)) return false
    
    return true
  })

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'goal':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
        )
      case 'penalty':
        return (
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        )
      case 'hit':
        return (
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        )
      case 'save':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      case 'period_start':
      case 'period_end':
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )
    }
  }

  const getTeamLogo = (team: 'home' | 'away') => {
    const teamData = team === 'home' ? gameData.homeTeam : gameData.awayTeam
    return (
      <img 
        src={teamData.logo} 
        alt={teamData.name}
        className="w-6 h-6 rounded-full"
      />
    )
  }

  const getPeriodLabel = (period: number) => {
    if (period <= 3) return `P${period}`
    if (period === 4) return 'OT'
    if (period === 5) return 'SO'
    return `OT${period - 3}`
  }

  const formatTime = (time: string) => {
    return time.includes(':') ? time : `${time}:00`
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Game Timeline
          </h2>
          
          <div className="flex flex-wrap gap-2">
            {/* Period Filter */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="px-3 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Periods</option>
              {periods.map(period => (
                <option key={period} value={period}>{getPeriodLabel(period)}</option>
              ))}
            </select>
            
            {/* Event Filter */}
            <div className="flex rounded-md bg-gray-100 p-1">
              <button
                onClick={() => setEventFilter('all')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  eventFilter === 'all'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setEventFilter('goals')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  eventFilter === 'goals'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Goals
              </button>
              <button
                onClick={() => setEventFilter('penalties')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  eventFilter === 'penalties'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Penalties
              </button>
              <button
                onClick={() => setEventFilter('major')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  eventFilter === 'major'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Major
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h3>
            <p className="text-gray-600">No events match your current filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event, index) => (
              <div
                key={event.id}
                className={`relative flex items-start space-x-4 p-4 rounded-lg border transition-colors ${
                  expandedEvent === event.id ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {/* Timeline Line */}
                {index < filteredEvents.length - 1 && (
                  <div className="absolute left-8 top-16 w-px h-8 bg-gray-300"></div>
                )}
                
                {/* Event Icon */}
                <div className="flex-shrink-0">
                  {getEventIcon(event.type)}
                </div>
                
                {/* Event Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {getPeriodLabel(event.period)} {formatTime(event.time)}
                        </span>
                        {event.team !== 'home' && event.team !== 'away' ? null : getTeamLogo(event.team)}
                      </div>
                      
                      <p className="text-sm text-gray-900 font-medium mb-1">
                        {event.description}
                      </p>
                      
                      {event.players.length > 0 && (
                        <p className="text-xs text-gray-600">
                          Players: {event.players.join(', ')}
                        </p>
                      )}
                      
                      {expandedEvent === event.id && event.video && (
                        <div className="mt-3">
                          <button className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                            Watch Replay
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {(event.video || event.players.length > 1) && (
                      <button
                        onClick={() => setExpandedEvent(
                          expandedEvent === event.id ? null : event.id
                        )}
                        className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg 
                          className={`w-4 h-4 transition-transform ${
                            expandedEvent === event.id ? 'rotate-180' : ''
                          }`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Event Summary */}
      <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-gray-900">
              {events.filter(e => e.type === 'goal').length}
            </div>
            <div className="text-xs text-gray-600">Total Goals</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">
              {events.filter(e => e.type === 'penalty').length}
            </div>
            <div className="text-xs text-gray-600">Penalties</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">
              {events.filter(e => e.type === 'hit').length}
            </div>
            <div className="text-xs text-gray-600">Big Hits</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">
              {Math.max(...events.map(e => e.period))}
            </div>
            <div className="text-xs text-gray-600">Periods Played</div>
          </div>
        </div>
      </div>
    </div>
  )
}