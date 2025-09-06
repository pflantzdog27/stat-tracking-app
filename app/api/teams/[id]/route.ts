import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { demoStore } from '@/lib/demo-store'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Handle demo mode
    if (process.env.NEXT_PUBLIC_AUTH_DISABLED === 'true') {
      const team = demoStore.getTeamById(params.id)
      if (!team) {
        return NextResponse.json({ error: 'Team not found' }, { status: 404 })
      }
      return NextResponse.json({ team })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: team, error } = await supabase
      .from('teams')
      .select(`
        id,
        name,
        season,
        division,
        created_by,
        created_at,
        updated_at
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    return NextResponse.json({ team })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, season, division } = body

    if (!name || !season) {
      return NextResponse.json({ error: 'Team name and season are required' }, { status: 400 })
    }

    // Handle demo mode
    if (process.env.NEXT_PUBLIC_AUTH_DISABLED === 'true') {
      const team = demoStore.updateTeam(params.id, {
        name,
        season,
        division: division || null
      })
      if (!team) {
        return NextResponse.json({ error: 'Team not found' }, { status: 404 })
      }
      return NextResponse.json({ team })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin access to this team
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', params.id)
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (!teamMember) {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 })
    }

    const { data: team, error } = await supabase
      .from('teams')
      .update({
        name,
        season,
        division,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update team' }, { status: 500 })
    }

    return NextResponse.json({ team })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Handle demo mode
    if (process.env.NEXT_PUBLIC_AUTH_DISABLED === 'true') {
      const success = demoStore.deleteTeam(params.id)
      if (!success) {
        return NextResponse.json({ error: 'Team not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin access to this team
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', params.id)
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (!teamMember) {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 })
    }

    // Check if team has any players or games before deleting
    const { data: players } = await supabase
      .from('players')
      .select('id')
      .eq('team_id', params.id)
      .limit(1)

    const { data: games } = await supabase
      .from('games')
      .select('id')
      .eq('team_id', params.id)
      .limit(1)

    if (players && players.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete team with existing players. Please remove all players first.' 
      }, { status: 400 })
    }

    if (games && games.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete team with existing games. Please remove all games first.' 
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}