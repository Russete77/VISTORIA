# SOLUÇÃO DEFINITIVA - BUG DE COMPARAÇÃO DE VISTORIAS

## DIAGNÓSTICO COMPLETO

### PROBLEMA REAL IDENTIFICADO

**Status**: CAUSA RAIZ ENCONTRADA
**Severidade**: CRÍTICA
**Tipo**: Problema de DADOS, não de código

### O QUE ESTÁ ACONTECENDO

Os logs mostram:
```
[Comparison] Room "quarto1": 1 before, 0 after
[Comparison] Room "quarto": 0 before, 1 after
moveInNames: [ '"quarto1"' ]
moveOutNames: [ '"quarto"' ]
```

**Análise**:
- Move-in tem fotos no room_name = `"quarto1"` (com o número 1)
- Move-out tem fotos no room_name = `"quarto"` (sem o número 1)
- São NOMES COMPLETAMENTE DIFERENTES, não é questão de espaços!
- A normalização `trim()` e `toLowerCase()` NÃO resolve porque `"quarto1" !== "quarto"`

### POR QUE ISSO ACONTECEU?

#### Cenário A: Usuário criou rooms com nomes diferentes (intencional)
- Na vistoria de entrada, criou um cômodo chamado "Quarto 1" ou "quarto1"
- Na vistoria de saída, criou um NOVO cômodo chamado "Quarto" ou "quarto"
- São cômodos DIFERENTES na perspectiva do usuário
- O matching CORRETO é NÃO fazer match (comportamento atual está certo!)

#### Cenário B: Usuário quis usar o MESMO cômodo mas digitou diferente (erro humano)
- Na entrada, digitou "quarto1"
- Na saída, digitou "quarto" pensando ser o mesmo
- Sistema interpretou como cômodos diferentes
- SOLUÇÃO: Implementar fuzzy matching ou sugestões de nomes

#### Cenário C: Sistema gerou nomes diferentes automaticamente
- Frontend pode estar auto-incrementando nomes ("Quarto 1", "Quarto 2", etc.)
- Se usuário não prestou atenção, pode ter criado nomes diferentes
- SOLUÇÃO: Melhorar UX para reutilizar nomes de vistorias anteriores

---

## ANÁLISE DO FLUXO DE DADOS

### 1. Como rooms são criados?

**Arquivo**: `src/app/dashboard/inspections/[id]/capture/page.tsx`

```typescript
// Linha 131-143: Usuário cria room manualmente
const trimmedName = newRoomName.trim()  // ✅ TRIM correto
const response = await fetch(`/api/inspections/${id}/rooms`, {
  method: 'POST',
  body: JSON.stringify({
    name: trimmedName,  // ✅ Nome limpo
    category: newRoomType,
  }),
})
```

**Conclusão**: Frontend ESTÁ fazendo TRIM corretamente ao criar rooms.

### 2. Como fotos são salvas?

**Arquivo**: `src/app/api/inspections/[id]/photos/route.ts`

```typescript
// Linha 57-58: Backend recebe e limpa room_name
const roomNameRaw = formData.get('room_name') as string
const roomName = (roomNameRaw || 'Sem nome').trim()  // ✅ TRIM correto

// Linha 100: Salva no banco
room_name: roomName,  // ✅ Nome limpo
```

**Conclusão**: Backend ESTÁ fazendo TRIM corretamente ao salvar fotos.

### 3. Como comparação agrupa fotos?

**Arquivo**: `src/app/api/comparisons/route.ts`

```typescript
// Linha 494-496: Normalização
function normalizeRoomName(name: string): string {
  return name.trim().toLowerCase()  // ✅ CORRETO
}

// Linha 519-541: Agrupamento
for (const photo of moveInPhotos) {
  const normalizedName = normalizeRoomName(photo.room_name)  // ✅ NORMALIZA
  roomMap.set(normalizedName, { ... })
}
```

**Conclusão**: Comparação ESTÁ normalizando corretamente.

### 4. ENTÃO QUAL É O PROBLEMA?

Os nomes NO BANCO DE DADOS são REALMENTE DIFERENTES:
- Move-in: `"quarto1"` (salvo assim pelo usuário)
- Move-out: `"quarto"` (salvo assim pelo usuário)

**Normalização não ajuda**:
- `normalizeRoomName("quarto1")` = `"quarto1"`
- `normalizeRoomName("quarto")` = `"quarto"`
- `"quarto1" !== "quarto"` ❌

---

