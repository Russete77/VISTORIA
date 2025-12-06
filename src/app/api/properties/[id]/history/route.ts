import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Property History API - VistorIA Pro
 * GET: Get detailed inspection history for a property
 */

interface RouteParams {
  params: Promise<{ id: string }>
}

interface RoomTrend {
  room_name: string
  inspections: Array<{
    inspection_id: string
    date: string
    type: string
    problems_count: number
    problems: Array<{
      description: string
      severity: string
      status?: string
    }>
    summary?: string
  }>
  trend: 'improving' | 'stable' | 'deteriorating' | 'new'
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = createAdminClient()

    // Get user from database
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get property
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (propertyError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Get all inspections with photos and problems
    const { data: inspections, error: inspectionsError } = await supabase
      .from('inspections')
      .select(`
        id,
        type,
        status,
        tenant_name,
        inspector_name,
        started_at,
        completed_at,
        created_at,
        report_url,
        inspection_photos (
          id,
          room_name,
          room_category,
          ai_summary,
          ai_has_problems,
          created_at,
          problems:photo_problems (
            id,
            description,
            severity,
            location,
            suggested_action
          )
        )
      `)
      .eq('property_id', id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (inspectionsError) {
      console.error('Error fetching inspections:', inspectionsError)
      return NextResponse.json({ error: 'Failed to fetch inspections' }, { status: 500 })
    }

    // Build timeline
    const timeline = (inspections || []).map(inspection => {
      const photos = (inspection.inspection_photos || []) as any[]
      const allProblems = photos.flatMap(p => p.problems || [])

      const urgentCount = allProblems.filter(p => p.severity === 'urgent').length
      const highCount = allProblems.filter(p => p.severity === 'high').length
      const mediumCount = allProblems.filter(p => p.severity === 'medium').length
      const lowCount = allProblems.filter(p => p.severity === 'low').length

      return {
        id: inspection.id,
        type: inspection.type,
        status: inspection.status,
        tenant_name: inspection.tenant_name,
        inspector_name: inspection.inspector_name,
        date: inspection.completed_at || inspection.started_at || inspection.created_at,
        report_url: inspection.report_url,
        rooms_count: new Set(photos.map(p => p.room_name)).size,
        photos_count: photos.length,
        problems: {
          total: allProblems.length,
          urgent: urgentCount,
          high: highCount,
          medium: mediumCount,
          low: lowCount,
        },
      }
    })

    // Build room trends across inspections
    const roomsMap = new Map<string, RoomTrend>()

    // Process inspections from oldest to newest for trend calculation
    const sortedInspections = [...(inspections || [])].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    for (const inspection of sortedInspections) {
      const photos = (inspection.inspection_photos || []) as any[]

      // Group photos by room
      const roomPhotos = photos.reduce((acc, photo) => {
        const roomName = photo.room_name
        if (!acc[roomName]) acc[roomName] = []
        acc[roomName].push(photo)
        return acc
      }, {} as Record<string, any[]>)

      for (const [roomName, roomPhotosList] of Object.entries(roomPhotos)) {
        const problems = (roomPhotosList as any[]).flatMap(p => p.problems || [])
        const summaries = (roomPhotosList as any[])
          .map(p => p.ai_summary)
          .filter(Boolean)
          .join(' ')

        if (!roomsMap.has(roomName)) {
          roomsMap.set(roomName, {
            room_name: roomName,
            inspections: [],
            trend: 'new',
          })
        }

        const room = roomsMap.get(roomName)!
        room.inspections.push({
          inspection_id: inspection.id,
          date: inspection.completed_at || inspection.started_at || inspection.created_at,
          type: inspection.type,
          problems_count: problems.length,
          problems: problems.map((p: any) => ({
            description: p.description,
            severity: p.severity,
          })),
          summary: summaries || undefined,
        })
      }
    }

    // Calculate trends
    for (const room of roomsMap.values()) {
      if (room.inspections.length >= 2) {
        const lastTwo = room.inspections.slice(-2)
        const prevProblems = lastTwo[0].problems_count
        const currProblems = lastTwo[1].problems_count

        if (currProblems < prevProblems) {
          room.trend = 'improving'
        } else if (currProblems > prevProblems) {
          room.trend = 'deteriorating'
        } else {
          room.trend = 'stable'
        }
      }
    }

    const rooms = Array.from(roomsMap.values())
      .sort((a, b) => a.room_name.localeCompare(b.room_name))

    // Calculate overall stats
    const totalInspections = timeline.length
    const totalProblems = timeline.reduce((sum, i) => sum + i.problems.total, 0)
    const avgProblemsPerInspection = totalInspections > 0
      ? Math.round(totalProblems / totalInspections * 10) / 10
      : 0

    // Trend over time
    let overallTrend: 'improving' | 'stable' | 'deteriorating' | 'unknown' = 'unknown'
    if (timeline.length >= 2) {
      const recent = timeline.slice(0, Math.ceil(timeline.length / 2))
      const older = timeline.slice(Math.ceil(timeline.length / 2))

      const recentAvg = recent.reduce((sum, i) => sum + i.problems.total, 0) / recent.length
      const olderAvg = older.reduce((sum, i) => sum + i.problems.total, 0) / older.length

      if (recentAvg < olderAvg * 0.8) {
        overallTrend = 'improving'
      } else if (recentAvg > olderAvg * 1.2) {
        overallTrend = 'deteriorating'
      } else {
        overallTrend = 'stable'
      }
    }

    return NextResponse.json({
      property,
      stats: {
        total_inspections: totalInspections,
        total_problems: totalProblems,
        avg_problems_per_inspection: avgProblemsPerInspection,
        unique_rooms: rooms.length,
        overall_trend: overallTrend,
        first_inspection: timeline[timeline.length - 1]?.date || null,
        last_inspection: timeline[0]?.date || null,
      },
      timeline,
      rooms,
    })
  } catch (error) {
    console.error('Error in GET /api/properties/[id]/history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
