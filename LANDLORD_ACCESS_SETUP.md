# Landlord Disputes Access - Guia de Instalação

## Passo a Passo para Ativar o Sistema

### Pré-requisitos

- ✅ Sistema de contestações básico funcionando
- ✅ Supabase configurado
- ✅ Variável `JWT_SECRET` no `.env.local`
- ✅ Variável `NEXT_PUBLIC_APP_URL` no `.env.local`

### Passo 1: Rodar Migração do Banco

#### Opção A: Via Supabase CLI (Recomendado)

```bash
# Na pasta do projeto
cd C:\Users\erick\laudo-ai\laudo

# Aplicar migração
npx supabase db push
```

#### Opção B: Via Supabase Dashboard

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Clique em **New Query**
5. Copie todo o conteúdo de `supabase/migrations/006_add_landlord_access_token.sql`
6. Cole no editor e clique em **Run**

### Passo 2: Verificar Migração

Execute o script de teste:

```bash
node test-landlord-access.mjs
```

**Resultado esperado:**
```
✅ Coluna landlord_access_token existe
✅ Função get_landlord_disputes existe
✅ Função verify_landlord_access existe
✅ Token gerado com sucesso
✅ Token verificado com sucesso
```

Se algum teste falhar, revise o Passo 1.

### Passo 3: Testar Criação de Contestação

1. **Login no Dashboard Admin**
   ```
   http://localhost:3000/dashboard
   ```

2. **Criar/Editar uma Vistoria**
   - Vá em "Vistorias"
   - Crie nova ou edite existente
   - **IMPORTANTE:** Preencha o campo "Email do Proprietário"
   - Salve a vistoria

3. **Criar Contestação**
   - Abra a vistoria criada
   - Vá na aba "Contestações"
   - Clique em "Nova Contestação"
   - Preencha os campos obrigatórios
   - Salve

4. **Verificar Token Gerado**

   No Supabase Dashboard:
   ```sql
   SELECT
     id,
     protocol,
     landlord_access_token
   FROM disputes
   ORDER BY created_at DESC
   LIMIT 1;
   ```

   Você deve ver um token JWT no campo `landlord_access_token`.

### Passo 4: Testar Acesso de Proprietário

1. **Copiar Token**
   - Copie o `landlord_access_token` da query acima

2. **Acessar URL**
   ```
   http://localhost:3000/landlord/disputes/[COLE_O_TOKEN_AQUI]
   ```

3. **Verificar Página**
   - Deve mostrar lista de contestações
   - Deve exibir email do proprietário
   - Deve ter filtros de status
   - Cards devem ser clicáveis

4. **Testar Detalhes**
   - Clique em "Ver Detalhes" em qualquer contestação
   - Deve mostrar informações completas
   - Deve ter timeline de mensagens
   - Deve ter aviso de "Modo Somente Leitura"

### Passo 5: Configurar Envio de Email (Opcional)

#### 5.1. Instalar Dependências

```bash
npm install @react-email/render
```

#### 5.2. Criar Serviço de Email

Crie `src/services/email/landlord-disputes.ts`:

```typescript
import { render } from '@react-email/render'
import { Resend } from 'resend'
import {
  LandlordDisputeCreatedEmail,
  LandlordDisputeCreatedEmailText,
} from '@/emails/landlord-dispute-created'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendLandlordDisputeNotificationParams {
  landlordEmail: string
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

export async function sendLandlordDisputeNotification(
  params: SendLandlordDisputeNotificationParams
) {
  try {
    const html = render(<LandlordDisputeCreatedEmail {...params} />)
    const text = LandlordDisputeCreatedEmailText(params)

    const { data, error } = await resend.emails.send({
      from: 'VistorIA Pro <noreply@vistoriapro.com>',
      to: params.landlordEmail,
      subject: `Nova Contestação - ${params.protocol}`,
      html,
      text,
    })

    if (error) {
      console.error('Erro ao enviar email para proprietário:', error)
      return { success: false, error }
    }

    console.log('Email enviado para proprietário:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao enviar email:', error)
    return { success: false, error }
  }
}
```

#### 5.3. Atualizar API de Criação de Contestações

Em `src/app/api/inspections/[id]/disputes/route.ts`, descomente e atualize:

