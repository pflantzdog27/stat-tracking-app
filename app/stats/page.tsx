'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

interface PlayerStats {
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

interface TeamStats {
  games_played: number
  wins: number
  losses: number
  overtime_losses: number
  points: number
  goals_for: number
  goals_against: number
  goal_differential: number
}

export default function StatsPage() {
  const { user } = useAuth()
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([])
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'players' | 'team' | 'leaderboards'>('players')

  useEffect(() => {
    // Simulate loading stats data
    setTimeout(() => {
      setPlayerStats([
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
          id: '4',
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

      setTeamStats({
        games_played: 4,
        wins: 4,
        losses: 0,
        overtime_losses: 0,
        points: 8,
        goals_for: 14,
        goals_against: 6,
        goal_differential: 8
      })

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
              <h1 className="text-3xl font-bold text-gray-900">Team Statistics</h1>
              <p className="text-gray-600 mt-1">Thunder Bay Lightning - 2023-24 Season</p>
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

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'players', label: 'Player Stats' },
              { key: 'team', label: 'Team Overview' },
              { key: 'leaderboards', label: 'Leaderboards' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {activeTab === 'players' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Player Statistics</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Player
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      G
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      A
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shots
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      S%
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      +/-
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {playerStats.map((player) => (
                    <tr key={player.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                #{player.jersey_number}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{player.name}</div>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPositionColor(player.position)}`}>
                                {player.position}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {player.games_played}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {player.goals}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {player.assists}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {player.points}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {player.shots}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {player.shooting_percentage.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {player.plus_minus > 0 ? '+' : ''}{player.plus_minus}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'team' && teamStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">W</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Record</dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {teamStats.wins}-{teamStats.losses}-{teamStats.overtime_losses}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">Pts</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Points</dt>
                    <dd className="text-2xl font-bold text-gray-900">{teamStats.points}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">GF</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Goals For</dt>
                    <dd className="text-2xl font-bold text-gray-900">{teamStats.goals_for}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">GA</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Goals Against</dt>
                    <dd className="text-2xl font-bold text-gray-900">{teamStats.goals_against}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leaderboards' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Goals Leaders</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {playerStats
                    .filter(p => p.position !== 'G')
                    .sort((a, b) => b.goals - a.goals)
                    .slice(0, 5)
                    .map((player, index) => (
                      <div key={player.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-500 w-6">
                            {index + 1}.
                          </span>
                          <span className="text-sm font-medium text-gray-900 ml-2">
                            {player.name}
                          </span>
                        </div>
                        <span className="text-lg font-bold text-blue-600">{player.goals}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Assists Leaders</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {playerStats
                    .filter(p => p.position !== 'G')
                    .sort((a, b) => b.assists - a.assists)
                    .slice(0, 5)
                    .map((player, index) => (
                      <div key={player.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-500 w-6">
                            {index + 1}.
                          </span>
                          <span className="text-sm font-medium text-gray-900 ml-2">
                            {player.name}
                          </span>
                        </div>
                        <span className="text-lg font-bold text-green-600">{player.assists}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Points Leaders</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {playerStats
                    .filter(p => p.position !== 'G')
                    .sort((a, b) => b.points - a.points)
                    .slice(0, 5)
                    .map((player, index) => (
                      <div key={player.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-500 w-6">
                            {index + 1}.
                          </span>
                          <span className="text-sm font-medium text-gray-900 ml-2">
                            {player.name}
                          </span>
                        </div>
                        <span className="text-lg font-bold text-purple-600">{player.points}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}