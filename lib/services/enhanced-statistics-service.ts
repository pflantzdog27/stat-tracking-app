import { statisticsEngine } from './statistics-engine'
import { positionStatsCalculator } from './position-stats'
import { derivedMetricsCalculator } from './derived-metrics'
import { statisticsCache } from './stats-cache'
import { statsComparisonService } from './stats-comparison'
import {
  PlayerStatsComplete,
  TeamStats,
  StatsLeaderboard,
  StatsComparison,
  StatsTrend,
  AdvancedMetrics,
  StatsCalculationOptions
} from '@/types/statistics'

export class EnhancedStatisticsService {
  
  // Player Statistics with caching and optimization
  async getPlayerStatsComplete(
    playerId: string,
    teamId: string,
    season: string,
    options?: StatsCalculationOptions & {
      includeAdvanced?: boolean
      includeTrends?: boolean
      includeComparisons?: boolean
    }
  ): Promise<{
    stats: PlayerStatsComplete
    advanced?: AdvancedMetrics
    trends?: StatsTrend[]
    teamComparison?: Record<string, StatsComparison>
  }> {
    // Check cache first
    const cached = await statisticsCache.getPlayerStats(playerId, teamId, season, options)
    if (cached) {
      const result: any = { stats: cached }
      
      if (options?.includeAdvanced) {
        result.advanced = await this.getPlayerAdvancedMetrics(playerId, teamId, season, cached.player.position)
      }
      
      if (options?.includeTrends) {
        result.trends = await this.getPlayerTrends(playerId, teamId, season)
      }
      
      if (options?.includeComparisons) {
        result.teamComparison = await statsComparisonService.getPlayerRankings(playerId, teamId, season)
      }
      
      return result
    }

    // Calculate fresh stats
    const stats = await statisticsEngine.getPlayerStats(playerId, teamId, season, options)
    if (!stats) {
      throw new Error('Player stats not found')
    }

    // Cache the base stats
    statisticsCache.setPlayerStats(playerId, teamId, season, stats, options)

    const result: any = { stats }

    // Add optional data
    if (options?.includeAdvanced) {
      result.advanced = await this.getPlayerAdvancedMetrics(playerId, teamId, season, stats.player.position)
    }
    
    if (options?.includeTrends) {
      result.trends = await this.getPlayerTrends(playerId, teamId, season)
    }
    
    if (options?.includeComparisons) {
      result.teamComparison = await statsComparisonService.getPlayerRankings(playerId, teamId, season)
    }

    return result
  }

  // Team Statistics with comprehensive analysis
  async getTeamStatsComplete(
    teamId: string,
    season: string,
    options?: {
      includePlayerBreakdown?: boolean
      includeLeaderboards?: boolean
      includeInsights?: boolean
    }
  ): Promise<{
    teamStats: TeamStats
    playerBreakdown?: any[]
    leaderboards?: Record<string, StatsLeaderboard>
    insights?: string[]
  }> {
    // Check cache
    const cachedTeamStats = await statisticsCache.getTeamStats(teamId, season)
    const teamStats = cachedTeamStats || await statisticsEngine.getTeamStats(teamId, season)
    
    if (!cachedTeamStats) {
      statisticsCache.setTeamStats(teamId, season, teamStats)
    }

    const result: any = { teamStats }

    if (options?.includePlayerBreakdown) {
      result.playerBreakdown = await this.getTeamPlayerBreakdown(teamId, season)
    }

    if (options?.includeLeaderboards) {
      result.leaderboards = await this.getTeamLeaderboards(teamId, season)
    }

    if (options?.includeInsights) {
      const summary = await statsComparisonService.getTeamStatsSummary(teamId, season)
      result.insights = summary.keyInsights
    }

    return result
  }

  // Advanced player metrics
  async getPlayerAdvancedMetrics(
    playerId: string,
    teamId: string,
    season: string,
    position: 'F' | 'D' | 'G'
  ): Promise<AdvancedMetrics> {
    const cacheKey = `advanced_${playerId}_${season}`
    const cached = statisticsCache.getSeasonAggregation(teamId, season, cacheKey)
    if (cached) {
      return cached
    }

    const advanced = await positionStatsCalculator.calculateAdvancedMetrics(
      playerId, teamId, season, position
    )

    statisticsCache.setSeasonAggregation(teamId, season, cacheKey, advanced)
    return advanced
  }

