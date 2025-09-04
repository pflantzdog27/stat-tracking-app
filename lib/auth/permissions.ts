import { UserRole } from '@/types/database'

export type Permission = 
  | 'view_stats'
  | 'view_games'
  | 'edit_stats'
  | 'manage_players'
  | 'manage_games'
  | 'manage_team'
  | 'admin_access'

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  viewer: [
    'view_stats',
    'view_games'
  ],
  coach: [
    'view_stats',
    'view_games',
    'edit_stats',
    'manage_players',
    'manage_games'
  ],
  admin: [
    'view_stats',
    'view_games', 
    'edit_stats',
    'manage_players',
    'manage_games',
    'manage_team',
    'admin_access'
  ]
}

export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false
}

export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission))
}

export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission))
}

export function canEditStats(userRole: UserRole): boolean {
  return hasPermission(userRole, 'edit_stats')
}

export function canManageTeam(userRole: UserRole): boolean {
  return hasPermission(userRole, 'manage_team')
}

export function canViewAdminArea(userRole: UserRole): boolean {
  return hasPermission(userRole, 'admin_access')
}

export function isCoachOrAdmin(userRole: UserRole): boolean {
  return ['coach', 'admin'].includes(userRole)
}

export function isAdmin(userRole: UserRole): boolean {
  return userRole === 'admin'
}