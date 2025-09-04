'use client'

import { useState } from 'react'
import { BulkPlayerOperation } from '@/types/enhanced-database'
import { enhancedPlayerService } from '@/lib/services/enhanced-player-service'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface BulkPlayerActionsProps {
  selectedPlayerIds: string[]
  selectedPlayerNames: string[]
  onActionComplete: () => void
  userId: string
  className?: string
}

export default function BulkPlayerActions({ 
  selectedPlayerIds, 
  selectedPlayerNames,
  onActionComplete,
  userId,
  className = '' 
}: BulkPlayerActionsProps) {
  const [showModal, setShowModal] = useState(false)
  const [action, setAction] = useState<BulkPlayerOperation['action']>('activate')
  const [newStatus, setNewStatus] = useState<'active' | 'inactive' | 'injured' | 'suspended'>('active')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ success: string[]; errors: { playerId: string; error: string }[] } | null>(null)

  const hasSelection = selectedPlayerIds.length > 0

  const handleExecute = async () => {
    if (!hasSelection) return

    setLoading(true)
    setResults(null)

    try {
      const operation: BulkPlayerOperation = {
        action,
        playerIds: selectedPlayerIds,
        newStatus: action === 'update_status' ? newStatus : undefined,
        notes: notes.trim() || undefined
      }

      const result = await enhancedPlayerService.bulkPlayerOperation(operation, userId)
      setResults(result)

      if (result.errors.length === 0) {
        setTimeout(() => {
          setShowModal(false)
          onActionComplete()
          resetForm()
        }, 2000)
      }
    } catch (error) {
      setResults({
        success: [],
        errors: [{ playerId: 'general', error: error instanceof Error ? error.message : 'Operation failed' }]
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setAction('activate')
    setNewStatus('active')
    setNotes('')
    setResults(null)
  }

  const handleClose = () => {
    setShowModal(false)
    resetForm()
  }

  const getActionDescription = () => {
    switch (action) {
      case 'activate':
        return 'Activate selected players (set status to active)'
      case 'deactivate':
        return 'Deactivate selected players (set status to inactive)'
      case 'update_status':
        return `Update selected players to ${newStatus} status`
      case 'delete':
        return 'Permanently delete selected players (only if no game stats exist)'
      default:
        return ''
    }
  }

  const getActionButtonText = () => {
    switch (action) {
      case 'activate':
        return 'Activate Players'
      case 'deactivate':
        return 'Deactivate Players'
      case 'update_status':
        return 'Update Status'
      case 'delete':
        return 'Delete Players'
      default:
        return 'Execute Action'
    }
  }

  return (
    <>
      <div className={`bg-white rounded-lg border p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">Bulk Actions</h3>
            <p className="text-sm text-gray-500 mt-1">
              {hasSelection 
                ? `${selectedPlayerIds.length} player${selectedPlayerIds.length !== 1 ? 's' : ''} selected`
                : 'Select players to perform bulk actions'
              }
            </p>
          </div>
          
          <Button
            onClick={() => setShowModal(true)}
            disabled={!hasSelection}
            size="sm"
          >
            Bulk Actions
          </Button>
        </div>

        {hasSelection && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedPlayerNames.slice(0, 3).map((name, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {name}
              </span>
            ))}
            {selectedPlayerNames.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                +{selectedPlayerNames.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bulk Action Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleClose}
        title="Bulk Player Actions"
        maxWidth="lg"
      >
        <div className="space-y-6">
          {/* Selected Players Summary */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">
              Selected Players ({selectedPlayerIds.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedPlayerNames.map((name, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>

          {/* Action Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action
            </label>
            <Select
              value={action}
              onChange={(e) => setAction(e.target.value as BulkPlayerOperation['action'])}
              className="w-full"
              disabled={loading}
            >
              <option value="activate">Activate Players</option>
              <option value="deactivate">Deactivate Players</option>
              <option value="update_status">Update Status</option>
              <option value="delete">Delete Players</option>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              {getActionDescription()}
            </p>
          </div>

          {/* Status Selection (for update_status action) */}
          {action === 'update_status' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Status
              </label>
              <Select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full"
                disabled={loading}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="injured">Injured</option>
                <option value="suspended">Suspended</option>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add a note about this bulk operation..."
              disabled={loading}
            />
          </div>

          {/* Warning for Delete Action */}
          {action === 'delete' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Warning</h3>
                  <p className="mt-1 text-sm text-red-700">
                    This action will permanently delete the selected players. Players with existing game statistics cannot be deleted and will be skipped.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-3">
              {results.success.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        Success ({results.success.length})
                      </h3>
                      <p className="mt-1 text-sm text-green-700">
                        {getActionButtonText()} completed successfully for {results.success.length} player{results.success.length !== 1 ? 's' : ''}.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {results.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Errors ({results.errors.length})
                      </h3>
                      <ul className="mt-2 text-sm text-red-700 space-y-1">
                        {results.errors.slice(0, 5).map((error, index) => (
                          <li key={index}>• {error.error}</li>
                        ))}
                        {results.errors.length > 5 && (
                          <li>• ... and {results.errors.length - 5} more errors</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {!results && (
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="ghost" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={handleExecute}
                loading={loading}
                disabled={loading}
                variant={action === 'delete' ? 'danger' : 'primary'}
              >
                {loading ? 'Processing...' : getActionButtonText()}
              </Button>
            </div>
          )}

          {/* Close button after results */}
          {results && results.errors.length === 0 && (
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleClose}>
                Close
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}