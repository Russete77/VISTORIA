# Guia de Logs de Debug - VistorIA Pro

Este documento explica como interpretar os logs detalhados adicionados ao sistema de comparações.

---

## Logs de Comparação - Fluxo Completo

### 1. Início do Processamento

```bash
[Comparison abc-123-def] Starting processing...
[Comparison abc-123-def] Move In ID: xxxx-yyyy-1111
[Comparison abc-123-def] Move Out ID: xxxx-yyyy-2222
```

**O que significa:**
- Comparação iniciou com sucesso
- IDs das vistorias de entrada e saída identificados

**Problemas possíveis:**
- Se não aparecer: Função `processComparison()` não foi chamada
- Verificar se o POST /api/comparisons retornou 201

---

### 2. Busca de Vistorias

```bash
[Comparison abc-123-def] Found 2 inspections
[Comparison abc-123-def] User settings: { ai_inspection_strictness: 'standard' }
```

**O que significa:**
- Vistorias encontradas no banco de dados
- Configurações do usuário carregadas

**Problemas possíveis:**
- `Found 0 inspections`: IDs inválidos ou vistorias deletadas
- `User settings: null`: Usuário sem configurações (usa padrão)

---

### 3. Busca de Fotos

```bash
[Comparison abc-123-def] Found photos: { moveIn: 5, moveOut: 5 }
[Comparison abc-123-def] Grouped into 3 room pairs
```

**O que significa:**
- 5 fotos da vistoria de entrada
- 5 fotos da vistoria de saída
- Agrupadas em 3 cômodos (Sala, Quarto, Cozinha)

**Problemas possíveis:**
- `moveIn: 0` ou `moveOut: 0`: Vistoria sem fotos
- `Grouped into 0 room pairs`: Nenhum cômodo com par completo

---

### 4. Matching de Cômodos

```bash
[Comparison abc-123-def] Photo matching summary:
[Comparison abc-123-def] Room "Sala": 2 before, 2 after
[Comparison abc-123-def] Room "Quarto": 1 before, 1 after
[Comparison abc-123-def] Room "Cozinha": 2 before, 2 after
```

**O que significa:**
- Cada cômodo tem fotos de entrada e saída
- Números indicam quantas fotos em cada momento

**Problemas possíveis:**
```bash
[Comparison abc-123-def] Room "Banheiro": 0 before, 2 after
[WARN] Room "Banheiro" has incomplete photo pairs
```
- Cômodo sem par completo será IGNORADO na comparação
- Verificar se nomes dos cômodos são exatamente iguais

---

### 5. Nível de Rigor da IA

```bash
[Comparison abc-123-def] Using strictness level: strict
```

**O que significa:**
- IA usará análise RIGOROSA (detecta pequenos danos)

**Níveis disponíveis:**
- `standard`: Equilibrado (padrão)
- `strict`: Rigoroso (mais crítico)
- `very_strict`: Muito rigoroso (hiper-crítico)

**Prioridade:**
1. Configuração da vistoria de saída
2. Configuração do usuário
3. Padrão (standard)

---

### 6. Processamento por Cômodo

```bash
[Comparison abc-123-def] Processing room "Sala"...
[Comparison abc-123-def] Photo URLs for "Sala": {
  before: 'https://fmmykrcqpguqihidolfj.supabase.co/storage/v1/object/public/...',
  after: 'https://fmmykrcqpguqihidolfj.supabase.co/storage/v1/object/public/...'
}
```

**O que significa:**
- Iniciando análise do cômodo "Sala"
- URLs públicas das fotos obtidas do Supabase Storage

**Problemas possíveis:**
- URLs inválidas: Verificar Supabase Storage
- 404: Foto deletada ou path incorreto

---

### 7. Chamada à API do Claude

```bash
[Claude API] Starting comparison for room: Sala
[Claude API] Strictness level: standard
[Claude API] Before photo URL: https://...
[Claude API] After photo URL: https://...
[Claude API] Calling Anthropic API...
```

**O que significa:**
- Enviando fotos para análise do Claude
- Aguardando resposta

**Problemas possíveis:**
- Se travar aqui: Timeout ou problema na API
- Verificar `ANTHROPIC_API_KEY`
- Verificar conexão de rede

---

### 8. Resposta da API do Claude

