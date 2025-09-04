import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Player = Database['public']['Tables']['players']['Row']
type PlayerInsert = Database['public']['Tables']['players']['Insert']
type PlayerUpdate = Database['public']['Tables']['players']['Update']

export interface PlayerFormData {
  firstName: string
  lastName: string
  jerseyNumber: number
  position: 'F' | 'D' | 'G'
  birthDate?: string
}

export interface PlayerWithStats extends Player {
  season_stats?: {
    games_played: number
    goals: number
    assists: number
    points: number
    shots: number
    penalty_minutes: number
  }
}

class PlayerService {
  private supabase = createClient()

  async getTeamPlayers(teamId: string, activeOnly = true) {
    try {
      let query = this.supabase
        .from('players')
        .select('*')
        .eq('team_id', teamId)
        .order('jersey_number', { ascending: true })

      if (activeOnly) {
        query = query.eq('active', true)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Player[]
    } catch (error) {
      console.error('Error fetching team players:', error)
      throw error instanceof Error ? error : new Error('Failed to fetch players')
    }
  }

  async getPlayerById(playerId: string) {
    try {
      const { data, error } = await this.supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single()

      if (error) throw error
      return data as Player
    } catch (error) {
      console.error('Error fetching player:', error)
      throw error instanceof Error ? error : new Error('Failed to fetch player')
    }
  }

  async createPlayer(teamId: string, playerData: PlayerFormData) {
    try {
      // Check if jersey number is already taken
      const { data: existingPlayer } = await this.supabase
        .from('players')
        .select('jersey_number')
        .eq('team_id', teamId)
        .eq('jersey_number', playerData.jerseyNumber)
        .eq('active', true)
        .single()

      if (existingPlayer) {
        throw new Error(`Jersey number ${playerData.jerseyNumber} is already taken`)
      }

      const playerInsert: PlayerInsert = {
        team_id: teamId,
        first_name: playerData.firstName.trim(),
        last_name: playerData.lastName.trim(),
        jersey_number: playerData.jerseyNumber,
        position: playerData.position,
        birth_date: playerData.birthDate || null,
        active: true
      }

      const { data, error } = await this.supabase
        .from('players')
        .insert([playerInsert])
        .select()
        .single()

      if (error) throw error
      return data as Player
    } catch (error) {
      console.error('Error creating player:', error)
      throw error instanceof Error ? error : new Error('Failed to create player')
    }
  }

  async updatePlayer(playerId: string, updates: Partial<PlayerFormData>) {
    try {
      const playerUpdate: PlayerUpdate = {
        updated_at: new Date().toISOString()
      }

      // Handle field updates
      if (updates.firstName !== undefined) playerUpdate.first_name = updates.firstName.trim()
      if (updates.lastName !== undefined) playerUpdate.last_name = updates.lastName.trim()
      if (updates.position !== undefined) playerUpdate.position = updates.position
      if (updates.birthDate !== undefined) playerUpdate.birth_date = updates.birthDate || null

      // Handle jersey number change with validation
      if (updates.jerseyNumber !== undefined) {
        const currentPlayer = await this.getPlayerById(playerId)
        
        // Check if new jersey number is available (exclude current player)
        const { data: existingPlayer } = await this.supabase
          .from('players')
          .select('jersey_number')
          .eq('team_id', currentPlayer.team_id)
          .eq('jersey_number', updates.jerseyNumber)
          .eq('active', true)
          .neq('id', playerId)
          .single()

        if (existingPlayer) {
          throw new Error(`Jersey number ${updates.jerseyNumber} is already taken`)
        }

        playerUpdate.jersey_number = updates.jerseyNumber
      }

      const { data, error } = await this.supabase
        .from('players')
        .update(playerUpdate)
        .eq('id', playerId)
        .select()
        .single()

      if (error) throw error
      return data as Player
    } catch (error) {
      console.error('Error updating player:', error)
      throw error instanceof Error ? error : new Error('Failed to update player')
    }
  }

  async deactivatePlayer(playerId: string) {
    try {
      const { data, error } = await this.supabase
        .from('players')
        .update({ 
          active: false, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', playerId)
        .select()
        .single()

      if (error) throw error
      return data as Player
    } catch (error) {
      console.error('Error deactivating player:', error)
      throw error instanceof Error ? error : new Error('Failed to deactivate player')
    }
  }

  async reactivatePlayer(playerId: string) {
    try {
      const { data, error } = await this.supabase
        .from('players')
        .update({ 
          active: true, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', playerId)
        .select()
        .single()

      if (error) throw error
      return data as Player
    } catch (error) {
      console.error('Error reactivating player:', error)
      throw error instanceof Error ? error : new Error('Failed to reactivate player')
    }
  }

  async deletePlayer(playerId: string) {
    try {
      // Check if player has any game stats
      const { data: stats, error: statsError } = await this.supabase
        .from('player_game_stats')
        .select('id')
        .eq('player_id', playerId)
        .limit(1)

      if (statsError) throw statsError

      if (stats && stats.length > 0) {
        throw new Error('Cannot delete player with existing game statistics. Deactivate instead.')
      }

      const { error } = await this.supabase
        .from('players')
        .delete()
        .eq('id', playerId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting player:', error)
      throw error instanceof Error ? error : new Error('Failed to delete player')
    }
  }

  async getPlayersWithStats(teamId: string, season: string) {
    try {
      const { data, error } = await this.supabase
        .from('players')
        .select(`
          *,
          player_season_stats!inner(
            games_played,
            goals,
            assists,
            points,
            shots,
            penalty_minutes
          )
        `)
        .eq('team_id', teamId)
        .eq('player_season_stats.season', season)
        .eq('active', true)
        .order('player_season_stats.points', { ascending: false })

      if (error) throw error
      
      return data.map(player => ({
        ...player,
        season_stats: player.player_season_stats[0] || {
          games_played: 0,
          goals: 0,
          assists: 0,
          points: 0,
          shots: 0,
          penalty_minutes: 0
        }
      })) as PlayerWithStats[]
    } catch (error) {
      console.error('Error fetching players with stats:', error)
      throw error instanceof Error ? error : new Error('Failed to fetch players with stats')
    }
  }

  async getAvailableJerseyNumbers(teamId: string): Promise<number[]> {
    try {
      const { data: usedNumbers, error } = await this.supabase
        .from('players')
        .select('jersey_number')
        .eq('team_id', teamId)
        .eq('active', true)

      if (error) throw error

      const used = new Set(usedNumbers.map(p => p.jersey_number))
      const available: number[] = []

      for (let i = 1; i <= 99; i++) {
        if (!used.has(i)) {
          available.push(i)
        }
      }

      return available
    } catch (error) {
      console.error('Error fetching available jersey numbers:', error)
      return []
    }
  }
}

export const playerService = new PlayerService()