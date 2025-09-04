'use client'

import { useState } from 'react'
import { GameWithDetails } from '@/lib/services/game-service'
import Button from '@/components/ui/Button'
import { formatDate, formatTime } from '@/lib/utils/date'

interface GameListProps {
  games: GameWithDetails[]
  onEdit: (game: GameWithDetails) => void
  onDelete: (gameId: string) => void
  onStatusChange: (gameId: string, status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled') => void
  loading?: boolean
}

export default function GameList({ games, onEdit, onDelete, onStatusChange, loading = false }: GameListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [changingStatusId, setChangingStatusId] = useState<string | null>(null)

  const handleDelete = async (gameId: string) => {
    if (!confirm('Are you sure you want to delete this game? This action cannot be undone.')) {
      return
    }

    setDeletingId(gameId)
    try {
      await onDelete(gameId)
    } catch (error) {
      console.error('Error deleting game:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const handleStatusChange = async (gameId: string, newStatus: GameWithDetails['status']) => {
    setChangingStatusId(gameId)
    try {
      await onStatusChange(gameId, newStatus)
    } catch (error) {
      console.error('Error changing game status:', error)
    } finally {
      setChangingStatusId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusOptions = (currentStatus: string) => {
    const allStatuses = [
      { value: 'scheduled', label: 'Scheduled' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' }
    ]
    return allStatuses.filter(status => status.value !== currentStatus)
  }

  if (games.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">No games found</div>
        <p className="text-gray-400">Create your first game to get started.</p>
      </div>
    )
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {games.map((game) => (
          <li key={game.id} className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      vs {game.opponent}
                    </h3>
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                      <span>{formatDate(game.game_date)}</span>
                      <span>{formatTime(game.game_date)}</span>
                      <span>{game.location}</span>
                      <span className="capitalize">{game.game_type}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getStatusColor(game.status)}`}>
                      {game.status.replace('_', ' ')}
                    </span>
                    {game.status === 'completed' && (
                      <span className="text-sm font-medium text-gray-900">
                        {game.final_score_us} - {game.final_score_opponent}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="ml-4 flex items-center space-x-2">
                {/* Status Change Dropdown */}
                <select
                  value=""
                  onChange={(e) => handleStatusChange(game.id, e.target.value as any)}
                  disabled={changingStatusId === game.id || loading}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Change Status</option>
                  {getStatusOptions(game.status).map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onEdit(game)}
                  disabled={loading}
                >
                  Edit
                </Button>

                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(game.id)}
                  loading={deletingId === game.id}
                  disabled={loading || game.status === 'completed'}
                >
                  Delete
                </Button>
              </div>
            </div>

            {/* Additional game info for mobile */}
            <div className="mt-3 sm:hidden">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{game.game_type}</span>
                {game.status === 'completed' && (
                  <span className="font-medium">
                    Score: {game.final_score_us} - {game.final_score_opponent}
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}