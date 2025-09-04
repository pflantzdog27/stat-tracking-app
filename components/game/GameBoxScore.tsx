'use client'

interface GameBoxScoreProps {
  gameData: {
    homeTeam: {
      id: string
      name: string
      abbreviation: string
      logo: string
    }
    awayTeam: {
      id: string
      name: string
      abbreviation: string
      logo: string
    }
    status: string
  }
  teamStats: {
    home: TeamGameStats
    away: TeamGameStats
  }
  compact?: boolean
  className?: string
}

interface TeamGameStats {
  goals: number
  shots: number
  hits: number
  blockedShots: number
  faceoffWins: number
  faceoffTotal: number
  powerPlayGoals: number
  powerPlayOpportunities: number
  penaltyMinutes: number
  saves: number
  shotsAgainst: number
}

export default function GameBoxScore({
  gameData,
  teamStats,
  compact = false,
  className = ''
}: GameBoxScoreProps) {
  const stats = [
    {
      key: 'shots',
      label: 'Shots',
      homeValue: teamStats.home.shots,
      awayValue: teamStats.away.shots,
      format: (value: number) => value.toString()
    },
    {
      key: 'faceoffs',
      label: 'Faceoff %',
      homeValue: teamStats.home.faceoffTotal > 0 ? (teamStats.home.faceoffWins / teamStats.home.faceoffTotal) * 100 : 0,
      awayValue: teamStats.away.faceoffTotal > 0 ? (teamStats.away.faceoffWins / teamStats.away.faceoffTotal) * 100 : 0,
      format: (value: number) => `${value.toFixed(1)}%`
    },
    {
      key: 'powerplay',
      label: 'Power Play',
      homeValue: teamStats.home.powerPlayOpportunities > 0 ? (teamStats.home.powerPlayGoals / teamStats.home.powerPlayOpportunities) * 100 : 0,
      awayValue: teamStats.away.powerPlayOpportunities > 0 ? (teamStats.away.powerPlayGoals / teamStats.away.powerPlayOpportunities) * 100 : 0,
      format: (value: number, team: 'home' | 'away') => {
        const goals = team === 'home' ? teamStats.home.powerPlayGoals : teamStats.away.powerPlayGoals
        const opps = team === 'home' ? teamStats.home.powerPlayOpportunities : teamStats.away.powerPlayOpportunities
        return `${goals}/${opps} (${value.toFixed(1)}%)`
      }
    },
    {
      key: 'hits',
      label: 'Hits',
      homeValue: teamStats.home.hits,
      awayValue: teamStats.away.hits,
      format: (value: number) => value.toString()
    },
    {
      key: 'blocks',
      label: 'Blocked Shots',
      homeValue: teamStats.home.blockedShots,
      awayValue: teamStats.away.blockedShots,
      format: (value: number) => value.toString()
    },
    {
      key: 'pim',
      label: 'Penalty Minutes',
      homeValue: teamStats.home.penaltyMinutes,
      awayValue: teamStats.away.penaltyMinutes,
      format: (value: number) => value.toString()
    }
  ]

  const getStatColor = (homeValue: number, awayValue: number, higherIsBetter = true) => {
    if (homeValue === awayValue) return 'text-gray-900'
    
    const homeIsHigher = homeValue > awayValue
    const homeIsBetter = higherIsBetter ? homeIsHigher : !homeIsHigher
    
    return homeIsBetter ? 'text-green-600' : 'text-red-600'
  }

  if (compact) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Team Stats
        </h3>
        
        <div className="space-y-2">
          {stats.slice(0, 3).map((stat) => (
            <div key={stat.key} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">{stat.label}</span>
              <div className="flex items-center space-x-4">
                <span className={`text-sm font-medium ${getStatColor(stat.homeValue, stat.awayValue, stat.key !== 'pim')}`}>
                  {typeof stat.format === 'function' && stat.format.length > 1 
                    ? stat.format(stat.homeValue, 'home' as const)
                    : (stat.format as any)(stat.homeValue)
                  }
                </span>
                <span className="text-xs text-gray-400">vs</span>
                <span className={`text-sm font-medium ${getStatColor(stat.awayValue, stat.homeValue, stat.key !== 'pim')}`}>
                  {typeof stat.format === 'function' && stat.format.length > 1 
                    ? stat.format(stat.awayValue, 'away' as const)
                    : (stat.format as any)(stat.awayValue)
                  }
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Box Score
        </h2>
      </div>

      <div className="p-4 sm:p-6">
        {/* Team Headers */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <img 
              src={gameData.awayTeam.logo} 
              alt={gameData.awayTeam.name}
              className="w-8 h-8"
            />
            <div>
              <div className="font-semibold text-gray-900">{gameData.awayTeam.abbreviation}</div>
              <div className="text-sm text-gray-600">{gameData.awayTeam.name}</div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="font-semibold text-gray-900">{gameData.homeTeam.abbreviation}</div>
              <div className="text-sm text-gray-600">{gameData.homeTeam.name}</div>
            </div>
            <img 
              src={gameData.homeTeam.logo} 
              alt={gameData.homeTeam.name}
              className="w-8 h-8"
            />
          </div>
        </div>

        {/* Stats Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-sm font-medium text-gray-600">Away</th>
                <th className="text-center py-2 text-sm font-medium text-gray-600">Statistic</th>
                <th className="text-right py-2 text-sm font-medium text-gray-600">Home</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.map((stat) => (
                <tr key={stat.key} className="hover:bg-gray-50">
                  <td className={`py-3 text-left font-medium ${getStatColor(stat.awayValue, stat.homeValue, stat.key !== 'pim')}`}>
                    {typeof stat.format === 'function' && stat.format.length > 1 
                      ? stat.format(stat.awayValue, 'away' as const)
                      : (stat.format as any)(stat.awayValue)
                    }
                  </td>
                  <td className="py-3 text-center text-sm text-gray-600 font-medium">
                    {stat.label}
                  </td>
                  <td className={`py-3 text-right font-medium ${getStatColor(stat.homeValue, stat.awayValue, stat.key !== 'pim')}`}>
                    {typeof stat.format === 'function' && stat.format.length > 1 
                      ? stat.format(stat.homeValue, 'home' as const)
                      : (stat.format as any)(stat.homeValue)
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Additional Stats */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Goaltending</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600">{gameData.awayTeam.abbreviation} Goalie</div>
              <div className="font-medium text-gray-900">
                {teamStats.away.saves}/{teamStats.away.shotsAgainst}
              </div>
              <div className="text-xs text-gray-500">
                Saves/Shots ({teamStats.away.shotsAgainst > 0 
                  ? ((teamStats.away.saves / teamStats.away.shotsAgainst) * 100).toFixed(1)
                  : '0.0'}%)
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">{gameData.homeTeam.abbreviation} Goalie</div>
              <div className="font-medium text-gray-900">
                {teamStats.home.saves}/{teamStats.home.shotsAgainst}
              </div>
              <div className="text-xs text-gray-500">
                Saves/Shots ({teamStats.home.shotsAgainst > 0 
                  ? ((teamStats.home.saves / teamStats.home.shotsAgainst) * 100).toFixed(1)
                  : '0.0'}%)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}