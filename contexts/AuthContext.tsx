'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { User, UserRole } from '@/types/database'
import { authService } from '@/lib/auth/auth-service'

interface AuthContextType {
  user: User | null
  authUser: SupabaseUser | null
  session: Session | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    email: string
    password: string
    firstName: string
    lastName: string
    role?: UserRole
  }) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  userTeams: any[]
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [userTeams, setUserTeams] = useState<any[]>([])

  const refreshUser = async () => {
    try {
      const userData = await authService.getCurrentUser()
      if (userData) {
        setUser(userData.user)
        setAuthUser(userData.authUser)
        
        // Fetch user teams
        const teams = await authService.getUserTeams(userData.user.id)
        setUserTeams(teams)
      } else {
        setUser(null)
        setAuthUser(null)
        setUserTeams([])
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
      setUser(null)
      setAuthUser(null)
      setUserTeams([])
    }
  }

  useEffect(() => {
    // Initial user load
    refreshUser().finally(() => setLoading(false))

    // Listen for auth state changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await refreshUser()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setAuthUser(null)
          setUserTeams([])
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { user: userData, authUser: authData, session: sessionData } = await authService.login({ email, password })
      setUser(userData)
      setAuthUser(authData)
      setSession(sessionData)
      
      // Fetch user teams
      const teams = await authService.getUserTeams(userData.id)
      setUserTeams(teams)
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (data: {
    email: string
    password: string
    firstName: string
    lastName: string
    role?: UserRole
  }) => {
    setLoading(true)
    try {
      const { user: userData, authUser: authData } = await authService.register(data)
      setUser(userData)
      setAuthUser(authData)
      
      // New users won't have teams initially
      setUserTeams([])
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await authService.logout()
      setUser(null)
      setAuthUser(null)
      setSession(null)
      setUserTeams([])
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email)
  }

  const updatePassword = async (newPassword: string) => {
    await authService.updatePassword(newPassword)
  }

  const value: AuthContextType = {
    user,
    authUser,
    session,
    loading,
    login,
    register,
    logout,
    resetPassword,
    updatePassword,
    userTeams,
    refreshUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}