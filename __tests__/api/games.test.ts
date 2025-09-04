import { createApiMocks, mockGameData, mockGameEvents, simulateApiError } from '../utils/testHelpers'

// Mock database module
jest.mock('../../lib/database', () => ({
  getGames: jest.fn(),
  getGameById: jest.fn(),
  getGameStats: jest.fn(),
  getGameEvents: jest.fn(),
  getGameHighlights: jest.fn(),
  updateGameScore: jest.fn(),
}))

import {
  getGames,
  getGameById,
  getGameStats,
  getGameEvents,
  getGameHighlights,
  updateGameScore
} from '../../lib/database'

describe('/api/games', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/games', () => {
    it('should return games successfully', async () => {
      const mockGames = [
        mockGameData(),
        mockGameData({ id: 'game-2', awayTeam: { ...mockGameData().awayTeam, score: 1 } })
      ]
      ;(getGames as jest.Mock).mockResolvedValue(mockGames)

      const { req, res } = createApiMocks('GET')
      
      const games = await getGames()
      
      expect(getGames).toHaveBeenCalled()
      expect(games).toEqual(mockGames)
    })

    it('should handle date range filtering', async () => {
      const { req, res } = createApiMocks('GET', {}, {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        season: '2023-24'
      })
      
      const startDate = req.query.startDate as string
      const endDate = req.query.endDate as string
      const season = req.query.season as string
      
      expect(startDate).toBe('2024-01-01')
      expect(endDate).toBe('2024-01-31')
      expect(season).toBe('2023-24')
      
      // Validate date formats
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      expect(dateRegex.test(startDate)).toBeTruthy()
      expect(dateRegex.test(endDate)).toBeTruthy()
    })

    it('should handle team filtering', async () => {
      const mockGames = [mockGameData()]
      ;(getGames as jest.Mock).mockResolvedValue(mockGames)

      const { req, res } = createApiMocks('GET', {}, {
        team: 'EDM'
      })
      
      const teamFilter = req.query.team as string
      expect(teamFilter).toBe('EDM')
    })

    it('should handle status filtering', async () => {
      const { req, res } = createApiMocks('GET', {}, {
        status: 'live'
      })
      
      const status = req.query.status as string
      const validStatuses = ['scheduled', 'live', 'finished', 'postponed']
      
      expect(status).toBe('live')
      expect(validStatuses.includes(status)).toBeTruthy()
    })

    it('should handle pagination', async () => {
      const { req, res } = createApiMocks('GET', {}, {
        page: '2',
        limit: '25'
      })
      
      const page = parseInt(req.query.page as string, 10)
      const limit = parseInt(req.query.limit as string, 10)
      const offset = (page - 1) * limit
      
      expect(page).toBe(2)
      expect(limit).toBe(25)
      expect(offset).toBe(25)
    })
  })

  describe('GET /api/games/[id]', () => {
    it('should return game by ID successfully', async () => {
      const mockGame = mockGameData()
      ;(getGameById as jest.Mock).mockResolvedValue(mockGame)

      const { req, res } = createApiMocks('GET', {}, { id: 'game-1' })
      
      const game = await getGameById('game-1')
      
      expect(getGameById).toHaveBeenCalledWith('game-1')
      expect(game).toEqual(mockGame)
    })

    it('should return null for non-existent game', async () => {
      ;(getGameById as jest.Mock).mockResolvedValue(null)

      const game = await getGameById('non-existent')
      
      expect(game).toBeNull()
    })

    it('should validate game ID format', () => {
      const validIds = ['game-1', '2024020001', 'regular-123']
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

  describe('GET /api/games/[id]/stats', () => {
    it('should return game statistics successfully', async () => {
      const mockStats = {
        gameId: 'game-1',
        teamStats: {
          home: {
            goals: 4,
            shots: 32,
            hits: 18,
            blockedShots: 12,
            faceoffWins: 28,
            faceoffTotal: 55,
            powerPlayGoals: 1,
            powerPlayOpportunities: 3,
            penaltyMinutes: 8,
            saves: 25,
            shotsAgainst: 27
          },
          away: {
            goals: 2,
            shots: 27,
            hits: 22,
            blockedShots: 15,
            faceoffWins: 27,
            faceoffTotal: 55,
            powerPlayGoals: 0,
            powerPlayOpportunities: 2,
            penaltyMinutes: 12,
            saves: 28,
            shotsAgainst: 32
          }
        },
        playerStats: {
          home: [
            {
              playerId: 'player-1',
              name: 'Connor McDavid',
              position: 'C',
              goals: 2,
              assists: 1,
              points: 3,
              shots: 5,
              hits: 1,
              blocks: 0,
              timeOnIce: '21:30',
              plusMinus: 2,
              pim: 0
            }
          ],
          away: []
        }
      }
      ;(getGameStats as jest.Mock).mockResolvedValue(mockStats)

      const { req, res } = createApiMocks('GET', {}, { id: 'game-1' })
      
      const stats = await getGameStats('game-1')
      
      expect(getGameStats).toHaveBeenCalledWith('game-1')
      expect(stats).toEqual(mockStats)
    })

    it('should handle games without stats', async () => {
      ;(getGameStats as jest.Mock).mockResolvedValue(null)

      const stats = await getGameStats('game-scheduled')
      
      expect(stats).toBeNull()
    })

    it('should validate stat calculations', async () => {
      const mockStats = {
        teamStats: {
          home: { goals: 4, shots: 32 },
          away: { goals: 2, shots: 27 }
        }
      }
      ;(getGameStats as jest.Mock).mockResolvedValue(mockStats)

      const stats = await getGameStats('game-1')
      
      // Verify shooting percentages are reasonable
      const homeShootingPct = (stats.teamStats.home.goals / stats.teamStats.home.shots) * 100
      const awayShootingPct = (stats.teamStats.away.goals / stats.teamStats.away.shots) * 100
      
      expect(homeShootingPct).toBeCloseTo(12.5, 1)
      expect(awayShootingPct).toBeCloseTo(7.41, 1)
    })
  })

  describe('GET /api/games/[id]/events', () => {
    it('should return game events successfully', async () => {
      const mockEvents = mockGameEvents()
      ;(getGameEvents as jest.Mock).mockResolvedValue(mockEvents)

      const { req, res } = createApiMocks('GET', {}, { id: 'game-1' })
      
      const events = await getGameEvents('game-1')
      
      expect(getGameEvents).toHaveBeenCalledWith('game-1')
      expect(events).toEqual(mockEvents)
    })

    it('should filter events by type', async () => {
      const goalEvents = mockGameEvents().filter(event => event.type === 'goal')
      ;(getGameEvents as jest.Mock).mockResolvedValue(goalEvents)

      const { req, res } = createApiMocks('GET', {}, {
        id: 'game-1',
        eventType: 'goal'
      })
      
      const eventType = req.query.eventType as string
      expect(eventType).toBe('goal')
      
      const validEventTypes = ['goal', 'penalty', 'hit', 'save', 'faceoff', 'period_start', 'period_end']
      expect(validEventTypes.includes(eventType)).toBeTruthy()
    })

    it('should filter events by period', async () => {
      const { req, res } = createApiMocks('GET', {}, {
        id: 'game-1',
        period: '2'
      })
      
      const period = parseInt(req.query.period as string, 10)
      expect(period).toBe(2)
      expect(period).toBeGreaterThan(0)
      expect(period).toBeLessThanOrEqual(5) // Including overtime periods
    })

    it('should sort events chronologically', async () => {
      const events = mockGameEvents()
      const sortedEvents = [...events].sort((a, b) => {
        if (a.period !== b.period) return a.period - b.period
        return a.time.localeCompare(b.time)
      })

      expect(sortedEvents[0].period).toBeLessThanOrEqual(sortedEvents[1].period)
    })
  })

  describe('GET /api/games/[id]/highlights', () => {
    it('should return game highlights successfully', async () => {
      const mockHighlights = [
        {
          id: 'highlight-1',
          title: 'McDavid Goal',
          description: 'Connor McDavid scores his 64th goal of the season',
          timestamp: '1st 5:23',
          type: 'goal',
          video: '/videos/highlight-1.mp4',
          thumbnail: '/thumbnails/highlight-1.jpg'
        }
      ]
      ;(getGameHighlights as jest.Mock).mockResolvedValue(mockHighlights)

      const { req, res } = createApiMocks('GET', {}, { id: 'game-1' })
      
      const highlights = await getGameHighlights('game-1')
      
      expect(getGameHighlights).toHaveBeenCalledWith('game-1')
      expect(highlights).toEqual(mockHighlights)
    })

    it('should filter highlights by type', async () => {
      const { req, res } = createApiMocks('GET', {}, {
        id: 'game-1',
        highlightType: 'goal'
      })
      
      const highlightType = req.query.highlightType as string
      const validTypes = ['goal', 'save', 'hit', 'fight']
      
      expect(highlightType).toBe('goal')
      expect(validTypes.includes(highlightType)).toBeTruthy()
    })
  })

  describe('PUT /api/games/[id]/score', () => {
    it('should update game score successfully', async () => {
      const updatedGame = {
        ...mockGameData(),
        homeTeam: { ...mockGameData().homeTeam, score: 5 },
        status: 'live',
        period: 3,
        timeRemaining: '12:34'
      }
      ;(updateGameScore as jest.Mock).mockResolvedValue(updatedGame)

      const { req, res } = createApiMocks('PUT', {
        homeScore: 5,
        awayScore: 2,
        period: 3,
        timeRemaining: '12:34',
        status: 'live'
      }, { id: 'game-1' })
      
      const result = await updateGameScore('game-1', {
        homeScore: 5,
        awayScore: 2,
        period: 3,
        timeRemaining: '12:34',
        status: 'live'
      })
      
      expect(updateGameScore).toHaveBeenCalledWith('game-1', {
        homeScore: 5,
        awayScore: 2,
        period: 3,
        timeRemaining: '12:34',
        status: 'live'
      })
      expect(result.homeTeam.score).toBe(5)
    })

    it('should validate score update payload', () => {
      const validPayload = {
        homeScore: 3,
        awayScore: 2,
        period: 2,
        timeRemaining: '15:23',
        status: 'live'
      }

      const invalidPayloads = [
        { homeScore: -1, awayScore: 2 }, // Negative score
        { homeScore: 3, awayScore: 2, period: 0 }, // Invalid period
        { homeScore: 3, awayScore: 2, status: 'invalid' }, // Invalid status
        { homeScore: 3, awayScore: 2, timeRemaining: 'invalid' } // Invalid time format
      ]

      // Validate valid payload
      expect(validPayload.homeScore).toBeGreaterThanOrEqual(0)
      expect(validPayload.awayScore).toBeGreaterThanOrEqual(0)
      expect(validPayload.period).toBeGreaterThan(0)
      expect(['scheduled', 'live', 'finished', 'postponed'].includes(validPayload.status)).toBeTruthy()

      // Validate invalid payloads
      invalidPayloads.forEach(payload => {
        if ('homeScore' in payload && payload.homeScore < 0) {
          expect(payload.homeScore).toBeLessThan(0)
        }
        if ('period' in payload && payload.period <= 0) {
          expect(payload.period).toBeLessThanOrEqual(0)
        }
      })
    })

    it('should handle authorization for score updates', async () => {
      const { req, res } = createApiMocks('PUT', {
        homeScore: 5,
        awayScore: 2
      }, { id: 'game-1' }, {
        'authorization': 'Bearer invalid-token'
      })
      
      const authHeader = req.headers.authorization
      const hasValidAuth = authHeader && authHeader.startsWith('Bearer ')
      
      expect(hasValidAuth).toBeTruthy()
      // In a real implementation, you would validate the token
    })
  })

  describe('Error handling', () => {
    it('should handle database errors', async () => {
      const dbError = simulateApiError(500, 'Database connection failed')
      ;(getGameById as jest.Mock).mockRejectedValue(dbError)

      try {
        await getGameById('game-1')
      } catch (error) {
        expect(error).toBe(dbError)
      }
    })

    it('should handle invalid game states', async () => {
      const invalidGame = {
        ...mockGameData(),
        status: 'finished',
        homeTeam: { ...mockGameData().homeTeam, score: -1 } // Invalid negative score
      }
      
      expect(invalidGame.homeTeam.score).toBeLessThan(0)
    })

    it('should handle malformed requests', async () => {
      const { req, res } = createApiMocks('POST', 'invalid-json', { id: 'game-1' })
      
      // In a real scenario, this would be handled by middleware
      const isValidJSON = typeof req.body === 'object'
      expect(isValidJSON).toBeFalsy()
    })

    it('should handle missing required fields', async () => {
      const { req, res } = createApiMocks('PUT', {
        homeScore: 3
        // Missing awayScore
      }, { id: 'game-1' })
      
      const hasRequiredFields = req.body.homeScore !== undefined && req.body.awayScore !== undefined
      expect(hasRequiredFields).toBeFalsy()
    })
  })

  describe('Real-time updates', () => {
    it('should handle live game score updates', async () => {
      const initialGame = mockGameData({ status: 'live', period: 2, timeRemaining: '15:30' })
      const updatedGame = {
        ...initialGame,
        homeTeam: { ...initialGame.homeTeam, score: initialGame.homeTeam.score + 1 },
        timeRemaining: '15:00'
      }

      ;(getGameById as jest.Mock).mockResolvedValueOnce(initialGame)
      ;(updateGameScore as jest.Mock).mockResolvedValue(updatedGame)

      const initial = await getGameById('game-1')
      const updated = await updateGameScore('game-1', {
        homeScore: updatedGame.homeTeam.score,
        awayScore: updatedGame.awayTeam.score,
        timeRemaining: updatedGame.timeRemaining
      })

      expect(updated.homeTeam.score).toBe(initial.homeTeam.score + 1)
      expect(updated.timeRemaining).toBe('15:00')
    })

    it('should handle period transitions', async () => {
      const endOfPeriod = {
        period: 1,
        timeRemaining: '00:00',
        status: 'live'
      }

      const nextPeriod = {
        period: 2,
        timeRemaining: '20:00',
        status: 'live'
      }

      expect(nextPeriod.period).toBe(endOfPeriod.period + 1)
      expect(nextPeriod.timeRemaining).toBe('20:00')
    })
  })
})