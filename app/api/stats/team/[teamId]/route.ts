import { NextRequest, NextResponse } from 'next/server'
import { statisticsEngine } from '@/lib/services/statistics-engine'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const season = searchParams.get('season')

    if (!season) {
      return NextResponse.json(
        { error: 'season is required' },
        { status: 400 }
      )
    }

    const teamStats = await statisticsEngine.getTeamStats(params.teamId, season)

    return NextResponse.json(teamStats)
  } catch (error) {
    console.error('Error fetching team stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team statistics' },
      { status: 500 }
    )
  }
}