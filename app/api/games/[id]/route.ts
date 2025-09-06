import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gameId = params.id

    // Handle demo mode
    if (process.env.NEXT_PUBLIC_AUTH_DISABLED === 'true') {
      const game = {
        id: gameId,
        team_id: 'demo-team',
        opponent: 'Sudbury Wolves',
        game_date: '2023-10-15T19:00:00',
        is_home: true,
        final_score_us: 4,
        final_score_them: 2,
        status: 'completed',
        period: 3,
        time_remaining: '00:00',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        teams: {
          name: 'Demo Team',
          season: '2023-24'
        }
      }
      return NextResponse.json({ game })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the game with team information
    const { data: game, error } = await supabase
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
        teams!inner(name, season, created_by)
      `)
      .eq('id', gameId)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    // Check if user has access to this game
    if (game.teams.created_by !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ game })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gameId = params.id
    const body = await request.json()
    const { action, ...updates } = body

    // Handle demo mode
    if (process.env.NEXT_PUBLIC_AUTH_DISABLED === 'true') {
      const updatedGame = {
        id: gameId,
        team_id: 'demo-team',
        opponent: 'Sudbury Wolves',
        game_date: '2023-10-15T19:00:00',
        is_home: true,
        final_score_us: updates.final_score_us || 4,
        final_score_them: updates.final_score_them || 2,
        status: updates.status || 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      return NextResponse.json({ game: updatedGame })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First check if user has access to this game
    const { data: existingGame, error: gameError } = await supabase
      .from('games')
      .select(`
        id,
        status,
        teams!inner(created_by)
      `)
      .eq('id', gameId)
      .single()

    if (gameError || !existingGame) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    if (existingGame.teams.created_by !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Handle specific actions
    let updateData: any = {}

    switch (action) {
      case 'start':
        if (existingGame.status !== 'scheduled') {
          return NextResponse.json({ error: 'Can only start scheduled games' }, { status: 400 })
        }
        updateData = {
          status: 'in_progress'
        }
        break

      case 'finish':
        if (existingGame.status !== 'in_progress') {
          return NextResponse.json({ error: 'Can only finish games in progress' }, { status: 400 })
        }
        updateData = {
          status: 'completed',
          final_score_us: updates.final_score_us || 0,
          final_score_them: updates.final_score_them || 0
        }
        break

      case 'cancel':
        if (existingGame.status !== 'in_progress') {
          return NextResponse.json({ error: 'Can only cancel games in progress' }, { status: 400 })
        }
        updateData = {
          status: 'scheduled',
          final_score_us: 0,
          final_score_them: 0
        }
        break

      case 'update':
        // General update - allow specific field updates
        updateData = updates
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Update the game
    const { data: updatedGame, error: updateError } = await supabase
      .from('games')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', gameId)
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
        teams(name, season)
      `)
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update game' }, { status: 500 })
    }

    return NextResponse.json({ game: updatedGame })
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
    const gameId = params.id
    const body = await request.json()
    const { opponent, game_date, is_home } = body

    if (!opponent || !game_date) {
      return NextResponse.json({ 
        error: 'Opponent and game date are required' 
      }, { status: 400 })
    }

    // Handle demo mode
    if (process.env.NEXT_PUBLIC_AUTH_DISABLED === 'true') {
      const updatedGame = {
        id: gameId,
        team_id: 'demo-team',
        opponent: opponent.trim(),
        game_date: game_date,
        is_home: is_home !== undefined ? is_home : true,
        status: 'scheduled',
        final_score_us: 0,
        final_score_them: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      return NextResponse.json({ game: updatedGame })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First check if user has access and game can be edited
    const { data: existingGame, error: gameError } = await supabase
      .from('games')
      .select(`
        id,
        status,
        teams!inner(created_by)
      `)
      .eq('id', gameId)
      .single()

    if (gameError || !existingGame) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    if (existingGame.teams.created_by !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (existingGame.status !== 'scheduled') {
      return NextResponse.json({ 
        error: 'Can only edit scheduled games' 
      }, { status: 400 })
    }

    // Update the game
    const { data: updatedGame, error: updateError } = await supabase
      .from('games')
      .update({
        opponent: opponent.trim(),
        game_date: game_date,
        is_home: is_home !== undefined ? is_home : true,
        updated_at: new Date().toISOString()
      })
      .eq('id', gameId)
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
        teams(name, season)
      `)
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update game' }, { status: 500 })
    }

    return NextResponse.json({ game: updatedGame })
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
    const gameId = params.id

    // Handle demo mode
    if (process.env.NEXT_PUBLIC_AUTH_DISABLED === 'true') {
      return NextResponse.json({ message: 'Game deleted successfully' })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First check if user has access and game can be deleted
    const { data: existingGame, error: gameError } = await supabase
      .from('games')
      .select(`
        id,
        status,
        teams!inner(created_by)
      `)
      .eq('id', gameId)
      .single()

    if (gameError || !existingGame) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    if (existingGame.teams.created_by !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (existingGame.status !== 'scheduled') {
      return NextResponse.json({ 
        error: 'Can only delete scheduled games' 
      }, { status: 400 })
    }

    // Delete the game
    const { error: deleteError } = await supabase
      .from('games')
      .delete()
      .eq('id', gameId)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Game deleted successfully' })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}