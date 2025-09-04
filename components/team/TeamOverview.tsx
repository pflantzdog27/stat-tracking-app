'use client'

import { useState } from 'react'

interface TeamStats {
  teamId: string
  season: string
  gamesPlayed: number
  wins: number
  losses: number
  overtimeLosses: number
  points: number
  goalsFor: number
  goalsAgainst: number
  goalDifferential: number
  powerPlayGoals: number
  powerPlayOpportunities: number
  penaltyKillGoalsAgainst: number
  penaltyKillOpportunities: number
  shotsFor: number
  shotsAgainst: number
  winPercentage: number
  pointsPerGame: number
  goalsForPerGame: number
  goalsAgainstPerGame: number
  powerPlayPercentage: number
  penaltyKillPercentage: number
  shotDifferential: number
}

interface Player {
  id: string
  first_name: string
  last_name: string
  jersey_number: number
  position: 'F' | 'D' | 'G'
  stats: any
}

interface TeamOverviewProps {
  teamStats: TeamStats
  playersData: Player[]
  season: string
  filters: any
  className?: string
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray'
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'stable'
  benchmark?: number
}

function StatCard({ title, value, subtitle, color = 'blue', icon, trend, benchmark }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    red: 'bg-red-50 border-red-200 text-red-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    gray: 'bg-gray-50 border-gray-200 text-gray-900'
  }

  const trendIcons = {
    up: <span className="text-green-500 text-sm">↗️</span>,
    down: <span className="text-red-500 text-sm">↘️</span>,
    stable: <span className="text-gray-400 text-sm">➡️</span>
  }

  return (
    <div className={`rounded-lg border-2 p-4 ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            {icon}
            <h3 className="font-medium text-sm opacity-80">{title}</h3>
            {trend && trendIcons[trend]}
          </div>
          <div className="text-2xl font-bold mb-1">{value}</div>
          {subtitle && (
            <div className="text-sm opacity-75">{subtitle}</div>
          )}
          {benchmark && (
            <div className="text-xs opacity-60 mt-1">
              League avg: {benchmark}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TeamOverview({
  teamStats,
  playersData,
  season,
  filters,
  className = ''
}: TeamOverviewProps) {
  const [selectedView, setSelectedView] = useState<'overview' | 'breakdown' | 'roster'>('overview')

  // Calculate additional metrics
  const totalPoints = teamStats.wins * 2 + teamStats.overtimeLosses
  const gamesRemaining = Math.max(0, 30 - teamStats.gamesPlayed) // Assuming 30 game season
  const projectedWins = Math.round((teamStats.wins / teamStats.gamesPlayed) * 30)
  
  // Position breakdown
  const positionBreakdown = playersData.reduce((acc, player) => {
    acc[player.position] = (acc[player.position] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Top performers
  const topScorer = playersData.sort((a, b) => (b.stats?.points || 0) - (a.stats?.points || 0))[0]
  const topGoalie = playersData
    .filter(p => p.position === 'G')
    .sort((a, b) => (b.stats?.wins || 0) - (a.stats?.wins || 0))[0]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Team Record Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg text-white p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              {teamStats.wins}-{teamStats.losses}-{teamStats.overtimeLosses}
            </h2>
            <p className="text-blue-100 text-lg">
              {season} Season Record • {teamStats.gamesPlayed} Games Played
            </p>
            <p className="text-blue-200 text-sm mt-1">
              {teamStats.winPercentage.toFixed(1)}% Win Rate • {totalPoints} Points
            </p>
          </div>
          
          <div className="mt-4 lg:mt-0 grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{teamStats.goalsFor}</div>
              <div className="text-blue-200 text-sm">Goals For</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{teamStats.goalsAgainst}</div>
              <div className="text-blue-200 text-sm">Goals Against</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'overview' as const, label: 'Team Stats', icon: '📊' },
              { key: 'breakdown' as const, label: 'Breakdown', icon: '🔍' },
              { key: 'roster' as const, label: 'Roster', icon: '👥' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedView(tab.key)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm ${
                  selectedView === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {selectedView === 'overview' && (
            <div className="space-y-6">
              {/* Key Team Stats */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Team Performance</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Points Percentage"
                    value={`${((totalPoints / (teamStats.gamesPlayed * 2)) * 100).toFixed(1)}%`}
                    subtitle={`${totalPoints} of ${teamStats.gamesPlayed * 2} possible`}
                    color="blue"
                    icon={<span>📈</span>}
                    benchmark={60.0}
                  />
                  
                  <StatCard
                    title="Goal Differential"
                    value={teamStats.goalDifferential > 0 ? `+${teamStats.goalDifferential}` : teamStats.goalDifferential.toString()}
                    subtitle={`${teamStats.goalsForPerGame.toFixed(1)} GF/G, ${teamStats.goalsAgainstPerGame.toFixed(1)} GA/G`}
                    color={teamStats.goalDifferential >= 0 ? 'green' : 'red'}
                    icon={<span>⚖️</span>}
                  />

                  <StatCard
                    title="Power Play"
                    value={`${teamStats.powerPlayPercentage.toFixed(1)}%`}
                    subtitle={`${teamStats.powerPlayGoals}/${teamStats.powerPlayOpportunities}`}
                    color="yellow"
                    icon={<span>⚡</span>}
                    benchmark={20.0}
                  />

                  <StatCard
                    title="Penalty Kill"
                    value={`${teamStats.penaltyKillPercentage.toFixed(1)}%`}
                    subtitle={`${teamStats.penaltyKillOpportunities - teamStats.penaltyKillGoalsAgainst}/${teamStats.penaltyKillOpportunities}`}
                    color="purple"
                    icon={<span>🛡️</span>}
                    benchmark={82.0}
                  />
                </div>
              </div>

              {/* Advanced Metrics */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Metrics</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <StatCard
                    title="Shot Differential"
                    value={teamStats.shotDifferential > 0 ? `+${teamStats.shotDifferential}` : teamStats.shotDifferential.toString()}
                    subtitle={`${teamStats.shotsFor} SF, ${teamStats.shotsAgainst} SA`}
                    color={teamStats.shotDifferential >= 0 ? 'green' : 'red'}
                    icon={<span>🎯</span>}
                  />

                  <StatCard
                    title="Projected Wins"
                    value={projectedWins}
                    subtitle={`Based on current pace`}
                    color="gray"
                    icon={<span>🔮</span>}
                  />

                  <StatCard
                    title="Games Remaining"
                    value={gamesRemaining}
                    subtitle={`${Math.round((gamesRemaining / 30) * 100)}% season left`}
                    color="gray"
                    icon={<span>📅</span>}
                  />
                </div>
              </div>

              {/* Team Leaders */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Team Leaders</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-2xl">👑</span>
                      <div>
                        <h4 className="font-medium text-green-900">Leading Scorer</h4>
                        <p className="text-sm text-green-700">Most points this season</p>
                      </div>
                    </div>
                    {topScorer ? (
                      <div>
                        <p className="font-semibold text-green-900">
                          #{topScorer.jersey_number} {topScorer.first_name} {topScorer.last_name}
                        </p>
                        <p className="text-sm text-green-700">
                          {topScorer.stats?.points || 0} points ({topScorer.stats?.goals || 0}G, {topScorer.stats?.assists || 0}A)
                        </p>
                      </div>
                    ) : (
                      <p className="text-green-700">No data available</p>
                    )}
                  </div>

                  {topGoalie && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-2xl">🥅</span>
                        <div>
                          <h4 className="font-medium text-blue-900">Top Goalie</h4>
                          <p className="text-sm text-blue-700">Most wins this season</p>
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-blue-900">
                          #{topGoalie.jersey_number} {topGoalie.first_name} {topGoalie.last_name}
                        </p>
                        <p className="text-sm text-blue-700">
                          {topGoalie.stats?.wins || 0} wins • {(topGoalie.stats?.savePercentage || 0).toFixed(3)} SV%
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedView === 'breakdown' && (
            <div className="space-y-6">
              {/* Position Breakdown */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Roster Composition</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200 text-center">
                    <div className="text-3xl font-bold text-red-600">{positionBreakdown.F || 0}</div>
                    <div className="text-sm text-red-700 font-medium">Forwards</div>
                    <div className="text-xs text-red-600 mt-1">
                      {Math.round(((positionBreakdown.F || 0) / playersData.length) * 100)}% of roster
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 text-center">
                    <div className="text-3xl font-bold text-blue-600">{positionBreakdown.D || 0}</div>
                    <div className="text-sm text-blue-700 font-medium">Defense</div>
                    <div className="text-xs text-blue-600 mt-1">
                      {Math.round(((positionBreakdown.D || 0) / playersData.length) * 100)}% of roster
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 text-center">
                    <div className="text-3xl font-bold text-yellow-600">{positionBreakdown.G || 0}</div>
                    <div className="text-sm text-yellow-700 font-medium">Goalies</div>
                    <div className="text-xs text-yellow-600 mt-1">
                      {Math.round(((positionBreakdown.G || 0) / playersData.length) * 100)}% of roster
                    </div>
                  </div>
                </div>
              </div>

              {/* Scoring Distribution */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Scoring Distribution</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">By Position</h4>
                      <div className="space-y-2">
                        {['F', 'D', 'G'].map(position => {
                          const positionPlayers = playersData.filter(p => p.position === position)
                          const positionGoals = positionPlayers.reduce((sum, p) => sum + (p.stats?.goals || 0), 0)
                          const percentage = teamStats.goalsFor > 0 ? (positionGoals / teamStats.goalsFor * 100) : 0
                          
                          return (
                            <div key={position} className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">
                                {position === 'F' ? 'Forwards' : position === 'D' ? 'Defense' : 'Goalies'}
                              </span>
                              <span className="text-sm font-medium">
                                {positionGoals} ({percentage.toFixed(0)}%)
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Top Contributors</h4>
                      <div className="space-y-2">
                        {playersData
                          .sort((a, b) => (b.stats?.goals || 0) - (a.stats?.goals || 0))
                          .slice(0, 3)
                          .map((player, index) => (
                            <div key={player.id} className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">
                                {index + 1}. #{player.jersey_number} {player.first_name} {player.last_name}
                              </span>
                              <span className="text-sm font-medium">
                                {player.stats?.goals || 0}G
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Game Situations */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Special Teams Performance</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <h4 className="font-medium text-yellow-900 mb-3">Power Play Analysis</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-yellow-700">Success Rate</span>
                        <span className="font-medium text-yellow-900">
                          {teamStats.powerPlayPercentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-yellow-700">Opportunities</span>
                        <span className="font-medium text-yellow-900">
                          {teamStats.powerPlayOpportunities}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-yellow-700">Goals Scored</span>
                        <span className="font-medium text-yellow-900">
                          {teamStats.powerPlayGoals}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-yellow-700">Avg per Game</span>
                        <span className="font-medium text-yellow-900">
                          {(teamStats.powerPlayOpportunities / teamStats.gamesPlayed).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="font-medium text-purple-900 mb-3">Penalty Kill Analysis</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-purple-700">Success Rate</span>
                        <span className="font-medium text-purple-900">
                          {teamStats.penaltyKillPercentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-purple-700">Times Short</span>
                        <span className="font-medium text-purple-900">
                          {teamStats.penaltyKillOpportunities}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-purple-700">Goals Allowed</span>
                        <span className="font-medium text-purple-900">
                          {teamStats.penaltyKillGoalsAgainst}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-purple-700">Avg per Game</span>
                        <span className="font-medium text-purple-900">
                          {(teamStats.penaltyKillOpportunities / teamStats.gamesPlayed).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedView === 'roster' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Active Roster</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Player
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Position
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        GP
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        G
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        A
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        P
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        +/-
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {playersData
                      .sort((a, b) => (b.stats?.points || 0) - (a.stats?.points || 0))
                      .map((player, index) => (
                        <tr key={player.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              #{player.jersey_number} {player.first_name} {player.last_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              player.position === 'F' ? 'bg-red-100 text-red-800' :
                              player.position === 'D' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {player.position}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {player.stats?.gamesPlayed || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {player.stats?.goals || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {player.stats?.assists || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 text-right">
                            {player.stats?.points || 0}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${
                            (player.stats?.plusMinus || 0) > 0 ? 'text-green-600' :
                            (player.stats?.plusMinus || 0) < 0 ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {(player.stats?.plusMinus || 0) > 0 ? '+' : ''}{player.stats?.plusMinus || 0}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}