import { createClient } from '@/lib/supabase/client'
import { 
  EnhancedPlayer, 
  PlayerWithDetails, 
  PlayerHistory, 
  AvailableJerseyNumber, 
  PlayerFormData, 
  PlayerImportData,
  BulkPlayerOperation,
  PlayerSearchFilters,
  PlayerStatsSummary
} from '@/types/enhanced-database'

class EnhancedPlayerService {
  private supabase = createClient()

  async getPlayersWithDetails(
    teamId: string, 
    filters?: PlayerSearchFilters
  ): Promise<PlayerWithDetails[]> {
    try {
      let query = this.supabase
        .from('player_details_view')
        .select('*')
        .eq('team_id', teamId)

      // Apply filters
      if (filters) {
        if (filters.searchTerm) {
          const term = filters.searchTerm.toLowerCase()
          query = query.or(
            `first_name.ilike.%${term}%,` +
            `last_name.ilike.%${term}%,` +
            `jersey_number.eq.${parseInt(term) || -1}`
          )
        }

        if (filters.position && filters.position !== 'all') {
          query = query.eq('position', filters.position)
        }

        if (filters.status && filters.status !== 'all') {
          if (filters.status === 'active') {
            query = query.eq('active', true)
          } else if (filters.status === 'inactive') {
            query = query.eq('active', false)
          } else {
            query = query.eq('player_status', filters.status)
          }
        }

        if (filters.shoots && filters.shoots !== 'all') {
          query = query.eq('shoots', filters.shoots)
        }

        if (filters.jerseyRange) {
          if (filters.jerseyRange.min) {
            query = query.gte('jersey_number', filters.jerseyRange.min)
          }
          if (filters.jerseyRange.max) {
            query = query.lte('jersey_number', filters.jerseyRange.max)
          }
        }

        // Sorting
        if (filters.sortBy) {
          const column = {
            name: 'last_name',
            jersey: 'jersey_number',
            position: 'position',
            age: 'age',
            points: 'points',
            goals: 'goals'
          }[filters.sortBy] || 'jersey_number'

          query = query.order(column, { 
            ascending: filters.sortOrder !== 'desc' 
          })
        } else {
          query = query.order('jersey_number', { ascending: true })
        }
      } else {
        query = query.order('jersey_number', { ascending: true })
      }

      const { data, error } = await query

      if (error) throw error
      return data as PlayerWithDetails[]
    } catch (error) {
      console.error('Error fetching players with details:', error)
      throw error instanceof Error ? error : new Error('Failed to fetch players')
    }
  }

  async createPlayerWithDetails(teamId: string, playerData: PlayerFormData, userId: string): Promise<EnhancedPlayer> {
    try {
      // Set user context for history logging
      await this.supabase.rpc('set_config', {
        setting_name: 'app.current_user_id',
        setting_value: userId,
        is_local: true
      })

      // Check jersey number availability
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

      const playerInsert = {
        team_id: teamId,
        first_name: playerData.firstName.trim(),
        last_name: playerData.lastName.trim(),
        jersey_number: playerData.jerseyNumber,
        position: playerData.position,
        birth_date: playerData.birthDate || null,
        email: playerData.email?.trim() || null,
        phone: playerData.phone?.trim() || null,
        address: playerData.address?.trim() || null,
        height_inches: playerData.heightInches || null,
        weight_lbs: playerData.weightLbs || null,
        shoots: playerData.shoots || null,
        emergency_contact_name: playerData.emergencyContactName?.trim() || null,
        emergency_contact_phone: playerData.emergencyContactPhone?.trim() || null,
        parent_guardian_name: playerData.parentGuardianName?.trim() || null,
        parent_guardian_email: playerData.parentGuardianEmail?.trim() || null,
        parent_guardian_phone: playerData.parentGuardianPhone?.trim() || null,
        notes: playerData.notes?.trim() || null,
        photo_url: playerData.photoUrl?.trim() || null,
        player_status: playerData.playerStatus || 'active',
        active: true
      }

      const { data, error } = await this.supabase
        .from('players')
        .insert([playerInsert])
        .select()
        .single()

      if (error) throw error
      return data as EnhancedPlayer
    } catch (error) {
      console.error('Error creating player:', error)
      throw error instanceof Error ? error : new Error('Failed to create player')
    }
  }

