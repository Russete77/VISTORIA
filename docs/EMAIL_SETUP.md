# Configuração de Email - VistorIA Pro

Este documento explica como configurar e usar o sistema de emails transacionais do VistorIA Pro usando [Resend](https://resend.com/).

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Configuração Inicial](#configuração-inicial)
3. [Como Obter API Key](#como-obter-api-key)
4. [Configurar Domínio](#configurar-domínio)
5. [Testar Localmente](#testar-localmente)
6. [Emails Implementados](#emails-implementados)
7. [Criar Novos Templates](#criar-novos-templates)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O VistorIA Pro usa **Resend** para envio de emails transacionais. Resend é um serviço moderno de email que oferece:

- ✅ API simples e confiável
- ✅ Templates com React/TSX
- ✅ Rastreamento de entregas
- ✅ Tier gratuito generoso (100 emails/dia)
- ✅ Domínio personalizado
- ✅ Dashboard para monitoramento

### Arquitetura

```
src/lib/email/
├── client.ts              # Cliente Resend (singleton)
├── types.ts               # TypeScript types
└── templates/
    └── laudo-pronto.tsx   # Template de laudo pronto
```

---

## ⚙️ Configuração Inicial

### 1. Instalar Dependências

As dependências já estão instaladas no projeto:

```bash
npm install resend @react-email/components @react-email/render
```

### 2. Configurar Variáveis de Ambiente

Copie o `.env.example` para `.env.local` e configure:

```env
# Email (Resend - Transactional Emails)
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=laudos@vistoriapro.com.br
RESEND_FROM_NAME=VistorIA Pro
RESEND_REPLY_TO=contato@vistoriapro.com.br
```

**⚠️ IMPORTANTE:**
- Nunca commite o arquivo `.env.local`
- A API key é sensível - mantenha segura
- Use variáveis diferentes para dev/staging/production

---

## 🔑 Como Obter API Key

### Passo 1: Criar Conta no Resend

1. Acesse [resend.com/signup](https://resend.com/signup)
2. Crie uma conta (gratuita)
3. Confirme seu email

### Passo 2: Gerar API Key

1. Faça login no dashboard
2. Vá para **API Keys** no menu lateral
3. Clique em **Create API Key**
4. Dê um nome (ex: "VistorIA Pro - Production")
5. Selecione as permissões:
   - ✅ Sending access
   - ✅ Full access (para testes)
6. Copie a API key (começa com `re_`)
7. **IMPORTANTE:** Salve em local seguro - não será mostrada novamente

### Passo 3: Adicionar no .env.local

```env
RESEND_API_KEY=re_sua_api_key_aqui
```

---

## 🌐 Configurar Domínio

Por padrão, Resend usa o domínio `onboarding@resend.dev` para testes. Para produção, configure seu próprio domínio:

### Passo 1: Adicionar Domínio

1. No dashboard do Resend, vá para **Domains**
2. Clique em **Add Domain**
3. Digite seu domínio (ex: `vistoriapro.com.br`)

### Passo 2: Configurar DNS

Adicione os seguintes registros DNS no seu provedor de domínio:

```
Tipo: TXT
Nome: @
Valor: (fornecido pelo Resend para verificação)

Tipo: MX
Nome: @
Valor: feedback-smtp.us-east-1.amazonses.com
Prioridade: 10

Tipo: TXT
Nome: _dmarc
Valor: v=DMARC1; p=none; rua=mailto:dmarc@vistoriapro.com.br

Tipo: TXT
Nome: resend._domainkey
Valor: (fornecido pelo Resend - DKIM)
```

### Passo 3: Verificar Domínio

1. Aguarde propagação DNS (5-30 minutos)
2. No Resend, clique em **Verify Domain**
3. Status deve mudar para ✅ **Verified**

### Passo 4: Atualizar .env.local

```env
RESEND_FROM_EMAIL=laudos@vistoriapro.com.br
RESEND_FROM_NAME=VistorIA Pro
```

---

## 🧪 Testar Localmente

### Método 1: Via API Route

Crie um arquivo de teste em `src/app/api/test-email/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { sendEmail, testEmailConfig } from '@/lib/email/client'
import LaudoProntoEmail from '@/lib/email/templates/laudo-pronto'

export async function GET() {
  // Verificar configuração
  const configValid = testEmailConfig()

  if (!configValid) {
    return NextResponse.json(
      { error: 'Email config inválida' },
      { status: 500 }
    )
  }

  // Enviar email de teste
  const result = await sendEmail({
    to: 'seu-email@exemplo.com',
    subject: 'Teste - Laudo Pronto',
    react: LaudoProntoEmail({
      recipientName: 'João Silva',
      propertyName: 'Apartamento Teste',
      propertyAddress: 'Rua Teste, 123',
      inspectorName: 'Vistoriador Teste',
      inspectionDate: '20 de novembro de 2024',
      inspectionType: 'move_in',
      totalProblems: 3,
      urgentProblems: 1,
      highProblems: 1,
      mediumProblems: 1,
      lowProblems: 0,
      reportUrl: 'https://vistoriapro.com.br/reports/123',
      inspectionId: 'test-123',
    }),
  })

  return NextResponse.json(result)
}
```

Acesse: `http://localhost:3000/api/test-email`

### Método 2: Via Console do Navegador

No console do navegador (F12), execute:

```javascript
fetch('/api/test-email')
  .then(res => res.json())
  .then(console.log)
```

### Método 3: Via Resend Preview

Para visualizar o email sem enviar:

```bash
# Instalar Resend CLI (opcional)
npm install -g @react-email/render

# Preview do template
npx tsx src/lib/email/templates/laudo-pronto.tsx
```

---

## 📧 Emails Implementados

### 1. Laudo Pronto ✅

**Trigger:** Quando um laudo é gerado com sucesso

**Destinatário:** Usuário que gerou o laudo

**Conteúdo:**
- Nome do imóvel
- Endereço
- Tipo de vistoria
- Vistoriador
- Data
- Estatísticas de problemas (total, urgentes, altos, médios, baixos)
- Botão CTA para visualizar laudo
- Alerta se houver problemas urgentes

**Arquivo:** `src/lib/email/templates/laudo-pronto.tsx`

**Integração:** `src/app/api/inspections/[id]/generate-report/route.ts`

---

## 🎨 Criar Novos Templates

### Estrutura Básica

```tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Text,
} from '@react-email/components'

interface MeuEmailProps {
  nome: string
  // ... outras props
}

export function MeuEmail({ nome }: MeuEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Heading>Olá, {nome}!</Heading>
          <Text>Seu conteúdo aqui...</Text>
          <Button href="https://..." style={styles.button}>
            Clique Aqui
          </Button>
        </Container>
      </Body>
    </Html>
  )
}

const styles = {
  main: {
    backgroundColor: '#F3F4F6',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
  },
  container: {
    backgroundColor: '#FFFFFF',
    margin: '0 auto',
    padding: '20px',
    maxWidth: '600px',
  },
  button: {
    backgroundColor: '#6366F1',
    color: '#FFFFFF',
    padding: '12px 20px',
    borderRadius: '5px',
    textDecoration: 'none',
  },
}
```

### Boas Práticas

1. **Inline Styles:** Use inline styles, não CSS externo
2. **Compatibilidade:** Teste em Gmail, Outlook, Apple Mail
3. **Responsivo:** Use tabelas para layout consistente
4. **Imagens:** Use URLs absolutas para imagens
5. **CTA Claro:** Botão de ação principal bem visível
6. **Preview Text:** Defina um preview text descritivo
7. **Acessibilidade:** Use alt text em imagens

### Cores do Projeto

```typescript
const COLORS = {
  primary: '#6366F1',      // Indigo (botões principais)
  success: '#10B981',      // Green (sucesso)
  warning: '#F59E0B',      // Amber (avisos)
  danger: '#EF4444',       // Red (urgente)
  text: {
    primary: '#1F2937',    // Gray-800
    secondary: '#6B7280',  // Gray-500
    tertiary: '#9CA3AF',   // Gray-400
  },
  background: {
    main: '#F3F4F6',       // Gray-100
    card: '#F9FAFB',       // Gray-50
    white: '#FFFFFF',
  },
}
```

### Enviar o Novo Email

```typescript
import { sendEmail } from '@/lib/email/client'
import { MeuEmail } from '@/lib/email/templates/meu-email'

const result = await sendEmail({
  to: 'usuario@exemplo.com',
  subject: 'Assunto do Email',
  react: MeuEmail({ nome: 'João' }),
  tags: [
    { name: 'tipo', value: 'meu_email' },
  ],
})

if (result.success) {
  console.log('Email enviado:', result.emailId)
} else {
  console.error('Erro:', result.error)
}
```

---

## 🐛 Troubleshooting

### Email Não Está Sendo Enviado

**1. Verificar configuração:**

```typescript
import { testEmailConfig } from '@/lib/email/client'

if (!testEmailConfig()) {
  console.error('Configuração inválida')
}
```

**2. Verificar logs:**

Procure no console do servidor:
```
[Email] Cliente Resend inicializado
[Email] Enviando email: ...
[Email] Email enviado com sucesso (ID: ...)
```

**3. Verificar API Key:**

- API key está no `.env.local`?
- Começa com `re_`?
- Tem permissões corretas no Resend?

**4. Verificar destinatário:**

```typescript
import { isValidEmail } from '@/lib/email/client'

console.log(isValidEmail('teste@exemplo.com')) // true/false
```

### Email Vai para Spam

**Soluções:**

1. **Configure SPF/DKIM/DMARC:** Siga o passo de [Configurar Domínio](#configurar-domínio)
2. **Use domínio verificado:** Não use `@resend.dev` em produção
3. **Evite palavras spam:** "grátis", "urgente", "clique aqui"
4. **Texto alternativo:** Sempre forneça versão texto do HTML
5. **Unsubscribe link:** Adicione link de descadastro

### Erro: "RESEND_API_KEY não configurada"

```bash
# Verificar se existe no .env.local
cat .env.local | grep RESEND_API_KEY

# Se não existir, adicione:
echo "RESEND_API_KEY=re_sua_key_aqui" >> .env.local

# Reinicie o servidor
npm run dev
```

### Template Não Renderiza Corretamente

**Teste isolado:**

```bash
npm install -g @react-email/render

# Criar arquivo de teste
cat > test-template.tsx << 'EOF'
import { render } from '@react-email/render'
import LaudoProntoEmail from './src/lib/email/templates/laudo-pronto'

const html = render(LaudoProntoEmail({
  recipientName: 'Teste',
  propertyName: 'Teste',
  // ... outros props
}))

console.log(html)
EOF

npx tsx test-template.tsx
```

### Rate Limit Exceeded

**Tier Gratuito:** 100 emails/dia

**Soluções:**
1. Upgrade para tier pago no Resend
2. Implementar queue para emails
3. Agrupar notificações diárias

---

## 📊 Monitoramento

### Dashboard do Resend

Acesse [resend.com/emails](https://resend.com/emails) para ver:

- ✅ Emails enviados
- 📬 Taxa de entrega
- 📊 Opens/Clicks (se habilitado)
- ❌ Bounces/Complaints
- 📝 Logs detalhados

### Logs no Servidor

Todos os envios são logados:

```bash
# Ver logs do servidor Next.js
tail -f .next/trace

# Filtrar apenas emails
tail -f .next/trace | grep "\[Email\]"
```

---

## 🚀 Próximos Passos

### Emails Futuros a Implementar

1. **Welcome Email** - Boas-vindas ao novo usuário
2. **Inspection Reminder** - Lembrete de vistoria agendada
3. **Credit Low** - Aviso de créditos acabando
4. **Subscription Expiring** - Assinatura expirando em breve
5. **Team Invite** - Convite para equipe
6. **Comparison Ready** - Comparação entrada/saída pronta
7. **Weekly Report** - Relatório semanal de atividades

### Melhorias Planejadas

- [ ] Queue de emails com Redis/BullMQ
- [ ] Retry automático em caso de falha
- [ ] Templates de email no banco de dados
- [ ] Editor visual de templates
- [ ] A/B testing de assuntos
- [ ] Segmentação de usuários
- [ ] Analytics detalhado

---

## 📚 Recursos

- [Documentação Resend](https://resend.com/docs)
- [React Email Components](https://react.email/docs/components/html)
- [Email Best Practices](https://resend.com/docs/best-practices)
- [Email Testing Tools](https://www.mail-tester.com/)

---

## ❓ Suporte

Se precisar de ajuda:

1. Verifique este documento
2. Consulte logs do servidor
3. Verifique dashboard do Resend
4. Entre em contato com o time de dev

---

**Última atualização:** 20 de novembro de 2024
