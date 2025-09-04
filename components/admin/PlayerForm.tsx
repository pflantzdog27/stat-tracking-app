'use client'

import { useState, useEffect } from 'react'
import { PlayerFormData, playerService } from '@/lib/services/player-service'
import { ValidationError, getFieldError } from '@/lib/utils/validation'
import FormField from '@/components/ui/FormField'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

interface PlayerFormProps {
  teamId: string
  initialData?: Partial<PlayerFormData>
  onSubmit: (data: PlayerFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
  submitLabel?: string
}

function validatePlayerForm(data: Partial<PlayerFormData>): ValidationError[] {
  const errors: ValidationError[] = []

  if (!data.firstName?.trim()) {
    errors.push({ field: 'firstName', message: 'First name is required' })
  } else if (data.firstName.trim().length < 2) {
    errors.push({ field: 'firstName', message: 'First name must be at least 2 characters' })
  }

  if (!data.lastName?.trim()) {
    errors.push({ field: 'lastName', message: 'Last name is required' })
  } else if (data.lastName.trim().length < 2) {
    errors.push({ field: 'lastName', message: 'Last name must be at least 2 characters' })
  }

  if (!data.jerseyNumber || data.jerseyNumber < 1 || data.jerseyNumber > 99) {
    errors.push({ field: 'jerseyNumber', message: 'Jersey number must be between 1 and 99' })
  }

  if (!data.position) {
    errors.push({ field: 'position', message: 'Position is required' })
  }

  if (data.birthDate && new Date(data.birthDate) > new Date()) {
    errors.push({ field: 'birthDate', message: 'Birth date cannot be in the future' })
  }

  return errors
}

export default function PlayerForm({ 
  teamId,
  initialData = {}, 
  onSubmit, 
  onCancel, 
  loading = false, 
  submitLabel = 'Add Player' 
}: PlayerFormProps) {
  const [formData, setFormData] = useState<PlayerFormData>({
    firstName: initialData.firstName || '',
    lastName: initialData.lastName || '',
    jerseyNumber: initialData.jerseyNumber || 1,
    position: initialData.position || 'F',
    birthDate: initialData.birthDate || ''
  })
  
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableNumbers, setAvailableNumbers] = useState<number[]>([])

  useEffect(() => {
    loadAvailableNumbers()
  }, [teamId])

  const loadAvailableNumbers = async () => {
    try {
      const numbers = await playerService.getAvailableJerseyNumbers(teamId)
      setAvailableNumbers(numbers)
    } catch (error) {
      console.error('Error loading available jersey numbers:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    let processedValue: any = value
    if (name === 'jerseyNumber') {
      processedValue = parseInt(value) || 1
    }
    
    setFormData(prev => ({ ...prev, [name]: processedValue }))
    
    // Clear field error when user starts typing
    if (errors.length > 0) {
      setErrors(prev => prev.filter(error => error.field !== name))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting || loading) return

    // Validate form
    const validationErrors = validatePlayerForm(formData)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    setErrors([])

    try {
      await onSubmit(formData)
    } catch (error) {
      setErrors([{ field: 'form', message: error instanceof Error ? error.message : 'Failed to save player' }])
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
          label="First Name"
          error={getFieldError(errors, 'firstName')}
          required
        >
          <Input
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            error={!!getFieldError(errors, 'firstName')}
            placeholder="Enter first name"
            disabled={isSubmitting || loading}
          />
        </FormField>

        <FormField
          label="Last Name"
          error={getFieldError(errors, 'lastName')}
          required
        >
          <Input
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            error={!!getFieldError(errors, 'lastName')}
            placeholder="Enter last name"
            disabled={isSubmitting || loading}
          />
        </FormField>

        <FormField
          label="Jersey Number"
          error={getFieldError(errors, 'jerseyNumber')}
          required
        >
          <Select
            name="jerseyNumber"
            value={formData.jerseyNumber.toString()}
            onChange={handleChange}
            error={!!getFieldError(errors, 'jerseyNumber')}
            disabled={isSubmitting || loading}
          >
            {/* Include current number if editing */}
            {initialData.jerseyNumber && !availableNumbers.includes(initialData.jerseyNumber) && (
              <option value={initialData.jerseyNumber}>{initialData.jerseyNumber} (current)</option>
            )}
            {availableNumbers.map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            {availableNumbers.length} numbers available
          </p>
        </FormField>

        <FormField
          label="Position"
          error={getFieldError(errors, 'position')}
          required
        >
          <Select
            name="position"
            value={formData.position}
            onChange={handleChange}
            error={!!getFieldError(errors, 'position')}
            disabled={isSubmitting || loading}
          >
            <option value="F">Forward</option>
            <option value="D">Defense</option>
            <option value="G">Goalie</option>
          </Select>
        </FormField>
      </div>

      <FormField
        label="Birth Date"
        error={getFieldError(errors, 'birthDate')}
      >
        <Input
          type="date"
          name="birthDate"
          value={formData.birthDate}
          onChange={handleChange}
          error={!!getFieldError(errors, 'birthDate')}
          max={new Date().toISOString().split('T')[0]}
          disabled={isSubmitting || loading}
        />
        <p className="text-xs text-gray-500 mt-1">Optional - used for age calculations</p>
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