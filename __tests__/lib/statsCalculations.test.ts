import {
  calculatePoints,
  calculateShootingPercentage,
  calculateSavePercentage,
  calculateGoalsAgainstAverage,
  timeToSeconds,
  secondsToTime,
  calculateFaceoffPercentage,
  calculatePowerPlayPercentage,
  calculatePenaltyKillPercentage,
  calculatePointsPercentage,
  calculateGoalDifferential,
  calculateAverageTimeOnIce,
  calculatePointsPerGame,
  calculateWinningPercentage,
  isAboveAverage,
  calculateRank,
  calculateTeamStrength,
  TeamStats
} from '../../lib/statsCalculations'

describe('statsCalculations', () => {
  
  describe('calculatePoints', () => {
    it('should calculate points correctly', () => {
      expect(calculatePoints(10, 15)).toBe(25)
      expect(calculatePoints(0, 0)).toBe(0)
      expect(calculatePoints(5, 0)).toBe(5)
      expect(calculatePoints(0, 10)).toBe(10)
    })

    it('should throw error for negative values', () => {
      expect(() => calculatePoints(-1, 5)).toThrow('Goals and assists cannot be negative')
      expect(() => calculatePoints(5, -1)).toThrow('Goals and assists cannot be negative')
    })
  })

  describe('calculateShootingPercentage', () => {
    it('should calculate shooting percentage correctly', () => {
      expect(calculateShootingPercentage(10, 100)).toBe(10)
      expect(calculateShootingPercentage(5, 20)).toBe(25)
      expect(calculateShootingPercentage(0, 50)).toBe(0)
    })

    it('should return 0 when shots is 0', () => {
      expect(calculateShootingPercentage(0, 0)).toBe(0)
    })

    it('should throw error for invalid values', () => {
      expect(() => calculateShootingPercentage(-1, 10)).toThrow('Goals and shots cannot be negative')
      expect(() => calculateShootingPercentage(10, -1)).toThrow('Goals and shots cannot be negative')
      expect(() => calculateShootingPercentage(10, 5)).toThrow('Goals cannot exceed shots')
    })
  })

  describe('calculateSavePercentage', () => {
    it('should calculate save percentage correctly', () => {
      expect(calculateSavePercentage(90, 100)).toBe(90)
      expect(calculateSavePercentage(25, 30)).toBeCloseTo(83.33, 2)
      expect(calculateSavePercentage(0, 10)).toBe(0)
    })

    it('should return 0 when shots against is 0', () => {
      expect(calculateSavePercentage(0, 0)).toBe(0)
    })

    it('should throw error for invalid values', () => {
      expect(() => calculateSavePercentage(-1, 10)).toThrow('Saves and shots against cannot be negative')
      expect(() => calculateSavePercentage(10, -1)).toThrow('Saves and shots against cannot be negative')
      expect(() => calculateSavePercentage(10, 5)).toThrow('Saves cannot exceed shots against')
    })
  })

  describe('calculateGoalsAgainstAverage', () => {
    it('should calculate GAA correctly', () => {
      expect(calculateGoalsAgainstAverage(6, 360)).toBe(1) // 6 goals in 360 minutes (6 periods)
      expect(calculateGoalsAgainstAverage(12, 720)).toBe(1) // 12 goals in 720 minutes (12 periods)
      expect(calculateGoalsAgainstAverage(0, 180)).toBe(0)
    })

    it('should return 0 when time on ice is 0', () => {
      expect(calculateGoalsAgainstAverage(5, 0)).toBe(0)
    })

    it('should throw error for negative values', () => {
      expect(() => calculateGoalsAgainstAverage(-1, 100)).toThrow('Goals against and time on ice cannot be negative')
      expect(() => calculateGoalsAgainstAverage(5, -1)).toThrow('Goals against and time on ice cannot be negative')
    })
  })

  describe('timeToSeconds', () => {
    it('should convert time string to seconds correctly', () => {
      expect(timeToSeconds('15:30')).toBe(930)
      expect(timeToSeconds('0:45')).toBe(45)
      expect(timeToSeconds('2:00')).toBe(120)
      expect(timeToSeconds('0:00')).toBe(0)
    })

    it('should throw error for invalid format', () => {
      expect(() => timeToSeconds('invalid')).toThrow('Time must be in MM:SS format')
      expect(() => timeToSeconds('15')).toThrow('Time must be in MM:SS format')
      expect(() => timeToSeconds('15:30:45')).toThrow('Time must be in MM:SS format')
      expect(() => timeToSeconds('')).toThrow('Invalid time string')
      expect(() => timeToSeconds('15:60')).toThrow('Invalid time format')
      expect(() => timeToSeconds('-5:30')).toThrow('Invalid time format')
      expect(() => timeToSeconds('15:-5')).toThrow('Invalid time format')
    })
  })

  describe('secondsToTime', () => {
    it('should convert seconds to time string correctly', () => {
      expect(secondsToTime(930)).toBe('15:30')
      expect(secondsToTime(45)).toBe('0:45')
      expect(secondsToTime(120)).toBe('2:00')
      expect(secondsToTime(0)).toBe('0:00')
      expect(secondsToTime(3661)).toBe('61:01')
    })

    it('should throw error for invalid values', () => {
      expect(() => secondsToTime(-1)).toThrow('Seconds must be a non-negative integer')
      expect(() => secondsToTime(15.5)).toThrow('Seconds must be a non-negative integer')
    })
  })

  describe('calculateFaceoffPercentage', () => {
    it('should calculate faceoff percentage correctly', () => {
      expect(calculateFaceoffPercentage(60, 100)).toBe(60)
      expect(calculateFaceoffPercentage(15, 30)).toBe(50)
      expect(calculateFaceoffPercentage(0, 20)).toBe(0)
    })

    it('should return 0 when attempts is 0', () => {
      expect(calculateFaceoffPercentage(0, 0)).toBe(0)
    })

    it('should throw error for invalid values', () => {
      expect(() => calculateFaceoffPercentage(-1, 10)).toThrow('Faceoff wins and attempts cannot be negative')
      expect(() => calculateFaceoffPercentage(10, -1)).toThrow('Faceoff wins and attempts cannot be negative')
      expect(() => calculateFaceoffPercentage(10, 5)).toThrow('Faceoff wins cannot exceed attempts')
    })
  })

  describe('calculatePowerPlayPercentage', () => {
    it('should calculate power play percentage correctly', () => {
      expect(calculatePowerPlayPercentage(5, 20)).toBe(25)
      expect(calculatePowerPlayPercentage(10, 40)).toBe(25)
      expect(calculatePowerPlayPercentage(0, 15)).toBe(0)
    })

    it('should return 0 when opportunities is 0', () => {
      expect(calculatePowerPlayPercentage(0, 0)).toBe(0)
    })

    it('should throw error for invalid values', () => {
      expect(() => calculatePowerPlayPercentage(-1, 10)).toThrow('Power play goals and opportunities cannot be negative')
      expect(() => calculatePowerPlayPercentage(10, -1)).toThrow('Power play goals and opportunities cannot be negative')
      expect(() => calculatePowerPlayPercentage(10, 5)).toThrow('Power play goals cannot exceed opportunities')
    })
  })

  describe('calculatePenaltyKillPercentage', () => {
    it('should calculate penalty kill percentage correctly', () => {
      expect(calculatePenaltyKillPercentage(3, 20)).toBe(85) // Allowed 3 out of 20, so killed 17/20 = 85%
      expect(calculatePenaltyKillPercentage(0, 10)).toBe(100)
      expect(calculatePenaltyKillPercentage(5, 5)).toBe(0) // Allowed all 5
    })

    it('should return 100 when opportunities is 0', () => {
      expect(calculatePenaltyKillPercentage(0, 0)).toBe(100)
    })

    it('should throw error for invalid values', () => {
      expect(() => calculatePenaltyKillPercentage(-1, 10)).toThrow('Goals allowed and opportunities cannot be negative')
      expect(() => calculatePenaltyKillPercentage(10, -1)).toThrow('Goals allowed and opportunities cannot be negative')
      expect(() => calculatePenaltyKillPercentage(10, 5)).toThrow('Goals allowed cannot exceed opportunities')
    })
  })

  describe('calculatePointsPercentage', () => {
    it('should calculate points percentage correctly', () => {
      expect(calculatePointsPercentage(40, 25)).toBe(80) // 40 points out of 50 possible
      expect(calculatePointsPercentage(82, 41)).toBe(100) // Perfect season
      expect(calculatePointsPercentage(0, 10)).toBe(0)
    })

    it('should return 0 when games played is 0', () => {
      expect(calculatePointsPercentage(0, 0)).toBe(0)
    })

    it('should throw error for invalid values', () => {
      expect(() => calculatePointsPercentage(-1, 10)).toThrow('Points and games played cannot be negative')
      expect(() => calculatePointsPercentage(10, -1)).toThrow('Points and games played cannot be negative')
      expect(() => calculatePointsPercentage(100, 10)).toThrow('Points cannot exceed maximum possible points')
    })
  })

  describe('calculateGoalDifferential', () => {
    it('should calculate goal differential correctly', () => {
      expect(calculateGoalDifferential(150, 120)).toBe(30)
      expect(calculateGoalDifferential(100, 100)).toBe(0)
      expect(calculateGoalDifferential(80, 120)).toBe(-40)
    })

    it('should throw error for negative values', () => {
      expect(() => calculateGoalDifferential(-1, 100)).toThrow('Goals for and against cannot be negative')
      expect(() => calculateGoalDifferential(100, -1)).toThrow('Goals for and against cannot be negative')
    })
  })

  describe('calculateAverageTimeOnIce', () => {
    it('should calculate average time on ice correctly', () => {
      expect(calculateAverageTimeOnIce('100:00', 5)).toBe('20:00')
      expect(calculateAverageTimeOnIce('45:30', 3)).toBe('15:10')
      expect(calculateAverageTimeOnIce('0:00', 5)).toBe('0:00')
    })

    it('should return 0:00 when games played is 0', () => {
      expect(calculateAverageTimeOnIce('20:00', 0)).toBe('0:00')
    })

    it('should throw error for negative games played', () => {
      expect(() => calculateAverageTimeOnIce('20:00', -1)).toThrow('Games played cannot be negative')
    })
  })

  describe('calculatePointsPerGame', () => {
    it('should calculate points per game correctly', () => {
      expect(calculatePointsPerGame(50, 25)).toBe(2)
      expect(calculatePointsPerGame(25, 20)).toBe(1.25)
      expect(calculatePointsPerGame(0, 10)).toBe(0)
    })

    it('should return 0 when games played is 0', () => {
      expect(calculatePointsPerGame(10, 0)).toBe(0)
    })

    it('should throw error for negative values', () => {
      expect(() => calculatePointsPerGame(-1, 10)).toThrow('Points and games played cannot be negative')
      expect(() => calculatePointsPerGame(10, -1)).toThrow('Points and games played cannot be negative')
    })
  })

  describe('calculateWinningPercentage', () => {
    it('should calculate winning percentage correctly', () => {
      expect(calculateWinningPercentage(20, 10, 5)).toBeCloseTo(57.14, 2)
      expect(calculateWinningPercentage(30, 20, 0)).toBe(60)
      expect(calculateWinningPercentage(0, 10, 0)).toBe(0)
    })

    it('should return 0 when no games played', () => {
      expect(calculateWinningPercentage(0, 0, 0)).toBe(0)
    })

    it('should throw error for negative values', () => {
      expect(() => calculateWinningPercentage(-1, 10, 5)).toThrow('Win/loss values cannot be negative')
      expect(() => calculateWinningPercentage(10, -1, 5)).toThrow('Win/loss values cannot be negative')
      expect(() => calculateWinningPercentage(10, 5, -1)).toThrow('Win/loss values cannot be negative')
    })
  })

  describe('isAboveAverage', () => {
    it('should determine if stat is above average correctly', () => {
      expect(isAboveAverage(25, 20, true)).toBe(true)
      expect(isAboveAverage(15, 20, true)).toBe(false)
      expect(isAboveAverage(20, 20, true)).toBe(false)
      
      // For stats where lower is better (like GAA)
      expect(isAboveAverage(2.0, 2.5, false)).toBe(true)
      expect(isAboveAverage(3.0, 2.5, false)).toBe(false)
    })
  })

  describe('calculateRank', () => {
    it('should calculate rank correctly for higher is better', () => {
      const stats = [100, 80, 90, 70, 85]
      expect(calculateRank(100, stats, true)).toBe(1)
      expect(calculateRank(90, stats, true)).toBe(2)
      expect(calculateRank(85, stats, true)).toBe(3)
      expect(calculateRank(80, stats, true)).toBe(4)
      expect(calculateRank(70, stats, true)).toBe(5)
    })

    it('should calculate rank correctly for lower is better', () => {
      const stats = [2.5, 3.0, 2.0, 3.5, 2.8]
      expect(calculateRank(2.0, stats, false)).toBe(1)
      expect(calculateRank(2.5, stats, false)).toBe(2)
      expect(calculateRank(2.8, stats, false)).toBe(3)
      expect(calculateRank(3.0, stats, false)).toBe(4)
      expect(calculateRank(3.5, stats, false)).toBe(5)
    })

    it('should return 1 for empty stats array', () => {
      expect(calculateRank(50, [], true)).toBe(1)
    })

    it('should handle stat not in array', () => {
      const stats = [100, 80, 90]
      expect(calculateRank(60, stats, true)).toBe(4)
    })
  })

  describe('calculateTeamStrength', () => {
    it('should calculate team strength metrics correctly', () => {
      const teamStats: TeamStats = {
        games: 10,
        wins: 7,
        losses: 2,
        overtimeLosses: 1,
        points: 15,
        goalsFor: 30,
        goalsAgainst: 20,
        shots: 300,
        shotsAgainst: 250,
        powerPlayGoals: 6,
        powerPlayOpportunities: 20,
        penaltyKillGoals: 2,
        penaltyKillOpportunities: 15,
        faceoffWins: 150,
        faceoffAttempts: 300,
        hits: 200,
        blockedShots: 80,
        penaltyMinutes: 100
      }

      const strength = calculateTeamStrength(teamStats)
      
      expect(strength.offensiveStrength).toBe(300) // 3 goals per game * 100
      expect(strength.defensiveStrength).toBeCloseTo(66.67, 2) // (6 - 2) * 100 / 6
      expect(strength.specialTeamsStrength).toBeCloseTo(76.67, 2) // (30% + 86.67%) / 2
    })

    it('should return zeros for no games played', () => {
      const teamStats: TeamStats = {
        games: 0,
        wins: 0,
        losses: 0,
        overtimeLosses: 0,
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        shots: 0,
        shotsAgainst: 0,
        powerPlayGoals: 0,
        powerPlayOpportunities: 0,
        penaltyKillGoals: 0,
        penaltyKillOpportunities: 0,
        faceoffWins: 0,
        faceoffAttempts: 0,
        hits: 0,
        blockedShots: 0,
        penaltyMinutes: 0
      }

      const strength = calculateTeamStrength(teamStats)
      expect(strength.offensiveStrength).toBe(0)
      expect(strength.defensiveStrength).toBe(0)
      expect(strength.specialTeamsStrength).toBe(0)
    })
  })
})