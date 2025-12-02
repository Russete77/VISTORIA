# Guia de Instalação - Área de Contestação

## Passo 1: Instalar Dependências

A dependência `jose` para JWT já foi instalada. Verifique:

```bash
cd C:\Users\erick\laudo-ai\laudo
npm install
```

## Passo 2: Configurar Variáveis de Ambiente

Adicione ao arquivo `.env.local`:

```env
# JWT Secret para tokens de contestação (gere uma chave forte)
JWT_SECRET=your-super-secret-key-change-this-in-production
```

**IMPORTANTE**: Gere uma chave secreta forte. Sugestão:

```bash
# No terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Passo 3: Aplicar Migration no Supabase

### Opção A: Via Supabase Dashboard (Recomendado)

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em: **SQL Editor** (menu lateral)
4. Clique em: **New query**
5. Copie todo o conteúdo do arquivo:
   ```
   C:\Users\erick\laudo-ai\laudo\supabase\migrations\003_disputes_feature.sql
   ```
6. Cole no editor SQL
7. Clique em: **Run** (ou pressione `Ctrl+Enter`)
8. Aguarde confirmação de sucesso

### Opção B: Via Supabase CLI

```bash
cd C:\Users\erick\laudo-ai\laudo
supabase db push
```

## Passo 4: Verificar Tabelas Criadas

Execute no SQL Editor do Supabase:

```sql
-- Verificar tabelas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('disputes', 'dispute_messages', 'dispute_attachments');

-- Verificar função
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'generate_dispute_protocol';

-- Verificar RLS policies
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('disputes', 'dispute_messages', 'dispute_attachments');
```

Deve retornar:
- 3 tabelas
- 1 função
- 8 policies

## Passo 5: Testar Fluxo Básico

### 1. Criar Contestação (Admin)

```bash
# Acesse no navegador
http://localhost:3000/dashboard/inspections/{INSPECTION_ID}/disputes

# Preencha o formulário:
- Nome: João Silva
- Email: joao@example.com
- Item: Parede da sala com mancha
- Categoria: Avaliação de Dano
- Gravidade: Médio
- Descrição: A parede já estava com mancha quando entrei
```

### 2. Verificar Protocolo Gerado

Após criar, verifique no SQL Editor:

```sql
SELECT protocol, status, tenant_email
FROM disputes
ORDER BY created_at DESC
LIMIT 1;
```

### 3. Acessar via Token (Inquilino)

```bash
# Pegue o access_token da contestação criada
SELECT access_token FROM disputes ORDER BY created_at DESC LIMIT 1;

# Acesse no navegador (substitua {TOKEN})
http://localhost:3000/disputes/{TOKEN}
```

### 4. Enviar Mensagem

Na página pública, digite uma mensagem e clique em "Enviar Mensagem"

### 5. Verificar Mensagens

```sql
SELECT author_type, message, created_at
FROM dispute_messages
WHERE dispute_id = (SELECT id FROM disputes ORDER BY created_at DESC LIMIT 1)
ORDER BY created_at;
```

## Passo 6: Configurar Storage (Opcional - para anexos futuros)

```sql
-- Criar bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('dispute-attachments', 'dispute-attachments', true);

-- Adicionar policy de upload
CREATE POLICY "Usuários podem fazer upload de anexos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'dispute-attachments');

-- Adicionar policy de leitura pública
CREATE POLICY "Anexos são publicamente visíveis"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'dispute-attachments');
```

## Verificação de Instalação

Checklist de validação:

- [ ] Variável `JWT_SECRET` configurada
- [ ] Migration 003 aplicada com sucesso
- [ ] 3 tabelas criadas (disputes, dispute_messages, dispute_attachments)
- [ ] Função `generate_dispute_protocol` existe
- [ ] RLS policies ativas
- [ ] Página `/dashboard/inspections/[id]/disputes` carrega
- [ ] Página `/disputes/[token]` carrega com token válido
- [ ] Consegue criar contestação
- [ ] Protocolo é gerado automaticamente
- [ ] Token JWT funciona
- [ ] Mensagens podem ser enviadas

## Troubleshooting

### Erro: "Failed to generate dispute protocol"

**Causa**: Função SQL não foi criada

**Solução**:
```sql
-- Execute a parte da migration que cria a função
CREATE OR REPLACE FUNCTION generate_dispute_protocol()
RETURNS TEXT AS $$
-- [copie o código completo da função da migration]
$$ LANGUAGE plpgsql;
```

### Erro: "Invalid or expired access token"

**Causa**: JWT_SECRET não configurado ou mudou

**Solução**:
1. Verifique `.env.local` tem `JWT_SECRET`
2. Reinicie o servidor: `npm run dev`
3. Gere novo token criando nova contestação

### Erro: "User not found" ao criar contestação

**Causa**: Usuário do Clerk não sincronizado com Supabase

**Solução**:
1. Verifique webhook do Clerk está configurado
2. Execute: `SELECT * FROM users WHERE clerk_id = 'YOUR_CLERK_ID';`
3. Se não existir, faça logout e login novamente

### Tabelas não aparecem

**Causa**: Migration não foi executada

**Solução**:
1. Verifique no Supabase Dashboard > Database > Tables
2. Re-execute a migration completa
3. Verifique permissões do usuário do Supabase

## Performance e Otimização

### Índices já criados pela migration:

- `idx_disputes_inspection_id` - busca por vistoria
- `idx_disputes_protocol` - busca por protocolo
- `idx_disputes_tenant_email` - busca por email
- `idx_disputes_status` - filtro por status
- `idx_dispute_messages_dispute_id` - mensagens por contestação

### Recomendações:

1. **Cache de tokens**: Considere cachear verificação de JWT em Redis
2. **Rate limiting**: Limite requests públicos (10/min por IP)
3. **Pagination**: Lista de contestações já usa paginação
4. **Indexes**: Monitore slow queries e adicione índices conforme necessário

## Monitoramento

Queries úteis para monitoramento:

```sql
-- Total de contestações por status
SELECT status, COUNT(*) as total
FROM disputes
WHERE deleted_at IS NULL
GROUP BY status;

-- Contestações criadas hoje
SELECT COUNT(*)
FROM disputes
WHERE created_at >= CURRENT_DATE;

-- Média de mensagens por contestação
SELECT AVG(message_count) as avg_messages
FROM (
  SELECT dispute_id, COUNT(*) as message_count
  FROM dispute_messages
  GROUP BY dispute_id
) as counts;

-- Contestações sem resposta há mais de 24h
SELECT d.protocol, d.tenant_email, d.created_at
FROM disputes d
LEFT JOIN dispute_messages dm ON d.id = dm.dispute_id AND dm.author_type = 'admin'
WHERE d.status = 'pending'
  AND d.created_at < NOW() - INTERVAL '24 hours'
  AND dm.id IS NULL
ORDER BY d.created_at;
```

## Próximos Passos

Após instalação bem-sucedida:

1. **Email Notifications**: Implementar templates de email
2. **Upload de Anexos**: Implementar endpoint de upload
3. **Dashboard Analytics**: Criar página de métricas
4. **Exportação PDF**: Gerar PDF da contestação
5. **Webhook Events**: Notificar sistemas externos

---

**Dúvidas?** Consulte `DISPUTES_FEATURE_DOCS.md` para detalhes técnicos completos.
