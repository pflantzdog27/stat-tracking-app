'use client'

import { useState, useEffect } from 'react'
import { PlayerWithDetails, PlayerStatsSummary } from '@/types/enhanced-database'
import { enhancedPlayerService } from '@/lib/services/enhanced-player-service'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface PlayerStatsDashboardProps {
  player: PlayerWithDetails
  teamId: string
  season: string
  className?: string
}

export default function PlayerStatsDashboard({ 
  player, 
  teamId, 
  season, 
  className = '' 
}: PlayerStatsDashboardProps) {
  const [teamStats, setTeamStats] = useState<PlayerStatsSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTeamStats()
  }, [teamId, season])

  const loadTeamStats = async () => {
    try {
      setLoading(true)
      setError('')
      const stats = await enhancedPlayerService.getPlayerStatsSummary(teamId, season)
      setTeamStats(stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team stats')
    } finally {
      setLoading(false)
    }
  }

  const getPlayerRank = (stat: keyof PlayerStatsSummary): number => {
    const sorted = teamStats.sort((a, b) => (b[stat] as number) - (a[stat] as number))
    return sorted.findIndex(p => p.playerId === player.id) + 1
  }

  const getTeamAverage = (stat: keyof PlayerStatsSummary): number => {
    const values = teamStats.map(p => p[stat] as number).filter(v => v > 0)
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
  }

  const StatCard = ({ 
    title, 
    value, 
    rank, 
    teamAvg, 
    color = 'blue',
    suffix = ''
  }: { 
    title: string
    value: number | undefined
    rank?: number
    teamAvg?: number
    color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red'
    suffix?: string
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-900 border-blue-200',
      green: 'bg-green-50 text-green-900 border-green-200',
      yellow: 'bg-yellow-50 text-yellow-900 border-yellow-200',
      purple: 'bg-purple-50 text-purple-900 border-purple-200',
      red: 'bg-red-50 text-red-900 border-red-200'
    }

    return (
      <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
        <div className="text-sm font-medium opacity-75">{title}</div>
        <div className="text-2xl font-bold mt-1">
          {value !== undefined ? value.toFixed(suffix === '%' ? 1 : 0) : '-'}{suffix}
        </div>
        {rank && rank <= teamStats.length && (
          <div className="text-xs mt-1 opacity-75">
            Rank #{rank} of {teamStats.length}
          </div>
        )}
        {teamAvg !== undefined && teamAvg > 0 && (
          <div className="text-xs mt-1 opacity-75">
            Team avg: {teamAvg.toFixed(suffix === '%' ? 1 : 0)}{suffix}
          </div>
        )}
      </div>
    )
  }

  const calculateAge = () => {
    if (!player.birth_date) return null
    const birthDate = new Date(player.birth_date)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const formatHeight = () => {
    if (!player.height_inches) return null
    const feet = Math.floor(player.height_inches / 12)
    const inches = player.height_inches % 12
    return `${feet}'${inches}"`
  }

  const getPositionFullName = () => {
    switch (player.position) {
      case 'F': return 'Forward'
      case 'D': return 'Defense'
      case 'G': return 'Goalie'
      default: return 'Unknown'
    }
  }

  if (loading) {
    return (
      <div className={`flex justify-center py-8 ${className}`}>
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Player Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              #{player.jersey_number} {player.first_name} {player.last_name}
            </h2>
            <p className="text-lg text-gray-600 mt-1">
              {getPositionFullName()} • {player.team_name}
            </p>
          </div>
          {player.photo_url && (
            <img
              src={player.photo_url}
              alt={`${player.first_name} ${player.last_name}`}
              className="w-20 h-20 rounded-lg object-cover"
            />
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div>
            <div className="text-sm text-gray-500">Age</div>
            <div className="text-lg font-semibold">
              {calculateAge() || 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Height</div>
            <div className="text-lg font-semibold">
              {formatHeight() || 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Weight</div>
            <div className="text-lg font-semibold">
              {player.weight_lbs ? `${player.weight_lbs} lbs` : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Shoots</div>
            <div className="text-lg font-semibold">
              {player.shoots === 'L' ? 'Left' : player.shoots === 'R' ? 'Right' : 'N/A'}
            </div>
          </div>
        </div>

        {player.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Notes</div>
            <div className="text-sm text-gray-900 mt-1">{player.notes}</div>
          </div>
        )}
      </div>

      {/* Season Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {season} Season Statistics
        </h3>

        {player.games_played ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Games Played"
              value={player.games_played}
              color="blue"
            />
            
            <StatCard
              title="Goals"
              value={player.goals}
              rank={getPlayerRank('goals')}
              teamAvg={getTeamAverage('goals')}
              color="green"
            />
            
            <StatCard
              title="Assists"
              value={player.assists}
              rank={getPlayerRank('assists')}
              teamAvg={getTeamAverage('assists')}
              color="blue"
            />
            
            <StatCard
              title="Points"
              value={player.points}
              rank={getPlayerRank('points')}
              teamAvg={getTeamAverage('points')}
              color="purple"
            />

            <StatCard
              title="Shots"
              value={player.shots}
              rank={getPlayerRank('shots')}
              teamAvg={getTeamAverage('shots')}
              color="yellow"
            />

            <StatCard
              title="Penalty Minutes"
              value={player.penalty_minutes}
              rank={getPlayerRank('penaltyMinutes')}
              teamAvg={getTeamAverage('penaltyMinutes')}
              color="red"
            />

            {player.position === 'G' && (
              <>
                <StatCard
                  title="Saves"
                  value={player.saves}
                  color="green"
                />
                
                <StatCard
                  title="Save %"
                  value={player.save_percentage}
                  color="green"
                  suffix="%"
                />
              </>
            )}

            {/* Calculated Stats */}
            {player.games_played && player.games_played > 0 && (
              <>
                <StatCard
                  title="Points/Game"
                  value={player.points ? player.points / player.games_played : 0}
                  color="purple"
                />
                
                <StatCard
                  title="Shots/Game"
                  value={player.shots ? player.shots / player.games_played : 0}
                  color="yellow"
                />
              </>
            )}

            {player.shots && player.shots > 0 && (
              <StatCard
                title="Shooting %"
                value={player.goals ? (player.goals / player.shots) * 100 : 0}
                color="green"
                suffix="%"
              />
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No statistics available for this season.</p>
            <p className="text-sm text-gray-400 mt-1">
              Stats will appear once the player participates in games.
            </p>
          </div>
        )}
      </div>

      {/* Team Rankings */}
      {teamStats.length > 1 && player.games_played && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Team Rankings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-900">
                #{getPlayerRank('points')}
              </div>
              <div className="text-sm text-yellow-700">Points</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-900">
                #{getPlayerRank('goals')}
              </div>
              <div className="text-sm text-green-700">Goals</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">
                #{getPlayerRank('assists')}
              </div>
              <div className="text-sm text-blue-700">Assists</div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
}