  // Player performance trends
  async getPlayerTrends(
    playerId: string,
    teamId: string,
    season: string,
    stats?: string[]
  ): Promise<StatsTrend[]> {
    const defaultStats = ['points', 'goals', 'assists', 'shots', 'shootingPercentage']
    const trendsToCalculate = stats || defaultStats
    
    const trends: StatsTrend[] = []
    
    for (const stat of trendsToCalculate) {
      // This would call the trends API endpoint or calculate directly
      try {
        const trend = await this.calculatePlayerTrend(playerId, teamId, season, stat)
        trends.push(trend)
      } catch (error) {
        console.error(`Error calculating trend for ${stat}:`, error)
      }
    }
    
    return trends
  }

  // Comprehensive player comparison
  async comparePlayersAdvanced(
    playerIds: string[],
    teamId: string,
    season: string,
    options?: {
      categories?: string[]
      includeVisualizations?: boolean
      includeInsights?: boolean
    }
  ): Promise<{
    comparison: any
    visualizations?: any
    insights?: string[]
  }> {
    const comparison = await statsComparisonService.comparePlayersDetailed(
      playerIds, teamId, season, options?.categories
    )

    const result: any = { comparison }

    if (options?.includeVisualizations) {
      result.visualizations = this.generateComparisonVisualizations(comparison)
    }

    if (options?.includeInsights) {
      result.insights = comparison.insights
    }

    return result
  }

  // Multi-dimensional leaderboards
  async getMultiDimensionalLeaderboards(
    teamId: string,
    season: string,
    options?: {
      categories?: string[]
      positions?: ('F' | 'D' | 'G')[]
      minGames?: number
      includePercentiles?: boolean
    }
  ): Promise<{
    leaderboards: Record<string, StatsLeaderboard>
    crossCategoryLeaders: any[]
    positionLeaders: Record<string, Record<string, StatsLeaderboard>>
  }> {
    const { 
      categories = ['points', 'goals', 'assists', 'savePercentage', 'plusMinus'],
      positions = ['F', 'D', 'G'],
      minGames = 5 
    } = options || {}

    const leaderboards: Record<string, StatsLeaderboard> = {}
    const positionLeaders: Record<string, Record<string, StatsLeaderboard>> = {}

    // Overall leaderboards
    for (const category of categories) {
      leaderboards[category] = await statsComparisonService.createLeaderboard(
        teamId, season, category, { minGamesPlayed: minGames }
      )
    }

    // Position-specific leaderboards
    for (const position of positions) {
      positionLeaders[position] = await statsComparisonService.getPositionalLeaders(
        teamId, season, position
      )
    }

    // Cross-category analysis (players who lead in multiple categories)
    const crossCategoryLeaders = this.findCrossCategoryLeaders(leaderboards)

    return {
      leaderboards,
      crossCategoryLeaders,
      positionLeaders
    }
  }

  // Performance analytics dashboard data
  async getPerformanceAnalytics(
    teamId: string,
    season: string
  ): Promise<{
    teamOverview: any
    playerEfficiency: any[]
    trendAnalysis: any
    benchmarkComparisons: any
    actionableInsights: string[]
  }> {
    const teamStats = await statisticsEngine.getTeamStats(teamId, season)
    const teamSummary = await statsComparisonService.getTeamStatsSummary(teamId, season)
    
    // Calculate efficiency metrics for all players
    const playerEfficiency = await this.calculateTeamEfficiencyMetrics(teamId, season)
    
    // Trend analysis
    const trendAnalysis = await this.calculateTeamTrends(teamId, season)
    
    // Benchmark comparisons (could be league averages, historical data, etc.)
    const benchmarkComparisons = {
      goalsFor: { team: teamStats.goalsForPerGame, benchmark: 3.2 },
      goalsAgainst: { team: teamStats.goalsAgainstPerGame, benchmark: 2.8 },
      powerPlay: { team: teamStats.powerPlayPercentage, benchmark: 20.0 },
      penaltyKill: { team: teamStats.penaltyKillPercentage, benchmark: 82.0 }
    }
    
    // Generate actionable insights
    const actionableInsights = this.generateActionableInsights(
      teamStats, 
      teamSummary, 
      playerEfficiency, 
      benchmarkComparisons
    )

    return {
      teamOverview: { ...teamStats, ...teamSummary },
      playerEfficiency,
      trendAnalysis,
      benchmarkComparisons,
      actionableInsights
    }
  }

