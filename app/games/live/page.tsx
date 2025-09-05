'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import PenaltyModal from '@/components/live/PenaltyModal'

interface Player {
  id: string
  name: string
  jersey_number: number
  position: string
  first_name: string
  last_name: string
}

interface Game {
  id: string
  home_team: string
  away_team: string
  home_score: number
  away_score: number
  period: number
  time_remaining: string
  status: string
  date: string
}

interface StatEvent {
  id: string
  player_name: string
  player_number: number
  event_type: string
  time: string
  period: number
  penalty_type?: string
  penalty_minutes?: number
  description?: string
}

export default function LiveStatsPage() {
  const { user } = useAuth()
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [game, setGame] = useState<Game>({
    id: '1',
    home_team: 'Thunder Bay Lightning',
    away_team: 'Sudbury Wolves',
    home_score: 2,
    away_score: 1,
    period: 2,
    time_remaining: '14:32',
    status: 'live',
    date: '2023-11-18'
  })
  const [players, setPlayers] = useState<Player[]>([])
  const [events, setEvents] = useState<StatEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [penaltyModalOpen, setPenaltyModalOpen] = useState(false)
  const [penaltyPlayer, setPenaltyPlayer] = useState<Player | null>(null)

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setPlayers([
        {
          id: '1',
          name: 'Connor McDavid Jr',
          jersey_number: 97,
          position: 'C',
          first_name: 'Connor',
          last_name: 'McDavid Jr'
        },
        {
          id: '2',
          name: 'Jake Thompson',
          jersey_number: 19,
          position: 'LW',
          first_name: 'Jake',
          last_name: 'Thompson'
        },
        {
          id: '3',
          name: 'Ryan Mitchell',
          jersey_number: 88,
          position: 'RW',
          first_name: 'Ryan',
          last_name: 'Mitchell'
        },
        {
          id: '4',
          name: 'Erik Karlsson Jr',
          jersey_number: 65,
          position: 'D',
          first_name: 'Erik',
          last_name: 'Karlsson Jr'
        },
        {
          id: '5',
          name: 'Sam Garcia',
          jersey_number: 4,
          position: 'D',
          first_name: 'Sam',
          last_name: 'Garcia'
        },
        {
          id: '6',
          name: 'Carter Price Jr',
          jersey_number: 31,
          position: 'G',
          first_name: 'Carter',
          last_name: 'Price Jr'
        }
      ])

      setEvents([
        {
          id: '1',
          player_name: 'Connor McDavid Jr',
          player_number: 97,
          event_type: 'goal',
          time: '12:45',
          period: 1
        },
        {
          id: '2',
          player_name: 'Jake Thompson',
          player_number: 19,
          event_type: 'assist',
          time: '12:45',
          period: 1
        },
        {
          id: '3',
          player_name: 'Ryan Mitchell',
          player_number: 88,
          event_type: 'goal',
          time: '08:22',
          period: 2
        }
      ])

      setLoading(false)
    }, 500)
  }, [])

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'C':
      case 'LW':
      case 'RW':
        return 'bg-blue-100 text-blue-800'
      case 'D':
        return 'bg-green-100 text-green-800'
      case 'G':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleStatEvent = (eventType: string) => {
    if (!selectedPlayer) return

    // Handle penalty events differently - open modal
    if (eventType === 'penalty') {
      setPenaltyPlayer(selectedPlayer)
      setPenaltyModalOpen(true)
      return
    }

    const newEvent: StatEvent = {
      id: `event_${Date.now()}`,
      player_name: `${selectedPlayer.first_name} ${selectedPlayer.last_name}`,
      player_number: selectedPlayer.jersey_number,
      event_type: eventType,
      time: game.time_remaining,
      period: game.period
    }

    setEvents(prev => [newEvent, ...prev])

    // Update score for goals
    if (eventType === 'goal') {
      setGame(prev => ({
        ...prev,
        home_score: prev.home_score + 1
      }))
    }

    // Clear selection for quick re-entry
    if (['goal'].includes(eventType)) {
      setSelectedPlayer(null)
    }

    // Show success feedback
    alert(`${eventType.charAt(0).toUpperCase() + eventType.slice(1)} recorded for #${selectedPlayer.jersey_number} ${selectedPlayer.first_name} ${selectedPlayer.last_name}`)
  }

  const handlePenaltySubmit = (penaltyType: string, minutes: number, description: string) => {
    if (!penaltyPlayer) return

    const newEvent: StatEvent = {
      id: `event_${Date.now()}`,
      player_name: `${penaltyPlayer.first_name} ${penaltyPlayer.last_name}`,
      player_number: penaltyPlayer.jersey_number,
      event_type: 'penalty',
      time: game.time_remaining,
      period: game.period,
      penalty_type: penaltyType,
      penalty_minutes: minutes,
      description: description
    }

    setEvents(prev => [newEvent, ...prev])

    // Clear penalty player selection
    setPenaltyPlayer(null)
    setSelectedPlayer(null)

    // Show success feedback with penalty details
    alert(`${penaltyType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} penalty (${minutes} min) recorded for #${penaltyPlayer.jersey_number} ${penaltyPlayer.first_name} ${penaltyPlayer.last_name}`)
  }

  const updateScore = (homeScore: number, awayScore: number) => {
    setGame(prev => ({
      ...prev,
      home_score: Math.max(0, homeScore),
      away_score: Math.max(0, awayScore)
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Check permissions
  if (!user || !['admin', 'coach'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600 mb-4">You need coach or admin permissions to enter live stats.</p>
          <Link
            href="/dashboard"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Live Stats Entry</h1>
              <p className="text-gray-600 mt-1">Real-time game statistics tracking</p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/games"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium"
              >
                Back to Games
              </Link>
              <Link
                href="/dashboard"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Game Scoreboard */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="text-center mb-6">
            <div className="text-sm text-gray-500 mb-2">LIVE GAME - Period {game.period} - {game.time_remaining}</div>
            <div className="flex items-center justify-center space-x-8">
              {/* Away Team */}
              <div className="text-center">
                <div className="text-lg font-medium text-gray-900">{game.away_team}</div>
                <div className="text-4xl font-bold text-gray-900">{game.away_score}</div>
                <div className="flex space-x-1 mt-2">
                  <button
                    onClick={() => updateScore(game.home_score, game.away_score + 1)}
                    className="bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded text-sm"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => updateScore(game.home_score, game.away_score - 1)}
                    className="bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded text-sm"
                  >
                    -1
                  </button>
                </div>
              </div>

              <div className="text-2xl font-bold text-gray-400">-</div>

              {/* Home Team */}
              <div className="text-center">
                <div className="text-lg font-medium text-gray-900">{game.home_team}</div>
                <div className="text-4xl font-bold text-blue-600">{game.home_score}</div>
                <div className="flex space-x-1 mt-2">
                  <button
                    onClick={() => updateScore(game.home_score + 1, game.away_score)}
                    className="bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded text-sm"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => updateScore(game.home_score - 1, game.away_score)}
                    className="bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded text-sm"
                  >
                    -1
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Player Selection */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Select Player</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                {players.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => setSelectedPlayer(player)}
                    className={`p-4 rounded-lg border-2 text-left hover:bg-gray-50 transition-colors ${
                      selectedPlayer?.id === player.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold">#{player.jersey_number}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{player.first_name} {player.last_name}</div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPositionColor(player.position)}`}>
                          {player.position}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Stat Entry Buttons */}
              {selectedPlayer && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">
                    Record Event for #{selectedPlayer.jersey_number} {selectedPlayer.first_name} {selectedPlayer.last_name}
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <button
                      onClick={() => handleStatEvent('goal')}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-md font-medium"
                    >
                      🥅 Goal
                    </button>
                    <button
                      onClick={() => handleStatEvent('assist')}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-md font-medium"
                    >
                      🎯 Assist
                    </button>
                    <button
                      onClick={() => handleStatEvent('shot')}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-md font-medium"
                    >
                      🏒 Shot
                    </button>
                    <button
                      onClick={() => handleStatEvent('penalty')}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-md font-medium"
                    >
                      ⚠️ Penalty
                    </button>
                    <button
                      onClick={() => handleStatEvent('hit')}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-md font-medium"
                    >
                      💥 Hit
                    </button>
                    {selectedPlayer.position === 'G' && (
                      <button
                        onClick={() => handleStatEvent('save')}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-md font-medium"
                      >
                        🥅 Save
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Events */}
          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Events</h2>
              <div className="space-y-3">
                {events.slice(0, 10).map((event) => (
                  <div key={event.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        #{event.player_number} {event.player_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {event.event_type === 'penalty' && event.penalty_type
                          ? `${event.penalty_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} (${event.penalty_minutes} min) - P${event.period} ${event.time}`
                          : `${event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)} - P${event.period} ${event.time}`
                        }
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        event.event_type === 'goal' ? 'bg-green-100 text-green-800' :
                        event.event_type === 'assist' ? 'bg-blue-100 text-blue-800' :
                        event.event_type === 'penalty' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {event.event_type}
                      </span>
                    </div>
                  </div>
                ))}
                
                {events.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    No events recorded yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Penalty Modal */}
      {penaltyPlayer && (
        <PenaltyModal
          isOpen={penaltyModalOpen}
          onClose={() => {
            setPenaltyModalOpen(false)
            setPenaltyPlayer(null)
          }}
          onSubmit={handlePenaltySubmit}
          playerName={`${penaltyPlayer.first_name} ${penaltyPlayer.last_name}`}
        />
      )}
    </div>
  )
}