## SOLUÇÕES POSSÍVEIS

### OPÇÃO A: FUZZY MATCHING (RECOMENDADA)

Implementar matching inteligente que reconheça nomes similares:
- "quarto1" → "quarto" (mesmo sem o número)
- "Sala de Estar" → "sala estar" (sem preposições)
- "Cozinha " → "cozinha" (trim já existe)

**Vantagens**:
- Resolve automaticamente erros humanos
- Não requer ação do usuário
- Funciona para dados existentes

**Desvantagens**:
- Pode fazer matches indesejados (ex: "Quarto 1" vs "Quarto 2")
- Precisa ser configurável (strict mode)

### OPÇÃO B: SUGESTÕES INTELIGENTES NA UX

Ao criar vistoria de saída, sugerir nomes da vistoria de entrada:
- Dropdown mostra "quarto1" (da entrada)
- Usuário clica e usa o mesmo nome
- Garante consistência desde o início

**Vantagens**:
- Mais previsível para o usuário
- Evita matches incorretos
- Não afeta dados existentes

**Desvantagens**:
- Não resolve problema de dados atuais
- Requer mudanças na UX
- Usuário precisa lembrar de usar sugestão

### OPÇÃO C: NORMALIZAÇÃO MAIS AGRESSIVA

Remover números, artigos e preposições:
- "quarto1" → "quarto"
- "sala de estar" → "sala estar"
- "cozinha 2" → "cozinha"

**Vantagens**:
- Simples de implementar
- Resolve muitos casos automaticamente

**Desvantagens**:
- ALTO RISCO de matches incorretos
- "Quarto 1" = "Quarto 2" = "Quarto 3" (RUIM!)
- Pode agrupar cômodos que são realmente diferentes

### OPÇÃO D: SCRIPT MANUAL DE CORREÇÃO

Criar ferramenta admin para usuário corrigir nomes manualmente:
- Listar todas as comparações com 0 matches
- Permitir usuário mapear "quarto1" → "quarto"
- Re-processar comparação

**Vantagens**:
- Usuário tem controle total
- Sem risco de matches incorretos

**Desvantagens**:
- Requer intervenção manual
- Não escala para muitos usuários
- UX ruim

---

## SOLUÇÃO RECOMENDADA: HÍBRIDA

Combinar OPÇÃO A (Fuzzy Matching) + OPÇÃO B (Sugestões UX):

### PARTE 1: Fuzzy Matching Inteligente

Implementar sistema de similaridade que:

1. **Remove sufixos numéricos opcionalmente**:
   - `"quarto1"` → match com `"quarto"`
   - `"sala 2"` → match com `"sala"`
   - MAS: `"quarto 1"` NÃO match com `"quarto 2"` (ambos têm números)

2. **Calcula score de similaridade**:
   - Usa Levenshtein distance ou similar
   - Threshold configurável (ex: 80% de similaridade)
   - Prioriza matches exatos sobre fuzzy

3. **Modo configurável**:
   - `strict`: Apenas matches exatos
   - `standard`: Fuzzy com threshold 85%
   - `relaxed`: Fuzzy com threshold 70%

### PARTE 2: Melhorar UX

1. **Reutilizar nomes da vistoria anterior**:
   - Ao criar vistoria de saída, buscar vistoria de entrada
   - Pré-popular dropdown com nomes da entrada
   - Permitir criar novos se necessário

2. **Validação e avisos**:
   - Se nome é MUITO similar a existente, avisar usuário
   - "Detectamos 'quarto1', você quis dizer 'quarto'?"

### PARTE 3: Migração de Dados Existentes

Script SQL para corrigir casos óbvios:

```sql
-- Identificar pares de nomes similares
WITH room_pairs AS (
  SELECT DISTINCT
    p1.room_name as name1,
    p2.room_name as name2
  FROM inspection_photos p1
  JOIN inspection_photos p2
    ON p1.inspection_id != p2.inspection_id
    AND LOWER(TRIM(p1.room_name)) = LOWER(TRIM(REGEXP_REPLACE(p2.room_name, '[0-9]+$', '')))
  WHERE p1.room_name != p2.room_name
)
SELECT * FROM room_pairs;

-- Corrigir apenas se usuário confirmar manualmente
```

---

## IMPLEMENTAÇÃO DETALHADA

### Passo 1: Criar função de Fuzzy Matching

**Arquivo**: `src/lib/utils/room-matching.ts` (NOVO)

