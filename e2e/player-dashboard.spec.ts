import { test, expect } from '@playwright/test'

test.describe('Player Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/players')
  })

  test('should display player leaderboard correctly', async ({ page }) => {
    // Wait for the page to load
    await expect(page.locator('h1')).toContainText('Player Dashboard')
    
    // Check that player cards are displayed
    const playerCards = page.locator('[data-testid="player-card"]')
    await expect(playerCards).toHaveCount.greaterThan(0)
    
    // Verify first player card has required information
    const firstCard = playerCards.first()
    await expect(firstCard.locator('[data-testid="player-name"]')).toBeVisible()
    await expect(firstCard.locator('[data-testid="player-stats"]')).toBeVisible()
    await expect(firstCard.locator('[data-testid="player-position"]')).toBeVisible()
  })

  test('should filter players by position', async ({ page }) => {
    // Click on position filter
    await page.locator('[data-testid="position-filter"]').click()
    await page.locator('[data-testid="filter-forwards"]').click()
    
    // Wait for results to update
    await page.waitForResponse('**/api/players**')
    
    // Verify only forwards are displayed
    const playerCards = page.locator('[data-testid="player-card"]')
    await expect(playerCards).toHaveCount.greaterThan(0)
    
    // Check that all visible players are forwards
    const positions = await playerCards.locator('[data-testid="player-position"]').allTextContents()
    positions.forEach(position => {
      expect(['C', 'LW', 'RW', 'F']).toContain(position)
    })
  })

  test('should search for players by name', async ({ page }) => {
    const searchInput = page.locator('[data-testid="player-search"]')
    
    // Type in search query
    await searchInput.fill('McDavid')
    await searchInput.press('Enter')
    
    // Wait for search results
    await page.waitForResponse('**/api/players**')
    
    // Verify search results
    const playerCards = page.locator('[data-testid="player-card"]')
    await expect(playerCards).toHaveCount.greaterThan(0)
    
    const playerNames = await playerCards.locator('[data-testid="player-name"]').allTextContents()
    expect(playerNames.some(name => name.toLowerCase().includes('mcdavid'))).toBeTruthy()
  })

  test('should sort players by different statistics', async ({ page }) => {
    // Default sort should be by points
    const sortButton = page.locator('[data-testid="sort-by-points"]')
    await expect(sortButton).toHaveClass(/active/)
    
    // Change sort to goals
    await page.locator('[data-testid="sort-by-goals"]').click()
    await page.waitForResponse('**/api/players**')
    
    // Verify sort has changed
    await expect(page.locator('[data-testid="sort-by-goals"]')).toHaveClass(/active/)
    
    // Check that players are sorted by goals (descending)
    const goalCounts = await page.locator('[data-testid="player-goals"]').allTextContents()
    const goals = goalCounts.map(g => parseInt(g, 10))
    
    for (let i = 1; i < goals.length; i++) {
      expect(goals[i]).toBeLessThanOrEqual(goals[i - 1])
    }
  })

  test('should navigate to player detail page', async ({ page }) => {
    // Click on first player card
    const firstPlayerCard = page.locator('[data-testid="player-card"]').first()
    const playerName = await firstPlayerCard.locator('[data-testid="player-name"]').textContent()
    
    await firstPlayerCard.click()
    
    // Should navigate to player detail page
    await expect(page).toHaveURL(/\/players\/player-\d+/)
    
    // Verify player detail page loaded
    await expect(page.locator('h1')).toContainText(playerName || '')
  })

  test('should handle loading states', async ({ page }) => {
    // Intercept API call to add delay
    await page.route('**/api/players**', async (route) => {
      await page.waitForTimeout(1000) // Simulate slow API
      route.continue()
    })
    
    await page.reload()
    
    // Should show loading spinner
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()
    
    // Should hide loading spinner when data loads
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible()
    await expect(page.locator('[data-testid="player-card"]')).toHaveCount.greaterThan(0)
  })

  test('should handle error states', async ({ page }) => {
    // Intercept API call to return error
    await page.route('**/api/players**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      })
    })
    
    await page.reload()
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Unable to load')
    
    // Should have retry button
    const retryButton = page.locator('[data-testid="retry-button"]')
    await expect(retryButton).toBeVisible()
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check that mobile navigation is visible
    const mobileMenu = page.locator('[data-testid="mobile-menu"]')
    await expect(mobileMenu).toBeVisible()
    
    // Check that player cards stack properly on mobile
    const playerCards = page.locator('[data-testid="player-card"]')
    await expect(playerCards.first()).toBeVisible()
    
    // Verify horizontal scrolling works for stats tables
    const statsTable = page.locator('[data-testid="stats-table"]')
    if (await statsTable.isVisible()) {
      await expect(statsTable).toHaveCSS('overflow-x', 'auto')
    }
  })

  test('should export player data', async ({ page }) => {
    // Click export button
    const exportButton = page.locator('[data-testid="export-button"]')
    await exportButton.click()
    
    // Select CSV export
    const csvExport = page.locator('[data-testid="export-csv"]')
    await csvExport.click()
    
    // Wait for download
    const downloadPromise = page.waitForEvent('download')
    const download = await downloadPromise
    
    // Verify download
    expect(download.suggestedFilename()).toContain('.csv')
  })

  test('should maintain filters across page navigation', async ({ page }) => {
    // Apply filters
    await page.locator('[data-testid="position-filter"]').click()
    await page.locator('[data-testid="filter-forwards"]').click()
    await page.locator('[data-testid="team-filter"]').fill('EDM')
    
    // Navigate away and back
    await page.goto('/dashboard/teams')
    await page.goto('/dashboard/players')
    
    // Verify filters are maintained
    await expect(page.locator('[data-testid="filter-forwards"]')).toHaveClass(/active/)
    await expect(page.locator('[data-testid="team-filter"]')).toHaveValue('EDM')
  })
})

