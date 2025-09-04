import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')
    const season = searchParams.get('season')
    const stat = searchParams.get('stat') || 'points'
    const gameCount = parseInt(searchParams.get('gameCount') || '10')

    if (!teamId || !season) {
      return NextResponse.json(
        { error: 'teamId and season are required' },
        { status: 400 }
      )
    }

    // Get game-by-game stats for the player
    const { data: gameStats } = await supabase
      .from('game_events')
      .select(`
        game_id,
        event_type,
        event_details,
        games!inner(
          id,
          game_date,
          home_team_id,
          away_team_id,
          home_score,
          away_score
        )
      `)
      .eq('player_id', params.playerId)
      .eq('games.season', season)
      .eq('games.status', 'completed')
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`, { foreignTable: 'games' })
      .order('games(game_date)', { ascending: true })

    if (!gameStats?.length) {
      return NextResponse.json({
        playerId: params.playerId,
        stat,
        games: [],
        overallTrend: 'stable',
        trendPercentage: 0
      })
    }

    // Group events by game and calculate game-by-game stat values
    const gameMap = new Map<string, {
      gameId: string
      date: string
      opponent: string
      value: number
      events: any[]
    }>()

    gameStats.forEach(event => {
      const gameId = event.game_id
      if (!gameMap.has(gameId)) {
        const isHome = event.games.home_team_id === teamId
        const opponent = isHome ? 
          event.games.away_team_id : 
          event.games.home_team_id

        gameMap.set(gameId, {
          gameId,
          date: event.games.game_date,
          opponent,
          value: 0,
          events: []
        })
      }

      gameMap.get(gameId)!.events.push(event)
    })

    // Calculate stat values for each game
    const gameStatValues = Array.from(gameMap.values()).map(game => {
      game.value = calculateGameStatValue(game.events, stat)
      return game
    })

    // Sort by date and take the most recent games
    const recentGames = gameStatValues
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, gameCount)
      .reverse() // Show chronologically

    // Calculate running averages
    const gamesWithRunningAvg = recentGames.map((game, index) => {
      const gamesUpToThis = recentGames.slice(0, index + 1)
      const runningAverage = gamesUpToThis.reduce((sum, g) => sum + g.value, 0) / gamesUpToThis.length

      return {
        gameId: game.gameId,
        date: game.date,
        value: game.value,
        opponent: game.opponent,
        runningAverage: Math.round(runningAverage * 100) / 100
      }
    })

    // Calculate overall trend
    const { trend, percentage } = calculateTrend(gamesWithRunningAvg)

    return NextResponse.json({
      playerId: params.playerId,
      stat,
      games: gamesWithRunningAvg,
      overallTrend: trend,
      trendPercentage: percentage
    })
  } catch (error) {
    console.error('Error fetching player trends:', error)
    return NextResponse.json(
      { error: 'Failed to fetch player trends' },
      { status: 500 }
    )
  }
}

function calculateGameStatValue(events: any[], statType: string): number {
  let value = 0

  events.forEach(event => {
    switch (statType) {
      case 'goals':
        if (event.event_type === 'goal') value++
        break
      case 'assists':
        if (event.event_type === 'assist') value++
        break
      case 'points':
        if (event.event_type === 'goal' || event.event_type === 'assist') value++
        break
      case 'shots':
        if (event.event_type === 'shot') value++
        break
      case 'penaltyMinutes':
        if (event.event_type === 'penalty') {
          value += event.event_details?.penalty_minutes || 0
        }
        break
      case 'hits':
        if (event.event_type === 'hit') value++
        break
      case 'blocked':
        if (event.event_type === 'blocked_shot') value++
        break
      case 'saves':
        if (event.event_type === 'shot' && event.event_details?.saved_by) value++
        break
      default:
        // For other stats, try to extract from event details
        if (event.event_details?.[statType] !== undefined) {
          value += event.event_details[statType]
        }
    }
  })

  return value
}

function calculateTrend(games: any[]): { trend: 'improving' | 'declining' | 'stable', percentage: number } {
  if (games.length < 2) {
    return { trend: 'stable', percentage: 0 }
  }

  // Simple linear regression to determine trend
  const n = games.length
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0

  games.forEach((game, index) => {
    const x = index + 1
    const y = game.value
    sumX += x
    sumY += y
    sumXY += x * y
    sumX2 += x * x
  })

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const avgValue = sumY / n

  // Calculate percentage change
  const percentage = avgValue > 0 ? Math.abs((slope / avgValue) * 100) : 0

  // Determine trend direction
  if (Math.abs(slope) < 0.1) {
    return { trend: 'stable', percentage: Math.round(percentage * 100) / 100 }
  } else if (slope > 0) {
    return { trend: 'improving', percentage: Math.round(percentage * 100) / 100 }
  } else {
    return { trend: 'declining', percentage: Math.round(percentage * 100) / 100 }
  }
}