'use client'

import { useState, useEffect } from 'react'
import { PlayerFormData, AvailableJerseyNumber } from '@/types/enhanced-database'
import { enhancedPlayerService } from '@/lib/services/enhanced-player-service'
import { ValidationError, getFieldError } from '@/lib/utils/validation'
import FormField from '@/components/ui/FormField'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

interface EnhancedPlayerFormProps {
  teamId: string
  season: string
  initialData?: Partial<PlayerFormData>
  onSubmit: (data: PlayerFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
  submitLabel?: string
}

function validateEnhancedPlayerForm(data: Partial<PlayerFormData>): ValidationError[] {
  const errors: ValidationError[] = []

  // Basic validation
  if (!data.firstName?.trim()) {
    errors.push({ field: 'firstName', message: 'First name is required' })
  }

  if (!data.lastName?.trim()) {
    errors.push({ field: 'lastName', message: 'Last name is required' })
  }

  if (!data.jerseyNumber || data.jerseyNumber < 1 || data.jerseyNumber > 99) {
    errors.push({ field: 'jerseyNumber', message: 'Jersey number must be between 1 and 99' })
  }

  if (!data.position) {
    errors.push({ field: 'position', message: 'Position is required' })
  }

  // Email validation
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' })
  }

  // Phone validation (basic)
  if (data.phone && !/^[\d\s\-\(\)\+\.]+$/.test(data.phone)) {
    errors.push({ field: 'phone', message: 'Invalid phone number format' })
  }

  // Height validation
  if (data.heightInches && (data.heightInches < 48 || data.heightInches > 84)) {
    errors.push({ field: 'heightInches', message: 'Height must be between 48 and 84 inches' })
  }

  // Weight validation
  if (data.weightLbs && (data.weightLbs < 80 || data.weightLbs > 300)) {
    errors.push({ field: 'weightLbs', message: 'Weight must be between 80 and 300 lbs' })
  }

  // Birth date validation
  if (data.birthDate) {
    const birthDate = new Date(data.birthDate)
    const today = new Date()
    const maxAge = new Date()
    maxAge.setFullYear(maxAge.getFullYear() - 50)
    const minAge = new Date()
    minAge.setFullYear(minAge.getFullYear() - 5)

    if (birthDate > today) {
      errors.push({ field: 'birthDate', message: 'Birth date cannot be in the future' })
    } else if (birthDate < maxAge) {
      errors.push({ field: 'birthDate', message: 'Birth date seems too old' })
    } else if (birthDate > minAge) {
      errors.push({ field: 'birthDate', message: 'Player must be at least 5 years old' })
    }
  }

  return errors
}

