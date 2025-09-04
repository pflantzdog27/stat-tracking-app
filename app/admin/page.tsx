'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function AdminDashboard() {
  const { user, userTeams } = useAuth()

  const adminTeams = userTeams.filter(tm => tm.role === 'admin')

  return (
    <ProtectedRoute requiredPermissions={['admin_access']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your teams, games, and players</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Teams Overview */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Your Teams</h2>
            {adminTeams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {adminTeams.map((teamMember) => (
                  <div key={teamMember.teams.id} className="bg-white rounded-lg shadow p-6">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {teamMember.teams.name}
                    </h3>
                    <p className="text-gray-600">{teamMember.teams.season}</p>
                    <p className="text-gray-600">{teamMember.teams.division}</p>
                    <div className="mt-4 flex space-x-2">
                      <Link
                        href="/admin/games"
                        className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full hover:bg-blue-200 transition-colors"
                      >
                        Manage Games
                      </Link>
                      <Link
                        href="/admin/players"
                        className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full hover:bg-green-200 transition-colors"
                      >
                        Manage Players
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-gray-500">You don't have admin access to any teams.</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <Link
                href="/admin/games"
                className="bg-blue-100 rounded-lg p-6 hover:bg-blue-200 transition-colors group"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-blue-900">Manage Games</h3>
                    <p className="text-blue-700">Schedule and manage games</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/admin/players"
                className="bg-green-100 rounded-lg p-6 hover:bg-green-200 transition-colors group"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-green-900">Manage Players</h3>
                    <p className="text-green-700">Add and edit team roster</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/stats"
                className="bg-yellow-100 rounded-lg p-6 hover:bg-yellow-200 transition-colors group"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-yellow-900">View Statistics</h3>
                    <p className="text-yellow-700">Team and player stats</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/games/live"
                className="bg-red-100 rounded-lg p-6 hover:bg-red-200 transition-colors group"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-red-900">Live Stats Entry</h3>
                    <p className="text-red-700">Enter stats during games</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Activity Placeholder */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-500 text-center py-8">
                Recent admin activity will appear here once you start managing games and players.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}