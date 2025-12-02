# Email Module - VistorIA Pro

Módulo de emails transacionais usando Resend.

## Estrutura

```
src/lib/email/
├── client.ts              # Cliente Resend + utilitários
├── types.ts               # TypeScript types
├── index.ts               # Exports centralizados
├── templates/
│   └── laudo-pronto.tsx   # Template: laudo pronto
└── README.md              # Este arquivo
```

## Como Usar

### Enviar Email Simples

```typescript
import { sendEmail } from '@/lib/email'
import { LaudoProntoEmail } from '@/lib/email'

const result = await sendEmail({
  to: 'usuario@exemplo.com',
  subject: 'Seu laudo está pronto!',
  react: LaudoProntoEmail({
    recipientName: 'João Silva',
    propertyName: 'Apartamento 101',
    // ... outras props
  }),
})

if (result.success) {
  console.log('Email enviado:', result.emailId)
}
```

### Validar Email

```typescript
import { isValidEmail, validateEmails } from '@/lib/email'

isValidEmail('teste@exemplo.com') // true
validateEmails(['email1@test.com', 'email2@test.com']) // true
```

### Testar Configuração

```typescript
import { testEmailConfig } from '@/lib/email'

if (testEmailConfig()) {
  console.log('Email configurado corretamente')
}
```

## Templates Disponíveis

### LaudoProntoEmail

Notifica usuário quando laudo está pronto.

**Props:**
- `recipientName` - Nome do destinatário
- `propertyName` - Nome do imóvel
- `propertyAddress` - Endereço do imóvel
- `inspectorName` - Nome do vistoriador
- `inspectionDate` - Data da vistoria
- `inspectionType` - Tipo (move_in, move_out, periodic)
- `totalProblems` - Total de problemas
- `urgentProblems` - Problemas urgentes
- `highProblems` - Problemas altos
- `mediumProblems` - Problemas médios
- `lowProblems` - Problemas baixos
- `reportUrl` - URL do laudo
- `inspectionId` - ID da vistoria

## Criar Novo Template

1. Criar arquivo em `templates/meu-template.tsx`
2. Definir interface de props em `types.ts`
3. Exportar em `index.ts`
4. Usar componentes do `@react-email/components`
5. Testar com `testEmailConfig()`

## Documentação Completa

Veja `/docs/EMAIL_SETUP.md` para documentação completa.
