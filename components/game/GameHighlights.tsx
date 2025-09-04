'use client'

import { useState } from 'react'

interface GameHighlightsProps {
  highlights: GameHighlight[]
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
  }
  compact?: boolean
  className?: string
}

interface GameHighlight {
  id: string
  title: string
  description: string
  timestamp: string
  type: 'goal' | 'save' | 'hit' | 'fight'
  video?: string
  thumbnail?: string
  players?: string[]
  team?: 'home' | 'away'
}

export default function GameHighlights({
  highlights,
  gameData,
  compact = false,
  className = ''
}: GameHighlightsProps) {
  const [selectedHighlight, setSelectedHighlight] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'goals' | 'saves' | 'hits' | 'fights'>('all')
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)

  const filteredHighlights = highlights.filter(highlight => {
    if (filter === 'all') return true
    if (filter === 'goals') return highlight.type === 'goal'
    if (filter === 'saves') return highlight.type === 'save'
    if (filter === 'hits') return highlight.type === 'hit'
    if (filter === 'fights') return highlight.type === 'fight'
    return true
  })

  const getHighlightIcon = (type: string) => {
    switch (type) {
      case 'goal':
        return (
          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        )
      case 'save':
        return (
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      case 'hit':
        return (
          <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        )
      case 'fight':
        return (
          <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v1a1 1 0 01-1 1v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7a1 1 0 01-1-1V5a1 1 0 011-1h4z" />
            </svg>
          </div>
        )
    }
  }

  const getTeamLogo = (team: 'home' | 'away') => {
    const teamData = team === 'home' ? gameData.homeTeam : gameData.awayTeam
    return (
      <img 
        src={teamData.logo} 
        alt={teamData.name}
        className="w-5 h-5 rounded-full"
      />
    )
  }

  const handleVideoPlay = (highlight: GameHighlight) => {
    setSelectedHighlight(highlight.id)
    setIsVideoModalOpen(true)
  }

  if (compact) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v1a1 1 0 01-1 1v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7a1 1 0 01-1-1V5a1 1 0 011-1h4z" />
          </svg>
          Game Highlights
        </h3>
        
        <div className="space-y-3">
          {highlights.slice(0, 3).map((highlight) => (
            <div
              key={highlight.id}
              className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => highlight.video && handleVideoPlay(highlight)}
            >
              <div className="flex-shrink-0">
                {highlight.thumbnail ? (
                  <div className="relative">
                    <img 
                      src={highlight.thumbnail} 
                      alt={highlight.title}
                      className="w-12 h-8 object-cover rounded"
                    />
                    {highlight.video && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  getHighlightIcon(highlight.type)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  {highlight.team && getTeamLogo(highlight.team)}
                  <span className="text-xs text-gray-500">{highlight.timestamp}</span>
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {highlight.title}
                </p>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v1a1 1 0 01-1 1v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7a1 1 0 01-1-1V5a1 1 0 011-1h4z" />
            </svg>
            Game Highlights ({filteredHighlights.length})
          </h2>
          
          <div className="flex rounded-md bg-gray-100 p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                filter === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('goals')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                filter === 'goals'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Goals
            </button>
            <button
              onClick={() => setFilter('saves')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                filter === 'saves'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Saves
            </button>
            <button
              onClick={() => setFilter('hits')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                filter === 'hits'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Hits
            </button>
            <button
              onClick={() => setFilter('fights')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                filter === 'fights'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Fights
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {filteredHighlights.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v1a1 1 0 01-1 1v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7a1 1 0 01-1-1V5a1 1 0 011-1h4z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Highlights Found</h3>
            <p className="text-gray-600">No highlights match your current filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHighlights.map((highlight) => (
              <div
                key={highlight.id}
                className="group bg-gray-50 rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-all duration-200"
              >
                {/* Thumbnail/Video Preview */}
                <div 
                  className="relative aspect-video bg-gray-200 cursor-pointer"
                  onClick={() => highlight.video && handleVideoPlay(highlight)}
                >
                  {highlight.thumbnail ? (
                    <img 
                      src={highlight.thumbnail} 
                      alt={highlight.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                      {getHighlightIcon(highlight.type)}
                    </div>
                  )}
                  
                  {/* Play Button Overlay */}
                  {highlight.video && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200">
                      <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-200">
                        <svg className="w-5 h-5 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                  
                  {/* Type Badge */}
                  <div className="absolute top-2 right-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      highlight.type === 'goal' ? 'bg-green-100 text-green-800' :
                      highlight.type === 'save' ? 'bg-blue-100 text-blue-800' :
                      highlight.type === 'hit' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {highlight.type.charAt(0).toUpperCase() + highlight.type.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {highlight.team && getTeamLogo(highlight.team)}
                      <span className="text-xs text-gray-500">{highlight.timestamp}</span>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                    {highlight.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {highlight.description}
                  </p>
                  
                  {highlight.players && highlight.players.length > 0 && (
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Players:</span> {highlight.players.join(', ')}
                    </div>
                  )}
                  
                  {highlight.video && (
                    <button
                      onClick={() => handleVideoPlay(highlight)}
                      className="mt-3 w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      Watch Highlight
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Modal */}
      {isVideoModalOpen && selectedHighlight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative w-full max-w-4xl mx-4">
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="aspect-video bg-black">
                {/* Video player would go here */}
                <div className="w-full h-full flex items-center justify-center text-white">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    <p>Video Player Component</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {highlights.find(h => h.id === selectedHighlight)?.title}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}