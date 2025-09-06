import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'
import { demoStore } from '@/lib/demo-store'

type Team = Database['public']['Tables']['teams']['Row']
type TeamInsert = Database['public']['Tables']['teams']['Insert']
type TeamUpdate = Database['public']['Tables']['teams']['Update']

export interface TeamFormData {
  name: string
  season: string
  division?: string
}

export interface TeamWithStats extends Team {
  member_count?: number
  player_count?: number
  game_count?: number
}

class TeamService {
  private supabase = createClient()

  async getAllTeams(): Promise<Team[]> {
    // Handle demo mode
    if (process.env.NEXT_PUBLIC_AUTH_DISABLED === 'true') {
      return demoStore.getAllTeams() as Team[]
    }

    const { data, error } = await this.supabase
      .from('teams')
      .select('*')
      .order('name')

    if (error) {
      throw new Error(`Failed to fetch teams: ${error.message}`)
    }

    return data
  }

  async getTeamById(teamId: string): Promise<Team> {
    const { data, error } = await this.supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single()

    if (error) {
      throw new Error(`Failed to fetch team: ${error.message}`)
    }

    return data
  }

  async getUserTeams(userId: string): Promise<(Team & { role: string })[]> {
    // Handle demo mode
    if (process.env.NEXT_PUBLIC_AUTH_DISABLED === 'true') {
      // In demo mode, return all teams with admin role
      const teams = demoStore.getAllTeams()
      return teams.map(team => ({
        ...team as Team,
        role: 'admin'
      }))
    }

    const { data, error } = await this.supabase
      .from('team_members')
      .select(`
        role,
        teams (
          id,
          name,
          season,
          division,
          created_by,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to fetch user teams: ${error.message}`)
    }

    return data.map(item => ({
      ...(item.teams as Team),
      role: item.role
    }))
  }

  async createTeam(teamData: TeamFormData): Promise<Team> {
    const response = await fetch('/api/teams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(teamData),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create team')
    }

    return result.team
  }

  async updateTeam(teamId: string, teamData: TeamFormData): Promise<Team> {
    const response = await fetch(`/api/teams/${teamId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(teamData),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update team')
    }

    return result.team
  }

  async deleteTeam(teamId: string): Promise<void> {
    const response = await fetch(`/api/teams/${teamId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.error || 'Failed to delete team')
    }
  }

  async getTeamMembers(teamId: string) {
    const { data, error } = await this.supabase
      .from('team_members')
      .select(`
        id,
        role,
        created_at,
        users (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('team_id', teamId)

    if (error) {
      throw new Error(`Failed to fetch team members: ${error.message}`)
    }

    return data
  }

  async addTeamMember(teamId: string, userId: string, role: 'admin' | 'coach' | 'viewer') {
    const { data, error } = await this.supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        role
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to add team member: ${error.message}`)
    }

    return data
  }

  async updateTeamMemberRole(teamMemberId: string, role: 'admin' | 'coach' | 'viewer') {
    const { data, error } = await this.supabase
      .from('team_members')
      .update({ role })
      .eq('id', teamMemberId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update team member role: ${error.message}`)
    }

    return data
  }

  async removeTeamMember(teamMemberId: string) {
    const { error } = await this.supabase
      .from('team_members')
      .delete()
      .eq('id', teamMemberId)

    if (error) {
      throw new Error(`Failed to remove team member: ${error.message}`)
    }
  }
}

export const teamService = new TeamService()
export default teamService