  async updatePlayerWithDetails(
    playerId: string, 
    updates: Partial<PlayerFormData>, 
    userId: string
  ): Promise<EnhancedPlayer> {
    try {
      // Set user context for history logging
      await this.supabase.rpc('set_config', {
        setting_name: 'app.current_user_id',
        setting_value: userId,
        is_local: true
      })

      const playerUpdate: any = {
        updated_at: new Date().toISOString()
      }

      // Map form data to database columns
      if (updates.firstName !== undefined) playerUpdate.first_name = updates.firstName.trim()
      if (updates.lastName !== undefined) playerUpdate.last_name = updates.lastName.trim()
      if (updates.position !== undefined) playerUpdate.position = updates.position
      if (updates.birthDate !== undefined) playerUpdate.birth_date = updates.birthDate || null
      if (updates.email !== undefined) playerUpdate.email = updates.email?.trim() || null
      if (updates.phone !== undefined) playerUpdate.phone = updates.phone?.trim() || null
      if (updates.address !== undefined) playerUpdate.address = updates.address?.trim() || null
      if (updates.heightInches !== undefined) playerUpdate.height_inches = updates.heightInches
      if (updates.weightLbs !== undefined) playerUpdate.weight_lbs = updates.weightLbs
      if (updates.shoots !== undefined) playerUpdate.shoots = updates.shoots
      if (updates.emergencyContactName !== undefined) playerUpdate.emergency_contact_name = updates.emergencyContactName?.trim() || null
      if (updates.emergencyContactPhone !== undefined) playerUpdate.emergency_contact_phone = updates.emergencyContactPhone?.trim() || null
      if (updates.parentGuardianName !== undefined) playerUpdate.parent_guardian_name = updates.parentGuardianName?.trim() || null
      if (updates.parentGuardianEmail !== undefined) playerUpdate.parent_guardian_email = updates.parentGuardianEmail?.trim() || null
      if (updates.parentGuardianPhone !== undefined) playerUpdate.parent_guardian_phone = updates.parentGuardianPhone?.trim() || null
      if (updates.notes !== undefined) playerUpdate.notes = updates.notes?.trim() || null
      if (updates.photoUrl !== undefined) playerUpdate.photo_url = updates.photoUrl?.trim() || null
      if (updates.playerStatus !== undefined) playerUpdate.player_status = updates.playerStatus

      // Handle jersey number change with validation
      if (updates.jerseyNumber !== undefined) {
        const currentPlayer = await this.getPlayerById(playerId)
        
        if (currentPlayer.jersey_number !== updates.jerseyNumber) {
          // Check if new jersey number is available
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
      }

      const { data, error } = await this.supabase
        .from('players')
        .update(playerUpdate)
        .eq('id', playerId)
        .select()
        .single()

      if (error) throw error
      return data as EnhancedPlayer
    } catch (error) {
      console.error('Error updating player:', error)
      throw error instanceof Error ? error : new Error('Failed to update player')
    }
  }

  async getPlayerById(playerId: string): Promise<EnhancedPlayer> {
    try {
      const { data, error } = await this.supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single()

      if (error) throw error
      return data as EnhancedPlayer
    } catch (error) {
      console.error('Error fetching player:', error)
      throw error instanceof Error ? error : new Error('Failed to fetch player')
    }
  }

  async getPlayerHistory(playerId: string): Promise<PlayerHistory[]> {
    try {
      const { data, error } = await this.supabase
        .from('player_history')
        .select(`
          *,
          users!player_history_changed_by_fkey(first_name, last_name)
        `)
        .eq('player_id', playerId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as PlayerHistory[]
    } catch (error) {
      console.error('Error fetching player history:', error)
      throw error instanceof Error ? error : new Error('Failed to fetch player history')
    }
  }

  async getAvailableJerseyNumbers(teamId: string, season: string): Promise<AvailableJerseyNumber[]> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_available_jersey_numbers', {
          p_team_id: teamId,
          p_season: season
        })

