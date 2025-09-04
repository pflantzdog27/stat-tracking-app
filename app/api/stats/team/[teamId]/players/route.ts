import { NextRequest, NextResponse } from 'next/server'
import { statisticsEngine } from '@/lib/services/statistics-engine'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
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
    const season = searchParams.get('season')
    const position = searchParams.get('position')
    const minGames = searchParams.get('minGames')
    const sortBy = searchParams.get('sortBy') || 'points'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    if (!season) {
      return NextResponse.json(
        { error: 'season is required' },
        { status: 400 }
      )
    }

    // Get all team players
    let query = supabase
      .from('players')
      .select('id, first_name, last_name, jersey_number, position')
      .eq('team_id', params.teamId)
      .eq('active', true)

    if (position && position !== 'all') {
      query = query.eq('position', position)
    }

    const { data: players } = await query

    if (!players?.length) {
      return NextResponse.json([])
    }

    // Calculate stats for all players
    const playersWithStats = await Promise.all(
      players.map(async (player) => {
        try {
          const stats = await statisticsEngine.getPlayerStats(
            player.id,
            params.teamId,
            season
          )
          
          if (!stats) return null
          
          // Apply minimum games filter
          if (minGames && stats.baseStats.gamesPlayed < parseInt(minGames)) {
            return null
          }

          return {
            ...player,
            stats
          }
        } catch (error) {
          console.error(`Error getting stats for player ${player.id}:`, error)
          return null
        }
      })
    )

    // Filter out null results
    const validPlayersWithStats = playersWithStats.filter(Boolean)

    // Sort players by requested stat
    validPlayersWithStats.sort((a, b) => {
      const aValue = this.getStatValue(a!.stats, sortBy)
      const bValue = this.getStatValue(b!.stats, sortBy)
      
      if (sortOrder === 'desc') {
        return (bValue || 0) - (aValue || 0)
      } else {
        return (aValue || 0) - (bValue || 0)
      }
    })

    return NextResponse.json(validPlayersWithStats)
  } catch (error) {
    console.error('Error fetching team player stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team player statistics' },
      { status: 500 }
    )
  }
}

function getStatValue(stats: any, statKey: string): number {
  // Helper function to extract stat values from the complex stats object
  if (stats.baseStats[statKey] !== undefined) {
    return stats.baseStats[statKey]
  }
  
  if (stats.skillStats[statKey] !== undefined) {
    return stats.skillStats[statKey]
  }
  
  if (stats.derivedStats[statKey] !== undefined) {
    return stats.derivedStats[statKey]
  }
  
  return 0
}