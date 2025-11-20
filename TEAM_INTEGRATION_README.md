# Integração da Página de Equipe com Supabase

## Resumo

A página de Equipe (`/dashboard/team`) foi completamente integrada com o Supabase, removendo os dados mockados e implementando uma solução completa de gerenciamento de equipes.

## Arquivos Criados/Modificados

### 1. Migração do Banco de Dados
**Arquivo:** `laudo/supabase/migrations/002_team_management.sql`

Esta migração cria:
- Tabela `team_members` - Membros da equipe
- Tabela `team_invites` - Convites pendentes
- Tabela `team_activity_log` - Log de atividades
- Enums personalizados para roles, status, etc.
- Triggers para auto-criar owner e atualizar timestamps
- Funções auxiliares (stats, validações, logging)
- Políticas RLS completas para segurança

### 2. Tipos TypeScript
**Arquivo:** `laudo/src/types/database.ts`

Adicionados os tipos:
- `TeamRole`, `TeamMemberStatus`, `TeamInviteStatus`
- `TeamMember`, `TeamInvite`, `TeamActivity`
- `TeamMemberWithStats`, `TeamActivityWithMember`

### 3. APIs REST

#### `GET /api/team/members`
**Arquivo:** `laudo/src/app/api/team/members/route.ts`
- Retorna todos os membros da equipe com estatísticas
- Suporta filtros: role, status, search
- Calcula stats agregadas e limites do plano

#### `POST /api/team/invite`
**Arquivo:** `laudo/src/app/api/team/invite/route.ts`
- Envia convite para novo membro
- Valida limites do plano
- Gera token único
- Cria registro pendente

#### `DELETE /api/team/members/[id]`
**Arquivo:** `laudo/src/app/api/team/members/[id]/route.ts`
- Remove membro da equipe (soft delete)
- Cancela convites pendentes
- Registra atividade

#### `PATCH /api/team/members/[id]`
**Arquivo:** `laudo/src/app/api/team/members/[id]/route.ts`
- Atualiza role do membro
- Permite transferência de ownership
- Valida permissões

#### `GET /api/team/activity`
#### `POST /api/team/activity`
**Arquivo:** `laudo/src/app/api/team/activity/route.ts`
- Lista atividades com paginação
- Filtra por membro, ação, tipo
- Permite registrar novas atividades

### 4. Hooks React

#### `useTeam()`
**Arquivo:** `laudo/src/hooks/use-team.ts`
- Busca membros da equipe
- Gerencia convites, remoções e alterações de role
- Calcula estatísticas e limites
- Aplica filtros

#### `useTeamActivity()`
**Arquivo:** `laudo/src/hooks/use-team.ts`
- Busca atividades com paginação
- Permite registrar novas atividades
- Filtra por membro, ação, tipo

### 5. Página Atualizada
**Arquivo:** `laudo/src/app/dashboard/team/page.tsx`
- Removidos todos os dados mockados
- Integrada com hooks `useTeam` e `useTeamActivity`
- Loading states, error handling
- Filtros funcionais
- Validações de permissão

## Como Aplicar

### 1. Executar Migração no Supabase

Abra o Supabase Dashboard > SQL Editor e execute o arquivo:
```sql
-- Copie e cole o conteúdo de:
laudo/supabase/migrations/002_team_management.sql
```

Ou se estiver usando o CLI do Supabase:
```bash
cd laudo
npx supabase db push
```

### 2. Verificar Instalação

Execute estas queries para confirmar:

```sql
-- Verificar tabelas criadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('team_members', 'team_invites', 'team_activity_log');

-- Verificar se owner foi criado para usuários existentes
SELECT u.email, tm.role, tm.status
FROM users u
LEFT JOIN team_members tm ON tm.user_id = u.id AND tm.role = 'owner';

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('team_members', 'team_invites', 'team_activity_log');
```

### 3. Testar Aplicação

1. Acesse `/dashboard/team`
2. Verifique se aparece seu email como "Gestor Principal"
3. Tente adicionar um membro (se tiver plano adequado)
4. Teste filtros e busca
5. Verifique a aba de Atividade Recente