```bash
[Claude API] API call completed in 3482ms
[Claude API] Response usage: {
  input_tokens: 2584,
  output_tokens: 456
}
[Claude API] Response text length: 1243 characters
[Claude API] Response text preview: {"hasDifference":true,"differences":[{"description":"Risco profundo...
```

**O que significa:**
- API respondeu em 3.4 segundos
- Consumiu 2584 tokens de entrada + 456 de saída
- Resposta tem 1243 caracteres

**Problemas possíveis:**
- `Error 401`: API Key inválida
- `Error 429`: Rate limit excedido
- `Error 500`: Problema no servidor do Claude

---

### 9. Parse da Resposta

```bash
[Claude API] Parsed result: {
  hasDifference: true,
  differencesCount: 2,
  totalCost: 350
}
```

**O que significa:**
- Resposta parseada com sucesso
- 2 diferenças detectadas
- Custo total estimado: R$ 350,00

**Problemas possíveis:**
```bash
[Claude API] Error parsing AI response: SyntaxError: Unexpected token
```
- JSON inválido retornado pela IA
- Resposta vazia retornada

---

### 10. Salvamento de Diferenças

```bash
[Comparison abc-123-def] Room "Sala" has 2 differences
[Comparison abc-123-def] Saving difference: {
  room: 'Sala',
  description: 'Risco profundo de 40cm na parede esquerda',
  severity: 'high',
  isNewDamage: true,
  cost: 180
}
[Comparison abc-123-def] Difference saved successfully
```

**O que significa:**
- Diferença salva no banco de dados
- Informações armazenadas na tabela `comparison_differences`

**Problemas possíveis:**
```bash
[Comparison abc-123-def] Error saving difference: {
  code: 'PGRST301',
  message: 'Foreign key constraint violation'
}
```
- IDs de fotos inválidos
- Comparação deletada durante processamento

---

### 11. Cômodo Sem Diferenças

```bash
[Comparison abc-123-def] Room "Quarto" has NO differences
```

**O que significa:**
- IA não detectou diferenças neste cômodo
- Estado é igual entre entrada e saída

---

### 12. Resumo Final

```bash
[Comparison abc-123-def] Processing complete. Summary: {
  totalDifferences: 3,
  totalNewDamages: 2,
  totalCost: 530
}
```

**O que significa:**
- 3 diferenças detectadas no total
- 2 são danos novos (não desgaste natural)
- Custo total: R$ 530,00

---

### 13. Atualização da Comparação

```bash
[Comparison abc-123-def] Comparison updated with results
[Comparison abc-123-def] Credits deducted: 10 -> 9
[Comparison abc-123-def] Processing completed successfully!
```

**O que significa:**
- Status mudou de `processing` para `completed`
- 1 crédito deduzido (10 -> 9)
- Processamento concluído com sucesso

---

## Cenários de Erro

### Erro: Fotos Não Encontradas

```bash
[Comparison abc-123-def] Photos not found
[Comparison abc-123-def] FATAL ERROR during processing: Error: Fotos não encontradas
[Comparison abc-123-def] Marked as failed
```

**Causa:**
- Vistorias sem fotos
- Fotos deletadas do Storage

**Solução:**
- Verificar se vistorias têm fotos
- Recriar comparação após adicionar fotos

---

### Erro: API do Claude Falhou

```bash
[Claude API] Error comparing photos with Claude: Error: Request failed with status 401
[Claude API] Error details: {
  name: 'Error',
  message: 'Invalid API key',
  stack: '...'
}
[Comparison abc-123-def] FATAL ERROR during processing
```

**Causa:**
- API Key inválida
- API Key expirada
- Problema de rede

**Solução:**
- Verificar `ANTHROPIC_API_KEY` no `.env.local`
- Testar API Key manualmente
- Verificar conexão com internet

---

### Erro: Room Names Não Fazem Match

```bash
[Comparison abc-123-def] Photo matching summary:
[Comparison abc-123-def] Room "Sala de Estar": 2 before, 0 after
[Comparison abc-123-def] Room "sala de estar": 0 before, 2 after
[WARN] Room "Sala de Estar" has incomplete photo pairs
[WARN] Room "sala de estar" has incomplete photo pairs
```

**Causa:**
- Nomes de cômodos escritos diferente
- "Sala de Estar" ≠ "sala de estar" (case sensitive)

**Solução:**
- Sistema normaliza automaticamente (lowercase + trim)
- Se ainda falhar, verificar espaços extras ou caracteres especiais

