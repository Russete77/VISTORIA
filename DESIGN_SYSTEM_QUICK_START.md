# Design System VistorIA Pro - Quick Start Guide

## Componentes Prontos para Uso

### 1. Buttons

```tsx
import { Button } from '@/components/ui/button'
import { ArrowRight, Plus } from 'lucide-react'

// Primary
<Button>Confirmar</Button>

// Secondary
<Button variant="outline">Cancelar</Button>

// Danger
<Button variant="destructive">Deletar</Button>

// Com ícone
<Button>
  <Plus className="mr-2 h-5 w-5" />
  Nova Vistoria
</Button>

// Tamanhos
<Button size="sm">Pequeno</Button>
<Button size="lg">Grande</Button>
```

### 2. Badges

```tsx
import { Badge } from '@/components/ui/badge'

<Badge variant="success">Ativo</Badge>
<Badge variant="warning">Pendente</Badge>
<Badge variant="danger">Crítico</Badge>
<Badge variant="info">Nova</Badge>
<Badge variant="primary">Destaque</Badge>
```

### 3. Inputs

```tsx
import { Input } from '@/components/ui/input'

<Input placeholder="Digite seu email" type="email" />
<Input placeholder="Senha" type="password" />
<Input disabled value="Campo desabilitado" />
```

### 4. Cards

```tsx
import { Card } from '@/components/ui/card'

<Card className="p-6">
  <h3 className="text-xl font-semibold mb-2">Título</h3>
  <p className="text-neutral-600">Conteúdo do card...</p>
</Card>
```

---

## Componentes VistorIA Específicos

### 1. InspectionBadge

```tsx
import { InspectionBadge } from '@/components/vistoria'

<InspectionBadge status="draft" />        // Rascunho (cinza)
<InspectionBadge status="in_progress" />  // Em Andamento (azul, pulsante)
<InspectionBadge status="completed" />    // Concluída (verde)
<InspectionBadge status="signed" />       // Assinada (indigo)
```

### 2. IssueSeverity

```tsx
import { IssueSeverity } from '@/components/vistoria'

<IssueSeverity severity="low" />      // Baixa (cinza)
<IssueSeverity severity="medium" />   // Média (amarelo)
<IssueSeverity severity="high" />     // Alta (vermelho)
<IssueSeverity severity="urgent" />   // Urgente (vermelho escuro, pulsante)

// Sem label
<IssueSeverity severity="high" showLabel={false} />
```

### 3. PropertyCard

```tsx
import { PropertyCard } from '@/components/vistoria'

<PropertyCard
  id="prop-123"
  title="Apartamento Jardim Paulista"
  address="Rua Haddock Lobo, 595 - São Paulo, SP"
  thumbnail="/images/property.jpg"
  status="completed"
  lastInspection={new Date()}
  inspectionCount={3}
/>
```

### 4. RoomProgress

```tsx
import { RoomProgress } from '@/components/vistoria'

// Progresso parcial
<RoomProgress completed={3} total={5} size="md" />

// Completo (mostra checkmark)
<RoomProgress completed={5} total={5} size="lg" />

// Tamanhos
<RoomProgress completed={2} total={4} size="sm" />
<RoomProgress completed={2} total={4} size="md" />
<RoomProgress completed={2} total={4} size="lg" />
```

### 5. PhotoMarker

```tsx
import { PhotoMarker } from '@/components/vistoria'

<div className="relative">
  <img src="/photo.jpg" alt="Foto do ambiente" />

  <PhotoMarker
    x={0.2}          // 20% da esquerda
    y={0.3}          // 30% do topo
    width={0.15}     // 15% de largura
    height={0.2}     // 20% de altura
    issueType="Umidade na parede"
    description="Mancha de umidade detectada no canto superior esquerdo"
    severity="high"
    onClick={() => console.log('Marker clicado')}
  />
</div>
```

---

## Cores Tailwind

### Primary (Indigo)
```tsx
<div className="bg-primary-50">Muito claro</div>
<div className="bg-primary-600">Principal</div>
<div className="bg-primary-900">Muito escuro</div>
<div className="text-primary-600">Texto primary</div>
```

### Neutral (Slate)
```tsx
<div className="bg-neutral-50">Background claro</div>
<div className="bg-neutral-100">Background cards</div>
<div className="border border-neutral-200">Borda padrão</div>
<div className="text-neutral-600">Texto secundário</div>
<div className="text-neutral-900">Texto principal</div>
```

### Semânticas
```tsx
// Success (Verde)
<div className="bg-success-100 text-success-700">Sucesso</div>

// Warning (Amarelo)
<div className="bg-warning-100 text-warning-700">Aviso</div>

// Danger (Vermelho)
<div className="bg-danger-100 text-danger-700">Erro</div>

// Info (Azul)
<div className="bg-info-100 text-info-700">Informação</div>
```

