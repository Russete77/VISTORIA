# Landlord Disputes Access - Implementação Completa

## Visão Geral

Sistema de acesso **read-only** para proprietários visualizarem contestações relacionadas aos seus imóveis. Implementado usando tokens JWT públicos, sem necessidade de criação de conta.

## Arquitetura

### Fluxo Completo

```
1. Locatário cria contestação
   ↓
2. Sistema gera 2 tokens:
   - tenant_access_token (acesso individual à contestação)
   - landlord_access_token (acesso a TODAS contestações do proprietário)
   ↓
3. Sistema envia 2 emails:
   - Para locatário: link com tenant_access_token
   - Para proprietário: link com landlord_access_token
   ↓
4. Proprietário clica no link
   ↓
5. Acessa /landlord/disputes/[token]
   ↓
6. Vê lista de todas as contestações dos seus imóveis
   ↓
7. Clica em uma contestação → vê detalhes completos
   ↓
8. Acompanha status e mensagens (READ-ONLY)
```

## Estrutura de Arquivos

### 1. Database Migration
**Arquivo:** `supabase/migrations/006_add_landlord_access_token.sql`

**Mudanças:**
- Adiciona coluna `landlord_access_token` à tabela `disputes`
- Cria índice único para tokens de proprietário
- Implementa função `get_landlord_disputes()` para buscar todas contestações de um email
- Implementa função `verify_landlord_access()` para validar acesso

**Como rodar:**
```bash
# Via Supabase CLI
supabase db push

# Ou direto no SQL Editor do Supabase Dashboard
```

### 2. JWT Token Utilities
**Arquivo:** `src/lib/utils/jwt.ts`

**Novos tipos:**
```typescript
interface LandlordTokenPayload {
  landlordEmail: string
  userId: string
}

interface VerifiedLandlordToken extends LandlordTokenPayload {
  iat: number
  exp: number
}
```

**Funções adicionadas:**
- `generateLandlordToken(payload)` - Gera token JWT para proprietário
- `verifyLandlordToken(token)` - Valida e decodifica token de proprietário

**Expiração:** 90 dias (mesmo que locatário)

### 3. API Routes

#### 3.1. Listar Contestações do Proprietário
**Arquivo:** `src/app/api/disputes/landlord/[token]/route.ts`

**Endpoint:** `GET /api/disputes/landlord/[token]`

**Resposta:**
```json
{
  "disputes": [...],
  "landlordEmail": "proprietario@email.com",
  "totalDisputes": 5
}
```

**Segurança:**
- Valida token JWT
- Filtra notas internas (is_internal_note = true)
- Remove campos sensíveis (access_token, user_id, etc)

#### 3.2. Detalhes de Contestação Específica
**Arquivo:** `src/app/api/disputes/landlord/[token]/[disputeId]/route.ts`

**Endpoint:** `GET /api/disputes/landlord/[token]/[disputeId]`

**Validações:**
- Verifica se token é válido
- Usa função `verify_landlord_access()` do banco
- Garante que proprietário tem acesso apenas aos seus imóveis

#### 3.3. Atualização na Criação de Contestações
**Arquivo:** `src/app/api/inspections/[id]/disputes/route.ts`

**Mudanças:**
- Busca `landlord_email` da vistoria
- Gera `landlord_access_token` se email existir
- Salva token no banco
- Prepara envio de email (TODO comentado)

### 4. Frontend Pages

#### 4.1. Lista de Contestações
**Arquivo:** `src/app/landlord/disputes/[token]/page.tsx`

**Features:**
- Dashboard com estatísticas (Todas, Pendentes, Em Análise, Resolvidas)
- Filtros por status
- Cards clicáveis com informações resumidas
- Exibe email do proprietário para confirmação

**Layout:**
```
┌─────────────────────────────────────────┐
│ Contestações dos Seus Imóveis           │
│ Email: proprietario@email.com           │
├─────────────────────────────────────────┤
│ [5 Todas] [2 Pendentes] [1 Análise] ... │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ DISP-2025-001234  [Status] [Média]  │ │
│ │ Parede da sala com mancha           │ │
│ │ 📍 Apartamento 101 - Rua X          │ │
│ │ 📅 Criada em 20/11/2025             │ │
│ │ [Ver Detalhes →]                    │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

#### 4.2. Detalhes da Contestação
**Arquivo:** `src/app/landlord/disputes/[token]/[disputeId]/page.tsx`

**Features:**
- Informações completas do imóvel
- Dados do locatário
- Timeline de mensagens (sem notas internas)
- Resolução (se houver)
- Aviso de modo read-only

**Componentes reutilizados:**
- `DisputeStatusBadge` - Badge de status
- `DisputeTimeline` - Timeline de mensagens (já filtra notas internas)

### 5. Email Template
**Arquivo:** `src/emails/landlord-dispute-created.tsx`

**Versões:**
- `LandlordDisputeCreatedEmail` - HTML rico
- `LandlordDisputeCreatedEmailText` - Texto plano

**Conteúdo:**
- Header com logo VistorIA Pro
- Informações do imóvel
- Detalhes da contestação
- Botão CTA para acessar
- Aviso sobre modo read-only
- Validade do token (90 dias)

**Props necessárias:**
```typescript
{
  landlordName?: string
  propertyName: string
  propertyAddress: string
  protocol: string
  itemDescription: string
  category: string
  severity: string
  tenantName: string
  createdAt: string
  accessUrl: string
}
```

### 6. Componentes Atualizados

#### DisputeCard
**Mudança:** Adicionada prop opcional `href`

```typescript
interface DisputeCardProps {
  dispute: DisputeWithInspection
  className?: string
  messageCount?: number
  href?: string // Permite customizar link (para landlord)
}
```

**Uso:**
```tsx
// Admin dashboard (padrão)
<DisputeCard dispute={dispute} />