      if (error) throw error
      return data as AvailableJerseyNumber[]
    } catch (error) {
      console.error('Error fetching available jersey numbers:', error)
      return []
    }
  }

  async bulkImportPlayers(
    teamId: string, 
    playersData: PlayerImportData[], 
    userId: string
  ): Promise<{ success: EnhancedPlayer[]; errors: { row: number; error: string }[] }> {
    const success: EnhancedPlayer[] = []
    const errors: { row: number; error: string }[] = []

    for (let i = 0; i < playersData.length; i++) {
      try {
        const playerData = playersData[i]
        
        // Validate required fields
        if (!playerData.firstName || !playerData.lastName || !playerData.jerseyNumber) {
          errors.push({ row: i + 1, error: 'Missing required fields (first name, last name, or jersey number)' })
          continue
        }

        // Convert to PlayerFormData
        const formData: PlayerFormData = {
          firstName: playerData.firstName,
          lastName: playerData.lastName,
          jerseyNumber: playerData.jerseyNumber,
          position: (playerData.position as 'F' | 'D' | 'G') || null,
          birthDate: playerData.birthDate,
          email: playerData.email,
          phone: playerData.phone,
          parentGuardianName: playerData.parentGuardianName,
          parentGuardianEmail: playerData.parentGuardianEmail,
          heightInches: playerData.heightInches,
          weightLbs: playerData.weightLbs,
          shoots: (playerData.shoots as 'L' | 'R') || null
        }

        const player = await this.createPlayerWithDetails(teamId, formData, userId)
        success.push(player)
      } catch (error) {
        errors.push({ 
          row: i + 1, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    return { success, errors }
  }

  async bulkPlayerOperation(
    operation: BulkPlayerOperation, 
    userId: string
  ): Promise<{ success: string[]; errors: { playerId: string; error: string }[] }> {
    const success: string[] = []
    const errors: { playerId: string; error: string }[] = []

    // Set user context for history logging
    await this.supabase.rpc('set_config', {
      setting_name: 'app.current_user_id',
      setting_value: userId,
      is_local: true
    })

    for (const playerId of operation.playerIds) {
      try {
        let updateData: any = {}

        switch (operation.action) {
          case 'activate':
            updateData = { active: true, player_status: 'active' }
            break
          case 'deactivate':
            updateData = { active: false, player_status: 'inactive' }
            break
          case 'update_status':
            updateData = { player_status: operation.newStatus }
            if (operation.newStatus === 'active') updateData.active = true
            if (operation.newStatus === 'inactive') updateData.active = false
            break
          case 'delete':
            // Check for existing stats before deleting
            const { data: stats } = await this.supabase
              .from('player_game_stats')
              .select('id')
              .eq('player_id', playerId)
              .limit(1)

            if (stats && stats.length > 0) {
              errors.push({ playerId, error: 'Cannot delete player with existing game statistics' })
              continue
            }

            const { error: deleteError } = await this.supabase
              .from('players')
              .delete()
              .eq('id', playerId)

            if (deleteError) throw deleteError
            success.push(playerId)
            continue
        }

        const { error } = await this.supabase
          .from('players')
          .update(updateData)
          .eq('id', playerId)

        if (error) throw error
        success.push(playerId)
      } catch (error) {
        errors.push({ 
          playerId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    return { success, errors }
  }

  async getPlayerStatsSummary(teamId: string, season: string): Promise<PlayerStatsSummary[]> {
    try {
      const { data, error } = await this.supabase
        .from('player_details_view')
        .select('*')
        .eq('team_id', teamId)
        .eq('season', season)
        .eq('active', true)
        .order('points', { ascending: false })

      if (error) throw error

      return (data as PlayerWithDetails[]).map(player => ({
        playerId: player.id,
        playerName: `${player.first_name} ${player.last_name}`,
        jerseyNumber: player.jersey_number,
        position: player.position || 'Unknown',
        gamesPlayed: player.games_played || 0,
        goals: player.goals || 0,
        assists: player.assists || 0,
        points: player.points || 0,
        shots: player.shots || 0,
        penaltyMinutes: player.penalty_minutes || 0,
        saves: player.saves,
        goalsAgainst: player.goals_against,
        savePercentage: player.save_percentage,
        averagePoints: player.games_played ? (player.points || 0) / player.games_played : 0,
        averageShots: player.games_played ? (player.shots || 0) / player.games_played : 0
      }))
    } catch (error) {
      console.error('Error fetching player stats summary:', error)
      throw error instanceof Error ? error : new Error('Failed to fetch player stats summary')
    }
  }

  async exportPlayersToCSV(teamId: string): Promise<string> {
    try {
      const players = await this.getPlayersWithDetails(teamId)
      
      const headers = [
        'Jersey Number', 'First Name', 'Last Name', 'Position', 'Birth Date',
        'Email', 'Phone', 'Height (in)', 'Weight (lbs)', 'Shoots',
        'Parent/Guardian', 'Parent Email', 'Parent Phone',
        'Emergency Contact', 'Emergency Phone', 'Status', 'Notes'
      ]

      const rows = players.map(player => [
        player.jersey_number,
        player.first_name,
        player.last_name,
        player.position || '',
        player.birth_date || '',
        player.email || '',
        player.phone || '',
        player.height_inches || '',
        player.weight_lbs || '',
        player.shoots || '',
        player.parent_guardian_name || '',
        player.parent_guardian_email || '',
        player.parent_guardian_phone || '',
        player.emergency_contact_name || '',
        player.emergency_contact_phone || '',
        player.player_status || 'active',
        player.notes || ''
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(field => 
          typeof field === 'string' && field.includes(',') 
            ? `"${field.replace(/"/g, '""')}"` 
            : field
        ).join(','))
      ].join('\n')

      return csvContent
    } catch (error) {
      console.error('Error exporting players to CSV:', error)
      throw error instanceof Error ? error : new Error('Failed to export players')
    }
  }
}

export const enhancedPlayerService = new EnhancedPlayerService()