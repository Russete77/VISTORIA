# Implementação: Campo tenant_email para Contestações

## Resumo da Implementação

Adicionado o campo `tenant_email` ao fluxo de vistorias para suportar o sistema de contestações. Agora o locatário pode fornecer seu e-mail durante a criação da vistoria, permitindo que ele conteste itens posteriormente.

## Arquivos Modificados

### 1. Database Migration
**Arquivo:** `supabase/migrations/004_add_tenant_email.sql`

- Adiciona coluna `tenant_email VARCHAR(255)` (nullable) na tabela `inspections`
- Cria índice para buscas por email
- Campo nullable para compatibilidade com vistorias antigas

**Como executar:**
```bash
# Via Supabase Dashboard - SQL Editor
# Cole o conteúdo do arquivo e execute

# OU via CLI (se configurado)
supabase db push
```

### 2. Types
**Arquivo:** `src/types/database.ts`

- Adicionado `tenant_email: string | null` ao tipo `Inspection`
- Mantém compatibilidade com tipagem TypeScript strict mode

### 3. API Route
**Arquivo:** `src/app/api/inspections/route.ts`

**Mudanças:**
- Schema Zod atualizado para aceitar `tenant_email`
- Validação de formato de email via Zod (`z.string().email()`)
- Campo opcional (não obrigatório para criar vistoria)

```typescript
tenant_email: z.string().email().optional().nullable()
```

### 4. Wizard de Criação
**Arquivo:** `src/app/dashboard/inspections/new/page.tsx`

**Mudanças:**
- Interface `FormData` inclui `tenantEmail: string`
- Novo input de email no Step 3 (após nome do locatário)
- Placeholder: `email@exemplo.com`
- Hint text: "O locatário poderá contestar itens da vistoria por este e-mail"
- Label: "E-mail do Locatário (para contestações)"
- Validação HTML5 via `type="email"`

### 5. Página de Detalhes
**Arquivo:** `src/app/dashboard/inspections/[id]/page.tsx`

**Mudanças:**
- Exibe email do locatário (se existir) abaixo do nome
- Renderização condicional: só mostra se `tenant_email` estiver preenchido

## Fluxo Completo

### Criação de Vistoria (Admin)
1. Admin acessa `/dashboard/inspections/new`
2. Seleciona imóvel (Step 1)
3. Seleciona tipo de vistoria (Step 2)
4. Preenche dados (Step 3):
   - Nome do vistoriador (obrigatório)
   - Nome do locatário (opcional)
   - **E-mail do locatário (opcional)** ← NOVO
   - Nome do proprietário (opcional)
   - Data agendada (obrigatório)
   - Observações (opcional)
5. Sistema valida e-mail (formato) via Zod
6. Vistoria é criada com `tenant_email` no banco

### Visualização (Admin)
1. Admin acessa `/dashboard/inspections/[id]`
2. Vê email do locatário (se preenchido) na seção de detalhes
3. Seção "Locatário" mostra:
   - Nome do locatário
   - E-mail do locatário (se existir)

### Contestação (Locatário) - Futuro
1. Locatário acessa sistema de contestações público
2. Informa e-mail (busca vistoria por `tenant_email`)
3. Sistema encontra vistoria e gera token JWT
4. Envia link com token para o email
5. Locatário acessa via link e cria contestação

## Validações Implementadas

### Backend (API)
- ✅ Formato de email validado via Zod
- ✅ Campo opcional (não bloqueia criação se vazio)
- ✅ Aceita `null` para compatibilidade

### Frontend (Wizard)
- ✅ Input type="email" (validação HTML5)
- ✅ Placeholder explicativo
- ✅ Hint text sobre funcionalidade
- ✅ Não é campo obrigatório

### Database
- ✅ Campo nullable (VARCHAR(255))
- ✅ Índice para buscas por email
- ✅ Compatível com vistorias antigas

## Compatibilidade

### Vistorias Antigas
- ✅ Vistorias existentes terão `tenant_email = NULL`
- ✅ Não quebra nenhuma funcionalidade existente
- ✅ Frontend trata campo ausente corretamente

### TypeScript
- ✅ Tipo: `tenant_email: string | null`
- ✅ Strict mode compatível
- ✅ Validação em tempo de compilação

## Próximos Passos (Não Implementados)

### Funcionalidades Futuras
1. **Botão "Enviar Link de Contestação"** (na página de detalhes)
   - Gera token JWT
   - Envia email com link personalizado
   - Link formato: `/disputes/access?token=JWT_TOKEN`

2. **Validação Adicional**
   - Verificar se email já está em uso em outras vistorias
   - Normalizar email (lowercase, trim)

3. **Notificações**
   - Enviar email quando vistoria for concluída
   - Lembrete de prazo para contestações

## Checklist de Deploy

- [ ] Executar migration `004_add_tenant_email.sql` no Supabase
- [ ] Verificar índice criado: `idx_inspections_tenant_email`
- [ ] Build TypeScript sem erros
- [ ] Testar criar vistoria COM email
- [ ] Testar criar vistoria SEM email
- [ ] Verificar vistorias antigas (tenant_email = null)
- [ ] Testar visualização de detalhes

## Testes Manuais Recomendados

1. **Criar vistoria com email válido**
   ```
   Input: teste@exemplo.com
   Expected: Vistoria criada, email salvo no banco
   ```

2. **Criar vistoria com email inválido**
   ```
   Input: email-invalido
   Expected: Erro de validação (frontend e backend)
   ```

3. **Criar vistoria sem email**
   ```
   Input: (campo vazio)
   Expected: Vistoria criada normalmente, tenant_email = NULL
   ```

4. **Visualizar vistoria antiga**
   ```
   Expected: Seção locatário não mostra email (NULL)
   ```

5. **Visualizar vistoria nova com email**
   ```
   Expected: Seção locatário mostra nome E email
   ```

## Troubleshooting

### Erro: "Column tenant_email does not exist"
- **Causa:** Migration não foi executada
- **Solução:** Execute `004_add_tenant_email.sql` no Supabase

### Email não aparece na página de detalhes
- **Causa:** Vistoria criada antes da migration
- **Solução:** Normal, campo é nullable para vistorias antigas

### Erro de validação Zod
- **Causa:** Email em formato inválido
- **Solução:** Frontend valida via HTML5, mas backend é definitivo

## Notas Técnicas

- **Performance:** Índice garante buscas rápidas por email
- **Segurança:** Email não é chave única (múltiplas vistorias podem ter mesmo email)
- **Privacy:** Email é armazenado em plaintext (considerar hash/encriptação futura)
- **Nullable:** Compatibilidade retroativa com dados existentes

## Referências

- Schema da tabela `inspections`: `supabase/migrations/001_align_schema_with_code.sql`
- Schema de contestações: `supabase/migrations/003_disputes_feature.sql`
- Documentação de contestações: `DISPUTES_FEATURE_DOCS.md`
