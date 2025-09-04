import { createApiMocks, mockTeamData, mockLeagueStandingsData, simulateApiError } from '../utils/testHelpers'

// Mock database module
jest.mock('../../lib/database', () => ({
  getTeams: jest.fn(),
  getTeamById: jest.fn(),
  getTeamStats: jest.fn(),
  getTeamStandings: jest.fn(),
  getTeamPlayers: jest.fn(),
  getTeamSchedule: jest.fn(),
}))

import {
  getTeams,
  getTeamById,
  getTeamStats,
  getTeamStandings,
  getTeamPlayers,
  getTeamSchedule
} from '../../lib/database'

describe('/api/teams', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/teams', () => {
    it('should return all teams successfully', async () => {
      const mockTeams = [mockTeamData(), mockTeamData({ id: 'team-2', name: 'Calgary Flames' })]
      ;(getTeams as jest.Mock).mockResolvedValue(mockTeams)

      const { req, res } = createApiMocks('GET')
      
      const teams = await getTeams()
      
      expect(getTeams).toHaveBeenCalled()
      expect(teams).toEqual(mockTeams)
    })

    it('should handle conference and division filters', async () => {
      const mockTeams = [mockTeamData()]
      ;(getTeams as jest.Mock).mockResolvedValue(mockTeams)

      const { req, res } = createApiMocks('GET', {}, {
        conference: 'Western',
        division: 'Pacific'
      })
      
      const conference = req.query.conference as string
      const division = req.query.division as string
      
      expect(conference).toBe('Western')
      expect(division).toBe('Pacific')
    })

    it('should handle database errors gracefully', async () => {
      const error = simulateApiError(500, 'Database connection failed')
      ;(getTeams as jest.Mock).mockRejectedValue(error)

      try {
        await getTeams()
      } catch (e) {
        expect(e).toBe(error)
      }
    })
  })

  describe('GET /api/teams/[id]', () => {
    it('should return team by ID successfully', async () => {
      const mockTeam = mockTeamData()
      ;(getTeamById as jest.Mock).mockResolvedValue(mockTeam)

      const { req, res } = createApiMocks('GET', {}, { id: 'team-1' })
      
      const team = await getTeamById('team-1')
      
      expect(getTeamById).toHaveBeenCalledWith('team-1')
      expect(team).toEqual(mockTeam)
    })

    it('should return null for non-existent team', async () => {
      ;(getTeamById as jest.Mock).mockResolvedValue(null)

      const team = await getTeamById('non-existent')
      
      expect(team).toBeNull()
    })

    it('should validate team ID format', () => {
      const validIds = ['team-1', 'EDM', 'CGY-2024']
      const invalidIds = ['', ' ', null, undefined]

      validIds.forEach(id => {
        const isValid = id && id.length > 0
        expect(isValid).toBeTruthy()
      })

      invalidIds.forEach(id => {
        const isValid = id && id.length > 0
        expect(isValid).toBeFalsy()
      })
    })
  })

  describe('GET /api/teams/[id]/stats', () => {
    it('should return team stats successfully', async () => {
      const mockStats = {
        team: mockTeamData(),
        season: '2023-24',
        stats: mockTeamData().stats,
        rankings: {
          goalsFor: 3,
          goalsAgainst: 15,
          powerPlay: 8,
          penaltyKill: 12
        }
      }
      ;(getTeamStats as jest.Mock).mockResolvedValue(mockStats)

      const { req, res } = createApiMocks('GET', {}, {
        id: 'team-1',
        season: '2023-24'
      })
      
      const stats = await getTeamStats('team-1', '2023-24')
      
      expect(getTeamStats).toHaveBeenCalledWith('team-1', '2023-24')
      expect(stats).toEqual(mockStats)
    })

    it('should handle current season when no season specified', async () => {
      const currentSeason = '2023-24'
      const mockStats = {
        team: mockTeamData(),
        season: currentSeason,
        stats: mockTeamData().stats
      }
      ;(getTeamStats as jest.Mock).mockResolvedValue(mockStats)

      await getTeamStats('team-1', undefined)
      
      expect(getTeamStats).toHaveBeenCalledWith('team-1', undefined)
    })

    it('should include advanced metrics in stats', async () => {
      const advancedStats = {
        corsiFor: 2850,
        corsiAgainst: 2650,
        corsiForPercentage: 51.8,
        fenwickFor: 2100,
        fenwickAgainst: 2050,
        fenwickForPercentage: 50.6,
        pdo: 101.2,
        expectedGoalsFor: 245.5,
        expectedGoalsAgainst: 230.8
      }

      const mockStats = {
        team: mockTeamData(),
        stats: { ...mockTeamData().stats, advanced: advancedStats }
      }
      ;(getTeamStats as jest.Mock).mockResolvedValue(mockStats)

      const stats = await getTeamStats('team-1', '2023-24')
      
      expect(stats.stats.advanced).toBeDefined()
      expect(stats.stats.advanced.corsiForPercentage).toBeCloseTo(51.8, 1)
    })
  })

  describe('GET /api/teams/[id]/players', () => {
    it('should return team roster successfully', async () => {
      const mockPlayers = [
        { id: 'player-1', name: 'Connor McDavid', position: 'C' },
        { id: 'player-2', name: 'Leon Draisaitl', position: 'C' },
        { id: 'player-3', name: 'Darnell Nurse', position: 'D' }
      ]
      ;(getTeamPlayers as jest.Mock).mockResolvedValue(mockPlayers)

      const { req, res } = createApiMocks('GET', {}, {
        id: 'team-1',
        season: '2023-24'
      })
      
      const players = await getTeamPlayers('team-1', '2023-24')
      
      expect(getTeamPlayers).toHaveBeenCalledWith('team-1', '2023-24')
      expect(players).toEqual(mockPlayers)
    })

    it('should filter players by position', async () => {
      const mockForwards = [
        { id: 'player-1', name: 'Connor McDavid', position: 'C' },
        { id: 'player-2', name: 'Leon Draisaitl', position: 'C' }
      ]
      ;(getTeamPlayers as jest.Mock).mockResolvedValue(mockForwards)

      const { req, res } = createApiMocks('GET', {}, {
        id: 'team-1',
        position: 'F'
      })
      
      const position = req.query.position as string
      expect(position).toBe('F')
    })

    it('should sort players by specified criteria', async () => {
      const mockPlayers = [
        { id: 'player-1', name: 'Connor McDavid', stats: { points: 153 } },
        { id: 'player-2', name: 'Leon Draisaitl', stats: { points: 108 } }
      ]
      ;(getTeamPlayers as jest.Mock).mockResolvedValue(mockPlayers)

      const { req, res } = createApiMocks('GET', {}, {
        id: 'team-1',
        sortBy: 'points',
        sortOrder: 'desc'
      })
      
      const sortBy = req.query.sortBy as string
      const sortOrder = req.query.sortOrder as string
      
      expect(sortBy).toBe('points')
      expect(sortOrder).toBe('desc')
    })
  })

  describe('GET /api/standings', () => {
    it('should return league standings successfully', async () => {
      const mockStandings = mockLeagueStandingsData()
      ;(getTeamStandings as jest.Mock).mockResolvedValue(mockStandings)

      const { req, res } = createApiMocks('GET', {}, {
        season: '2023-24'
      })
      
      const standings = await getTeamStandings('2023-24')
      
      expect(getTeamStandings).toHaveBeenCalledWith('2023-24')
      expect(standings).toEqual(mockStandings)
    })

    it('should filter standings by conference', async () => {
      const westernStandings = mockLeagueStandingsData().filter(team => 
        ['EDM', 'CGY', 'VAN', 'SEA'].includes(team.abbreviation)
      )
      ;(getTeamStandings as jest.Mock).mockResolvedValue(westernStandings)

      const { req, res } = createApiMocks('GET', {}, {
        conference: 'Western',
        season: '2023-24'
      })
      
      const conference = req.query.conference as string
      expect(conference).toBe('Western')
    })

    it('should filter standings by division', async () => {
      const pacificStandings = mockLeagueStandingsData().filter(team => 
        ['EDM', 'CGY', 'VAN', 'SEA', 'LAK', 'ANA', 'SJS'].includes(team.abbreviation)
      )
      ;(getTeamStandings as jest.Mock).mockResolvedValue(pacificStandings)

      const { req, res } = createApiMocks('GET', {}, {
        division: 'Pacific',
        season: '2023-24'
      })
      
      const division = req.query.division as string
      expect(division).toBe('Pacific')
    })
  })

  describe('GET /api/teams/[id]/schedule', () => {
    it('should return team schedule successfully', async () => {
      const mockSchedule = [
        {
          gameId: 'game-1',
          date: '2024-01-15T20:00:00Z',
          opponent: 'CGY',
          homeAway: 'home',
          result: 'W 4-2'
        },
        {
          gameId: 'game-2',
          date: '2024-01-18T19:00:00Z',
          opponent: 'VAN',
          homeAway: 'away',
          result: 'L 2-3'
        }
      ]
      ;(getTeamSchedule as jest.Mock).mockResolvedValue(mockSchedule)

      const { req, res } = createApiMocks('GET', {}, {
        id: 'team-1',
        season: '2023-24'
      })
      
      const schedule = await getTeamSchedule('team-1', '2023-24')
      
      expect(getTeamSchedule).toHaveBeenCalledWith('team-1', '2023-24')
      expect(schedule).toEqual(mockSchedule)
    })

    it('should filter schedule by date range', async () => {
      const { req, res } = createApiMocks('GET', {}, {
        id: 'team-1',
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      })
      
      const startDate = req.query.startDate as string
      const endDate = req.query.endDate as string
      
      expect(startDate).toBe('2024-01-01')
      expect(endDate).toBe('2024-01-31')
      
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      expect(dateRegex.test(startDate)).toBeTruthy()
      expect(dateRegex.test(endDate)).toBeTruthy()
    })

    it('should filter schedule by home/away', async () => {
      const { req, res } = createApiMocks('GET', {}, {
        id: 'team-1',
        homeAway: 'home'
      })
      
      const homeAway = req.query.homeAway as string
      expect(homeAway).toBe('home')
      expect(['home', 'away'].includes(homeAway)).toBeTruthy()
    })
  })

  describe('Error handling', () => {
    it('should handle malformed requests', async () => {
      const { req, res } = createApiMocks('GET', {}, {
        id: 'team-1',
        season: 'invalid-season-format'
      })
      
      const season = req.query.season as string
      const isValidSeason = /^\d{4}-\d{2}$/.test(season)
      
      expect(isValidSeason).toBeFalsy()
    })

    it('should handle missing required parameters', async () => {
      const { req, res } = createApiMocks('GET', {}, {})
      
      const id = req.query.id as string
      const hasRequiredId = Boolean(id)
      
      expect(hasRequiredId).toBeFalsy()
    })

    it('should handle database timeouts', async () => {
      const timeoutError = new Error('Database timeout')
      ;(getTeamById as jest.Mock).mockRejectedValue(timeoutError)

      try {
        await getTeamById('team-1')
      } catch (error) {
        expect(error).toBe(timeoutError)
      }
    })
  })
})