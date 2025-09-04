import { test, expect } from '@playwright/test'

test.describe('Game Summary Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/games/game-1')
  })

  test('should display complete game information', async ({ page }) => {
    // Check game header
    await expect(page.locator('[data-testid="away-team-logo"]')).toBeVisible()
    await expect(page.locator('[data-testid="home-team-logo"]')).toBeVisible()
    await expect(page.locator('[data-testid="game-score"]')).toBeVisible()
    await expect(page.locator('[data-testid="game-status"]')).toBeVisible()
    
    // Check game info
    await expect(page.locator('[data-testid="game-venue"]')).toBeVisible()
    await expect(page.locator('[data-testid="game-date"]')).toBeVisible()
    
    // Check navigation tabs
    await expect(page.locator('[data-testid="summary-tab"]')).toBeVisible()
    await expect(page.locator('[data-testid="boxscore-tab"]')).toBeVisible()
    await expect(page.locator('[data-testid="players-tab"]')).toBeVisible()
    await expect(page.locator('[data-testid="timeline-tab"]')).toBeVisible()
    await expect(page.locator('[data-testid="highlights-tab"]')).toBeVisible()
  })

  test('should navigate between different game views', async ({ page }) => {
    // Start on summary tab
    await expect(page.locator('[data-testid="summary-content"]')).toBeVisible()
    
    // Switch to box score
    await page.locator('[data-testid="boxscore-tab"]').click()
    await expect(page.locator('[data-testid="boxscore-content"]')).toBeVisible()
    await expect(page.locator('[data-testid="team-stats-table"]')).toBeVisible()
    
    // Switch to players
    await page.locator('[data-testid="players-tab"]').click()
    await expect(page.locator('[data-testid="players-content"]')).toBeVisible()
    await expect(page.locator('[data-testid="player-stats-table"]')).toBeVisible()
    
    // Switch to timeline
    await page.locator('[data-testid="timeline-tab"]').click()
    await expect(page.locator('[data-testid="timeline-content"]')).toBeVisible()
    await expect(page.locator('[data-testid="game-events"]')).toBeVisible()
    
    // Switch to highlights
    await page.locator('[data-testid="highlights-tab"]').click()
    await expect(page.locator('[data-testid="highlights-content"]')).toBeVisible()
  })

  test('should display box score with team statistics', async ({ page }) => {
    await page.locator('[data-testid="boxscore-tab"]').click()
    
    // Check team comparison table
    const statsTable = page.locator('[data-testid="team-stats-table"]')
    await expect(statsTable).toBeVisible()
    
    // Verify required stats are displayed
    await expect(statsTable.locator('text=Shots')).toBeVisible()
    await expect(statsTable.locator('text=Hits')).toBeVisible()
    await expect(statsTable.locator('text=Power Play')).toBeVisible()
    await expect(statsTable.locator('text=Faceoff %')).toBeVisible()
    
    // Check that stats show color coding for better/worse performance
    const statValues = page.locator('[data-testid="stat-value"]')
    const coloredStats = await statValues.evaluateAll(elements => 
      elements.filter(el => 
        el.classList.contains('text-green-600') || 
        el.classList.contains('text-red-600')
      ).length
    )
    expect(coloredStats).toBeGreaterThan(0)
  })

  test('should display player statistics with filtering', async ({ page }) => {
    await page.locator('[data-testid="players-tab"]').click()
    
    // Check team toggle
    const awayTeamButton = page.locator('[data-testid="away-team-button"]')
    const homeTeamButton = page.locator('[data-testid="home-team-button"]')
    
    await expect(awayTeamButton).toBeVisible()
    await expect(homeTeamButton).toBeVisible()
    
    // Check position filter
    const skatersButton = page.locator('[data-testid="skaters-button"]')
    const goaliesButton = page.locator('[data-testid="goalies-button"]')
    
    await expect(skatersButton).toBeVisible()
    await expect(goaliesButton).toBeVisible()
    
    // Test switching to goalies
    await goaliesButton.click()
    
    // Should show goalie-specific stats
    await expect(page.locator('text=Saves')).toBeVisible()
    await expect(page.locator('text=SV%')).toBeVisible()
    await expect(page.locator('text=GA')).toBeVisible()
  })

  test('should show game timeline with events', async ({ page }) => {
    await page.locator('[data-testid="timeline-tab"]').click()
    
    // Check timeline filters
    await expect(page.locator('[data-testid="period-filter"]')).toBeVisible()
    await expect(page.locator('[data-testid="event-filter"]')).toBeVisible()
    
    // Check event entries
    const events = page.locator('[data-testid="timeline-event"]')
    await expect(events).toHaveCount.greaterThan(0)
    
    // Verify event details
    const firstEvent = events.first()
    await expect(firstEvent.locator('[data-testid="event-time"]')).toBeVisible()
    await expect(firstEvent.locator('[data-testid="event-description"]')).toBeVisible()
    await expect(firstEvent.locator('[data-testid="event-icon"]')).toBeVisible()
    
    // Test filtering by event type
    await page.locator('[data-testid="goals-filter"]').click()
    
    // Should show only goal events
    const goalEvents = page.locator('[data-testid="timeline-event"]')
    const eventTypes = await goalEvents.locator('[data-testid="event-type"]').allTextContents()
    eventTypes.forEach(type => expect(type.toLowerCase()).toContain('goal'))
  })

  test('should display game highlights with video support', async ({ page }) => {
    await page.locator('[data-testid="highlights-tab"]').click()
    
    // Check highlights grid
    const highlights = page.locator('[data-testid="highlight-card"]')
    await expect(highlights).toHaveCount.greaterThan(0)
    
    // Check highlight card content
    const firstHighlight = highlights.first()
    await expect(firstHighlight.locator('[data-testid="highlight-thumbnail"]')).toBeVisible()
    await expect(firstHighlight.locator('[data-testid="highlight-title"]')).toBeVisible()
    await expect(firstHighlight.locator('[data-testid="highlight-timestamp"]')).toBeVisible()
    
    // Test video modal
    await firstHighlight.click()
    await expect(page.locator('[data-testid="video-modal"]')).toBeVisible()
    
    // Close modal
    await page.locator('[data-testid="close-modal"]').click()
    await expect(page.locator('[data-testid="video-modal"]')).not.toBeVisible()
    
    // Test highlight filtering
    const goalFilter = page.locator('[data-testid="goals-highlights-filter"]')
    if (await goalFilter.isVisible()) {
      await goalFilter.click()
      // Should show only goal highlights
    }
  })

  test('should support social media sharing', async ({ page }) => {
    const shareButton = page.locator('[data-testid="share-button"]')
    await shareButton.click()
    
    // Check share menu
    await expect(page.locator('[data-testid="share-menu"]')).toBeVisible()
    
    // Check share options
    await expect(page.locator('[data-testid="share-twitter"]')).toBeVisible()
    await expect(page.locator('[data-testid="share-facebook"]')).toBeVisible()
    await expect(page.locator('[data-testid="copy-link"]')).toBeVisible()
    
    // Test copy link
    await page.locator('[data-testid="copy-link"]').click()
    await expect(page.locator('[data-testid="copy-success"]')).toBeVisible()
    
    // Test native sharing if supported
    const nativeShare = page.locator('[data-testid="native-share"]')
    if (await nativeShare.isVisible()) {
      // Note: Can't actually test Web Share API in Playwright
      await expect(nativeShare).toBeVisible()
    }
  })

  test('should be responsive on different screen sizes', async ({ page }) => {
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 })
    
    // Game header should adapt
    await expect(page.locator('[data-testid="game-header"]')).toBeVisible()
    
    // Navigation should be horizontal scrollable
    const nav = page.locator('[data-testid="game-navigation"]')
    await expect(nav).toHaveCSS('overflow-x', 'auto')
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Score should be readable on mobile
    await expect(page.locator('[data-testid="game-score"]')).toBeVisible()
    
    // Tables should scroll horizontally on mobile
    await page.locator('[data-testid="players-tab"]').click()
    const playerTable = page.locator('[data-testid="player-stats-table"]')
    if (await playerTable.isVisible()) {
      await expect(playerTable.locator('..')).toHaveCSS('overflow-x', 'auto')
    }
  })

  test('should handle live game updates', async ({ page }) => {
    // Mock live game
    await page.route('**/api/games/game-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'game-1',
          status: 'live',
          period: 2,
          timeRemaining: '12:34',
          homeTeam: { score: 2 },
          awayTeam: { score: 1 }
        })
      })
    })
    
    await page.reload()
    
    // Should show live indicator
    await expect(page.locator('[data-testid="live-indicator"]')).toBeVisible()
    await expect(page.locator('[data-testid="game-status"]')).toContainText('P2 12:34')
    
    // Should show current scores
    await expect(page.locator('[data-testid="game-score"]')).toContainText('2 - 1')
  })

  test('should handle scheduled games', async ({ page }) => {
    // Navigate to scheduled game
    await page.goto('/games/scheduled-game')
    
    // Mock scheduled game response
    await page.route('**/api/games/scheduled-game', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'scheduled-game',
          status: 'scheduled',
          date: '2024-02-15T20:00:00Z',
          homeTeam: { name: 'Edmonton Oilers', score: 0 },
          awayTeam: { name: 'Calgary Flames', score: 0 }
        })
      })
    })
    
    await page.reload()
    
    // Should show game time instead of score
    await expect(page.locator('[data-testid="game-time"]')).toBeVisible()
    await expect(page.locator('[data-testid="game-time"]')).not.toContainText('0 - 0')
    
    // Should show message about stats not being available
    await expect(page.locator('[data-testid="no-stats-message"]')).toBeVisible()
  })

  test('should handle error states gracefully', async ({ page }) => {
    // Mock 404 error
    await page.route('**/api/games/non-existent', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Game not found' })
      })
    })
    
    await page.goto('/games/non-existent')
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Unable to Load Game')
    
    // Should have retry button
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
  })

  test('should load performance be acceptable', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/games/game-1')
    
    // Wait for main content to load
    await expect(page.locator('[data-testid="summary-content"]')).toBeVisible()
    
    const loadTime = Date.now() - startTime
    
    // Should load within reasonable time (adjust threshold as needed)
    expect(loadTime).toBeLessThan(3000)
  })
})