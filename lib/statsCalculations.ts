// Hockey Stats Calculation Utilities

export interface PlayerStats {
  games: number
  goals: number
  assists: number
  points?: number
  shots: number
  hits: number
  blocks: number
  timeOnIce: string // "MM:SS" format
  plusMinus: number
  pim: number
  faceoffWins?: number
  faceoffAttempts?: number
  saves?: number
  shotsAgainst?: number
  goalsAgainst?: number
}

export interface TeamStats {
  games: number
  wins: number
  losses: number
  overtimeLosses: number
  points: number
  goalsFor: number
  goalsAgainst: number
  shots: number
  shotsAgainst: number
  powerPlayGoals: number
  powerPlayOpportunities: number
  penaltyKillGoals: number
  penaltyKillOpportunities: number
  faceoffWins: number
  faceoffAttempts: number
  hits: number
  blockedShots: number
  penaltyMinutes: number
}

/**
 * Calculate points for a player (goals + assists)
 */
export function calculatePoints(goals: number, assists: number): number {
  if (goals < 0 || assists < 0) {
    throw new Error('Goals and assists cannot be negative')
  }
  return goals + assists
}

/**
 * Calculate shooting percentage
 */
export function calculateShootingPercentage(goals: number, shots: number): number {
  if (shots === 0) return 0
  if (goals < 0 || shots < 0) {
    throw new Error('Goals and shots cannot be negative')
  }
  if (goals > shots) {
    throw new Error('Goals cannot exceed shots')
  }
  return (goals / shots) * 100
}

/**
 * Calculate save percentage for goalies
 */
export function calculateSavePercentage(saves: number, shotsAgainst: number): number {
  if (shotsAgainst === 0) return 0
  if (saves < 0 || shotsAgainst < 0) {
    throw new Error('Saves and shots against cannot be negative')
  }
  if (saves > shotsAgainst) {
    throw new Error('Saves cannot exceed shots against')
  }
  return (saves / shotsAgainst) * 100
}

/**
 * Calculate goals against average (GAA)
 */
export function calculateGoalsAgainstAverage(goalsAgainst: number, timeOnIce: number): number {
  if (timeOnIce === 0) return 0
  if (goalsAgainst < 0 || timeOnIce < 0) {
    throw new Error('Goals against and time on ice cannot be negative')
  }
  // Convert minutes to 60-minute periods
  const periods = timeOnIce / 60
  return goalsAgainst / periods
}

/**
 * Convert time string (MM:SS) to total seconds
 */
export function timeToSeconds(timeString: string): number {
  if (!timeString || typeof timeString !== 'string') {
    throw new Error('Invalid time string')
  }
  
  const parts = timeString.split(':')
  if (parts.length !== 2) {
    throw new Error('Time must be in MM:SS format')
  }
  
  const minutes = parseInt(parts[0], 10)
  const seconds = parseInt(parts[1], 10)
  
  if (isNaN(minutes) || isNaN(seconds)) {
    throw new Error('Invalid time values')
  }
  
  if (minutes < 0 || seconds < 0 || seconds >= 60) {
    throw new Error('Invalid time format')
  }
  
  return minutes * 60 + seconds
}

/**
 * Convert seconds to time string (MM:SS)
 */
