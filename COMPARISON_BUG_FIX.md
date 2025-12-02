# Comparison Bug Fix - Room Name Mismatch

## Problema Identificado

### Sintoma
Comparações entre vistorias de entrada (move_in) e saída (move_out) não estavam detectando diferenças em cômodos que deveriam ser comparados. O sistema reportava 0 diferenças mesmo quando havia fotos de ambas as vistorias para o mesmo cômodo.

### Causa Raiz
**Mismatch de nomes de cômodos devido a espaços em branco (trailing/leading whitespace).**

Exemplo:
- Vistoria de Entrada: room_name = `"Sala de Estar"`
- Vistoria de Saída: room_name = `"Sala de Estar "` (espaço extra no final)

A função `matchPhotosByRoom()` fazia comparação **exata** de strings:
```typescript
const roomName = photo.room_name  // "Sala de Estar" !== "Sala de Estar "
```

Resultado: O sistema considerava que eram cômodos diferentes, não criando pares de fotos para comparação.

### Impacto
- **Comparações falhando silenciosamente** - não reportavam erro, apenas 0 diferenças
- **Usuários perdendo créditos** - pagavam pela comparação mas não recebiam resultado
- **Dados inconsistentes** - alguns room_names tinham espaços, outros não

---

## Solução Implementada

### 1. Normalização no Matching (API)

**Arquivo**: `src/app/api/comparisons/route.ts`

Criada função helper para normalizar nomes de cômodos:
```typescript
/**
 * Normaliza o nome do cômodo para matching
 * Remove espaços extras e converte para lowercase
 * Usado APENAS para comparação/matching, não para exibição
 */
function normalizeRoomName(name: string): string {
  return name.trim().toLowerCase()
}
```

Aplicada na função `matchPhotosByRoom()`:
- **Matching**: usa nome normalizado (`sala de estar`)
- **Exibição**: preserva nome original (`Sala de Estar`)

**Benefícios**:
- Case-insensitive matching (`"Sala"` = `"sala"`)
- Ignora espaços extras (`"Sala "` = `"Sala"`)
- Preserva formatação original para UI

### 2. Migration para Limpar Dados Existentes

**Arquivo**: `supabase/migrations/008_clean_room_names.sql`

Ações executadas:
```sql
-- 1. Limpar espaços dos dados existentes
UPDATE inspection_photos
SET room_name = TRIM(room_name)
WHERE room_name != TRIM(room_name);

-- 2. Adicionar constraint para prevenir no futuro
ALTER TABLE inspection_photos
ADD CONSTRAINT check_room_name_no_trailing_spaces
CHECK (room_name = TRIM(room_name));

-- 3. Criar índice para performance
CREATE INDEX idx_inspection_photos_room_name_lower
ON inspection_photos (LOWER(TRIM(room_name)));

-- 4. Função helper no banco
CREATE FUNCTION normalize_room_name(name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(TRIM(name));
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

**Benefícios**:
- Corrige dados históricos
- Previne problemas futuros (constraint)
- Melhora performance de queries (índice)
- Disponibiliza função SQL para uso futuro

### 3. Prevenção no Frontend

**Arquivo**: `src/app/dashboard/inspections/[id]/capture/page.tsx`

Trim aplicado ao criar cômodos:
```typescript
const trimmedName = newRoomName.trim()
if (trimmedName.length < 2) {
  toast.error('Nome do cômodo deve ter pelo menos 2 caracteres')
  return
}

// Enviar nome já trimmed
body: JSON.stringify({
  name: trimmedName,
  category: newRoomType,
})
```

**Arquivo**: `src/app/api/inspections/[id]/photos/route.ts`

Trim aplicado ao salvar fotos:
```typescript
const roomNameRaw = formData.get('room_name') as string
const roomName = (roomNameRaw || 'Sem nome').trim()
```

### 4. Logging para Debug

Adicionado logging detalhado quando não há pares de fotos:
```typescript
console.log(`[Comparison ${comparisonId}] Photo matching summary:`)
for (const { roomName, beforePhotos, afterPhotos } of photosByRoom) {
  if (beforePhotos.length === 0 || afterPhotos.length === 0) {
    console.warn(`[Comparison ${comparisonId}] Room "${roomName}" has incomplete photo pairs:`, {
      beforePhotos: beforePhotos.length,
      afterPhotos: afterPhotos.length,
      moveInNames: moveInPhotos.map(p => `"${p.room_name}"`),
      moveOutNames: moveOutPhotos.map(p => `"${p.room_name}"`),
    })
  }
}
```

**Benefícios**:
- Facilita debug de problemas futuros
- Mostra nomes exatos (com aspas) para visualizar espaços
- Identifica quais cômodos não têm pares

### 5. Script de Reprocessamento

**Arquivo**: `scripts/reprocess-comparison.mjs`

Script CLI para reprocessar comparações quebradas:
```bash
node scripts/reprocess-comparison.mjs <comparison-id>
```

Ações do script:
1. Busca comparação no banco
2. Deleta diferenças antigas
3. Reseta status para `processing`
4. Instrui próximos passos

**Uso**:
```bash
# Exemplo
node scripts/reprocess-comparison.mjs 123e4567-e89b-12d3-a456-426614174000
```

---

## Como Aplicar o Fix

### Passo 1: Executar Migration
```bash
# Via Supabase Dashboard
1. Abra SQL Editor
2. Cole o conteúdo de `supabase/migrations/008_clean_room_names.sql`
3. Execute