---

## Como Usar os Logs para Debug

### 1. Identificar Onde o Processo Parou

Busque o último log da comparação:
```bash
grep "Comparison abc-123-def" logs.txt | tail -20
```

### 2. Verificar se IA Foi Chamada

Busque por "Claude API":
```bash
grep "Claude API" logs.txt
```

Se não aparecer, IA NÃO foi chamada.

### 3. Verificar Erros

Busque por "ERROR" ou "FATAL":
```bash
grep "ERROR" logs.txt
grep "FATAL" logs.txt
```

### 4. Verificar Sucesso

Busque por "completed successfully":
```bash
grep "completed successfully" logs.txt
```

---

## Logs Esperados para Comparação Normal

Para uma comparação com 3 cômodos, você deve ver aproximadamente:

1. **1 log** de início
2. **2 logs** de busca (vistorias + fotos)
3. **3 logs** de matching (1 por cômodo)
4. **1 log** de strictness level
5. **3 blocos** de processamento (1 por cômodo):
   - Processing room
   - Photo URLs
   - Claude API call
   - API response
   - Saving differences
6. **1 log** de resumo
7. **3 logs** de finalização (update + credits + success)

**Total esperado:** ~30-40 linhas de log

---

## Troubleshooting Rápido

| Sintoma | Causa Provável | Solução |
|---------|----------------|---------|
| Nenhum log aparece | `processComparison()` não executou | Verificar POST retornou 201 |
| Para em "Calling Anthropic API..." | Timeout ou erro de rede | Verificar API Key e conexão |
| "Found 0 inspections" | IDs inválidos | Verificar IDs das vistorias |
| "0 room pairs" | Nomes não fazem match | Verificar nomes dos cômodos |
| "Error 401" | API Key inválida | Verificar `.env.local` |
| "Error 429" | Rate limit | Aguardar ou aumentar plano |
| Status permanece "processing" | Erro silencioso | Buscar "FATAL ERROR" nos logs |

---

## Exemplo de Log Completo (Sucesso)

```bash
[Comparison f3a2b1c0] Starting processing...
[Comparison f3a2b1c0] Move In ID: xxxx-1111
[Comparison f3a2b1c0] Move Out ID: yyyy-2222
[Comparison f3a2b1c0] Found 2 inspections
[Comparison f3a2b1c0] User settings: { ai_inspection_strictness: 'standard' }
[Comparison f3a2b1c0] Found photos: { moveIn: 3, moveOut: 3 }
[Comparison f3a2b1c0] Grouped into 2 room pairs
[Comparison f3a2b1c0] Photo matching summary:
[Comparison f3a2b1c0] Room "Sala": 2 before, 2 after
[Comparison f3a2b1c0] Room "Quarto": 1 before, 1 after
[Comparison f3a2b1c0] Using strictness level: standard
[Comparison f3a2b1c0] Processing room "Sala"...
[Comparison f3a2b1c0] Photo URLs for "Sala": { before: '...', after: '...' }
[Claude API] Starting comparison for room: Sala
[Claude API] Strictness level: standard
[Claude API] Calling Anthropic API...
[Claude API] API call completed in 3284ms
[Claude API] Response usage: { input_tokens: 2456, output_tokens: 389 }
[Claude API] Parsed result: { hasDifference: true, differencesCount: 1, totalCost: 180 }
[Comparison f3a2b1c0] Room "Sala" has 1 differences
[Comparison f3a2b1c0] Saving difference: { room: 'Sala', severity: 'high', cost: 180 }
[Comparison f3a2b1c0] Difference saved successfully
[Comparison f3a2b1c0] Processing room "Quarto"...
[Claude API] Starting comparison for room: Quarto
[Claude API] API call completed in 2987ms
[Claude API] Parsed result: { hasDifference: false, differencesCount: 0, totalCost: 0 }
[Comparison f3a2b1c0] Room "Quarto" has NO differences
[Comparison f3a2b1c0] Processing complete. Summary: { totalDifferences: 1, totalNewDamages: 1, totalCost: 180 }
[Comparison f3a2b1c0] Comparison updated with results
[Comparison f3a2b1c0] Credits deducted: 10 -> 9
[Comparison f3a2b1c0] Processing completed successfully!
```

---

**Este documento é parte do VistorIA Pro v1.3.0**
**Última atualização:** 20/11/2025