export function secondsToTime(totalSeconds: number): string {
  if (totalSeconds < 0 || !Number.isInteger(totalSeconds)) {
    throw new Error('Seconds must be a non-negative integer')
  }
  
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Calculate faceoff percentage
 */
export function calculateFaceoffPercentage(wins: number, attempts: number): number {
  if (attempts === 0) return 0
  if (wins < 0 || attempts < 0) {
    throw new Error('Faceoff wins and attempts cannot be negative')
  }
  if (wins > attempts) {
    throw new Error('Faceoff wins cannot exceed attempts')
  }
  return (wins / attempts) * 100
}

/**
 * Calculate power play percentage
 */
export function calculatePowerPlayPercentage(goals: number, opportunities: number): number {
  if (opportunities === 0) return 0
  if (goals < 0 || opportunities < 0) {
    throw new Error('Power play goals and opportunities cannot be negative')
  }
  if (goals > opportunities) {
    throw new Error('Power play goals cannot exceed opportunities')
  }
  return (goals / opportunities) * 100
}

/**
 * Calculate penalty kill percentage
 */
export function calculatePenaltyKillPercentage(goalsAllowed: number, opportunities: number): number {
  if (opportunities === 0) return 100
  if (goalsAllowed < 0 || opportunities < 0) {
    throw new Error('Goals allowed and opportunities cannot be negative')
  }
  if (goalsAllowed > opportunities) {
    throw new Error('Goals allowed cannot exceed opportunities')
  }
  return ((opportunities - goalsAllowed) / opportunities) * 100
}

/**
 * Calculate team points percentage (standings points / possible points)
 */
export function calculatePointsPercentage(points: number, gamesPlayed: number): number {
  if (gamesPlayed === 0) return 0
  const possiblePoints = gamesPlayed * 2 // 2 points per game max
  if (points < 0 || gamesPlayed < 0) {
    throw new Error('Points and games played cannot be negative')
  }
  if (points > possiblePoints) {
    throw new Error('Points cannot exceed maximum possible points')
  }
  return (points / possiblePoints) * 100
}

/**
 * Calculate goal differential
 */
export function calculateGoalDifferential(goalsFor: number, goalsAgainst: number): number {
  if (goalsFor < 0 || goalsAgainst < 0) {
    throw new Error('Goals for and against cannot be negative')
  }
  return goalsFor - goalsAgainst
}

/**
 * Calculate average time on ice per game
 */
export function calculateAverageTimeOnIce(totalTimeOnIce: string, gamesPlayed: number): string {
  if (gamesPlayed === 0) return '0:00'
  if (gamesPlayed < 0) {
    throw new Error('Games played cannot be negative')
  }
  
  const totalSeconds = timeToSeconds(totalTimeOnIce)
  const averageSeconds = Math.round(totalSeconds / gamesPlayed)
  
  return secondsToTime(averageSeconds)
}

/**
 * Calculate player efficiency rating (points per game)
 */
export function calculatePointsPerGame(points: number, gamesPlayed: number): number {
  if (gamesPlayed === 0) return 0
  if (points < 0 || gamesPlayed < 0) {
    throw new Error('Points and games played cannot be negative')
  }
  return points / gamesPlayed
}

/**
 * Calculate team winning percentage
 */
export function calculateWinningPercentage(wins: number, losses: number, overtimeLosses: number = 0): number {
  const totalGames = wins + losses + overtimeLosses
  if (totalGames === 0) return 0
  if (wins < 0 || losses < 0 || overtimeLosses < 0) {
    throw new Error('Win/loss values cannot be negative')
  }
  return (wins / totalGames) * 100
}

/**
 * Determine if a player's performance is above league average
 */
export function isAboveAverage(playerStat: number, leagueAverage: number, higherIsBetter: boolean = true): boolean {
  if (higherIsBetter) {
    return playerStat > leagueAverage
  }
  return playerStat < leagueAverage
}

/**
 * Calculate player's rank among team/league
 */
export function calculateRank(playerStat: number, allStats: number[], higherIsBetter: boolean = true): number {
  if (allStats.length === 0) return 1
  
  const sortedStats = [...allStats].sort((a, b) => higherIsBetter ? b - a : a - b)
  const rank = sortedStats.indexOf(playerStat) + 1
  
  return rank > 0 ? rank : allStats.length + 1
}

/**
 * Calculate team strength metrics
 */
export function calculateTeamStrength(teamStats: TeamStats): {
  offensiveStrength: number
  defensiveStrength: number
  specialTeamsStrength: number
} {
  const gamesPlayed = teamStats.games
  if (gamesPlayed === 0) {
    return { offensiveStrength: 0, defensiveStrength: 0, specialTeamsStrength: 0 }
  }
  
  const goalsPerGame = teamStats.goalsFor / gamesPlayed
  const goalsAgainstPerGame = teamStats.goalsAgainst / gamesPlayed
  const powerPlayPct = calculatePowerPlayPercentage(teamStats.powerPlayGoals, teamStats.powerPlayOpportunities)
  const penaltyKillPct = calculatePenaltyKillPercentage(teamStats.penaltyKillGoals, teamStats.penaltyKillOpportunities)
  
  return {
    offensiveStrength: goalsPerGame * 100, // Normalize to percentage-like scale
    defensiveStrength: (6 - goalsAgainstPerGame) * 100 / 6, // Invert so higher is better
    specialTeamsStrength: (powerPlayPct + penaltyKillPct) / 2
  }
}