'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface Game {
  id: string
  team_id: string
  opponent: string
  game_date: string
  is_home: boolean
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  period?: number
  time_remaining?: string
  final_score_us?: number
  final_score_them?: number
  teams?: {
    name: string
    season: string
  }
}

interface PlayerStats {
  id: string
  player_name: string
  jersey_number: number
  position: string
  goals: number
  assists: number
  points: number
  shots: number
  hits: number
  penalty_minutes: number
}

interface GameEvent {
  id: string
  player_name: string
  player_number: number
  event_type: string
  period: number
  time: string
  penalty_type?: string
  penalty_minutes?: number
  description?: string
}

export default function GameStatsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const gameId = params.id as string

  const [game, setGame] = useState<Game | null>(null)
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([])
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && gameId) {
      loadGameStats()
    }
  }, [user, gameId])

  const loadGameStats = async () => {
    try {
      setLoading(true)
      
      // Load game details
      const gameResponse = await fetch(`/api/games/${gameId}`)
      if (!gameResponse.ok) {
        throw new Error('Failed to load game')
      }
      const { game: gameData } = await gameResponse.json()
      setGame(gameData)

      // For demo purposes, generate mock stats data
      // In real app, this would load from the database
      const mockPlayerStats: PlayerStats[] = [
        {
          id: '1',
          player_name: 'Connor McDavid Jr',
          jersey_number: 97,
          position: 'C',
          goals: 2,
          assists: 1,
          points: 3,
          shots: 6,
          hits: 2,
          penalty_minutes: 0
        },
        {
          id: '2',
          player_name: 'Jake Thompson',
          jersey_number: 19,
          position: 'LW',
          goals: 1,
          assists: 2,
          points: 3,
          shots: 4,
          hits: 3,
          penalty_minutes: 2
        },
        {
          id: '3',
          player_name: 'Ryan Mitchell',
          jersey_number: 88,
          position: 'RW',
          goals: 1,
          assists: 0,
          points: 1,
          shots: 3,
          hits: 1,
          penalty_minutes: 0
        },
        {
          id: '4',
          player_name: 'Erik Karlsson Jr',
          jersey_number: 65,
          position: 'D',
          goals: 0,
          assists: 1,
          points: 1,
          shots: 2,
          hits: 4,
          penalty_minutes: 0
        },
        {
          id: '5',
          player_name: 'Sam Garcia',
          jersey_number: 4,
          position: 'D',
          goals: 0,
          assists: 0,
          points: 0,
          shots: 1,
          hits: 6,
          penalty_minutes: 4
        },
        {
          id: '6',
          player_name: 'Carter Price Jr',
          jersey_number: 31,
          position: 'G',
          goals: 0,
          assists: 0,
          points: 0,
          shots: 0,
          hits: 0,
          penalty_minutes: 0
        }
      ]

      const mockGameEvents: GameEvent[] = [
        {
          id: '1',
          player_name: 'Connor McDavid Jr',
          player_number: 97,
          event_type: 'goal',
          period: 1,
          time: '12:45'
        },
        {
          id: '2',
          player_name: 'Jake Thompson',
          player_number: 19,
          event_type: 'assist',
          period: 1,
          time: '12:45'
        },
        {
          id: '3',
          player_name: 'Ryan Mitchell',
          player_number: 88,
          event_type: 'goal',
          period: 2,
          time: '08:22'
        },
        {
          id: '4',
          player_name: 'Connor McDavid Jr',
          player_number: 97,
          event_type: 'goal',
          period: 3,
          time: '15:30'
        },
        {
          id: '5',
          player_name: 'Jake Thompson',
          player_number: 19,
          event_type: 'penalty',
          period: 2,
          time: '05:15',
          penalty_type: 'tripping',
          penalty_minutes: 2,
          description: 'Tripping'
        }
      ]

      setPlayerStats(mockPlayerStats)
      setGameEvents(mockGameEvents)

    } catch (error) {
      console.error('Error loading game stats:', error)
      router.push('/games?error=load-failed')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

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

  if (!game) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Game Not Found</h1>
          <Link href="/games" className="text-blue-600 hover:text-blue-800">
            Back to Games
          </Link>
        </div>
      </div>
    )
  }

  const gameResult = (game.final_score_us || 0) > (game.final_score_them || 0) ? 'Won' : 
                     (game.final_score_us || 0) < (game.final_score_them || 0) ? 'Lost' : 'Tied'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Game Statistics</h1>
              <p className="text-gray-600 mt-1">
                {game.teams?.name || 'Your Team'} vs {game.opponent} - {formatDate(game.game_date)}
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/games/${gameId}`}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium"
              >
                Back to Game
              </Link>
              <Link
                href="/games"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
              >
                All Games
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Game Result Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Final Score</h2>
            <div className="flex items-center justify-center space-x-12">
              <div className="text-center">
                <div className="text-lg font-medium text-gray-900">{game.teams?.name || 'Your Team'}</div>
                <div className={`text-6xl font-bold ${gameResult === 'Won' ? 'text-green-600' : gameResult === 'Lost' ? 'text-red-600' : 'text-gray-600'}`}>
                  {game.final_score_us || 0}
                </div>
              </div>
              <div className="text-gray-400 text-2xl font-bold">-</div>
              <div className="text-center">
                <div className="text-lg font-medium text-gray-900">{game.opponent}</div>
                <div className={`text-6xl font-bold ${gameResult === 'Lost' ? 'text-green-600' : gameResult === 'Won' ? 'text-red-600' : 'text-gray-600'}`}>
                  {game.final_score_them || 0}
                </div>
              </div>
            </div>
            <div className={`mt-4 text-xl font-bold ${
              gameResult === 'Won' ? 'text-green-600' : 
              gameResult === 'Lost' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {gameResult.toUpperCase()} {game.final_score_us}-{game.final_score_them}
            </div>
          </div>
        </div>

        {/* Player Statistics */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Player Statistics</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    G
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    A
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    P
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shots
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PIM
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {playerStats.map((player) => (
                  <tr key={player.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                          <span className="text-xs font-bold">#{player.jersey_number}</span>
                        </div>
                        <div className="font-medium text-gray-900">{player.player_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPositionColor(player.position)}`}>
                        {player.position}
                      </span>
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
                      {player.hits}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {player.penalty_minutes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Game Events */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Game Events</h2>
          <div className="space-y-4">
            {gameEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">#{event.player_number}</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{event.player_name}</div>
                    <div className="text-sm text-gray-500">
                      {event.event_type === 'penalty' && event.penalty_type
                        ? `${event.penalty_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} (${event.penalty_minutes} min)`
                        : event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)
                      }
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    P{event.period} - {event.time}
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    event.event_type === 'goal' ? 'bg-green-100 text-green-800' :
                    event.event_type === 'assist' ? 'bg-blue-100 text-blue-800' :
                    event.event_type === 'penalty' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {event.event_type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}