import { supabase } from '@/lib/supabase/client'
import { statisticsEngine } from './statistics-engine'
import { statisticsCache } from './stats-cache'
import {
  PlayerStatsComplete,
  StatsComparison,
  StatsLeaderboard,
  DerivedStats,
  BasePlayerStats
} from '@/types/statistics'

interface ComparisonPlayer {
  playerId: string
  playerName: string
  jerseyNumber: number
  position: string
  stats: PlayerStatsComplete
}

interface RankingContext {
  teamId: string
  season: string
  position?: 'F' | 'D' | 'G' | 'all'
  minGamesPlayed?: number
  stat: string
}

export class StatsComparisonService {
  
  async comparePlayersDetailed(
    playerIds: string[],
    teamId: string,
    season: string,
    categories?: string[]
  ): Promise<{
    players: ComparisonPlayer[]
    rankings: Record<string, StatsComparison[]>
    teamAverages: Record<string, number>
    positionAverages: Record<string, Record<string, number>>
    insights: string[]
  }> {
    if (playerIds.length < 2 || playerIds.length > 6) {
      throw new Error('Can compare between 2 and 6 players')
    }

    // Get stats for all players
    const players: ComparisonPlayer[] = []
    for (const playerId of playerIds) {
      const stats = await statisticsEngine.getPlayerStats(playerId, teamId, season)
      if (stats) {
        players.push({
          playerId,
          playerName: `${stats.player.firstName} ${stats.player.lastName}`,
          jerseyNumber: stats.player.jerseyNumber,
          position: stats.player.position,
          stats
        })
      }
    }

    if (players.length === 0) {
      throw new Error('No valid player data found')
    }

    // Default categories if not specified
    const defaultCategories = [
      'gamesPlayed', 'goals', 'assists', 'points', 'shots', 
      'shootingPercentage', 'pointsPerGame', 'penaltyMinutes',
      'plusMinus', 'timeOnIcePerGame'
    ]
    const compareCategories = categories || defaultCategories

    // Calculate rankings within team for each category
    const rankings: Record<string, StatsComparison[]> = {}
    for (const category of compareCategories) {
      rankings[category] = await this.calculateCategoryRankings(
        players,
        category,
        teamId,
        season
      )
    }

    // Calculate team and position averages
    const teamAverages = await this.calculateTeamAverages(teamId, season, compareCategories)
    const positionAverages = await this.calculatePositionAverages(teamId, season, compareCategories)

    // Generate insights
    const insights = this.generateComparisonInsights(players, rankings, teamAverages)

    return {
      players,
      rankings,
      teamAverages,
      positionAverages,
      insights
    }
  }

  async getPlayerRankings(
    playerId: string,
    teamId: string,
    season: string,
    categories?: string[]
  ): Promise<Record<string, StatsComparison>> {
    const stats = await statisticsEngine.getPlayerStats(playerId, teamId, season)
    if (!stats) {
      throw new Error('Player not found')
    }

    const defaultCategories = [
      'goals', 'assists', 'points', 'shots', 'shootingPercentage',
      'pointsPerGame', 'penaltyMinutes', 'plusMinus'
    ]
    const rankCategories = categories || defaultCategories

    const rankings: Record<string, StatsComparison> = {}

    for (const category of rankCategories) {
      rankings[category] = await this.getPlayerRankInCategory(
        playerId,
        stats.player.firstName + ' ' + stats.player.lastName,
        category,
        teamId,
        season,
        stats.player.position
      )
    }

    return rankings
  }

