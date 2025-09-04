import { supabase } from '@/lib/supabase/client'
import {
  BasePlayerStats,
  GoalieStats,
  SkaterStats,
  ForwardStats,
  DefenseStats,
  AdvancedMetrics,
  StatsCalculationOptions
} from '@/types/statistics'

export class PositionStatsCalculator {
  
  async calculateForwardStats(
    playerId: string,
    teamId: string,
    season: string,
    baseStats: BasePlayerStats,
    options?: StatsCalculationOptions
  ): Promise<ForwardStats> {
    const { data: events } = await supabase
      .from('game_events')
      .select(`
        *,
        games!inner(season, status, home_team_id, away_team_id)
      `)
      .eq('player_id', playerId)
      .eq('games.season', season)
      .eq('games.status', 'completed')
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`, { foreignTable: 'games' })

    const forwardStats: ForwardStats = {
      ...baseStats,
      timeOnIce: 0,
      powerPlayGoals: 0,
      powerPlayAssists: 0,
      shortHandedGoals: 0,
      shortHandedAssists: 0,
      gameWinningGoals: 0,
      overtimeGoals: 0,
      faceoffPercentage: 0
    }

    let totalFaceoffs = 0
    let faceoffWins = 0

    events?.forEach(event => {
      const strength = event.event_details?.strength
      const isGameWinning = event.event_details?.game_winning === true
      const isOvertime = event.event_details?.overtime === true

      switch (event.event_type) {
        case 'goal':
          if (strength === 'powerplay') forwardStats.powerPlayGoals++
          if (strength === 'shorthanded') forwardStats.shortHandedGoals++
          if (isGameWinning) forwardStats.gameWinningGoals++
          if (isOvertime) forwardStats.overtimeGoals++
          break

        case 'assist':
          if (strength === 'powerplay') forwardStats.powerPlayAssists++
          if (strength === 'shorthanded') forwardStats.shortHandedAssists++
          break

        case 'faceoff':
          totalFaceoffs++
          if (event.event_details?.won === true) {
            faceoffWins++
          }
          break

        case 'shift':
          forwardStats.timeOnIce += event.event_details?.duration || 0
          break
      }
    })

    // Calculate faceoff percentage for centers
    if (totalFaceoffs > 0) {
      forwardStats.faceoffPercentage = (faceoffWins / totalFaceoffs) * 100
    }

    return forwardStats
  }

  async calculateDefenseStats(
    playerId: string,
    teamId: string,
    season: string,
    baseStats: BasePlayerStats,
    options?: StatsCalculationOptions
  ): Promise<DefenseStats> {
    const { data: events } = await supabase
      .from('game_events')
      .select(`
        *,
        games!inner(season, status, home_team_id, away_team_id)
      `)
      .eq('player_id', playerId)
      .eq('games.season', season)
      .eq('games.status', 'completed')
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`, { foreignTable: 'games' })

    const defenseStats: DefenseStats = {
      ...baseStats,
      timeOnIce: 0,
      powerPlayGoals: 0,
      powerPlayAssists: 0,
      shortHandedGoals: 0,
      shortHandedAssists: 0,
      gameWinningGoals: 0,
      overtimeGoals: 0,
      blocked: 0
    }

    events?.forEach(event => {
      const strength = event.event_details?.strength
      const isGameWinning = event.event_details?.game_winning === true
      const isOvertime = event.event_details?.overtime === true

      switch (event.event_type) {
        case 'goal':
          if (strength === 'powerplay') defenseStats.powerPlayGoals++
          if (strength === 'shorthanded') defenseStats.shortHandedGoals++
          if (isGameWinning) defenseStats.gameWinningGoals++
          if (isOvertime) defenseStats.overtimeGoals++
          break

        case 'assist':
          if (strength === 'powerplay') defenseStats.powerPlayAssists++
          if (strength === 'shorthanded') defenseStats.shortHandedAssists++
          break

        case 'blocked_shot':
          defenseStats.blocked++
          break

        case 'shift':
          defenseStats.timeOnIce += event.event_details?.duration || 0
          break
      }
    })

