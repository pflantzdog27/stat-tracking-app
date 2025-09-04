import { supabase } from '@/lib/supabase/client'
import {
  BasePlayerStats,
  GoalieStats,
  SkaterStats,
  DerivedStats,
  AdvancedMetrics,
  StatsCalculationOptions
} from '@/types/statistics'

export class DerivedMetricsCalculator {
  
  calculateUniversalMetrics(
    baseStats: BasePlayerStats,
    skillStats: SkaterStats | GoalieStats
  ): Partial<DerivedStats> {
    const derived: Partial<DerivedStats> = {}

    // Basic per-game metrics
    if (baseStats.gamesPlayed > 0) {
      derived.pointsPerGame = Math.round((baseStats.points / baseStats.gamesPlayed) * 100) / 100
      derived.penaltyMinutesPerGame = Math.round((baseStats.penaltyMinutes / baseStats.gamesPlayed) * 100) / 100
    }

    return derived
  }

  calculateSkaterMetrics(
    baseStats: BasePlayerStats,
    skaterStats: SkaterStats
  ): Partial<DerivedStats> {
    const derived: Partial<DerivedStats> = {
      ...this.calculateUniversalMetrics(baseStats, skaterStats)
    }

    // Shooting metrics
    if (baseStats.shots > 0) {
      derived.shootingPercentage = Math.round((baseStats.goals / baseStats.shots) * 10000) / 100
    }

    // Per-game metrics for skaters
    if (baseStats.gamesPlayed > 0) {
      derived.shotsPerGame = Math.round((baseStats.shots / baseStats.gamesPlayed) * 100) / 100
      derived.hitsPerGame = Math.round(((baseStats.hits || 0) / baseStats.gamesPlayed) * 100) / 100
      derived.blockedPerGame = Math.round(((baseStats.blocked || 0) / baseStats.gamesPlayed) * 100) / 100
      derived.plusMinusPerGame = Math.round((baseStats.plusMinus / baseStats.gamesPlayed) * 100) / 100
      derived.timeOnIcePerGame = Math.round((skaterStats.timeOnIce / baseStats.gamesPlayed) * 100) / 100
    }

    // Special teams points
    derived.powerPlayPoints = skaterStats.powerPlayGoals + skaterStats.powerPlayAssists
    derived.shortHandedPoints = skaterStats.shortHandedGoals + skaterStats.shortHandedAssists

    return derived
  }

  calculateGoalieMetrics(
    baseStats: BasePlayerStats,
    goalieStats: GoalieStats
  ): Partial<DerivedStats> {
    const derived: Partial<DerivedStats> = {
      ...this.calculateUniversalMetrics(baseStats, goalieStats)
    }

    // Core goalie metrics
    if (goalieStats.shotsAgainst > 0) {
      derived.savePercentage = Math.round((goalieStats.saves / goalieStats.shotsAgainst) * 10000) / 100
    }

    // Goals against average (per 60 minutes)
    if (goalieStats.timeOnIce > 0) {
      derived.goalsAgainstAverage = Math.round(((goalieStats.goalsAgainst * 60) / goalieStats.timeOnIce) * 100) / 100
    }

    // Game-based metrics
    if (baseStats.gamesPlayed > 0) {
      derived.shutoutPercentage = Math.round((goalieStats.shutouts / baseStats.gamesPlayed) * 10000) / 100
      derived.shotsAgainstPerGame = Math.round((goalieStats.shotsAgainst / baseStats.gamesPlayed) * 100) / 100
      derived.savesPerGame = Math.round((goalieStats.saves / baseStats.gamesPlayed) * 100) / 100
    }

    // Win percentage
    const totalDecisions = goalieStats.wins + goalieStats.losses + goalieStats.overtimeLosses
    if (totalDecisions > 0) {
      derived.winPercentage = Math.round((goalieStats.wins / totalDecisions) * 10000) / 100
    }

    return derived
  }

