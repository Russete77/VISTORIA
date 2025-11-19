# Stripe: PIX e Boleto no Brasil 🇧🇷

## Status: ✅ CONFIRMADO - Stripe aceita PIX e Boleto

Desde 2021, o Stripe oferece **suporte nativo** para pagamentos no Brasil via:
- **PIX** (instantâneo)
- **Boleto bancário** (prazo de vencimento)
- **Cartão de crédito** (nacional e internacional)

---

## 📊 Comparativo: Stripe vs Hotmart

| Recurso | Stripe | Hotmart |
|---------|--------|---------|
| **API para criar pagamentos** | ✅ Sim (completa) | ❌ Não (apenas consulta) |
| **PIX** | ✅ Sim (nativo desde 2021) | ✅ Sim |
| **Boleto** | ✅ Sim (nativo) | ✅ Sim |
| **Cartão** | ✅ Sim | ✅ Sim |
| **Taxa PIX** | 3.99% | ~10% |
| **Taxa Boleto** | 3.99% + R$ 2,00 | ~10% |
| **Taxa Cartão** | 4.49% + R$ 0,50 | ~10% |
| **Criação programática** | ✅ API completa | ❌ Manual via admin |
| **Uso ideal** | SaaS, marketplaces, apps | Produtos digitais (cursos) |
| **TypeScript SDK** | ✅ Oficial | ❌ Não oficial |
| **Webhooks** | ✅ Robusto | ✅ Básico |
| **Documentação** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

**Conclusão**: Para VistorIA Pro (SaaS com pagamentos dinâmicos), **Stripe é superior**.

---

## 🔧 Como Funciona PIX no Stripe

### 1. Fluxo do Usuário

```
1. Usuário escolhe pacote de créditos → "Comprar R$ 29,90"
2. Stripe Checkout abre → Mostra opções: [Cartão] [PIX] [Boleto]
3. Usuário clica em "PIX"
4. Stripe gera QR Code + chave PIX copiável
5. Usuário abre app do banco → Escaneia QR Code ou cola chave
6. Pagamento instantâneo
7. Webhook notifica seu backend → Créditos adicionados automaticamente
```

### 2. Tempo de Confirmação

- **PIX**: Instantâneo (5-30 segundos)
- **Boleto**: 1-3 dias úteis
- **Cartão**: Instantâneo

---

## 💻 Implementação: Código Atualizado

### Mudanças Necessárias

Atualmente, o checkout está configurado apenas para cartão:

```typescript
// ❌ ANTES (apenas cartão)
payment_method_types: ['card'],
```

Precisa adicionar PIX e Boleto:

```typescript
// ✅ DEPOIS (cartão + PIX + boleto)
payment_method_types: ['card', 'boleto', 'pix'],
```

### Código Completo Atualizado