    return defenseStats
  }

  async calculateGoalieStats(
    playerId: string,
    teamId: string,
    season: string,
    baseStats: BasePlayerStats,
    options?: StatsCalculationOptions
  ): Promise<GoalieStats> {
    // Get all game events where this goalie was involved
    const { data: allEvents } = await supabase
      .from('game_events')
      .select(`
        *,
        games!inner(
          id, season, status, home_team_id, away_team_id, 
          home_score, away_score, overtime, shootout
        )
      `)
      .eq('games.season', season)
      .eq('games.status', 'completed')
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`, { foreignTable: 'games' })

    const goalieStats: GoalieStats = {
      ...baseStats,
      saves: 0,
      shotsAgainst: 0,
      goalsAgainst: 0,
      shutouts: 0,
      wins: 0,
      losses: 0,
      overtimeLosses: 0,
      timeOnIce: 0
    }

    const gameResults = new Map<string, {
      goalsAgainst: number
      shotsAgainst: number
      saves: number
      timeOnIce: number
      gameInfo: any
    }>()

    // Process all events to build game-by-game goalie stats
    allEvents?.forEach(event => {
      const gameId = event.game_id
      
      if (!gameResults.has(gameId)) {
        gameResults.set(gameId, {
          goalsAgainst: 0,
          shotsAgainst: 0,
          saves: 0,
          timeOnIce: 0,
          gameInfo: event.games
        })
      }

      const game = gameResults.get(gameId)!

      // Track saves and shots against
      if (event.event_type === 'shot' || event.event_type === 'goal') {
        const isOpponentShot = event.team_id !== teamId
        const savedBy = event.event_details?.saved_by
        const goalieId = event.event_details?.goalie_id

        if (isOpponentShot) {
          if (event.event_type === 'shot' && event.event_details?.on_goal) {
            if (savedBy === playerId) {
              game.saves++
              game.shotsAgainst++
            } else if (goalieId === playerId) {
              // Shot on goal but not saved by this goalie (likely a goal)
              game.shotsAgainst++
            }
          } else if (event.event_type === 'goal' && goalieId === playerId) {
            game.goalsAgainst++
            game.shotsAgainst++
          }
        }
      }

      // Track goalie ice time
      if (event.event_type === 'goalie_change') {
        if (event.event_details?.goalie_in === playerId) {
          game.timeOnIce += event.event_details?.duration || 0
        }
      }

      // Track shifts for goalies (if recorded)
      if (event.event_type === 'shift' && event.player_id === playerId) {
        game.timeOnIce += event.event_details?.duration || 0
      }
    })

    // Aggregate game results
    for (const [gameId, gameData] of gameResults) {
      // Only count games where the goalie played significant time
      if (gameData.timeOnIce > 0 || gameData.shotsAgainst > 0) {
        goalieStats.saves += gameData.saves
        goalieStats.shotsAgainst += gameData.shotsAgainst
        goalieStats.goalsAgainst += gameData.goalsAgainst
        goalieStats.timeOnIce += gameData.timeOnIce

        // Check for shutout
        if (gameData.goalsAgainst === 0 && gameData.shotsAgainst > 0) {
          goalieStats.shutouts++
        }

        // Determine win/loss (simplified logic)
        const game = gameData.gameInfo
        if (game) {
          const isHome = game.home_team_id === teamId
          const teamScore = isHome ? game.home_score : game.away_score
          const oppScore = isHome ? game.away_score : game.home_score

          if (teamScore > oppScore) {
            goalieStats.wins++
          } else if (teamScore < oppScore) {
            // Check if it was overtime/shootout loss (gets a point)
            if (game.overtime || game.shootout) {
              goalieStats.overtimeLosses++
            } else {
              goalieStats.losses++
            }
          }
        }
      }
    }

    return goalieStats
  }

  async calculateAdvancedMetrics(
    playerId: string,
    teamId: string,
    season: string,
    position: 'F' | 'D' | 'G',
    options?: StatsCalculationOptions
  ): Promise<AdvancedMetrics> {
    const { data: events } = await supabase
      .from('game_events')
      .select(`
        *,
        games!inner(season, status, home_team_id, away_team_id)
      `)
      .eq('player_id', playerId)
      .eq('games.season', season)
      .eq('games.status', 'completed')
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`, { foreignTable: 'games' })

    const advanced: AdvancedMetrics = {
      playerId,
      season,
      expectedGoals: 0,
      actualGoals: 0,
      goalsDifference: 0,
      offensiveZoneStartPercentage: 0,
      qualityOfCompetition: 0,
      qualityOfTeammates: 0,
      evenStrengthGoals: 0,
      evenStrengthAssists: 0,
      powerPlayTimeOnIce: 0,
      penaltyKillTimeOnIce: 0,
      pointsPerSixty: 0,
      primaryAssistPercentage: 0,
      individualShotAttempts: 0,
      teamShotAttempts: 0,
      shotsBlockedPer60: 0,
      hitsPerSixty: 0,
      takeawaysPerSixty: 0,
      giveawaysPerSixty: 0
    }

    let totalTimeOnIce = 0
    let oZoneStarts = 0
    let totalStarts = 0
    let primaryAssists = 0
    let totalAssists = 0

    events?.forEach(event => {
      const strength = event.event_details?.strength || 'even'

      switch (event.event_type) {
        case 'goal':
          advanced.actualGoals++
          if (strength === 'even') advanced.evenStrengthGoals++
          // Expected goals would require shot location/type data
          advanced.expectedGoals += this.calculateExpectedGoal(event)
          break

        case 'assist':
          totalAssists++
          if (strength === 'even') advanced.evenStrengthAssists++
          if (event.event_details?.assist_type === 'primary') {
            primaryAssists++
          }
          break

        case 'shot':
          advanced.individualShotAttempts++
          break

        case 'shift':
          const duration = event.event_details?.duration || 0
          totalTimeOnIce += duration

          if (strength === 'powerplay') {
            advanced.powerPlayTimeOnIce += duration
          } else if (strength === 'penalty_kill') {
            advanced.penaltyKillTimeOnIce += duration
          }

          // Track zone starts
          const startZone = event.event_details?.start_zone
          if (startZone) {
            totalStarts++
            if (startZone === 'offensive') oZoneStarts++
          }
          break

        case 'blocked_shot':
          advanced.shotsBlockedPer60++
          break

        case 'hit':
          advanced.hitsPerSixty++
          break

        case 'takeaway':
          advanced.takeawaysPerSixty++
          break

        case 'giveaway':
          advanced.giveawaysPerSixty++
          break
      }
    })

    // Calculate percentages and per-60 stats
    if (totalStarts > 0) {
      advanced.offensiveZoneStartPercentage = (oZoneStarts / totalStarts) * 100
    }

    if (totalAssists > 0) {
      advanced.primaryAssistPercentage = (primaryAssists / totalAssists) * 100
    }

    const timeOnIceHours = totalTimeOnIce / 60
    if (timeOnIceHours > 0) {
      const points = advanced.actualGoals + totalAssists
      advanced.pointsPerSixty = (points / timeOnIceHours) * 60
      advanced.shotsBlockedPer60 = (advanced.shotsBlockedPer60 / timeOnIceHours) * 60
      advanced.hitsPerSixty = (advanced.hitsPerSixty / timeOnIceHours) * 60
      advanced.takeawaysPerSixty = (advanced.takeawaysPerSixty / timeOnIceHours) * 60
      advanced.giveawaysPerSixty = (advanced.giveawaysPerSixty / timeOnIceHours) * 60
    }

    advanced.goalsDifference = advanced.actualGoals - advanced.expectedGoals

    // Quality metrics would require more complex calculations with opponent/teammate data
    advanced.qualityOfCompetition = await this.calculateQualityOfCompetition(playerId, teamId, season)
    advanced.qualityOfTeammates = await this.calculateQualityOfTeammates(playerId, teamId, season)

    return advanced
  }

  private calculateExpectedGoal(event: any): number {
    // Simplified expected goals calculation
    // In reality, this would use shot location, type, situation, etc.
    const shotType = event.event_details?.shot_type
    const shotLocation = event.event_details?.location
    const strength = event.event_details?.strength

    let xG = 0.1 // Base probability

    // Adjust based on shot type
    switch (shotType) {
      case 'wrist':
        xG = 0.08
        break
      case 'slap':
        xG = 0.06
        break
      case 'snap':
        xG = 0.09
        break
      case 'tip':
        xG = 0.15
        break
      case 'wrap':
        xG = 0.12
        break
      case 'backhand':
        xG = 0.05
        break
      default:
        xG = 0.08
    }

    // Adjust based on location (simplified)
    if (shotLocation?.includes('slot')) {
      xG *= 2.5
    } else if (shotLocation?.includes('close')) {
      xG *= 1.8
    } else if (shotLocation?.includes('far')) {
      xG *= 0.6
    }

    // Adjust based on strength
    if (strength === 'powerplay') {
      xG *= 1.3
    } else if (strength === 'shorthanded') {
      xG *= 0.7
    }

    return Math.min(xG, 1.0) // Cap at 100%
  }

  private async calculateQualityOfCompetition(
    playerId: string,
    teamId: string,
    season: string
  ): Promise<number> {
    // This would analyze the strength of opponents faced
    // Simplified calculation - would need more detailed analysis
    return 0.5 // Placeholder
  }

  private async calculateQualityOfTeammates(
    playerId: string,
    teamId: string,
    season: string
  ): Promise<number> {
    // This would analyze the strength of teammates played with
    // Simplified calculation - would need linemate analysis
    return 0.5 // Placeholder
  }

  async getPositionSpecificLeaders(
    teamId: string,
    season: string,
    position: 'F' | 'D' | 'G',
    category: string,
    limit = 10
  ): Promise<any[]> {
    // Get players by position
    const { data: players } = await supabase
      .from('players')
      .select('id, first_name, last_name, jersey_number')
      .eq('team_id', teamId)
      .eq('position', position)
      .eq('active', true)

    if (!players?.length) return []

    const leaderboard = []

    for (const player of players) {
      try {
        const stats = await this.getPlayerPositionStats(
          player.id,
          teamId,
          season,
          position
        )

        if (stats && this.getStatValue(stats, category) !== undefined) {
          leaderboard.push({
            playerId: player.id,
            playerName: `${player.first_name} ${player.last_name}`,
            jerseyNumber: player.jersey_number,
            value: this.getStatValue(stats, category),
            ...stats
          })
        }
      } catch (error) {
        console.error(`Error getting stats for player ${player.id}:`, error)
      }
    }

    return leaderboard
      .sort((a, b) => (b.value || 0) - (a.value || 0))
      .slice(0, limit)
  }

  private async getPlayerPositionStats(
    playerId: string,
    teamId: string,
    season: string,
    position: 'F' | 'D' | 'G'
  ): Promise<any> {
    // This would return the appropriate stats based on position
    // Implementation would call the specific position calculation methods
    return null // Placeholder
  }

  private getStatValue(stats: any, category: string): number | undefined {
    return stats[category]
  }
}

export const positionStatsCalculator = new PositionStatsCalculator()