import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { playerId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')
    const season = searchParams.get('season')

    if (!teamId || !season) {
      return NextResponse.json(
        { error: 'teamId and season are required' },
        { status: 400 }
      )
    }

    // Get all games for the player in the season
    const { data: gameEvents } = await supabase
      .from('game_events')
      .select(`
        *,
        games!inner(
          id,
          game_date,
          season,
          home_team_id,
          away_team_id,
          home_score,
          away_score,
          status
        )
      `)
      .eq('player_id', params.playerId)
      .eq('games.season', season)
      .eq('games.status', 'completed')
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`, { foreignTable: 'games' })
      .order('games(game_date)', { ascending: false })

    if (!gameEvents?.length) {
      return NextResponse.json([])
    }

    // Get opponent team names
    const opponentIds = [...new Set(gameEvents.map(event => 
      event.games.home_team_id === teamId ? event.games.away_team_id : event.games.home_team_id
    ))]

    const { data: teams } = await supabase
      .from('teams')
      .select('id, name')
      .in('id', opponentIds)

    const teamNames = teams?.reduce((acc, team) => {
      acc[team.id] = team.name
      return acc
    }, {} as Record<string, string>) || {}

    // Group events by game and calculate game-by-game stats
    const gameStatsMap = new Map<string, any>()

    gameEvents.forEach(event => {
      const gameId = event.game_id
      const game = event.games
      const isHome = game.home_team_id === teamId
      const opponentId = isHome ? game.away_team_id : game.home_team_id
      const opponentName = teamNames[opponentId] || 'Unknown'

      if (!gameStatsMap.has(gameId)) {
        gameStatsMap.set(gameId, {
          gameId,
          date: game.game_date,
          opponent: opponentName,
          isHome,
          teamScore: isHome ? game.home_score : game.away_score,
          opponentScore: isHome ? game.away_score : game.home_score,
          goals: 0,
          assists: 0,
          points: 0,
          shots: 0,
          penaltyMinutes: 0,
          plusMinus: 0,
          timeOnIce: 0,
          saves: 0,
          shotsAgainst: 0,
          goalsAgainst: 0,
          events: []
        })
      }

      const gameStats = gameStatsMap.get(gameId)
      gameStats.events.push(event)

      // Aggregate stats based on event type
      switch (event.event_type) {
        case 'goal':
          gameStats.goals++
          gameStats.points++
          break
        case 'assist':
          gameStats.assists++
          gameStats.points++
          break
        case 'shot':
          gameStats.shots++
          break
        case 'penalty':
          gameStats.penaltyMinutes += event.event_details?.penalty_minutes || 0
          break
        case 'shift':
          gameStats.timeOnIce += event.event_details?.duration || 0
          break
      }

      // Handle plus/minus (simplified - would need more complex logic for actual implementation)
      if (event.event_type === 'goal') {
        const isPlayerTeamGoal = event.team_id === teamId
        const strength = event.event_details?.strength || 'even'
        
        if (strength === 'even') {
          if (isPlayerTeamGoal) {
            // Check if player was on ice (would need players_on_ice data)
            gameStats.plusMinus += 1
          } else {
            // Player was on ice for opponent goal
            gameStats.plusMinus -= 1
          }
        }
      }

      // Handle goalie stats
      if (event.event_type === 'shot' && event.team_id !== teamId) {
        gameStats.shotsAgainst++
        if (event.event_details?.saved_by === params.playerId) {
          gameStats.saves++
        }
      }

      if (event.event_type === 'goal' && event.team_id !== teamId) {
        if (event.event_details?.goalie_id === params.playerId) {
          gameStats.goalsAgainst++
        }
      }
    })

    // Convert to array and clean up
    const gameByGameStats = Array.from(gameStatsMap.values())
      .map(game => {
        // Remove the events array from response
        const { events, ...gameStats } = game
        return gameStats
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json(gameByGameStats)
  } catch (error) {
    console.error('Error fetching game-by-game stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch game-by-game statistics' },
      { status: 500 }
    )
  }
}