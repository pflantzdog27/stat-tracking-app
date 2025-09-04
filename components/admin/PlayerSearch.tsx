'use client'

import { useState, useEffect } from 'react'
import { PlayerSearchFilters } from '@/types/enhanced-database'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

interface PlayerSearchProps {
  onFiltersChange: (filters: PlayerSearchFilters) => void
  initialFilters?: PlayerSearchFilters
  totalCount: number
  className?: string
}

export default function PlayerSearch({ 
  onFiltersChange, 
  initialFilters = {},
  totalCount,
  className = '' 
}: PlayerSearchProps) {
  const [filters, setFilters] = useState<PlayerSearchFilters>(initialFilters)
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    const hasAdvancedFilters = 
      filters.ageRange?.min || 
      filters.ageRange?.max || 
      filters.jerseyRange?.min || 
      filters.jerseyRange?.max || 
      filters.shoots !== 'all'
    
    setShowAdvanced(hasAdvancedFilters)
  }, [filters])

  const handleFilterChange = (key: keyof PlayerSearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleRangeChange = (
    rangeType: 'ageRange' | 'jerseyRange',
    boundType: 'min' | 'max',
    value: string
  ) => {
    const numValue = value ? parseInt(value) : undefined
    const currentRange = filters[rangeType] || {}
    const newRange = { ...currentRange, [boundType]: numValue }
    
    // Clean up empty ranges
    if (!newRange.min && !newRange.max) {
      const newFilters = { ...filters }
      delete newFilters[rangeType]
      setFilters(newFilters)
      onFiltersChange(newFilters)
    } else {
      handleFilterChange(rangeType, newRange)
    }
  }

  const clearFilters = () => {
    const clearedFilters: PlayerSearchFilters = {
      searchTerm: '',
      position: 'all',
      status: 'all',
      shoots: 'all',
      sortBy: 'jersey',
      sortOrder: 'asc'
    }
    setFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  const hasActiveFilters = 
    filters.searchTerm ||
    (filters.position && filters.position !== 'all') ||
    (filters.status && filters.status !== 'all') ||
    (filters.shoots && filters.shoots !== 'all') ||
    filters.ageRange?.min ||
    filters.ageRange?.max ||
    filters.jerseyRange?.min ||
    filters.jerseyRange?.max

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Search Players ({totalCount} found)
        </h3>
        <div className="flex space-x-2">
          {hasActiveFilters && (
            <Button size="sm" variant="ghost" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Hide Advanced' : 'Advanced'}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Basic Search */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <Input
              value={filters.searchTerm || ''}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              placeholder="Search by name or jersey number..."
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position
            </label>
            <Select
              value={filters.position || 'all'}
              onChange={(e) => handleFilterChange('position', e.target.value)}
              className="w-full"
            >
              <option value="all">All Positions</option>
              <option value="F">Forward</option>
              <option value="D">Defense</option>
              <option value="G">Goalie</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <Select
              value={filters.status || 'all'}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="injured">Injured</option>
              <option value="suspended">Suspended</option>
            </Select>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shoots
                </label>
                <Select
                  value={filters.shoots || 'all'}
                  onChange={(e) => handleFilterChange('shoots', e.target.value)}
                  className="w-full"
                >
                  <option value="all">Left & Right</option>
                  <option value="L">Left</option>
                  <option value="R">Right</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <Select
                  value={filters.sortBy || 'jersey'}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full"
                >
                  <option value="jersey">Jersey Number</option>
                  <option value="name">Name</option>
                  <option value="position">Position</option>
                  <option value="age">Age</option>
                  <option value="points">Points</option>
                  <option value="goals">Goals</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort Order
                </label>
                <Select
                  value={filters.sortOrder || 'asc'}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  className="w-full"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age Range
                </label>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    value={filters.ageRange?.min || ''}
                    onChange={(e) => handleRangeChange('ageRange', 'min', e.target.value)}
                    placeholder="Min age"
                    min="5"
                    max="25"
                    className="w-full"
                  />
                  <span className="text-gray-500 self-center">to</span>
                  <Input
                    type="number"
                    value={filters.ageRange?.max || ''}
                    onChange={(e) => handleRangeChange('ageRange', 'max', e.target.value)}
                    placeholder="Max age"
                    min="5"
                    max="25"
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jersey Number Range
                </label>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    value={filters.jerseyRange?.min || ''}
                    onChange={(e) => handleRangeChange('jerseyRange', 'min', e.target.value)}
                    placeholder="Min #"
                    min="1"
                    max="99"
                    className="w-full"
                  />
                  <span className="text-gray-500 self-center">to</span>
                  <Input
                    type="number"
                    value={filters.jerseyRange?.max || ''}
                    onChange={(e) => handleRangeChange('jerseyRange', 'max', e.target.value)}
                    placeholder="Max #"
                    min="1"
                    max="99"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm text-blue-800">
              <span className="font-medium">Active filters:</span>
              {filters.searchTerm && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100">
                  Search: "{filters.searchTerm}"
                </span>
              )}
              {filters.position && filters.position !== 'all' && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100">
                  Position: {filters.position}
                </span>
              )}
              {filters.status && filters.status !== 'all' && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100">
                  Status: {filters.status}
                </span>
              )}
              {filters.shoots && filters.shoots !== 'all' && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100">
                  Shoots: {filters.shoots}
                </span>
              )}
              {(filters.ageRange?.min || filters.ageRange?.max) && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100">
                  Age: {filters.ageRange.min || 0}-{filters.ageRange.max || '∞'}
                </span>
              )}
              {(filters.jerseyRange?.min || filters.jerseyRange?.max) && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100">
                  Jersey: #{filters.jerseyRange.min || 1}-{filters.jerseyRange.max || 99}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}