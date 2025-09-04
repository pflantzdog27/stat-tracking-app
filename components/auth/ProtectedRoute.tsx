'use client'

import { useAuth } from '@/contexts/AuthContext'
import { usePermissions } from '@/hooks/usePermissions'
import { Permission } from '@/lib/auth/permissions'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  requiredPermissions?: Permission[]
  requireAll?: boolean
  fallbackPath?: string
}

export default function ProtectedRoute({
  children,
  requireAuth = true,
  requiredPermissions = [],
  requireAll = false,
  fallbackPath = '/unauthorized'
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    // Check authentication
    if (requireAuth && !user) {
      router.push('/auth/login')
      return
    }

    // Check permissions
    if (requiredPermissions.length > 0) {
      const hasRequiredPermissions = requireAll 
        ? hasAllPermissions(requiredPermissions)
        : hasAnyPermission(requiredPermissions)

      if (!hasRequiredPermissions) {
        router.push(fallbackPath)
        return
      }
    }
  }, [user, loading, requireAuth, requiredPermissions, requireAll, fallbackPath, router, hasAnyPermission, hasAllPermissions])

  if (loading) {
    return <LoadingSpinner />
  }

  if (requireAuth && !user) {
    return null
  }

  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAll 
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions)

    if (!hasRequiredPermissions) {
      return null
    }
  }

  return <>{children}</>
}