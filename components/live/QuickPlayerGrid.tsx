'use client'

import { Player } from '@/types/database'

interface QuickPlayerGridProps {
  players: Player[]
  onSelectPlayer: (player: Player) => void
  selectedPlayer?: Player | null
  className?: string
}

export default function QuickPlayerGrid({ 
  players, 
  onSelectPlayer, 
  selectedPlayer,
  className = ''
}: QuickPlayerGridProps) {
  const getPositionColor = (position: string | null) => {
    switch (position) {
      case 'F':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'D':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'G':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const sortedPlayers = [...players].sort((a, b) => {
    // Sort by position first (F, D, G), then by jersey number
    const positionOrder = { 'F': 1, 'D': 2, 'G': 3 }
    const aPos = positionOrder[a.position as keyof typeof positionOrder] || 4
    const bPos = positionOrder[b.position as keyof typeof positionOrder] || 4
    
    if (aPos !== bPos) {
      return aPos - bPos
    }
    
    return a.jersey_number - b.jersey_number
  })

  return (
    <div className={`grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 ${className}`}>
      {sortedPlayers.map((player) => (
        <button
          key={player.id}
          onClick={() => onSelectPlayer(player)}
          className={`
            flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200 
            ${selectedPlayer?.id === player.id 
              ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' 
              : getPositionColor(player.position) + ' hover:scale-105'
            }
            active:scale-95 min-h-[80px] text-center
          `}
        >
          <div className="font-bold text-lg leading-none mb-1">
            #{player.jersey_number}
          </div>
          <div className="text-xs leading-tight">
            {player.first_name}
          </div>
          <div className="text-xs leading-tight font-medium">
            {player.last_name}
          </div>
        </button>
      ))}
    </div>
  )
}