```typescript
/**
 * Calcula similaridade entre dois nomes de cômodos
 * Retorna score de 0 (completamente diferentes) a 1 (idênticos)
 */
export function calculateRoomSimilarity(
  name1: string,
  name2: string
): number {
  // Normalizar ambos
  const norm1 = normalizeForMatching(name1)
  const norm2 = normalizeForMatching(name2)

  // Exact match
  if (norm1 === norm2) return 1.0

  // Remover sufixos numéricos e tentar novamente
  const withoutNumbers1 = norm1.replace(/\s*\d+\s*$/, '').trim()
  const withoutNumbers2 = norm2.replace(/\s*\d+\s*$/, '').trim()

  if (withoutNumbers1 === withoutNumbers2) {
    // Se ambos têm números diferentes, não fazer match
    // Ex: "quarto 1" vs "quarto 2" → NÃO match
    if (norm1 !== withoutNumbers1 && norm2 !== withoutNumbers2) {
      return 0.5  // Similaridade média (não fazer match por padrão)
    }
    // Se apenas um tem número, provavelmente é o mesmo cômodo
    // Ex: "quarto1" vs "quarto" → MATCH
    return 0.9
  }

  // Levenshtein distance
  const distance = levenshteinDistance(norm1, norm2)
  const maxLen = Math.max(norm1.length, norm2.length)
  return 1 - (distance / maxLen)
}

function normalizeForMatching(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')  // Remove acentos
    .replace(/[\u0300-\u036f]/g, '')
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

/**
 * Threshold de similaridade baseado no strictness level
 */
export function getSimilarityThreshold(
  strictness: 'standard' | 'strict' | 'very_strict'
): number {
  switch (strictness) {
    case 'very_strict':
      return 1.0  // Apenas matches exatos
    case 'strict':
      return 0.90  // Similaridade >= 90%
    case 'standard':
      return 0.85  // Similaridade >= 85%
    default:
      return 0.85
  }
}
```

### Passo 2: Atualizar função de matching na comparação

**Arquivo**: `src/app/api/comparisons/route.ts`

```typescript
import { calculateRoomSimilarity, getSimilarityThreshold } from '@/lib/utils/room-matching'

/**
 * Agrupa fotos por cômodo para comparação com FUZZY MATCHING
 */
function matchPhotosByRoom(
  moveInPhotos: InspectionPhoto[],
  moveOutPhotos: InspectionPhoto[],
  strictnessLevel: 'standard' | 'strict' | 'very_strict' = 'standard'
): Array<{
  roomName: string
  beforePhotos: InspectionPhoto[]
  afterPhotos: InspectionPhoto[]
  matchScore: number  // ← NOVO: score do match
}> {
  const threshold = getSimilarityThreshold(strictnessLevel)

  // Criar mapa de rooms da move-in
  const roomMap = new Map<string, {
    originalName: string
    beforePhotos: InspectionPhoto[]
    afterPhotos: InspectionPhoto[]
    matchScore: number
  }>()

  // Adicionar fotos da move-in
  for (const photo of moveInPhotos) {
    const key = photo.room_name.trim()
    if (!roomMap.has(key)) {
      roomMap.set(key, {
        originalName: photo.room_name.trim(),
        beforePhotos: [],
        afterPhotos: [],
        matchScore: 1.0  // Exact match com si mesmo
      })
    }
    roomMap.get(key)!.beforePhotos.push(photo)
  }

  // Fazer fuzzy matching das fotos da move-out
  for (const photo of moveOutPhotos) {
    const photoRoomName = photo.room_name.trim()
    let bestMatch: string | null = null
    let bestScore = 0

    // Tentar exact match primeiro
    if (roomMap.has(photoRoomName)) {
      bestMatch = photoRoomName
      bestScore = 1.0
    } else {
      // Fuzzy matching: encontrar melhor match
      for (const [existingKey, data] of roomMap.entries()) {
        const score = calculateRoomSimilarity(existingKey, photoRoomName)
        if (score >= threshold && score > bestScore) {
          bestMatch = existingKey
          bestScore = score
        }
      }
    }

    if (bestMatch) {
      // Match encontrado
      roomMap.get(bestMatch)!.afterPhotos.push(photo)
      // Atualizar score se não for exact match
      if (bestScore < 1.0) {
        roomMap.get(bestMatch)!.matchScore = Math.min(
          roomMap.get(bestMatch)!.matchScore,
          bestScore
        )
      }
    } else {
      // Sem match: criar novo room
      roomMap.set(photoRoomName, {
        originalName: photoRoomName,
        beforePhotos: [],
        afterPhotos: [photo],
        matchScore: 1.0
      })
    }
  }

  // Converter para array
  return Array.from(roomMap.values()).map(data => ({
    roomName: data.originalName,
    beforePhotos: data.beforePhotos,
    afterPhotos: data.afterPhotos,
    matchScore: data.matchScore
  }))
}
```

