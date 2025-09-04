import { NextApiRequest, NextApiResponse } from 'next'
import { createMocks } from 'node-mocks-http'

// Mock data generators
export const mockPlayerData = (overrides: Partial<any> = {}) => ({
  id: 'player-1',
  name: 'Connor McDavid',
  position: 'C',
  jersey: 97,
  team: 'EDM',
  age: 26,
  height: '6\'1"',
  weight: 193,
  birthPlace: 'Richmond Hill, ON',
  stats: {
    games: 82,
    goals: 64,
    assists: 89,
    points: 153,
    shots: 300,
    hits: 15,
    blocks: 8,
    timeOnIce: '21:30',
    plusMinus: 27,
    pim: 36,
    faceoffWins: 520,
    faceoffAttempts: 1000,
    ...overrides.stats
  },
  ...overrides
})

export const mockTeamData = (overrides: Partial<any> = {}) => ({
  id: 'team-1',
  name: 'Edmonton Oilers',
  abbreviation: 'EDM',
  city: 'Edmonton',
  logo: '/logos/edm.png',
  primaryColor: '#FF4C00',
  secondaryColor: '#003768',
  stats: {
    games: 82,
    wins: 50,
    losses: 25,
    overtimeLosses: 7,
    points: 107,
    goalsFor: 314,
    goalsAgainst: 246,
    shots: 2650,
    shotsAgainst: 2420,
    powerPlayGoals: 75,
    powerPlayOpportunities: 280,
    penaltyKillGoals: 35,
    penaltyKillOpportunities: 220,
    faceoffWins: 2200,
    faceoffAttempts: 4500,
    hits: 1800,
    blockedShots: 1200,
    penaltyMinutes: 880,
    ...overrides.stats
  },
  ...overrides
})

export const mockGameData = (overrides: Partial<any> = {}) => ({
  id: 'game-1',
  date: '2024-01-15T20:00:00Z',
  status: 'finished',
  period: 3,
  timeRemaining: '00:00',
  venue: 'Rogers Place',
  attendance: 18347,
  gameType: 'regular',
  season: '2023-24',
  homeTeam: {
    id: 'team-1',
    name: 'Edmonton Oilers',
    abbreviation: 'EDM',
    logo: '/logos/edm.png',
    score: 4
  },
  awayTeam: {
    id: 'team-2',
    name: 'Calgary Flames',
    abbreviation: 'CGY',
    logo: '/logos/cgy.png',
    score: 2
  },
  finalScore: {
    home: 4,
    away: 2,
    overtime: false,
    shootout: false
  },
  ...overrides
})

export const mockLeagueStandingsData = () => [
  {
    teamId: 'team-1',
    team: 'Edmonton Oilers',
    abbreviation: 'EDM',
    gamesPlayed: 82,
    wins: 50,
    losses: 25,
    overtimeLosses: 7,
    points: 107,
    pointsPercentage: 65.2,
    goalsFor: 314,
    goalsAgainst: 246,
    goalDifferential: 68,
    streak: 'W3'
  },
  {
    teamId: 'team-2',
    team: 'Calgary Flames',
    abbreviation: 'CGY',
    gamesPlayed: 82,
    wins: 38,
    losses: 27,
    overtimeLosses: 17,
    points: 93,
    pointsPercentage: 56.7,
    goalsFor: 267,
    goalsAgainst: 263,
    goalDifferential: 4,
    streak: 'L2'
  }
]

export const mockPlayerStatsData = () => [
  mockPlayerData({
    id: 'player-1',
    name: 'Connor McDavid',
    stats: { goals: 64, assists: 89, points: 153 }
  }),
  mockPlayerData({
    id: 'player-2',
    name: 'Leon Draisaitl',
    stats: { goals: 52, assists: 56, points: 108 }
  }),
  mockPlayerData({
    id: 'player-3',
    name: 'Zach Hyman',
    stats: { goals: 36, assists: 47, points: 83 }
  })
]