## Funcionalidades Implementadas

### Gerenciamento de Membros
- ✅ Listagem de membros com estatísticas
- ✅ Adicionar membros via convite por email
- ✅ Remover membros (soft delete)
- ✅ Alterar roles (owner, admin, member, viewer)
- ✅ Filtros por role, status e busca
- ✅ Validação de limites por plano

### Estatísticas
- ✅ Total de membros ativos/pendentes
- ✅ Total de vistorias por membro
- ✅ Total de laudos gerados
- ✅ Última atividade de cada membro

### Log de Atividades
- ✅ Registro automático de ações importantes
- ✅ Listagem com paginação
- ✅ Filtros por membro, ação, tipo
- ✅ Exibição formatada com timestamps

### Segurança
- ✅ Row Level Security (RLS) habilitado
- ✅ Políticas para garantir isolamento de dados
- ✅ Validação de permissões em todas as operações
- ✅ Apenas owner/admin podem gerenciar equipe

### Limites por Plano
- ✅ Free/Pay-per-use: Apenas owner (1 usuário)
- ✅ Professional: Até 3 membros
- ✅ Business: Até 10 membros
- ✅ Enterprise: Até 999 membros
- ✅ Developer: Sem limites

## Próximos Passos (Opcionais)

### 1. Sistema de Convites por Email
Atualmente os convites são criados no banco mas não são enviados por email. Para implementar:

```typescript
// Adicionar ao POST /api/team/invite
import { sendEmail } from '@/lib/email'

await sendEmail({
  to: email,
  subject: 'Convite para equipe VistorIA Pro',
  template: 'team-invite',
  data: {
    inviterName: dbUser.full_name,
    inviteLink: `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite?token=${token}`,
    role: ROLE_LABELS[role],
  },
})
```

### 2. Página de Aceitação de Convite
Criar rota `/accept-invite` para processar tokens:

```typescript
// app/accept-invite/page.tsx
- Validar token
- Criar conta Clerk (se não existir)
- Ativar membro na equipe
- Redirecionar para dashboard
```

### 3. Notificações em Tempo Real
Usar Supabase Realtime para notificar quando:
- Novo membro aceita convite
- Membro completa uma vistoria
- Role de membro é alterado

### 4. Dashboard de Produtividade
Adicionar gráficos e métricas:
- Vistorias por membro no tempo
- Comparação de produtividade
- Taxa de conclusão de laudos

### 5. Permissões Granulares
Implementar controle de acesso por recurso:
- Quais imóveis cada membro pode acessar
- Quais vistorias estão atribuídas a cada um
- Limitações por tipo de operação

## Troubleshooting

### Erro: "User not found"
- Certifique-se que o usuário está logado no Clerk
- Verifique se o webhook do Clerk criou o registro no Supabase
- Verifique a tabela `users` no Supabase

### Erro: "Permission denied"
- Verifique as políticas RLS no Supabase
- Confirme que o usuário tem role apropriado (owner/admin)
- Verifique os logs do Supabase para detalhes

### Owner não foi criado automaticamente
- Execute manualmente:
```sql
INSERT INTO team_members (user_id, email, name, role, status, accepted_at, last_active_at)
SELECT id, email, COALESCE(full_name, email), 'owner', 'active', NOW(), last_login_at
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM team_members WHERE team_members.user_id = users.id AND role = 'owner'
);
```

### Estatísticas não aparecem
- Verifique se há vistorias no banco
- Confirme que a query de stats está funcionando
- Verifique console do navegador para erros

## Suporte

Para problemas ou dúvidas:
1. Verifique os logs do servidor Next.js
2. Verifique os logs do Supabase
3. Confirme que a migração foi aplicada corretamente
4. Teste as APIs diretamente (Postman/Insomnia)

## Notas de Desenvolvimento

- Todos os endpoints usam TypeScript strict mode
- Validação com Zod em todos os inputs
- Error handling completo com mensagens em português
- Loading states e feedback visual
- Soft delete para preservar histórico
- Timestamps automáticos em todas as tabelas