### Passo 3: Atualizar chamada da função

**Arquivo**: `src/app/api/comparisons/route.ts` (linha 319)

```typescript
// ANTES
const photosByRoom = matchPhotosByRoom(moveInPhotos, moveOutPhotos)

// DEPOIS
const photosByRoom = matchPhotosByRoom(
  moveInPhotos,
  moveOutPhotos,
  strictnessLevel  // Usar strictness configurado pelo usuário
)
```

### Passo 4: Adicionar logs do fuzzy matching

**Arquivo**: `src/app/api/comparisons/route.ts` (linha 328)

```typescript
console.log(`[Comparison ${comparisonId}] Photo matching summary (threshold: ${getSimilarityThreshold(strictnessLevel)}):`)
for (const { roomName, beforePhotos, afterPhotos, matchScore } of photosByRoom) {
  const matchType = matchScore === 1.0 ? 'EXACT' : `FUZZY(${(matchScore * 100).toFixed(0)}%)`
  console.log(`[Comparison ${comparisonId}] Room "${roomName}": ${beforePhotos.length} before, ${afterPhotos.length} after [${matchType}]`)

  if (beforePhotos.length === 0 || afterPhotos.length === 0) {
    console.warn(`[Comparison ${comparisonId}] Room "${roomName}" has incomplete pairs`)
  }
}
```

### Passo 5: Melhorar UX de criação de rooms

**Arquivo**: `src/app/dashboard/inspections/[id]/capture/page.tsx`

```typescript
// ADICIONAR: Buscar rooms da vistoria anterior ao carregar
useEffect(() => {
  fetchRooms()
  fetchPhotos()
  fetchPreviousInspectionRooms()  // ← NOVO
}, [id])

const fetchPreviousInspectionRooms = async () => {
  try {
    // Buscar vistoria atual
    const inspRes = await fetch(`/api/inspections/${id}`)
    const { inspection } = await inspRes.json()

    // Se for move_out, buscar rooms da move_in
    if (inspection.type === 'move_out') {
      const prevRes = await fetch(
        `/api/inspections?property_id=${inspection.property_id}&type=move_in&limit=1`
      )
      const { inspections } = await prevRes.json()

      if (inspections?.length > 0) {
        const prevInspectionId = inspections[0].id
        const roomsRes = await fetch(`/api/inspections/${prevInspectionId}/rooms`)
        const { rooms: prevRooms } = await roomsRes.json()

        // Armazenar para sugestões
        setSuggestedRooms(prevRooms.map(r => r.name))
      }
    }
  } catch (error) {
    console.error('Error fetching previous rooms:', error)
  }
}

// ADICIONAR: State para sugestões
const [suggestedRooms, setSuggestedRooms] = useState<string[]>([])

// MODIFICAR: Input do nome do room com autocomplete
<div className="space-y-2">
  <Label>Nome do Cômodo</Label>
  <Input
    placeholder="Digite ou selecione da lista"
    value={newRoomName}
    onChange={(e) => setNewRoomName(e.target.value)}
    list="suggested-rooms"  // ← Usar datalist HTML5
  />
  <datalist id="suggested-rooms">
    {suggestedRooms.map(name => (
      <option key={name} value={name} />
    ))}
  </datalist>
  {suggestedRooms.length > 0 && (
    <p className="text-xs text-neutral-600">
      Sugestões da vistoria anterior disponíveis
    </p>
  )}
</div>
```

---

## SCRIPT DE MIGRAÇÃO PARA DADOS EXISTENTES

**Arquivo**: `supabase/migrations/009_fix_room_name_fuzzy_matching.sql`

