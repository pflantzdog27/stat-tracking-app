export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password_hash: string
          first_name: string
          last_name: string
          role: 'admin' | 'coach' | 'viewer'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          first_name: string
          last_name: string
          role?: 'admin' | 'coach' | 'viewer'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          first_name?: string
          last_name?: string
          role?: 'admin' | 'coach' | 'viewer'
          created_at?: string
          updated_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          season: string
          division: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          season: string
          division?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          season?: string
          division?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string
          role: 'admin' | 'coach' | 'viewer'
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          role?: 'admin' | 'coach' | 'viewer'
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          role?: 'admin' | 'coach' | 'viewer'
          created_at?: string
        }
      }
      players: {
        Row: {
          id: string
          team_id: string
          jersey_number: number
          first_name: string
          last_name: string
          position: 'F' | 'D' | 'G' | null
          birth_date: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          jersey_number: number
          first_name: string
          last_name: string
          position?: 'F' | 'D' | 'G' | null
          birth_date?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          jersey_number?: number
          first_name?: string
          last_name?: string
          position?: 'F' | 'D' | 'G' | null
          birth_date?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type UserRole = 'admin' | 'coach' | 'viewer'

export type User = Database['public']['Tables']['users']['Row']
export type Team = Database['public']['Tables']['teams']['Row']
export type Player = Database['public']['Tables']['players']['Row']
export type TeamMember = Database['public']['Tables']['team_members']['Row']