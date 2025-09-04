'use client'

import { useState, useEffect } from 'react'
import TeamOverview from './TeamOverview'
import TeamLeaderboards from './TeamLeaderboards'
import TeamAnalytics from './TeamAnalytics'
import TeamComparisons from './TeamComparisons'
import StatsFilters from './StatsFilters'
import ExportActions from './ExportActions'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface TeamStatsPageProps {
  teamId: string
  teamName: string
  season: string
  className?: string
}

interface StatsFilters {
  dateRange: {
    start?: string
    end?: string
  }
  opponents?: string[]
  homeAway?: 'all' | 'home' | 'away'
  situationalStrength?: 'all' | 'even' | 'powerplay' | 'penalty_kill'
  position?: 'all' | 'F' | 'D' | 'G'
  minGamesPlayed?: number
}

type ActiveView = 'overview' | 'leaderboards' | 'analytics' | 'comparisons'

export default function TeamStatsPage({
  teamId,
  teamName,
  season,
  className = ''
}: TeamStatsPageProps) {
  const [activeView, setActiveView] = useState<ActiveView>('overview')
  const [teamStats, setTeamStats] = useState<any>(null)
  const [playersData, setPlayersData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<StatsFilters>({
    dateRange: {},
    homeAway: 'all',
    situationalStrength: 'all',
    position: 'all',
    minGamesPlayed: 5
  })
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    loadTeamData()
  }, [teamId, season, filters])

  const loadTeamData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load team statistics
      const teamResponse = await fetch(
        `/api/stats/team/${teamId}?season=${season}`
      )
      
      if (!teamResponse.ok) {
        throw new Error('Failed to load team statistics')
      }
      
      const teamStatsData = await teamResponse.json()
      setTeamStats(teamStatsData)

      // Load all team players with stats
      const playersResponse = await fetch(
        `/api/stats/team/${teamId}/players?season=${season}&minGames=${filters.minGamesPlayed || 0}&sortBy=points&sortOrder=desc`
      )
      
      if (playersResponse.ok) {
        const players = await playersResponse.json()
        setPlayersData(players)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team data')
    } finally {
      setLoading(false)
    }
  }

  const handleFiltersChange = (newFilters: Partial<StatsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const response = await fetch(`/api/stats/team/${teamId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          season,
          format,
          filters,
          view: activeView
        })
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${teamName}_${season}_stats.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed. Please try again.')
    }
  }

  const navigationItems = [
    { key: 'overview' as const, label: 'Team Overview', icon: '📊' },
    { key: 'leaderboards' as const, label: 'Leaderboards', icon: '🏆' },
    { key: 'analytics' as const, label: 'Analytics', icon: '📈' },
    { key: 'comparisons' as const, label: 'Comparisons', icon: '⚖️' }
  ]

  if (loading) {
    return (
      <div className={`min-h-screen bg-gray-50 ${className}`}>
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`min-h-screen bg-gray-50 ${className}`}>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-900 mb-2">Unable to Load Team Data</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={loadTeamData}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-4">
            <div className="flex items-center space-x-4 min-w-0 flex-1">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{teamName}</h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  <span className="hidden sm:inline">{season} Season Statistics • </span>
                  <span className="sm:hidden">{season} • </span>
                  {playersData.length} Players
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              <button
                onClick={() => setFiltersOpen(true)}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.121A1 1 0 013 6.414V4z" />
                </svg>
                <span className="hidden xs:inline sm:inline">Filters</span>
              </button>
              
              <ExportActions onExport={handleExport} />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide">
            {navigationItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveView(item.key)}
                className={`flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                  activeView === item.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-sm sm:text-base">{item.icon}</span>
                <span className="hidden xs:inline">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Active Filters Display */}
        {(filters.dateRange.start || filters.homeAway !== 'all' || filters.position !== 'all' || filters.situationalStrength !== 'all') && (
          <div className="mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <span className="text-sm font-medium text-blue-900 flex-shrink-0">Active Filters:</span>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {filters.dateRange.start && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {new Date(filters.dateRange.start).toLocaleDateString()} - {filters.dateRange.end ? new Date(filters.dateRange.end).toLocaleDateString() : 'Present'}
                    </span>
                  )}
                  {filters.homeAway !== 'all' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {filters.homeAway === 'home' ? 'Home Games' : 'Away Games'}
                    </span>
                  )}
                  {filters.position !== 'all' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Position: {filters.position}
                    </span>
                  )}
                  {filters.situationalStrength !== 'all' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {filters.situationalStrength === 'powerplay' ? 'Power Play' : 
                       filters.situationalStrength === 'penalty_kill' ? 'Penalty Kill' : 'Even Strength'}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setFilters({
                  dateRange: {},
                  homeAway: 'all',
                  situationalStrength: 'all',
                  position: 'all',
                  minGamesPlayed: 5
                })}
                className="text-sm text-blue-600 hover:text-blue-800 flex-shrink-0 self-start sm:self-center"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Content Views */}
        {activeView === 'overview' && (
          <TeamOverview 
            teamStats={teamStats}
            playersData={playersData}
            season={season}
            filters={filters}
          />
        )}

        {activeView === 'leaderboards' && (
          <TeamLeaderboards
            teamId={teamId}
            season={season}
            playersData={playersData}
            filters={filters}
          />
        )}

        {activeView === 'analytics' && (
          <TeamAnalytics
            teamId={teamId}
            teamStats={teamStats}
            playersData={playersData}
            season={season}
            filters={filters}
          />
        )}

        {activeView === 'comparisons' && (
          <TeamComparisons
            teamId={teamId}
            playersData={playersData}
            season={season}
            filters={filters}
          />
        )}
      </div>

      {/* Filters Modal */}
      <StatsFilters
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        teamId={teamId}
        season={season}
      />
    </div>
  )
}