import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup...')
  
  // Launch browser for setup
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // Wait for the development server to be ready
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000'
    console.log(`⏳ Waiting for server at ${baseURL}...`)
    
    let retries = 30
    while (retries > 0) {
      try {
        const response = await page.goto(baseURL, { timeout: 5000 })
        if (response && response.ok()) {
          console.log('✅ Server is ready')
          break
        }
      } catch (error) {
        retries--
        if (retries === 0) {
          throw new Error(`Server at ${baseURL} did not become ready`)
        }
        console.log(`⏳ Server not ready, retrying... (${retries} attempts left)`)
        await page.waitForTimeout(2000)
      }
    }
    
    // Set up test data if needed
    console.log('📊 Setting up test data...')
    
    // Mock API responses for consistent testing
    await page.route('**/api/players**', async (route) => {
      const mockPlayers = [
        {
          id: 'player-1',
          name: 'Connor McDavid',
          position: 'C',
          team: 'EDM',
          stats: { goals: 64, assists: 89, points: 153 }
        },
        {
          id: 'player-2',
          name: 'Leon Draisaitl',
          position: 'C',
          team: 'EDM',
          stats: { goals: 52, assists: 56, points: 108 }
        }
      ]
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockPlayers)
      })
    })
    
    await page.route('**/api/teams**', async (route) => {
      const mockTeams = [
        {
          id: 'team-1',
          name: 'Edmonton Oilers',
          abbreviation: 'EDM',
          logo: '/logos/edm.png',
          stats: { wins: 50, losses: 25, points: 107 }
        }
      ]
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockTeams)
      })
    })
    
    await page.route('**/api/games**', async (route) => {
      const mockGames = [
        {
          id: 'game-1',
          date: '2024-01-15T20:00:00Z',
          status: 'finished',
          homeTeam: { name: 'Edmonton Oilers', abbreviation: 'EDM', score: 4 },
          awayTeam: { name: 'Calgary Flames', abbreviation: 'CGY', score: 2 }
        }
      ]
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockGames)
      })
    })
    
    console.log('✅ Global setup completed')
    
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

export default globalSetup