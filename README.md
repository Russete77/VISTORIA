# VistorIA Pro 🏠🤖

> **Vistorias inteligentes em minutos, não em horas**

Sistema SaaS de vistorias imobiliárias com IA (Claude 4), construído para ser o #1 do Brasil em 24 meses.

## 🚀 Status do Projeto

**Versão**: 1.0.0 (Setup Inicial)
**Stack**: Next.js 16 + React 19 + TypeScript + Supabase + Clerk + Stripe + Claude 4

### ✅ Concluído

- [x] Estrutura de pastas completa
- [x] Configuração Next.js 16 + React 19 + TypeScript
- [x] Configuração Tailwind CSS 4
- [x] Integração Shadcn/ui
- [x] Configuração Supabase (client + server)
- [x] Configuração Clerk (auth)
- [x] Configuração Stripe (payments)
- [x] Configuração Anthropic Claude 4
- [x] Schema SQL completo (9 tabelas + RLS)
- [x] Middleware de autenticação e sessão
- [x] Tipos TypeScript completos
- [x] Constantes da aplicação
- [x] Documentação de setup

### 🔜 Próximos Passos

1. Implementar webhook Clerk → Supabase sync
2. Criar componentes UI base (Shadcn)
3. Implementar Dashboard
4. Implementar CRUD de Imóveis
5. Implementar fluxo de Vistorias
6. Integrar IA Claude 4
7. Gerar Laudos PDF
8. Sistema de Billing

## 📁 Estrutura do Projeto

```
laudo/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # Componentes React
│   ├── lib/             # Libs (Supabase, Clerk, Stripe, AI)
│   ├── types/           # TypeScript types
│   ├── hooks/           # Custom hooks
│   ├── services/        # Business logic
│   └── utils/           # Utilitários
├── supabase/
│   └── schema.sql       # Database schema
├── .env.local           # Variáveis de ambiente (PREENCHER!)
└── SETUP.md             # Guia completo de setup
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router, React 19)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4
- **UI Library**: Shadcn/ui
- **State**: React hooks + Server Components

### Backend
- **API**: Next.js API Routes (serverless)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Clerk
- **Payments**: Stripe
- **Storage**: Supabase Storage

### AI & Integrações
- **Primary AI**: Anthropic Claude 4 Sonnet
- **Image AI**: Google Cloud Vision (add-on)
- **PDF**: React-PDF
- **Maps**: Google Maps API

### Infraestrutura
- **Hosting**: Vercel
- **CDN**: Cloudflare
- **Monitoring**: Sentry + PostHog

## ⚡ Quick Start

### 1. Pré-requisitos

- Node.js 18+
- npm ou pnpm
- Contas em: Supabase, Clerk, Stripe, Anthropic

### 2. Instalar dependências

```bash
cd laudo
npm install
```

### 3. Configurar ambiente

```bash
# Preencha o .env.local com suas credenciais
# Veja .env.example para referência
```

**Variáveis OBRIGATÓRIAS**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `STRIPE_SECRET_KEY`
- `ANTHROPIC_API_KEY`

### 4. Setup do Supabase

```bash
# 1. Criar projeto no Supabase
# 2. Executar supabase/schema.sql no SQL Editor
# 3. Criar buckets: inspection-photos, reports
# 4. Copiar credenciais para .env.local
```

### 5. Executar

```bash
npm run dev
```

Acesse: http://localhost:3000

## 📖 Documentação

- **[SETUP.md](./SETUP.md)** - Guia completo de configuração (LEIA PRIMEIRO!)
- **[PRD.md](../prd.md)** - Product Requirements Document
- **[Schema SQL](./supabase/schema.sql)** - Estrutura do banco de dados

## 🎯 Roadmap MVP (3 meses)

### Sprint 1-2: Foundation (4 semanas)
- [x] Setup inicial
- [ ] Auth + Onboarding
- [ ] Dashboard básico
- [ ] CRUD Imóveis

### Sprint 3-4: Core Features (4 semanas)
- [ ] Criar vistoria
- [ ] Upload de fotos
- [ ] Organização por cômodos
- [ ] Integração IA Claude
- [ ] Detecção de problemas

### Sprint 5-6: Reports & Billing (4 semanas)
- [ ] Geração de laudo PDF
- [ ] Assinaturas digitais
- [ ] Sistema de créditos
- [ ] Checkout Stripe
- [ ] Webhooks

## 💰 Modelo de Negócio

- **Free**: 1 vistoria/mês grátis para sempre
- **Pay-per-use**: R$ 9,90 por vistoria
- **Pacotes**: R$ 89 (10x) | R$ 199 (25x) | R$ 449 (60x)
- **Assinaturas**: R$ 299/mês (50x) | R$ 699/mês (150x)

## 🤝 Contribuindo

Este é um projeto privado em desenvolvimento. Para colaborar:

1. Clone o repositório
2. Crie uma branch: `git checkout -b feature/nome-da-feature`
3. Commit: `git commit -m 'feat: adiciona nova feature'`
4. Push: `git push origin feature/nome-da-feature`
5. Abra um Pull Request

### Commit Convention

```
feat(scope): mensagem     # Nova feature
fix(scope): mensagem      # Bug fix
refactor(scope): mensagem # Refatoração
docs(scope): mensagem     # Documentação
style(scope): mensagem    # Formatação
test(scope): mensagem     # Testes
chore(scope): mensagem    # Manutenção
```

## 📊 Métricas de Sucesso (24 meses)

- **Usuários**: 30.000
- **Pagantes**: 5.000
- **MRR**: R$ 600.000
- **ARR**: R$ 7,2M
- **Market Share**: 10% (vistorias digitais BR)
- **NPS**: > 70

## 📝 Licença

Proprietário - VistorIA Pro © 2025

## 📧 Contato

**Desenvolvedor**: Erick Russo
**Email**: [seu-email]
**LinkedIn**: [seu-linkedin]

---

**Última atualização**: Novembro 2025
Feito com ❤️ e ☕ no Brasil
