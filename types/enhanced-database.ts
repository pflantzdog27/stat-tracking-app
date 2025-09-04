import { Database } from './database'

// Enhanced player type with additional fields
export interface EnhancedPlayer extends Database['public']['Tables']['players']['Row'] {
  email?: string | null
  phone?: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  address?: string | null
  height_inches?: number | null
  weight_lbs?: number | null
  shoots?: 'L' | 'R' | null
  notes?: string | null
  photo_url?: string | null
  previous_jersey_numbers?: number[] | null
  player_status?: 'active' | 'inactive' | 'injured' | 'suspended'
  parent_guardian_name?: string | null
  parent_guardian_email?: string | null
  parent_guardian_phone?: string | null
}

export interface PlayerWithDetails extends EnhancedPlayer {
  team_name?: string
  season?: string
  games_played?: number
  goals?: number
  assists?: number
  points?: number
  shots?: number
  penalty_minutes?: number
  saves?: number
  goals_against?: number
  save_percentage?: number
  age?: number
  status_changed_at?: string
}

export interface PlayerHistory {
  id: string
  player_id: string
  changed_by: string
  change_type: 'created' | 'updated' | 'activated' | 'deactivated' | 'jersey_changed' | 'deleted'
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  notes?: string
  created_at: string
}

export interface JerseyNumberHistory {
  id: string
  team_id: string
  jersey_number: number
  player_id?: string
  assigned_date: string
  released_date?: string
  season: string
  notes?: string
}

export interface AvailableJerseyNumber {
  jersey_number: number
  is_retired: boolean
  last_player_name?: string
  last_used_date?: string
}

export interface PlayerFormData {
  // Basic Information
  firstName: string
  lastName: string
  jerseyNumber: number
  position: 'F' | 'D' | 'G' | null
  birthDate?: string
  
  // Contact Information
  email?: string
  phone?: string
  address?: string
  
  // Physical Information
  heightInches?: number
  weightLbs?: number
  shoots?: 'L' | 'R' | null
  
  // Emergency Contact
  emergencyContactName?: string
  emergencyContactPhone?: string
  
  // Parent/Guardian (for minors)
  parentGuardianName?: string
  parentGuardianEmail?: string
  parentGuardianPhone?: string
  
  // Additional Information
  notes?: string
  photoUrl?: string
  playerStatus?: 'active' | 'inactive' | 'injured' | 'suspended'
}

export interface PlayerImportData {
  jerseyNumber: number
  firstName: string
  lastName: string
  position?: string
  birthDate?: string
  email?: string
  phone?: string
  parentGuardianName?: string
  parentGuardianEmail?: string
  heightInches?: number
  weightLbs?: number
  shoots?: string
}

export interface BulkPlayerOperation {
  action: 'activate' | 'deactivate' | 'delete' | 'update_status'
  playerIds: string[]
  newStatus?: 'active' | 'inactive' | 'injured' | 'suspended'
  notes?: string
}

export interface PlayerSearchFilters {
  searchTerm?: string
  position?: 'F' | 'D' | 'G' | 'all'
  status?: 'active' | 'inactive' | 'injured' | 'suspended' | 'all'
  ageRange?: { min?: number; max?: number }
  jerseyRange?: { min?: number; max?: number }
  shoots?: 'L' | 'R' | 'all'
  sortBy?: 'name' | 'jersey' | 'position' | 'age' | 'points' | 'goals'
  sortOrder?: 'asc' | 'desc'
}

export interface PlayerStatsSummary {
  playerId: string
  playerName: string
  jerseyNumber: number
  position: string
  gamesPlayed: number
  goals: number
  assists: number
  points: number
  shots: number
  penaltyMinutes: number
  saves?: number
  goalsAgainst?: number
  savePercentage?: number
  averagePoints?: number
  averageShots?: number
}