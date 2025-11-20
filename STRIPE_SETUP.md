# Configuração do Stripe - VistorIA Pro

Este guia explica como configurar o Stripe para aceitar pagamentos de créditos.

## 1. Criar Conta no Stripe

1. Acesse [https://stripe.com](https://stripe.com)
2. Crie uma conta (use a conta do Brasil)
3. Complete o processo de verificação

## 2. Obter as Chaves da API

1. No Dashboard do Stripe, vá em **Developers** > **API keys**
2. Copie as chaves:
   - **Publishable key** (pk_test_...)
   - **Secret key** (sk_test_...)

## 3. Configurar Variáveis de Ambiente

Adicione no arquivo `.env.local`:

```bash
# Stripe Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... # Será obtido no passo 4
```

## 4. Configurar Webhook

### Desenvolvimento Local (com Stripe CLI)

1. Instale o Stripe CLI:
```bash
# Windows (com Scoop)
scoop install stripe

# macOS (com Homebrew)
brew install stripe/stripe-cli/stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.5/stripe_1.19.5_linux_x86_64.tar.gz
tar -xvf stripe_1.19.5_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/
```

2. Login no Stripe CLI:
```bash
stripe login
```

3. Redirecionar webhooks locais:
```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

4. Copie o **webhook signing secret** (whsec_...) e adicione no `.env.local`

### Produção

1. No Dashboard do Stripe, vá em **Developers** > **Webhooks**
2. Clique em **Add endpoint**
3. Configure:
   - **Endpoint URL**: `https://seu-dominio.com/api/webhooks/stripe`
   - **Events to send**: Selecione:
     - `checkout.session.completed`
     - `checkout.session.expired`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
4. Copie o **Signing secret** (whsec_...) e adicione nas variáveis de ambiente de produção

## 5. Testar Pagamentos

### Cartões de Teste

Use estes números de cartão para testar:

#### Sucesso
- **Número**: 4242 4242 4242 4242
- **CVC**: Qualquer 3 dígitos
- **Data**: Qualquer data futura

#### Sucesso com Autenticação 3D Secure
- **Número**: 4000 0027 6000 3184

#### Falha (Cartão Recusado)
- **Número**: 4000 0000 0000 0002

#### Falha (Fundos Insuficientes)
- **Número**: 4000 0000 0000 9995

### PIX (Teste)

No modo de teste, o Stripe simula o pagamento PIX. O QR Code gerado é apenas para demonstração.

### Boleto (Teste)

No modo de teste, o boleto é gerado mas não precisa ser pago. Você pode marcar manualmente como pago no Dashboard do Stripe.

## 6. Fluxo de Pagamento

1. **Usuário escolhe quantidade de créditos** → `/dashboard/billing/purchase`
2. **Sistema calcula desconto automático**:
   - 10+ créditos: 10% desconto
   - 25+ créditos: 15% desconto
   - 50+ créditos: 20% desconto
   - 100+ créditos: 30% desconto
3. **Usuário clica em "Ir para Pagamento"** → Redirect para Stripe Checkout
4. **Usuário completa pagamento** → Stripe processa
5. **Webhook confirma pagamento** → Créditos são adicionados automaticamente
6. **Usuário é redirecionado** → `/dashboard/billing/success`

## 7. Monitoramento

### Logs do Webhook

Os webhooks são logados no console:
```
[Stripe Webhook] Processing payment for user xxx: 50 credits
✅ Added 50 credits to user xxx (paid R$ 346.50)
```

### Dashboard do Stripe

Monitore pagamentos em:
- **Payments** → Ver todos os pagamentos
- **Customers** → Ver clientes
- **Webhooks** → Ver eventos de webhook

## 8. Modo Produção

Quando estiver pronto para produção:

1. No Dashboard do Stripe, ative sua conta completando o processo de verificação
2. Troque para **Live mode** (toggle no canto superior direito)
3. Obtenha as chaves **LIVE** (pk_live_... e sk_live_...)
4. Atualize as variáveis de ambiente de produção
5. Configure o webhook de produção (passo 4)

## 9. Taxas do Stripe

- **Cartão Nacional**: 3,99% + R$ 0,39 por transação
- **PIX**: 0,99% (sem taxa fixa)
- **Boleto**: R$ 2,99 por transação

## 10. Segurança

✅ **O que já está implementado**:
- Webhook signature verification
- Metadata validation
- HTTPS only (em produção)
- Idempotency (Stripe garante)

❌ **NÃO fazer**:
- Expor STRIPE_SECRET_KEY no frontend
- Confiar apenas no frontend (sempre validar no webhook)
- Processar pagamentos sem verificar assinatura do webhook

## Suporte

- Documentação: https://stripe.com/docs
- Dashboard: https://dashboard.stripe.com
- Status: https://status.stripe.com
