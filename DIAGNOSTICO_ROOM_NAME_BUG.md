# DIAGNÓSTICO COMPLETO - BUG DE COMPARAÇÃO DE ROOM_NAMES

## RESUMO EXECUTIVO

**Status**: BUG IDENTIFICADO - Causa raiz encontrada
**Severidade**: ALTA - Afeta funcionalidade core da aplicação
**Impacto**: Comparações retornando 0 diferenças quando deveriam retornar problemas detectados

---

## CAUSA RAIZ IDENTIFICADA

### 1. PROBLEMA PRINCIPAL: Room Names AINDA estão sendo criados COM ESPAÇOS

**Arquivo**: `src/app/api/inspections/[id]/photos/route.ts`
**Linha**: 58

```typescript
const roomNameRaw = formData.get('room_name') as string
const roomName = (roomNameRaw || 'Sem nome').trim() // ✅ ESTÁ FAZENDO TRIM
```

**MAS...**

**Arquivo**: `src/app/dashboard/inspections/[id]/capture/page.tsx`
**Linha**: 244

```typescript
const room = rooms.find((r) => r.id === selectedRoom)
formData.append('room_name', room.name) // ❌ USANDO room.name DIRETO (SEM TRIM)
```

### 2. DE ONDE VEM O `room.name` COM ESPAÇOS?

**Arquivo**: `src/app/api/inspections/[id]/rooms/route.ts`
**Linhas**: 76-81

```typescript
// GET endpoint - constrói rooms a partir de fotos existentes
photos?.forEach((photo, index) => {
  const key = photo.room_name  // ❌ Usando room_name do banco DIRETO
  if (!roomsMap.has(key)) {
    roomsMap.set(key, {
      id: `room-${photo.room_name.toLowerCase().replace(/\s+/g, '-')}`,
      name: photo.room_name,  // ❌ AQUI! Usando nome COM espaços do banco
      type: photo.room_category || 'other',
      ...
    })
  }
})
```

---

## FLUXO DO BUG (CICLO VICIOSO)

```
1. Fotos antigas no banco têm room_name = "quarto " (com espaço)
   ↓
2. GET /api/inspections/[id]/rooms busca fotos e cria objeto Room
   ↓
3. Room criado com name = "quarto " (preserva espaço do banco)
   ↓
4. Frontend exibe dropdown com "quarto " (com espaço)
   ↓
5. Usuário seleciona "quarto " e tira nova foto
   ↓
6. Frontend envia formData com room_name = "quarto " (COM espaço)
   ↓
7. Backend faz TRIM na linha 58... mas a foto ANTIGA ainda tem "quarto "
   ↓
8. Comparação falha porque:
   - Move-in: "quarto " (foto antiga, COM espaço)
   - Move-out: "quarto" (foto nova, SEM espaço após TRIM)
   ↓
9. normalizeRoomName() tenta corrigir mas dados já estão inconsistentes
```

---

## POR QUE A MIGRATION 008 NÃO RESOLVEU?

A migration **DEVERIA ter funcionado**, mas há 3 cenários possíveis:

### Cenário A: Migration não foi executada corretamente
- Constraint pode ter falhado silenciosamente
- UPDATE pode não ter afetado todas as linhas
- **Verificação necessária**: Rodar SQL no Supabase para confirmar

### Cenário B: Migration funcionou, mas novas fotos criaram espaços novamente
- Unlikely, porque o TRIM na linha 58 deveria prevenir isso
- A menos que o frontend esteja enviando algo que bypassa o TRIM

### Cenário C: Fotos antigas ainda existem no banco
- Migration rodou mas dados antigos ainda causam problema
- GET /rooms retorna rooms COM espaços baseado em fotos antigas
- Novas fotos usam esses nomes COM espaços

---

## EVIDÊNCIAS DO PROBLEMA

### Log da Comparação Atual
```
[Comparison xxx] Room "quarto " has incomplete photo pairs: {
  beforePhotos: 0,
  afterPhotos: 1,
  moveInNames: ["quarto1"],
  moveOutNames: ["quarto "]  // ← ESPAÇO NO FINAL
}
```

### Código de Normalização (CORRETO)
```typescript
// route.ts linha 494
function normalizeRoomName(name: string): string {
  return name.trim().toLowerCase()  // ✅ Implementação correta
}
```

### Uso da Normalização (CORRETO)
```typescript
// route.ts linhas 520 e 533
for (const photo of moveInPhotos) {
  const normalizedName = normalizeRoomName(photo.room_name)  // ✅ Está normalizando
  if (!roomMap.has(normalizedName)) {
    roomMap.set(normalizedName, {
      originalName: photo.room_name,  // ✅ Preserva original para exibição
      beforePhotos: [],
      afterPhotos: []
    })
  }
  roomMap.get(normalizedName)!.beforePhotos.push(photo)
}
```

**O CÓDIGO DE COMPARAÇÃO ESTÁ CORRETO!**

O problema é que **novas fotos estão sendo criadas com espaços** porque:
1. Frontend pega `room.name` do GET /rooms
2. GET /rooms retorna `name` direto do banco (com espaços)
3. Frontend envia esse nome COM espaços
4. Backend faz TRIM... mas isso cria INCONSISTÊNCIA com fotos antigas

---

