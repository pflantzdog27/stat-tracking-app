'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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
  team_id: string
  opponent: string
  game_date: string
  is_home: boolean
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  period?: number
  time_remaining?: string
  final_score_us?: number
  final_score_them?: number
  teams?: {
    name: string
    season: string
  }
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
  player_id?: string
}

export default function LiveStatsPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const gameId = searchParams.get('gameId')

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [game, setGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [events, setEvents] = useState<StatEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [penaltyModalOpen, setPenaltyModalOpen] = useState(false)
  const [penaltyPlayer, setPenaltyPlayer] = useState<Player | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    if (user && gameId) {
      loadGameData()
    } else if (user) {
      // No gameId provided, redirect to games page
      router.push('/games?error=no-game-selected')
    }
  }, [user, gameId])

  // Navigation guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
      }
    }

    if (hasUnsavedChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload)
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedChanges])

  const loadGameData = async () => {
    try {
      setLoading(true)
      
      // Load game details
      const gameResponse = await fetch(`/api/games/${gameId}`)
      if (!gameResponse.ok) {
        throw new Error('Failed to load game')
      }
      const { game: gameData } = await gameResponse.json()
      
      // Check if game is in progress
      if (gameData.status !== 'in_progress') {
        router.push(`/games/${gameId}?error=game-not-active`)
        return
      }
      
      setGame(gameData)

      // Load team players from database
      const playersResponse = await fetch(`/api/players?teamId=${gameData.team_id}`)
      if (!playersResponse.ok) {
        throw new Error('Failed to load players')
      }
      const { players: teamPlayers } = await playersResponse.json()
      
      // Transform player data to match the expected interface
      const transformedPlayers = teamPlayers.map((player: any) => ({
        id: player.id,
        name: `${player.first_name} ${player.last_name}`,
        jersey_number: player.jersey_number,
        position: player.position,
        first_name: player.first_name,
        last_name: player.last_name
      }))
      
      setPlayers(transformedPlayers)

      // Load existing events (mock for now)
      setEvents([])
      
    } catch (error) {
      console.error('Error loading game data:', error)
      router.push('/games?error=load-failed')
    } finally {
      setLoading(false)
    }
  }

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
    if (!selectedPlayer || !game) return

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
      time: game.time_remaining || '20:00',
      period: game.period || 1,
      player_id: selectedPlayer.id
    }

    setEvents(prev => [newEvent, ...prev])
    setHasUnsavedChanges(true)

    // Update score for goals
    if (eventType === 'goal') {
      setGame(prev => prev ? {
        ...prev,
        final_score_us: (prev.final_score_us || 0) + 1
      } : prev)
    }

    // Clear selection for quick re-entry
    if (['goal'].includes(eventType)) {
      setSelectedPlayer(null)
    }

    // Show success feedback
    alert(`${eventType.charAt(0).toUpperCase() + eventType.slice(1)} recorded for #${selectedPlayer.jersey_number} ${selectedPlayer.first_name} ${selectedPlayer.last_name}`)
  }

  const handlePenaltySubmit = (penaltyType: string, minutes: number, description: string) => {
    if (!penaltyPlayer || !game) return

    const newEvent: StatEvent = {
      id: `event_${Date.now()}`,
      player_name: `${penaltyPlayer.first_name} ${penaltyPlayer.last_name}`,
      player_number: penaltyPlayer.jersey_number,
      event_type: 'penalty',
      time: game.time_remaining || '20:00',
      period: game.period || 1,
      penalty_type: penaltyType,
      penalty_minutes: minutes,
      description: description,
      player_id: penaltyPlayer.id
    }

    setEvents(prev => [newEvent, ...prev])
    setHasUnsavedChanges(true)

    // Clear penalty player selection
    setPenaltyPlayer(null)
    setSelectedPlayer(null)

    // Show success feedback with penalty details
    alert(`${penaltyType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} penalty (${minutes} min) recorded for #${penaltyPlayer.jersey_number} ${penaltyPlayer.first_name} ${penaltyPlayer.last_name}`)
  }

  const updateScore = (usScore: number, themScore: number) => {
    setGame(prev => prev ? ({
      ...prev,
      final_score_us: Math.max(0, usScore),
      final_score_them: Math.max(0, themScore)
    }) : prev)
    setHasUnsavedChanges(true)
  }

  const handleSaveEvents = async () => {
    if (!game || events.length === 0) {
      alert('No events to save')
      return
    }

    try {
      setSaving(true)
      
      // Prepare events for API
      const eventsToSave = events.map(event => ({
        player_id: event.player_id,
        event_type: event.event_type,
        period: event.period,
        time: event.time,
        penalty_type: event.penalty_type,
        penalty_minutes: event.penalty_minutes,
        description: event.description
      }))

      const response = await fetch(`/api/games/${game.id}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ events: eventsToSave })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save events')
      }

      // Also update the game with current scores
      const updateResponse = await fetch(`/api/games/${game.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'update',
          final_score_us: game.final_score_us,
          final_score_them: game.final_score_them
        })
      })

      if (!updateResponse.ok) {
        throw new Error('Failed to update scores')
      }

      setHasUnsavedChanges(false)
      alert('Events and scores saved successfully!')
    } catch (error) {
      console.error('Error saving events:', error)
      alert(error instanceof Error ? error.message : 'Failed to save events')
    } finally {
      setSaving(false)
    }
  }

  const handleCompleteGame = async () => {
    if (!game) return

    const confirmed = confirm(`Complete game with final score ${game.final_score_us} - ${game.final_score_them}?`)
    if (!confirmed) return

    try {
      setCompleting(true)

      // Save any unsaved events first
      if (hasUnsavedChanges && events.length > 0) {
        await handleSaveEvents()
      }

      // Complete the game
      const response = await fetch(`/api/games/${game.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'finish',
          final_score_us: game.final_score_us,
          final_score_them: game.final_score_them
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to complete game')
      }

      alert('Game completed successfully!')
      router.push('/games')
    } catch (error) {
      console.error('Error completing game:', error)
      alert(error instanceof Error ? error.message : 'Failed to complete game')
    } finally {
      setCompleting(false)
    }
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
              {game ? (
                <p className="text-gray-600 mt-1">
                  {game.teams?.name || 'Your Team'} vs {game.opponent} - {new Date(game.game_date).toLocaleDateString()}
                </p>
              ) : (
                <p className="text-gray-600 mt-1">Real-time game statistics tracking</p>
              )}
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
        {game && (
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <div className="text-center mb-6">
              <div className="text-sm text-gray-500 mb-2">
                LIVE GAME - Period {game.period || 1} - {game.time_remaining || '20:00'}
              </div>
              <div className="flex items-center justify-center space-x-8">
                {/* Opponent Team */}
                <div className="text-center">
                  <div className="text-lg font-medium text-gray-900">{game.opponent}</div>
                  <div className="text-4xl font-bold text-gray-900">{game.final_score_them || 0}</div>
                  <div className="flex space-x-1 mt-2">
                    <button
                      onClick={() => updateScore(game.final_score_us || 0, (game.final_score_them || 0) + 1)}
                      className="bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded text-sm"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => updateScore(game.final_score_us || 0, (game.final_score_them || 0) - 1)}
                      className="bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded text-sm"
                    >
                      -1
                    </button>
                  </div>
                </div>

                <div className="text-2xl font-bold text-gray-400">-</div>

                {/* Your Team */}
                <div className="text-center">
                  <div className="text-lg font-medium text-gray-900">{game.teams?.name || 'Your Team'}</div>
                  <div className="text-4xl font-bold text-blue-600">{game.final_score_us || 0}</div>
                  <div className="flex space-x-1 mt-2">
                    <button
                      onClick={() => updateScore((game.final_score_us || 0) + 1, game.final_score_them || 0)}
                      className="bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded text-sm"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => updateScore((game.final_score_us || 0) - 1, game.final_score_them || 0)}
                      className="bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded text-sm"
                    >
                      -1
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Game Controls */}
            <div className="flex justify-center space-x-4 border-t pt-4">
              <Link
                href={`/games/${game.id}`}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium"
              >
                Back to Game
              </Link>
              
              {events.length > 0 && (
                <button
                  onClick={handleSaveEvents}
                  disabled={saving || !hasUnsavedChanges}
                  className={`px-4 py-2 rounded-md font-medium ${
                    saving || !hasUnsavedChanges
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {saving ? 'Saving...' : 'Save Events'}
                </button>
              )}

              <button
                onClick={handleCompleteGame}
                disabled={completing}
                className={`px-4 py-2 rounded-md font-medium ${
                  completing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {completing ? 'Completing...' : 'Complete Game'}
              </button>

              {hasUnsavedChanges && (
                <div className="flex items-center text-amber-600">
                  <span className="text-sm font-medium">⚠️ Unsaved changes</span>
                </div>
              )}
            </div>
          </div>
        )}

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