```typescript
// Linha ~154 (remover comentário TODO)
import { sendLandlordDisputeNotification } from '@/services/email/landlord-disputes'

// ...

// Após criar a contestação
if (inspection.landlord_email && landlordAccessToken) {
  const { data: property } = await supabase
    .from('properties')
    .select('name, address')
    .eq('id', inspection.property_id)
    .single()

  await sendLandlordDisputeNotification({
    landlordEmail: inspection.landlord_email,
    landlordName: inspection.landlord_name || undefined,
    propertyName: property?.name || 'Imóvel',
    propertyAddress: property?.address || '',
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

#### 5.4. Testar Envio de Email

1. Configure `RESEND_API_KEY` no `.env.local`
2. Crie uma nova contestação
3. Verifique email do proprietário
4. Clique no link no email
5. Deve abrir o dashboard de contestações

### Passo 6: Validação Final

Execute todos os testes:

```bash
node test-landlord-access.mjs
```

**Checklist:**
- [ ] ✅ Schema do Banco
- [ ] ✅ Funções do Banco
- [ ] ✅ Geração de Tokens
- [ ] ✅ Contestações com Token
- [ ] ✅ Acesso de Proprietário

### Passo 7: Deploy

#### Vercel/Production

1. **Push código para Git**
   ```bash
   git add .
   git commit -m "feat(disputes): add landlord read-only access"
   git push origin main
   ```

2. **Rodar migração em produção**
   ```bash
   # Via Supabase Dashboard (produção)
   # SQL Editor → Rodar migration
   ```

3. **Verificar variáveis de ambiente**
   - `JWT_SECRET` (mesma em dev e prod)
   - `NEXT_PUBLIC_APP_URL` (URL de produção)
   - `RESEND_API_KEY` (se usando email)

4. **Testar em produção**
   - Criar contestação de teste
   - Verificar token no banco
   - Acessar URL de proprietário
   - Verificar email (se configurado)

## Troubleshooting

### Erro: "Coluna landlord_access_token não existe"

**Solução:**
- Rodar migração novamente
- Verificar logs no Supabase Dashboard → Database → Migrations

### Erro: "Função get_landlord_disputes não existe"

**Solução:**
```sql
-- No Supabase SQL Editor
SELECT routine_name
FROM information_schema.routines
WHERE routine_name LIKE '%landlord%';
```

Se não aparecer, rodar a migration manualmente.

### Token JWT inválido

**Solução:**
- Verificar se `JWT_SECRET` está definido
- Verificar se secret é o mesmo em dev/prod
- Regenerar token criando nova contestação

### Proprietário não vê contestações

**Solução:**
1. Verificar se email do proprietário está na vistoria:
   ```sql
   SELECT id, landlord_email
   FROM inspections
   WHERE id = 'INSPECTION_ID';
   ```

2. Verificar se token tem email correto:
   - Decodificar token em [jwt.io](https://jwt.io)
   - Comparar `landlordEmail` com `landlord_email` da vistoria

3. Verificar função do banco:
   ```sql
   SELECT * FROM get_landlord_disputes('email@proprietario.com');
   ```

### Notas internas aparecem para proprietário

**Solução:**
- Verificar se API está filtrando corretamente:
  ```typescript
  messages: dispute.messages?.filter(
    (msg) => !msg.is_internal_note
  )
  ```

## Rollback (se necessário)

Para reverter a implementação:

```sql
-- No Supabase SQL Editor
ALTER TABLE disputes DROP COLUMN IF EXISTS landlord_access_token;
DROP FUNCTION IF EXISTS get_landlord_disputes(TEXT);
DROP FUNCTION IF EXISTS verify_landlord_access(UUID, TEXT);
```

E remover os arquivos:
- `src/app/landlord/**`
- `src/app/api/disputes/landlord/**`
- `src/emails/landlord-dispute-created.tsx`

## Próximos Passos

Após instalação bem-sucedida:

1. [ ] Configurar envio de emails
2. [ ] Criar testes automatizados
3. [ ] Adicionar analytics/tracking
4. [ ] Documentar para usuários finais
5. [ ] Criar tutorial em vídeo

## Suporte

Documentação completa:
- `LANDLORD_DISPUTES_ACCESS.md` - Arquitetura e detalhes técnicos
- `DISPUTES_FEATURE_DOCS.md` - Sistema de contestações completo

Testes:
- `test-landlord-access.mjs` - Script de validação

Email: suporte@vistoriapro.com