  async createLeaderboard(
    teamId: string,
    season: string,
    category: string,
    options: {
      position?: 'F' | 'D' | 'G' | 'all'
      minGamesPlayed?: number
      limit?: number
      includeInactive?: boolean
    } = {}
  ): Promise<StatsLeaderboard> {
    const { position = 'all', minGamesPlayed = 5, limit = 10, includeInactive = false } = options

    // Check cache first
    const cached = statisticsCache.getLeaderboard(teamId, season, category, position, minGamesPlayed)
    if (cached) {
      return cached
    }

    // Get players
    let query = supabase
      .from('players')
      .select('id, first_name, last_name, jersey_number, position')
      .eq('team_id', teamId)

    if (!includeInactive) {
      query = query.eq('active', true)
    }

    if (position !== 'all') {
      query = query.eq('position', position)
    }

    const { data: players } = await query

    if (!players?.length) {
      const emptyLeaderboard: StatsLeaderboard = {
        category,
        leaders: [],
        lastUpdated: new Date().toISOString()
      }
      return emptyLeaderboard
    }

    // Calculate stats for all players
    const leaderData = []
    for (const player of players) {
      try {
        const stats = await statisticsEngine.getPlayerStats(player.id, teamId, season)
        if (!stats || stats.baseStats.gamesPlayed < minGamesPlayed) {
          continue
        }

        const value = this.getStatValue(stats, category)
        if (value !== undefined) {
          leaderData.push({
            playerId: player.id,
            playerName: `${player.first_name} ${player.last_name}`,
            jerseyNumber: player.jersey_number,
            position: player.position,
            value,
            gamesPlayed: stats.baseStats.gamesPlayed
          })
        }
      } catch (error) {
        console.error(`Error getting stats for player ${player.id}:`, error)
      }
    }

    // Sort by category (most stats are "higher is better")
    const lowerIsBetter = this.isLowerBetter(category)
    const sortedLeaders = leaderData
      .sort((a, b) => lowerIsBetter ? a.value - b.value : b.value - a.value)
      .slice(0, limit)

    const leaderboard: StatsLeaderboard = {
      category,
      leaders: sortedLeaders,
      lastUpdated: new Date().toISOString()
    }

    // Cache the result
    statisticsCache.setLeaderboard(teamId, season, category, leaderboard, position, minGamesPlayed)

    return leaderboard
  }

  async getPositionalLeaders(
    teamId: string,
    season: string,
    position: 'F' | 'D' | 'G'
  ): Promise<Record<string, StatsLeaderboard>> {
    const positionCategories = {
      F: ['goals', 'assists', 'points', 'shootingPercentage', 'faceoffPercentage'],
      D: ['assists', 'points', 'plusMinus', 'blocked', 'timeOnIcePerGame'],
      G: ['wins', 'savePercentage', 'goalsAgainstAverage', 'shutouts']
    }

    const categories = positionCategories[position]
    const leaderboards: Record<string, StatsLeaderboard> = {}

    for (const category of categories) {
      leaderboards[category] = await this.createLeaderboard(
        teamId,
        season,
        category,
        { position, limit: 5 }
      )
    }

    return leaderboards
  }

