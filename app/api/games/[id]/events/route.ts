import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gameId = params.id
    const body = await request.json()
    const { events } = body

    if (!events || !Array.isArray(events)) {
      return NextResponse.json({ error: 'Events array is required' }, { status: 400 })
    }

    // Handle demo mode
    if (process.env.NEXT_PUBLIC_AUTH_DISABLED === 'true') {
      return NextResponse.json({ 
        message: 'Events saved successfully',
        events: events.map((event, index) => ({ ...event, id: `demo-${index}` }))
      })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to this game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select(`
        id,
        status,
        teams!inner(created_by)
      `)
      .eq('id', gameId)
      .single()

    if (gameError || !game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    if (game.teams.created_by !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (game.status !== 'in_progress') {
      return NextResponse.json({ error: 'Can only save events for games in progress' }, { status: 400 })
    }

    // Since game_events table doesn't exist yet, we'll just acknowledge the events
    // TODO: Implement proper event storage when database schema is updated
    console.log(`Received ${events.length} events for game ${gameId}:`, events)

    return NextResponse.json({ 
      message: 'Events logged successfully (database schema pending)',
      events: events.map((event, index) => ({ ...event, id: `temp-${Date.now()}-${index}` }))
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gameId = params.id

    // Handle demo mode
    if (process.env.NEXT_PUBLIC_AUTH_DISABLED === 'true') {
      return NextResponse.json({ events: [] })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to this game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select(`
        id,
        teams!inner(created_by)
      `)
      .eq('id', gameId)
      .single()

    if (gameError || !game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    if (game.teams.created_by !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get events for this game
    const { data: events, error } = await supabase
      .from('game_events')
      .select(`
        *,
        players(jersey_number, first_name, last_name)
      `)
      .eq('game_id', gameId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
    }

    return NextResponse.json({ events })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}