'use client'

import { useState, useEffect } from 'react'
import { PlayerHistory } from '@/types/enhanced-database'
import { enhancedPlayerService } from '@/lib/services/enhanced-player-service'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatDateTime } from '@/lib/utils/date'

interface PlayerHistoryTimelineProps {
  playerId: string
  className?: string
}

export default function PlayerHistoryTimeline({ playerId, className = '' }: PlayerHistoryTimelineProps) {
  const [history, setHistory] = useState<PlayerHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadHistory()
  }, [playerId])

  const loadHistory = async () => {
    try {
      setLoading(true)
      setError('')
      const historyData = await enhancedPlayerService.getPlayerHistory(playerId)
      setHistory(historyData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'created':
        return (
          <div className="bg-green-100 rounded-full p-2">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        )
      case 'updated':
        return (
          <div className="bg-blue-100 rounded-full p-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
        )
      case 'activated':
        return (
          <div className="bg-green-100 rounded-full p-2">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      case 'deactivated':
        return (
          <div className="bg-red-100 rounded-full p-2">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      case 'jersey_changed':
        return (
          <div className="bg-yellow-100 rounded-full p-2">
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v16a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h4z" />
            </svg>
          </div>
        )
      case 'deleted':
        return (
          <div className="bg-red-100 rounded-full p-2">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="bg-gray-100 rounded-full p-2">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        )
    }
  }

  const getChangeTitle = (changeType: string) => {
    switch (changeType) {
      case 'created':
        return 'Player Created'
      case 'updated':
        return 'Player Updated'
      case 'activated':
        return 'Player Activated'
      case 'deactivated':
        return 'Player Deactivated'
      case 'jersey_changed':
        return 'Jersey Number Changed'
      case 'deleted':
        return 'Player Deleted'
      default:
        return changeType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  const renderChanges = (entry: PlayerHistory) => {
    if (!entry.old_values || !entry.new_values) {
      return <p className="text-sm text-gray-600">No details available</p>
    }

    const changes: string[] = []
    const oldValues = entry.old_values as Record<string, any>
    const newValues = entry.new_values as Record<string, any>

    // Compare key fields
    const fieldsToCheck = [
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'jersey_number', label: 'Jersey Number' },
      { key: 'position', label: 'Position' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'height_inches', label: 'Height' },
      { key: 'weight_lbs', label: 'Weight' },
      { key: 'shoots', label: 'Shoots' },
      { key: 'player_status', label: 'Status' },
      { key: 'active', label: 'Active' }
    ]

    fieldsToCheck.forEach(field => {
      if (oldValues[field.key] !== newValues[field.key]) {
        const oldVal = oldValues[field.key] ?? 'Not set'
        const newVal = newValues[field.key] ?? 'Not set'
        changes.push(`${field.label}: ${oldVal} → ${newVal}`)
      }
    })

    if (changes.length === 0) {
      return <p className="text-sm text-gray-600">Minor updates</p>
    }

    return (
      <ul className="text-sm text-gray-600 space-y-1">
        {changes.map((change, index) => (
          <li key={index} className="flex items-start">
            <span className="text-gray-400 mr-2">•</span>
            <span>{change}</span>
          </li>
        ))}
      </ul>
    )
  }

  if (loading) {
    return (
      <div className={`flex justify-center py-8 ${className}`}>
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-red-50 rounded-lg p-4 ${className}`}>
        <p className="text-sm text-red-700">{error}</p>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">No history available for this player.</p>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-6">Player History</h3>
      
      <div className="flow-root">
        <ul className="-mb-8">
          {history.map((entry, index) => (
            <li key={entry.id}>
              <div className="relative pb-8">
                {index !== history.length - 1 && (
                  <span
                    className="absolute top-10 left-6 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3">
                  <div className="flex-shrink-0">
                    {getChangeIcon(entry.change_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {getChangeTitle(entry.change_type)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(entry.created_at)}
                        {/* TODO: Add user info when foreign key is available */}
                      </p>
                    </div>
                    <div className="mt-2">
                      {renderChanges(entry)}
                      {entry.notes && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          Note: {entry.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Showing {history.length} history {history.length === 1 ? 'entry' : 'entries'}
        </p>
      </div>
    </div>
  )
}