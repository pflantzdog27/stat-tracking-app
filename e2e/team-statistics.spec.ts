import { test, expect } from '@playwright/test'

test.describe('Team Statistics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/teams/team-1/stats')
  })

  test('should display team overview correctly', async ({ page }) => {
    // Check team header
    await expect(page.locator('[data-testid="team-name"]')).toBeVisible()
    await expect(page.locator('[data-testid="team-logo"]')).toBeVisible()
    await expect(page.locator('[data-testid="team-record"]')).toBeVisible()
    
    // Check navigation tabs
    await expect(page.locator('[data-testid="overview-tab"]')).toBeVisible()
    await expect(page.locator('[data-testid="leaderboards-tab"]')).toBeVisible()
    await expect(page.locator('[data-testid="analytics-tab"]')).toBeVisible()
    await expect(page.locator('[data-testid="comparisons-tab"]')).toBeVisible()
  })

  test('should navigate between different stat views', async ({ page }) => {
    // Start on overview tab
    await expect(page.locator('[data-testid="overview-content"]')).toBeVisible()
    
    // Switch to leaderboards
    await page.locator('[data-testid="leaderboards-tab"]').click()
    await expect(page.locator('[data-testid="leaderboards-content"]')).toBeVisible()
    
    // Switch to analytics
    await page.locator('[data-testid="analytics-tab"]').click()
    await expect(page.locator('[data-testid="analytics-content"]')).toBeVisible()
    
    // Switch to comparisons
    await page.locator('[data-testid="comparisons-tab"]').click()
    await expect(page.locator('[data-testid="comparisons-content"]')).toBeVisible()
  })

  test('should display team leaderboards with filtering', async ({ page }) => {
    await page.locator('[data-testid="leaderboards-tab"]').click()
    
    // Check leaderboard categories
    const leaderboards = page.locator('[data-testid="leaderboard-category"]')
    await expect(leaderboards).toHaveCount.greaterThan(0)
    
    // Filter by position
    await page.locator('[data-testid="position-filter"]').selectOption('F')
    
    // Verify only forwards are shown
    const playerEntries = page.locator('[data-testid="leaderboard-player"]')
    const positions = await playerEntries.locator('[data-testid="player-position"]').allTextContents()
    positions.forEach(position => {
      expect(['C', 'LW', 'RW', 'F']).toContain(position)
    })
  })

  test('should show team analytics with charts', async ({ page }) => {
    await page.locator('[data-testid="analytics-tab"]').click()
    
    // Check analytics charts are rendered
    await expect(page.locator('[data-testid="performance-trends-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="stat-distribution-chart"]')).toBeVisible()
    
    // Test chart interaction
    const chartTypeSelector = page.locator('[data-testid="chart-type-selector"]')
    await chartTypeSelector.selectOption('goals')
    
    // Chart should update
    await page.waitForTimeout(500) // Allow chart to re-render
    await expect(page.locator('[data-testid="performance-trends-chart"]')).toBeVisible()
  })

  test('should handle team comparisons', async ({ page }) => {
    await page.locator('[data-testid="comparisons-tab"]').click()
    
    // Select players for comparison
    const playerSelector = page.locator('[data-testid="comparison-player-selector"]')
    await playerSelector.click()
    
    const playerOptions = page.locator('[data-testid="player-option"]')
    await playerOptions.first().click()
    await playerOptions.nth(1).click()
    
    // Should show comparison chart
    await expect(page.locator('[data-testid="comparison-chart"]')).toBeVisible()
    
    // Should show comparison stats table
    await expect(page.locator('[data-testid="comparison-table"]')).toBeVisible()
  })

  test('should apply and display filters', async ({ page }) => {
    // Open filters
    const filtersButton = page.locator('[data-testid="filters-button"]')
    await filtersButton.click()
    
    await expect(page.locator('[data-testid="filters-modal"]')).toBeVisible()
    
    // Apply date range filter
    await page.locator('[data-testid="start-date"]').fill('2024-01-01')
    await page.locator('[data-testid="end-date"]').fill('2024-01-31')
    
    // Apply home/away filter
    await page.locator('[data-testid="home-away-filter"]').selectOption('home')
    
    // Apply filters
    await page.locator('[data-testid="apply-filters"]').click()
    
    // Should show active filters
    await expect(page.locator('[data-testid="active-filters"]')).toBeVisible()
    await expect(page.locator('[data-testid="filter-home-games"]')).toBeVisible()
    await expect(page.locator('[data-testid="filter-date-range"]')).toBeVisible()
  })

  test('should export team statistics', async ({ page }) => {
    const exportButton = page.locator('[data-testid="export-button"]')
    await exportButton.click()
    
    // Should show export options
    await expect(page.locator('[data-testid="export-csv"]')).toBeVisible()
    await expect(page.locator('[data-testid="export-pdf"]')).toBeVisible()
    
    // Test CSV export
    const downloadPromise = page.waitForEvent('download')
    await page.locator('[data-testid="export-csv"]').click()
    
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/.*\.csv$/)
  })

  test('should handle responsive design', async ({ page }) => {
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 })
    
    // Navigation should be horizontal scrollable
    const nav = page.locator('[data-testid="team-navigation"]')
    await expect(nav).toHaveCSS('overflow-x', 'auto')
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Stats should be stacked vertically
    const statsGrid = page.locator('[data-testid="stats-grid"]')
    await expect(statsGrid).toBeVisible()
    
    // Charts should be responsive
    const charts = page.locator('[data-testid="chart-container"]')
    if (await charts.count() > 0) {
      await expect(charts.first()).toBeVisible()
    }
  })

  test('should show loading states during data fetch', async ({ page }) => {
    // Intercept API to add delay
    await page.route('**/api/teams/**/stats**', async (route) => {
      await page.waitForTimeout(1000)
      route.continue()
    })
    
    await page.reload()
    
    // Should show loading spinner
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()
    
    // Should show skeleton loaders for charts
    await expect(page.locator('[data-testid="chart-skeleton"]')).toHaveCount.greaterThan(0)
    
    // Loading should disappear when data loads
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible()
    await expect(page.locator('[data-testid="overview-content"]')).toBeVisible()
  })
})

