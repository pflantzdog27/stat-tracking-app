'use client'

import { useState, useEffect } from 'react'

interface StatsFiltersProps {
  isOpen: boolean
  onClose: () => void
  filters: StatsFilters
  onFiltersChange: (filters: Partial<StatsFilters>) => void
  teamId: string
  season: string
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

interface OpponentTeam {
  id: string
  name: string
  abbreviation: string
}

export default function StatsFilters({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  teamId,
  season
}: StatsFiltersProps) {
  const [localFilters, setLocalFilters] = useState<StatsFilters>(filters)
  const [opponents, setOpponents] = useState<OpponentTeam[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters)
      loadOpponents()
    }
  }, [isOpen, filters])

  const loadOpponents = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/teams/${teamId}/opponents?season=${season}`)
      if (response.ok) {
        const data = await response.json()
        setOpponents(data)
      }
    } catch (error) {
      console.error('Failed to load opponents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFilters = () => {
    onFiltersChange(localFilters)
    onClose()
  }

  const handleResetFilters = () => {
    const resetFilters = {
      dateRange: {},
      homeAway: 'all' as const,
      situationalStrength: 'all' as const,
      position: 'all' as const,
      minGamesPlayed: 5,
      opponents: []
    }
    setLocalFilters(resetFilters)
    onFiltersChange(resetFilters)
  }

  const handleOpponentToggle = (opponentId: string) => {
    setLocalFilters(prev => ({
      ...prev,
      opponents: prev.opponents?.includes(opponentId)
        ? prev.opponents.filter(id => id !== opponentId)
        : [...(prev.opponents || []), opponentId]
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Filter Statistics</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={localFilters.dateRange.start || ''}
                  onChange={(e) => setLocalFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, start: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">End Date</label>
                <input
                  type="date"
                  value={localFilters.dateRange.end || ''}
                  onChange={(e) => setLocalFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, end: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Home/Away */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Game Location
            </label>
            <select
              value={localFilters.homeAway}
              onChange={(e) => setLocalFilters(prev => ({
                ...prev,
                homeAway: e.target.value as 'all' | 'home' | 'away'
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Games</option>
              <option value="home">Home Games Only</option>
              <option value="away">Away Games Only</option>
            </select>
          </div>

          {/* Situational Strength */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Game Situation
            </label>
            <select
              value={localFilters.situationalStrength}
              onChange={(e) => setLocalFilters(prev => ({
                ...prev,
                situationalStrength: e.target.value as 'all' | 'even' | 'powerplay' | 'penalty_kill'
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Situations</option>
              <option value="even">Even Strength</option>
              <option value="powerplay">Power Play</option>
              <option value="penalty_kill">Penalty Kill</option>
            </select>
          </div>

          {/* Position */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Position
            </label>
            <select
              value={localFilters.position}
              onChange={(e) => setLocalFilters(prev => ({
                ...prev,
                position: e.target.value as 'all' | 'F' | 'D' | 'G'
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Positions</option>
              <option value="F">Forwards</option>
              <option value="D">Defensemen</option>
              <option value="G">Goalies</option>
            </select>
          </div>

          {/* Minimum Games Played */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Games Played: {localFilters.minGamesPlayed}
            </label>
            <input
              type="range"
              min="0"
              max="82"
              value={localFilters.minGamesPlayed}
              onChange={(e) => setLocalFilters(prev => ({
                ...prev,
                minGamesPlayed: parseInt(e.target.value)
              }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span>82</span>
            </div>
          </div>

          {/* Opponents */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opponents ({localFilters.opponents?.length || 0} selected)
            </label>
            {loading ? (
              <div className="text-sm text-gray-500">Loading opponents...</div>
            ) : (
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                <div className="space-y-2">
                  {opponents.map((opponent) => (
                    <label key={opponent.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={localFilters.opponents?.includes(opponent.id) || false}
                        onChange={() => handleOpponentToggle(opponent.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-900">
                        {opponent.abbreviation} - {opponent.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-6 mt-6 border-t border-gray-200">
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Reset All
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}