// Landlord dashboard (customizado)
<DisputeCard
  dispute={dispute}
  href={`/landlord/disputes/${token}/${dispute.id}`}
/>
```

## Segurança

### Validações Implementadas

1. **Token JWT:**
   - Assinado com secret do servidor
   - Expiração de 90 dias
   - Audience: `landlord-access`
   - Issuer: `vistoria-pro`

2. **Acesso ao Banco:**
   - Função `verify_landlord_access()` garante que:
     - Contestação existe
     - Email do proprietário está na vistoria
     - Contestação não foi deletada

3. **Filtragem de Dados:**
   - Notas internas NUNCA são enviadas
   - Tokens de acesso são removidos da resposta
   - IDs de usuário são removidos

4. **Read-Only:**
   - Nenhuma rota POST/PUT/DELETE para landlords
   - Frontend não tem formulários de resposta
   - Aviso visual sobre limitações

## Tipos TypeScript

Todos os tipos foram atualizados em `src/lib/utils/jwt.ts`:

```typescript
// Token de proprietário
export interface LandlordTokenPayload {
  landlordEmail: string
  userId: string
}

export interface VerifiedLandlordToken extends LandlordTokenPayload {
  iat: number
  exp: number
}
```

## URLs Geradas

### Formato do Token
Token JWT padrão (exemplo):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYW5kbG9yZEVtYWlsIjoicHJvcHJpZXRhcmlvQGVtYWlsLmNvbSIsInVzZXJJZCI6InV1aWQiLCJpYXQiOjE3MDA1MjAwMDAsImV4cCI6MTcwODI5NjAwMCwiaXNzIjoidmlzdG9yaWEtcHJvIiwiYXVkIjoibGFuZGxvcmQtYWNjZXNzIn0.signature
```

### URLs de Acesso

**Lista:**
```
https://app.vistoriapro.com/landlord/disputes/[TOKEN]
```

**Detalhes:**
```
https://app.vistoriapro.com/landlord/disputes/[TOKEN]/[DISPUTE_ID]
```

## Envio de Email (TODO)

### Quando enviar
O email deve ser enviado quando:
1. Uma nova contestação é criada E
2. A vistoria tem `landlord_email` preenchido

### Implementação futura
```typescript
// Em src/app/api/inspections/[id]/disputes/route.ts
if (inspection.landlord_email && landlordAccessToken) {
  await sendLandlordDisputeNotification({
    landlordEmail: inspection.landlord_email,
    landlordName: inspection.landlord_name,
    propertyName: property.name,
    propertyAddress: property.address,
    protocol: dispute.protocol,
    itemDescription: dispute.item_description,
    category: dispute.category,
    severity: dispute.severity,
    tenantName: dispute.tenant_name,
    createdAt: format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
    accessUrl: `${process.env.NEXT_PUBLIC_APP_URL}/landlord/disputes/${landlordAccessToken}`,
  })
}
```

### Provedor sugerido
- **Resend** (já usado no projeto para outros emails)
- Template React → HTML usando `@react-email/render`

## Testando

### 1. Migração do Banco
```sql
-- No Supabase SQL Editor
SELECT * FROM disputes LIMIT 1;
-- Verificar se coluna landlord_access_token existe
```

### 2. Criar Contestação de Teste
```bash
# Via dashboard admin
1. Criar vistoria com landlord_email preenchido
2. Criar contestação
3. Verificar no banco se landlord_access_token foi gerado
```

### 3. Acessar como Proprietário
```bash
# Copiar o landlord_access_token do banco
# Acessar URL
http://localhost:3000/landlord/disputes/[TOKEN_COPIADO]
```

## Diferenças: Tenant vs Landlord

| Feature | Tenant | Landlord |
|---------|--------|----------|
| **Rota** | `/disputes/[token]` | `/landlord/disputes/[token]` |
| **Token** | Por contestação | Por email (multi-contestação) |
| **Permissões** | Enviar mensagens | Somente visualização |
| **Escopo** | 1 contestação | Todas do proprietário |
| **Notas internas** | Não vê | Não vê |
| **Status** | Não pode alterar | Não pode alterar |

## Próximos Passos

1. ✅ **Implementação Base** (COMPLETO)
2. ⏳ **Envio de Email** (Pendente)
   - Integrar com Resend
   - Renderizar template React
   - Adicionar retry logic
3. ⏳ **Testes** (Pendente)
   - Testes unitários das funções JWT
   - Testes de integração das APIs
   - Testes E2E do fluxo completo
4. ⏳ **Analytics** (Futuro)
   - Rastrear abertura de emails
   - Rastrear cliques nos links
   - Dashboard de métricas

## Troubleshooting

### Token inválido ou expirado
- Verificar se JWT_SECRET está configurado
- Verificar se token não passou de 90 dias
- Verificar se audience/issuer estão corretos

### Proprietário não vê contestações
- Verificar se `landlord_email` está na vistoria
- Verificar se função `get_landlord_disputes()` existe no banco
- Verificar se email no token coincide com email da vistoria

### Notas internas aparecem
- Verificar filtro em `DisputeTimeline` (showInternalNotes deve ser false)
- Verificar filtro nas APIs (is_internal_note)

## Recursos

- **JWT Library:** `jose` (já instalada)
- **Date Formatting:** `date-fns` com locale pt-BR
- **Email Rendering:** `@react-email/render` (a instalar)
- **Email Provider:** Resend (já configurado)

## Contato

Para dúvidas sobre implementação, consultar:
- `DISPUTES_FEATURE_DOCS.md` - Documentação geral de contestações
- `src/lib/utils/jwt.ts` - Implementação de tokens
- `supabase/migrations/003_disputes_feature.sql` - Schema original
