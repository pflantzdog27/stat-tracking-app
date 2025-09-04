import { NextRequest, NextResponse } from 'next/server'
import { statisticsEngine } from '@/lib/services/statistics-engine'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
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
    const { playerIds, teamId, season, categories } = body

    if (!playerIds?.length || !teamId || !season) {
      return NextResponse.json(
        { error: 'playerIds, teamId, and season are required' },
        { status: 400 }
      )
    }

    if (playerIds.length > 6) {
      return NextResponse.json(
        { error: 'Maximum 6 players can be compared at once' },
        { status: 400 }
      )
    }

    // Get stats for all requested players
    const playerComparisons = await Promise.all(
      playerIds.map(async (playerId: string) => {
        try {
          const stats = await statisticsEngine.getPlayerStats(
            playerId,
            teamId,
            season
          )

          if (!stats) return null

          // Extract requested categories or use default comparison stats
          const defaultCategories = [
            'gamesPlayed', 'goals', 'assists', 'points', 'shots', 
            'shootingPercentage', 'pointsPerGame', 'penaltyMinutes'
          ]
          
          const categoriesToCompare = categories || defaultCategories
          const comparisonData: any = {
            playerId,
            playerName: `${stats.player.firstName} ${stats.player.lastName}`,
            jerseyNumber: stats.player.jerseyNumber,
            position: stats.player.position
          }

          // Extract values for each category
          categoriesToCompare.forEach((category: string) => {
            comparisonData[category] = getStatValue(stats, category)
          })

          return comparisonData
        } catch (error) {
          console.error(`Error getting stats for player ${playerId}:`, error)
          return null
        }
      })
    )

    // Filter out failed requests
    const validComparisons = playerComparisons.filter(Boolean)

    if (validComparisons.length === 0) {
      return NextResponse.json(
        { error: 'No valid player data found' },
        { status: 404 }
      )
    }

    // Calculate team averages for context
    const { data: allPlayers } = await supabase
      .from('players')
      .select('id')
      .eq('team_id', teamId)
      .eq('active', true)

    let teamAverages: any = {}
    
    if (allPlayers?.length) {
      const allPlayerStats = await Promise.all(
        allPlayers.map(async (player) => {
          try {
            return await statisticsEngine.getPlayerStats(player.id, teamId, season)
          } catch {
            return null
          }
        })
      )

      const validPlayerStats = allPlayerStats.filter(Boolean)
      
      if (validPlayerStats.length > 0) {
        const categoriesToCompare = categories || [
          'gamesPlayed', 'goals', 'assists', 'points', 'shots', 
          'shootingPercentage', 'pointsPerGame', 'penaltyMinutes'
        ]

        categoriesToCompare.forEach((category: string) => {
          const values = validPlayerStats
            .map(stats => getStatValue(stats!, category))
            .filter(val => val !== undefined && val !== null)

          if (values.length > 0) {
            teamAverages[category] = values.reduce((sum, val) => sum + val, 0) / values.length
          }
        })
      }
    }

    // Calculate rankings within the comparison group
    const comparisonsWithRankings = validComparisons.map(player => {
      const playerWithRankings = { ...player }
      
      Object.keys(player).forEach(category => {
        if (category.includes('Id') || category.includes('Name') || category.includes('Number') || category === 'position') {
          return
        }

        // Calculate rank within this comparison group
        const values = validComparisons
          .map(p => p[category])
          .filter(val => val !== undefined && val !== null)
          .sort((a, b) => {
            // Most stats are "higher is better"
            const lowerIsBetter = [
              'goalsAgainstAverage', 
              'penaltyMinutes', 
              'penaltyMinutesPerGame'
            ].includes(category)
            
            return lowerIsBetter ? a - b : b - a
          })

        const rank = values.indexOf(player[category]) + 1
        playerWithRankings[`${category}Rank`] = rank > 0 ? rank : null
      })

      return playerWithRankings
    })

    return NextResponse.json({
      comparisons: comparisonsWithRankings,
      teamAverages,
      metadata: {
        teamId,
        season,
        playerCount: validComparisons.length,
        categories: categories || ['gamesPlayed', 'goals', 'assists', 'points', 'shots', 'shootingPercentage', 'pointsPerGame', 'penaltyMinutes'],
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error creating player comparison:', error)
    return NextResponse.json(
      { error: 'Failed to create player comparison' },
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
  
  return undefined
}