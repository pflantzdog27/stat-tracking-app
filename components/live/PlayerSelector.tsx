'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Player } from '@/types/database'

interface PlayerSelectorProps {
  players: Player[]
  selectedPlayer: Player | null
  onSelectPlayer: (player: Player) => void
  showPosition?: boolean
  className?: string
}

export default function PlayerSelector({ 
  players, 
  selectedPlayer, 
  onSelectPlayer, 
  showPosition = true,
  className = ''
}: PlayerSelectorProps) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredPlayers = useMemo(() => {
    if (!search) return players

    const searchLower = search.toLowerCase()
    return players.filter(player => 
      player.first_name.toLowerCase().includes(searchLower) ||
      player.last_name.toLowerCase().includes(searchLower) ||
      player.jersey_number.toString().includes(search) ||
      `${player.first_name} ${player.last_name}`.toLowerCase().includes(searchLower)
    )
  }, [players, search])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectPlayer = (player: Player) => {
    onSelectPlayer(player)
    setSearch('')
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const handleInputFocus = () => {
    setIsOpen(true)
    setSearch('')
  }

  const getPositionColor = (position: string | null) => {
    switch (position) {
      case 'F':
        return 'text-blue-600'
      case 'D':
        return 'text-green-600'
      case 'G':
        return 'text-purple-600'
      default:
        return 'text-gray-600'
    }
  }

  const getPositionLabel = (position: string | null) => {
    switch (position) {
      case 'F':
        return 'F'
      case 'D':
        return 'D'
      case 'G':
        return 'G'
      default:
        return '?'
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Selected Player Display or Input */}
      {selectedPlayer && !isOpen ? (
        <div 
          onClick={handleInputFocus}
          className="flex items-center space-x-3 p-4 bg-white border-2 border-blue-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors"
        >
          <div className="flex-shrink-0">
            <span className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-500 text-white font-bold text-lg">
              #{selectedPlayer.jersey_number}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-medium text-gray-900">
              {selectedPlayer.first_name} {selectedPlayer.last_name}
            </p>
            {showPosition && (
              <p className={`text-sm font-medium ${getPositionColor(selectedPlayer.position)}`}>
                {getPositionLabel(selectedPlayer.position)}
              </p>
            )}
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      ) : (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={handleInputFocus}
            placeholder="Search players by name or #..."
            className="w-full p-4 text-lg border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-4">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      )}

      {/* Dropdown List */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {filteredPlayers.length > 0 ? (
            <div className="py-2">
              {filteredPlayers.map((player) => (
                <button
                  key={player.id}
                  onClick={() => handleSelectPlayer(player)}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-500 text-white font-medium">
                      #{player.jersey_number}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {player.first_name} {player.last_name}
                    </p>
                    {showPosition && (
                      <p className={`text-sm ${getPositionColor(player.position)}`}>
                        {getPositionLabel(player.position)}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              No players found matching "{search}"
            </div>
          )}
        </div>
      )}
    </div>
  )
}