test.describe('Player Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/players/player-1')
  })

  test('should display complete player information', async ({ page }) => {
    // Check player header
    await expect(page.locator('[data-testid="player-name"]')).toBeVisible()
    await expect(page.locator('[data-testid="player-position"]')).toBeVisible()
    await expect(page.locator('[data-testid="player-team"]')).toBeVisible()
    await expect(page.locator('[data-testid="player-number"]')).toBeVisible()
    
    // Check stats sections
    await expect(page.locator('[data-testid="season-stats"]')).toBeVisible()
    await expect(page.locator('[data-testid="career-stats"]')).toBeVisible()
    await expect(page.locator('[data-testid="game-log"]')).toBeVisible()
  })

  test('should switch between different stat views', async ({ page }) => {
    // Switch to career stats
    await page.locator('[data-testid="career-stats-tab"]').click()
    await expect(page.locator('[data-testid="career-stats-content"]')).toBeVisible()
    
    // Switch to game log
    await page.locator('[data-testid="game-log-tab"]').click()
    await expect(page.locator('[data-testid="game-log-content"]')).toBeVisible()
    
    // Switch back to season stats
    await page.locator('[data-testid="season-stats-tab"]').click()
    await expect(page.locator('[data-testid="season-stats-content"]')).toBeVisible()
  })

  test('should display performance charts', async ({ page }) => {
    // Check that charts are rendered
    const chartContainer = page.locator('[data-testid="performance-chart"]')
    await expect(chartContainer).toBeVisible()
    
    // Verify chart controls
    await expect(page.locator('[data-testid="chart-type-selector"]')).toBeVisible()
    await expect(page.locator('[data-testid="chart-period-selector"]')).toBeVisible()
  })

  test('should show recent games', async ({ page }) => {
    const gameLog = page.locator('[data-testid="recent-games"]')
    await expect(gameLog).toBeVisible()
    
    // Check game entries
    const gameEntries = page.locator('[data-testid="game-entry"]')
    await expect(gameEntries).toHaveCount.greaterThan(0)
    
    // Verify game entry information
    const firstGame = gameEntries.first()
    await expect(firstGame.locator('[data-testid="game-date"]')).toBeVisible()
    await expect(firstGame.locator('[data-testid="game-opponent"]')).toBeVisible()
    await expect(firstGame.locator('[data-testid="game-stats"]')).toBeVisible()
  })

  test('should allow sharing player profile', async ({ page }) => {
    const shareButton = page.locator('[data-testid="share-button"]')
    await shareButton.click()
    
    // Check share menu
    await expect(page.locator('[data-testid="share-menu"]')).toBeVisible()
    
    // Test copy link functionality
    const copyLinkButton = page.locator('[data-testid="copy-link"]')
    await copyLinkButton.click()
    
    // Should show success message
    await expect(page.locator('[data-testid="copy-success"]')).toBeVisible()
  })
})