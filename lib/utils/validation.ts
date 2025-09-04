export interface ValidationError {
  field: string
  message: string
}

export interface GameValidation {
  opponent: string
  gameDate: string
  gameTime: string
  location: string
  gameType: string
}

export function validateGameForm(data: Partial<GameValidation>): ValidationError[] {
  const errors: ValidationError[] = []

  // Opponent validation
  if (!data.opponent?.trim()) {
    errors.push({ field: 'opponent', message: 'Opponent name is required' })
  } else if (data.opponent.trim().length < 2) {
    errors.push({ field: 'opponent', message: 'Opponent name must be at least 2 characters' })
  } else if (data.opponent.trim().length > 100) {
    errors.push({ field: 'opponent', message: 'Opponent name must be less than 100 characters' })
  }

  // Game date validation
  if (!data.gameDate) {
    errors.push({ field: 'gameDate', message: 'Game date is required' })
  } else {
    const gameDate = new Date(data.gameDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (isNaN(gameDate.getTime())) {
      errors.push({ field: 'gameDate', message: 'Invalid date format' })
    } else if (gameDate < today) {
      errors.push({ field: 'gameDate', message: 'Game date cannot be in the past' })
    }
  }

  // Game time validation
  if (!data.gameTime) {
    errors.push({ field: 'gameTime', message: 'Game time is required' })
  } else {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(data.gameTime)) {
      errors.push({ field: 'gameTime', message: 'Invalid time format (use HH:MM)' })
    }
  }

  // Location validation
  if (!data.location?.trim()) {
    errors.push({ field: 'location', message: 'Game location is required' })
  } else if (data.location.trim().length < 2) {
    errors.push({ field: 'location', message: 'Location must be at least 2 characters' })
  } else if (data.location.trim().length > 200) {
    errors.push({ field: 'location', message: 'Location must be less than 200 characters' })
  }

  // Game type validation
  const validGameTypes = ['regular', 'playoff', 'tournament', 'scrimmage']
  if (!data.gameType) {
    errors.push({ field: 'gameType', message: 'Game type is required' })
  } else if (!validGameTypes.includes(data.gameType)) {
    errors.push({ field: 'gameType', message: 'Invalid game type' })
  }

  return errors
}

export function validateRequired(value: any, fieldName: string): ValidationError | null {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return { field: fieldName, message: `${fieldName} is required` }
  }
  return null
}

export function validateEmail(email: string): ValidationError | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { field: 'email', message: 'Invalid email format' }
  }
  return null
}

export function validateMinLength(value: string, minLength: number, fieldName: string): ValidationError | null {
  if (value.length < minLength) {
    return { field: fieldName, message: `${fieldName} must be at least ${minLength} characters` }
  }
  return null
}

export function validateMaxLength(value: string, maxLength: number, fieldName: string): ValidationError | null {
  if (value.length > maxLength) {
    return { field: fieldName, message: `${fieldName} must be less than ${maxLength} characters` }
  }
  return null
}

export function getFieldError(errors: ValidationError[], fieldName: string): string | undefined {
  return errors.find(error => error.field === fieldName)?.message
}