'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface Player {
  id: string
  name: string
  position: string
  jersey_number: number
  games_played: number
  goals: number
  assists: number
  points: number
  shots: number
  shooting_percentage: number
  plus_minus: number
  penalty_minutes: number
}

export default function PlayersPage() {
  const { user } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPosition, setSelectedPosition] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('points')

  useEffect(() => {
    // Simulate loading player data
    setTimeout(() => {
      setPlayers([
        {
          id: '1',
          name: 'Connor McDavid Jr',
          position: 'C',
          jersey_number: 97,
          games_played: 4,
          goals: 5,
          assists: 7,
          points: 12,
          shots: 22,
          shooting_percentage: 22.7,
          plus_minus: 7,
          penalty_minutes: 2
        },
        {
          id: '2',
          name: 'Jake Thompson',
          position: 'LW',
          jersey_number: 19,
          games_played: 4,
          goals: 4,
          assists: 2,
          points: 6,
          shots: 14,
          shooting_percentage: 28.6,
          plus_minus: 4,
          penalty_minutes: 7
        },
        {
          id: '3',
          name: 'Ryan Mitchell',
          position: 'RW',
          jersey_number: 88,
          games_played: 4,
          goals: 2,
          assists: 3,
          points: 5,
          shots: 18,
          shooting_percentage: 11.1,
          plus_minus: 3,
          penalty_minutes: 0
        },
        {
          id: '4',
          name: 'Erik Karlsson Jr',
          position: 'D',
          jersey_number: 65,
          games_played: 4,
          goals: 1,
          assists: 6,
          points: 7,
          shots: 12,
          shooting_percentage: 8.3,
          plus_minus: 9,
          penalty_minutes: 2
        },
        {
          id: '5',
          name: 'Sam Garcia',
          position: 'D',
          jersey_number: 4,
          games_played: 4,
          goals: 0,
          assists: 3,
          points: 3,
          shots: 8,
          shooting_percentage: 0,
          plus_minus: 5,
          penalty_minutes: 4
        },
        {
          id: '6',
          name: 'Carter Price Jr',
          position: 'G',
          jersey_number: 31,
          games_played: 4,
          goals: 0,
          assists: 0,
          points: 0,
          shots: 0,
          shooting_percentage: 0,
          plus_minus: 0,
          penalty_minutes: 0
        }
      ])
      setLoading(false)
    }, 500)
  }, [])

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

  const filteredPlayers = players
    .filter(player => selectedPosition === 'all' || player.position === selectedPosition)
    .sort((a, b) => {
      switch (sortBy) {
        case 'points':
          return b.points - a.points
        case 'goals':
          return b.goals - a.goals
        case 'assists':
          return b.assists - a.assists
        case 'name':
          return a.name.localeCompare(b.name)
        case 'jersey':
          return a.jersey_number - b.jersey_number
        default:
          return b.points - a.points
      }
    })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
              <h1 className="text-3xl font-bold text-gray-900">Player Profiles</h1>
              <p className="text-gray-600 mt-1">Thunder Bay Lightning Roster - 2023-24 Season</p>
            </div>
            <Link
              href="/dashboard"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Position
              </label>
              <select
                id="position"
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">All Positions</option>
                <option value="C">Centers</option>
                <option value="LW">Left Wings</option>
                <option value="RW">Right Wings</option>
                <option value="D">Defense</option>
                <option value="G">Goalies</option>
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-2">
                Sort by
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="points">Points</option>
                <option value="goals">Goals</option>
                <option value="assists">Assists</option>
                <option value="name">Name</option>
                <option value="jersey">Jersey Number</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Player Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlayers.map((player) => (
            <Link
              key={player.id}
              href={`/players/${player.id}`}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                {/* Player Header */}
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-700">
                        #{player.jersey_number}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{player.name}</h3>
                    <div className="flex items-center mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPositionColor(player.position)}`}>
                        {player.position}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{player.points}</div>
                    <div className="text-xs text-gray-500">Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{player.goals}</div>
                    <div className="text-xs text-gray-500">Goals</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{player.assists}</div>
                    <div className="text-xs text-gray-500">Assists</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{player.games_played}</div>
                    <div className="text-xs text-gray-500">Games</div>
                  </div>
                </div>

                {/* Additional Stats */}
                {player.position !== 'G' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <div>
                        <span className="text-gray-500">Shots:</span>
                        <span className="ml-1 font-medium">{player.shots}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">S%:</span>
                        <span className="ml-1 font-medium">{player.shooting_percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <div>
                        <span className="text-gray-500">+/-:</span>
                        <span className="ml-1 font-medium">
                          {player.plus_minus > 0 ? '+' : ''}{player.plus_minus}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">PIM:</span>
                        <span className="ml-1 font-medium">{player.penalty_minutes}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* View Profile Button */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <span className="text-blue-600 text-sm font-medium hover:text-blue-500">
                      View Full Profile →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredPlayers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No players found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}