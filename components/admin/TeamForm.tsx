'use client'

import { useState } from 'react'
import { TeamFormData } from '@/lib/services/team-service'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface TeamFormProps {
  initialData?: TeamFormData
  onSubmit: (data: TeamFormData) => Promise<void>
  onCancel: () => void
  submitLabel: string
}

export default function TeamForm({ initialData, onSubmit, onCancel, submitLabel }: TeamFormProps) {
  const [formData, setFormData] = useState<TeamFormData>({
    name: initialData?.name || '',
    season: initialData?.season || '',
    division: initialData?.division || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.season.trim()) {
      setError('Team name and season are required')
      return
    }

    try {
      setLoading(true)
      setError('')
      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof TeamFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    if (error) setError('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Team Name *
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter team name"
          disabled={loading}
          required
        />
      </div>

      <div>
        <label htmlFor="season" className="block text-sm font-medium text-gray-700 mb-2">
          Season *
        </label>
        <input
          type="text"
          id="season"
          value={formData.season}
          onChange={(e) => handleChange('season', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., 2024-25"
          disabled={loading}
          required
        />
      </div>

      <div>
        <label htmlFor="division" className="block text-sm font-medium text-gray-700 mb-2">
          Division
        </label>
        <input
          type="text"
          id="division"
          value={formData.division}
          onChange={(e) => handleChange('division', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Atlantic, Pacific"
          disabled={loading}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !formData.name.trim() || !formData.season.trim()}
        >
          {loading ? (
            <>
              <LoadingSpinner size="small" />
              <span className="ml-2">Saving...</span>
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  )
}