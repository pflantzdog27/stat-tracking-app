'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import PenaltyModal from '@/components/live/PenaltyModal'
import Layout from '@/components/layout/Layout'

interface Player {
  id: string
  team_id: string
  jersey_number: number
  first_name: string
  last_name: string
  position: string
  active: boolean
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
}

export default function GameDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const gameId = params.id as string

  const [game, setGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [events, setEvents] = useState<StatEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [penaltyModalOpen, setPenaltyModalOpen] = useState(false)
  const [penaltyPlayer, setPenaltyPlayer] = useState<Player | null>(null)
  const [confirmAction, setConfirmAction] = useState<{
    action: string
    title: string
    message: string
    variant: 'danger' | 'success' | 'warning'
  } | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    if (user && gameId) {
      loadGame()
    }
  }, [user, gameId])

  // Navigation guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    if (hasUnsavedChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload)
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedChanges])

  const loadGame = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/games/${gameId}`)
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/games?error=game-not-found')
          return
        }
        throw new Error('Failed to fetch game')
      }
      const { game } = await response.json()
      setGame(game)

      // Load players if game is in progress
      if (game && game.status === 'in_progress') {
        await loadPlayers(game.team_id)
      }
    } catch (error) {
      console.error('Error loading game:', error)
      router.push('/games?error=load-failed')
    } finally {
      setLoading(false)
    }
  }

  const loadPlayers = async (teamId: string) => {
    try {
      const response = await fetch(`/api/players?teamId=${teamId}`)
      if (response.ok) {
        const { players } = await response.json()
        setPlayers(players || [])
      }
    } catch (error) {
      console.error('Error loading players:', error)
    }
  }

  const handleAction = async (action: string) => {
    if (!game) return

    try {
      setActionLoading(true)
      
      let updateData: any = { action }
      
      if (action === 'finish') {
        // For demo, we'll use current scores or default values
        updateData.final_score_us = game.final_score_us || 0
        updateData.final_score_them = game.final_score_them || 0
        updateData.period = game.period || 3
      }

      const response = await fetch(`/api/games/${gameId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update game')
      }

      const { game: updatedGame } = await response.json()
      setGame(updatedGame)
      setHasUnsavedChanges(false)
      setShowConfirmModal(false)
      setConfirmAction(null)
      
      // Show success message based on action
      if (action === 'start') {
        alert('Game started! You can now enter live stats.')
      } else if (action === 'finish') {
        alert('Game completed! Stats have been saved.')
      } else if (action === 'cancel') {
        alert('Game cancelled and reset to scheduled.')
      }

    } catch (error) {
      console.error('Error updating game:', error)
      alert(`Failed to ${action} game. Please try again.`)
    } finally {
      setActionLoading(false)
    }
  }

  const confirmActionHandler = (action: string, title: string, message: string, variant: 'danger' | 'success' | 'warning' = 'warning') => {
    setConfirmAction({ action, title, message, variant })
    setShowConfirmModal(true)
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
      time: '20:00', // Default time - in real app would use actual game time
      period: 1 // Default period - in real app would use actual period
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
      time: '20:00',
      period: 1,
      penalty_type: penaltyType,
      penalty_minutes: minutes,
      description: description
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  if (!game) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Game Not Found</h1>
            <Link href="/games" className="text-blue-600 hover:text-blue-800">
              Back to Games
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center space-x-4 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {game.teams?.name || 'Your Team'} vs {game.opponent}
                </h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(game.status)}`}>
                  {game.status.charAt(0).toUpperCase() + game.status.slice(1).replace('_', ' ')}
                </span>
              </div>
              <p className="text-gray-600">{formatDate(game.game_date)}</p>
              <p className="text-gray-600">{game.is_home ? 'Home Game' : 'Away Game'}</p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/games"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium"
              >
                Back to Games
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Game Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Score Display */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <div className="flex items-center justify-center space-x-12">
            {/* Your Team */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-white">US</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {game.teams?.name || 'Your Team'}
              </h3>
              <div className={`text-6xl font-bold ${
                game.status === 'in_progress' ? 'text-red-600' : 'text-gray-900'
              }`}>
                {game.final_score_us || 0}
              </div>
            </div>

            {/* VS or Game Info */}
            <div className="text-center">
              {game.status === 'scheduled' ? (
                <div className="text-gray-400 text-2xl font-bold">VS</div>
              ) : (
                <div className="text-gray-600">
                  {game.status === 'in_progress' && (
                    <>
                      <div className="text-sm font-medium">Period {game.period}</div>
                      <div className="text-sm">{game.time_remaining}</div>
                      <div className="flex items-center justify-center mt-1">
                        <span className="animate-pulse h-2 w-2 bg-red-500 rounded-full mr-2"></span>
                        <span className="text-xs font-bold text-red-600">LIVE</span>
                      </div>
                    </>
                  )}
                  {game.status === 'completed' && (
                    <div className="text-sm text-gray-500">Final</div>
                  )}
                </div>
              )}
            </div>

            {/* Opponent */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold">OPP</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{game.opponent}</h3>
              <div className={`text-6xl font-bold ${
                game.status === 'in_progress' ? 'text-red-600' : 'text-gray-900'
              }`}>
                {game.final_score_them || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Game Controls</h2>
          <div className="flex space-x-4">
            {game.status === 'scheduled' && (
              <Button
                onClick={() => confirmActionHandler(
                  'start',
                  'Start Game',
                  'Are you sure you want to start this game? This will mark it as in progress and you can begin entering live stats.',
                  'success'
                )}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {actionLoading ? <LoadingSpinner size="small" /> : null}
                <span className={actionLoading ? 'ml-2' : ''}>Start Game</span>
              </Button>
            )}

            {game.status === 'in_progress' && (
              <>
                <Link
                  href={`/games/live?gameId=${game.id}`}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium inline-flex items-center"
                >
                  Enter Live Stats
                </Link>
                <Button
                  onClick={() => confirmActionHandler(
                    'finish',
                    'Finish Game',
                    'Are you sure you want to finish this game? This will mark it as completed and save all current stats as final.',
                    'success'
                  )}
                  disabled={actionLoading}
                  className="bg-gray-600 hover:bg-gray-700"
                >
                  {actionLoading ? <LoadingSpinner size="small" /> : null}
                  <span className={actionLoading ? 'ml-2' : ''}>Finish Game</span>
                </Button>
                <Button
                  onClick={() => confirmActionHandler(
                    'cancel',
                    'Cancel Game Progress',
                    'Are you sure you want to cancel the game progress? This will reset the game back to scheduled and clear all current stats.',
                    'danger'
                  )}
                  disabled={actionLoading}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  {actionLoading ? <LoadingSpinner size="small" /> : null}
                  <span className={actionLoading ? 'ml-2' : ''}>Cancel & Reset</span>
                </Button>
              </>
            )}

            {game.status === 'completed' && (
              <Link
                href={`/games/${game.id}/stats`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium inline-flex items-center"
              >
                View Game Stats
              </Link>
            )}
          </div>
        </div>

        {/* Game Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Game Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Team</h3>
              <p className="text-lg text-gray-900">{game.teams?.name} ({game.teams?.season})</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Opponent</h3>
              <p className="text-lg text-gray-900">{game.opponent}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Date & Time</h3>
              <p className="text-lg text-gray-900">{formatDate(game.game_date)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Venue</h3>
              <p className="text-lg text-gray-900">{game.is_home ? 'Home' : 'Away'}</p>
            </div>
            {game.status === 'completed' && (
              <>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Final Score</h3>
                  <p className="text-lg font-bold text-gray-900">
                    {game.final_score_us} - {game.final_score_them}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Result</h3>
                  <p className={`text-lg font-bold ${
                    (game.final_score_us || 0) > (game.final_score_them || 0) 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {(game.final_score_us || 0) > (game.final_score_them || 0) ? 'Won' : 'Lost'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Live Stats Interface - Only show when game is in progress and user has permission */}
        {game && game.status === 'in_progress' && user && ['admin', 'coach'].includes(user.role) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            {/* Player Selection */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Live Stats Entry - Select Player</h2>
                {players.length > 0 ? (
                  <>
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

                    {/* Score Controls */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-3">Manual Score Adjustment</h3>
                      <div className="flex items-center justify-center space-x-8">
                        {/* Opponent Team */}
                        <div className="text-center">
                          <div className="text-lg font-medium text-gray-900 mb-2">{game.opponent}</div>
                          <div className="text-3xl font-bold text-gray-900 mb-2">{game.final_score_them || 0}</div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => updateScore(game.final_score_us || 0, (game.final_score_them || 0) + 1)}
                              className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded text-sm"
                            >
                              +1
                            </button>
                            <button
                              onClick={() => updateScore(game.final_score_us || 0, (game.final_score_them || 0) - 1)}
                              className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
                            >
                              -1
                            </button>
                          </div>
                        </div>

                        <div className="text-2xl font-bold text-gray-400">-</div>

                        {/* Your Team */}
                        <div className="text-center">
                          <div className="text-lg font-medium text-gray-900 mb-2">{game.teams?.name || 'Your Team'}</div>
                          <div className="text-3xl font-bold text-blue-600 mb-2">{game.final_score_us || 0}</div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => updateScore((game.final_score_us || 0) + 1, game.final_score_them || 0)}
                              className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded text-sm"
                            >
                              +1
                            </button>
                            <button
                              onClick={() => updateScore((game.final_score_us || 0) - 1, game.final_score_them || 0)}
                              className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
                            >
                              -1
                            </button>
                          </div>
                        </div>
                      </div>
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
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Loading team players...</p>
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
        )}
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

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={confirmAction?.title || ''}
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            {confirmAction?.message}
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => confirmAction && handleAction(confirmAction.action)}
              disabled={actionLoading}
              className={
                confirmAction?.variant === 'danger' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : confirmAction?.variant === 'success'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-yellow-600 hover:bg-yellow-700'
              }
            >
              {actionLoading ? <LoadingSpinner size="small" /> : null}
              <span className={actionLoading ? 'ml-2' : ''}>Confirm</span>
            </Button>
          </div>
        </div>
      </Modal>
      </div>
    </Layout>
  )
}