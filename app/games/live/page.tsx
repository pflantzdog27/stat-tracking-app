'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions } from '@/hooks/usePermissions'
import { gameService, GameWithDetails } from '@/lib/services/game-service'
import { playerService } from '@/lib/services/player-service'
import { liveStatsService, StatEvent } from '@/lib/services/live-stats-service'
import { Player } from '@/types/database'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import GameScoreboard from '@/components/live/GameScoreboard'
import QuickPlayerGrid from '@/components/live/QuickPlayerGrid'
import PlayerSelector from '@/components/live/PlayerSelector'
import { GoalButton, AssistButton, ShotButton, PenaltyButton, HitButton, SaveButton } from '@/components/live/StatButton'
import UndoPanel from '@/components/live/UndoPanel'
import RecentEventsPanel from '@/components/live/RecentEventsPanel'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Select from '@/components/ui/Select'

export default function LiveStatsPage() {
  const { user, userTeams } = useAuth()
  const { canEditStats } = usePermissions()
  
  // State management
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [selectedGame, setSelectedGame] = useState<GameWithDetails | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [games, setGames] = useState<GameWithDetails[]>([])
  const [recentEvents, setRecentEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [addingEvent, setAddingEvent] = useState(false)
  const [error, setError] = useState('')

  // UI state
  const [activeTab, setActiveTab] = useState<'entry' | 'events' | 'undo'>('entry')
  const [showPlayerGrid, setShowPlayerGrid] = useState(true)

  // Real-time subscriptions
  const eventsSubscription = useRef<any>(null)
  const gameSubscription = useRef<any>(null)

  // Get user's coach/admin teams
  const coachTeams = userTeams.filter(tm => ['coach', 'admin'].includes(tm.role))

  useEffect(() => {
    if (coachTeams.length > 0 && !selectedTeam) {
      setSelectedTeam(coachTeams[0].teams.id)
    }
  }, [coachTeams, selectedTeam])

  useEffect(() => {
    if (selectedTeam) {
      loadTeamData()
    }
  }, [selectedTeam])

  useEffect(() => {
    if (selectedGame) {
      loadGameData()
      setupRealTimeSubscriptions()
    }
    
    return () => {
      cleanupSubscriptions()
    }
  }, [selectedGame])

  const loadTeamData = async () => {
    if (!selectedTeam) return

    try {
      setLoading(true)
      const [playersData, gamesData] = await Promise.all([
        playerService.getTeamPlayers(selectedTeam, true),
        gameService.getUpcomingGames(selectedTeam, 10)
      ])
      
      setPlayers(playersData)
      setGames(gamesData)
      
      // Select first in-progress game or upcoming game
      const inProgressGame = gamesData.find(g => g.status === 'in_progress')
      const upcomingGame = gamesData.find(g => g.status === 'scheduled')
      
      if (inProgressGame) {
        setSelectedGame(inProgressGame)
      } else if (upcomingGame) {
        setSelectedGame(upcomingGame)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team data')
    } finally {
      setLoading(false)
    }
  }

  const loadGameData = async () => {
    if (!selectedGame) return

    try {
      const events = await liveStatsService.getGameEvents(selectedGame.id, 20)
      setRecentEvents(events)
    } catch (err) {
      console.error('Error loading game events:', err)
    }
  }

  const setupRealTimeSubscriptions = () => {
    if (!selectedGame) return

    cleanupSubscriptions()

    // Subscribe to game events
    eventsSubscription.current = liveStatsService.subscribeToGameEvents(
      selectedGame.id,
      (payload) => {
        if (payload.eventType === 'INSERT') {
          loadGameData() // Reload events
        }
      }
    )

    // Subscribe to game updates
    gameSubscription.current = liveStatsService.subscribeToGameUpdates(
      selectedGame.id,
      (payload) => {
        if (payload.eventType === 'UPDATE') {
          setSelectedGame(prev => prev ? { ...prev, ...payload.new } : null)
        }
      }
    )
  }

  const cleanupSubscriptions = () => {
    if (eventsSubscription.current) {
      eventsSubscription.current.unsubscribe()
    }
    if (gameSubscription.current) {
      gameSubscription.current.unsubscribe()
    }
  }

  const handleStatEvent = async (eventType: StatEvent['eventType'], description?: string) => {
    if (!selectedPlayer || !selectedGame || !user || addingEvent) return

    setAddingEvent(true)
    setError('')

    try {
      const event: StatEvent = {
        playerId: selectedPlayer.id,
        eventType,
        period: selectedGame.period,
        timeInPeriod: selectedGame.time_remaining || '20:00',
        description
      }

      await liveStatsService.addStatEvent(selectedGame.id, user.id, event)
      
      // Update score for goals
      if (eventType === 'goal') {
        await liveStatsService.updateGameScore(
          selectedGame.id,
          selectedGame.final_score_us + 1,
          selectedGame.final_score_opponent
        )
      }

      // Clear player selection after certain events for quick re-entry
      if (['goal', 'penalty'].includes(eventType)) {
        setSelectedPlayer(null)
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add event')
    } finally {
      setAddingEvent(false)
    }
  }

  const handleScoreChange = async (ourScore: number, opponentScore: number) => {
    if (!selectedGame) return

    try {
      await liveStatsService.updateGameScore(selectedGame.id, ourScore, opponentScore)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update score')
    }
  }

  const handlePeriodChange = async (period: number) => {
    if (!selectedGame) return

    try {
      await liveStatsService.updateGamePeriod(selectedGame.id, period)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update period')
    }
  }

  const handleTimeChange = async (time: string) => {
    if (!selectedGame) return

    try {
      await liveStatsService.updateGamePeriod(selectedGame.id, selectedGame.period, time)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update time')
    }
  }

  const handleUndo = async () => {
    try {
      const undoneEvent = await liveStatsService.undoLastEvent()
      if (undoneEvent) {
        // If it was a goal, decrement score
        if (undoneEvent.eventData.eventType === 'goal') {
          await liveStatsService.updateGameScore(
            selectedGame!.id,
            Math.max(0, selectedGame!.final_score_us - 1),
            selectedGame!.final_score_opponent
          )
        }
        loadGameData()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to undo event')
    }
  }

  if (!canEditStats()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">You need coach or admin permissions to enter live stats.</p>
        </div>
      </div>
    )
  }

  if (coachTeams.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">No Teams Found</h2>
          <p className="mt-2 text-gray-600">You don't have coach or admin access to any teams.</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredPermissions={['edit_stats']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-900">Live Stats Entry</h1>
              
              {/* Team & Game Selection */}
              <div className="flex items-center space-x-4">
                {coachTeams.length > 1 && (
                  <Select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="text-sm"
                  >
                    {coachTeams.map((teamMember) => (
                      <option key={teamMember.teams.id} value={teamMember.teams.id}>
                        {teamMember.teams.name}
                      </option>
                    ))}
                  </Select>
                )}
                
                {games.length > 0 && (
                  <Select
                    value={selectedGame?.id || ''}
                    onChange={(e) => {
                      const game = games.find(g => g.id === e.target.value)
                      setSelectedGame(game || null)
                    }}
                    className="text-sm min-w-[200px]"
                  >
                    <option value="">Select Game</option>
                    {games.map((game) => (
                      <option key={game.id} value={game.id}>
                        vs {game.opponent} ({game.status})
                      </option>
                    ))}
                  </Select>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="large" />
            </div>
          ) : !selectedGame ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Select a game to start entering stats</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Scoreboard */}
              <GameScoreboard
                teamName={coachTeams.find(t => t.teams.id === selectedTeam)?.teams.name || 'Team'}
                opponent={selectedGame.opponent}
                ourScore={selectedGame.final_score_us}
                opponentScore={selectedGame.final_score_opponent}
                period={selectedGame.period}
                timeRemaining={selectedGame.time_remaining || '20:00'}
                onScoreChange={handleScoreChange}
                onPeriodChange={handlePeriodChange}
                onTimeChange={handleTimeChange}
                gameStatus={selectedGame.status}
              />

              {/* Tab Navigation */}
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('entry')}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'entry' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Stat Entry
                </button>
                <button
                  onClick={() => setActiveTab('events')}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'events' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Recent Events ({recentEvents.length})
                </button>
                <button
                  onClick={() => setActiveTab('undo')}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'undo' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Undo ({liveStatsService.getUndoStack().length})
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'entry' && (
                <div className="space-y-6">
                  {/* Player Selection Toggle */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">Select Player</h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowPlayerGrid(!showPlayerGrid)}
                    >
                      {showPlayerGrid ? 'Show Search' : 'Show Grid'}
                    </Button>
                  </div>

                  {/* Player Selection */}
                  {showPlayerGrid ? (
                    <QuickPlayerGrid
                      players={players}
                      onSelectPlayer={setSelectedPlayer}
                      selectedPlayer={selectedPlayer}
                    />
                  ) : (
                    <PlayerSelector
                      players={players}
                      selectedPlayer={selectedPlayer}
                      onSelectPlayer={setSelectedPlayer}
                    />
                  )}

                  {/* Stat Entry Buttons */}
                  {selectedPlayer && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-4">
                        Record Event for #{selectedPlayer.jersey_number} {selectedPlayer.first_name} {selectedPlayer.last_name}
                      </h3>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <GoalButton
                          label="Goal"
                          onClick={() => handleStatEvent('goal')}
                          loading={addingEvent}
                        />
                        <AssistButton
                          label="Assist"
                          onClick={() => handleStatEvent('assist')}
                          loading={addingEvent}
                        />
                        <ShotButton
                          label="Shot"
                          onClick={() => handleStatEvent('shot')}
                          loading={addingEvent}
                        />
                        <PenaltyButton
                          label="Penalty"
                          onClick={() => handleStatEvent('penalty')}
                          loading={addingEvent}
                        />
                        <HitButton
                          label="Hit"
                          onClick={() => handleStatEvent('hit')}
                          loading={addingEvent}
                        />
                        {selectedPlayer.position === 'G' && (
                          <SaveButton
                            label="Save"
                            onClick={() => handleStatEvent('save')}
                            loading={addingEvent}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'events' && (
                <RecentEventsPanel events={recentEvents} />
              )}

              {activeTab === 'undo' && (
                <UndoPanel
                  undoStack={liveStatsService.getUndoStack()}
                  onUndo={handleUndo}
                  onClearStack={() => liveStatsService.clearUndoStack()}
                  loading={addingEvent}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}