  async calculateAdvancedSkaterMetrics(
    playerId: string,
    teamId: string,
    season: string,
    baseStats: BasePlayerStats,
    options?: StatsCalculationOptions
  ): Promise<Partial<AdvancedMetrics>> {
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

    const advanced: Partial<AdvancedMetrics> = {
      playerId,
      season
    }

    let totalTimeOnIce = 0
    let evenStrengthTOI = 0
    let powerPlayTOI = 0
    let penaltyKillTOI = 0
    let oZoneStarts = 0
    let totalStarts = 0
    let primaryAssists = 0
    let secondaryAssists = 0
    let evenStrengthGoals = 0
    let evenStrengthAssists = 0
    let individualShots = 0
    let hits = 0
    let blocked = 0
    let takeaways = 0
    let giveaways = 0

    events?.forEach(event => {
      const strength = event.event_details?.strength || 'even'
      const duration = event.event_details?.duration || 0

      switch (event.event_type) {
        case 'goal':
          if (strength === 'even') evenStrengthGoals++
          break

        case 'assist':
          if (strength === 'even') evenStrengthAssists++
          if (event.event_details?.assist_type === 'primary') {
            primaryAssists++
          } else {
            secondaryAssists++
          }
          break

        case 'shot':
          individualShots++
          break

        case 'shift':
          totalTimeOnIce += duration
          if (strength === 'even') evenStrengthTOI += duration
          else if (strength === 'powerplay') powerPlayTOI += duration
          else if (strength === 'penalty_kill') penaltyKillTOI += duration

          const startZone = event.event_details?.start_zone
          if (startZone) {
            totalStarts++
            if (startZone === 'offensive') oZoneStarts++
          }
          break

        case 'hit':
          hits++
          break

        case 'blocked_shot':
          blocked++
          break

        case 'takeaway':
          takeaways++
          break

        case 'giveaway':
          giveaways++
          break
      }
    })

    // Calculate advanced metrics
    advanced.evenStrengthGoals = evenStrengthGoals
    advanced.evenStrengthAssists = evenStrengthAssists
    advanced.powerPlayTimeOnIce = powerPlayTOI
    advanced.penaltyKillTimeOnIce = penaltyKillTOI
    advanced.individualShotAttempts = individualShots

    if (totalStarts > 0) {
      advanced.offensiveZoneStartPercentage = Math.round((oZoneStarts / totalStarts) * 10000) / 100
    }

    const totalAssists = primaryAssists + secondaryAssists
    if (totalAssists > 0) {
      advanced.primaryAssistPercentage = Math.round((primaryAssists / totalAssists) * 10000) / 100
    }

    // Per-60 minute metrics
    const timeOnIceHours = totalTimeOnIce / 60
    if (timeOnIceHours > 0) {
      const totalPoints = baseStats.goals + baseStats.assists
      advanced.pointsPerSixty = Math.round((totalPoints / timeOnIceHours) * 60 * 100) / 100
      advanced.hitsPerSixty = Math.round((hits / timeOnIceHours) * 60 * 100) / 100
      advanced.shotsBlockedPer60 = Math.round((blocked / timeOnIceHours) * 60 * 100) / 100
      advanced.takeawaysPerSixty = Math.round((takeaways / timeOnIceHours) * 60 * 100) / 100
      advanced.giveawaysPerSixty = Math.round((giveaways / timeOnIceHours) * 60 * 100) / 100
    }

    // Expected goals calculation (simplified)
    advanced.expectedGoals = await this.calculateExpectedGoals(playerId, teamId, season)
    advanced.actualGoals = baseStats.goals
    advanced.goalsDifference = Math.round((advanced.actualGoals - advanced.expectedGoals) * 100) / 100

    return advanced
  }

  private async calculateExpectedGoals(
    playerId: string,
    teamId: string,
    season: string
  ): Promise<number> {
    const { data: shots } = await supabase
      .from('game_events')
      .select(`
        event_details,
        games!inner(season, status, home_team_id, away_team_id)
      `)
      .eq('player_id', playerId)
      .eq('event_type', 'shot')
      .eq('games.season', season)
      .eq('games.status', 'completed')
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`, { foreignTable: 'games' })

    if (!shots?.length) return 0

    let totalExpectedGoals = 0

    shots.forEach(shot => {
      const details = shot.event_details
      let xG = 0.08 // Base probability

      // Adjust based on shot type
      const shotType = details?.shot_type
      switch (shotType) {
        case 'wrist': xG = 0.08; break
        case 'slap': xG = 0.06; break
        case 'snap': xG = 0.09; break
        case 'tip': xG = 0.15; break
        case 'wrap': xG = 0.12; break
        case 'backhand': xG = 0.05; break
        default: xG = 0.08
      }

      // Adjust based on location
      const location = details?.location
      if (location?.includes('slot')) {
        xG *= 2.5
      } else if (location?.includes('close')) {
        xG *= 1.8
      } else if (location?.includes('far')) {
        xG *= 0.6
      }

      // Adjust based on strength
      const strength = details?.strength
      if (strength === 'powerplay') {
        xG *= 1.3
      } else if (strength === 'shorthanded') {
        xG *= 0.7
      }

      totalExpectedGoals += Math.min(xG, 1.0)
    })

    return Math.round(totalExpectedGoals * 100) / 100
  }

  async calculatePossessionMetrics(
    playerId: string,
    teamId: string,
    season: string
  ): Promise<{
    corsiFor: number
    corsiAgainst: number
    corsiPercentage: number
    fenwickFor: number
    fenwickAgainst: number
    fenwickPercentage: number
  }> {
    // This would require tracking all shot attempts (including blocked shots and misses)
    // when the player is on ice - simplified implementation
    
    const { data: onIceEvents } = await supabase
      .from('game_events')
      .select(`
        event_type,
        team_id,
        event_details,
        games!inner(season, status, home_team_id, away_team_id)
      `)
      .eq('games.season', season)
      .eq('games.status', 'completed')
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`, { foreignTable: 'games' })
      .contains('event_details', { players_on_ice: [playerId] })

    let corsiFor = 0
    let corsiAgainst = 0
    let fenwickFor = 0
    let fenwickAgainst = 0

