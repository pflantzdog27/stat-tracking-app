'use client'

import { useState } from 'react'
import { GameFormData } from '@/lib/services/game-service'
import { validateGameForm, ValidationError, getFieldError } from '@/lib/utils/validation'
import FormField from '@/components/ui/FormField'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

interface GameFormProps {
  initialData?: Partial<GameFormData>
  onSubmit: (data: GameFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
  submitLabel?: string
}

export default function GameForm({ 
  initialData = {}, 
  onSubmit, 
  onCancel, 
  loading = false, 
  submitLabel = 'Create Game' 
}: GameFormProps) {
  const [formData, setFormData] = useState<GameFormData>({
    opponent: initialData.opponent || '',
    gameDate: initialData.gameDate || '',
    gameTime: initialData.gameTime || '',
    location: initialData.location || '',
    gameType: initialData.gameType || 'regular'
  })
  
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear field error when user starts typing
    if (errors.length > 0) {
      setErrors(prev => prev.filter(error => error.field !== name))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting || loading) return

    // Validate form
    const validationErrors = validateGameForm(formData)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    setErrors([])

    try {
      await onSubmit(formData)
    } catch (error) {
      setErrors([{ field: 'form', message: error instanceof Error ? error.message : 'Failed to save game' }])
    } finally {
      setIsSubmitting(false)
    }
  }

  const formError = getFieldError(errors, 'form')

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{formError}</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Opponent"
          error={getFieldError(errors, 'opponent')}
          required
        >
          <Input
            name="opponent"
            value={formData.opponent}
            onChange={handleChange}
            error={!!getFieldError(errors, 'opponent')}
            placeholder="Enter opponent team name"
            disabled={isSubmitting || loading}
          />
        </FormField>

        <FormField
          label="Game Type"
          error={getFieldError(errors, 'gameType')}
          required
        >
          <Select
            name="gameType"
            value={formData.gameType}
            onChange={handleChange}
            error={!!getFieldError(errors, 'gameType')}
            disabled={isSubmitting || loading}
          >
            <option value="regular">Regular Season</option>
            <option value="playoff">Playoff</option>
            <option value="tournament">Tournament</option>
            <option value="scrimmage">Scrimmage</option>
          </Select>
        </FormField>

        <FormField
          label="Game Date"
          error={getFieldError(errors, 'gameDate')}
          required
        >
          <Input
            type="date"
            name="gameDate"
            value={formData.gameDate}
            onChange={handleChange}
            error={!!getFieldError(errors, 'gameDate')}
            min={new Date().toISOString().split('T')[0]}
            disabled={isSubmitting || loading}
          />
        </FormField>

        <FormField
          label="Game Time"
          error={getFieldError(errors, 'gameTime')}
          required
        >
          <Input
            type="time"
            name="gameTime"
            value={formData.gameTime}
            onChange={handleChange}
            error={!!getFieldError(errors, 'gameTime')}
            disabled={isSubmitting || loading}
          />
        </FormField>
      </div>

      <FormField
        label="Location"
        error={getFieldError(errors, 'location')}
        required
      >
        <Input
          name="location"
          value={formData.location}
          onChange={handleChange}
          error={!!getFieldError(errors, 'location')}
          placeholder="Enter game location/arena"
          disabled={isSubmitting || loading}
        />
      </FormField>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting || loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={isSubmitting || loading}
          disabled={isSubmitting || loading}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}