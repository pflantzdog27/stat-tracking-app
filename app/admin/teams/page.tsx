'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { teamService, TeamFormData, TeamWithStats } from '@/lib/services/team-service'
import { playerService, PlayerFormData } from '@/lib/services/player-service'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import TeamForm from '@/components/admin/TeamForm'
import TeamList from '@/components/admin/TeamList'
import TeamPlayerManagement from '@/components/admin/TeamPlayerManagement'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function TeamManagementPage() {
  const { user } = useAuth()
  const [teams, setTeams] = useState<TeamWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState<TeamWithStats | null>(null)
  const [managingPlayersTeam, setManagingPlayersTeam] = useState<TeamWithStats | null>(null)

  useEffect(() => {
    if (user) {
      loadTeams()
    }
  }, [user])

  const loadTeams = async () => {
    try {
      setLoading(true)
      setError('')
      
      if (!user?.id) {
        console.log('No user ID available')
        setTeams([])
        return
      }
      
      console.log('Loading teams for user:', user.id)
      
      // Use the API endpoint which handles authentication properly
      const response = await fetch('/api/teams')
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch teams')
      }
      
      const { teams: allTeams } = await response.json()
      console.log('Fetched teams:', allTeams)
      
      // Filter teams created by the current user
      const userTeams = allTeams.filter((team: any) => team.created_by === user.id)
      console.log('User teams:', userTeams)
      
      setTeams(userTeams)
    } catch (err) {
      console.error('Error loading teams:', err)
      setError(err instanceof Error ? err.message : 'Failed to load teams')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTeam = async (teamData: TeamFormData) => {
    try {
      const newTeam = await teamService.createTeam(teamData)
      setShowCreateModal(false)
      // Refresh the teams list
      await loadTeams()
    } catch (error) {
      throw error
    }
  }

  const handleEditTeam = async (teamData: TeamFormData) => {
    if (!editingTeam) return

    try {
      const updatedTeam = await teamService.updateTeam(editingTeam.id, teamData)
      setTeams(prev => 
        prev.map(team => 
          team.id === editingTeam.id ? updatedTeam : team
        ).sort((a, b) => a.name.localeCompare(b.name))
      )
      setEditingTeam(null)
    } catch (error) {
      throw error
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    try {
      await teamService.deleteTeam(teamId)
      // Refresh the teams list
      await loadTeams()
    } catch (error) {
      console.error('Error deleting team:', error)
      throw error
    }
  }

  const openEditModal = (team: TeamWithStats) => {
    setEditingTeam(team)
  }

  const closeEditModal = () => {
    setEditingTeam(null)
  }

  const openManagePlayersModal = (team: TeamWithStats) => {
    setManagingPlayersTeam(team)
  }

  const closeManagePlayersModal = () => {
    setManagingPlayersTeam(null)
  }

  return (
    <ProtectedRoute requiredPermissions={['admin_access']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
                <p className="text-gray-600 mt-1">Manage your teams and settings</p>
              </div>
              <Button onClick={() => setShowCreateModal(true)}>
                Create New Team
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-blue-600">{teams.length}</div>
              <div className="text-sm text-gray-600">Teams Managed</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-green-600">
                {teams.filter(t => t.season === '2024-25').length}
              </div>
              <div className="text-sm text-gray-600">Current Season</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(teams.map(t => t.division).filter(Boolean)).size}
              </div>
              <div className="text-sm text-gray-600">Divisions</div>
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
            <TeamList
              teams={teams}
              onEdit={openEditModal}
              onDelete={handleDeleteTeam}
              onManagePlayers={openManagePlayersModal}
              loading={loading}
            />
          )}
        </div>

        {/* Create Team Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Team"
          maxWidth="xl"
        >
          <TeamForm
            onSubmit={handleCreateTeam}
            onCancel={() => setShowCreateModal(false)}
            submitLabel="Create Team"
          />
        </Modal>

        {/* Edit Team Modal */}
        <Modal
          isOpen={!!editingTeam}
          onClose={closeEditModal}
          title="Edit Team"
          maxWidth="xl"
        >
          {editingTeam && (
            <TeamForm
              initialData={{
                name: editingTeam.name,
                season: editingTeam.season,
                division: editingTeam.division || ''
              }}
              onSubmit={handleEditTeam}
              onCancel={closeEditModal}
              submitLabel="Update Team"
            />
          )}
        </Modal>

        {/* Manage Players Modal */}
        <Modal
          isOpen={!!managingPlayersTeam}
          onClose={closeManagePlayersModal}
          title={`Manage Players - ${managingPlayersTeam?.name || ''}`}
          maxWidth="4xl"
        >
          {managingPlayersTeam && (
            <TeamPlayerManagement
              team={managingPlayersTeam}
              onClose={closeManagePlayersModal}
            />
          )}
        </Modal>
      </div>
    </ProtectedRoute>
  )
}