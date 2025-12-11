import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient, getOrCreateUser } from '@/lib/supabase/server'
import {
  createCalendarEventSchema,
  type CalendarItem,
  bookingToCalendarItem,
  inspectionToCalendarItem,
  eventToCalendarItem,
  type CalendarEvent,
  type EventColor,
} from '@/lib/validations/calendar'

/**
 * GET /api/calendar
 * Lista todos os eventos do calendário (bookings + inspections + events)
 * Query params: from_date, to_date, property_id, types
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { data: user } = await getOrCreateUser(userId, supabase)

    console.log('[Calendar API] user.id:', user.id, 'type:', typeof user.id)

    // Parse query params
    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get('from_date')
    const toDate = searchParams.get('to_date')
    const propertyId = searchParams.get('property_id')
    const typesParam = searchParams.get('types') // comma-separated: booking,inspection,event

    const types = typesParam?.split(',') || ['booking', 'inspection', 'event']

    const calendarItems: CalendarItem[] = []

    // 1. Fetch Bookings
    if (types.includes('booking')) {
      console.log('[Calendar API] Fetching bookings for user:', user.id)
      
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, check_in_date, check_out_date, status, property_id, guest_id')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .gte('check_out_date', fromDate || '1900-01-01')
        .lte('check_in_date', toDate || '2999-12-31')

      if (bookingsError) {
        console.error('[Calendar API] Error fetching bookings:', bookingsError)
      } else if (bookings && bookings.length > 0) {
        console.log('[Calendar API] Found', bookings.length, 'bookings')
        
        // Fetch related properties and guests separately
        const propertyIds = bookings.map(b => b.property_id).filter((id): id is string => !!id && id !== 'undefined')
        const guestIds = bookings.map(b => b.guest_id).filter((id): id is string => !!id && id !== 'undefined')
        
        console.log('[Calendar API] Property IDs:', propertyIds)
        console.log('[Calendar API] Guest IDs:', guestIds)
        
        let propertiesMap: Record<string, { id: string; name: string }> = {}
        let guestsMap: Record<string, { full_name: string }> = {}
        
        if (propertyIds.length > 0) {
          const { data: properties, error: propError } = await supabase
            .from('properties')
            .select('id, name')
            .in('id', propertyIds)
          
          if (propError) {
            console.error('[Calendar API] Error fetching properties:', propError)
          } else if (properties) {
            propertiesMap = Object.fromEntries(properties.map(p => [p.id, p]))
          }
        }
        
        if (guestIds.length > 0) {
          const { data: guests, error: guestError } = await supabase
            .from('guests')
            .select('id, full_name')
            .in('id', guestIds)
          
          if (guestError) {
            console.error('[Calendar API] Error fetching guests:', guestError)
          } else if (guests) {
            guestsMap = Object.fromEntries(guests.map(g => [g.id, { full_name: g.full_name }]))
          }
        }
        
        for (const booking of bookings) {
          const property = booking.property_id ? propertiesMap[booking.property_id] : null
          const guest = booking.guest_id ? guestsMap[booking.guest_id] : null
          calendarItems.push(bookingToCalendarItem({
            id: booking.id,
            check_in_date: booking.check_in_date,
            check_out_date: booking.check_out_date,
            status: booking.status,
            property: property || null,
            guest: guest || null,
          }))
        }
      }
    }

    // 2. Fetch Inspections with scheduled_date
    if (types.includes('inspection')) {
      console.log('[Calendar API] Fetching inspections for user:', user.id)
      
      const { data: inspections, error: inspectionsError } = await supabase
        .from('inspections')
        .select('id, scheduled_date, type, status, tenant_name, property_id')
        .eq('user_id', user.id)
        .not('scheduled_date', 'is', null)
        .is('deleted_at', null)
        .gte('scheduled_date', fromDate || '1900-01-01')
        .lte('scheduled_date', (toDate || '2999-12-31') + 'T23:59:59')

      if (inspectionsError) {
        console.error('[Calendar API] Error fetching inspections:', inspectionsError)
      } else if (inspections && inspections.length > 0) {
        console.log('[Calendar API] Found', inspections.length, 'inspections')
        
        // Fetch related properties separately
        const propertyIds = inspections.map(i => i.property_id).filter((id): id is string => !!id && id !== 'undefined')
        
        let propertiesMap: Record<string, { id: string; name: string }> = {}
        
        if (propertyIds.length > 0) {
          const { data: properties, error: propError } = await supabase
            .from('properties')
            .select('id, name')
            .in('id', propertyIds)
          
          if (propError) {
            console.error('[Calendar API] Error fetching inspection properties:', propError)
          } else if (properties) {
            propertiesMap = Object.fromEntries(properties.map(p => [p.id, p]))
          }
        }
        
        for (const inspection of inspections) {
          const property = inspection.property_id ? propertiesMap[inspection.property_id] : null
          const item = inspectionToCalendarItem({
            id: inspection.id,
            scheduled_date: inspection.scheduled_date,
            type: inspection.type,
            status: inspection.status,
            property: property || null,
            tenant_name: inspection.tenant_name,
          })
          if (item) calendarItems.push(item)
        }
      }
    }

    // 3. Fetch Calendar Events (compromissos)
    if (types.includes('event')) {
      console.log('[Calendar API] Fetching calendar events for user:', user.id)
      
      const { data: events, error: eventsError } = await supabase
        .from('calendar_events')
        .select(`
          id,
          user_id,
          title,
          description,
          event_type,
          start_date,
          start_time,
          end_date,
          end_time,
          all_day,
          property_id,
          inspection_id,
          booking_id,
          color,
          is_recurring,
          recurrence_rule,
          status,
          created_at,
          updated_at,
          deleted_at
        `)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .neq('status', 'cancelled')
        .gte('end_date', fromDate || '1900-01-01')
        .lte('start_date', toDate || '2999-12-31')

      if (eventsError) {
        console.error('[Calendar API] Error fetching calendar events:', eventsError)
      } else if (events && events.length > 0) {
        console.log('[Calendar API] Found', events.length, 'calendar events')
        
        // Fetch related properties separately
        const propertyIds = events.map(e => e.property_id).filter((id): id is string => !!id && id !== 'undefined')
        
        let propertiesMap: Record<string, { id: string; name: string }> = {}
        
        if (propertyIds.length > 0) {
          const { data: properties, error: propError } = await supabase
            .from('properties')
            .select('id, name')
            .in('id', propertyIds)
          
          if (propError) {
            console.error('[Calendar API] Error fetching event properties:', propError)
          } else if (properties) {
            propertiesMap = Object.fromEntries(properties.map(p => [p.id, p]))
          }
        }
        
        for (const event of events) {
          const property = event.property_id ? propertiesMap[event.property_id] : undefined
          calendarItems.push(eventToCalendarItem({
            ...event,
            color: (event.color || 'blue') as EventColor,
            property: property,
          } as CalendarEvent))
        }
      }
    }

    // Sort by start date
    calendarItems.sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )

    console.log('[Calendar API] Total items:', calendarItems.length)

    return NextResponse.json({
      data: calendarItems,
      count: calendarItems.length,
    })
  } catch (error) {
    console.error('[Calendar API] GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/calendar
 * Cria um novo evento no calendário (compromisso)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { data: user } = await getOrCreateUser(userId, supabase)

    const body = await request.json()
    const validationResult = createCalendarEventSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    const eventData = validationResult.data

    // Verificar se property_id pertence ao usuário (se fornecido)
    if (eventData.property_id) {
      const { data: property } = await supabase
        .from('properties')
        .select('id')
        .eq('id', eventData.property_id)
        .eq('user_id', user.id)
        .single()

      if (!property) {
        return NextResponse.json(
          { error: 'Imóvel não encontrado' },
          { status: 404 }
        )
      }
    }

    // Criar evento
    const { data: event, error } = await supabase
      .from('calendar_events')
      .insert({
        user_id: user.id,
        title: eventData.title,
        description: eventData.description,
        event_type: eventData.event_type,
        start_date: eventData.start_date,
        start_time: eventData.start_time,
        end_date: eventData.end_date,
        end_time: eventData.end_time,
        all_day: eventData.all_day,
        property_id: eventData.property_id,
        color: eventData.color,
      })
      .select()
      .single()

    if (error) {
      console.error('[Calendar API] Error creating calendar event:', error)
      return NextResponse.json(
        { error: 'Erro ao criar evento' },
        { status: 500 }
      )
    }

    // Fetch property if exists
    let property: { id: string; name: string } | undefined
    if (event.property_id) {
      const { data: propData } = await supabase
        .from('properties')
        .select('id, name')
        .eq('id', event.property_id)
        .single()
      if (propData) {
        property = propData
      }
    }

    return NextResponse.json({
      data: eventToCalendarItem({
        ...event,
        color: (event.color || 'blue') as EventColor,
        property: property,
      } as CalendarEvent),
      message: 'Evento criado com sucesso',
    }, { status: 201 })
  } catch (error) {
    console.error('[Calendar API] POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
