export interface BasePlayerStats {
  playerId: string
  teamId: string
  season: string
  gamesPlayed: number
  goals: number
  assists: number
  points: number
  shots: number
  shotsOnGoal: number
  penaltyMinutes: number
  plusMinus: number
  faceoffsWon?: number
  faceoffsLost?: number
  hits?: number
  blocked?: number
  giveaways?: number
  takeaways?: number
}

export interface GoalieStats extends BasePlayerStats {
  saves: number
  shotsAgainst: number
  goalsAgainst: number
  shutouts: number
  wins: number
  losses: number
  overtimeLosses: number
  timeOnIce: number // in minutes
}

export interface SkaterStats extends BasePlayerStats {
  timeOnIce: number // in minutes
  powerPlayGoals: number
  powerPlayAssists: number
  shortHandedGoals: number
  shortHandedAssists: number
  gameWinningGoals: number
  overtimeGoals: number
}

export interface ForwardStats extends SkaterStats {
  faceoffPercentage?: number
}

export interface DefenseStats extends SkaterStats {
  blocked: number
}

export interface DerivedStats {
  // Universal metrics
  pointsPerGame: number
  penaltyMinutesPerGame: number
  
  // Skater metrics
  shootingPercentage?: number
  shotsPerGame?: number
  hitsPerGame?: number
  blockedPerGame?: number
  plusMinusPerGame?: number
  timeOnIcePerGame?: number
  powerPlayPoints?: number
  shortHandedPoints?: number
  
  // Goalie metrics
  savePercentage?: number
  goalsAgainstAverage?: number
  shutoutPercentage?: number
  winPercentage?: number
  shotsAgainstPerGame?: number
  savesPerGame?: number
  
  // Advanced metrics
  corsiFor?: number
  corsiAgainst?: number
  corsiPercentage?: number
  fenwickFor?: number
  fenwickAgainst?: number
  fenwickPercentage?: number
  
  // Team context
  teamRank?: {
    goals: number
    assists: number
    points: number
    plusMinus: number
    penaltyMinutes: number
    shootingPercentage?: number
    savePercentage?: number
  }
}

export interface PlayerStatsComplete {
  player: {
    id: string
    firstName: string
    lastName: string
    jerseyNumber: number
    position: 'F' | 'D' | 'G'
  }
  baseStats: BasePlayerStats
  skillStats: SkaterStats | GoalieStats
  derivedStats: DerivedStats
  lastUpdated: string
}

export interface GameStats {
  gameId: string
  playerId: string
  teamId: string
  gameDate: string
  opponent: string
  isHome: boolean
  
  // Basic stats
  goals: number
  assists: number
  shots: number
  shotsOnGoal: number
  penaltyMinutes: number
  plusMinus: number
  timeOnIce: number
  
  // Position specific
  saves?: number
  shotsAgainst?: number
  goalsAgainst?: number
  faceoffsWon?: number
  faceoffsLost?: number
  hits?: number
  blocked?: number
  giveaways?: number
  takeaways?: number
  
  // Game context
  powerPlayGoals?: number
  powerPlayAssists?: number
  shortHandedGoals?: number
  shortHandedAssists?: number
  gameWinningGoal?: boolean
  overtimeGoal?: boolean
}

export interface TeamStats {
  teamId: string
  season: string
  gamesPlayed: number
  wins: number
  losses: number
  overtimeLosses: number
  points: number
  goalsFor: number
  goalsAgainst: number
  goalDifferential: number
  powerPlayGoals: number
  powerPlayOpportunities: number
  penaltyKillGoalsAgainst: number
  penaltyKillOpportunities: number
  shotsFor: number
  shotsAgainst: number
  faceoffWins: number
  faceoffLosses: number
  
  // Derived team metrics
  winPercentage: number
  pointsPerGame: number
  goalsForPerGame: number
  goalsAgainstPerGame: number
  powerPlayPercentage: number
  penaltyKillPercentage: number
  shotDifferential: number
  faceoffPercentage: number
}

export interface StatsPeriod {
  type: 'season' | 'month' | 'last10' | 'home' | 'away' | 'vs_team' | 'date_range'
  season?: string
  startDate?: string
  endDate?: string
  opponent?: string
  homeAway?: 'home' | 'away'
  gameCount?: number
}

export interface StatsFilter {
  teamId: string
  period: StatsPeriod
  playerIds?: string[]
  positions?: ('F' | 'D' | 'G')[]
  minGamesPlayed?: number
}

export interface StatsComparison {
  playerId: string
  playerName: string
  stat: keyof DerivedStats
  value: number
  rank: number
  percentile: number
  teamAverage: number
  leagueAverage?: number
}

export interface StatsTrend {
  playerId: string
  stat: keyof BasePlayerStats
  games: {
    gameId: string
    date: string
    value: number
    opponent: string
    runningAverage: number
  }[]
  overallTrend: 'improving' | 'declining' | 'stable'
  trendPercentage: number
}

export interface StatsLeaderboard {
  category: string
  leaders: {
    playerId: string
    playerName: string
    jerseyNumber: number
    position: string
    value: number
    gamesPlayed: number
  }[]
  lastUpdated: string
}

export interface AdvancedMetrics {
  playerId: string
  season: string
  
  // Shot metrics
  expectedGoals: number
  actualGoals: number
  goalsDifference: number
  
  // Ice time quality
  offensiveZoneStartPercentage: number
  qualityOfCompetition: number
  qualityOfTeammates: number
  
  // Situational stats
  evenStrengthGoals: number
  evenStrengthAssists: number
  powerPlayTimeOnIce: number
  penaltyKillTimeOnIce: number
  
  // Advanced ratios
  pointsPerSixty: number
  primaryAssistPercentage: number
  individualShotAttempts: number
  teamShotAttempts: number
  
  // Defensive metrics (for all positions)
  shotsBlockedPer60: number
  hitsPerSixty: number
  takeawaysPerSixty: number
  giveawaysPerSixty: number
}

export interface StatsCalculationOptions {
  includePlayoffs?: boolean
  includePreseason?: boolean
  excludeEmptyNet?: boolean
  situationalStrength?: 'all' | 'even' | 'powerplay' | 'penalty_kill'
  homeAwayOnly?: 'home' | 'away'
  opponentFilter?: string[]
  dateRange?: {
    start: string
    end: string
  }
}