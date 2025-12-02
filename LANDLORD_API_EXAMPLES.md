# Landlord Access API - Exemplos de Uso

## Endpoints Disponíveis

### 1. Listar Todas as Contestações do Proprietário

**Endpoint:** `GET /api/disputes/landlord/[token]`

**Request:**
```bash
curl -X GET \
  'https://app.vistoriapro.com/api/disputes/landlord/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Response 200:**
```json
{
  "disputes": [
    {
      "id": "uuid",
      "protocol": "DISP-2025-001234",
      "item_description": "Parede da sala com mancha de umidade",
      "category": "damage_assessment",
      "severity": "medium",
      "status": "pending",
      "description": "Há uma grande mancha de umidade na parede...",
      "tenant_name": "Maria Silva",
      "tenant_email": "maria@email.com",
      "tenant_phone": "+5511999999999",
      "created_at": "2025-11-20T10:00:00Z",
      "updated_at": "2025-11-20T10:00:00Z",
      "inspection": {
        "id": "uuid",
        "type": "move_in",
        "status": "completed",
        "scheduled_date": "2025-11-15T14:00:00Z",
        "property": {
          "id": "uuid",
          "name": "Apartamento 101",
          "address": "Rua das Flores, 123",
          "city": "São Paulo",
          "state": "SP"
        }
      },
      "messages": [
        {
          "id": "uuid",
          "author_type": "system",
          "author_name": null,
          "message": "Contestação criada. Protocolo: DISP-2025-001234",
          "is_internal_note": false,
          "created_at": "2025-11-20T10:00:00Z"
        },
        {
          "id": "uuid",
          "author_type": "tenant",
          "author_name": "Maria Silva",
          "message": "A mancha já estava aqui quando entrei.",
          "is_internal_note": false,
          "created_at": "2025-11-20T11:00:00Z"
        }
      ],
      "attachments": []
    }
  ],
  "landlordEmail": "proprietario@email.com",
  "totalDisputes": 1
}
```

**Response 401 (Token inválido):**
```json
{
  "error": "Token inválido ou expirado"
}
```

**Response 500:**
```json
{
  "error": "Erro ao buscar contestações"
}
```

---

### 2. Buscar Contestação Específica

**Endpoint:** `GET /api/disputes/landlord/[token]/[disputeId]`

**Request:**
```bash
curl -X GET \
  'https://app.vistoriapro.com/api/disputes/landlord/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.../uuid-da-contestacao'
```

**Response 200:**
```json
{
  "dispute": {
    "id": "uuid",
    "protocol": "DISP-2025-001234",
    "item_description": "Parede da sala com mancha de umidade",
    "item_location": "Sala de estar, parede norte",
    "category": "damage_assessment",
    "severity": "medium",
    "status": "under_review",
    "description": "Há uma grande mancha de umidade na parede da sala...",
    "tenant_notes": "Gostaria que isso fosse avaliado novamente.",
    "resolution_notes": null,
    "resolved_at": null,
    "tenant_name": "Maria Silva",
    "tenant_email": "maria@email.com",
    "tenant_phone": "+5511999999999",
    "created_at": "2025-11-20T10:00:00Z",
    "updated_at": "2025-11-21T15:30:00Z",
    "inspection": {
      "id": "uuid",
      "type": "move_in",
      "status": "completed",
      "scheduled_date": "2025-11-15T14:00:00Z",
      "inspector_name": "João Inspetor",
      "tenant_name": "Maria Silva",
      "landlord_name": "Carlos Proprietário",
      "property": {
        "id": "uuid",
        "name": "Apartamento 101",
        "address": "Rua das Flores, 123",
        "city": "São Paulo",
        "state": "SP",
        "type": "apartment",
        "bedrooms": 2,
        "bathrooms": 1
      }
    },
    "messages": [
      {
        "id": "uuid",
        "author_type": "system",
        "author_name": null,
        "message": "Contestação criada. Protocolo: DISP-2025-001234",
        "is_internal_note": false,
        "created_at": "2025-11-20T10:00:00Z"
      },
      {
        "id": "uuid",
        "author_type": "tenant",
        "author_name": "Maria Silva",
        "message": "A mancha já estava aqui quando entrei.",
        "is_internal_note": false,
        "created_at": "2025-11-20T11:00:00Z"
      },
      {
        "id": "uuid",
        "author_type": "admin",
        "author_name": "Administrador",
        "message": "Vamos verificar com o inspetor.",
        "is_internal_note": false,
        "created_at": "2025-11-21T09:00:00Z"
      },
      {
        "id": "uuid",
        "author_type": "system",
        "author_name": null,
        "message": "Status alterado de \"pending\" para \"under_review\"",
        "is_internal_note": false,
        "created_at": "2025-11-21T09:01:00Z"
      }
    ],
    "attachments": [
      {
        "id": "uuid",
        "file_name": "foto-parede.jpg",
        "file_size": 2048576,
        "mime_type": "image/jpeg",
        "uploaded_by": "tenant",
        "description": "Foto da mancha na parede",
        "storage_path": "disputes/uuid/foto-parede.jpg",
        "created_at": "2025-11-20T10:05:00Z"
      }
    ]
  }
}
```

**Response 403 (Sem acesso):**
```json
{
  "error": "Acesso negado a esta contestação"
}
```

**Response 404:**
```json
{
  "error": "Contestação não encontrada"
}
```

---

## JavaScript/TypeScript Examples

### Fetch Lista de Contestações

```typescript
async function fetchLandlordDisputes(token: string) {
  try {
    const response = await fetch(`/api/disputes/landlord/${token}`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao carregar contestações')
    }

    return {
      disputes: data.disputes,
      landlordEmail: data.landlordEmail,
      totalDisputes: data.totalDisputes,
    }
  } catch (error) {
    console.error('Erro:', error)
    throw error
  }
}

