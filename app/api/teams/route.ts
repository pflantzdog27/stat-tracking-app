import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { demoStore } from '@/lib/demo-store'

export async function GET(request: NextRequest) {
  try {
    // Handle demo mode
    if (process.env.NEXT_PUBLIC_AUTH_DISABLED === 'true') {
      const teams = demoStore.getAllTeams()
      return NextResponse.json({ teams })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get session first, then user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      console.log('No session found in API route (GET)')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: teams, error } = await supabase
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
      .order('name')

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
    }

    return NextResponse.json({ teams })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, season, division } = body

    if (!name || !season) {
      return NextResponse.json({ error: 'Team name and season are required' }, { status: 400 })
    }

    // Handle demo mode
    if (process.env.NEXT_PUBLIC_AUTH_DISABLED === 'true') {
      const team = demoStore.createTeam({
        name,
        season,
        division: division || null,
        created_by: 'demo-user'
      })
      return NextResponse.json({ team }, { status: 201 })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get session first, then user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      console.log('No session found in API route')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const user = session.user

    const { data: team, error } = await supabase
      .from('teams')
      .insert({
        name,
        season,
        division,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create team' }, { status: 500 })
    }

    // Add the creator as an admin of the team
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        user_id: user.id,
        team_id: team.id,
        role: 'admin'
      })

    if (memberError) {
      console.error('Failed to add creator as admin:', memberError)
      // Don't fail the request, team was created successfully
    }

    return NextResponse.json({ team }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}