'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { teamService } from '@/lib/services/team-service'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Layout from '@/components/layout/Layout'

interface Game {
  id: string
  team_id: string
  opponent: string
  game_date: string
  is_home: boolean
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  final_score_us?: number
  final_score_them?: number
  teams?: {
    name: string
    season: string
  }
}

interface Team {
  id: string
  name: string
  season: string
}

export default function GamesPage() {
  const { user } = useAuth()
  const [games, setGames] = useState<Game[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [selectedTeam, setSelectedTeam] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingGame, setEditingGame] = useState<Game | null>(null)
  const [createGameLoading, setCreateGameLoading] = useState(false)
  const [editGameLoading, setEditGameLoading] = useState(false)
  const [deleteGameLoading, setDeleteGameLoading] = useState(false)
  const [formData, setFormData] = useState({
    teamId: '',
    opponent: '',
    gameDate: '',
    gameTime: '',
    isHome: true
  })
  const [editFormData, setEditFormData] = useState({
    opponent: '',
    gameDate: '',
    gameTime: '',
    isHome: true
  })

  useEffect(() => {
    if (user) {
      loadTeamsAndGames()
    }
  }, [user])

  const loadTeamsAndGames = async () => {
    try {
      setLoading(true)
      
      // Load user's teams
      const response = await fetch('/api/teams')
      if (!response.ok) {
        throw new Error('Failed to fetch teams')
      }
      const { teams: allTeams } = await response.json()
      const userTeams = allTeams.filter((team: any) => team.created_by === user?.id)
      setTeams(userTeams)
      
      // Load games for all user teams
      await loadGames()
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadGames = async (teamId?: string) => {
    try {
      const url = teamId ? `/api/games?teamId=${teamId}` : '/api/games'
      console.log('Loading games from:', url)
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch games')
      }
      const { games } = await response.json()
      console.log('Loaded games:', games.length, games)
      setGames(games || [])
    } catch (error) {
      console.error('Error loading games:', error)
      setGames([])
    }
  }

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.teamId || !formData.opponent || !formData.gameDate) {
      alert('Please fill in all required fields')
      return
    }
    
    try {
      setCreateGameLoading(true)
      
      // Combine date and time
      let gameDateTime = formData.gameDate
      if (formData.gameTime) {
        gameDateTime = `${formData.gameDate}T${formData.gameTime}:00`
      } else {
        gameDateTime = `${formData.gameDate}T20:00:00` // Default to 8 PM
      }
      
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId: formData.teamId,
          opponent: formData.opponent,
          gameDate: gameDateTime,
          isHome: formData.isHome
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create game')
      }
      
      // Reset form and close modal
      setFormData({
        teamId: '',
        opponent: '',
        gameDate: '',
        gameTime: '',
        isHome: true
      })
      setShowCreateModal(false)
      
      // Reload games
      await loadGames()
    } catch (error) {
      console.error('Error creating game:', error)
      alert('Failed to create game. Please try again.')
    } finally {
      setCreateGameLoading(false)
    }
  }

  const handleEditGame = (game: Game) => {
    setEditingGame(game)
    
    // Handle date-only strings properly to avoid timezone issues
    let dateTime
    let dateStr = ''
    let timeStr = '20:00' // Default to 8 PM
    
    if (game.game_date) {
      if (game.game_date.includes('T')) {
        // Full datetime string
        dateTime = new Date(game.game_date)
        const year = dateTime.getFullYear()
        const month = String(dateTime.getMonth() + 1).padStart(2, '0')
        const day = String(dateTime.getDate()).padStart(2, '0')
        dateStr = `${year}-${month}-${day}`
        
        const hours = String(dateTime.getHours()).padStart(2, '0')
        const minutes = String(dateTime.getMinutes()).padStart(2, '0')
        timeStr = `${hours}:${minutes}`
      } else {
        // Date-only string - don't convert through Date object to avoid timezone issues
        dateStr = game.game_date
        // Keep default time of 20:00 (8 PM)
      }
    }
    
    setEditFormData({
      opponent: game.opponent,
      gameDate: dateStr,
      gameTime: timeStr,
      isHome: game.is_home
    })
    setShowEditModal(true)
  }

  const handleUpdateGame = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingGame || !editFormData.opponent || !editFormData.gameDate) {
      alert('Please fill in all required fields')
      return
    }
    
    try {
      setEditGameLoading(true)
      
      // Combine date and time
      let gameDateTime = editFormData.gameDate
      if (editFormData.gameTime) {
        gameDateTime = `${editFormData.gameDate}T${editFormData.gameTime}:00`
      } else {
        gameDateTime = `${editFormData.gameDate}T20:00:00` // Default to 8 PM
      }
      
      const response = await fetch(`/api/games/${editingGame.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          opponent: editFormData.opponent,
          game_date: gameDateTime,
          is_home: editFormData.isHome
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update game')
      }
      
      // Reset form and close modal
      setEditFormData({
        opponent: '',
        gameDate: '',
        gameTime: '',
        isHome: true
      })
      setEditingGame(null)
      setShowEditModal(false)
      
      // Reload games to reflect changes
      await loadGames()
      alert('Game updated successfully!')
    } catch (error) {
      console.error('Error updating game:', error)
      alert('Failed to update game. Please try again.')
    } finally {
      setEditGameLoading(false)
    }
  }

  const handleDeleteGame = (game: Game) => {
    setEditingGame(game)
    setShowDeleteModal(true)
  }

  const confirmDeleteGame = async () => {
    if (!editingGame) return
    
    try {
      setDeleteGameLoading(true)
      
      const response = await fetch(`/api/games/${editingGame.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete game')
      }
      
      // Close modal and reload games
      setEditingGame(null)
      setShowDeleteModal(false)
      await loadGames()
      alert('Game deleted successfully!')
    } catch (error) {
      console.error('Error deleting game:', error)
      alert('Failed to delete game. Please try again.')
    } finally {
      setDeleteGameLoading(false)
    }
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

  const filteredGames = games.filter(game => {
    // Filter by status
    if (filter !== 'all' && game.status !== filter) return false
    
    // Filter by team
    if (selectedTeam !== 'all' && game.team_id !== selectedTeam) return false
    
    return true
  })

  const formatDate = (dateString: string) => {
    // Handle date-only strings properly to avoid timezone issues
    let date
    if (dateString.includes('T')) {
      // Full datetime
      date = new Date(dateString)
    } else {
      // Date-only string - parse manually to avoid timezone conversion
      const [year, month, day] = dateString.split('-').map(Number)
      date = new Date(year, month - 1, day)
    }
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const formatTime = (dateTimeString: string) => {
    if (dateTimeString.includes('T')) {
      // Full datetime string
      const date = new Date(dateTimeString)
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } else {
      // Date-only string - return default time
      return '8:00 PM'
    }
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

  return (
    <Layout>
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Games</h1>
              <p className="text-gray-600 mt-1">All games for your teams</p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={() => setShowCreateModal(true)}>
                Create Game
              </Button>
              <Link
                href="/games/live"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium"
              >
                Live Stats Entry
              </Link>
              <Link
                href="/dashboard"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Team:
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">All Teams</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.season})
                  </option>
                ))}
              </select>
            </div>
            
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status:
              </label>
              <div className="flex space-x-4">
                {[
                  { key: 'all', label: 'All Games' },
                  { key: 'scheduled', label: 'Scheduled' },
                  { key: 'in_progress', label: 'Live' },
                  { key: 'completed', label: 'Completed' }
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setFilter(option.key)}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      filter === option.key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Games List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="space-y-4">
          {filteredGames.map((game) => (
            <div key={game.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  {/* Game Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      {/* Status Badge */}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(game.status)}`}>
                        {game.status.charAt(0).toUpperCase() + game.status.slice(1)}
                      </span>
                      
                      {/* Date and Time */}
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{formatDate(game.game_date)}</span>
                        <span className="ml-2">{formatTime(game.game_date)}</span>
                      </div>
                    </div>

                    {/* Teams */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-8">
                          {/* Your Team */}
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-white">US</span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {game.teams?.name || 'Your Team'}
                              </div>
                              {game.status === 'completed' && (
                                <div className="text-2xl font-bold text-gray-900">{game.final_score_us}</div>
                              )}
                              {game.status === 'in_progress' && (
                                <div className="text-2xl font-bold text-red-600">{game.final_score_us || 0}</div>
                              )}
                            </div>
                          </div>

                          {/* VS or Score */}
                          <div className="text-center">
                            {game.status === 'scheduled' ? (
                              <div className="text-gray-400 font-medium">VS</div>
                            ) : (
                              <div className="text-gray-400 font-medium">-</div>
                            )}
                          </div>

                          {/* Opponent */}
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold">OPP</span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{game.opponent}</div>
                              {game.status === 'completed' && (
                                <div className="text-2xl font-bold text-gray-900">{game.final_score_them}</div>
                              )}
                              {game.status === 'in_progress' && (
                                <div className="text-2xl font-bold text-red-600">{game.final_score_them || 0}</div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Home/Away */}
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Venue</div>
                          <div className="text-sm font-medium text-gray-900">
                            {game.is_home ? 'Home' : 'Away'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="ml-6 flex space-x-3">
                    {game.status === 'completed' && (
                      <Link
                        href={`/games/${game.id}`}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                      >
                        View Recap
                      </Link>
                    )}
                    {game.status === 'in_progress' && (
                      <>
                        <Link
                          href={`/games/${game.id}`}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-md text-sm font-medium"
                        >
                          Watch Live
                        </Link>
                        <Link
                          href={`/games/live?gameId=${game.id}`}
                          className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-md text-sm font-medium"
                        >
                          Enter Stats
                        </Link>
                      </>
                    )}
                    {game.status === 'scheduled' && (
                      <>
                        <Link
                          href={`/games/${game.id}`}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-md text-sm font-medium"
                        >
                          Preview
                        </Link>
                        <button
                          onClick={() => handleEditGame(game)}
                          className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-2 rounded-md text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteGame(game)}
                          className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-md text-sm font-medium"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Game Result Summary */}
                {game.status === 'completed' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      {(game.final_score_us || 0) > (game.final_score_them || 0) ? 'Won' : 'Lost'} {game.final_score_us || 0}-{game.final_score_them || 0}
                    </div>
                  </div>
                )}

                {/* Live Game Info */}
                {game.status === 'in_progress' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                      <span className="inline-flex items-center">
                        <span className="animate-pulse h-2 w-2 bg-red-500 rounded-full mr-2"></span>
                        <span className="text-sm font-medium text-red-600">LIVE</span>
                      </span>
                      <span className="text-sm text-gray-600">Game in progress</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredGames.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No games found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Create Game Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Game"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateGame} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team *
            </label>
            <select
              required
              value={formData.teamId}
              onChange={(e) => setFormData(prev => ({ ...prev, teamId: e.target.value }))}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select a team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name} ({team.season})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Opponent *
            </label>
            <input
              type="text"
              required
              value={formData.opponent}
              onChange={(e) => setFormData(prev => ({ ...prev, opponent: e.target.value }))}
              placeholder="e.g., Sudbury Wolves"
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Game Date *
              </label>
              <input
                type="date"
                required
                value={formData.gameDate}
                onChange={(e) => setFormData(prev => ({ ...prev, gameDate: e.target.value }))}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Game Time
              </label>
              <input
                type="time"
                value={formData.gameTime}
                onChange={(e) => setFormData(prev => ({ ...prev, gameTime: e.target.value }))}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="19:00"
              />
              <p className="text-xs text-gray-500 mt-1">Defaults to 8:00 PM if not specified</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Home or Away
            </label>
            <select
              value={formData.isHome.toString()}
              onChange={(e) => setFormData(prev => ({ ...prev, isHome: e.target.value === 'true' }))}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="true">Home Game</option>
              <option value="false">Away Game</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              disabled={createGameLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createGameLoading}
            >
              {createGameLoading ? (
                <>
                  <LoadingSpinner size="small" />
                  <span className="ml-2">Creating...</span>
                </>
              ) : (
                'Create Game'
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Game Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingGame(null)
          setEditFormData({
            opponent: '',
            gameDate: '',
            gameTime: '',
            isHome: true
          })
        }}
        title={`Edit Game: ${editingGame?.teams?.name || 'Team'} vs ${editingGame?.opponent || ''}`}
        maxWidth="lg"
      >
        <form onSubmit={handleUpdateGame} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Opponent *
            </label>
            <input
              type="text"
              required
              value={editFormData.opponent}
              onChange={(e) => setEditFormData(prev => ({ ...prev, opponent: e.target.value }))}
              placeholder="e.g., Sudbury Wolves"
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Game Date *
              </label>
              <input
                type="date"
                required
                value={editFormData.gameDate}
                onChange={(e) => setEditFormData(prev => ({ ...prev, gameDate: e.target.value }))}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Game Time
              </label>
              <input
                type="time"
                value={editFormData.gameTime}
                onChange={(e) => setEditFormData(prev => ({ ...prev, gameTime: e.target.value }))}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty to keep current time</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Home or Away
            </label>
            <select
              value={editFormData.isHome.toString()}
              onChange={(e) => setEditFormData(prev => ({ ...prev, isHome: e.target.value === 'true' }))}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="true">Home Game</option>
              <option value="false">Away Game</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowEditModal(false)
                setEditingGame(null)
                setEditFormData({
                  opponent: '',
                  gameDate: '',
                  gameTime: '',
                  isHome: true
                })
              }}
              disabled={editGameLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={editGameLoading}
            >
              {editGameLoading ? (
                <>
                  <LoadingSpinner size="small" />
                  <span className="ml-2">Updating...</span>
                </>
              ) : (
                'Update Game'
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setEditingGame(null)
        }}
        title="Delete Game"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete this game?
          </p>
          {editingGame && (
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-sm text-gray-600">
                <div><strong>Team:</strong> {editingGame.teams?.name}</div>
                <div><strong>Opponent:</strong> {editingGame.opponent}</div>
                <div><strong>Date:</strong> {formatDate(editingGame.game_date)}</div>
                <div><strong>Venue:</strong> {editingGame.is_home ? 'Home' : 'Away'}</div>
              </div>
            </div>
          )}
          <p className="text-sm text-red-600">
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false)
                setEditingGame(null)
              }}
              disabled={deleteGameLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteGame}
              disabled={deleteGameLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteGameLoading ? (
                <>
                  <LoadingSpinner size="small" />
                  <span className="ml-2">Deleting...</span>
                </>
              ) : (
                'Delete Game'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}