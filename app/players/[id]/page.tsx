'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface PlayerProfile {
  id: string
  name: string
  position: string
  jersey_number: number
  birth_date: string
  height: string
  weight: string
  shoots: string
  hometown: string
  games_played: number
  goals: number
  assists: number
  points: number
  shots: number
  shooting_percentage: number
  plus_minus: number
  penalty_minutes: number
  time_on_ice: number
}

interface GameLog {
  game_id: string
  date: string
  opponent: string
  is_home: boolean
  goals: number
  assists: number
  points: number
  shots: number
  plus_minus: number
  penalty_minutes: number
  time_on_ice: number
}

export default function PlayerProfilePage() {
  const params = useParams()
  const [player, setPlayer] = useState<PlayerProfile | null>(null)
  const [gameLog, setGameLog] = useState<GameLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading player profile data
    setTimeout(() => {
      // Mock data based on player ID
      const mockPlayer: PlayerProfile = {
        id: params.id as string,
        name: 'Connor McDavid Jr',
        position: 'C',
        jersey_number: 97,
        birth_date: '2005-01-13',
        height: '6\'1"',
        weight: '195 lbs',
        shoots: 'L',
        hometown: 'Thunder Bay, ON',
        games_played: 4,
        goals: 5,
        assists: 7,
        points: 12,
        shots: 22,
        shooting_percentage: 22.7,
        plus_minus: 7,
        penalty_minutes: 2,
        time_on_ice: 19.2
      }

      const mockGameLog: GameLog[] = [
        {
          game_id: '1',
          date: '2023-11-18',
          opponent: 'Kirkland Lake Gold Miners',
          is_home: true,
          goals: 1,
          assists: 1,
          points: 2,
          shots: 4,
          plus_minus: 1,
          penalty_minutes: 0,
          time_on_ice: 18.5
        },
        {
          game_id: '2',
          date: '2023-11-12',
          opponent: 'Timmins Rock',
          is_home: false,
          goals: 0,
          assists: 1,
          points: 1,
          shots: 3,
          plus_minus: 1,
          penalty_minutes: 0,
          time_on_ice: 19.8
        },
        {
          game_id: '3',
          date: '2023-11-05',
          opponent: 'North Bay Trappers',
          is_home: true,
          goals: 1,
          assists: 3,
          points: 4,
          shots: 5,
          plus_minus: 3,
          penalty_minutes: 0,
          time_on_ice: 20.2
        },
        {
          game_id: '4',
          date: '2023-10-22',
          opponent: 'Sault Rapids',
          is_home: false,
          goals: 1,
          assists: 2,
          points: 3,
          shots: 4,
          plus_minus: 1,
          penalty_minutes: 2,
          time_on_ice: 18.1
        }
      ]

      setPlayer(mockPlayer)
      setGameLog(mockGameLog)
      setLoading(false)
    }, 500)
  }, [params.id])

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

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Player not found</h2>
          <Link href="/players" className="text-blue-600 hover:text-blue-500 mt-2 inline-block">
            Back to Players
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-6">
              {/* Player Avatar */}
              <div className="h-20 w-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">#{player.jersey_number}</span>
              </div>
              
              {/* Player Info */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{player.name}</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPositionColor(player.position)}`}>
                    {player.position}
                  </span>
                  <span className="text-gray-600">Thunder Bay Lightning</span>
                  <span className="text-gray-600">2023-24 Season</span>
                </div>
              </div>
            </div>

            <Link
              href="/players"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
            >
              Back to Players
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Player Info & Stats */}
          <div className="lg:col-span-2 space-y-8">
            {/* Season Stats */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Season Statistics</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{player.points}</div>
                    <div className="text-sm text-gray-500">Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{player.goals}</div>
                    <div className="text-sm text-gray-500">Goals</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">{player.assists}</div>
                    <div className="text-sm text-gray-500">Assists</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{player.games_played}</div>
                    <div className="text-sm text-gray-500">Games Played</div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-xl font-semibold text-gray-900">{player.shots}</div>
                    <div className="text-sm text-gray-500">Shots</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-semibold text-gray-900">{player.shooting_percentage.toFixed(1)}%</div>
                    <div className="text-sm text-gray-500">Shooting %</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-semibold text-gray-900">
                      {player.plus_minus > 0 ? '+' : ''}{player.plus_minus}
                    </div>
                    <div className="text-sm text-gray-500">+/-</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-semibold text-gray-900">{player.time_on_ice}</div>
                    <div className="text-sm text-gray-500">TOI/Game</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Game Log */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Game Log</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Opponent
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        G
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        A
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pts
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shots
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        +/-
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        TOI
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {gameLog.map((game) => (
                      <tr key={game.game_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(game.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="mr-2">{game.is_home ? 'vs' : '@'}</span>
                          {game.opponent}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                          {game.goals}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                          {game.assists}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-blue-600">
                          {game.points}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                          {game.shots}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                          {game.plus_minus > 0 ? '+' : ''}{game.plus_minus}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                          {game.time_on_ice}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column - Player Details */}
          <div className="space-y-8">
            {/* Player Information */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Player Information</h2>
              </div>
              <div className="p-6">
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Age</dt>
                    <dd className="text-sm text-gray-900">{calculateAge(player.birth_date)} years old</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Birth Date</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(player.birth_date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Hometown</dt>
                    <dd className="text-sm text-gray-900">{player.hometown}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Height</dt>
                    <dd className="text-sm text-gray-900">{player.height}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Weight</dt>
                    <dd className="text-sm text-gray-900">{player.weight}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Shoots</dt>
                    <dd className="text-sm text-gray-900">{player.shoots === 'L' ? 'Left' : 'Right'}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Season Averages */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Per Game Averages</h2>
              </div>
              <div className="p-6">
                <dl className="space-y-4">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Points per Game</dt>
                    <dd className="text-sm font-bold text-blue-600">
                      {(player.points / player.games_played).toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Goals per Game</dt>
                    <dd className="text-sm font-bold text-green-600">
                      {(player.goals / player.games_played).toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Assists per Game</dt>
                    <dd className="text-sm font-bold text-yellow-600">
                      {(player.assists / player.games_played).toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Shots per Game</dt>
                    <dd className="text-sm text-gray-900">
                      {(player.shots / player.games_played).toFixed(1)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}