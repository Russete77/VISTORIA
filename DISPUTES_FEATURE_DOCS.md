# Funcionalidade: Área de Contestação

## Visão Geral

Sistema completo de contestação de laudos de vistoria que permite inquilinos registrarem objeções sem necessidade de criar conta. O sistema utiliza tokens JWT para acesso seguro e controlado.

## Arquivos Criados/Modificados

### 1. DATABASE (Migration SQL)
- `C:\Users\erick\laudo-ai\laudo\supabase\migrations\003_disputes_feature.sql`
  - Tabela `disputes` - contestações principais
  - Tabela `dispute_messages` - timeline de mensagens
  - Tabela `dispute_attachments` - anexos de evidência
  - Função `generate_dispute_protocol()` - gera protocolo único
  - Triggers automáticos para atualização de timestamps e mensagens de status
  - RLS policies configuradas

### 2. TYPES
- `C:\Users\erick\laudo-ai\laudo\src\types\database.ts`
  - Tipos: `DisputeCategory`, `DisputeStatus`, `DisputeMessageAuthorType`
  - Interfaces: `Dispute`, `DisputeMessage`, `DisputeAttachment`
  - Extended types: `DisputeWithDetails`, `DisputeWithInspection`
  - Input types: `CreateDisputeInput`, `CreateDisputeMessageInput`, `UpdateDisputeStatusInput`

### 3. VALIDATIONS
- `C:\Users\erick\laudo-ai\laudo\src\lib\validations\disputes.ts`
  - Schema: `createDisputeSchema`
  - Schema: `createDisputeMessageSchema`
  - Schema: `updateDisputeStatusSchema`
  - Schema: `uploadDisputeAttachmentSchema`
  - Schema: `listDisputesQuerySchema`

### 4. CONSTANTS
- `C:\Users\erick\laudo-ai\laudo\src\lib\constants.ts`
  - `DISPUTE_CATEGORIES` - 6 categorias de contestação
  - `DISPUTE_STATUS` - 5 status possíveis
  - `DISPUTE_CONFIG` - configurações gerais

### 5. UTILITIES
- `C:\Users\erick\laudo-ai\laudo\src\lib\utils\jwt.ts`
  - `generateDisputeToken()` - gera token JWT de 90 dias
  - `verifyDisputeToken()` - valida e decodifica token
  - `isTokenExpired()` - verifica expiração
  - `generateShortLivedToken()` - token admin de 1 hora

### 6. API ROUTES

#### `/api/inspections/[id]/disputes` (POST, GET)
- **POST**: Criar nova contestação
- **GET**: Listar contestações de uma vistoria

#### `/api/disputes/[id]` (GET)
- Visualizar contestação com token JWT (acesso público)

#### `/api/disputes/[id]/messages` (POST)
- Adicionar mensagem (inquilino ou admin)

#### `/api/disputes/[id]/status` (PATCH)
- Atualizar status (admin apenas)

#### `/api/disputes` (GET)
- Listar todas as contestações (admin com filtros)

### 7. COMPONENTS

#### `DisputeStatusBadge.tsx`
- Badge visual de status da contestação
- Variants: pending, under_review, accepted, rejected, resolved

#### `DisputeCard.tsx`
- Card de preview da contestação
- Exibe: protocolo, status, categoria, gravidade, inquilino, propriedade

#### `DisputeTimeline.tsx`
- Timeline de mensagens
- Diferencia mensagens de: inquilino, admin, sistema
- Suporta notas internas (visível apenas para admin)

#### `DisputeForm.tsx`
- Formulário de criação de contestação
- Validação client-side com react-hook-form + zod
- Feedback de sucesso com protocolo gerado

### 8. PAGES

#### `/dashboard/inspections/[id]/disputes`
- Página admin de gestão de contestações
- Lista todas as contestações de uma vistoria
- Formulário inline de criação

#### `/disputes/[token]`
- Página pública de acesso à contestação
- Acesso sem login via token JWT
- Permite envio de mensagens pelo inquilino
- Visualização do histórico completo

## Fluxo de Uso

### 1. Admin Cria Contestação
1. Admin acessa `/dashboard/inspections/{id}/disputes`
2. Preenche formulário com dados do inquilino
3. Sistema gera:
   - Protocolo único (ex: DISP-2025-123456)
   - Token JWT válido por 90 dias
4. Email enviado ao inquilino com link de acesso

### 2. Inquilino Acessa Contestação
1. Inquilino clica no link recebido: `/disputes/{token}`
2. Visualiza detalhes da contestação
3. Pode adicionar mensagens
4. Acompanha status em tempo real

### 3. Admin Gerencia Contestação
1. Visualiza lista de contestações
2. Responde mensagens do inquilino
3. Atualiza status:
   - `pending` → `under_review` → `accepted/rejected/resolved`
4. Adiciona notas de resolução