```sql
-- Migration 009: Corrigir room_names com fuzzy matching
-- Data: 2025-11-20
-- Descrição: Normalizar nomes similares para facilitar comparações

-- Passo 1: Identificar casos óbvios que podem ser corrigidos
-- Ex: "quarto1" → "quarto", "sala 1" → "sala"
CREATE TEMP TABLE room_name_fixes AS
SELECT DISTINCT
  room_name as old_name,
  TRIM(REGEXP_REPLACE(room_name, '\s*[0-9]+\s*$', '')) as suggested_new_name
FROM inspection_photos
WHERE room_name ~ '\s*[0-9]+\s*$'  -- Termina com número
  AND room_name != TRIM(REGEXP_REPLACE(room_name, '\s*[0-9]+\s*$', ''));

-- Passo 2: Mostrar o que SERIA corrigido (DRY RUN)
SELECT
  old_name,
  suggested_new_name,
  COUNT(*) as affected_photos,
  STRING_AGG(DISTINCT inspection_id::text, ', ') as inspections
FROM inspection_photos ip
JOIN room_name_fixes rnf ON ip.room_name = rnf.old_name
GROUP BY old_name, suggested_new_name
ORDER BY affected_photos DESC;

-- Passo 3: APLICAR CORREÇÕES (comentado por segurança)
-- DESCOMENTE APENAS APÓS REVISAR O DRY RUN ACIMA!

-- UPDATE inspection_photos ip
-- SET room_name = rnf.suggested_new_name
-- FROM room_name_fixes rnf
-- WHERE ip.room_name = rnf.old_name;

-- UPDATE comparison_differences cd
-- SET room_name = rnf.suggested_new_name
-- FROM room_name_fixes rnf
-- WHERE cd.room_name = rnf.old_name;

-- Passo 4: Verificação final
-- SELECT
--   room_name,
--   COUNT(*) as photo_count,
--   COUNT(DISTINCT inspection_id) as inspection_count
-- FROM inspection_photos
-- GROUP BY room_name
-- ORDER BY room_name;

-- Limpar tabela temporária
DROP TABLE IF EXISTS room_name_fixes;
```

---

## PLANO DE ROLLOUT

### Fase 1: Implementação (Semana 1)
1. Criar `room-matching.ts` com fuzzy matching
2. Atualizar `matchPhotosByRoom()` na API de comparações
3. Adicionar logs detalhados
4. **TESTAR** com dados existentes

### Fase 2: Validação (Semana 1-2)
1. Rodar migration em modo DRY RUN no Supabase
2. Revisar sugestões de correção
3. Aplicar correções se fizerem sentido
4. Re-processar comparações afetadas

### Fase 3: UX Improvements (Semana 2-3)
1. Adicionar sugestões de nomes anteriores
2. Adicionar validação de nomes similares
3. Melhorar feedback visual

### Fase 4: Monitoramento (Semana 3-4)
1. Monitorar logs de fuzzy matching
2. Ajustar thresholds se necessário
3. Coletar feedback de usuários

---

## TESTES NECESSÁRIOS

### Teste 1: Fuzzy Matching Básico
```typescript
// room-matching.test.ts
describe('calculateRoomSimilarity', () => {
  it('should match "quarto1" with "quarto"', () => {
    const score = calculateRoomSimilarity('quarto1', 'quarto')
    expect(score).toBeGreaterThanOrEqual(0.9)
  })

  it('should NOT match "quarto 1" with "quarto 2"', () => {
    const score = calculateRoomSimilarity('quarto 1', 'quarto 2')
    expect(score).toBeLessThan(0.9)
  })

  it('should handle accents correctly', () => {
    const score = calculateRoomSimilarity('Cozinha', 'cozinha')
    expect(score).toBe(1.0)
  })
})
```

### Teste 2: End-to-End

1. Criar vistoria de entrada com room "quarto1"
2. Adicionar foto no "quarto1"
3. Criar vistoria de saída com room "quarto"
4. Adicionar foto no "quarto"
5. Criar comparação
6. **ESPERADO**: System deve fazer match "quarto1" ≈ "quarto"
7. **VERIFICAR**: Logs mostram `FUZZY(90%)` match
8. **RESULTADO**: Comparação retorna diferenças detectadas

---

## TEMPO ESTIMADO

- **Implementação Fase 1**: 4 horas
- **Testes**: 2 horas
- **Migration**: 1 hora
- **UX Improvements**: 3 horas
- **TOTAL**: 10 horas (1-2 dias de trabalho)

---

## DECISÃO NECESSÁRIA

Antes de implementar, preciso de sua confirmação:

1. **A solução de fuzzy matching faz sentido?**
2. **Qual threshold você prefere?** (85%, 90%, ou 100% para strict mode)
3. **Quer rodar a migration de correção automática?**
4. **Quer as melhorias de UX também ou apenas o fuzzy matching?**

Aguardo suas instruções para prosseguir com a implementação.
