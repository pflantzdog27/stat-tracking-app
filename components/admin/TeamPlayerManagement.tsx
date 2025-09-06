'use client'

import { useState, useEffect } from 'react'
import { TeamWithStats } from '@/lib/services/team-service'
import { playerService, PlayerFormData } from '@/lib/services/player-service'
import { Database } from '@/types/database'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

type Player = Database['public']['Tables']['players']['Row']

interface TeamPlayerManagementProps {
  team: TeamWithStats
  onClose: () => void
}

interface AddPlayerFormData {
  firstName: string
  lastName: string
  jerseyNumber: string
  position: 'F' | 'D' | 'G'
  birthDate: string
}

export default function TeamPlayerManagement({ team, onClose }: TeamPlayerManagementProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addPlayerLoading, setAddPlayerLoading] = useState(false)
  const [formData, setFormData] = useState<AddPlayerFormData>({
    firstName: '',
    lastName: '',
    jerseyNumber: '',
    position: 'F',
    birthDate: ''
  })

  useEffect(() => {
    loadPlayers()
  }, [team.id])

  const loadPlayers = async () => {
    try {
      setLoading(true)
      const teamPlayers = await playerService.getTeamPlayers(team.id, false) // Get all players, not just active
      setPlayers(teamPlayers)
    } catch (error) {
      console.error('Error loading players:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setAddPlayerLoading(true)
      
      const playerData: PlayerFormData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        jerseyNumber: parseInt(formData.jerseyNumber),
        position: formData.position,
        birthDate: formData.birthDate || undefined
      }

      await playerService.createPlayer(team.id, playerData)
      
      // Reset form and reload players
      setFormData({
        firstName: '',
        lastName: '',
        jerseyNumber: '',
        position: 'F',
        birthDate: ''
      })
      setShowAddForm(false)
      await loadPlayers()
    } catch (error) {
      console.error('Error adding player:', error)
      alert('Failed to add player. Please try again.')
    } finally {
      setAddPlayerLoading(false)
    }
  }

  const getPositionName = (pos: string) => {
    switch (pos) {
      case 'F': return 'Forward'
      case 'D': return 'Defense'
      case 'G': return 'Goalie'
      default: return pos
    }
  }

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'F':
        return 'bg-blue-100 text-blue-800'
      case 'D':
        return 'bg-green-100 text-green-800'
      case 'G':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      {/* Header with Add Player Button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Team Roster</h3>
          <p className="text-sm text-gray-600">{players.length} players</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          disabled={loading}
        >
          {showAddForm ? 'Cancel' : 'Add Player'}
        </Button>
      </div>

      {/* Add Player Form */}
      {showAddForm && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <form onSubmit={handleAddPlayer} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jersey Number *
                </label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  required
                  value={formData.jerseyNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, jerseyNumber: e.target.value }))}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position *
                </label>
                <select
                  required
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value as 'F' | 'D' | 'G' }))}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="F">Forward</option>
                  <option value="D">Defense</option>
                  <option value="G">Goalie</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Birth Date
                </label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddForm(false)}
                disabled={addPlayerLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addPlayerLoading}
              >
                {addPlayerLoading ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span className="ml-2">Adding...</span>
                  </>
                ) : (
                  'Add Player'
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Players List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="large" />
        </div>
      ) : players.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No players yet</h3>
            <p className="text-gray-600">Add your first player to get started.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {players.map((player) => (
            <div key={player.id} className="bg-white border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-700">
                        #{player.jersey_number}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      {player.first_name} {player.last_name}
                    </h4>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPositionColor(player.position || 'F')}`}>
                        {getPositionName(player.position || 'F')}
                      </span>
                      {!player.active && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                      {player.birth_date && (
                        <span className="text-sm text-gray-500">
                          Born: {new Date(player.birth_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  )
}