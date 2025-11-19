# VistorIA Pro - Setup Guide

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura do Projeto](#estrutura-do-projeto)
3. [Configuração do Ambiente](#configuração-do-ambiente)
4. [Setup do Supabase](#setup-do-supabase)
5. [Setup do Clerk](#setup-do-clerk)
6. [Setup do Stripe](#setup-do-stripe)
7. [Setup do Anthropic Claude](#setup-do-anthropic-claude)
8. [Executar o Projeto](#executar-o-projeto)
9. [Próximos Passos](#próximos-passos)

---

## 🎯 Visão Geral

**VistorIA Pro** é um sistema inteligente de vistorias imobiliárias com IA (Claude 4), construído com:

- **Frontend**: Next.js 16 + React 19 + TypeScript + Tailwind CSS 4
- **Backend**: Next.js API Routes (Serverless)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Clerk
- **Payments**: Stripe
- **AI**: Anthropic Claude 4 Sonnet
- **UI**: Shadcn/ui

---

## 📁 Estrutura do Projeto

```
laudo/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Rotas de autenticação
│   │   ├── (dashboard)/       # Dashboard protegido
│   │   ├── (public)/          # Páginas públicas
│   │   ├── api/               # API Routes
│   │   ├── globals.css        # Estilos globais (Tailwind)
│   │   ├── layout.tsx         # Layout raiz
│   │   └── page.tsx           # Página inicial
│   │
│   ├── components/
│   │   ├── ui/                # Componentes Shadcn/ui
│   │   ├── layout/            # Layouts (Header, Sidebar, etc)
│   │   └── features/          # Componentes de features
│   │
│   ├── lib/
│   │   ├── supabase/          # Configuração Supabase
│   │   │   ├── server.ts      # Client para Server Components
│   │   │   ├── client.ts      # Client para Client Components
│   │   │   └── middleware.ts  # Middleware para session refresh
│   │   ├── stripe/            # Configuração Stripe
│   │   ├── anthropic/         # Configuração Claude AI
│   │   ├── clerk.ts           # Helpers do Clerk
│   │   ├── utils.ts           # Funções utilitárias (cn, etc)
│   │   └── constants.ts       # Constantes da aplicação
│   │
│   ├── types/
│   │   ├── database.ts        # Tipos do banco de dados
│   │   ├── api.ts             # Tipos de API
│   │   └── index.ts           # Export central
│   │
│   ├── hooks/                 # Custom React hooks
│   ├── services/              # Lógica de negócio/API calls
│   └── utils/                 # Utilitários gerais
│
├── supabase/
│   └── schema.sql             # Schema do banco de dados
│
├── public/                    # Arquivos estáticos
├── .env.local                 # Variáveis de ambiente (não commitar!)
├── .env.example               # Template de variáveis
├── components.json            # Configuração Shadcn/ui
├── middleware.ts              # Middleware Next.js (Clerk + Supabase)
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## ⚙️ Configuração do Ambiente

### 1. Pré-requisitos

- Node.js 18+ instalado
- npm ou pnpm instalado
- Conta no Supabase (grátis)
- Conta no Clerk (grátis)
- Conta no Stripe (modo teste)
- Conta no Anthropic (API key)

### 2. Instalar Dependências

As dependências já foram instaladas. Caso precise reinstalar:

```bash
cd laudo
npm install
```

### 3. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env.local` (já foi criado) e preencha as variáveis:

```bash
# Já existe .env.local - preencha com suas credenciais
```

---

## 🗄️ Setup do Supabase

### 1. Criar Projeto no Supabase

1. Acesse: https://app.supabase.com/
2. Clique em "New Project"
3. Escolha:
   - **Name**: vistoria-pro
   - **Database Password**: (guarde essa senha!)
   - **Region**: South America (São Paulo)
4. Aguarde o projeto ser criado (~2 minutos)

### 2. Executar o Schema SQL

1. No painel do Supabase, vá em **SQL Editor**
2. Clique em "New Query"
3. Copie TODO o conteúdo do arquivo `supabase/schema.sql`
4. Cole no editor e clique em "Run"
5. Aguarde a execução (deve aparecer "Success")

### 3. Criar Buckets de Storage

1. Vá em **Storage** no menu lateral
2. Crie os seguintes buckets:

**Bucket 1: inspection-photos**
- Name: `inspection-photos`
- Public: `false` (privado)

**Bucket 2: reports**
- Name: `reports`
- Public: `false` (privado)

### 4. Configurar RLS Policies do Storage

No **SQL Editor**, execute:

```sql
-- Policies para inspection-photos
CREATE POLICY "Users can upload own photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'inspection-photos' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view own photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'inspection-photos' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete own photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'inspection-photos' AND
    auth.uid() IS NOT NULL
  );

-- Policies para reports
CREATE POLICY "Users can upload own reports"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'reports' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view own reports"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'reports' AND
    auth.uid() IS NOT NULL
  );
```

### 5. Obter Credenciais

1. Vá em **Settings** → **API**
2. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** (secret!) → `SUPABASE_SERVICE_ROLE_KEY`

3. Cole no `.env.local`

---

## 🔐 Setup do Clerk

### 1. Criar Aplicação no Clerk

1. Acesse: https://dashboard.clerk.com/
2. Clique em "Add Application"
3. Configure:
   - **Name**: VistorIA Pro
   - **Authentication**: Email + Google
   - **Application Type**: Web Application

### 2. Configurar URLs

No dashboard do Clerk, vá em **Paths**:

- **Sign-in URL**: `/sign-in`
- **Sign-up URL**: `/sign-up`
- **After sign-in URL**: `/dashboard`
- **After sign-up URL**: `/onboarding`

### 3. Obter Credenciais

1. Vá em **API Keys**
2. Copie:
   - **Publishable key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret key** → `CLERK_SECRET_KEY`

3. Cole no `.env.local`

### 4. Configurar Webhook (Sincronizar usuários com Supabase)

1. No Clerk, vá em **Webhooks**
2. Clique em "Add Endpoint"
3. Configure:
   - **Endpoint URL**: `https://seu-dominio.com/api/webhooks/clerk` (depois do deploy)
   - **Events**: Marque:
     - `user.created`
     - `user.updated`
     - `user.deleted`
4. Copie o **Signing Secret** → `CLERK_WEBHOOK_SECRET`

> ⚠️ **Para desenvolvimento local**, use [ngrok](https://ngrok.com/) ou similar para expor localhost

---

## 💳 Setup do Stripe

### 1. Criar Conta no Stripe

1. Acesse: https://dashboard.stripe.com/register
2. Crie uma conta (modo de teste é automático)

### 2. Obter Credenciais

1. Vá em **Developers** → **API Keys**
2. Copie:
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`

3. Cole no `.env.local`

### 3. Configurar Webhook

1. Vá em **Developers** → **Webhooks**
2. Clique em "Add endpoint"
3. Configure:
   - **Endpoint URL**: `https://seu-dominio.com/api/webhooks/stripe`
   - **Events**: Selecione:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `invoice.paid`
     - `invoice.payment_failed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
4. Copie o **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### 4. Criar Produtos e Preços

Execute no **Stripe CLI** ou via Dashboard:

```bash
# Instalar Stripe CLI
npm install -g stripe-cli

# Login
stripe login

# Criar produtos (exemplo)
stripe products create --name="Vistoria Avulsa" --description="1 vistoria"
stripe prices create --product=prod_xxx --unit-amount=990 --currency=brl
```

> 💡 **Dica**: Podemos criar um script de seed para automatizar isso

---

## 🤖 Setup do Anthropic Claude

### 1. Criar Conta no Anthropic

1. Acesse: https://console.anthropic.com/
2. Crie uma conta (grátis com créditos de teste)

### 2. Obter API Key

1. Vá em **API Keys**
2. Clique em "Create Key"
3. Copie a chave → `ANTHROPIC_API_KEY`
4. Cole no `.env.local`

### 3. Configurar Billing (Produção)

Para produção:
1. Vá em **Billing**
2. Adicione um método de pagamento
3. Defina um limite de uso mensal (recomendado)

---

## 🚀 Executar o Projeto

### 1. Verificar .env.local

Confirme que **TODAS** as variáveis obrigatórias estão preenchidas:

```bash
# Mínimo para rodar:
NEXT_PUBLIC_SUPABASE_URL=✅
NEXT_PUBLIC_SUPABASE_ANON_KEY=✅
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=✅
CLERK_SECRET_KEY=✅
STRIPE_SECRET_KEY=✅
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=✅
ANTHROPIC_API_KEY=✅
```

### 2. Executar em Desenvolvimento

```bash
cd laudo
npm run dev
```

Acesse: http://localhost:3000

### 3. Testar Autenticação

1. Clique em "Sign Up"
2. Crie uma conta com email
3. Após criar, verifique no Supabase:
   - Tabela `users` deve ter 1 registro
   - `clerk_id` deve estar preenchido

### 4. Build de Produção

```bash
npm run build
npm run start
```

---

## 📋 Próximos Passos

### Sprint 1: Auth + Setup (2 semanas)

**✅ CONCLUÍDO:**
- [x] Estrutura de pastas criada
- [x] Dependências instaladas
- [x] Shadcn/ui configurado
- [x] Supabase configurado (server + client)
- [x] Clerk configurado
- [x] Stripe configurado
- [x] Anthropic configurado
- [x] Middleware criado
- [x] Tipos TypeScript criados
- [x] Constantes criadas
- [x] Schema SQL criado

**🔜 PRÓXIMOS PASSOS:**

1. **Implementar Webhook do Clerk**
   - Criar `/api/webhooks/clerk/route.ts`
   - Sincronizar usuários com Supabase
   - Testar criação de usuário

2. **Criar Layout Base**
   - Header com menu
   - Sidebar (dashboard)
   - Footer

3. **Criar Componentes Shadcn/ui necessários**
   ```bash
   npx shadcn@latest add button
   npx shadcn@latest add card
   npx shadcn@latest add input
   npx shadcn@latest add form
   npx shadcn@latest add dialog
   npx shadcn@latest add dropdown-menu
   npx shadcn@latest add table
   npx shadcn@latest add badge
   npx shadcn@latest add avatar
   ```

4. **Implementar Dashboard Básico**
   - Rota: `/dashboard`
   - Mostrar resumo:
     - Total de vistorias
     - Créditos disponíveis
     - Imóveis cadastrados
     - Últimas vistorias

5. **Implementar CRUD de Imóveis**
   - Listar imóveis
   - Criar imóvel (form com validação Zod)
   - Editar imóvel
   - Excluir imóvel (soft delete)

### Sprint 2: Vistorias Core (2 semanas)

6. **Criar Vistoria**
   - Formulário de criação
   - Seleção de imóvel
   - Tipo de vistoria (entrada/saída/periódica)

7. **Captura de Fotos**
   - Upload de imagens
   - Organização por cômodos
   - Preview de fotos

8. **Salvar Rascunho**
   - Persistir estado
   - Continuar depois

### Sprint 3: IA Claude (2 semanas)

9. **Integração com Claude**
   - Criar service de análise
   - Enviar fotos para Claude
   - Receber análise
   - Salvar problemas detectados

10. **Edição Manual**
    - Confirmar/descartar problemas
    - Editar descrições
    - Adicionar notas

### Sprint 4: Laudos (2 semanas)

11. **Geração de PDF**
    - Template de laudo
    - Incluir fotos
    - Listar problemas
    - Assinaturas

12. **Compartilhamento**
    - Link de download
    - Envio por email

### Sprint 5: Billing (2 semanas)

13. **Sistema de Créditos**
    - Mostrar saldo
    - Descontar ao criar vistoria
    - Histórico de uso

14. **Compra de Créditos**
    - Checkout Stripe
    - Webhooks
    - Confirmação

15. **Assinaturas**
    - Planos mensais
    - Upgrade/downgrade
    - Gerenciamento

---

## 🐛 Troubleshooting

### Erro: "Missing environment variable"

**Solução**: Verifique se todas as variáveis estão no `.env.local`

### Erro ao executar schema.sql

**Solução**: Execute em partes menores ou verifique se o UUID extension está habilitado

### RLS bloqueando acesso

**Solução**: Temporariamente desabilite RLS para testar:

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### Webhook do Clerk não sincroniza

**Solução**:
1. Verifique se a URL do webhook está acessível
2. Teste com ngrok: `ngrok http 3000`
3. Verifique logs no dashboard do Clerk

---

## 📚 Recursos Adicionais

- [Documentação Next.js 15](https://nextjs.org/docs)
- [Documentação Supabase](https://supabase.com/docs)
- [Documentação Clerk](https://clerk.com/docs)
- [Documentação Stripe](https://stripe.com/docs)
- [Documentação Anthropic](https://docs.anthropic.com/)
- [Shadcn/ui Components](https://ui.shadcn.com/)

---

## 🤝 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação oficial
2. Consulte o PRD (prd.md)
3. Revise este guia de setup

---

**Última atualização**: Novembro 2025
**Versão**: 1.0.0