    onIceEvents?.forEach(event => {
      const isTeamEvent = event.team_id === teamId
      const isShotAttempt = ['shot', 'goal', 'blocked_shot', 'missed_shot'].includes(event.event_type)
      const isUnblockedShot = ['shot', 'goal', 'missed_shot'].includes(event.event_type)

      if (isShotAttempt) {
        if (isTeamEvent) {
          corsiFor++
          if (isUnblockedShot) fenwickFor++
        } else {
          corsiAgainst++
          if (isUnblockedShot) fenwickAgainst++
        }
      }
    })

    const totalCorsi = corsiFor + corsiAgainst
    const totalFenwick = fenwickFor + fenwickAgainst

    return {
      corsiFor,
      corsiAgainst,
      corsiPercentage: totalCorsi > 0 ? Math.round((corsiFor / totalCorsi) * 10000) / 100 : 0,
      fenwickFor,
      fenwickAgainst,
      fenwickPercentage: totalFenwick > 0 ? Math.round((fenwickFor / totalFenwick) * 10000) / 100 : 0
    }
  }

  calculateRelativeMetrics(
    playerStats: DerivedStats,
    teamAverage: DerivedStats
  ): Record<string, number> {
    const relative: Record<string, number> = {}

    // Calculate relative stats (player - team average)
    const metricsToCompare = [
      'pointsPerGame',
      'shootingPercentage',
      'savePercentage',
      'goalsAgainstAverage',
      'penaltyMinutesPerGame',
      'hitsPerGame',
      'blockedPerGame',
      'plusMinusPerGame'
    ]

    metricsToCompare.forEach(metric => {
      if (playerStats[metric as keyof DerivedStats] !== undefined && 
          teamAverage[metric as keyof DerivedStats] !== undefined) {
        const playerValue = playerStats[metric as keyof DerivedStats] as number
        const teamValue = teamAverage[metric as keyof DerivedStats] as number
        relative[`relative${metric.charAt(0).toUpperCase() + metric.slice(1)}`] = 
          Math.round((playerValue - teamValue) * 100) / 100
      }
    })

    return relative
  }

  calculateEfficiencyMetrics(
    baseStats: BasePlayerStats,
    skillStats: SkaterStats | GoalieStats
  ): Record<string, number> {
    const efficiency: Record<string, number> = {}

    if ('timeOnIce' in skillStats && skillStats.timeOnIce > 0) {
      const timeOnIceHours = skillStats.timeOnIce / 60

      // Points per minute of ice time
      efficiency.pointsPerMinute = Math.round((baseStats.points / skillStats.timeOnIce) * 10000) / 10000

      // Shots per minute of ice time
      efficiency.shotsPerMinute = Math.round((baseStats.shots / skillStats.timeOnIce) * 10000) / 10000

      // If it's a skater with power play stats
      if ('powerPlayGoals' in skillStats && 'powerPlayAssists' in skillStats) {
        const ppPoints = skillStats.powerPlayGoals + skillStats.powerPlayAssists
        const evenStrengthPoints = baseStats.points - ppPoints
        
        efficiency.evenStrengthPointsPercentage = baseStats.points > 0 
          ? Math.round((evenStrengthPoints / baseStats.points) * 10000) / 100
          : 0
        
        efficiency.powerPlayPointsPercentage = baseStats.points > 0
          ? Math.round((ppPoints / baseStats.points) * 10000) / 100
          : 0
      }
    }

    // Shot efficiency
    if (baseStats.shots > 0) {
      efficiency.shotsOnGoalPercentage = baseStats.shotsOnGoal > 0
        ? Math.round((baseStats.shotsOnGoal / baseStats.shots) * 10000) / 100
        : 0
    }

    // Penalty efficiency (lower is better)
    if (baseStats.gamesPlayed > 0) {
      efficiency.penaltyRate = Math.round((baseStats.penaltyMinutes / baseStats.gamesPlayed) * 100) / 100
    }

    return efficiency
  }

  calculateContextualMetrics(
    playerStats: BasePlayerStats,
    teamStats: any,
    leagueStats?: any
  ): Record<string, number> {
    const contextual: Record<string, number> = {}

    // Team context
    if (teamStats) {
      contextual.teamScoringShare = teamStats.goalsFor > 0
        ? Math.round((playerStats.goals / teamStats.goalsFor) * 10000) / 100
        : 0

      contextual.teamAssistShare = teamStats.totalAssists > 0
        ? Math.round((playerStats.assists / teamStats.totalAssists) * 10000) / 100
        : 0

      contextual.teamPointsShare = teamStats.totalPoints > 0
        ? Math.round((playerStats.points / teamStats.totalPoints) * 10000) / 100
        : 0
    }

    // League context (if available)
    if (leagueStats) {
      contextual.leagueGoalRanking = leagueStats.goalLeaders?.findIndex(
        (p: any) => p.playerId === playerStats.playerId
      ) + 1 || 0

      contextual.leaguePointRanking = leagueStats.pointLeaders?.findIndex(
        (p: any) => p.playerId === playerStats.playerId
      ) + 1 || 0
    }

    return contextual
  }
}

export const derivedMetricsCalculator = new DerivedMetricsCalculator()