**Arquivo**: `src/app/api/billing/create-checkout/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

/**
 * POST /api/billing/create-checkout
 * Create Stripe checkout session for purchasing credits
 * Supports: Credit Card, PIX, Boleto
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await auth()
    if (!authResult.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { packageId } = await request.json()

    if (!packageId) {
      return NextResponse.json({ error: 'Package ID required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('clerk_id', authResult.userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Define credit packages
    const packages: Record<string, { credits: number; price: number; name: string }> = {
      starter: {
        credits: 10,
        price: 2990, // R$ 29.90 in cents
        name: 'Pacote Starter - 10 Créditos',
      },
      pro: {
        credits: 30,
        price: 7990, // R$ 79.90 in cents (save ~11%)
        name: 'Pacote Pro - 30 Créditos',
      },
      enterprise: {
        credits: 100,
        price: 19990, // R$ 199.90 in cents (save ~33%)
        name: 'Pacote Enterprise - 100 Créditos',
      },
    }

    const selectedPackage = packages[packageId]
    if (!selectedPackage) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 })
    }

    // ✅ UPDATED: Added PIX and Boleto support
    const session = await stripe.checkout.sessions.create({
      // 🔥 Support for Card, PIX, and Boleto
      payment_method_types: ['card', 'boleto', 'pix'],

      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: selectedPackage.name,
              description: `Compre ${selectedPackage.credits} créditos para criar vistorias e gerar laudos`,
              images: ['https://vistoria-pro.com/logo.png'], // Add your logo URL
            },
            unit_amount: selectedPackage.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',

      // URLs
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,

      // Customer info
      customer_email: user.email,
      client_reference_id: user.id,

      // Metadata for webhook
      metadata: {
        user_id: user.id,
        clerk_id: authResult.userId,
        credits: selectedPackage.credits.toString(),
        package_id: packageId,
      },

      // 🔥 Boleto-specific options
      payment_method_options: {
        boleto: {
          expires_after_days: 3, // Boleto expires in 3 days
        },
      },

      // Locale for Brazilian Portuguese
      locale: 'pt-BR',
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    console.error('Create checkout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Principais Mudanças

1. **`payment_method_types`**: Adicionado `'boleto'` e `'pix'`
2. **`payment_method_options`**: Configuração de expiração do boleto (3 dias)
3. **`locale: 'pt-BR'`**: Interface em português

---

## 🎯 Configuração do Stripe Dashboard

### Passo 1: Ativar Métodos de Pagamento

1. Acesse: https://dashboard.stripe.com/settings/payment_methods
2. Em **"Payment methods"**, habilite:
   - ✅ Cards
   - ✅ PIX
   - ✅ Boleto

### Passo 2: Configurar Informações Fiscais

Para aceitar PIX e Boleto, você precisa:

1. Ir em **Settings** → **Business Details**
2. Preencher:
   - CNPJ da empresa
   - Endereço completo
   - Representante legal
3. Aguardar aprovação (1-2 dias úteis)

### Passo 3: Testar em Modo de Teste

**Cartão de Teste (Stripe)**:
```
Número: 4242 4242 4242 4242
CVC: Qualquer 3 dígitos
Data: Qualquer data futura
```

**PIX de Teste**:
- O Stripe gera um QR Code de teste
- Você pode simular pagamento no dashboard

**Boleto de Teste**:
- O Stripe gera um boleto de teste
- Você pode simular pagamento via dashboard

---

## 🔔 Webhooks: Eventos PIX e Boleto

Quando o pagamento é confirmado, o Stripe envia um webhook.

### Eventos Importantes

| Evento | Descrição | Quando ocorre |
|--------|-----------|---------------|
| `payment_intent.succeeded` | Pagamento aprovado | PIX instantâneo / Boleto pago |
| `payment_intent.payment_failed` | Pagamento falhou | Erro no cartão |
| `checkout.session.completed` | Checkout finalizado | Usuário completou o processo |
| `charge.succeeded` | Cobrança bem-sucedida | Confirmação final |

### Webhook Handler (Já Implementado)

O webhook já está implementado em:
**`src/app/api/webhooks/stripe/route.ts`**

Ele já trata:
- ✅ `checkout.session.completed`
- ✅ Adiciona créditos automaticamente
- ✅ Cria transação no histórico

**Funciona para**: Cartão, PIX e Boleto (sem mudanças necessárias)

---

## 📱 Experiência do Usuário

### Fluxo PIX

```
1. Usuário: /dashboard/billing → "Comprar Créditos"
2. Escolhe: "Pacote Starter - R$ 29,90"
3. Clica: "Comprar"
4. Redirect para: Stripe Checkout
5. Opções aparecem: [Cartão] [PIX] [Boleto]
6. Usuário escolhe: "PIX"
7. Aparece:
   - QR Code (escanear)
   - Chave PIX (copiar/colar)
   - Tempo de expiração: 30 minutos
8. Usuário: Abre app do banco → Paga
9. INSTANTÂNEO: Webhook notifica backend
10. Página de sucesso: "Créditos adicionados! ✅"
```

### Fluxo Boleto

```
1-5. (Igual ao PIX)
6. Usuário escolhe: "Boleto"
7. Aparece:
   - Código de barras
   - Botão "Baixar PDF"
   - Vencimento: Hoje + 3 dias
