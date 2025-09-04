import { supabase } from '@/lib/supabase/client'
import { 
  PlayerStatsComplete, 
  TeamStats, 
  StatsLeaderboard,
  StatsCalculationOptions 
} from '@/types/statistics'

interface CacheEntry<T> {
  data: T
  expires: number
  lastUpdated: number
  version: string
}

interface CacheConfig {
  playerStatsTime: number      // 5 minutes
  teamStatsTime: number        // 10 minutes
  leaderboardTime: number      // 15 minutes
  seasonStatsTime: number      // 60 minutes
  maxCacheSize: number         // 1000 entries
}

export class StatisticsCache {
  private cache = new Map<string, CacheEntry<any>>()
  private config: CacheConfig = {
    playerStatsTime: 5 * 60 * 1000,    // 5 minutes
    teamStatsTime: 10 * 60 * 1000,     // 10 minutes
    leaderboardTime: 15 * 60 * 1000,   // 15 minutes
    seasonStatsTime: 60 * 60 * 1000,   // 60 minutes
    maxCacheSize: 1000
  }

  private gameEventVersion = '1.0'
  private lastStatsUpdate = new Map<string, number>()

  constructor(config?: Partial<CacheConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
    
    // Cleanup expired entries every 10 minutes
    setInterval(() => this.cleanup(), 10 * 60 * 1000)
  }

  // Player Stats Caching
  async getPlayerStats(
    playerId: string,
    teamId: string,
    season: string,
    options?: StatsCalculationOptions
  ): Promise<PlayerStatsComplete | null> {
    const key = this.generatePlayerStatsKey(playerId, teamId, season, options)
    const cached = this.get<PlayerStatsComplete>(key)
    
    if (cached) {
      // Check if player data has been updated since cache
      const lastUpdate = await this.getPlayerLastUpdate(playerId)
      if (lastUpdate && cached.lastUpdated < lastUpdate) {
        this.invalidate(key)
        return null
      }
      return cached
    }
    
    return null
  }

  setPlayerStats(
    playerId: string,
    teamId: string,
    season: string,
    data: PlayerStatsComplete,
    options?: StatsCalculationOptions
  ): void {
    const key = this.generatePlayerStatsKey(playerId, teamId, season, options)
    this.set(key, data, this.config.playerStatsTime)
  }

  // Team Stats Caching
  async getTeamStats(teamId: string, season: string): Promise<TeamStats | null> {
    const key = `team_stats_${teamId}_${season}`
    const cached = this.get<TeamStats>(key)
    
    if (cached) {
      // Check if team games have been updated
      const lastUpdate = await this.getTeamLastUpdate(teamId, season)
      if (lastUpdate && cached.lastUpdated < lastUpdate) {
        this.invalidate(key)
        return null
      }
      return cached
    }
    
    return null
  }

  setTeamStats(teamId: string, season: string, data: TeamStats): void {
    const key = `team_stats_${teamId}_${season}`
    this.set(key, data, this.config.teamStatsTime)
  }

  // Leaderboard Caching
  getLeaderboard(
    teamId: string,
    season: string,
    category: string,
    position?: string,
    minGames?: number
  ): StatsLeaderboard | null {
    const key = `leaderboard_${teamId}_${season}_${category}_${position || 'all'}_${minGames || 0}`
    return this.get<StatsLeaderboard>(key)
  }

  setLeaderboard(
    teamId: string,
    season: string,
    category: string,
    data: StatsLeaderboard,
    position?: string,
    minGames?: number
  ): void {
    const key = `leaderboard_${teamId}_${season}_${category}_${position || 'all'}_${minGames || 0}`
    this.set(key, data, this.config.leaderboardTime)
  }

  // Game Stats Caching (for real-time updates)
  getGameStats(gameId: string): any | null {
    const key = `game_stats_${gameId}`
    return this.get(key)
  }

  setGameStats(gameId: string, data: any): void {
    const key = `game_stats_${gameId}`
    this.set(key, data, 2 * 60 * 1000) // 2 minutes for active games
  }

  // Season-long aggregations (longer cache)
  getSeasonAggregation(teamId: string, season: string, type: string): any | null {
    const key = `season_${type}_${teamId}_${season}`
    return this.get(key)
  }

  setSeasonAggregation(teamId: string, season: string, type: string, data: any): void {
    const key = `season_${type}_${teamId}_${season}`
    this.set(key, data, this.config.seasonStatsTime)
  }

  // Cache Invalidation
  invalidatePlayerStats(playerId: string): void {
    const pattern = `player_stats_${playerId}_`
    this.invalidateByPattern(pattern)
  }

  invalidateTeamStats(teamId: string, season?: string): void {
    const pattern = season 
      ? `team_stats_${teamId}_${season}`
      : `team_stats_${teamId}_`
    this.invalidateByPattern(pattern)
  }

  invalidateLeaderboards(teamId: string, season: string): void {
    const pattern = `leaderboard_${teamId}_${season}_`
    this.invalidateByPattern(pattern)
  }

  // Game event triggers cache invalidation
  async onGameEventUpdate(gameId: string, teamId: string, season: string): Promise<void> {
    // Invalidate game-specific stats
    this.invalidate(`game_stats_${gameId}`)
    
    // Invalidate team stats
    this.invalidateTeamStats(teamId, season)
    
    // Invalidate leaderboards
    this.invalidateLeaderboards(teamId, season)
    
    // Get players in the game and invalidate their stats
    const { data: gameEvents } = await supabase
      .from('game_events')
      .select('player_id')
      .eq('game_id', gameId)

    const playerIds = [...new Set(gameEvents?.map(e => e.player_id) || [])]
    playerIds.forEach(playerId => {
      if (playerId) {
        this.invalidatePlayerStats(playerId)
      }
    })
  }

