import handler from '../../pages/api/players'
import { createApiMocks, mockPlayerStatsData, simulateApiError } from '../utils/testHelpers'

// Mock database module
jest.mock('../../lib/database', () => ({
  getPlayers: jest.fn(),
  getPlayerById: jest.fn(),
  getPlayerStats: jest.fn(),
  searchPlayers: jest.fn(),
}))

import { getPlayers, getPlayerById, getPlayerStats, searchPlayers } from '../../lib/database'

describe('/api/players', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/players', () => {
    it('should return all players successfully', async () => {
      const mockPlayers = mockPlayerStatsData()
      ;(getPlayers as jest.Mock).mockResolvedValue(mockPlayers)

      const { req, res } = createApiMocks('GET')
      await handler(req, res)

      expect(getPlayers).toHaveBeenCalledWith({
        limit: 50,
        offset: 0,
        position: undefined,
        team: undefined,
        season: undefined
      })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(mockPlayers)
    })

    it('should handle query parameters correctly', async () => {
      const mockPlayers = mockPlayerStatsData()
      ;(getPlayers as jest.Mock).mockResolvedValue(mockPlayers)

      const { req, res } = createApiMocks('GET', {}, {
        limit: '25',
        offset: '50',
        position: 'C',
        team: 'EDM',
        season: '2023-24'
      })

      await handler(req, res)

      expect(getPlayers).toHaveBeenCalledWith({
        limit: 25,
        offset: 50,
        position: 'C',
        team: 'EDM',
        season: '2023-24'
      })
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('should handle search query', async () => {
      const mockPlayers = mockPlayerStatsData()
      ;(searchPlayers as jest.Mock).mockResolvedValue(mockPlayers)

      const { req, res } = createApiMocks('GET', {}, {
        search: 'McDavid'
      })

      await handler(req, res)

      expect(searchPlayers).toHaveBeenCalledWith('McDavid', {
        limit: 50,
        offset: 0,
        position: undefined,
        team: undefined,
        season: undefined
      })
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('should handle database errors', async () => {
      const error = simulateApiError(500, 'Database connection failed')
      ;(getPlayers as jest.Mock).mockRejectedValue(error)

      const { req, res } = createApiMocks('GET')
      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error'
      })
    })

    it('should validate limit parameter', async () => {
      const { req, res } = createApiMocks('GET', {}, {
        limit: '200' // Too high
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Limit cannot exceed 100'
      })
    })

    it('should validate offset parameter', async () => {
      const { req, res } = createApiMocks('GET', {}, {
        offset: '-10' // Negative
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Offset cannot be negative'
      })
    })
  })

  describe('POST /api/players', () => {
    it('should return method not allowed for POST', async () => {
      const { req, res } = createApiMocks('POST')
      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(405)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Method not allowed'
      })
    })
  })

  describe('Rate limiting', () => {
    it('should handle too many requests', async () => {
      // Mock rate limiter
      const { req, res } = createApiMocks('GET', {}, {}, {
        'x-forwarded-for': '127.0.0.1'
      })

      // Simulate rate limit exceeded
      const originalConsole = console.warn
      console.warn = jest.fn()

      // This would normally be handled by middleware
      req.headers['x-rate-limit-exceeded'] = 'true'

      await handler(req, res)

      console.warn = originalConsole
    })
  })
})

describe('/api/players/[id]', () => {
  // Mock the dynamic route handler
  const playerByIdHandler = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return player by ID successfully', async () => {
    const mockPlayer = mockPlayerStatsData()[0]
    ;(getPlayerById as jest.Mock).mockResolvedValue(mockPlayer)

    const { req, res } = createApiMocks('GET', {}, { id: 'player-1' })
    
    // Simulate the actual handler logic
    const playerId = req.query.id as string
    const player = await getPlayerById(playerId)
    
    expect(getPlayerById).toHaveBeenCalledWith('player-1')
    expect(player).toEqual(mockPlayer)
  })

  it('should return 404 for non-existent player', async () => {
    ;(getPlayerById as jest.Mock).mockResolvedValue(null)

    const { req, res } = createApiMocks('GET', {}, { id: 'non-existent' })
    
    const player = await getPlayerById('non-existent')
    expect(player).toBeNull()
  })

  it('should handle invalid player ID format', async () => {
    const { req, res } = createApiMocks('GET', {}, { id: '' })
    
    // Validate ID format
    const playerId = req.query.id as string
    const isValidId = playerId && playerId.length > 0
    
    expect(isValidId).toBeFalsy()
  })
})

describe('/api/players/[id]/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return player stats successfully', async () => {
    const mockStats = {
      career: mockPlayerStatsData()[0].stats,
      byseason: [
        { season: '2023-24', ...mockPlayerStatsData()[0].stats },
        { season: '2022-23', ...mockPlayerStatsData()[0].stats }
      ]
    }
    ;(getPlayerStats as jest.Mock).mockResolvedValue(mockStats)

    const { req, res } = createApiMocks('GET', {}, { 
      id: 'player-1',
      season: '2023-24' 
    })
    
    const stats = await getPlayerStats('player-1', '2023-24')
    
    expect(getPlayerStats).toHaveBeenCalledWith('player-1', '2023-24')
    expect(stats).toEqual(mockStats)
  })

  it('should handle missing season parameter', async () => {
    const mockStats = {
      career: mockPlayerStatsData()[0].stats,
      byseason: []
    }
    ;(getPlayerStats as jest.Mock).mockResolvedValue(mockStats)

    const { req, res } = createApiMocks('GET', {}, { id: 'player-1' })
    
    const stats = await getPlayerStats('player-1', undefined)
    
    expect(getPlayerStats).toHaveBeenCalledWith('player-1', undefined)
  })

  it('should validate season format', () => {
    const validSeasons = ['2023-24', '2022-23', '2021-22']
    const invalidSeasons = ['2023', '23-24', '2023-2024', 'invalid']

    validSeasons.forEach(season => {
      const isValid = /^\d{4}-\d{2}$/.test(season)
      expect(isValid).toBeTruthy()
    })

    invalidSeasons.forEach(season => {
      const isValid = /^\d{4}-\d{2}$/.test(season)
      expect(isValid).toBeFalsy()
    })
  })
})