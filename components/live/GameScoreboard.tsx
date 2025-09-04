'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'

interface GameScoreboardProps {
  teamName: string
  opponent: string
  ourScore: number
  opponentScore: number
  period: number
  timeRemaining?: string
  onScoreChange: (ourScore: number, opponentScore: number) => void
  onPeriodChange: (period: number) => void
  onTimeChange: (time: string) => void
  gameStatus: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
}

export default function GameScoreboard({
  teamName,
  opponent,
  ourScore,
  opponentScore,
  period,
  timeRemaining = '20:00',
  onScoreChange,
  onPeriodChange,
  onTimeChange,
  gameStatus
}: GameScoreboardProps) {
  const [editingScore, setEditingScore] = useState<'us' | 'opponent' | null>(null)
  const [tempScore, setTempScore] = useState({ us: ourScore, opponent: opponentScore })
  const [editingTime, setEditingTime] = useState(false)
  const [tempTime, setTempTime] = useState(timeRemaining)

  useEffect(() => {
    setTempScore({ us: ourScore, opponent: opponentScore })
  }, [ourScore, opponentScore])

  useEffect(() => {
    setTempTime(timeRemaining)
  }, [timeRemaining])

  const handleScoreClick = (team: 'us' | 'opponent') => {
    setEditingScore(team)
    setTempScore({ us: ourScore, opponent: opponentScore })
  }

  const handleScoreChange = (team: 'us' | 'opponent', value: string) => {
    const score = Math.max(0, parseInt(value) || 0)
    setTempScore(prev => ({ ...prev, [team]: score }))
  }

  const handleScoreSave = () => {
    onScoreChange(tempScore.us, tempScore.opponent)
    setEditingScore(null)
  }

  const handleScoreCancel = () => {
    setTempScore({ us: ourScore, opponent: opponentScore })
    setEditingScore(null)
  }

  const handleTimeClick = () => {
    if (gameStatus === 'in_progress') {
      setEditingTime(true)
      setTempTime(timeRemaining)
    }
  }

  const handleTimeSave = () => {
    onTimeChange(tempTime)
    setEditingTime(false)
  }

  const handleTimeCancel = () => {
    setTempTime(timeRemaining)
    setEditingTime(false)
  }

  const formatTime = (time: string) => {
    // Ensure time is in MM:SS format
    if (time.match(/^\d{1,2}:\d{2}$/)) {
      return time
    }
    return '20:00'
  }

  const getPeriodLabel = (p: number) => {
    if (p <= 3) return `${p}${p === 1 ? 'st' : p === 2 ? 'nd' : 'rd'} Period`
    if (p === 4) return 'Overtime'
    if (p === 5) return 'Shootout'
    return `${p - 3}${p === 4 ? 'st' : p === 5 ? 'nd' : 'rd'} OT`
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="text-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {teamName} vs {opponent}
        </h2>
        <div className="flex items-center justify-center space-x-4 mt-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            gameStatus === 'in_progress' ? 'bg-green-100 text-green-800' :
            gameStatus === 'completed' ? 'bg-blue-100 text-blue-800' :
            gameStatus === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {gameStatus === 'in_progress' ? 'Live' : 
             gameStatus === 'completed' ? 'Final' :
             gameStatus === 'scheduled' ? 'Scheduled' : 'Cancelled'}
          </span>
          
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => period > 1 && onPeriodChange(period - 1)}
              disabled={period <= 1}
            >
              -
            </Button>
            <span className="font-medium text-sm px-2">
              {getPeriodLabel(period)}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onPeriodChange(period + 1)}
              disabled={period >= 10}
            >
              +
            </Button>
          </div>

          {gameStatus === 'in_progress' && (
            <div className="cursor-pointer" onClick={handleTimeClick}>
              {editingTime ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={tempTime}
                    onChange={(e) => setTempTime(e.target.value)}
                    className="w-16 px-2 py-1 text-sm border rounded text-center"
                    placeholder="20:00"
                    pattern="[0-9]{1,2}:[0-9]{2}"
                  />
                  <Button size="sm" onClick={handleTimeSave}>✓</Button>
                  <Button size="sm" variant="ghost" onClick={handleTimeCancel}>✗</Button>
                </div>
              ) : (
                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  {formatTime(timeRemaining)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 items-center">
        {/* Our Team Score */}
        <div className="text-center">
          <div className="text-sm font-medium text-gray-600 mb-2">
            {teamName}
          </div>
          {editingScore === 'us' ? (
            <div className="flex flex-col items-center space-y-2">
              <input
                type="number"
                min="0"
                value={tempScore.us}
                onChange={(e) => handleScoreChange('us', e.target.value)}
                className="w-16 px-2 py-1 text-2xl font-bold text-center border rounded"
                autoFocus
              />
              <div className="flex space-x-1">
                <Button size="sm" onClick={handleScoreSave}>Save</Button>
                <Button size="sm" variant="ghost" onClick={handleScoreCancel}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => handleScoreClick('us')}
              className="text-4xl font-bold text-blue-600 cursor-pointer hover:bg-blue-50 rounded px-2 py-1 transition-colors"
            >
              {ourScore}
            </div>
          )}
        </div>

        {/* VS Separator */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-400">VS</div>
        </div>

        {/* Opponent Score */}
        <div className="text-center">
          <div className="text-sm font-medium text-gray-600 mb-2">
            {opponent}
          </div>
          {editingScore === 'opponent' ? (
            <div className="flex flex-col items-center space-y-2">
              <input
                type="number"
                min="0"
                value={tempScore.opponent}
                onChange={(e) => handleScoreChange('opponent', e.target.value)}
                className="w-16 px-2 py-1 text-2xl font-bold text-center border rounded"
                autoFocus
              />
              <div className="flex space-x-1">
                <Button size="sm" onClick={handleScoreSave}>Save</Button>
                <Button size="sm" variant="ghost" onClick={handleScoreCancel}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => handleScoreClick('opponent')}
              className="text-4xl font-bold text-red-600 cursor-pointer hover:bg-red-50 rounded px-2 py-1 transition-colors"
            >
              {opponentScore}
            </div>
          )}
        </div>
      </div>

      {/* Quick Score Actions */}
      <div className="flex justify-center space-x-2 mt-4">
        <Button
          size="sm"
          onClick={() => onScoreChange(ourScore + 1, opponentScore)}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          +1 Us
        </Button>
        <Button
          size="sm"
          onClick={() => onScoreChange(Math.max(0, ourScore - 1), opponentScore)}
          variant="ghost"
          disabled={ourScore <= 0}
        >
          -1 Us
        </Button>
        <Button
          size="sm"
          onClick={() => onScoreChange(ourScore, opponentScore + 1)}
          className="bg-red-500 hover:bg-red-600 text-white"
        >
          +1 Them
        </Button>
        <Button
          size="sm"
          onClick={() => onScoreChange(ourScore, Math.max(0, opponentScore - 1))}
          variant="ghost"
          disabled={opponentScore <= 0}
        >
          -1 Them
        </Button>
      </div>
    </div>
  )
}