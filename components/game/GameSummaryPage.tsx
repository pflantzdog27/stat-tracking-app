'use client'

import { useState, useEffect } from 'react'
import GameBoxScore from './GameBoxScore'
import PlayerPerformances from './PlayerPerformances'
import GameTimeline from './GameTimeline'
import GameHighlights from './GameHighlights'
import SocialShare from './SocialShare'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface GameSummaryPageProps {
  gameId: string
  className?: string
}

interface GameData {
  id: string
  date: string
  homeTeam: {
    id: string
    name: string
    abbreviation: string
    logo: string
    score: number
  }
  awayTeam: {
    id: string
    name: string
    abbreviation: string
    logo: string
    score: number
  }
  status: 'scheduled' | 'live' | 'finished' | 'postponed'
  period: number
  timeRemaining: string
  venue: string
  attendance: number
  gameType: 'regular' | 'playoff' | 'preseason'
  season: string
  finalScore: {
    home: number
    away: number
    overtime: boolean
    shootout: boolean
  }
}

interface GameStats {
  teamStats: {
    home: TeamGameStats
    away: TeamGameStats
  }
  playerStats: {
    home: PlayerGameStats[]
    away: PlayerGameStats[]
  }
  events: GameEvent[]
  highlights: GameHighlight[]
}

