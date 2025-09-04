'use client'

import { useState } from 'react'

interface SocialShareProps {
  gameData: {
    id: string
    date: string
    homeTeam: {
      id: string
      name: string
      abbreviation: string
      logo: string
      score: number
    }
    awayTeam: {
      id: string
      name: string
      abbreviation: string
      logo: string
      score: number
    }
    status: string
    finalScore?: {
      home: number
      away: number
      overtime: boolean
      shootout: boolean
    }
    venue: string
  }
  gameStats?: {
    teamStats: any
    playerStats: any
    highlights: any[]
  } | null
  className?: string
}

export default function SocialShare({
  gameData,
  gameStats,
  className = ''
}: SocialShareProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  const generateShareText = (platform: string) => {
    const { homeTeam, awayTeam, status, finalScore } = gameData
    
    if (status === 'finished' && finalScore) {
      const overtime = finalScore.overtime ? ' (OT)' : finalScore.shootout ? ' (SO)' : ''
      return `${awayTeam.abbreviation} ${finalScore.away} - ${finalScore.home} ${homeTeam.abbreviation}${overtime}`
    }
    
    if (status === 'live') {
      return `🔴 LIVE: ${awayTeam.abbreviation} ${awayTeam.score} - ${homeTeam.score} ${homeTeam.abbreviation}`
    }
    
    return `Upcoming: ${awayTeam.name} @ ${homeTeam.name}`
  }

  const generateDetailedShareText = () => {
    const baseText = generateShareText('detailed')
    const gameUrl = `${window.location.origin}/games/${gameData.id}`
    
    let details = []
    
    if (gameStats && gameData.status === 'finished') {
      // Add top performer info
      const allPlayers = [...(gameStats.playerStats?.home || []), ...(gameStats.playerStats?.away || [])]
      const topScorer = allPlayers.reduce((prev, current) => 
        current.points > prev.points ? current : prev, allPlayers[0]
      )
      
      if (topScorer && topScorer.points > 0) {
        details.push(`⭐ ${topScorer.name}: ${topScorer.goals}G ${topScorer.assists}A`)
      }
      
      // Add team shots
      if (gameStats.teamStats) {
        details.push(`📊 Shots: ${gameStats.teamStats.away.shots}-${gameStats.teamStats.home.shots}`)
      }
    }
    
    details.push(`📍 ${gameData.venue}`)
    details.push(`🔗 ${gameUrl}`)
    
    return `${baseText}\n\n${details.join('\n')}\n\n#Hockey #GameRecap`
  }

  const shareUrls = {
    twitter: () => {
      const text = encodeURIComponent(generateDetailedShareText())
      const url = encodeURIComponent(`${window.location.origin}/games/${gameData.id}`)
      return `https://twitter.com/intent/tweet?text=${text}&url=${url}`
    },
    
    facebook: () => {
      const url = encodeURIComponent(`${window.location.origin}/games/${gameData.id}`)
      const quote = encodeURIComponent(generateShareText('facebook'))
      return `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`
    },
    
    linkedin: () => {
      const url = encodeURIComponent(`${window.location.origin}/games/${gameData.id}`)
      const title = encodeURIComponent(generateShareText('linkedin'))
      const summary = encodeURIComponent(`Game recap: ${gameData.awayTeam.name} vs ${gameData.homeTeam.name} at ${gameData.venue}`)
      return `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`
    },
    
    reddit: () => {
      const url = encodeURIComponent(`${window.location.origin}/games/${gameData.id}`)
      const title = encodeURIComponent(generateDetailedShareText())
      return `https://www.reddit.com/submit?url=${url}&title=${title}`
    },
    
    email: () => {
      const subject = encodeURIComponent(`Game Recap: ${generateShareText('email')}`)
      const body = encodeURIComponent(generateDetailedShareText())
      return `mailto:?subject=${subject}&body=${body}`
    }
  }

  const copyToClipboard = async () => {
    try {
      const shareText = generateDetailedShareText()
      await navigator.clipboard.writeText(shareText)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Game Recap: ${generateShareText('native')}`,
          text: generateDetailedShareText(),
          url: `${window.location.origin}/games/${gameData.id}`
        })
        setIsOpen(false)
      } catch (error) {
        console.error('Native sharing failed:', error)
      }
    }
  }

  const shareOptions = [
    {
      name: 'Twitter',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
      ),
      color: 'text-blue-500',
      action: () => window.open(shareUrls.twitter(), '_blank')
    },
    {
      name: 'Facebook',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      color: 'text-blue-600',
      action: () => window.open(shareUrls.facebook(), '_blank')
    },
    {
      name: 'LinkedIn',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      color: 'text-blue-700',
      action: () => window.open(shareUrls.linkedin(), '_blank')
    },
    {
      name: 'Reddit',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
        </svg>
      ),
      color: 'text-orange-500',
      action: () => window.open(shareUrls.reddit(), '_blank')
    },
    {
      name: 'Email',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      color: 'text-gray-600',
      action: () => window.location.href = shareUrls.email()
    }
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={className}
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
        Share Game
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Share Menu */}
          <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Share Game</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Preview */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {generateShareText('preview')}
                </div>
                <div className="text-xs text-gray-600">
                  {gameData.venue} • {new Date(gameData.date).toLocaleDateString()}
                </div>
              </div>

              {/* Native Share (if supported) */}
              {navigator.share && (
                <>
                  <button
                    onClick={handleNativeShare}
                    className="w-full flex items-center justify-center px-4 py-2 mb-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    Share via...
                  </button>
                  <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">or share on</span>
                    </div>
                  </div>
                </>
              )}

              {/* Social Media Options */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {shareOptions.map((option) => (
                  <button
                    key={option.name}
                    onClick={() => {
                      option.action()
                      setIsOpen(false)
                    }}
                    className={`flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium ${option.color} hover:bg-gray-50 transition-colors`}
                  >
                    {option.icon}
                    <span className="ml-2 text-gray-700">{option.name}</span>
                  </button>
                ))}
              </div>

              {/* Copy Link */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/games/${gameData.id}`}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                  />
                  <button
                    onClick={copyToClipboard}
                    className={`px-3 py-2 border border-gray-300 rounded-md text-sm font-medium transition-colors ${
                      copySuccess 
                        ? 'bg-green-100 text-green-700 border-green-300'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {copySuccess ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}