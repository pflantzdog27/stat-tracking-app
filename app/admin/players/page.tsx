'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { playerService, PlayerFormData } from '@/lib/services/player-service'
import { Player } from '@/types/database'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import PlayerForm from '@/components/admin/PlayerForm'
import PlayerList from '@/components/admin/PlayerList'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function PlayerManagementPage() {
  const { user, userTeams } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<string>('')
  const [showInactive, setShowInactive] = useState(false)

  // Get user's admin teams
  const adminTeams = userTeams.filter(tm => tm.role === 'admin')

  useEffect(() => {
    if (adminTeams.length > 0 && !selectedTeam) {
      setSelectedTeam(adminTeams[0].teams.id)
    }
  }, [adminTeams, selectedTeam])

  useEffect(() => {
    if (selectedTeam) {
      loadPlayers()
    }
  }, [selectedTeam])

  const loadPlayers = async () => {
    if (!selectedTeam) return

    try {
      setLoading(true)
      setError('')
      const playersData = await playerService.getTeamPlayers(selectedTeam, false) // Get all players
      setPlayers(playersData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load players')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePlayer = async (playerData: PlayerFormData) => {
    try {
      const newPlayer = await playerService.createPlayer(selectedTeam, playerData)
      setPlayers(prev => [...prev, newPlayer].sort((a, b) => a.jersey_number - b.jersey_number))
      setShowCreateModal(false)
    } catch (error) {
      throw error
    }
  }

  const handleEditPlayer = async (playerData: PlayerFormData) => {
    if (!editingPlayer) return

    try {
      const updatedPlayer = await playerService.updatePlayer(editingPlayer.id, playerData)
      setPlayers(prev => 
        prev.map(player => 
          player.id === editingPlayer.id ? updatedPlayer : player
        ).sort((a, b) => a.jersey_number - b.jersey_number)
      )
      setEditingPlayer(null)
    } catch (error) {
      throw error
    }
  }

  const handleDeactivatePlayer = async (playerId: string) => {
    try {
      const updatedPlayer = await playerService.deactivatePlayer(playerId)
      setPlayers(prev => 
        prev.map(player => 
          player.id === playerId ? updatedPlayer : player
        )
      )
    } catch (error) {
      console.error('Error deactivating player:', error)
      throw error
    }
  }

  const handleReactivatePlayer = async (playerId: string) => {
    try {
      const updatedPlayer = await playerService.reactivatePlayer(playerId)
      setPlayers(prev => 
        prev.map(player => 
          player.id === playerId ? updatedPlayer : player
        )
      )
    } catch (error) {
      console.error('Error reactivating player:', error)
      throw error
    }
  }

  const handleDeletePlayer = async (playerId: string) => {
    try {
      await playerService.deletePlayer(playerId)
      setPlayers(prev => prev.filter(player => player.id !== playerId))
    } catch (error) {
      console.error('Error deleting player:', error)
      throw error
    }
  }

  const openEditModal = (player: Player) => {
    setEditingPlayer(player)
  }

  const closeEditModal = () => {
    setEditingPlayer(null)
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

  const activeCount = players.filter(p => p.active).length
  const inactiveCount = players.filter(p => !p.active).length

  return (
    <ProtectedRoute requiredPermissions={['admin_access']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Player Management</h1>
                <p className="text-gray-600 mt-1">Manage your team roster</p>
              </div>
              <Button onClick={() => setShowCreateModal(true)}>
                Add New Player
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

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-blue-600">{activeCount}</div>
              <div className="text-sm text-gray-600">Active Players</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-gray-600">{inactiveCount}</div>
              <div className="text-sm text-gray-600">Inactive Players</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-green-600">{players.length}</div>
              <div className="text-sm text-gray-600">Total Players</div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Show inactive players ({inactiveCount})
                </span>
              </label>
            </div>
          </div>

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
            <PlayerList
              players={players}
              onEdit={openEditModal}
              onDeactivate={handleDeactivatePlayer}
              onReactivate={handleReactivatePlayer}
              onDelete={handleDeletePlayer}
              loading={loading}
              showInactive={showInactive}
            />
          )}
        </div>

        {/* Create Player Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Add New Player"
          maxWidth="xl"
        >
          <PlayerForm
            teamId={selectedTeam}
            onSubmit={handleCreatePlayer}
            onCancel={() => setShowCreateModal(false)}
            submitLabel="Add Player"
          />
        </Modal>

        {/* Edit Player Modal */}
        <Modal
          isOpen={!!editingPlayer}
          onClose={closeEditModal}
          title="Edit Player"
          maxWidth="xl"
        >
          {editingPlayer && (
            <PlayerForm
              teamId={selectedTeam}
              initialData={{
                firstName: editingPlayer.first_name,
                lastName: editingPlayer.last_name,
                jerseyNumber: editingPlayer.jersey_number,
                position: editingPlayer.position as 'F' | 'D' | 'G',
                birthDate: editingPlayer.birth_date || ''
              }}
              onSubmit={handleEditPlayer}
              onCancel={closeEditModal}
              submitLabel="Update Player"
            />
          )}
        </Modal>
      </div>
    </ProtectedRoute>
  )
}