  // Real-time stats updates
  async updateLiveGameStats(gameId: string, teamId: string, season: string): Promise<void> {
    // Invalidate relevant caches
    await statisticsCache.onGameEventUpdate(gameId, teamId, season)
    
    // Trigger background recalculation for key stats
    this.backgroundRecalculation(teamId, season)
  }

  // Background processing for performance
  private async backgroundRecalculation(teamId: string, season: string): Promise<void> {
    // This would run in the background to warm caches
    try {
      await statisticsCache.preloadTeamStats(teamId, season)
    } catch (error) {
      console.error('Background recalculation error:', error)
    }
  }

  // Private helper methods

  private async calculatePlayerTrend(
    playerId: string,
    teamId: string,
    season: string,
    stat: string
  ): Promise<StatsTrend> {
    // This would implement the actual trend calculation
    // For now, return a placeholder structure
    return {
      playerId,
      stat: stat as keyof import('@/types/statistics').BasePlayerStats,
      games: [],
      overallTrend: 'stable',
      trendPercentage: 0
    }
  }

  private async getTeamPlayerBreakdown(teamId: string, season: string): Promise<any[]> {
    // Get all team players with basic stats
    const { data: players } = await import('@/lib/supabase/client').then(m => m.supabase)
      .from('players')
      .select('id, first_name, last_name, jersey_number, position')
      .eq('team_id', teamId)
      .eq('active', true)

    const breakdown = []
    for (const player of players || []) {
      const stats = await statisticsEngine.getPlayerStats(player.id, teamId, season)
      if (stats) {
        breakdown.push({
          ...player,
          stats: {
            gamesPlayed: stats.baseStats.gamesPlayed,
            points: stats.baseStats.points,
            pointsPerGame: stats.derivedStats.pointsPerGame
          }
        })
      }
    }

    return breakdown.sort((a, b) => b.stats.points - a.stats.points)
  }

  private async getTeamLeaderboards(teamId: string, season: string): Promise<Record<string, StatsLeaderboard>> {
    const categories = ['points', 'goals', 'assists', 'saves', 'savePercentage']
    const leaderboards: Record<string, StatsLeaderboard> = {}

    for (const category of categories) {
      leaderboards[category] = await statsComparisonService.createLeaderboard(
        teamId, season, category, { limit: 5 }
      )
    }

    return leaderboards
  }

  private generateComparisonVisualizations(comparison: any): any {
    // Generate data structures suitable for charts/graphs
    return {
      radarChart: this.prepareRadarChartData(comparison),
      barChart: this.prepareBarChartData(comparison),
      scatterPlot: this.prepareScatterPlotData(comparison)
    }
  }

  private prepareRadarChartData(comparison: any): any {
    // Prepare radar chart data for player comparison
    return {
      categories: Object.keys(comparison.rankings),
      players: comparison.players.map((player: any) => ({
        name: player.playerName,
        values: Object.keys(comparison.rankings).map(category => 
          comparison.rankings[category]?.find((r: any) => r.playerId === player.playerId)?.percentile || 0
        )
      }))
    }
  }

  private prepareBarChartData(comparison: any): any {
    // Prepare bar chart data
    return Object.keys(comparison.rankings).map(category => ({
      category,
      players: comparison.rankings[category].map((ranking: any) => ({
        name: ranking.playerName,
        value: ranking.value
      }))
    }))
  }

  private prepareScatterPlotData(comparison: any): any {
    // Prepare scatter plot data (e.g., goals vs assists)
    return {
      xAxis: 'goals',
      yAxis: 'assists',
      data: comparison.players.map((player: any) => ({
        name: player.playerName,
        x: player.stats.baseStats.goals,
        y: player.stats.baseStats.assists,
        size: player.stats.baseStats.points
      }))
    }
  }

