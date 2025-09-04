'use client'

import { useState } from 'react'
import { Player } from '@/types/database'
import { StatEvent } from '@/lib/services/live-stats-service'
import Button from '@/components/ui/Button'
import PlayerSelector from './PlayerSelector'
import PenaltyModal from './PenaltyModal'

interface QuickActionsProps {
  players: Player[]
  onStatEvent: (event: StatEvent) => Promise<void>
  onGoalWithAssist: (goalPlayerId: string, assistPlayerIds: string[]) => Promise<void>
  period: number
  timeInPeriod: string
  loading?: boolean
}

export default function QuickActions({ 
  players, 
  onStatEvent, 
  onGoalWithAssist, 
  period, 
  timeInPeriod,
  loading = false 
}: QuickActionsProps) {
  const [showGoalAssist, setShowGoalAssist] = useState(false)
  const [showPenalty, setShowPenalty] = useState(false)
  const [goalScorer, setGoalScorer] = useState<Player | null>(null)
  const [primaryAssist, setPrimaryAssist] = useState<Player | null>(null)
  const [secondaryAssist, setSecondaryAssist] = useState<Player | null>(null)
  const [penaltyPlayer, setPenaltyPlayer] = useState<Player | null>(null)

  const handleQuickGoal = async () => {
    if (!goalScorer) return

    const assistIds: string[] = []
    if (primaryAssist) assistIds.push(primaryAssist.id)
    if (secondaryAssist) assistIds.push(secondaryAssist.id)

    await onGoalWithAssist(goalScorer.id, assistIds)
    
    // Reset
    setGoalScorer(null)
    setPrimaryAssist(null)
    setSecondaryAssist(null)
    setShowGoalAssist(false)
  }

  const handlePenalty = async (penaltyType: string, minutes: number, description: string) => {
    if (!penaltyPlayer) return

    await onStatEvent({
      playerId: penaltyPlayer.id,
      eventType: 'penalty',
      period,
      timeInPeriod,
      description,
      metadata: { penaltyType, minutes, severity: minutes >= 5 ? 'major' : 'minor' }
    })

    setPenaltyPlayer(null)
    setShowPenalty(false)
  }

  const availableAssistPlayers = players.filter(p => p.id !== goalScorer?.id)
  const availableSecondaryAssistPlayers = availableAssistPlayers.filter(p => p.id !== primaryAssist?.id)

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h3 className="font-medium text-gray-900 mb-4">Quick Actions</h3>
      
      <div className="space-y-4">
        {/* Quick Goal with Assists */}
        <div>
          <Button
            onClick={() => setShowGoalAssist(!showGoalAssist)}
            className="w-full"
            variant={showGoalAssist ? 'secondary' : 'primary'}
          >
            {showGoalAssist ? 'Cancel Goal Entry' : '🥅 Goal + Assists'}
          </Button>
          
          {showGoalAssist && (
            <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goal Scorer *
                </label>
                <PlayerSelector
                  players={players}
                  selectedPlayer={goalScorer}
                  onSelectPlayer={setGoalScorer}
                  showPosition={false}
                />
              </div>

              {goalScorer && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Assist
                    </label>
                    <PlayerSelector
                      players={availableAssistPlayers}
                      selectedPlayer={primaryAssist}
                      onSelectPlayer={setPrimaryAssist}
                      showPosition={false}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secondary Assist
                    </label>
                    <PlayerSelector
                      players={availableSecondaryAssistPlayers}
                      selectedPlayer={secondaryAssist}
                      onSelectPlayer={setSecondaryAssist}
                      showPosition={false}
                    />
                  </div>

                  <Button
                    onClick={handleQuickGoal}
                    loading={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    Record Goal
                    {primaryAssist && ' + Primary Assist'}
                    {secondaryAssist && ' + Secondary Assist'}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Quick Penalty */}
        <div>
          <Button
            onClick={() => setShowPenalty(!showPenalty)}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
            variant="danger"
          >
            ⚠️ Record Penalty
          </Button>
          
          {showPenalty && (
            <div className="mt-4 space-y-4 p-4 bg-red-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Player *
                </label>
                <PlayerSelector
                  players={players}
                  selectedPlayer={penaltyPlayer}
                  onSelectPlayer={setPenaltyPlayer}
                  showPosition={false}
                />
              </div>

              {penaltyPlayer && (
                <Button
                  onClick={() => setShowPenalty(true)}
                  className="w-full"
                >
                  Continue to Penalty Details
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Common Individual Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => {/* TODO: Show quick shot modal */}}
            size="sm"
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            🏒 Quick Shot
          </Button>
          
          <Button
            onClick={() => {/* TODO: Show quick hit modal */}}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            💥 Quick Hit
          </Button>
          
          <Button
            onClick={() => {/* TODO: Show faceoff modal */}}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            ⚡ Faceoff
          </Button>
          
          <Button
            onClick={() => {/* TODO: Show save modal */}}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            🥅 Save
          </Button>
        </div>
      </div>

      {/* Penalty Modal */}
      <PenaltyModal
        isOpen={showPenalty && !!penaltyPlayer}
        onClose={() => {
          setShowPenalty(false)
          setPenaltyPlayer(null)
        }}
        onSubmit={handlePenalty}
        playerName={penaltyPlayer ? `#${penaltyPlayer.jersey_number} ${penaltyPlayer.first_name} ${penaltyPlayer.last_name}` : ''}
      />
    </div>
  )
}