  // Preload commonly accessed stats
  async preloadTeamStats(teamId: string, season: string): Promise<void> {
    // This would be called during off-peak times to warm the cache
    try {
      // Preload team overview
      if (!this.getTeamStats(teamId, season)) {
        // Would call the actual stats calculation service
        console.log(`Preloading team stats for ${teamId} - ${season}`)
      }

      // Preload common leaderboards
      const commonCategories = ['points', 'goals', 'assists', 'saves', 'savePercentage']
      for (const category of commonCategories) {
        if (!this.getLeaderboard(teamId, season, category)) {
          console.log(`Preloading leaderboard: ${category}`)
        }
      }

      // Preload top players' individual stats
      const { data: topPlayers } = await supabase
        .from('players')
        .select('id')
        .eq('team_id', teamId)
        .eq('active', true)
        .limit(20) // Top 20 most active players

      for (const player of topPlayers || []) {
        if (!await this.getPlayerStats(player.id, teamId, season)) {
          console.log(`Preloading player stats for ${player.id}`)
        }
      }
    } catch (error) {
      console.error('Error preloading stats:', error)
    }
  }

  // Performance monitoring
  getCacheStats(): {
    size: number
    hitRate: number
    memory: number
    topKeys: string[]
  } {
    const stats = {
      size: this.cache.size,
      hitRate: this.getHitRate(),
      memory: this.getMemoryUsage(),
      topKeys: this.getMostAccessedKeys()
    }

    return stats
  }

  // Private methods
  private get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.recordCacheMiss(key)
      return null
    }
    
    if (entry.expires < Date.now()) {
      this.cache.delete(key)
      this.recordCacheMiss(key)
      return null
    }
    
    this.recordCacheHit(key)
    return entry.data as T
  }

  private set<T>(key: string, data: T, ttl: number): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.config.maxCacheSize) {
      this.evictLRU()
    }

    const entry: CacheEntry<T> = {
      data,
      expires: Date.now() + ttl,
      lastUpdated: Date.now(),
      version: this.gameEventVersion
    }

    this.cache.set(key, entry)
  }

  private invalidate(key: string): void {
    this.cache.delete(key)
  }

  private invalidateByPattern(pattern: string): void {
    const keysToDelete = []
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key)
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  private cleanup(): void {
    const now = Date.now()
    const keysToDelete = []
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires < now) {
        keysToDelete.push(key)
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key))
    
    console.log(`Cache cleanup: removed ${keysToDelete.length} expired entries`)
  }

  private evictLRU(): void {
    // Simple LRU: remove oldest entry
    let oldestKey = ''
    let oldestTime = Date.now()
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastUpdated < oldestTime) {
        oldestTime = entry.lastUpdated
        oldestKey = key
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  private generatePlayerStatsKey(
    playerId: string,
    teamId: string,
    season: string,
    options?: StatsCalculationOptions
  ): string {
    const optionsHash = options ? this.hashOptions(options) : 'default'
    return `player_stats_${playerId}_${teamId}_${season}_${optionsHash}`
  }

  private hashOptions(options: StatsCalculationOptions): string {
    return Buffer.from(JSON.stringify(options)).toString('base64').substring(0, 8)
  }

  private async getPlayerLastUpdate(playerId: string): Promise<number | null> {
    // Get the most recent game event for this player
    const { data } = await supabase
      .from('game_events')
      .select('created_at')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(1)

    return data?.[0]?.created_at ? new Date(data[0].created_at).getTime() : null
  }

  private async getTeamLastUpdate(teamId: string, season: string): Promise<number | null> {
    // Get the most recent game for this team
    const { data } = await supabase
      .from('games')
      .select('updated_at')
      .eq('season', season)
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .order('updated_at', { ascending: false })
      .limit(1)

    return data?.[0]?.updated_at ? new Date(data[0].updated_at).getTime() : null
  }

  // Performance tracking
  private cacheHits = new Map<string, number>()
  private cacheMisses = new Map<string, number>()
  private accessCounts = new Map<string, number>()

  private recordCacheHit(key: string): void {
    const category = key.split('_')[0] + '_' + key.split('_')[1]
    this.cacheHits.set(category, (this.cacheHits.get(category) || 0) + 1)
    this.accessCounts.set(key, (this.accessCounts.get(key) || 0) + 1)
  }

  private recordCacheMiss(key: string): void {
    const category = key.split('_')[0] + '_' + key.split('_')[1]
    this.cacheMisses.set(category, (this.cacheMisses.get(category) || 0) + 1)
  }

  private getHitRate(): number {
    let totalHits = 0
    let totalMisses = 0
    
    for (const hits of this.cacheHits.values()) {
      totalHits += hits
    }
    
    for (const misses of this.cacheMisses.values()) {
      totalMisses += misses
    }
    
    const total = totalHits + totalMisses
    return total > 0 ? (totalHits / total) * 100 : 0
  }

  private getMemoryUsage(): number {
    // Rough estimate of memory usage
    let size = 0
    for (const entry of this.cache.values()) {
      size += JSON.stringify(entry).length
    }
    return size
  }

  private getMostAccessedKeys(): string[] {
    return Array.from(this.accessCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key]) => key)
  }
}

export const statisticsCache = new StatisticsCache()