  private findCrossCategoryLeaders(leaderboards: Record<string, StatsLeaderboard>): any[] {
    const playerLeadershipCount = new Map<string, { player: any, categories: string[], count: number }>()
    
    Object.entries(leaderboards).forEach(([category, leaderboard]) => {
      // Consider top 3 in each category as "leaders"
      leaderboard.leaders.slice(0, 3).forEach((leader, index) => {
        if (!playerLeadershipCount.has(leader.playerId)) {
          playerLeadershipCount.set(leader.playerId, {
            player: leader,
            categories: [],
            count: 0
          })
        }
        
        const entry = playerLeadershipCount.get(leader.playerId)!
        entry.categories.push(category)
        entry.count += (3 - index) // Weight: 1st place = 3 points, 2nd = 2, 3rd = 1
      })
    })
    
    return Array.from(playerLeadershipCount.values())
      .filter(entry => entry.categories.length > 1) // Only players who lead in multiple categories
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  private async calculateTeamEfficiencyMetrics(teamId: string, season: string): Promise<any[]> {
    const { data: players } = await import('@/lib/supabase/client').then(m => m.supabase)
      .from('players')
      .select('id, first_name, last_name, position')
      .eq('team_id', teamId)
      .eq('active', true)

    const efficiency = []
    for (const player of players || []) {
      const stats = await statisticsEngine.getPlayerStats(player.id, teamId, season)
      if (stats && stats.baseStats.gamesPlayed >= 5) {
        efficiency.push({
          playerId: player.id,
          playerName: `${player.first_name} ${player.last_name}`,
          position: player.position,
          pointsPerGame: stats.derivedStats.pointsPerGame,
          shotsPerGame: stats.derivedStats.shotsPerGame,
          shootingPercentage: stats.derivedStats.shootingPercentage,
          efficiency: this.calculatePlayerEfficiencyScore(stats)
        })
      }
    }

    return efficiency.sort((a, b) => (b.efficiency || 0) - (a.efficiency || 0))
  }

  private calculatePlayerEfficiencyScore(stats: PlayerStatsComplete): number {
    // Simple efficiency score calculation
    const pointsWeight = 3
    const shootingWeight = 2
    const penaltyWeight = -1
    
    let score = 0
    score += (stats.derivedStats.pointsPerGame || 0) * pointsWeight
    score += (stats.derivedStats.shootingPercentage || 0) * shootingWeight
    score += (stats.derivedStats.penaltyMinutesPerGame || 0) * penaltyWeight
    
    return Math.round(score * 100) / 100
  }

  private async calculateTeamTrends(teamId: string, season: string): Promise<any> {
    // This would calculate team-level trends over time
    return {
      goalsFor: { trend: 'improving', percentage: 5.2 },
      goalsAgainst: { trend: 'stable', percentage: 1.1 },
      powerPlay: { trend: 'declining', percentage: -2.8 },
      wins: { trend: 'improving', percentage: 12.5 }
    }
  }

  private generateActionableInsights(
    teamStats: TeamStats,
    teamSummary: any,
    playerEfficiency: any[],
    benchmarks: any
  ): string[] {
    const insights: string[] = []

    // Win rate analysis
    if (teamStats.winPercentage < 50) {
      insights.push('Focus on improving defensive play - allowing too many goals per game')
    }

    // Goal differential analysis
    if (teamStats.goalDifferential < 0) {
      insights.push('Offensive production needs improvement - scoring below league average')
    }

    // Special teams analysis
    if (teamStats.powerPlayPercentage < benchmarks.powerPlay.benchmark) {
      insights.push('Power play efficiency below average - review offensive strategies')
    }

    if (teamStats.penaltyKillPercentage < benchmarks.penaltyKill.benchmark) {
      insights.push('Penalty kill needs attention - too many goals allowed short-handed')
    }

    // Player efficiency insights
    const lowEfficiencyPlayers = playerEfficiency.filter(p => (p.efficiency || 0) < 5).length
    if (lowEfficiencyPlayers > 3) {
      insights.push('Multiple players underperforming - consider line adjustments')
    }

    return insights
  }
}

export const enhancedStatisticsService = new EnhancedStatisticsService()