## ARQUIVOS AFETADOS

### 1. Backend - Criação de Fotos
- **Arquivo**: `src/app/api/inspections/[id]/photos/route.ts`
- **Status**: ⚠️ Faz TRIM mas recebe dados já poluídos do frontend
- **Linha crítica**: 58

### 2. Backend - Listagem de Rooms
- **Arquivo**: `src/app/api/inspections/[id]/rooms/route.ts`
- **Status**: ❌ RETORNA room.name COM ESPAÇOS do banco
- **Linhas críticas**: 77-81

### 3. Frontend - Captura de Fotos
- **Arquivo**: `src/app/dashboard/inspections/[id]/capture/page.tsx`
- **Status**: ❌ USA room.name DIRETO sem validação
- **Linha crítica**: 244

### 4. Frontend - Criação de Rooms
- **Arquivo**: `src/app/dashboard/inspections/[id]/capture/page.tsx`
- **Status**: ✅ FAZ TRIM corretamente
- **Linha**: 143 (trimmedName)

### 5. Backend - Comparação
- **Arquivo**: `src/app/api/comparisons/route.ts`
- **Status**: ✅ CÓDIGO CORRETO (normalizeRoomName implementado)
- **Linhas**: 494-496, 520, 533

---

## SOLUÇÕES NECESSÁRIAS

### SOLUÇÃO 1: Corrigir GET /rooms para retornar nomes limpos
**Prioridade**: ALTA
**Arquivo**: `src/app/api/inspections/[id]/rooms/route.ts`
**Linha**: 81

```typescript
// ANTES (ERRADO)
name: photo.room_name,

// DEPOIS (CORRETO)
name: photo.room_name.trim(),
```

### SOLUÇÃO 2: Adicionar TRIM no frontend antes de enviar
**Prioridade**: MÉDIA (defesa em profundidade)
**Arquivo**: `src/app/dashboard/inspections/[id]/capture/page.tsx`
**Linha**: 244

```typescript
// ANTES
formData.append('room_name', room.name)

// DEPOIS
formData.append('room_name', room.name.trim())
```

### SOLUÇÃO 3: Verificar e re-rodar migration se necessário
**Prioridade**: ALTA
**Ação**: Executar SQL de verificação no Supabase

```sql
-- Verificar se ainda existem room_names com espaços
SELECT COUNT(*) as total_with_spaces
FROM inspection_photos
WHERE room_name != TRIM(room_name);

-- Se retornar > 0, rodar limpeza novamente
UPDATE inspection_photos
SET room_name = TRIM(room_name)
WHERE room_name != TRIM(room_name);
```

### SOLUÇÃO 4: Adicionar validação Zod no backend
**Prioridade**: BAIXA (melhoria futura)
**Arquivo**: `src/app/api/inspections/[id]/photos/route.ts`

```typescript
const photoSchema = z.object({
  room_name: z.string().transform(val => val.trim()).refine(val => val.length > 0),
  room_category: z.string(),
  // ...
})
```

---

## PLANO DE AÇÃO RECOMENDADO

### Passo 1: Verificação Imediata
```bash
# Rodar SQL no Supabase para verificar estado atual
SELECT
  room_name,
  '"' || room_name || '"' as quoted,
  LENGTH(room_name) as len,
  COUNT(*) as count
FROM inspection_photos
GROUP BY room_name
HAVING room_name != TRIM(room_name)
ORDER BY count DESC;
```

### Passo 2: Correção no GET /rooms (CRÍTICO)
- Editar `src/app/api/inspections/[id]/rooms/route.ts`
- Linha 81: Adicionar `.trim()` em `photo.room_name`
- Testar GET /rooms retorna nomes sem espaços

### Passo 3: Correção no Frontend (IMPORTANTE)
- Editar `src/app/dashboard/inspections/[id]/capture/page.tsx`
- Linha 244: Adicionar `.trim()` em `room.name`
- Testar criação de foto com room existente

### Passo 4: Re-executar Migration (SE NECESSÁRIO)
- Se verificação do Passo 1 retornar linhas, rodar UPDATE novamente
- Confirmar constraint foi criada corretamente

### Passo 5: Teste End-to-End
1. Criar nova vistoria de entrada
2. Adicionar foto no "quarto1"
3. Criar vistoria de saída
4. Adicionar foto no "quarto1" (usar dropdown)
5. Criar comparação
6. Verificar se diferenças são detectadas

---

## TEMPO ESTIMADO DE CORREÇÃO

- **Implementação das correções**: 15 minutos
- **Testes**: 30 minutos
- **Total**: 45 minutos

---

## PRÓXIMOS PASSOS

1. **VOCÊ DECIDE**: Quer que eu faça as correções agora?
2. **OU** prefere primeiro verificar o estado do banco de dados?
3. **OU** quer que eu crie as correções e você revisa antes de aplicar?

---

## CONCLUSÃO

O bug NÃO está no código de comparação (que está correto).
O bug está na **origem dos dados** - room_names sendo criados/retornados com espaços extras.

**Root Cause**: GET /rooms retorna `photo.room_name` direto do banco sem TRIM.
**Fix**: Adicionar `.trim()` na linha 81 de `rooms/route.ts`.

A migration 008 está correta, mas precisa ser verificada se foi executada completamente.
