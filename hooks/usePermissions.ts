'use client'

import { useAuth } from '@/contexts/AuthContext'
import { 
  Permission, 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions,
  canEditStats,
  canManageTeam,
  canViewAdminArea,
  isCoachOrAdmin,
  isAdmin
} from '@/lib/auth/permissions'

export function usePermissions() {
  const { user } = useAuth()
  
  const userRole = user?.role

  return {
    hasPermission: (permission: Permission) => 
      userRole ? hasPermission(userRole, permission) : false,
    
    hasAnyPermission: (permissions: Permission[]) => 
      userRole ? hasAnyPermission(userRole, permissions) : false,
    
    hasAllPermissions: (permissions: Permission[]) => 
      userRole ? hasAllPermissions(userRole, permissions) : false,
    
    canEditStats: () => 
      userRole ? canEditStats(userRole) : false,
    
    canManageTeam: () => 
      userRole ? canManageTeam(userRole) : false,
    
    canViewAdminArea: () => 
      userRole ? canViewAdminArea(userRole) : false,
    
    isCoachOrAdmin: () => 
      userRole ? isCoachOrAdmin(userRole) : false,
    
    isAdmin: () => 
      userRole ? isAdmin(userRole) : false,
    
    userRole
  }
}