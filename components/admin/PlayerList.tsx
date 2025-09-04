'use client'

import { useState } from 'react'
import { Player } from '@/types/database'
import Button from '@/components/ui/Button'

interface PlayerListProps {
  players: Player[]
  onEdit: (player: Player) => void
  onDeactivate: (playerId: string) => void
  onReactivate: (playerId: string) => void
  onDelete: (playerId: string) => void
  loading?: boolean
  showInactive?: boolean
}

export default function PlayerList({ 
  players, 
  onEdit, 
  onDeactivate, 
  onReactivate, 
  onDelete, 
  loading = false,
  showInactive = false
}: PlayerListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [changingStatusId, setChangingStatusId] = useState<string | null>(null)

  const handleDelete = async (playerId: string, playerName: string) => {
    if (!confirm(`Are you sure you want to permanently delete ${playerName}? This action cannot be undone.`)) {
      return
    }

    setDeletingId(playerId)
    try {
      await onDelete(playerId)
    } catch (error) {
      console.error('Error deleting player:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const handleStatusChange = async (playerId: string, activate: boolean) => {
    setChangingStatusId(playerId)
    try {
      if (activate) {
        await onReactivate(playerId)
      } else {
        await onDeactivate(playerId)
      }
    } catch (error) {
      console.error('Error changing player status:', error)
    } finally {
      setChangingStatusId(null)
    }
  }

  const getPositionLabel = (position: string | null) => {
    switch (position) {
      case 'F':
        return 'Forward'
      case 'D':
        return 'Defense'
      case 'G':
        return 'Goalie'
      default:
        return 'Unknown'
    }
  }

  const getPositionColor = (position: string | null) => {
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

  const filteredPlayers = showInactive ? players : players.filter(p => p.active)

  if (filteredPlayers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">
          {showInactive ? 'No inactive players found' : 'No active players found'}
        </div>
        <p className="text-gray-400">
          {showInactive 
            ? 'All your players are currently active.' 
            : 'Add your first player to get started.'
          }
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {filteredPlayers.map((player) => (
          <li key={player.id} className={`px-6 py-4 ${!player.active ? 'bg-gray-50' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-500 text-white font-medium text-sm">
                      #{player.jersey_number}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {player.first_name} {player.last_name}
                      </h3>
                      {!player.active && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPositionColor(player.position)}`}>
                        {getPositionLabel(player.position)}
                      </span>
                      {player.birth_date && (
                        <span>
                          Born: {new Date(player.birth_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="ml-4 flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onEdit(player)}
                  disabled={loading}
                >
                  Edit
                </Button>

                {player.active ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStatusChange(player.id, false)}
                    loading={changingStatusId === player.id}
                    disabled={loading}
                  >
                    Deactivate
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleStatusChange(player.id, true)}
                    loading={changingStatusId === player.id}
                    disabled={loading}
                  >
                    Reactivate
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(player.id, `${player.first_name} ${player.last_name}`)}
                  loading={deletingId === player.id}
                  disabled={loading || player.active}
                >
                  Delete
                </Button>
              </div>
            </div>

            {/* Mobile view additional info */}
            <div className="mt-3 sm:hidden">
              <div className="text-sm text-gray-500">
                Jersey #{player.jersey_number} • {getPositionLabel(player.position)}
                {player.birth_date && (
                  <span> • Born {new Date(player.birth_date).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}