// Simple in-memory store for demo mode
// This allows teams created in demo mode to persist during the session

interface DemoTeam {
  id: string
  name: string
  season: string
  division: string | null
  created_by: string
  created_at: string
  updated_at: string
}

class DemoStore {
  private teams: DemoTeam[] = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Thunder Bay Lightning',
      season: '2024-25',
      division: 'Northern',
      created_by: 'demo-user',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    }
  ]

  getAllTeams(): DemoTeam[] {
    return [...this.teams]
  }

  getTeamById(id: string): DemoTeam | null {
    return this.teams.find(team => team.id === id) || null
  }

  createTeam(teamData: Omit<DemoTeam, 'id' | 'created_at' | 'updated_at'>): DemoTeam {
    const newTeam: DemoTeam = {
      ...teamData,
      id: `demo-team-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    this.teams.push(newTeam)
    return newTeam
  }

  updateTeam(id: string, updates: Partial<Omit<DemoTeam, 'id' | 'created_by' | 'created_at'>>): DemoTeam | null {
    const teamIndex = this.teams.findIndex(team => team.id === id)
    if (teamIndex === -1) return null

    this.teams[teamIndex] = {
      ...this.teams[teamIndex],
      ...updates,
      updated_at: new Date().toISOString()
    }
    return this.teams[teamIndex]
  }

  deleteTeam(id: string): boolean {
    const teamIndex = this.teams.findIndex(team => team.id === id)
    if (teamIndex === -1) return false

    this.teams.splice(teamIndex, 1)
    return true
  }

  reset() {
    this.teams = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Thunder Bay Lightning',
        season: '2024-25',
        division: 'Northern',
        created_by: 'demo-user',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      }
    ]
  }
}

// Singleton instance
export const demoStore = new DemoStore()
export type { DemoTeam }