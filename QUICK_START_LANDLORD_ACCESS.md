# Quick Start - Landlord Access

## TL;DR

Sistema para proprietários acompanharem contestações via link público (sem login).

## Instalação em 3 Passos

### 1. Migração do Banco
```bash
# No Supabase SQL Editor, execute:
supabase/migrations/006_add_landlord_access_token.sql
```

### 2. Teste
```bash
node test-landlord-access.mjs
```

### 3. Uso
Ao criar contestação, preencha `landlord_email` na vistoria. Token será gerado automaticamente.

Acesse:
```
/landlord/disputes/[TOKEN_GERADO]
```

## URLs

- **Lista:** `/landlord/disputes/[token]`
- **Detalhes:** `/landlord/disputes/[token]/[disputeId]`

## O Que Foi Criado

```
📁 Database
  └── 006_add_landlord_access_token.sql

📁 API
  ├── /api/disputes/landlord/[token]/route.ts
  └── /api/disputes/landlord/[token]/[disputeId]/route.ts

📁 Pages
  ├── /landlord/disputes/[token]/page.tsx
  └── /landlord/disputes/[token]/[disputeId]/page.tsx

📁 Email
  └── src/emails/landlord-dispute-created.tsx

📁 Utils
  └── src/lib/utils/jwt.ts (atualizado)
```

## Recursos

- 📖 **Docs Completos:** `LANDLORD_DISPUTES_ACCESS.md`
- 🚀 **Setup Detalhado:** `LANDLORD_ACCESS_SETUP.md`
- 📊 **Resumo:** `LANDLORD_ACCESS_SUMMARY.md`
- 🧪 **Testes:** `test-landlord-access.mjs`

## Status: ✅ Pronto para Uso
