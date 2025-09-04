import { supabase } from '@/lib/supabase/client'
import {
  BasePlayerStats,
  GoalieStats,
  SkaterStats,
  ForwardStats,
  DefenseStats,
  DerivedStats,
  PlayerStatsComplete,
  GameStats,
  TeamStats,
  StatsFilter,
  StatsPeriod,
  StatsComparison,
  StatsTrend,
  StatsLeaderboard,
  AdvancedMetrics,
  StatsCalculationOptions
} from '@/types/statistics'

export class StatisticsEngine {
  private cache = new Map<string, { data: any; expires: number }>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (cached && cached.expires > Date.now()) {
      return cached.data as T
    }
    this.cache.delete(key)
    return null
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + this.CACHE_TTL
    })
  }

  async getPlayerStats(
    playerId: string,
    teamId: string,
    season: string,
    options?: StatsCalculationOptions
  ): Promise<PlayerStatsComplete | null> {
    const cacheKey = `player_stats_${playerId}_${season}_${JSON.stringify(options || {})}`
    const cached = this.getFromCache<PlayerStatsComplete>(cacheKey)
    if (cached) return cached

    try {
      // Get player info
      const { data: player } = await supabase
        .from('players')
        .select('id, first_name, last_name, jersey_number, position')
        .eq('id', playerId)
        .single()

      if (!player) return null

      // Aggregate game stats for the player
      const baseStats = await this.aggregatePlayerStats(playerId, teamId, season, options)
      
      // Calculate position-specific stats
      const skillStats = player.position === 'G'
        ? await this.calculateGoalieStats(playerId, teamId, season, options)
        : await this.calculateSkaterStats(playerId, teamId, season, player.position, options)

      // Calculate derived metrics
      const derivedStats = await this.calculateDerivedStats(baseStats, skillStats, teamId, season)

      const result: PlayerStatsComplete = {
        player: {
          id: player.id,
          firstName: player.first_name,
          lastName: player.last_name,
          jerseyNumber: player.jersey_number,
          position: player.position
        },
        baseStats,
        skillStats,
        derivedStats,
        lastUpdated: new Date().toISOString()
      }

      this.setCache(cacheKey, result)
      return result
    } catch (error) {
      console.error('Error calculating player stats:', error)
      throw error
    }
  }

  async aggregatePlayerStats(
    playerId: string,
    teamId: string,
    season: string,
    options?: StatsCalculationOptions
  ): Promise<BasePlayerStats> {
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
          status
        )
      `)
      .eq('player_id', playerId)
      .eq('games.season', season)
      .eq('games.status', 'completed')
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`, { foreignTable: 'games' })

    if (!gameEvents?.length) {
      return this.getEmptyBaseStats(playerId, teamId, season)
    }

    // Apply filters based on options
    const filteredEvents = this.applyStatsFilters(gameEvents, options)

    const stats: BasePlayerStats = {
      playerId,
      teamId,
      season,
      gamesPlayed: new Set(filteredEvents.map(e => e.game_id)).size,
      goals: 0,
      assists: 0,
      points: 0,
      shots: 0,
      shotsOnGoal: 0,
      penaltyMinutes: 0,
      plusMinus: 0,
      faceoffsWon: 0,
      faceoffsLost: 0,
      hits: 0,
      blocked: 0,
      giveaways: 0,
      takeaways: 0
    }

    // Aggregate events into stats
    filteredEvents.forEach(event => {
      switch (event.event_type) {
        case 'goal':
          stats.goals++
          stats.points++
          if (event.event_details?.shot_type) {
            stats.shots++
            stats.shotsOnGoal++
          }
          break
        case 'assist':
          stats.assists++
          stats.points++
          break
        case 'shot':
          stats.shots++
          if (event.event_details?.on_goal) {
            stats.shotsOnGoal++
          }
          break
        case 'penalty':
          stats.penaltyMinutes += event.event_details?.penalty_minutes || 0
          break
        case 'faceoff':
          if (event.event_details?.won) {
            stats.faceoffsWon++
          } else {
            stats.faceoffsLost++
          }
          break
        case 'hit':
          stats.hits++
          break
        case 'blocked_shot':
          stats.blocked++
          break
        case 'giveaway':
          stats.giveaways++
          break
        case 'takeaway':
          stats.takeaways++
          break
      }

      // Calculate plus/minus
      if (event.event_type === 'goal' && event.event_details) {
        const isPlayerTeamGoal = event.team_id === teamId
        const strength = event.event_details.strength || 'even'
        
        if (strength === 'even' || strength === 'shorthanded') {
          if (isPlayerTeamGoal) {
            // Player was on ice for team goal
            if (event.event_details.players_on_ice?.includes(playerId)) {
              stats.plusMinus++
            }
          } else {
            // Player was on ice for opponent goal
            if (event.event_details.players_on_ice?.includes(playerId)) {
              stats.plusMinus--
            }
          }
        }
      }
    })

    return stats
  }

  async calculateSkaterStats(
    playerId: string,
    teamId: string,
    season: string,
    position: 'F' | 'D',
    options?: StatsCalculationOptions
  ): Promise<SkaterStats | ForwardStats | DefenseStats> {
    const baseSkaterStats: SkaterStats = {
      ...(await this.aggregatePlayerStats(playerId, teamId, season, options)),
      timeOnIce: 0,
      powerPlayGoals: 0,
      powerPlayAssists: 0,
      shortHandedGoals: 0,
      shortHandedAssists: 0,
      gameWinningGoals: 0,
      overtimeGoals: 0
    }

    // Get situational stats
    const { data: situationalEvents } = await supabase
      .from('game_events')
      .select(`
        *,
        games!inner(season, status, home_team_id, away_team_id)
      `)
      .eq('player_id', playerId)
      .eq('games.season', season)
      .eq('games.status', 'completed')
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`, { foreignTable: 'games' })

    situationalEvents?.forEach(event => {
      const strength = event.event_details?.strength
      const gameWinning = event.event_details?.game_winning
      const overtime = event.event_details?.overtime

      if (event.event_type === 'goal') {
        if (strength === 'powerplay') baseSkaterStats.powerPlayGoals++
        if (strength === 'shorthanded') baseSkaterStats.shortHandedGoals++
        if (gameWinning) baseSkaterStats.gameWinningGoals++
        if (overtime) baseSkaterStats.overtimeGoals++
      }

      if (event.event_type === 'assist') {
        if (strength === 'powerplay') baseSkaterStats.powerPlayAssists++
        if (strength === 'shorthanded') baseSkaterStats.shortHandedAssists++
      }

      // Add time on ice from shift events
      if (event.event_type === 'shift') {
        baseSkaterStats.timeOnIce += event.event_details?.duration || 0
      }
    })

    // Position-specific calculations
    if (position === 'F') {
      const forwardStats: ForwardStats = {
        ...baseSkaterStats,
        faceoffPercentage: baseSkaterStats.faceoffsWon + baseSkaterStats.faceoffsLost > 0
          ? (baseSkaterStats.faceoffsWon / (baseSkaterStats.faceoffsWon + baseSkaterStats.faceoffsLost)) * 100
          : undefined
      }
      return forwardStats
    } else {
      const defenseStats: DefenseStats = {
        ...baseSkaterStats,
        blocked: baseSkaterStats.blocked || 0
      }
      return defenseStats
    }
  }

  async calculateGoalieStats(
    playerId: string,
    teamId: string,
    season: string,
    options?: StatsCalculationOptions
  ): Promise<GoalieStats> {
    const baseStats = await this.aggregatePlayerStats(playerId, teamId, season, options)

    // Get goalie-specific events
    const { data: goalieEvents } = await supabase
      .from('game_events')
      .select(`
        *,
        games!inner(season, status, home_team_id, away_team_id, home_score, away_score)
      `)
      .eq('games.season', season)
      .eq('games.status', 'completed')
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`, { foreignTable: 'games' })
      .or(`player_id.eq.${playerId},event_details->>goalie_id.eq.${playerId}`)

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

    const gameResults = new Map<string, { goalsAgainst: number; shotsAgainst: number; saves: number; result: 'win' | 'loss' | 'ot_loss' }>()

    goalieEvents?.forEach(event => {
      const gameId = event.game_id
      if (!gameResults.has(gameId)) {
        gameResults.set(gameId, { goalsAgainst: 0, shotsAgainst: 0, saves: 0, result: 'loss' })
      }
      const game = gameResults.get(gameId)!

      if (event.event_type === 'shot' && event.team_id !== teamId) {
        game.shotsAgainst++
        goalieStats.shotsAgainst++

        if (event.event_details?.on_goal) {
          if (event.event_details?.saved_by === playerId) {
            game.saves++
            goalieStats.saves++
          }
        }
      }

      if (event.event_type === 'goal' && event.team_id !== teamId) {
        if (event.event_details?.goalie_id === playerId) {
          game.goalsAgainst++
          goalieStats.goalsAgainst++
        }
      }

      if (event.event_type === 'shift' && event.player_id === playerId) {
        goalieStats.timeOnIce += event.event_details?.duration || 0
      }
    })

    // Calculate wins, losses, shutouts
    for (const [gameId, gameData] of gameResults) {
      if (gameData.goalsAgainst === 0) {
        goalieStats.shutouts++
      }

      // Determine game result (simplified - would need more game context)
      const gameEvent = goalieEvents?.find(e => e.game_id === gameId)
      if (gameEvent?.games) {
        const isHome = gameEvent.games.home_team_id === teamId
        const teamScore = isHome ? gameEvent.games.home_score : gameEvent.games.away_score
        const oppScore = isHome ? gameEvent.games.away_score : gameEvent.games.home_score

        if (teamScore > oppScore) {
          goalieStats.wins++
        } else if (teamScore < oppScore) {
          // Check if it was an overtime/shootout loss
          if (Math.abs(teamScore - oppScore) === 1) {
            goalieStats.overtimeLosses++
          } else {
            goalieStats.losses++
          }
        }
      }
    }

    return goalieStats
  }

  async calculateDerivedStats(
    baseStats: BasePlayerStats,
    skillStats: SkaterStats | GoalieStats,
    teamId: string,
    season: string
  ): Promise<DerivedStats> {
    const derivedStats: DerivedStats = {
      pointsPerGame: baseStats.gamesPlayed > 0 ? baseStats.points / baseStats.gamesPlayed : 0,
      penaltyMinutesPerGame: baseStats.gamesPlayed > 0 ? baseStats.penaltyMinutes / baseStats.gamesPlayed : 0
    }

    if ('saves' in skillStats) {
      // Goalie stats
      const goalieStats = skillStats as GoalieStats
      derivedStats.savePercentage = goalieStats.shotsAgainst > 0 
        ? (goalieStats.saves / goalieStats.shotsAgainst) * 100 
        : 0
      
      derivedStats.goalsAgainstAverage = goalieStats.timeOnIce > 0
        ? (goalieStats.goalsAgainst * 60) / goalieStats.timeOnIce
        : 0
      
      derivedStats.shutoutPercentage = baseStats.gamesPlayed > 0
        ? (goalieStats.shutouts / baseStats.gamesPlayed) * 100
        : 0
      
      const totalDecisions = goalieStats.wins + goalieStats.losses + goalieStats.overtimeLosses
      derivedStats.winPercentage = totalDecisions > 0
        ? (goalieStats.wins / totalDecisions) * 100
        : 0
      
      derivedStats.shotsAgainstPerGame = baseStats.gamesPlayed > 0
        ? goalieStats.shotsAgainst / baseStats.gamesPlayed
        : 0
      
      derivedStats.savesPerGame = baseStats.gamesPlayed > 0
        ? goalieStats.saves / baseStats.gamesPlayed
        : 0
    } else {
      // Skater stats
      const skaterStats = skillStats as SkaterStats
      derivedStats.shootingPercentage = baseStats.shots > 0
        ? (baseStats.goals / baseStats.shots) * 100
        : 0
      
      derivedStats.shotsPerGame = baseStats.gamesPlayed > 0
        ? baseStats.shots / baseStats.gamesPlayed
        : 0
      
      derivedStats.hitsPerGame = baseStats.gamesPlayed > 0
        ? (baseStats.hits || 0) / baseStats.gamesPlayed
        : 0
      
      derivedStats.blockedPerGame = baseStats.gamesPlayed > 0
        ? (baseStats.blocked || 0) / baseStats.gamesPlayed
        : 0
      
      derivedStats.plusMinusPerGame = baseStats.gamesPlayed > 0
        ? baseStats.plusMinus / baseStats.gamesPlayed
        : 0
      
      derivedStats.timeOnIcePerGame = baseStats.gamesPlayed > 0
        ? skaterStats.timeOnIce / baseStats.gamesPlayed
        : 0
      
      derivedStats.powerPlayPoints = skaterStats.powerPlayGoals + skaterStats.powerPlayAssists
      derivedStats.shortHandedPoints = skaterStats.shortHandedGoals + skaterStats.shortHandedAssists
    }

    // Get team rankings
    derivedStats.teamRank = await this.calculateTeamRankings(baseStats, teamId, season)

    return derivedStats
  }

  async calculateTeamRankings(
    playerStats: BasePlayerStats,
    teamId: string,
    season: string
  ): Promise<DerivedStats['teamRank']> {
    // Get all team players' stats for ranking
    const { data: teamPlayers } = await supabase
      .from('players')
      .select('id')
      .eq('team_id', teamId)
      .eq('active', true)

    if (!teamPlayers?.length) return undefined

    const playerIds = teamPlayers.map(p => p.id)
    const teamStats = await Promise.all(
      playerIds.map(async (playerId) => {
        try {
          const stats = await this.aggregatePlayerStats(playerId, teamId, season)
          return { playerId, ...stats }
        } catch {
          return null
        }
      })
    )

    const validTeamStats = teamStats.filter(Boolean) as (BasePlayerStats & { playerId: string })[]
    
    if (validTeamStats.length === 0) return undefined

    const rankings = {
      goals: this.getRanking(validTeamStats, 'goals', playerStats.goals),
      assists: this.getRanking(validTeamStats, 'assists', playerStats.assists),
      points: this.getRanking(validTeamStats, 'points', playerStats.points),
      plusMinus: this.getRanking(validTeamStats, 'plusMinus', playerStats.plusMinus),
      penaltyMinutes: this.getRanking(validTeamStats, 'penaltyMinutes', playerStats.penaltyMinutes, true)
    }

    return rankings
  }

  private getRanking(
    stats: any[],
    field: string,
    playerValue: number,
    lowerIsBetter = false
  ): number {
    const sorted = stats
      .map(s => s[field] || 0)
      .sort((a, b) => lowerIsBetter ? a - b : b - a)
    
    return sorted.findIndex(value => value === playerValue) + 1
  }

  async getTeamStats(teamId: string, season: string): Promise<TeamStats> {
    const cacheKey = `team_stats_${teamId}_${season}`
    const cached = this.getFromCache<TeamStats>(cacheKey)
    if (cached) return cached

    const { data: games } = await supabase
      .from('games')
      .select('*')
      .eq('season', season)
      .eq('status', 'completed')
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)

    if (!games?.length) {
      return this.getEmptyTeamStats(teamId, season)
    }

    const teamStats: TeamStats = {
      teamId,
      season,
      gamesPlayed: games.length,
      wins: 0,
      losses: 0,
      overtimeLosses: 0,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifferential: 0,
      powerPlayGoals: 0,
      powerPlayOpportunities: 0,
      penaltyKillGoalsAgainst: 0,
      penaltyKillOpportunities: 0,
      shotsFor: 0,
      shotsAgainst: 0,
      faceoffWins: 0,
      faceoffLosses: 0,
      winPercentage: 0,
      pointsPerGame: 0,
      goalsForPerGame: 0,
      goalsAgainstPerGame: 0,
      powerPlayPercentage: 0,
      penaltyKillPercentage: 0,
      shotDifferential: 0,
      faceoffPercentage: 0
    }

    // Aggregate team statistics from games
    games.forEach(game => {
      const isHome = game.home_team_id === teamId
      const teamScore = isHome ? game.home_score : game.away_score
      const oppScore = isHome ? game.away_score : game.home_score

      teamStats.goalsFor += teamScore
      teamStats.goalsAgainst += oppScore

      if (teamScore > oppScore) {
        teamStats.wins++
        teamStats.points += 2
      } else if (teamScore === oppScore - 1 && (game.overtime || game.shootout)) {
        teamStats.overtimeLosses++
        teamStats.points += 1
      } else {
        teamStats.losses++
      }
    })

    teamStats.goalDifferential = teamStats.goalsFor - teamStats.goalsAgainst
    teamStats.winPercentage = teamStats.gamesPlayed > 0 
      ? (teamStats.wins / teamStats.gamesPlayed) * 100 
      : 0
    teamStats.pointsPerGame = teamStats.gamesPlayed > 0 
      ? teamStats.points / teamStats.gamesPlayed 
      : 0
    teamStats.goalsForPerGame = teamStats.gamesPlayed > 0 
      ? teamStats.goalsFor / teamStats.gamesPlayed 
      : 0
    teamStats.goalsAgainstPerGame = teamStats.gamesPlayed > 0 
      ? teamStats.goalsAgainst / teamStats.gamesPlayed 
      : 0

    this.setCache(cacheKey, teamStats)
    return teamStats
  }

  private applyStatsFilters(events: any[], options?: StatsCalculationOptions): any[] {
    if (!options) return events

    return events.filter(event => {
      // Date range filter
      if (options.dateRange) {
        const eventDate = new Date(event.games.game_date)
        const startDate = new Date(options.dateRange.start)
        const endDate = new Date(options.dateRange.end)
        if (eventDate < startDate || eventDate > endDate) return false
      }

      // Situational strength filter
      if (options.situationalStrength && options.situationalStrength !== 'all') {
        const strength = event.event_details?.strength
        if (strength !== options.situationalStrength) return false
      }

      // Home/away filter
      if (options.homeAwayOnly) {
        const isHome = event.games.home_team_id === event.team_id
        if ((options.homeAwayOnly === 'home' && !isHome) || 
            (options.homeAwayOnly === 'away' && isHome)) return false
      }

      // Opponent filter
      if (options.opponentFilter?.length) {
        const opponent = event.games.home_team_id === event.team_id 
          ? event.games.away_team_id 
          : event.games.home_team_id
        if (!options.opponentFilter.includes(opponent)) return false
      }

      return true
    })
  }

  private getEmptyBaseStats(playerId: string, teamId: string, season: string): BasePlayerStats {
    return {
      playerId,
      teamId,
      season,
      gamesPlayed: 0,
      goals: 0,
      assists: 0,
      points: 0,
      shots: 0,
      shotsOnGoal: 0,
      penaltyMinutes: 0,
      plusMinus: 0,
      faceoffsWon: 0,
      faceoffsLost: 0,
      hits: 0,
      blocked: 0,
      giveaways: 0,
      takeaways: 0
    }
  }

  private getEmptyTeamStats(teamId: string, season: string): TeamStats {
    return {
      teamId,
      season,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      overtimeLosses: 0,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifferential: 0,
      powerPlayGoals: 0,
      powerPlayOpportunities: 0,
      penaltyKillGoalsAgainst: 0,
      penaltyKillOpportunities: 0,
      shotsFor: 0,
      shotsAgainst: 0,
      faceoffWins: 0,
      faceoffLosses: 0,
      winPercentage: 0,
      pointsPerGame: 0,
      goalsForPerGame: 0,
      goalsAgainstPerGame: 0,
      powerPlayPercentage: 0,
      penaltyKillPercentage: 0,
      shotDifferential: 0,
      faceoffPercentage: 0
    }
  }
}

export const statisticsEngine = new StatisticsEngine()