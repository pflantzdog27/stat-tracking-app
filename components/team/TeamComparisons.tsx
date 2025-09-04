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
    pointsPerGame: number
  }
}

interface TeamComparisonsProps {
  teamId: string
  playersData: Player[]
  season: string
  filters: any
  className?: string
}

type ComparisonType = 'multi_player' | 'position_groups' | 'performance_tiers'

export default function TeamComparisons({
  teamId,
  playersData,
  season,
  filters,
  className = ''
}: TeamComparisonsProps) {
  const [comparisonType, setComparisonType] = useState<ComparisonType>('multi_player')
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [comparisonCategory, setComparisonCategory] = useState('points')

  const comparisonTypes = [
    { key: 'multi_player' as const, label: 'Multi-Player', icon: '👥' },
    { key: 'position_groups' as const, label: 'Position Groups', icon: '🔢' },
    { key: 'performance_tiers' as const, label: 'Performance Tiers', icon: '🏆' }
  ]

  const comparisonCategories = [
    { key: 'points', label: 'Points', format: 'number' },
    { key: 'goals', label: 'Goals', format: 'number' },
    { key: 'assists', label: 'Assists', format: 'number' },
    { key: 'shootingPercentage', label: 'Shooting %', format: 'percentage' },
    { key: 'pointsPerGame', label: 'Points/Game', format: 'decimal' },
    { key: 'plusMinus', label: 'Plus/Minus', format: 'number' },
    { key: 'penaltyMinutes', label: 'Penalty Min', format: 'number' }
  ]

  // Multi-player comparison data
  const multiPlayerData = useMemo(() => {
    if (selectedPlayers.length === 0) return []
    
    return playersData
      .filter(player => selectedPlayers.includes(player.id))
      .map(player => ({
        ...player,
        fullName: `${player.first_name} ${player.last_name}`,
        value: getStatValue(player, comparisonCategory)
      }))
      .sort((a, b) => b.value - a.value)
  }, [selectedPlayers, playersData, comparisonCategory])

  // Position groups comparison
  const positionGroupData = useMemo(() => {
    const positions = ['F', 'D', 'G']
    
    return positions.map(position => {
      const positionPlayers = playersData.filter(p => p.position === position)
      const totalValue = positionPlayers.reduce((sum, p) => sum + getStatValue(p, comparisonCategory), 0)
      const avgValue = positionPlayers.length > 0 ? totalValue / positionPlayers.length : 0
      
      return {
        position,
        name: position === 'F' ? 'Forwards' : position === 'D' ? 'Defense' : 'Goalies',
        playerCount: positionPlayers.length,
        totalValue,
        avgValue,
        topPlayer: positionPlayers.sort((a, b) => getStatValue(b, comparisonCategory) - getStatValue(a, comparisonCategory))[0]
      }
    })
  }, [playersData, comparisonCategory])

  // Performance tiers
  const performanceTiers = useMemo(() => {
    const sortedPlayers = [...playersData]
      .filter(p => (p.stats?.gamesPlayed || 0) >= (filters.minGamesPlayed || 5))
      .sort((a, b) => getStatValue(b, comparisonCategory) - getStatValue(a, comparisonCategory))
    
    const tierSize = Math.ceil(sortedPlayers.length / 3)
    
    return [
      {
        tier: 'Top Tier',
        players: sortedPlayers.slice(0, tierSize),
        color: 'green',
        description: 'Elite performers'
      },
      {
        tier: 'Middle Tier',
        players: sortedPlayers.slice(tierSize, tierSize * 2),
        color: 'yellow',
        description: 'Solid contributors'
      },
      {
        tier: 'Development Tier',
        players: sortedPlayers.slice(tierSize * 2),
        color: 'blue',
        description: 'Developing players'
      }
    ]
  }, [playersData, comparisonCategory, filters])

  const getStatValue = (player: Player, category: string): number => {
    const stats = player.stats || {}
    switch (category) {
      case 'points': return stats.points || 0
      case 'goals': return stats.goals || 0
      case 'assists': return stats.assists || 0
      case 'shootingPercentage': return stats.shootingPercentage || 0
      case 'pointsPerGame': return stats.pointsPerGame || 0
      case 'plusMinus': return stats.plusMinus || 0
      case 'penaltyMinutes': return stats.penaltyMinutes || 0
      default: return 0
    }
  }

  const formatValue = (value: number, format: string): string => {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`
      case 'decimal':
        return value.toFixed(2)
      default:
        return value.toString()
    }
  }

  const handlePlayerToggle = (playerId: string) => {
    setSelectedPlayers(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId)
      } else if (prev.length < 6) { // Limit to 6 players
        return [...prev, playerId]
      }
      return prev
    })
  }

  const selectedCategory = comparisonCategories.find(cat => cat.key === comparisonCategory)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Player Comparisons</h2>
            <p className="text-sm text-gray-600 mt-1">
              Compare players across different metrics and groupings
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={comparisonCategory}
              onChange={(e) => setComparisonCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {comparisonCategories.map((category) => (
                <option key={category.key} value={category.key}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison Type Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
          {comparisonTypes.map((type) => (
            <button
              key={type.key}
              onClick={() => setComparisonType(type.key)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                comparisonType === type.key
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span>{type.icon}</span>
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Comparison Content */}
      {comparisonType === 'multi_player' && (
        <div className="space-y-6">
          {/* Player Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Select Players to Compare ({selectedPlayers.length}/6)
              </h3>
              {selectedPlayers.length > 0 && (
                <button
                  onClick={() => setSelectedPlayers([])}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
              {playersData
                .sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`))
                .map((player) => (
                  <label
                    key={player.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedPlayers.includes(player.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPlayers.includes(player.id)}
                      onChange={() => handlePlayerToggle(player.id)}
                      disabled={!selectedPlayers.includes(player.id) && selectedPlayers.length >= 6}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">
                        #{player.jersey_number} {player.first_name} {player.last_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {player.position} • {getStatValue(player, comparisonCategory)} {selectedCategory?.label}
                      </div>
                    </div>
                  </label>
                ))}
            </div>
          </div>

          {/* Multi-Player Comparison Results */}
          {multiPlayerData.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                {selectedCategory?.label} Comparison
              </h3>

              <div className="space-y-4">
                {multiPlayerData.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-gray-400 text-gray-900' :
                        index === 2 ? 'bg-orange-400 text-orange-900' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          #{player.jersey_number} {player.fullName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {player.position} • {player.stats?.gamesPlayed || 0} GP
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {selectedCategory && formatValue(player.value, selectedCategory.format)}
                        </div>
                        <div className="text-sm text-gray-500">{selectedCategory?.label}</div>
                      </div>
                      
                      {/* Performance Bar */}
                      <div className="w-24">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, (player.value / Math.max(...multiPlayerData.map(p => p.value))) * 100)}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comparison Insights */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Comparison Insights</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  {multiPlayerData.length > 1 && (
                    <>
                      <div>
                        • Leader: {multiPlayerData[0].fullName} with {selectedCategory && formatValue(multiPlayerData[0].value, selectedCategory.format)}
                      </div>
                      <div>
                        • Gap to 2nd: {selectedCategory && formatValue(
                          multiPlayerData[0].value - (multiPlayerData[1]?.value || 0), 
                          selectedCategory.format
                        )}
                      </div>
                      <div>
                        • Average: {selectedCategory && formatValue(
                          multiPlayerData.reduce((sum, p) => sum + p.value, 0) / multiPlayerData.length,
                          selectedCategory.format
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {comparisonType === 'position_groups' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            {selectedCategory?.label} by Position
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {positionGroupData.map((group) => (
              <div
                key={group.position}
                className={`p-6 rounded-lg border-2 ${
                  group.position === 'F' ? 'bg-red-50 border-red-200' :
                  group.position === 'D' ? 'bg-blue-50 border-blue-200' :
                  'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="text-center mb-4">
                  <h4 className="text-xl font-bold text-gray-900">{group.name}</h4>
                  <p className="text-sm text-gray-600">{group.playerCount} players</p>
                </div>

                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">
                      {selectedCategory && formatValue(group.totalValue, selectedCategory.format)}
                    </div>
                    <div className="text-sm text-gray-600">Total {selectedCategory?.label}</div>
                  </div>

                  <div className="text-center">
                    <div className="text-xl font-semibold text-gray-700">
                      {selectedCategory && formatValue(group.avgValue, selectedCategory.format)}
                    </div>
                    <div className="text-sm text-gray-600">Average per player</div>
                  </div>

                  {group.topPlayer && (
                    <div className="pt-3 border-t border-gray-300">
                      <div className="text-sm text-gray-600 text-center">Top Performer</div>
                      <div className="text-center font-medium">
                        #{group.topPlayer.jersey_number} {group.topPlayer.first_name} {group.topPlayer.last_name}
                      </div>
                      <div className="text-center text-sm text-gray-600">
                        {selectedCategory && formatValue(
                          getStatValue(group.topPlayer, comparisonCategory),
                          selectedCategory.format
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {comparisonType === 'performance_tiers' && (
        <div className="space-y-6">
          {performanceTiers.map((tier, tierIndex) => (
            <div key={tier.tier} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${
                    tier.color === 'green' ? 'bg-green-500' :
                    tier.color === 'yellow' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}></div>
                  <h3 className="text-lg font-medium text-gray-900">{tier.tier}</h3>
                  <span className="text-sm text-gray-500">({tier.players.length} players)</span>
                </div>
                <span className="text-sm text-gray-600">{tier.description}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tier.players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        #{player.jersey_number} {player.first_name} {player.last_name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {player.position} • {player.stats?.gamesPlayed || 0} GP
                      </div>
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {selectedCategory && formatValue(
                        getStatValue(player, comparisonCategory),
                        selectedCategory.format
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {tier.players.length > 0 && (
                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tier Average:</span>
                    <span className="font-medium text-gray-900">
                      {selectedCategory && formatValue(
                        tier.players.reduce((sum, p) => sum + getStatValue(p, comparisonCategory), 0) / tier.players.length,
                        selectedCategory.format
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}