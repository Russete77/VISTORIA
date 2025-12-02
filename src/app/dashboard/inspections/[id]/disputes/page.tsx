import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'
import { DisputeCard } from '@/components/disputes/DisputeCard'
import { DisputeForm } from '@/components/disputes/DisputeForm'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { AlertCircle, Plus } from 'lucide-react'
import type { DisputeWithInspection } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function InspectionDisputesPage({ params }: PageProps) {
  const { userId } = await auth()
  if (!userId) notFound()

  const { id: inspectionId } = await params
  const supabase = await createClient()

  // Get user
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single()

  if (!user) notFound()

  // Get inspection
  const { data: inspection } = await supabase
    .from('inspections')
    .select('id, type, status, property:properties(id, name, address)')
    .eq('id', inspectionId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!inspection) notFound()

  // Get disputes
  const { data: disputes } = await supabase
    .from('disputes')
    .select(`
      *,
      inspection:inspections(
        id,
        type,
        status,
        property:properties(
          id,
          name,
          address,
          city,
          state
        )
      )
    `)
    .eq('inspection_id', inspectionId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const typedDisputes = (disputes || []) as unknown as DisputeWithInspection[]

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="container max-w-7xl mx-auto px-4">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Vistorias', href: '/dashboard/inspections' },
            { label: inspection.property.name, href: `/dashboard/inspections/${inspectionId}` },
            { label: 'Contestações' },
          ]}
        />

        <div className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Contestações</h1>
              <p className="text-neutral-600 mt-1">
                {inspection.property.name}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-1">
              <DisputeForm inspectionId={inspectionId} />
            </div>

            {/* List */}
            <div className="lg:col-span-2">
              {typedDisputes.length === 0 ? (
                <Card className="p-8 text-center">
                  <AlertCircle className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-neutral-700 mb-2">
                    Nenhuma contestação ainda
                  </h3>
                  <p className="text-neutral-500">
                    Use o formulário ao lado para criar a primeira contestação
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {typedDisputes.map((dispute) => (
                    <DisputeCard key={dispute.id} dispute={dispute} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
