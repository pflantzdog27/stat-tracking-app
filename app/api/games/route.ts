import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { demoStore } from '@/lib/demo-store'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')

    // Handle demo mode
    if (process.env.NEXT_PUBLIC_AUTH_DISABLED === 'true') {
      // Return mock games data for demo
      const games = [
        {
          id: '1',
          team_id: 'demo-team',
          opponent: 'Sudbury Wolves',
          game_date: '2023-10-15T19:00:00',
          location: 'Thunder Bay Arena',
          game_type: 'regular',
          status: 'completed',
          final_score_us: 4,
          final_score_them: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
      return NextResponse.json({ games })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get session first, then user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build query based on whether teamId is provided
    let query = supabase
      .from('games')
      .select(`
        id,
        team_id,
        opponent,
        game_date,
        is_home,
        final_score_us,
        final_score_them,
        status,
        created_at,
        updated_at,
        teams!inner(name, season)
      `)
      .order('game_date', { ascending: false })

    if (teamId) {
      query = query.eq('team_id', teamId)
    } else {
      // Get games for all user's teams - first get the team IDs
      const { data: userTeams } = await supabase
        .from('teams')
        .select('id')
        .eq('created_by', session.user.id)
      
      if (userTeams && userTeams.length > 0) {
        const teamIds = userTeams.map(team => team.id)
        query = query.in('team_id', teamIds)
      } else {
        // No teams found, return empty result
        return NextResponse.json({ games: [] })
      }
    }

    const { data: games, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
    }

    return NextResponse.json({ games })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { teamId, opponent, gameDate, isHome } = body

    if (!teamId || !opponent || !gameDate) {
      return NextResponse.json({ 
        error: 'Team ID, opponent, and game date are required' 
      }, { status: 400 })
    }

    // Handle demo mode
    if (process.env.NEXT_PUBLIC_AUTH_DISABLED === 'true') {
      const game = {
        id: `demo-game-${Date.now()}`,
        team_id: teamId,
        opponent: opponent.trim(),
        game_date: gameDate,
        is_home: isHome !== undefined ? isHome : true,
        status: 'scheduled',
        final_score_us: 0,
        final_score_them: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      return NextResponse.json({ game }, { status: 201 })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get session first, then user
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const user = session.user

    // Verify the team belongs to the user
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id')
      .eq('id', teamId)
      .eq('created_by', user.id)
      .single()

    if (teamError || !team) {
      return NextResponse.json({ error: 'Team not found or access denied' }, { status: 403 })
    }

    const { data: game, error } = await supabase
      .from('games')
      .insert({
        team_id: teamId,
        opponent: opponent.trim(),
        game_date: gameDate,
        is_home: isHome !== undefined ? isHome : true,
        status: 'scheduled',
        final_score_us: 0,
        final_score_them: 0
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create game' }, { status: 500 })
    }

    return NextResponse.json({ game }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}