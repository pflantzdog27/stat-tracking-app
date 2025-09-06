import { createClient } from '@/lib/supabase/client'
import { UserRole } from '@/types/database'

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  role?: UserRole
}

export interface LoginData {
  email: string
  password: string
}

class AuthService {
  private supabase = createClient()

  async register(data: RegisterData) {
    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: data.email.toLowerCase(),
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            role: data.role || 'viewer'
          }
        }
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('User registration failed')
      }

      // Return user data (Supabase will handle user creation in auth.users)
      return { 
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          first_name: data.firstName,
          last_name: data.lastName,
          role: data.role || 'viewer'
        },
        authUser: authData.user 
      }
    } catch (error) {
      console.error('Registration error:', error)
      throw error instanceof Error ? error : new Error('Registration failed')
    }
  }

  async login(data: LoginData) {
    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email: data.email.toLowerCase(),
        password: data.password
      })

      if (authError) throw authError

      if (!authData.user || !authData.session) {
        throw new Error('Login failed')
      }

      // Return user data from auth.users
      const user = {
        id: authData.user.id,
        email: authData.user.email!,
        first_name: authData.user.user_metadata.first_name || '',
        last_name: authData.user.user_metadata.last_name || '',
        role: (authData.user.user_metadata.role as UserRole) || 'viewer'
      }

      return { user, authUser: authData.user, session: authData.session }
    } catch (error) {
      console.error('Login error:', error)
      throw error instanceof Error ? error : new Error('Login failed')
    }
  }

  async logout() {
    try {
      const { error } = await this.supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Logout error:', error)
      throw error instanceof Error ? error : new Error('Logout failed')
    }
  }

  async resetPassword(email: string) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })
      
      if (error) throw error
      return { message: 'Password reset email sent' }
    } catch (error) {
      console.error('Password reset error:', error)
      throw error instanceof Error ? error : new Error('Password reset failed')
    }
  }

  async updatePassword(newPassword: string) {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      return { message: 'Password updated successfully' }
    } catch (error) {
      console.error('Password update error:', error)
      throw error instanceof Error ? error : new Error('Password update failed')
    }
  }

  async getCurrentUser() {
    try {
      const { data: { user: authUser } } = await this.supabase.auth.getUser()
      if (!authUser) return null

      // Return user data from auth.users
      const user = {
        id: authUser.id,
        email: authUser.email!,
        first_name: authUser.user_metadata.first_name || '',
        last_name: authUser.user_metadata.last_name || '',
        role: (authUser.user_metadata.role as UserRole) || 'viewer'
      }

      return { user, authUser }
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  }

  async getUserTeams(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('team_members')
        .select(`
          role,
          teams (
            id,
            name,
            season,
            division
          )
        `)
        .eq('user_id', userId)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching user teams:', error)
      return []
    }
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.supabase.auth.onAuthStateChange(callback)
  }
}

export const authService = new AuthService()