export const mockGameEvents = () => [
  {
    id: 'event-1',
    period: 1,
    time: '5:23',
    type: 'goal',
    team: 'home',
    players: ['Connor McDavid', 'Leon Draisaitl'],
    description: 'Goal scored by Connor McDavid, assisted by Leon Draisaitl'
  },
  {
    id: 'event-2',
    period: 1,
    time: '12:45',
    type: 'penalty',
    team: 'away',
    players: ['Johnny Gaudreau'],
    description: 'Minor penalty to Johnny Gaudreau for slashing'
  },
  {
    id: 'event-3',
    period: 2,
    time: '3:15',
    type: 'goal',
    team: 'home',
    players: ['Leon Draisaitl'],
    description: 'Power play goal by Leon Draisaitl'
  }
]

// API testing utilities
export function createApiMocks(
  method: string = 'GET',
  body: any = {},
  query: any = {},
  headers: any = {}
) {
  const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
    method,
    body,
    query,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  })

  // Add mock functions to response
  const json = jest.fn()
  const status = jest.fn(() => ({ json, end: jest.fn(), send: jest.fn() }))
  const end = jest.fn()
  const send = jest.fn()

  res.json = json
  res.status = status
  res.end = end
  res.send = send

  return { req, res, json, status }
}

// Database mock utilities
export const mockDatabaseResponse = (data: any, error: any = null) => {
  if (error) {
    return Promise.reject(error)
  }
  return Promise.resolve(data)
}

// Component testing utilities
export const mockComponentProps = {
  player: mockPlayerData(),
  team: mockTeamData(),
  game: mockGameData(),
  standings: mockLeagueStandingsData(),
  playerStats: mockPlayerStatsData(),
  gameEvents: mockGameEvents()
}

// Chart.js mock data
export const mockChartData = {
  labels: ['Game 1', 'Game 2', 'Game 3', 'Game 4', 'Game 5'],
  datasets: [
    {
      label: 'Goals',
      data: [2, 1, 3, 0, 2],
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 2
    },
    {
      label: 'Assists',
      data: [1, 2, 1, 1, 3],
      backgroundColor: 'rgba(16, 185, 129, 0.5)',
      borderColor: 'rgb(16, 185, 129)',
      borderWidth: 2
    }
  ]
}

// Error simulation utilities
export const simulateApiError = (statusCode: number = 500, message: string = 'Internal Server Error') => {
  const error = new Error(message)
  ;(error as any).statusCode = statusCode
  return error
}

export const simulateNetworkError = () => {
  const error = new Error('Network request failed')
  ;(error as any).code = 'NETWORK_ERROR'
  return error
}

// Time and date utilities for testing
export const mockDate = (dateString: string) => {
  const originalDate = Date
  const mockDateInstance = new Date(dateString)
  
  global.Date = jest.fn(() => mockDateInstance) as any
  global.Date.UTC = originalDate.UTC
  global.Date.parse = originalDate.parse
  global.Date.now = jest.fn(() => mockDateInstance.getTime())
  
  return () => {
    global.Date = originalDate
  }
}

// Local storage mock utilities
export const mockLocalStorage = (initialData: Record<string, string> = {}) => {
  let store = { ...initialData }
  
  const mockStorage = {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: jest.fn((index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    })
  }
  
  return mockStorage
}

// Async testing utilities
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const waitForElement = async (getElement: () => HTMLElement | null, timeout: number = 1000) => {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeout) {
    const element = getElement()
    if (element) return element
    await waitFor(50)
  }
  
  throw new Error(`Element not found within ${timeout}ms`)
}

// Performance testing utilities
export const measurePerformance = async (fn: () => Promise<any> | any) => {
  const start = performance.now()
  await fn()
  const end = performance.now()
  return end - start
}

export const createPerformanceBenchmark = (name: string, iterations: number = 100) => {
  const times: number[] = []
  
  return {
    async run(fn: () => Promise<any> | any) {
      for (let i = 0; i < iterations; i++) {
        const time = await measurePerformance(fn)
        times.push(time)
      }
    },
    
    getResults() {
      const avg = times.reduce((sum, time) => sum + time, 0) / times.length
      const min = Math.min(...times)
      const max = Math.max(...times)
      
      return {
        name,
        iterations,
        average: avg,
        min,
        max,
        total: times.reduce((sum, time) => sum + time, 0)
      }
    }
  }
}