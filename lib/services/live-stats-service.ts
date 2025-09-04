import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type GameEvent = Database['public']['Tables']['game_events']['Row']
type GameEventInsert = Database['public']['Tables']['game_events']['Insert']

export interface StatEvent {
  playerId: string
  eventType: 'goal' | 'assist' | 'shot' | 'shot_blocked' | 'hit' | 'takeaway' | 'giveaway' | 'faceoff_win' | 'faceoff_loss' | 'penalty' | 'penalty_shot' | 'save' | 'goal_against'
  period: number
  timeInPeriod: string
  description?: string
  metadata?: Record<string, any>
}

export interface UndoableEvent {
  id: string
  eventData: StatEvent
  playerName: string
  timestamp: Date
}

class LiveStatsService {
  private supabase = createClient()
  private undoStack: UndoableEvent[] = []
  private maxUndoItems = 20

  async addStatEvent(gameId: string, userId: string, event: StatEvent): Promise<GameEvent> {
    try {
      const eventInsert: GameEventInsert = {
        game_id: gameId,
        player_id: event.playerId,
        event_type: event.eventType,
        period: event.period,
        time_in_period: event.timeInPeriod,
        description: event.description,
        metadata: event.metadata ? JSON.stringify(event.metadata) : null,
        created_by: userId
      }

      const { data, error } = await this.supabase
        .from('game_events')
        .insert([eventInsert])
        .select(`
          *,
          players!inner(first_name, last_name, jersey_number)
        `)
        .single()

      if (error) throw error

      // Add to undo stack
      const undoEvent: UndoableEvent = {
        id: data.id,
        eventData: event,
        playerName: `${data.players.first_name} ${data.players.last_name}`,
        timestamp: new Date()
      }
      
      this.addToUndoStack(undoEvent)

      return data as GameEvent
    } catch (error) {
      console.error('Error adding stat event:', error)
      throw error instanceof Error ? error : new Error('Failed to add stat event')
    }
  }

  async undoLastEvent(): Promise<UndoableEvent | null> {
    const lastEvent = this.undoStack.pop()
    if (!lastEvent) return null

    try {
      const { error } = await this.supabase
        .from('game_events')
        .delete()
        .eq('id', lastEvent.id)

      if (error) throw error

      return lastEvent
    } catch (error) {
      // Re-add to stack if deletion failed
      this.undoStack.push(lastEvent)
      console.error('Error undoing event:', error)
      throw error instanceof Error ? error : new Error('Failed to undo event')
    }
  }

  async getGameEvents(gameId: string, limit?: number): Promise<GameEvent[]> {
    try {
      let query = this.supabase
        .from('game_events')
        .select(`
          *,
          players!inner(first_name, last_name, jersey_number, position)
        `)
        .eq('game_id', gameId)
        .order('created_at', { ascending: false })

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query
      if (error) throw error

      return data as GameEvent[]
    } catch (error) {
      console.error('Error fetching game events:', error)
      throw error instanceof Error ? error : new Error('Failed to fetch game events')
    }
  }

  async updateGameScore(gameId: string, ourScore: number, opponentScore: number): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('games')
        .update({
          final_score_us: ourScore,
          final_score_opponent: opponentScore,
          updated_at: new Date().toISOString()
        })
        .eq('id', gameId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating game score:', error)
      throw error instanceof Error ? error : new Error('Failed to update score')
    }
  }

  async updateGamePeriod(gameId: string, period: number, timeRemaining?: string): Promise<void> {
    try {
      const updates: any = {
        period,
        updated_at: new Date().toISOString()
      }

      if (timeRemaining !== undefined) {
        updates.time_remaining = timeRemaining
      }

      const { error } = await this.supabase
        .from('games')
        .update(updates)
        .eq('id', gameId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating game period:', error)
      throw error instanceof Error ? error : new Error('Failed to update period')
    }
  }

  async getPlayerGameStats(gameId: string) {
    try {
      const { data, error } = await this.supabase
        .from('player_game_stats')
        .select(`
          *,
          players!inner(
            first_name,
            last_name,
            jersey_number,
            position
          )
        `)
        .eq('game_id', gameId)
        .order('players.jersey_number', { ascending: true })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching player game stats:', error)
      return []
    }
  }

  // Subscribe to real-time game events
  subscribeToGameEvents(gameId: string, callback: (event: any) => void) {
    return this.supabase
      .channel(`game-events-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_events',
          filter: `game_id=eq.${gameId}`
        },
        callback
      )
      .subscribe()
  }

  // Subscribe to game updates (score, period, time)
  subscribeToGameUpdates(gameId: string, callback: (game: any) => void) {
    return this.supabase
      .channel(`game-updates-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`
        },
        callback
      )
      .subscribe()
  }

  getUndoStack(): UndoableEvent[] {
    return [...this.undoStack]
  }

  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  clearUndoStack(): void {
    this.undoStack = []
  }

  private addToUndoStack(event: UndoableEvent): void {
    this.undoStack.push(event)
    
    // Keep only the last N items
    if (this.undoStack.length > this.maxUndoItems) {
      this.undoStack.shift()
    }
  }

  // Quick stat shortcuts for common events
  async recordGoal(gameId: string, userId: string, goalPlayerId: string, assistPlayerIds: string[], period: number, time: string, description?: string) {
    const events: Promise<GameEvent>[] = []

    // Record goal
    events.push(this.addStatEvent(gameId, userId, {
      playerId: goalPlayerId,
      eventType: 'goal',
      period,
      timeInPeriod: time,
      description: description || 'Goal'
    }))

    // Record assists
    assistPlayerIds.forEach((assistId, index) => {
      events.push(this.addStatEvent(gameId, userId, {
        playerId: assistId,
        eventType: 'assist',
        period,
        timeInPeriod: time,
        description: `${index === 0 ? 'Primary' : 'Secondary'} assist`,
        metadata: { assistType: index === 0 ? 'primary' : 'secondary' }
      }))
    })

    return Promise.all(events)
  }

  async recordPenalty(gameId: string, userId: string, playerId: string, period: number, time: string, penaltyType: string, minutes = 2) {
    return this.addStatEvent(gameId, userId, {
      playerId,
      eventType: 'penalty',
      period,
      timeInPeriod: time,
      description: `${penaltyType} - ${minutes} minutes`,
      metadata: { 
        penaltyType, 
        minutes,
        severity: minutes >= 5 ? 'major' : 'minor'
      }
    })
  }
}

export const liveStatsService = new LiveStatsService()