'use client'

import { useState, useMemo } from 'react'

interface Player {
  id: string
  first_name: string
  last_name: string
  jersey_number: number
  position: 'F' | 'D' | 'G'
  stats: {
    gamesPlayed: number
    goals: number
    assists: number
    points: number
    shots: number
    shootingPercentage: number
    penaltyMinutes: number
    plusMinus: number
    wins?: number
    saves?: number
    savePercentage?: number
    goalsAgainstAverage?: number
  }
}

interface TeamLeaderboardsProps {
  teamId: string
  season: string
  playersData: Player[]
  filters: any
  className?: string
}

interface LeaderboardCategory {
  key: string
  label: string
  positions: ('F' | 'D' | 'G' | 'all')[]
  format?: 'number' | 'percentage' | 'decimal'
  suffix?: string
  lowerIsBetter?: boolean
  minValue?: number
  description: string
}

export default function TeamLeaderboards({
  teamId,
  season,
  playersData,
  filters,
  className = ''
}: TeamLeaderboardsProps) {
  const [selectedCategory, setSelectedCategory] = useState('points')
  const [selectedPosition, setSelectedPosition] = useState<'all' | 'F' | 'D' | 'G'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  const leaderboardCategories: LeaderboardCategory[] = [
    {
      key: 'points',
      label: 'Points',
      positions: ['all', 'F', 'D'],
      description: 'Total points (goals + assists) - primary offensive measure'
    },
    {
      key: 'goals',
      label: 'Goals',
      positions: ['all', 'F', 'D'],
      description: 'Total goals scored this season'
    },
    {
      key: 'assists',
      label: 'Assists',
      positions: ['all', 'F', 'D'],
      description: 'Passes that directly led to goals'
    },
    {
      key: 'shootingPercentage',
      label: 'Shooting %',
      positions: ['all', 'F', 'D'],
      format: 'percentage',
      suffix: '%',
      minValue: 20, // Minimum 20 shots
      description: 'Percentage of shots that result in goals (min 20 shots)'
    },
    {
      key: 'plusMinus',
      label: 'Plus/Minus',
      positions: ['all', 'F', 'D'],
      description: 'Goal differential while player is on ice (even strength)'
    },
    {
      key: 'penaltyMinutes',
      label: 'Penalty Minutes',
      positions: ['all', 'F', 'D'],
      lowerIsBetter: true,
      description: 'Total penalty minutes (lower is better for team play)'
    },
    {
      key: 'savePercentage',
      label: 'Save %',
      positions: ['G'],
      format: 'decimal',
      suffix: '%',
      minValue: 10, // Minimum 10 games
      description: 'Percentage of shots saved (min 10 games)'
    },
    {
      key: 'wins',
      label: 'Wins',
      positions: ['G'],
      description: 'Games won as goalie of record'
    },
    {
      key: 'goalsAgainstAverage',
      label: 'GAA',
      positions: ['G'],
      format: 'decimal',
      lowerIsBetter: true,
      description: 'Goals against average per 60 minutes (lower is better)'
    }
  ]

  const filteredCategories = leaderboardCategories.filter(cat =>
    cat.positions.includes(selectedPosition)
  )

  const currentCategory = leaderboardCategories.find(cat => cat.key === selectedCategory)

  const leaderboardData = useMemo(() => {
    let filteredPlayers = playersData

    // Position filter
    if (selectedPosition !== 'all') {
      filteredPlayers = filteredPlayers.filter(player => player.position === selectedPosition)
    }

    // Minimum games filter
    filteredPlayers = filteredPlayers.filter(player => 
      player.stats.gamesPlayed >= (filters.minGamesPlayed || 5)
    )

    // Category-specific filters
    if (currentCategory?.minValue) {
      if (selectedCategory === 'shootingPercentage') {
        filteredPlayers = filteredPlayers.filter(player => player.stats.shots >= 20)
      } else if (selectedCategory === 'savePercentage') {
        filteredPlayers = filteredPlayers.filter(player => player.stats.gamesPlayed >= 10)
      }
    }

    // Get stat value and sort
    const playersWithValues = filteredPlayers
      .map(player => ({
        ...player,
        value: getStatValue(player, selectedCategory)
      }))
      .filter(player => player.value !== undefined && player.value !== null)

    // Sort by category
    playersWithValues.sort((a, b) => {
      if (currentCategory?.lowerIsBetter) {
        return a.value - b.value
      } else {
        return b.value - a.value
      }
    })

    return playersWithValues
  }, [playersData, selectedPosition, selectedCategory, filters, currentCategory])

  const getStatValue = (player: Player, category: string): number => {
    const stats = player.stats
    switch (category) {
      case 'points': return stats.points
      case 'goals': return stats.goals
      case 'assists': return stats.assists
      case 'shootingPercentage': return stats.shootingPercentage || 0
      case 'plusMinus': return stats.plusMinus
      case 'penaltyMinutes': return stats.penaltyMinutes
      case 'savePercentage': return stats.savePercentage || 0
      case 'wins': return stats.wins || 0
      case 'goalsAgainstAverage': return stats.goalsAgainstAverage || 0
      default: return 0
    }
  }

  const formatValue = (value: number, category: LeaderboardCategory): string => {
    if (category.format === 'percentage') {
      return `${value.toFixed(1)}%`
    } else if (category.format === 'decimal') {
      if (category.key === 'savePercentage') {
        return `${(value / 100).toFixed(3)}`
      } else if (category.key === 'goalsAgainstAverage') {
        return value.toFixed(2)
      }
      return value.toFixed(2)
    } else {
      return value.toString()
    }
  }

  const getRankColor = (rank: number): string => {
    if (rank === 1) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    if (rank === 2) return 'text-gray-600 bg-gray-50 border-gray-200'
    if (rank === 3) return 'text-orange-600 bg-orange-50 border-orange-200'
    return 'text-gray-800 bg-white border-gray-200'
  }

  const getRankIcon = (rank: number): string => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Team Leaderboards</h2>
            <p className="text-sm text-gray-600 mt-1">
              {leaderboardData.length} players shown • {season} Season
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Position Filter */}
            <select
              value={selectedPosition}
              onChange={(e) => {
                setSelectedPosition(e.target.value as any)
                // Reset to points if current category not available for new position
                const newCategories = leaderboardCategories.filter(cat =>
                  cat.positions.includes(e.target.value as any)
                )
                if (!newCategories.find(cat => cat.key === selectedCategory)) {
                  setSelectedCategory('points')
                }
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Positions</option>
              <option value="F">Forwards</option>
              <option value="D">Defense</option>
              <option value="G">Goalies</option>
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {filteredCategories.map((category) => (
                <option key={category.key} value={category.key}>
                  {category.label}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Table
              </button>
            </div>
          </div>
        </div>

        {/* Category Description */}
        {currentCategory && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              📊 <strong>{currentCategory.label}:</strong> {currentCategory.description}
            </p>
          </div>
        )}
      </div>

      {/* Leaderboard Content */}
      {leaderboardData.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Players Found</h3>
          <p className="text-gray-600">
            No players match the current filters for this category.
          </p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {leaderboardData.slice(0, 12).map((player, index) => (
                <div
                  key={player.id}
                  className={`rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-md ${getRankColor(index + 1)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">
                        {getRankIcon(index + 1)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          #{player.jersey_number} {player.first_name} {player.last_name}
                        </h3>
                        <p className="text-sm text-gray-600">{player.position}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">
                        {currentCategory?.label}
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {currentCategory && formatValue(player.value, currentCategory)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Games Played</span>
                      <span className="text-gray-900">{player.stats.gamesPlayed}</span>
                    </div>

                    {selectedCategory !== 'points' && player.stats.points > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Points</span>
                        <span className="text-gray-900">{player.stats.points}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Player
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pos
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        GP
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {currentCategory?.label}
                      </th>
                      {selectedCategory !== 'points' && (
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Points
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leaderboardData.map((player, index) => (
                      <tr
                        key={player.id}
                        className={index < 3 ? 'bg-yellow-50' : 'hover:bg-gray-50'}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="flex items-center space-x-2">
                            <span className="text-lg">{getRankIcon(index + 1)}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                #{player.jersey_number} {player.first_name} {player.last_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {player.position}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {player.stats.gamesPlayed}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                          {currentCategory && formatValue(player.value, currentCategory)}
                        </td>
                        {selectedCategory !== 'points' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                            {player.stats.points}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {leaderboardData.length > 20 && (
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-600">
                    Showing top 20 of {leaderboardData.length} players
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Quick Stats Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Category Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {currentCategory && formatValue(leaderboardData[0]?.value || 0, currentCategory)}
                </div>
                <div className="text-sm text-gray-600">Team Leader</div>
                <div className="text-xs text-gray-500 mt-1">
                  {leaderboardData[0] && `#${leaderboardData[0].jersey_number} ${leaderboardData[0].first_name} ${leaderboardData[0].last_name}`}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {currentCategory && formatValue(
                    leaderboardData.reduce((sum, player) => sum + player.value, 0) / leaderboardData.length,
                    currentCategory
                  )}
                </div>
                <div className="text-sm text-gray-600">Team Average</div>
                <div className="text-xs text-gray-500 mt-1">
                  {leaderboardData.length} players
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {leaderboardData.reduce((sum, player) => sum + player.value, 0)}
                </div>
                <div className="text-sm text-gray-600">Team Total</div>
                <div className="text-xs text-gray-500 mt-1">
                  {currentCategory?.label}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}