## Configurações Necessárias

### 1. Variáveis de Ambiente
```env
# JWT Secret para tokens de contestação
JWT_SECRET=your-secret-key-here

# Supabase (já configuradas)
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 2. Aplicar Migration
```bash
# Via Supabase Dashboard
# SQL Editor > New query > Colar conteúdo de 003_disputes_feature.sql > Run

# OU via CLI
cd laudo
supabase db push
```

### 3. Storage Bucket (Opcional - para anexos futuros)
```sql
-- Criar bucket no Supabase Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('dispute-attachments', 'dispute-attachments', true);
```

## Segurança

### JWT Tokens
- Algoritmo: HS256
- Expiração: 90 dias (configurável)
- Payload inclui: disputeId, protocol, tenantEmail, inspectionId
- Issuer: 'vistoria-pro'
- Audience: 'dispute-access'

### RLS Policies
- Users podem ver/editar apenas suas próprias disputas
- Tenant acesso via token JWT (bypass RLS via admin client)
- Notas internas visíveis apenas para admin

### Validação
- Todas as entradas validadas com Zod
- Sanitização de inputs
- Rate limiting recomendado para endpoints públicos

## Próximos Passos (Opcional)

### 1. Email Notifications
Implementar em:
- `src/lib/email/dispute-templates.ts`
- Usar Resend (já configurado no projeto)

Templates necessários:
- `dispute-created.tsx` - Notifica inquilino
- `dispute-message.tsx` - Nova mensagem
- `dispute-status-updated.tsx` - Status alterado

### 2. Upload de Anexos
Implementar endpoint:
- `POST /api/disputes/[id]/attachments`
- Upload para bucket 'dispute-attachments'
- Validação de tipo de arquivo (JPEG, PNG, WebP)
- Limite de 5 anexos por contestação

### 3. Dashboard de Analytics
- Gráficos de contestações por status
- Taxa de aceitação/rejeição
- Tempo médio de resolução
- Categorias mais contestadas

### 4. Notificações em Tempo Real
- WebSockets ou Server-Sent Events
- Notificação quando nova mensagem chega
- Badge de contagem de não lidas

## Testes Recomendados

### Funcionalidades a Testar

1. **Criação de Contestação**
   - ✓ Formulário valida campos obrigatórios
   - ✓ Protocolo único gerado
   - ✓ Token JWT válido criado
   - ✓ Mensagem inicial do sistema adicionada

2. **Acesso Público**
   - ✓ Token válido permite acesso
   - ✓ Token inválido/expirado bloqueia
   - ✓ Notas internas não aparecem para inquilino
   - ✓ Mensagens podem ser enviadas

3. **Gestão Admin**
   - ✓ Lista filtra por status/categoria
   - ✓ Status pode ser atualizado
   - ✓ Notas de resolução são salvas
   - ✓ Trigger cria mensagem automática ao mudar status

4. **Segurança**
   - ✓ RLS impede acesso a contestações de outros users
   - ✓ Validação Zod bloqueia dados inválidos
   - ✓ Token JWT não pode ser forjado

## Estrutura do Banco de Dados

### Tabela: disputes
```sql
- id (UUID)
- inspection_id (UUID) → inspections
- user_id (UUID) → users
- protocol (VARCHAR) UNIQUE
- tenant_name, tenant_email, tenant_phone
- item_description, item_location
- category (ENUM)
- severity (ENUM)
- description, tenant_notes
- status (ENUM)
- resolution_notes, resolved_by, resolved_at
- access_token (TEXT) UNIQUE
- created_at, updated_at, deleted_at
```

### Tabela: dispute_messages
```sql
- id (UUID)
- dispute_id (UUID) → disputes
- author_type (ENUM: tenant, admin, system)
- author_name, author_user_id
- message (TEXT)
- is_internal_note (BOOLEAN)
- created_at
```

### Tabela: dispute_attachments
```sql
- id (UUID)
- dispute_id (UUID) → disputes
- storage_path, file_name, file_size, mime_type
- uploaded_by (ENUM: tenant, admin)
- description
- created_at
```

## Métricas e KPIs

Métricas que podem ser extraídas:

- **Volume**: Total de contestações por período
- **Conversão**: % de contestações aceitas vs rejeitadas
- **Tempo**: Tempo médio de primeira resposta e resolução
- **Engajamento**: Média de mensagens por contestação
- **Categorias**: Distribuição por tipo de problema
- **Severidade**: Correlação entre gravidade e aceitação

## Suporte

Para dúvidas ou problemas:
1. Verificar logs do servidor (console.error nos arquivos API)
2. Verificar RLS policies no Supabase
3. Validar variáveis de ambiente (JWT_SECRET)
4. Testar token JWT em jwt.io

---

**Status**: ✅ Implementação completa
**Data**: 2025-11-20
**Versão**: 1.0.0
