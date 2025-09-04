import { NextRequest, NextResponse } from 'next/server'
import { statisticsEngine } from '@/lib/services/statistics-engine'
import { positionStatsCalculator } from '@/lib/services/position-stats'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
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
    const category = searchParams.get('category') || 'points'
    const position = searchParams.get('position')
    const limit = parseInt(searchParams.get('limit') || '10')
    const minGames = parseInt(searchParams.get('minGames') || '5')

    if (!teamId || !season) {
      return NextResponse.json(
        { error: 'teamId and season are required' },
        { status: 400 }
      )
    }

    // Get all players for the team
    let query = supabase
      .from('players')
      .select('id, first_name, last_name, jersey_number, position')
      .eq('team_id', teamId)
      .eq('active', true)

    if (position && position !== 'all') {
      query = query.eq('position', position)
    }

    const { data: players } = await query

    if (!players?.length) {
      return NextResponse.json({
        category,
        leaders: [],
        lastUpdated: new Date().toISOString()
      })
    }

    // Calculate stats for all players and build leaderboard
    const leaderboard = []

    for (const player of players) {
      try {
        const stats = await statisticsEngine.getPlayerStats(
          player.id,
          teamId,
          season
        )

        if (!stats || stats.baseStats.gamesPlayed < minGames) {
          continue
        }

        const value = getStatValue(stats, category)
        if (value !== undefined && value !== null) {
          leaderboard.push({
            playerId: player.id,
            playerName: `${player.first_name} ${player.last_name}`,
            jerseyNumber: player.jersey_number,
            position: player.position,
            value,
            gamesPlayed: stats.baseStats.gamesPlayed,
            // Include contextual stats for better display
            goals: stats.baseStats.goals,
            assists: stats.baseStats.assists,
            points: stats.baseStats.points,
            ...(stats.derivedStats.shootingPercentage && { 
              shootingPercentage: stats.derivedStats.shootingPercentage 
            }),
            ...(stats.derivedStats.savePercentage && { 
              savePercentage: stats.derivedStats.savePercentage 
            })
          })
        }
      } catch (error) {
        console.error(`Error getting stats for player ${player.id}:`, error)
      }
    }

    // Sort by the requested category
    const sortedLeaderboard = leaderboard
      .sort((a, b) => {
        // Most stats are "higher is better", but some are "lower is better"
        const lowerIsBetter = [
          'goalsAgainstAverage', 
          'penaltyMinutes', 
          'penaltyMinutesPerGame',
          'giveaways',
          'giveawaysPerSixty'
        ].includes(category)
        
        if (lowerIsBetter) {
          return a.value - b.value
        } else {
          return b.value - a.value
        }
      })
      .slice(0, limit)

    return NextResponse.json({
      category,
      position: position || 'all',
      minGames,
      leaders: sortedLeaderboard,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error creating leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to create leaderboard' },
      { status: 500 }
    )
  }
}

function getStatValue(stats: any, category: string): number | undefined {
  // Check base stats
  if (stats.baseStats[category] !== undefined) {
    return stats.baseStats[category]
  }
  
  // Check skill stats (position-specific)
  if (stats.skillStats[category] !== undefined) {
    return stats.skillStats[category]
  }
  
  // Check derived stats (calculated metrics)
  if (stats.derivedStats[category] !== undefined) {
    return stats.derivedStats[category]
  }
  
  // Handle some common aliases
  const aliases: Record<string, string> = {
    'points_per_game': 'pointsPerGame',
    'shooting_percentage': 'shootingPercentage',
    'save_percentage': 'savePercentage',
    'goals_against_average': 'goalsAgainstAverage',
    'penalty_minutes_per_game': 'penaltyMinutesPerGame',
    'time_on_ice_per_game': 'timeOnIcePerGame',
    'power_play_points': 'powerPlayPoints',
    'short_handed_points': 'shortHandedPoints'
  }
  
  if (aliases[category]) {
    return getStatValue(stats, aliases[category])
  }
  
  return undefined
}