'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { gameService, GameWithDetails, GameFormData } from '@/lib/services/game-service'
import { formatDateForInput, formatTimeForInput } from '@/lib/utils/date'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import GameForm from '@/components/admin/GameForm'
import GameList from '@/components/admin/GameList'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function GameManagementPage() {
  const { user, userTeams } = useAuth()
  const [games, setGames] = useState<GameWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingGame, setEditingGame] = useState<GameWithDetails | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<string>('')

  // Get user's admin teams
  const adminTeams = userTeams.filter(tm => tm.role === 'admin')

  useEffect(() => {
    if (adminTeams.length > 0 && !selectedTeam) {
      setSelectedTeam(adminTeams[0].teams.id)
    }
  }, [adminTeams, selectedTeam])

  useEffect(() => {
    if (selectedTeam) {
      loadGames()
    }
  }, [selectedTeam])

  const loadGames = async () => {
    if (!selectedTeam) return

    try {
      setLoading(true)
      setError('')
      const gamesData = await gameService.getTeamGames(selectedTeam)
      setGames(gamesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load games')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGame = async (gameData: GameFormData) => {
    try {
      const newGame = await gameService.createGame(selectedTeam, gameData)
      setGames(prev => [newGame, ...prev])
      setShowCreateModal(false)
    } catch (error) {
      throw error
    }
  }

  const handleEditGame = async (gameData: GameFormData) => {
    if (!editingGame) return

    try {
      const updatedGame = await gameService.updateGame(editingGame.id, gameData)
      setGames(prev => prev.map(game => 
        game.id === editingGame.id ? updatedGame : game
      ))
      setEditingGame(null)
    } catch (error) {
      throw error
    }
  }

  const handleDeleteGame = async (gameId: string) => {
    try {
      await gameService.deleteGame(gameId)
      setGames(prev => prev.filter(game => game.id !== gameId))
    } catch (error) {
      console.error('Error deleting game:', error)
      throw error
    }
  }

  const handleStatusChange = async (gameId: string, status: GameWithDetails['status']) => {
    try {
      const updatedGame = await gameService.updateGameStatus(gameId, status)
      setGames(prev => prev.map(game => 
        game.id === gameId ? updatedGame : game
      ))
    } catch (error) {
      console.error('Error updating game status:', error)
      throw error
    }
  }

  const openEditModal = (game: GameWithDetails) => {
    setEditingGame(game)
  }

  const closeEditModal = () => {
    setEditingGame(null)
  }

  if (adminTeams.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">No Admin Access</h2>
          <p className="mt-2 text-gray-600">You don't have administrator privileges for any teams.</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredPermissions={['admin_access']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Game Management</h1>
                <p className="text-gray-600 mt-1">Create and manage games for your team</p>
              </div>
              <Button onClick={() => setShowCreateModal(true)}>
                Create New Game
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Team Selection */}
          {adminTeams.length > 1 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Team
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="block w-full max-w-sm px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {adminTeams.map((teamMember) => (
                  <option key={teamMember.teams.id} value={teamMember.teams.id}>
                    {teamMember.teams.name} ({teamMember.teams.season})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="large" />
            </div>
          ) : (
            <GameList
              games={games}
              onEdit={openEditModal}
              onDelete={handleDeleteGame}
              onStatusChange={handleStatusChange}
              loading={loading}
            />
          )}
        </div>

        {/* Create Game Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Game"
          maxWidth="xl"
        >
          <GameForm
            onSubmit={handleCreateGame}
            onCancel={() => setShowCreateModal(false)}
            submitLabel="Create Game"
          />
        </Modal>

        {/* Edit Game Modal */}
        <Modal
          isOpen={!!editingGame}
          onClose={closeEditModal}
          title="Edit Game"
          maxWidth="xl"
        >
          {editingGame && (
            <GameForm
              initialData={{
                opponent: editingGame.opponent,
                gameDate: formatDateForInput(editingGame.game_date),
                gameTime: formatTimeForInput(editingGame.game_date),
                location: editingGame.location,
                gameType: editingGame.game_type
              }}
              onSubmit={handleEditGame}
              onCancel={closeEditModal}
              submitLabel="Update Game"
            />
          )}
        </Modal>
      </div>
    </ProtectedRoute>
  )
}