interface TeamGameStats {
  goals: number
  shots: number
  hits: number
  blockedShots: number
  faceoffWins: number
  faceoffTotal: number
  powerPlayGoals: number
  powerPlayOpportunities: number
  penaltyMinutes: number
  saves: number
  shotsAgainst: number
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

interface GameEvent {
  id: string
  period: number
  time: string
  type: 'goal' | 'penalty' | 'hit' | 'save' | 'faceoff' | 'period_start' | 'period_end'
  team: 'home' | 'away'
  players: string[]
  description: string
  video?: string
}

interface GameHighlight {
  id: string
  title: string
  description: string
  timestamp: string
  type: 'goal' | 'save' | 'hit' | 'fight'
  video?: string
  thumbnail?: string
}

type ActiveView = 'summary' | 'boxscore' | 'players' | 'timeline' | 'highlights'

export default function GameSummaryPage({
  gameId,
  className = ''
}: GameSummaryPageProps) {
  const [activeView, setActiveView] = useState<ActiveView>('summary')
  const [gameData, setGameData] = useState<GameData | null>(null)
  const [gameStats, setGameStats] = useState<GameStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadGameData()
  }, [gameId])

  const loadGameData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load game basic info
      const gameResponse = await fetch(`/api/games/${gameId}`)
      if (!gameResponse.ok) {
        throw new Error('Failed to load game data')
      }
      const game = await gameResponse.json()
      setGameData(game)

      // Load detailed stats if game is finished or live
      if (game.status === 'finished' || game.status === 'live') {
        const statsResponse = await fetch(`/api/games/${gameId}/stats`)
        if (statsResponse.ok) {
          const stats = await statsResponse.json()
          setGameStats(stats)
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load game data')
    } finally {
      setLoading(false)
    }
  }

  const navigationItems = [
    { key: 'summary' as const, label: 'Summary', icon: '📊' },
    { key: 'boxscore' as const, label: 'Box Score', icon: '📋' },
    { key: 'players' as const, label: 'Players', icon: '👤' },
    { key: 'timeline' as const, label: 'Timeline', icon: '⏱️' },
    { key: 'highlights' as const, label: 'Highlights', icon: '⭐' }
  ]

  const getGameStatusDisplay = () => {
    if (!gameData) return ''
    
    switch (gameData.status) {
      case 'scheduled':
        return new Date(gameData.date).toLocaleString()
      case 'live':
        return `${gameData.period === 4 ? 'OT' : `P${gameData.period}`} ${gameData.timeRemaining}`
      case 'finished':
        return gameData.finalScore.overtime ? 'Final/OT' : gameData.finalScore.shootout ? 'Final/SO' : 'Final'
      case 'postponed':
        return 'Postponed'
      default:
        return ''
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen bg-gray-50 ${className}`}>
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error || !gameData) {
    return (
      <div className={`min-h-screen bg-gray-50 ${className}`}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-900 mb-2">Unable to Load Game</h3>
            <p className="text-red-700 mb-4">{error || 'Game not found'}</p>
            <button
              onClick={loadGameData}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 game-summary-container ${className}`}>
      {/* Game Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 game-nav-sticky">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6 game-header-container">
            {/* Team Matchup */}
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center space-x-4 sm:space-x-8">
                {/* Away Team */}
                <div className="flex items-center space-x-3">
                  <img 
                    src={gameData.awayTeam.logo} 
                    alt={gameData.awayTeam.name}
                    className="w-12 h-12 sm:w-16 sm:h-16 game-header-team-logo"
                  />
                  <div className="text-center sm:text-left">
                    <div className="font-bold text-lg sm:text-xl text-gray-900">
                      {gameData.awayTeam.abbreviation}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                      {gameData.awayTeam.name}
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div className="text-center px-4">
                  {gameData.status === 'finished' || gameData.status === 'live' ? (
                    <div className="text-2xl sm:text-4xl font-bold text-gray-900 game-header-score">
                      {gameData.awayTeam.score} - {gameData.homeTeam.score}
                    </div>
                  ) : (
                    <div className="text-lg sm:text-xl font-medium text-gray-600">
                      vs
                    </div>
                  )}
                  <div className="text-xs sm:text-sm text-gray-600 mt-1">
                    {getGameStatusDisplay()}
                  </div>
                </div>

                {/* Home Team */}
                <div className="flex items-center space-x-3">
                  <div className="text-center sm:text-right">
                    <div className="font-bold text-lg sm:text-xl text-gray-900">
                      {gameData.homeTeam.abbreviation}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                      {gameData.homeTeam.name}
                    </div>
                  </div>
                  <img 
                    src={gameData.homeTeam.logo} 
                    alt={gameData.homeTeam.name}
                    className="w-12 h-12 sm:w-16 sm:h-16 game-header-team-logo"
                  />
                </div>
              </div>
            </div>

            {/* Game Info */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-600">
              <span className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{gameData.venue}</span>
              </span>
              <span className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{new Date(gameData.date).toLocaleDateString()}</span>
              </span>
              {gameData.attendance > 0 && (
                <span className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>{gameData.attendance.toLocaleString()}</span>
                </span>
              )}
            </div>

            {/* Share Button */}
            <div className="flex justify-center mt-4">
              <SocialShare 
                gameData={gameData} 
                gameStats={gameStats}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide">
            {navigationItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveView(item.key)}
                className={`flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                  activeView === item.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-sm sm:text-base">{item.icon}</span>
                <span className="hidden xs:inline">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Summary View */}
        {activeView === 'summary' && (
          <div className="space-y-8">
            {gameStats && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <GameBoxScore 
                    gameData={gameData}
                    teamStats={gameStats.teamStats}
                    compact={true}
                  />
                  <PlayerPerformances 
                    playerStats={gameStats.playerStats}
                    gameData={gameData}
                    topPerformersOnly={true}
                  />
                </div>
                {gameStats.highlights && gameStats.highlights.length > 0 && (
                  <GameHighlights 
                    highlights={gameStats.highlights.slice(0, 3)}
                    gameData={gameData}
                    compact={true}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* Box Score View */}
        {activeView === 'boxscore' && gameStats && (
          <GameBoxScore 
            gameData={gameData}
            teamStats={gameStats.teamStats}
          />
        )}

        {/* Players View */}
        {activeView === 'players' && gameStats && (
          <PlayerPerformances 
            playerStats={gameStats.playerStats}
            gameData={gameData}
          />
        )}

        {/* Timeline View */}
        {activeView === 'timeline' && gameStats && (
          <GameTimeline 
            events={gameStats.events}
            gameData={gameData}
          />
        )}

        {/* Highlights View */}
        {activeView === 'highlights' && gameStats && (
          <GameHighlights 
            highlights={gameStats.highlights}
            gameData={gameData}
          />
        )}

        {/* No Stats Available */}
        {!gameStats && gameData.status === 'scheduled' && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Game Not Started</h3>
            <p className="text-gray-600">
              Game statistics and details will be available once the game begins.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}