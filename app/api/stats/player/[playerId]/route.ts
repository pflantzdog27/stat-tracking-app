import { NextRequest, NextResponse } from 'next/server'
import { statisticsEngine } from '@/lib/services/statistics-engine'
import { positionStatsCalculator } from '@/lib/services/position-stats'
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
    const includeAdvanced = searchParams.get('advanced') === 'true'
    const situationalStrength = searchParams.get('strength')
    const homeAway = searchParams.get('homeAway')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!teamId || !season) {
      return NextResponse.json(
        { error: 'teamId and season are required' },
        { status: 400 }
      )
    }

    const options = {
      situationalStrength: situationalStrength as any,
      homeAwayOnly: homeAway as any,
      dateRange: startDate && endDate ? { start: startDate, end: endDate } : undefined
    }

    const playerStats = await statisticsEngine.getPlayerStats(
      params.playerId,
      teamId,
      season,
      options
    )

    if (!playerStats) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      )
    }

    let advancedMetrics = null
    if (includeAdvanced) {
      advancedMetrics = await positionStatsCalculator.calculateAdvancedMetrics(
        params.playerId,
        teamId,
        season,
        playerStats.player.position,
        options
      )
    }

    return NextResponse.json({
      ...playerStats,
      advancedMetrics
    })
  } catch (error) {
    console.error('Error fetching player stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch player statistics' },
      { status: 500 }
    )
  }
}

export async function POST(
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

    const body = await request.json()
    const { teamId, season, recalculate = false } = body

    if (!teamId || !season) {
      return NextResponse.json(
        { error: 'teamId and season are required' },
        { status: 400 }
      )
    }

    // Force recalculation by bypassing cache
    if (recalculate) {
      // Clear cache for this player
      const cacheKey = `player_stats_${params.playerId}_${season}_{}`
      // Implementation would clear the specific cache entry
    }

    const playerStats = await statisticsEngine.getPlayerStats(
      params.playerId,
      teamId,
      season
    )

    return NextResponse.json(playerStats)
  } catch (error) {
    console.error('Error recalculating player stats:', error)
    return NextResponse.json(
      { error: 'Failed to recalculate player statistics' },
      { status: 500 }
    )
  }
}