test.describe('Team Comparison', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/teams/compare')
  })

  test('should allow comparing multiple teams', async ({ page }) => {
    // Select first team
    const team1Selector = page.locator('[data-testid="team-1-selector"]')
    await team1Selector.click()
    await page.locator('[data-testid="team-option-edm"]').click()
    
    // Select second team
    const team2Selector = page.locator('[data-testid="team-2-selector"]')
    await team2Selector.click()
    await page.locator('[data-testid="team-option-cgy"]').click()
    
    // Should show comparison
    await expect(page.locator('[data-testid="team-comparison-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="head-to-head-stats"]')).toBeVisible()
  })

  test('should display head-to-head statistics', async ({ page }) => {
    // After selecting teams (assume they're already selected)
    await page.goto('/teams/compare?team1=team-1&team2=team-2')
    
    // Check head-to-head section
    await expect(page.locator('[data-testid="head-to-head-record"]')).toBeVisible()
    await expect(page.locator('[data-testid="recent-matchups"]')).toBeVisible()
    
    // Check stat comparisons
    const statComparisons = page.locator('[data-testid="stat-comparison"]')
    await expect(statComparisons).toHaveCount.greaterThan(0)
    
    // Each comparison should show both teams' stats
    const firstComparison = statComparisons.first()
    await expect(firstComparison.locator('[data-testid="team-1-stat"]')).toBeVisible()
    await expect(firstComparison.locator('[data-testid="team-2-stat"]')).toBeVisible()
  })

  test('should support up to 4 team comparison', async ({ page }) => {
    // Add multiple teams
    const teams = ['team-1', 'team-2', 'team-3', 'team-4']
    
    for (let i = 0; i < teams.length; i++) {
      const selector = page.locator(`[data-testid="team-${i + 1}-selector"]`)
      await selector.click()
      await page.locator(`[data-testid="team-option-${teams[i]}"]`).click()
    }
    
    // Should show all teams in comparison
    for (let i = 1; i <= teams.length; i++) {
      await expect(page.locator(`[data-testid="team-${i}-stats"]`)).toBeVisible()
    }
    
    // Chart should accommodate all teams
    await expect(page.locator('[data-testid="multi-team-comparison-chart"]')).toBeVisible()
  })
})