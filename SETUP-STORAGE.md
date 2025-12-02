# Configuração do Supabase Storage para VistorIA Pro

## Buckets Necessários

A aplicação requer os seguintes buckets no Supabase Storage:

### 1. Bucket `avatars` (Fotos de Perfil)

**Configuração:**
- Nome: `avatars`
- Público: `true` (para permitir visualização direta)
- Políticas de acesso:
  - INSERT: Apenas usuários autenticados podem fazer upload
  - SELECT: Público (qualquer um pode visualizar)
  - UPDATE: Apenas o dono do arquivo
  - DELETE: Apenas o dono do arquivo

**Estrutura de pastas:**
```
avatars/
  ├── {user_id}/
  │   ├── {user_id}-{timestamp}.jpg
  │   └── {user_id}-{timestamp}.png
```

**Validações:**
- Tipos permitidos: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
- Tamanho máximo: 2MB
- Resolução recomendada: 400x400px

### 2. Bucket `inspection-photos` (Fotos de Vistorias)

**Configuração:**
- Nome: `inspection-photos`
- Público: `false` (apenas usuários autenticados)
- Políticas de acesso:
  - INSERT: Apenas usuários autenticados
  - SELECT: Apenas o dono da vistoria
  - UPDATE: Apenas o dono da vistoria
  - DELETE: Apenas o dono da vistoria

**Estrutura de pastas:**
```
inspection-photos/
  ├── {user_id}/
  │   ├── {inspection_id}/
  │   │   ├── {photo_id}-original.jpg
  │   │   └── {photo_id}-thumb.jpg
```

## Como Criar os Buckets

### Via Supabase Dashboard

1. Acesse: https://supabase.com/dashboard/project/{seu-projeto}/storage/buckets

2. Clique em "New bucket"

3. Para o bucket `avatars`:
   - Nome: `avatars`
   - Marque: "Public bucket"
   - Clique em "Create bucket"

4. Para o bucket `inspection-photos`:
   - Nome: `inspection-photos`
   - NÃO marque "Public bucket"
   - Clique em "Create bucket"

### Via SQL (Alternativa)

Execute no SQL Editor do Supabase:

```sql
-- Criar bucket de avatars (público)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Criar bucket de inspection-photos (privado)
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspection-photos', 'inspection-photos', false);
```

## Políticas de Segurança (RLS)

### Bucket `avatars`

```sql
-- Permitir upload para usuários autenticados
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir leitura pública
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Permitir atualização apenas do próprio avatar
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir deletar apenas o próprio avatar
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Bucket `inspection-photos`

```sql
-- Permitir upload para usuários autenticados
CREATE POLICY "Users can upload their own inspection photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'inspection-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir leitura apenas das próprias fotos
CREATE POLICY "Users can view their own inspection photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'inspection-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir atualização apenas das próprias fotos
CREATE POLICY "Users can update their own inspection photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'inspection-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir deletar apenas as próprias fotos
CREATE POLICY "Users can delete their own inspection photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'inspection-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

## Verificação

Para verificar se os buckets foram criados corretamente:

```sql
SELECT id, name, public, created_at
FROM storage.buckets
WHERE id IN ('avatars', 'inspection-photos');
```

Resultado esperado:
```
| id                 | name               | public | created_at          |
|--------------------|--------------------|--------|---------------------|
| avatars            | avatars            | true   | 2025-01-20 10:00:00 |
| inspection-photos  | inspection-photos  | false  | 2025-01-20 10:00:00 |
```

## Troubleshooting

### Erro: "new row violates row-level security policy"

**Problema:** RLS está bloqueando operações de storage.

**Solução:**
1. Verifique se as políticas foram criadas corretamente
2. Verifique se o usuário está autenticado
3. Verifique se a estrutura de pastas está correta

### Erro: "Bucket not found"

**Problema:** Bucket não foi criado ou nome incorreto.

**Solução:**
1. Verifique o nome do bucket no código
2. Recrie o bucket via Dashboard
3. Verifique permissões de service role key

### Upload funciona mas não vejo a imagem

**Problema:** Bucket está privado ou política de leitura não foi aplicada.

**Solução:**
1. Verifique se o bucket `avatars` está marcado como público
2. Verifique se a política de SELECT permite acesso público
3. Teste a URL pública no navegador

## Notas Importantes

1. **Service Role Key**: A API usa `SUPABASE_SERVICE_ROLE_KEY` para bypassar RLS durante uploads. Certifique-se de que essa variável de ambiente está configurada.

2. **URLs Públicas**: As URLs públicas do Supabase seguem o padrão:
   ```
   https://{project-id}.supabase.co/storage/v1/object/public/avatars/{path}
   ```

3. **Limpeza de Arquivos Antigos**: Quando um usuário faz upload de uma nova foto, a antiga é deletada automaticamente pelo código.

4. **Limitações**: O plano free do Supabase tem limite de 1GB de storage. Monitore o uso em Production.

## Checklist de Configuração

- [ ] Bucket `avatars` criado
- [ ] Bucket `avatars` marcado como público
- [ ] Políticas RLS aplicadas no bucket `avatars`
- [ ] Bucket `inspection-photos` criado
- [ ] Bucket `inspection-photos` marcado como privado
- [ ] Políticas RLS aplicadas no bucket `inspection-photos`
- [ ] Teste de upload funcionando
- [ ] Teste de visualização funcionando
- [ ] Variável `SUPABASE_SERVICE_ROLE_KEY` configurada
- [ ] Teste de delete funcionando

## Próximos Passos

Após configurar o storage:

1. Teste o upload de foto de perfil em `/dashboard/settings`
2. Verifique se a foto aparece corretamente no preview
3. Teste o delete da foto antiga ao fazer novo upload
4. Verifique se a URL está sendo salva corretamente no banco de dados