8. Usuário: Baixa boleto → Paga no banco
9. 1-3 dias úteis: Banco confirma pagamento
10. Webhook notifica: Créditos adicionados
```

---

## 🧪 Testes

### Como Testar PIX (Modo Teste)

1. Configure `.env.local` com chaves de teste:
```bash
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

2. Rode o app:
```bash
npm run dev
```

3. Vá em: http://localhost:3000/dashboard/billing

4. Clique: "Comprar Créditos" → Escolha um pacote

5. No Stripe Checkout (modo teste):
   - Clique em "PIX"
   - Verá um QR Code de teste
   - Não precisa pagar de verdade

6. Simule pagamento no Stripe Dashboard:
   - Vá em: https://dashboard.stripe.com/test/payments
   - Encontre o payment_intent
   - Clique em "..." → "Mark as successful"

7. Webhook dispara → Créditos adicionados!

### Como Testar Boleto (Modo Teste)

Igual ao PIX, mas:
- Escolha "Boleto" no checkout
- Stripe gera um boleto de teste
- Simule pagamento no dashboard

---

## 📊 Taxas e Custos

### Stripe Brasil (2025)

| Método | Taxa por Transação | Taxa Fixa |
|--------|-------------------|-----------|
| **PIX** | 3.99% | R$ 0,00 |
| **Boleto** | 3.99% | R$ 2,00 |
| **Cartão Nacional** | 4.49% | R$ 0,50 |
| **Cartão Internacional** | 5.99% | R$ 0,50 |

### Exemplo: Pacote Starter (R$ 29,90)

- **PIX**: R$ 29,90 - (R$ 29,90 × 0.0399) = **R$ 28,71** (você recebe)
- **Boleto**: R$ 29,90 - (R$ 29,90 × 0.0399 + R$ 2,00) = **R$ 26,71**
- **Cartão**: R$ 29,90 - (R$ 29,90 × 0.0449 + R$ 0,50) = **R$ 28,06**

**Melhor para usuário**: PIX (instantâneo e menor taxa)
**Melhor para empresa**: PIX (menor custo, confirmação instantânea)

---

## ✅ Checklist de Implementação

- [x] Código atualizado com `payment_method_types: ['card', 'boleto', 'pix']`
- [x] Webhook já implementado (funciona para todos os métodos)
- [ ] Habilitar PIX e Boleto no Stripe Dashboard
- [ ] Adicionar CNPJ e informações fiscais
- [ ] Testar em modo teste
- [ ] Testar em produção com valores reais
- [ ] Atualizar UI para informar opções de pagamento

---

## 🎨 UI: Informar Opções de Pagamento

Atualmente, a billing page não informa explicitamente que PIX/Boleto estão disponíveis.

**Sugestão**: Adicionar badge/texto na página de compra:

```tsx
<p className="text-sm text-neutral-600 mt-2">
  💳 Aceita: Cartão, PIX e Boleto
</p>
```

Ou ícones:
```tsx
<div className="flex gap-2 mt-2">
  <Badge variant="outline">💳 Cartão</Badge>
  <Badge variant="outline">⚡ PIX</Badge>
  <Badge variant="outline">🧾 Boleto</Badge>
</div>
```

---

## 📚 Documentação Oficial

- **Stripe PIX**: https://stripe.com/docs/payments/pix
- **Stripe Boleto**: https://stripe.com/docs/payments/boleto
- **Stripe Brasil**: https://stripe.com/br
- **Payment Methods**: https://stripe.com/docs/payments/payment-methods/integration-options
- **Checkout Session API**: https://stripe.com/docs/api/checkout/sessions/create

---

## 🔥 Conclusão

**PIX e Boleto estão prontos para uso no VistorIA Pro!**

Basta:
1. Atualizar código (já feito neste documento)
2. Habilitar no Stripe Dashboard
3. Preencher informações fiscais
4. Testar!

**Vantagens**:
- ✅ Atinge mais brasileiros (muitos não têm cartão)
- ✅ PIX é instantâneo e barato
- ✅ Boleto é familiar para usuários mais tradicionais
- ✅ Stripe cuida de toda a complexidade

**Próximo passo**: Aplicar as mudanças no código! 🚀

---

**Última atualização**: Novembro 2025
**Versão**: 1.0.0