# Via CLI (se tiver configurado)
supabase db push
```

### Passo 2: Deploy do Código
```bash
# Deploy via Vercel/hosting
git add .
git commit -m "fix(comparisons): resolve room name mismatch bug"
git push origin main
```

### Passo 3: Reprocessar Comparações Quebradas
```bash
# Para cada comparação com 0 diferenças suspeitas
node scripts/reprocess-comparison.mjs <comparison-id>
```

---

## Como Prevenir no Futuro

### ✅ Validação no Frontend
- **SEMPRE** aplicar `.trim()` em inputs de texto antes de enviar
- Validar comprimento após trim
- Usar controlled inputs com normalização

### ✅ Validação no Backend
- **SEMPRE** aplicar `.trim()` ao receber dados do frontend
- Validar com Zod schemas que incluam transformações
- Usar constraints no banco de dados

### ✅ Testing
- Criar testes E2E que simulem whitespace em inputs
- Testar comparações com nomes case-different
- Testar edge cases: espaços múltiplos, tabs, etc.

### ✅ Monitoring
- Monitorar comparações com 0 diferenças
- Alertar quando taxa de "no differences" > 30%
- Log detalhado de matching (já implementado)

---

## Backwards Compatibility

A solução é **100% backwards compatible**:

1. **Dados Existentes**: Migration limpa automaticamente
2. **Exibição**: Nome original preservado (não muda UI)
3. **Matching**: Normalização aplicada apenas internamente
4. **API**: Nenhuma mudança breaking

---

## Testes Recomendados

### Teste Manual
1. Criar vistoria de entrada com cômodo "Sala de Estar"
2. Tirar 2 fotos
3. Criar vistoria de saída com cômodo "Sala de Estar " (espaço extra)
4. Tirar 2 fotos
5. Criar comparação
6. ✅ Deve detectar diferenças (não mais reportar 0)

### Teste Automatizado
```typescript
describe('matchPhotosByRoom', () => {
  it('should match rooms with trailing spaces', () => {
    const moveIn = [{ room_name: 'Sala de Estar', ... }]
    const moveOut = [{ room_name: 'Sala de Estar ', ... }]

    const result = matchPhotosByRoom(moveIn, moveOut)

    expect(result).toHaveLength(1)
    expect(result[0].beforePhotos).toHaveLength(1)
    expect(result[0].afterPhotos).toHaveLength(1)
  })

  it('should match rooms case-insensitively', () => {
    const moveIn = [{ room_name: 'sala de estar', ... }]
    const moveOut = [{ room_name: 'SALA DE ESTAR', ... }]

    const result = matchPhotosByRoom(moveIn, moveOut)

    expect(result).toHaveLength(1)
  })
})
```

---

## Métricas de Sucesso

Após aplicar o fix, monitorar:

- ✅ **Taxa de comparações com 0 diferenças**: deve diminuir
- ✅ **Logs de "incomplete photo pairs"**: deve reduzir drasticamente
- ✅ **Satisfação do usuário**: comparações funcionando corretamente
- ✅ **Performance**: índice deve melhorar queries de matching

---

## Referências

- **Issue**: Room name mismatch causing comparison failures
- **Root Cause**: Whitespace in room_name fields
- **Solution**: Normalization + migration + validation
- **Status**: ✅ Resolvido
- **Data**: 2025-11-20

---

## Contato

Para dúvidas sobre este fix:
- Veja logs: `[Comparison XXX] Room "..." has incomplete photo pairs`
- Execute: `node scripts/reprocess-comparison.mjs <id>`
- Verifique migration: `008_clean_room_names.sql`
