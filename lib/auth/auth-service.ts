import { createClient } from '@/lib/supabase/client'
import { UserRole } from '@/types/database'
import bcrypt from 'bcryptjs'

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
      // Check if user already exists
      const { data: existingUser } = await this.supabase
        .from('users')
        .select('email')
        .eq('email', data.email.toLowerCase())
        .single()

      if (existingUser) {
        throw new Error('User already exists with this email')
      }

      // Hash password
      const saltRounds = 12
      const hashedPassword = await bcrypt.hash(data.password, saltRounds)

      // Create user in custom users table
      const { data: user, error } = await this.supabase
        .from('users')
        .insert([
          {
            email: data.email.toLowerCase(),
            password_hash: hashedPassword,
            first_name: data.firstName,
            last_name: data.lastName,
            role: data.role || 'viewer'
          }
        ])
        .select()
        .single()

      if (error) throw error

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: data.email.toLowerCase(),
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            role: data.role || 'viewer',
            user_id: user.id
          }
        }
      })

      if (authError) {
        // Cleanup user record if auth fails
        await this.supabase.from('users').delete().eq('id', user.id)
        throw authError
      }

      return { user, authUser: authData.user }
    } catch (error) {
      console.error('Registration error:', error)
      throw error instanceof Error ? error : new Error('Registration failed')
    }
  }

  async login(data: LoginData) {
    try {
      // First verify user exists and get password hash
      const { data: user, error: userError } = await this.supabase
        .from('users')
        .select('*')
        .eq('email', data.email.toLowerCase())
        .single()

      if (userError || !user) {
        throw new Error('Invalid email or password')
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(data.password, user.password_hash)
      if (!passwordMatch) {
        throw new Error('Invalid email or password')
      }

      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email: data.email.toLowerCase(),
        password: data.password
      })

      if (authError) {
        throw authError
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
      // Update Supabase Auth password
      const { error: authError } = await this.supabase.auth.updateUser({
        password: newPassword
      })

      if (authError) throw authError

      // Update password hash in custom users table
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new Error('User not found')

      const saltRounds = 12
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

      const { error } = await this.supabase
        .from('users')
        .update({ password_hash: hashedPassword })
        .eq('email', user.email)

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

      const { data: user, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single()

      if (error) {
        console.error('Error fetching user:', error)
        return null
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
      return data
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