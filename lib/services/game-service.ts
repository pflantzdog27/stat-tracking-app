import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Game = Database['public']['Tables']['games']['Row']
type GameInsert = Database['public']['Tables']['games']['Insert']
type GameUpdate = Database['public']['Tables']['games']['Update']

export interface GameFormData {
  opponent: string
  gameDate: string
  gameTime: string
  location: string
  gameType: 'regular' | 'playoff' | 'tournament' | 'scrimmage'
}

export interface GameWithDetails extends Game {
  team: {
    name: string
    season: string
  }
  playerCount?: number
}

class GameService {
  private supabase = createClient()

  async getTeamGames(teamId: string, limit?: number) {
    try {
      let query = this.supabase
        .from('games')
        .select(`
          *,
          teams!inner(name, season)
        `)
        .eq('team_id', teamId)
        .order('game_date', { ascending: false })

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) throw error
      return data as GameWithDetails[]
    } catch (error) {
      console.error('Error fetching team games:', error)
      throw error instanceof Error ? error : new Error('Failed to fetch games')
    }
  }

  async getGameById(gameId: string) {
    try {
      const { data, error } = await this.supabase
        .from('games')
        .select(`
          *,
          teams!inner(name, season)
        `)
        .eq('id', gameId)
        .single()

      if (error) throw error
      return data as GameWithDetails
    } catch (error) {
      console.error('Error fetching game:', error)
      throw error instanceof Error ? error : new Error('Failed to fetch game')
    }
  }

  async createGame(teamId: string, gameData: GameFormData) {
    try {
      // Combine date and time
      const gameDateTime = new Date(`${gameData.gameDate}T${gameData.gameTime}:00`)
      
      const gameInsert: GameInsert = {
        team_id: teamId,
        opponent: gameData.opponent.trim(),
        game_date: gameDateTime.toISOString(),
        location: gameData.location.trim(),
        game_type: gameData.gameType,
        status: 'scheduled',
        final_score_us: 0,
        final_score_opponent: 0,
        period: 1
      }

      const { data, error } = await this.supabase
        .from('games')
        .insert([gameInsert])
        .select(`
          *,
          teams!inner(name, season)
        `)
        .single()

      if (error) throw error
      return data as GameWithDetails
    } catch (error) {
      console.error('Error creating game:', error)
      throw error instanceof Error ? error : new Error('Failed to create game')
    }
  }

  async updateGame(gameId: string, updates: Partial<GameFormData> & { status?: Game['status'] }) {
    try {
      const gameUpdate: GameUpdate = {
        updated_at: new Date().toISOString()
      }

      // Handle date/time updates
      if (updates.gameDate || updates.gameTime) {
        const currentGame = await this.getGameById(gameId)
        const currentDate = new Date(currentGame.game_date)
        
        const date = updates.gameDate || currentDate.toISOString().split('T')[0]
        const time = updates.gameTime || currentDate.toTimeString().substring(0, 5)
        
        gameUpdate.game_date = new Date(`${date}T${time}:00`).toISOString()
      }

      // Handle other field updates
      if (updates.opponent !== undefined) gameUpdate.opponent = updates.opponent.trim()
      if (updates.location !== undefined) gameUpdate.location = updates.location.trim()
      if (updates.gameType !== undefined) gameUpdate.game_type = updates.gameType
      if (updates.status !== undefined) gameUpdate.status = updates.status

      const { data, error } = await this.supabase
        .from('games')
        .update(gameUpdate)
        .eq('id', gameId)
        .select(`
          *,
          teams!inner(name, season)
        `)
        .single()

      if (error) throw error
      return data as GameWithDetails
    } catch (error) {
      console.error('Error updating game:', error)
      throw error instanceof Error ? error : new Error('Failed to update game')
    }
  }

  async deleteGame(gameId: string) {
    try {
      // Check if game has any events/stats
      const { data: events, error: eventsError } = await this.supabase
        .from('game_events')
        .select('id')
        .eq('game_id', gameId)
        .limit(1)

      if (eventsError) throw eventsError

      if (events && events.length > 0) {
        throw new Error('Cannot delete game with existing stats/events')
      }

      const { error } = await this.supabase
        .from('games')
        .delete()
        .eq('id', gameId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting game:', error)
      throw error instanceof Error ? error : new Error('Failed to delete game')
    }
  }

  async updateGameStatus(gameId: string, status: Game['status'], scores?: { us: number; opponent: number }) {
    try {
      const gameUpdate: GameUpdate = {
        status,
        updated_at: new Date().toISOString()
      }

      if (scores) {
        gameUpdate.final_score_us = scores.us
        gameUpdate.final_score_opponent = scores.opponent
      }

      const { data, error } = await this.supabase
        .from('games')
        .update(gameUpdate)
        .eq('id', gameId)
        .select(`
          *,
          teams!inner(name, season)
        `)
        .single()

      if (error) throw error
      return data as GameWithDetails
    } catch (error) {
      console.error('Error updating game status:', error)
      throw error instanceof Error ? error : new Error('Failed to update game status')
    }
  }

  async getUpcomingGames(teamId: string, limit = 5) {
    try {
      const { data, error } = await this.supabase
        .from('games')
        .select(`
          *,
          teams!inner(name, season)
        `)
        .eq('team_id', teamId)
        .eq('status', 'scheduled')
        .gte('game_date', new Date().toISOString())
        .order('game_date', { ascending: true })
        .limit(limit)

      if (error) throw error
      return data as GameWithDetails[]
    } catch (error) {
      console.error('Error fetching upcoming games:', error)
      throw error instanceof Error ? error : new Error('Failed to fetch upcoming games')
    }
  }

  async getGameStats(gameId: string) {
    try {
      const { data, error } = await this.supabase
        .from('player_game_stats')
        .select(`
          *,
          players!inner(
            id,
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
      console.error('Error fetching game stats:', error)
      throw error instanceof Error ? error : new Error('Failed to fetch game stats')
    }
  }
}

export const gameService = new GameService()