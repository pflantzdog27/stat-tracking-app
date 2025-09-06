'use client'

import { useAuth } from '@/contexts/AuthContext'
import { usePermissions } from '@/hooks/usePermissions'
import Link from 'next/link'
import Layout from '@/components/layout/Layout'

export default function DashboardPage() {
  const { user, userTeams, logout } = useAuth()
  const { canEditStats, canManageTeam, canViewAdminArea } = usePermissions()

  const handleLogout = async () => {
    await logout()
  }

  if (!user) return null

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user.first_name}!
          </h2>
          <p className="text-gray-600">
            Your role: <span className="font-medium capitalize">{user.role}</span>
          </p>
        </div>

        {/* Teams Section */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Your Teams</h3>
          {userTeams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userTeams.map((teamMember) => (
                <div key={teamMember.teams.id} className="bg-white rounded-lg shadow p-6">
                  <h4 className="font-semibold text-lg">{teamMember.teams.name}</h4>
                  <p className="text-gray-600">{teamMember.teams.season}</p>
                  <p className="text-gray-600">{teamMember.teams.division}</p>
                  <p className="text-sm text-blue-600 mt-2 capitalize">
                    Role: {teamMember.role}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-500">You're not associated with any teams yet.</p>
              <p className="text-sm text-gray-400 mt-1">
                Contact your team administrator to be added to a team.
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* View Stats - Available to all */}
            <Link
              href="/stats"
              className="bg-blue-100 rounded-lg p-4 hover:bg-blue-200 transition-colors"
            >
              <h4 className="font-medium text-blue-900">View Stats</h4>
              <p className="text-sm text-blue-700">See player and team statistics</p>
            </Link>

            {/* Games - Available to all */}
            <Link
              href="/games"
              className="bg-green-100 rounded-lg p-4 hover:bg-green-200 transition-colors"
            >
              <h4 className="font-medium text-green-900">Games</h4>
              <p className="text-sm text-green-700">View game schedules and results</p>
            </Link>

            {/* Enter Stats - Coach and Admin only */}
            {canEditStats() && (
              <Link
                href="/games/live"
                className="bg-orange-100 rounded-lg p-4 hover:bg-orange-200 transition-colors"
              >
                <h4 className="font-medium text-orange-900">Enter Stats</h4>
                <p className="text-sm text-orange-700">Live stat entry during games</p>
              </Link>
            )}

            {/* Team Management - Admin only */}
            {canManageTeam() && (
              <Link
                href="/admin/teams"
                className="bg-purple-100 rounded-lg p-4 hover:bg-purple-200 transition-colors"
              >
                <h4 className="font-medium text-purple-900">Manage Team</h4>
                <p className="text-sm text-purple-700">Manage players and settings</p>
              </Link>
            )}

            {/* Admin Panel - Admin only */}
            {canViewAdminArea() && (
              <Link
                href="/admin"
                className="bg-red-100 rounded-lg p-4 hover:bg-red-200 transition-colors"
              >
                <h4 className="font-medium text-red-900">Admin Panel</h4>
                <p className="text-sm text-red-700">System administration</p>
              </Link>
            )}
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-center py-8">
              Recent activity will appear here once you start using the system.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}