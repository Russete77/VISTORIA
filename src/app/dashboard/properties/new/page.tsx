import { PropertyForm } from '@/components/vistoria/PropertyForm'
import { Building2 } from 'lucide-react'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

/**
 * New Property Page - VistorIA Pro
 * Create a new property
 */

export default function NewPropertyPage() {
  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Imóveis', href: '/dashboard/properties', icon: <Building2 className="h-3.5 w-3.5" /> },
          { label: 'Novo Imóvel' },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
          Novo Imóvel
        </h1>
        <p className="text-neutral-600 mt-1 text-sm sm:text-base">
          Cadastre um novo imóvel no sistema
        </p>
      </div>

      {/* Form */}
      <PropertyForm />
    </div>
  )
}
