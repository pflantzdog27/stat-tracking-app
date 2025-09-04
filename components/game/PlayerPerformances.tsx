'use client'

import { useState, useMemo } from 'react'

interface PlayerPerformancesProps {
  playerStats: {
    home: PlayerGameStats[]
    away: PlayerGameStats[]
  }
  gameData: {
    homeTeam: {
      id: string
      name: string
      abbreviation: string
      logo: string
    }
    awayTeam: {
      id: string
      name: string
      abbreviation: string
      logo: string
    }
  }
  topPerformersOnly?: boolean
  className?: string
}

interface PlayerGameStats {
  playerId: string
  name: string
  position: string
  goals: number
  assists: number
  points: number
  shots: number
  hits: number
  blocks: number
  timeOnIce: string
  plusMinus: number
  pim: number
  faceoffWins?: number
  faceoffAttempts?: number
  saves?: number
  shotsAgainst?: number
  goalsAgainst?: number
}

type SortKey = 'points' | 'goals' | 'assists' | 'shots' | 'timeOnIce' | 'hits' | 'blocks'
type ViewMode = 'all' | 'skaters' | 'goalies'

export default function PlayerPerformances({
  playerStats,
  gameData,
  topPerformersOnly = false,
  className = ''
}: PlayerPerformancesProps) {
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home')
  const [sortBy, setSortBy] = useState<SortKey>('points')
  const [viewMode, setViewMode] = useState<ViewMode>('skaters')

  const getTopPerformers = () => {
    const allPlayers = [...playerStats.home, ...playerStats.away]
    
    const topScorer = allPlayers.reduce((prev, current) => 
      current.points > prev.points ? current : prev
    )
    
    const topGoals = allPlayers.reduce((prev, current) => 
      current.goals > prev.goals ? current : prev
    )
    
    const topAssists = allPlayers.reduce((prev, current) => 
      current.assists > prev.assists ? current : prev
    )
    
    const topHits = allPlayers.reduce((prev, current) => 
      current.hits > prev.hits ? current : prev
    )

    return { topScorer, topGoals, topAssists, topHits }
  }

  const sortedPlayers = useMemo(() => {
    const teamPlayers = selectedTeam === 'home' ? playerStats.home : playerStats.away
    const filtered = teamPlayers.filter(player => {
      if (viewMode === 'goalies') return player.position === 'G'
      if (viewMode === 'skaters') return player.position !== 'G'
      return true
    })

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'timeOnIce':
          const timeToSeconds = (time: string) => {
            const [minutes, seconds] = time.split(':').map(Number)
            return minutes * 60 + seconds
          }
          return timeToSeconds(b.timeOnIce) - timeToSeconds(a.timeOnIce)
        case 'points':
        case 'goals':
        case 'assists':
        case 'shots':
        case 'hits':
        case 'blocks':
          return (b[sortBy] as number) - (a[sortBy] as number)
        default:
          return 0
      }
    })
  }, [playerStats, selectedTeam, sortBy, viewMode])

  const formatTimeOnIce = (time: string) => {
    const [minutes, seconds] = time.split(':')
    return `${minutes}:${seconds.padStart(2, '0')}`
  }

  const getPlayerTeam = (playerId: string) => {
    return playerStats.home.some(p => p.playerId === playerId) ? 'home' : 'away'
  }

  if (topPerformersOnly) {
    const { topScorer, topGoals, topAssists, topHits } = getTopPerformers()
    
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Top Performers
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
            <div>
              <div className="font-medium text-blue-900">{topScorer.name}</div>
              <div className="text-sm text-blue-700">{topScorer.points} Points</div>
            </div>
            <div className="text-xs text-blue-600 font-medium">Top Scorer</div>
          </div>
          
          {topGoals.playerId !== topScorer.playerId && (
            <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
              <div>
                <div className="font-medium text-green-900">{topGoals.name}</div>
                <div className="text-sm text-green-700">{topGoals.goals} Goals</div>
              </div>
              <div className="text-xs text-green-600 font-medium">Top Goals</div>
            </div>
          )}
          
          {topAssists.playerId !== topScorer.playerId && topAssists.playerId !== topGoals.playerId && (
            <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
              <div>
                <div className="font-medium text-purple-900">{topAssists.name}</div>
                <div className="text-sm text-purple-700">{topAssists.assists} Assists</div>
              </div>
              <div className="text-xs text-purple-600 font-medium">Top Assists</div>
            </div>
          )}
          
          <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
            <div>
              <div className="font-medium text-orange-900">{topHits.name}</div>
              <div className="text-sm text-orange-700">{topHits.hits} Hits</div>
            </div>
            <div className="text-xs text-orange-600 font-medium">Most Hits</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Player Statistics
          </h2>
          
          <div className="flex flex-wrap gap-2">
            {/* Team Toggle */}
            <div className="flex rounded-md bg-gray-100 p-1">
              <button
                onClick={() => setSelectedTeam('away')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  selectedTeam === 'away'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {gameData.awayTeam.abbreviation}
              </button>
              <button
                onClick={() => setSelectedTeam('home')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  selectedTeam === 'home'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {gameData.homeTeam.abbreviation}
              </button>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex rounded-md bg-gray-100 p-1">
              <button
                onClick={() => setViewMode('skaters')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  viewMode === 'skaters'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Skaters
              </button>
              <button
                onClick={() => setViewMode('goalies')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  viewMode === 'goalies'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Goalies
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        {viewMode === 'goalies' ? (
          // Goalie Stats Table
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Player</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">TOI</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">Saves</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">SA</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">GA</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">SV%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedPlayers.map((player) => (
                <tr key={player.playerId} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{player.name}</div>
                    <div className="text-xs text-gray-500">{player.position}</div>
                  </td>
                  <td className="px-4 py-3 text-center font-medium">
                    {formatTimeOnIce(player.timeOnIce)}
                  </td>
                  <td className="px-4 py-3 text-center">{player.saves || 0}</td>
                  <td className="px-4 py-3 text-center">{player.shotsAgainst || 0}</td>
                  <td className="px-4 py-3 text-center">{player.goalsAgainst || 0}</td>
                  <td className="px-4 py-3 text-center">
                    {player.shotsAgainst && player.saves 
                      ? ((player.saves / player.shotsAgainst) * 100).toFixed(1) + '%'
                      : '0.0%'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          // Skater Stats Table
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-4 py-3 text-left font-medium text-gray-600">Player</th>
                <th 
                  className="px-2 sm:px-3 py-3 text-center font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                  onClick={() => setSortBy('goals')}
                >
                  G {sortBy === 'goals' && '↓'}
                </th>
                <th 
                  className="px-2 sm:px-3 py-3 text-center font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                  onClick={() => setSortBy('assists')}
                >
                  A {sortBy === 'assists' && '↓'}
                </th>
                <th 
                  className="px-2 sm:px-3 py-3 text-center font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                  onClick={() => setSortBy('points')}
                >
                  P {sortBy === 'points' && '↓'}
                </th>
                <th 
                  className="px-2 sm:px-3 py-3 text-center font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                  onClick={() => setSortBy('shots')}
                >
                  S {sortBy === 'shots' && '↓'}
                </th>
                <th 
                  className="px-2 sm:px-3 py-3 text-center font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                  onClick={() => setSortBy('timeOnIce')}
                >
                  TOI {sortBy === 'timeOnIce' && '↓'}
                </th>
                <th className="px-2 sm:px-3 py-3 text-center font-medium text-gray-600">+/-</th>
                <th className="px-2 sm:px-3 py-3 text-center font-medium text-gray-600">PIM</th>
                <th 
                  className="px-2 sm:px-3 py-3 text-center font-medium text-gray-600 cursor-pointer hover:text-gray-900 hidden sm:table-cell"
                  onClick={() => setSortBy('hits')}
                >
                  Hits {sortBy === 'hits' && '↓'}
                </th>
                <th 
                  className="px-2 sm:px-3 py-3 text-center font-medium text-gray-600 cursor-pointer hover:text-gray-900 hidden sm:table-cell"
                  onClick={() => setSortBy('blocks')}
                >
                  Blocks {sortBy === 'blocks' && '↓'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedPlayers.map((player) => (
                <tr key={player.playerId} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-4 py-3">
                    <div className="font-medium text-gray-900">{player.name}</div>
                    <div className="text-xs text-gray-500">{player.position}</div>
                  </td>
                  <td className="px-2 sm:px-3 py-3 text-center font-medium">
                    {player.goals > 0 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {player.goals}
                      </span>
                    )}
                    {player.goals === 0 && <span className="text-gray-400">0</span>}
                  </td>
                  <td className="px-2 sm:px-3 py-3 text-center font-medium">
                    {player.assists > 0 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {player.assists}
                      </span>
                    )}
                    {player.assists === 0 && <span className="text-gray-400">0</span>}
                  </td>
                  <td className="px-2 sm:px-3 py-3 text-center font-bold">
                    {player.points > 0 ? player.points : <span className="text-gray-400">0</span>}
                  </td>
                  <td className="px-2 sm:px-3 py-3 text-center">{player.shots}</td>
                  <td className="px-2 sm:px-3 py-3 text-center font-medium">
                    {formatTimeOnIce(player.timeOnIce)}
                  </td>
                  <td className={`px-2 sm:px-3 py-3 text-center font-medium ${
                    player.plusMinus > 0 ? 'text-green-600' : 
                    player.plusMinus < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {player.plusMinus > 0 ? `+${player.plusMinus}` : player.plusMinus}
                  </td>
                  <td className="px-2 sm:px-3 py-3 text-center">
                    {player.pim > 0 ? player.pim : <span className="text-gray-400">0</span>}
                  </td>
                  <td className="px-2 sm:px-3 py-3 text-center hidden sm:table-cell">{player.hits}</td>
                  <td className="px-2 sm:px-3 py-3 text-center hidden sm:table-cell">{player.blocks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {sortedPlayers.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No {viewMode} found for this team.</p>
        </div>
      )}
    </div>
  )
}