export default function EnhancedPlayerForm({ 
  teamId,
  season,
  initialData = {}, 
  onSubmit, 
  onCancel, 
  loading = false, 
  submitLabel = 'Add Player' 
}: EnhancedPlayerFormProps) {
  const [formData, setFormData] = useState<PlayerFormData>({
    firstName: initialData.firstName || '',
    lastName: initialData.lastName || '',
    jerseyNumber: initialData.jerseyNumber || 1,
    position: initialData.position || 'F',
    birthDate: initialData.birthDate || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    address: initialData.address || '',
    heightInches: initialData.heightInches || undefined,
    weightLbs: initialData.weightLbs || undefined,
    shoots: initialData.shoots || null,
    emergencyContactName: initialData.emergencyContactName || '',
    emergencyContactPhone: initialData.emergencyContactPhone || '',
    parentGuardianName: initialData.parentGuardianName || '',
    parentGuardianEmail: initialData.parentGuardianEmail || '',
    parentGuardianPhone: initialData.parentGuardianPhone || '',
    notes: initialData.notes || '',
    playerStatus: initialData.playerStatus || 'active'
  })
  
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableNumbers, setAvailableNumbers] = useState<AvailableJerseyNumber[]>([])
  const [activeTab, setActiveTab] = useState<'basic' | 'contact' | 'physical' | 'additional'>('basic')

  useEffect(() => {
    loadAvailableNumbers()
  }, [teamId, season])

  const loadAvailableNumbers = async () => {
    try {
      const numbers = await enhancedPlayerService.getAvailableJerseyNumbers(teamId, season)
      setAvailableNumbers(numbers)
    } catch (error) {
      console.error('Error loading available jersey numbers:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    let processedValue: any = value
    if (name === 'jerseyNumber' || name === 'heightInches' || name === 'weightLbs') {
      processedValue = value ? parseInt(value) || undefined : undefined
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
    const validationErrors = validateEnhancedPlayerForm(formData)
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

  const renderHeightDisplay = () => {
    if (!formData.heightInches) return ''
    const feet = Math.floor(formData.heightInches / 12)
    const inches = formData.heightInches % 12
    return `${feet}'${inches}"`
  }

  const getAvailableJerseyOptions = () => {
    let options = availableNumbers.slice(0, 20) // Show first 20 available
    
    // Include current number if editing
    if (initialData.jerseyNumber && !availableNumbers.find(n => n.jersey_number === initialData.jerseyNumber)) {
      options.unshift({
        jersey_number: initialData.jerseyNumber,
        is_retired: false,
        last_player_name: 'Current'
      })
    }
    
    return options
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{formError}</div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'basic', label: 'Basic Info' },
          { key: 'contact', label: 'Contact' },
          { key: 'physical', label: 'Physical' },
          { key: 'additional', label: 'Additional' }
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.key 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Basic Information Tab */}
      {activeTab === 'basic' && (
        <div className="space-y-6">
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
                {getAvailableJerseyOptions().map(num => (
                  <option key={num.jersey_number} value={num.jersey_number}>
                    #{num.jersey_number}
                    {num.last_player_name && ` (last: ${num.last_player_name})`}
                  </option>
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
                value={formData.position || ''}
                onChange={handleChange}
                error={!!getFieldError(errors, 'position')}
                disabled={isSubmitting || loading}
              >
                <option value="">Select position</option>
                <option value="F">Forward</option>
                <option value="D">Defense</option>
                <option value="G">Goalie</option>
              </Select>
            </FormField>

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
            </FormField>

            <FormField
              label="Player Status"
              error={getFieldError(errors, 'playerStatus')}
            >
              <Select
                name="playerStatus"
                value={formData.playerStatus || 'active'}
                onChange={handleChange}
                error={!!getFieldError(errors, 'playerStatus')}
                disabled={isSubmitting || loading}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="injured">Injured</option>
                <option value="suspended">Suspended</option>
              </Select>
            </FormField>
          </div>
        </div>
      )}

      {/* Contact Information Tab */}
      {activeTab === 'contact' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Email"
              error={getFieldError(errors, 'email')}
            >
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={!!getFieldError(errors, 'email')}
                placeholder="player@example.com"
                disabled={isSubmitting || loading}
              />
            </FormField>

            <FormField
              label="Phone"
              error={getFieldError(errors, 'phone')}
            >
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                error={!!getFieldError(errors, 'phone')}
                placeholder="(555) 123-4567"
                disabled={isSubmitting || loading}
              />
            </FormField>
          </div>

          <FormField
            label="Address"
            error={getFieldError(errors, 'address')}
          >
            <Input
              name="address"
              value={formData.address}
              onChange={handleChange}
              error={!!getFieldError(errors, 'address')}
              placeholder="Home address"
              disabled={isSubmitting || loading}
            />
          </FormField>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Parent/Guardian Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                label="Parent/Guardian Name"
                error={getFieldError(errors, 'parentGuardianName')}
              >
                <Input
                  name="parentGuardianName"
                  value={formData.parentGuardianName}
                  onChange={handleChange}
                  error={!!getFieldError(errors, 'parentGuardianName')}
                  placeholder="Full name"
                  disabled={isSubmitting || loading}
                />
              </FormField>

              <FormField
                label="Parent Email"
                error={getFieldError(errors, 'parentGuardianEmail')}
              >
                <Input
                  type="email"
                  name="parentGuardianEmail"
                  value={formData.parentGuardianEmail}
                  onChange={handleChange}
                  error={!!getFieldError(errors, 'parentGuardianEmail')}
                  placeholder="parent@example.com"
                  disabled={isSubmitting || loading}
                />
              </FormField>

              <FormField
                label="Parent Phone"
                error={getFieldError(errors, 'parentGuardianPhone')}
              >
                <Input
                  type="tel"
                  name="parentGuardianPhone"
                  value={formData.parentGuardianPhone}
                  onChange={handleChange}
                  error={!!getFieldError(errors, 'parentGuardianPhone')}
                  placeholder="(555) 123-4567"
                  disabled={isSubmitting || loading}
                />
              </FormField>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Emergency Contact Name"
                error={getFieldError(errors, 'emergencyContactName')}
              >
                <Input
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  error={!!getFieldError(errors, 'emergencyContactName')}
                  placeholder="Full name"
                  disabled={isSubmitting || loading}
                />
              </FormField>

              <FormField
                label="Emergency Contact Phone"
                error={getFieldError(errors, 'emergencyContactPhone')}
              >
                <Input
                  type="tel"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                  error={!!getFieldError(errors, 'emergencyContactPhone')}
                  placeholder="(555) 123-4567"
                  disabled={isSubmitting || loading}
                />
              </FormField>
            </div>
          </div>
        </div>
      )}

      {/* Physical Information Tab */}
      {activeTab === 'physical' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              label="Height (inches)"
              error={getFieldError(errors, 'heightInches')}
            >
              <Input
                type="number"
                name="heightInches"
                value={formData.heightInches || ''}
                onChange={handleChange}
                error={!!getFieldError(errors, 'heightInches')}
                placeholder="72"
                min="48"
                max="84"
                disabled={isSubmitting || loading}
              />
              {formData.heightInches && (
                <p className="text-xs text-gray-500 mt-1">
                  {renderHeightDisplay()}
                </p>
              )}
            </FormField>

            <FormField
              label="Weight (lbs)"
              error={getFieldError(errors, 'weightLbs')}
            >
              <Input
                type="number"
                name="weightLbs"
                value={formData.weightLbs || ''}
                onChange={handleChange}
                error={!!getFieldError(errors, 'weightLbs')}
                placeholder="160"
                min="80"
                max="300"
                disabled={isSubmitting || loading}
              />
            </FormField>

            <FormField
              label="Shoots"
              error={getFieldError(errors, 'shoots')}
            >
              <Select
                name="shoots"
                value={formData.shoots || ''}
                onChange={handleChange}
                error={!!getFieldError(errors, 'shoots')}
                disabled={isSubmitting || loading}
              >
                <option value="">Select hand</option>
                <option value="L">Left</option>
                <option value="R">Right</option>
              </Select>
            </FormField>
          </div>
        </div>
      )}

      {/* Additional Information Tab */}
      {activeTab === 'additional' && (
        <div className="space-y-6">
          <FormField
            label="Notes"
            error={getFieldError(errors, 'notes')}
          >
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes about the player..."
              disabled={isSubmitting || loading}
            />
          </FormField>
        </div>
      )}

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