  async getTeamStatsSummary(
    teamId: string,
    season: string
  ): Promise<{
    topPerformers: Record<string, any>
    teamStats: any
    positionBreakdown: Record<string, number>
    keyInsights: string[]
  }> {
    // Get top performers in key categories
    const keyCategories = ['points', 'goals', 'assists', 'savePercentage', 'plusMinus']
    const topPerformers: Record<string, any> = {}

    for (const category of keyCategories) {
      const leaderboard = await this.createLeaderboard(teamId, season, category, { limit: 3 })
      topPerformers[category] = leaderboard.leaders[0] || null
    }

    // Get team stats
    const teamStats = await statisticsEngine.getTeamStats(teamId, season)

    // Position breakdown
    const { data: players } = await supabase
      .from('players')
      .select('position')
      .eq('team_id', teamId)
      .eq('active', true)

    const positionBreakdown = players?.reduce((acc, player) => {
      acc[player.position] = (acc[player.position] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Generate insights
    const keyInsights = this.generateTeamInsights(topPerformers, teamStats, positionBreakdown)

    return {
      topPerformers,
      teamStats,
      positionBreakdown,
      keyInsights
    }
  }

  async comparePlayerToTeamAverage(
    playerId: string,
    teamId: string,
    season: string
  ): Promise<{
    player: PlayerStatsComplete
    teamAverages: Record<string, number>
    comparisons: Record<string, {
      playerValue: number
      teamAverage: number
      percentageDiff: number
      betterThanAverage: boolean
    }>
    percentileRankings: Record<string, number>
  }> {
    const player = await statisticsEngine.getPlayerStats(playerId, teamId, season)
    if (!player) {
      throw new Error('Player not found')
    }

    const categories = [
      'pointsPerGame', 'goals', 'assists', 'shootingPercentage',
      'penaltyMinutesPerGame', 'plusMinus'
    ]

    const teamAverages = await this.calculateTeamAverages(teamId, season, categories)
    const comparisons: Record<string, any> = {}
    const percentileRankings: Record<string, number> = {}

    for (const category of categories) {
      const playerValue = this.getStatValue(player, category)
      const teamAverage = teamAverages[category]

      if (playerValue !== undefined && teamAverage !== undefined) {
        const percentageDiff = teamAverage > 0 
          ? ((playerValue - teamAverage) / teamAverage) * 100 
          : 0
        
        const betterThanAverage = this.isLowerBetter(category) 
          ? playerValue < teamAverage 
          : playerValue > teamAverage

        comparisons[category] = {
          playerValue,
          teamAverage,
          percentageDiff: Math.round(percentageDiff * 100) / 100,
          betterThanAverage
        }

        // Calculate percentile ranking
        percentileRankings[category] = await this.calculatePercentileRank(
          playerId, teamId, season, category
        )
      }
    }

    return {
      player,
      teamAverages,
      comparisons,
      percentileRankings
    }
  }

  // Private helper methods

  private async calculateCategoryRankings(
    players: ComparisonPlayer[],
    category: string,
    teamId: string,
    season: string
  ): Promise<StatsComparison[]> {
    // Get all team players for full context
    const { data: allPlayers } = await supabase
      .from('players')
      .select('id')
      .eq('team_id', teamId)
      .eq('active', true)

    const allPlayerStats = []
    for (const player of allPlayers || []) {
      const stats = await statisticsEngine.getPlayerStats(player.id, teamId, season)
      if (stats && stats.baseStats.gamesPlayed >= 5) {
        const value = this.getStatValue(stats, category)
        if (value !== undefined) {
          allPlayerStats.push({ playerId: player.id, value })
        }
      }
    }

    // Sort for ranking
    const lowerIsBetter = this.isLowerBetter(category)
    allPlayerStats.sort((a, b) => lowerIsBetter ? a.value - b.value : b.value - a.value)

    // Calculate team average
    const teamAverage = allPlayerStats.length > 0
      ? allPlayerStats.reduce((sum, p) => sum + p.value, 0) / allPlayerStats.length
      : 0

    // Create comparison objects for our specific players
    return players.map(player => {
      const playerValue = this.getStatValue(player.stats, category)
      const rank = allPlayerStats.findIndex(p => p.playerId === player.playerId) + 1
      const percentile = allPlayerStats.length > 0 
        ? ((allPlayerStats.length - rank + 1) / allPlayerStats.length) * 100 
        : 0

      return {
        playerId: player.playerId,
        playerName: player.playerName,
        stat: category as keyof DerivedStats,
        value: playerValue || 0,
        rank: rank > 0 ? rank : allPlayerStats.length + 1,
        percentile: Math.round(percentile),
        teamAverage
      }
    })
  }

  private async getPlayerRankInCategory(
    playerId: string,
    playerName: string,
    category: string,
    teamId: string,
    season: string,
    position?: string
  ): Promise<StatsComparison> {
    const leaderboard = await this.createLeaderboard(
      teamId, 
      season, 
      category, 
      { position: position as any, limit: 100 }
    )

    const playerIndex = leaderboard.leaders.findIndex(leader => leader.playerId === playerId)
    const rank = playerIndex >= 0 ? playerIndex + 1 : leaderboard.leaders.length + 1
    
    const percentile = leaderboard.leaders.length > 0
      ? ((leaderboard.leaders.length - playerIndex) / leaderboard.leaders.length) * 100
      : 0

    const teamAverage = leaderboard.leaders.length > 0
      ? leaderboard.leaders.reduce((sum, leader) => sum + leader.value, 0) / leaderboard.leaders.length
      : 0

    const playerData = leaderboard.leaders.find(leader => leader.playerId === playerId)

    return {
      playerId,
      playerName,
      stat: category as keyof DerivedStats,
      value: playerData?.value || 0,
      rank,
      percentile: Math.round(percentile),
      teamAverage
    }
  }

  private async calculateTeamAverages(
    teamId: string,
    season: string,
    categories: string[]
  ): Promise<Record<string, number>> {
    const { data: players } = await supabase
      .from('players')
      .select('id')
      .eq('team_id', teamId)
      .eq('active', true)

    const averages: Record<string, number> = {}
    
    for (const category of categories) {
      const values = []
      
      for (const player of players || []) {
        const stats = await statisticsEngine.getPlayerStats(player.id, teamId, season)
        if (stats && stats.baseStats.gamesPlayed >= 5) {
          const value = this.getStatValue(stats, category)
          if (value !== undefined) {
            values.push(value)
          }
        }
      }
      
      averages[category] = values.length > 0
        ? values.reduce((sum, val) => sum + val, 0) / values.length
        : 0
    }

    return averages
  }

  private async calculatePositionAverages(
    teamId: string,
    season: string,
    categories: string[]
  ): Promise<Record<string, Record<string, number>>> {
    const positions = ['F', 'D', 'G']
    const positionAverages: Record<string, Record<string, number>> = {}

    for (const position of positions) {
      positionAverages[position] = await this.calculateTeamAverages(teamId, season, categories)
      // This would be filtered by position in a real implementation
    }

    return positionAverages
  }

  private async calculatePercentileRank(
    playerId: string,
    teamId: string,
    season: string,
    category: string
  ): Promise<number> {
    const leaderboard = await this.createLeaderboard(teamId, season, category, { limit: 100 })
    const playerIndex = leaderboard.leaders.findIndex(leader => leader.playerId === playerId)
    
    return playerIndex >= 0
      ? ((leaderboard.leaders.length - playerIndex) / leaderboard.leaders.length) * 100
      : 0
  }

  private getStatValue(stats: PlayerStatsComplete, category: string): number | undefined {
    // Check base stats
    if ((stats.baseStats as any)[category] !== undefined) {
      return (stats.baseStats as any)[category]
    }
    
    // Check skill stats
    if ((stats.skillStats as any)[category] !== undefined) {
      return (stats.skillStats as any)[category]
    }
    
    // Check derived stats
    if ((stats.derivedStats as any)[category] !== undefined) {
      return (stats.derivedStats as any)[category]
    }
    
    return undefined
  }

  private isLowerBetter(category: string): boolean {
    const lowerIsBetterStats = [
      'goalsAgainstAverage',
      'penaltyMinutes',
      'penaltyMinutesPerGame',
      'giveaways',
      'giveawaysPerSixty'
    ]
    return lowerIsBetterStats.includes(category)
  }

  private generateComparisonInsights(
    players: ComparisonPlayer[],
    rankings: Record<string, StatsComparison[]>,
    teamAverages: Record<string, number>
  ): string[] {
    const insights: string[] = []

    // Find the top performer in key categories
    const keyCategories = ['points', 'goals', 'assists']
    for (const category of keyCategories) {
      const categoryRankings = rankings[category]
      if (categoryRankings?.length > 0) {
        const topPlayer = categoryRankings.reduce((top, player) => 
          player.rank < top.rank ? player : top
        )
        insights.push(`${topPlayer.playerName} leads in ${category} with ${topPlayer.value}`)
      }
    }

    // Identify players performing above team average
    const aboveAverageCount = Object.keys(teamAverages).reduce((count, category) => {
      const avg = teamAverages[category]
      const playersAboveAvg = players.filter(player => {
        const value = this.getStatValue(player.stats, category)
        return value !== undefined && value > avg
      })
      return count + playersAboveAvg.length
    }, 0)

    if (aboveAverageCount > 0) {
      insights.push(`${aboveAverageCount} performance metrics above team average`)
    }

    return insights
  }

  private generateTeamInsights(
    topPerformers: Record<string, any>,
    teamStats: any,
    positionBreakdown: Record<string, number>
  ): string[] {
    const insights: string[] = []

    // Team composition insight
    const totalPlayers = Object.values(positionBreakdown).reduce((sum: number, count: number) => sum + count, 0)
    const forwardPercentage = Math.round((positionBreakdown['F'] || 0) / totalPlayers * 100)
    insights.push(`Team composition: ${forwardPercentage}% forwards, ${Math.round((positionBreakdown['D'] || 0) / totalPlayers * 100)}% defense, ${Math.round((positionBreakdown['G'] || 0) / totalPlayers * 100)}% goalies`)

    // Performance insights
    if (teamStats) {
      insights.push(`Team record: ${teamStats.wins}-${teamStats.losses}-${teamStats.overtimeLosses}`)
      
      if (teamStats.goalsFor > teamStats.goalsAgainst) {
        insights.push(`Strong offensive team (+${teamStats.goalsFor - teamStats.goalsAgainst} goal differential)`)
      } else if (teamStats.goalsFor < teamStats.goalsAgainst) {
        insights.push(`Defensive focus needed (${teamStats.goalsFor - teamStats.goalsAgainst} goal differential)`)
      }
    }

    // Top performer insights
    if (topPerformers.points) {
      insights.push(`Leading scorer: ${topPerformers.points.playerName} (${topPerformers.points.value} points)`)
    }

    return insights
  }
}

export const statsComparisonService = new StatsComparisonService()