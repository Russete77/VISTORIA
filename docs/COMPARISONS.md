# Sistema de Comparações - VistorIA Pro

## Visão Geral

O Sistema de Comparações permite que usuários comparem vistorias de entrada e saída do mesmo imóvel, utilizando IA (Claude Vision) para detectar diferenças automaticamente e estimar custos de reparo.

## Arquitetura

### Fluxo Completo

```
1. Usuário cria comparação (wizard de 4 passos)
   ↓
2. Sistema valida vistorias e créditos
   ↓
3. Comparação criada com status 'processing'
   ↓
4. Background job processa em async:
   - Busca fotos de ambas vistorias
   - Agrupa por cômodo
   - Compara com Claude Vision
   - Salva diferenças detectadas
   ↓
5. Status atualizado para 'completed'
   ↓
6. Crédito debitado do usuário
   ↓
7. Usuário visualiza resultado
```

### Estrutura do Banco de Dados

#### Tabela `comparisons`
```sql
- id (uuid, PK)
- user_id (uuid, FK -> users)
- property_id (uuid, FK -> properties)
- move_in_inspection_id (uuid, FK -> inspections)
- move_out_inspection_id (uuid, FK -> inspections)
- status (pending | processing | completed | failed)
- differences_detected (integer)
- new_damages (integer)
- estimated_repair_cost (numeric)
- report_url (text, nullable)
- report_generated_at (timestamptz, nullable)
- charged_credits (integer, default 1)
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### Tabela `comparison_differences`
```sql
- id (uuid, PK)
- comparison_id (uuid, FK -> comparisons)
- before_photo_id (uuid, FK -> inspection_photos)
- after_photo_id (uuid, FK -> inspection_photos)
- room_name (text)
- description (text)
- severity (low | medium | high | urgent)
- is_new_damage (boolean)
- is_natural_wear (boolean)
- estimated_repair_cost (numeric)
- markers (jsonb) - Coordenadas para marcar na foto
- created_at (timestamptz)
```

## API Endpoints

### GET `/api/comparisons`
Lista todas as comparações do usuário autenticado.

**Query Params:**
- `property_id` (opcional) - Filtrar por propriedade
- `status` (opcional) - Filtrar por status

**Response:**
```json
{
  "comparisons": [
    {
      "id": "uuid",
      "property": { "id": "uuid", "name": "...", "address": "..." },
      "move_in_inspection": { "id": "uuid", ... },
      "move_out_inspection": { "id": "uuid", ... },
      "status": "completed",
      "differences_detected": 5,
      "new_damages": 3,
      "estimated_repair_cost": 850.00,
      "created_at": "2025-01-20T10:00:00Z"
    }
  ],
  "count": 1
}
```

### POST `/api/comparisons`
Cria uma nova comparação.

**Body:**
```json
{
  "property_id": "uuid",
  "move_in_inspection_id": "uuid",
  "move_out_inspection_id": "uuid"
}
```

**Validações:**
- Usuário tem créditos suficientes (mínimo 1)
- Ambas vistorias existem e pertencem ao usuário
- Ambas vistorias são do mesmo imóvel
- Uma vistoria é tipo `move_in` e outra `move_out`
- Não existe comparação duplicada

**Response:**
```json
{
  "comparison": { ... },
  "message": "Comparação criada com sucesso. O processamento está em andamento."
}
```

### GET `/api/comparisons/:id`
Busca comparação específica com todas as diferenças.

**Response:**
```json
{
  "comparison": {
    "id": "uuid",
    "property": { ... },
    "move_in_inspection": { ... },
    "move_out_inspection": { ... },
    "differences": [
      {
        "id": "uuid",
        "room_name": "Sala de Estar",
        "description": "Risco profundo na parede esquerda...",
        "severity": "high",
        "is_new_damage": true,
        "is_natural_wear": false,
        "estimated_repair_cost": 180.00,
        "before_photo_url": "https://...",
        "after_photo_url": "https://..."
      }
    ]
  }
}
```

### DELETE `/api/comparisons/:id`
Deleta uma comparação (hard delete).

**Response:**
```json
{
  "message": "Comparison deleted successfully"
}
```

## Integração com IA

### Biblioteca Utilizada
**Anthropic SDK** - Cliente oficial para Claude API

### Modelo
`claude-sonnet-4-20250514` (Claude 3.5 Sonnet com Vision)

### Função Principal
```typescript
comparePhotos(beforePhotoUrl, afterPhotoUrl, roomName): Promise<DifferenceAnalysisResult>
```

### Prompt Otimizado
O prompt foi cuidadosamente elaborado para:
- Identificar danos causados pelo inquilino vs. desgaste natural
- Classificar gravidade (urgent, high, medium, low)
- Estimar custos de reparo em REAIS (R$)
- Fornecer localização precisa das diferenças
- Retornar JSON estruturado para parsing

### Exemplo de Resposta da IA
```json
{
  "hasDifference": true,
  "differences": [
    {
      "description": "Risco profundo de aproximadamente 40cm na parede esquerda, próximo ao interruptor de luz, expondo a massa corrida",
      "isNewDamage": true,
      "isNaturalWear": false,
      "severity": "high",
      "estimatedCost": 180.00,
      "location": "Parede esquerda, 1.5m de altura, ao lado do interruptor"
    }
  ],
  "overallAssessment": "O cômodo apresenta um dano novo significativo...",
  "totalEstimatedCost": 180.00
}
```

## Sistema de Créditos

### Custo
**1 crédito por comparação**

### Regras de Cobrança
1. Crédito é verificado ANTES de processar
2. Comparação criada com status `processing`
3. Se processamento falhar: status vira `failed`, crédito NÃO é cobrado
4. Se processamento suceder: status vira `completed`, crédito é debitado
5. Registro é criado em `credit_usage` para auditoria

### Lógica de Débito
```typescript
// Deduzir 1 crédito
const newCredits = currentCredits - 1
await supabase.from('users').update({ credits: newCredits }).eq('id', userId)