// Uso
const data = await fetchLandlordDisputes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
console.log(`${data.totalDisputes} contestações encontradas`)
```

### Fetch Contestação Específica

```typescript
async function fetchLandlordDispute(token: string, disputeId: string) {
  try {
    const response = await fetch(`/api/disputes/landlord/${token}/${disputeId}`)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao carregar contestação')
    }

    return data.dispute
  } catch (error) {
    console.error('Erro:', error)
    throw error
  }
}

// Uso
const dispute = await fetchLandlordDispute(
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  'uuid-da-contestacao'
)
console.log(`Protocolo: ${dispute.protocol}`)
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react'

interface LandlordDisputesData {
  disputes: DisputeWithInspection[]
  landlordEmail: string
  totalDisputes: number
}

function useLandlordDisputes(token: string) {
  const [data, setData] = useState<LandlordDisputesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/disputes/landlord/${token}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error)
        }

        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [token])

  return { data, loading, error }
}

// Uso no componente
function LandlordDashboard({ token }: { token: string }) {
  const { data, loading, error } = useLandlordDisputes(token)

  if (loading) return <div>Carregando...</div>
  if (error) return <div>Erro: {error}</div>

  return (
    <div>
      <h1>Minhas Contestações</h1>
      <p>Total: {data?.totalDisputes}</p>
      {data?.disputes.map((dispute) => (
        <div key={dispute.id}>{dispute.item_description}</div>
      ))}
    </div>
  )
}
```

---

## Python Example

```python
import requests
from typing import Optional, Dict, List

class LandlordDisputesClient:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.token = token

    def get_disputes(self) -> Optional[Dict]:
        """Fetch all disputes for landlord"""
        url = f"{self.base_url}/api/disputes/landlord/{self.token}"

        response = requests.get(url)

        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Error: {response.json().get('error')}")

    def get_dispute(self, dispute_id: str) -> Optional[Dict]:
        """Fetch specific dispute"""
        url = f"{self.base_url}/api/disputes/landlord/{self.token}/{dispute_id}"

        response = requests.get(url)

        if response.status_code == 200:
            return response.json()['dispute']
        else:
            raise Exception(f"Error: {response.json().get('error')}")

# Uso
client = LandlordDisputesClient(
    base_url="https://app.vistoriapro.com",
    token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
)

# Listar todas
data = client.get_disputes()
print(f"Total: {data['totalDisputes']}")

for dispute in data['disputes']:
    print(f"- {dispute['protocol']}: {dispute['item_description']}")

# Buscar específica
dispute = client.get_dispute('uuid-da-contestacao')
print(f"Status: {dispute['status']}")
```

---

## Campos Removidos (Segurança)

Os seguintes campos são **sempre removidos** das respostas para proprietários:

- `access_token` - Token de acesso do locatário
- `landlord_access_token` - Token de acesso do proprietário
- `user_id` - ID do usuário admin
- `resolved_by` - ID do usuário que resolveu
- Mensagens com `is_internal_note: true` - Notas internas

---

## Rate Limiting

Atualmente não há rate limiting implementado. Para produção, recomenda-se:

```typescript
// Sugestão para implementação futura
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo de 100 requests por janela
}
```

---

## Webhooks (Futuro)

Em versões futuras, será possível configurar webhooks para notificações:

```json
{
  "event": "dispute.status_changed",
  "dispute_id": "uuid",
  "protocol": "DISP-2025-001234",
  "old_status": "pending",
  "new_status": "under_review",
  "timestamp": "2025-11-21T09:01:00Z"
}
```

---

## Troubleshooting

### Token Expirado
```json
{
  "error": "Token inválido ou expirado"
}
```
**Solução:** Solicitar novo token via email.

### Acesso Negado
```json
{
  "error": "Acesso negado a esta contestação"
}
```
**Solução:** Verificar se email do proprietário está correto na vistoria.

### Contestação Não Encontrada
```json
{
  "error": "Contestação não encontrada"
}
```
**Solução:** Verificar se ID da contestação está correto e se não foi deletada.

---

## Recursos Adicionais

- **Swagger/OpenAPI:** (a implementar)
- **Postman Collection:** (a implementar)
- **GraphQL:** (não disponível)

---

**Última Atualização:** 20/11/2025
**Versão da API:** 1.0.0
