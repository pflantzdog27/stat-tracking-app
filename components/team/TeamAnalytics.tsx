'use client'

import { useState, useMemo } from 'react'
import { Line, Bar, Scatter } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

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
    shotsPerGame: number
  }
}

interface TeamAnalyticsProps {
  teamId: string
  teamStats: any
  playersData: Player[]
  season: string
  filters: any
  className?: string
}

type AnalyticsView = 'performance' | 'distribution' | 'correlations' | 'efficiency'

export default function TeamAnalytics({
  teamId,
  teamStats,
  playersData,
  season,
  filters,
  className = ''
}: TeamAnalyticsProps) {
  const [activeView, setActiveView] = useState<AnalyticsView>('performance')
  const [selectedMetric, setSelectedMetric] = useState('points')
  const [comparisonMode, setComparisonMode] = useState<'position' | 'experience' | 'role'>('position')

  const analyticsViews = [
    { key: 'performance' as const, label: 'Performance Trends', icon: '📈' },
    { key: 'distribution' as const, label: 'Score Distribution', icon: '📊' },
    { key: 'correlations' as const, label: 'Player Correlations', icon: '🔗' },
    { key: 'efficiency' as const, label: 'Efficiency Metrics', icon: '⚡' }
  ]

  // Performance Trends Data
  const performanceData = useMemo(() => {
    const last10Games = Array.from({ length: 10 }, (_, i) => `Game ${i + 1}`)
    
    return {
      labels: last10Games,
      datasets: [
        {
          label: 'Goals For',
          data: Array.from({ length: 10 }, () => Math.floor(Math.random() * 6) + 1),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.3
        },
        {
          label: 'Goals Against',
          data: Array.from({ length: 10 }, () => Math.floor(Math.random() * 4) + 1),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.3
        }
      ]
    }
  }, [])

  // Score Distribution Data
  const distributionData = useMemo(() => {
    const positions = ['F', 'D', 'G']
    const colors = {
      F: 'rgba(239, 68, 68, 0.8)',
      D: 'rgba(59, 130, 246, 0.8)',
      G: 'rgba(245, 158, 11, 0.8)'
    }

    return {
      labels: positions,
      datasets: [
        {
          label: 'Goals',
          data: positions.map(pos => 
            playersData
              .filter(p => p.position === pos)
              .reduce((sum, p) => sum + (p.stats?.goals || 0), 0)
          ),
          backgroundColor: positions.map(pos => colors[pos as keyof typeof colors]),
          borderColor: positions.map(pos => colors[pos as keyof typeof colors].replace('0.8', '1')),
          borderWidth: 2
        },
        {
          label: 'Assists',
          data: positions.map(pos => 
            playersData
              .filter(p => p.position === pos)
              .reduce((sum, p) => sum + (p.stats?.assists || 0), 0)
          ),
          backgroundColor: positions.map(pos => colors[pos as keyof typeof colors].replace('0.8', '0.5')),
          borderColor: positions.map(pos => colors[pos as keyof typeof colors].replace('0.8', '1')),
          borderWidth: 2
        }
      ]
    }
  }, [playersData])

  // Player Correlations Data (Goals vs Assists)
  const correlationData = useMemo(() => {
    const positionColors = {
      F: 'rgba(239, 68, 68, 0.7)',
      D: 'rgba(59, 130, 246, 0.7)',
      G: 'rgba(245, 158, 11, 0.7)'
    }

    return {
      datasets: [{
        label: 'Goals vs Assists',
        data: playersData.map(player => ({
          x: player.stats?.goals || 0,
          y: player.stats?.assists || 0,
          player: `#${player.jersey_number} ${player.first_name} ${player.last_name}`,
          position: player.position
        })),
        backgroundColor: playersData.map(player => positionColors[player.position]),
        borderColor: playersData.map(player => positionColors[player.position].replace('0.7', '1')),
        borderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }]
    }
  }, [playersData])

  // Efficiency Analysis
  const efficiencyAnalysis = useMemo(() => {
    const topPerformers = playersData
      .filter(p => (p.stats?.gamesPlayed || 0) >= (filters.minGamesPlayed || 5))
      .sort((a, b) => (b.stats?.pointsPerGame || 0) - (a.stats?.pointsPerGame || 0))
      .slice(0, 8)

    const mostEfficient = playersData
      .filter(p => (p.stats?.shots || 0) >= 10)
      .sort((a, b) => (b.stats?.shootingPercentage || 0) - (a.stats?.shootingPercentage || 0))
      .slice(0, 5)

    const consistentPlayers = playersData
      .filter(p => (p.stats?.gamesPlayed || 0) >= 15)
      .sort((a, b) => Math.abs((a.stats?.plusMinus || 0)) - Math.abs((b.stats?.plusMinus || 0)))
      .slice(0, 5)

    return { topPerformers, mostEfficient, consistentPlayers }
  }, [playersData, filters])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            if (activeView === 'correlations') {
              return `${context.raw.player}: ${context.raw.x}G, ${context.raw.y}A`
            }
            return `${context.dataset.label}: ${context.parsed.y}`
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: activeView === 'correlations',
          text: 'Goals'
        }
      },
      y: {
        title: {
          display: activeView === 'correlations',
          text: 'Assists'
        }
      }
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Analytics Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Team Analytics</h2>
            <p className="text-sm text-gray-600 mt-1">
              Advanced statistical analysis and insights
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={comparisonMode}
              onChange={(e) => setComparisonMode(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="position">By Position</option>
              <option value="experience">By Experience</option>
              <option value="role">By Role</option>
            </select>
          </div>
        </div>

        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
          {analyticsViews.map((view) => (
            <button
              key={view.key}
              onClick={() => setActiveView(view.key)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeView === view.key
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span>{view.icon}</span>
              <span>{view.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Analytics Content */}
      <div className="space-y-6">
        {activeView === 'performance' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Team Performance Trends</h3>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="goals">Goals For/Against</option>
                <option value="shots">Shots For/Against</option>
                <option value="special">Special Teams</option>
              </select>
            </div>
            
            <div className="h-80">
              <Line data={performanceData} options={chartOptions} />
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {teamStats.goalsForPerGame?.toFixed(1) || '0.0'}
                </div>
                <div className="text-sm text-green-700">Avg Goals For</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {teamStats.goalsAgainstPerGame?.toFixed(1) || '0.0'}
                </div>
                <div className="text-sm text-red-700">Avg Goals Against</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {teamStats.goalDifferential > 0 ? '+' : ''}{teamStats.goalDifferential || 0}
                </div>
                <div className="text-sm text-blue-700">Goal Differential</div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'distribution' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Scoring Distribution by Position</h3>
            
            <div className="h-80 mb-6">
              <Bar data={distributionData} options={chartOptions} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['F', 'D', 'G'].map(position => {
                const positionPlayers = playersData.filter(p => p.position === position)
                const totalGoals = positionPlayers.reduce((sum, p) => sum + (p.stats?.goals || 0), 0)
                const totalAssists = positionPlayers.reduce((sum, p) => sum + (p.stats?.assists || 0), 0)
                const avgPoints = positionPlayers.length > 0 
                  ? (totalGoals + totalAssists) / positionPlayers.length 
                  : 0

                return (
                  <div key={position} className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">
                      {position === 'F' ? 'Forwards' : position === 'D' ? 'Defense' : 'Goalies'}
                      <span className="text-sm text-gray-500 ml-2">({positionPlayers.length})</span>
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Goals</span>
                        <span className="font-medium">{totalGoals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Assists</span>
                        <span className="font-medium">{totalAssists}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Points</span>
                        <span className="font-medium">{avgPoints.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeView === 'correlations' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Player Performance Correlations</h3>
            
            <div className="h-80 mb-6">
              <Scatter data={correlationData} options={chartOptions} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Correlation Insights</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <span>Forwards (Red): Primary scorers</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    <span>Defense (Blue): Playmakers from blue line</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <span>Goalies (Yellow): Limited offensive role</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Key Observations</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>• Strong positive correlation between goals and assists</div>
                  <div>• Forwards cluster in higher scoring regions</div>
                  <div>• Defense players show playmaking tendencies</div>
                  <div>• Clear role differentiation by position</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'efficiency' && (
          <div className="space-y-6">
            {/* Top Performers */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {efficiencyAnalysis.topPerformers.slice(0, 4).map((player, index) => (
                  <div key={player.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg font-bold text-blue-600">#{index + 1}</span>
                      <div>
                        <div className="text-sm font-medium">
                          #{player.jersey_number} {player.first_name} {player.last_name}
                        </div>
                        <div className="text-xs text-gray-500">{player.position}</div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {(player.stats?.pointsPerGame || 0).toFixed(2)} PPG
                    </div>
                    <div className="text-sm text-gray-600">
                      {player.stats?.points || 0} points in {player.stats?.gamesPlayed || 0} games
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Efficiency Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Most Efficient Shooters</h3>
                <div className="space-y-3">
                  {efficiencyAnalysis.mostEfficient.map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="text-sm font-medium">
                          #{player.jersey_number} {player.first_name} {player.last_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {player.stats?.goals || 0}G on {player.stats?.shots || 0} shots
                        </div>
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        {(player.stats?.shootingPercentage || 0).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Most Consistent Players</h3>
                <div className="space-y-3">
                  {efficiencyAnalysis.consistentPlayers.map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="text-sm font-medium">
                          #{player.jersey_number} {player.first_name} {player.last_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {player.stats?.gamesPlayed || 0} games played
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${
                        (player.stats?.plusMinus || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(player.stats?.plusMinus || 0) >= 0 ? '+' : ''}{player.stats?.plusMinus || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Team Efficiency Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Team Efficiency Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {(teamStats.shotsFor / teamStats.gamesPlayed).toFixed(1)}
                  </div>
                  <div className="text-sm text-blue-700">Shots For/Game</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {((teamStats.goalsFor / teamStats.shotsFor) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-green-700">Team Shooting %</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {teamStats.powerPlayPercentage?.toFixed(1) || '0.0'}%
                  </div>
                  <div className="text-sm text-yellow-700">Power Play %</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {teamStats.penaltyKillPercentage?.toFixed(1) || '0.0'}%
                  </div>
                  <div className="text-sm text-purple-700">Penalty Kill %</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}