// Registrar transação
await supabase.from('credit_usage').insert({
  user_id: userId,
  comparison_id: comparisonId,
  credits_used: 1,
  credits_before: currentCredits,
  credits_after: newCredits,
  reason: 'Comparação de vistorias',
})
```

## Interface do Usuário

### Páginas Criadas

#### 1. `/dashboard/comparisons` (Lista)
- Exibe todas as comparações do usuário
- Filtros por status (pending, processing, completed, failed)
- Cards com resumo de cada comparação
- Botão "Nova Comparação"
- Loading states e empty states

#### 2. `/dashboard/comparisons/new` (Wizard)
**Step 1:** Selecionar Propriedade
- Radio buttons com lista de propriedades
- Mostra nome e endereço

**Step 2:** Selecionar Vistoria de Entrada
- Filtra apenas vistorias tipo `move_in`
- Mostra data de criação e status

**Step 3:** Selecionar Vistoria de Saída
- Filtra apenas vistorias tipo `move_out`
- Mostra data de criação e status

**Step 4:** Revisar e Confirmar
- Resumo completo da comparação
- Informações sobre como funciona
- Custo: 1 crédito

#### 3. `/dashboard/comparisons/:id` (Detalhes)
- Header com nome da propriedade e status
- Estatísticas (total diferenças, danos novos, custo)
- Detalhes das vistorias de entrada e saída
- Lista de diferenças agrupadas por cômodo
- Cada diferença mostra:
  - Fotos lado a lado (antes | depois)
  - Descrição detalhada
  - Badges (Dano Novo, Desgaste Natural)
  - Gravidade com cores
  - Custo estimado

### Componentes Criados

#### `ComparisonCard`
Card resumido para lista de comparações
- Mostra status com badge colorido
- Estatísticas se completed
- Loading spinner se processing
- Botão visualizar e deletar

#### `DifferenceCard`
Card de diferença individual
- Fotos lado a lado com Image do Next.js
- Descrição da diferença
- Badges de classificação
- Localização
- Custo de reparo

#### `ComparisonStats`
Grid de 4 cards com estatísticas:
- Total de Diferenças
- Danos Novos
- Desgaste Natural
- Custo Total Estimado

### Integração no Menu
- Item "Comparações" adicionado ao `DashboardSidebar`
- Ícone: `GitCompare`
- Rota: `/dashboard/comparisons`

### Dashboard Principal
- Card "Comparações Recentes" (últimas 3)
- Mostra status, danos novos e custo
- Link "Ver Todas"
- Botão "Criar Primeira Comparação" se vazio
- Ação rápida "Criar Comparação"

## Hooks e Utilitários

### `useComparisons()`
```typescript
const {
  comparisons,
  isLoading,
  error,
  fetchComparisons,
  getComparison,
  createComparison,
  deleteComparison,
} = useComparisons({ autoFetch: true, propertyId: '...' })
```

## Tratamento de Erros

### Validações no Frontend
- Verificação de campos obrigatórios em cada step
- Mensagens de erro claras com `toast`
- Desabilita botões durante loading
- Feedback visual em todos os estados

### Validações no Backend
- Autenticação com Clerk
- Verificação de créditos
- Validação de ownership das vistorias
- Verificação de propriedade matching
- Validação de tipos de vistoria
- Detecção de duplicatas
- Zod schemas para validação de inputs

### Estados de Erro
- **failed**: Erro no processamento, crédito não foi cobrado
- **no differences**: Sucesso, mas nenhuma diferença encontrada
- **timeout**: Se IA demorar muito (implementar retry)

## Próximos Passos

### Melhorias Futuras
1. **Geração de PDF**
   - Template profissional para relatório de comparação
   - Fotos lado a lado
   - Tabela de custos

2. **Email de Notificação**
   - Enviar quando comparação concluir
   - Template HTML com resumo
   - Link direto para visualizar

3. **Comparação de Múltiplas Fotos**
   - Atualmente compara apenas primeira foto de cada cômodo
   - Implementar comparação de todas as fotos

4. **Markers Visuais**
   - Desenhar círculos/setas nas fotos
   - Indicar exatamente onde está a diferença
   - Canvas overlay nas imagens

5. **Histórico de Comparações**
   - Soft delete em vez de hard delete
   - Campo `deleted_at` na tabela

6. **Filtros Avançados**
   - Por gravidade
   - Por custo estimado
   - Por data
   - Por número de danos

7. **Exportação**
   - Excel com lista de danos e custos
   - CSV para análise

8. **Retry Logic**
   - Se IA falhar temporariamente, tentar novamente
   - Exponential backoff

## Troubleshooting

### Comparação fica "processing" indefinidamente
**Causa:** Erro no background job que não foi tratado
**Solução:** Verificar logs do servidor, verificar se ANTHROPIC_API_KEY está configurada

### Crédito foi debitado mas comparação falhou
**Causa:** Bug na lógica de débito
**Solução:** Verificar que débito só acontece APÓS status = 'completed'

### Fotos não aparecem
**Causa:** URLs públicas não estão sendo geradas corretamente
**Solução:** Verificar bucket do Supabase e permissões públicas

### IA não detecta diferenças óbvias
**Causa:** Prompt precisa de ajuste ou fotos de ângulos diferentes
**Solução:** Ajustar prompt ou melhorar instruções para usuário sobre como tirar fotos

## Segurança

### Autenticação
- Todas as rotas protegidas com `auth()` do Clerk
- Verificação de ownership em todas as operações

### Autorização
- Usuário só pode acessar suas próprias comparações
- Verificação de propriedade das vistorias

### Validação de Dados
- Zod schemas em todas as APIs
- Sanitização de inputs
- Validação de UUIDs

### Rate Limiting
**TODO:** Implementar rate limiting para prevenir abuso
- Máximo X comparações por dia
- Máximo Y requisições por minuto

## Monitoramento

### Logs Importantes
```typescript
console.log(`Comparison ${comparisonId} created`)
console.log(`Comparison ${comparisonId} processed successfully`)
console.error('Error processing comparison:', error)
```

### Métricas Sugeridas
- Tempo médio de processamento
- Taxa de sucesso/falha
- Número de diferenças detectadas em média
- Custo médio estimado
- Créditos usados por dia/mês

## Contato

Para dúvidas ou suporte, entre em contato com a equipe de desenvolvimento.