---

## Tipografia

```tsx
// Headings
<h1>Título H1</h1>                    // text-4xl md:text-5xl font-bold
<h2>Título H2</h2>                    // text-3xl md:text-4xl font-bold
<h3>Título H3</h3>                    // text-2xl md:text-3xl font-bold

// Body
<p className="text-lg">Large text</p>
<p className="text-base">Base text</p>
<p className="text-sm">Small text</p>
<p className="text-xs">Extra small text</p>

// Colors
<p className="text-neutral-900">Texto principal</p>
<p className="text-neutral-600">Texto secundário</p>
<p className="text-neutral-500">Texto terciário</p>

// Weights
<p className="font-normal">Normal (400)</p>
<p className="font-medium">Medium (500)</p>
<p className="font-semibold">Semibold (600)</p>
<p className="font-bold">Bold (700)</p>
```

---

## Layout Classes Úteis

```tsx
// Container centralizado
<div className="container-custom">
  {/* Conteúdo */}
</div>

// Cards Grid
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  <Card>Card 1</Card>
  <Card>Card 2</Card>
  <Card>Card 3</Card>
</div>

// Flexbox comum
<div className="flex items-center gap-4">
  <Icon />
  <span>Texto ao lado</span>
</div>

// Stack vertical
<div className="flex flex-col gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

---

## Spacing (Gap, Padding, Margin)

```tsx
// Gap
<div className="flex gap-2">...</div>   // 8px
<div className="flex gap-4">...</div>   // 16px
<div className="flex gap-6">...</div>   // 24px

// Padding
<div className="p-4">...</div>          // 16px all sides
<div className="px-6 py-4">...</div>    // 24px horizontal, 16px vertical

// Margin
<div className="mb-4">...</div>         // 16px bottom
<div className="mt-8">...</div>         // 32px top
```

---

## Border Radius

```tsx
<div className="rounded-md">...</div>   // 8px (padrão)
<div className="rounded-lg">...</div>   // 12px (cards)
<div className="rounded-xl">...</div>   // 16px (modals)
<div className="rounded-full">...</div> // Circle
```

---

## Shadows

```tsx
<Card className="shadow-sm">Sombra sutil</Card>
<Card className="shadow-md">Sombra média</Card>
<Card className="shadow-lg">Sombra grande</Card>
<Card className="shadow-xl">Sombra extra</Card>
```

---

## Transitions e Animations

```tsx
// Transition básica
<div className="transition-all duration-150">...</div>

// Hover effects
<div className="hover:bg-neutral-100">Hover background</div>
<div className="hover:scale-105">Hover scale</div>
<div className="hover:shadow-lg">Hover shadow</div>

// Animações prontas
<div className="animate-fade-in">Fade in</div>
<div className="animate-slide-up">Slide up</div>
<div className="animate-scale-in">Scale in</div>
```

---

## Ícones (Lucide React)

```tsx
import {
  Home,
  Building2,
  Camera,
  Settings,
  Plus,
  ArrowRight,
  Check,
  X
} from 'lucide-react'

<Home className="h-5 w-5" />
<Building2 className="h-6 w-6 text-primary-600" />
<Camera className="h-8 w-8 text-neutral-400" />
```

---

## Exemplo Completo: Form de Login

```tsx
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export function LoginForm() {
  return (
    <Card className="max-w-md mx-auto p-8">
      <h2 className="text-2xl font-bold mb-6 text-neutral-900">
        Entrar na Plataforma
      </h2>

      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Email
          </label>
          <Input
            type="email"
            placeholder="seu@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Senha
          </label>
          <Input
            type="password"
            placeholder="••••••••"
          />
        </div>

        <Button className="w-full" size="lg">
          Entrar
        </Button>

        <Button variant="ghost" className="w-full">
          Esqueci minha senha
        </Button>
      </form>
    </Card>
  )
}
```

---

## Rotas Disponíveis

- `/` - Landing Page
- `/dashboard` - Dashboard Principal
- `/dashboard/properties` - Lista de Imóveis
- `/dashboard/inspections` - Lista de Vistorias
- `/dashboard/settings` - Configurações

---

## Comandos

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Start produção
npm run start
```

---

## Próximos Componentes Recomendados

1. **Modal/Dialog** - Para confirmações e formulários
2. **Dropdown Menu** - Para actions em cards
3. **Toast/Notifications** - Feedback de ações
4. **Skeleton Loader** - Loading states
5. **Empty State** - Para listas vazias
6. **Error State** - Para erros de formulário

---

Pronto! Você já pode começar a usar todos esses componentes no VistorIA Pro. Para mais detalhes, consulte o arquivo `DESIGN_SYSTEM_IMPLEMENTATION.md`.
