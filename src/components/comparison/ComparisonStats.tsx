/**
 * ComparisonStats Component - VistorIA Pro
 * Exibe estatísticas resumidas de uma comparação
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, TrendingUp, DollarSign, FileSearch } from 'lucide-react'
import type { Comparison } from '@/types/database'

interface ComparisonStatsProps {
  comparison: Comparison
}

export function ComparisonStats({ comparison }: ComparisonStatsProps) {
  const stats = [
    {
      title: 'Total de Diferenças',
      value: comparison.differences_detected,
      icon: FileSearch,
      description: 'Diferenças encontradas',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Danos Novos',
      value: comparison.new_damages,
      icon: AlertTriangle,
      description: 'Causados pelo inquilino',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Desgaste Natural',
      value: comparison.differences_detected - comparison.new_damages,
      icon: TrendingUp,
      description: 'Envelhecimento esperado',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Custo Total Estimado',
      value: `R$ ${(comparison.estimated_repair_cost || 0).toFixed(2)}`,
      icon: DollarSign,
      description: 'Valor de reparos',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
