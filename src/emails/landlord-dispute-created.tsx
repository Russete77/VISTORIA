/**
 * Landlord Dispute Created Email Template
 * Email sent to landlord when a new dispute is created
 */

interface LandlordDisputeCreatedEmailProps {
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

export function LandlordDisputeCreatedEmail({
  landlordName,
  propertyName,
  propertyAddress,
  protocol,
  itemDescription,
  category,
  severity,
  tenantName,
  createdAt,
  accessUrl,
}: LandlordDisputeCreatedEmailProps) {
  const severityColors = {
    low: '#3b82f6', // blue
    medium: '#eab308', // yellow
    high: '#f97316', // orange
    urgent: '#ef4444', // red
  }

  const severityLabels = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    urgent: 'Urgente',
  }

  const categoryLabels = {
    damage_assessment: 'Avaliação de Dano',
    missing_item: 'Item Ausente',
    cleaning_standard: 'Padrão de Limpeza',
    appliance_condition: 'Condição de Equipamentos',
    general_condition: 'Condição Geral',
    other: 'Outro',
  }

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style={{
        margin: 0,
        padding: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        backgroundColor: '#f5f5f5'
      }}>
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#f5f5f5', padding: '40px 20px' }}>
          <tr>
            <td align="center">
              <table width="600" cellPadding="0" cellSpacing="0" style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                {/* Header */}
                <tr>
                  <td style={{
                    backgroundColor: '#2563eb',
                    padding: '32px 40px',
                    borderTopLeftRadius: '8px',
                    borderTopRightRadius: '8px'
                  }}>
                    <h1 style={{
                      margin: 0,
                      color: '#ffffff',
                      fontSize: '24px',
                      fontWeight: '700'
                    }}>
                      VistorIA Pro
                    </h1>
                    <p style={{
                      margin: '8px 0 0 0',
                      color: '#dbeafe',
                      fontSize: '14px'
                    }}>
                      Nova Contestação no Seu Imóvel
                    </p>
                  </td>
                </tr>

                {/* Content */}
                <tr>
                  <td style={{ padding: '40px' }}>
                    <p style={{
                      margin: '0 0 20px 0',
                      color: '#1f2937',
                      fontSize: '16px',
                      lineHeight: '24px'
                    }}>
                      Olá{landlordName ? ` ${landlordName}` : ''},
                    </p>

                    <p style={{
                      margin: '0 0 24px 0',
                      color: '#4b5563',
                      fontSize: '15px',
                      lineHeight: '24px'
                    }}>
                      Uma nova contestação foi registrada para o seu imóvel:
                    </p>

                    {/* Property Card */}
                    <div style={{
                      backgroundColor: '#f9fafb',
                      borderRadius: '6px',
                      padding: '20px',
                      marginBottom: '24px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <p style={{
                        margin: '0 0 8px 0',
                        color: '#6b7280',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Imóvel
                      </p>
                      <p style={{
                        margin: '0 0 4px 0',
                        color: '#111827',
                        fontSize: '16px',
                        fontWeight: '600'
                      }}>
                        {propertyName}
                      </p>
                      <p style={{
                        margin: '0',
                        color: '#6b7280',
                        fontSize: '14px'
                      }}>
                        {propertyAddress}
                      </p>
                    </div>

                    {/* Dispute Details */}
                    <div style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '6px',
                      padding: '20px',
                      marginBottom: '24px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <p style={{
                        margin: '0 0 16px 0',
                        color: '#6b7280',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Detalhes da Contestação
                      </p>

                      <table width="100%" cellPadding="0" cellSpacing="0">
                        <tr>
                          <td style={{ paddingBottom: '12px' }}>
                            <p style={{
                              margin: '0 0 4px 0',
                              color: '#6b7280',
                              fontSize: '12px'
                            }}>
                              Protocolo
                            </p>
                            <p style={{
                              margin: '0',
                              color: '#111827',
                              fontSize: '14px',
                              fontWeight: '600',
                              fontFamily: 'monospace'
                            }}>
                              {protocol}
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ paddingBottom: '12px' }}>
                            <p style={{
                              margin: '0 0 4px 0',
                              color: '#6b7280',
                              fontSize: '12px'
                            }}>
                              Item Contestado
                            </p>
                            <p style={{
                              margin: '0',
                              color: '#111827',
                              fontSize: '14px',
                              fontWeight: '500'
                            }}>
                              {itemDescription}
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ paddingBottom: '12px' }}>
                            <p style={{
                              margin: '0 0 4px 0',
                              color: '#6b7280',
                              fontSize: '12px'
                            }}>
                              Categoria
                            </p>
                            <p style={{
                              margin: '0',
                              color: '#111827',
                              fontSize: '14px'
                            }}>
                              {categoryLabels[category as keyof typeof categoryLabels] || category}
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ paddingBottom: '12px' }}>
                            <p style={{
                              margin: '0 0 4px 0',
                              color: '#6b7280',
                              fontSize: '12px'
                            }}>
                              Gravidade
                            </p>
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              backgroundColor: `${severityColors[severity as keyof typeof severityColors]}15`,
                              color: severityColors[severity as keyof typeof severityColors]
                            }}>
                              {severityLabels[severity as keyof typeof severityLabels] || severity}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <p style={{
                              margin: '0 0 4px 0',
                              color: '#6b7280',
                              fontSize: '12px'
                            }}>
                              Locatário
                            </p>
                            <p style={{
                              margin: '0',
                              color: '#111827',
                              fontSize: '14px'
                            }}>
                              {tenantName}
                            </p>
                          </td>
                        </tr>
                      </table>
                    </div>

                    {/* CTA Button */}
                    <table width="100%" cellPadding="0" cellSpacing="0">
                      <tr>
                        <td align="center" style={{ paddingTop: '8px', paddingBottom: '24px' }}>
                          <a
                            href={accessUrl}
                            style={{
                              display: 'inline-block',
                              padding: '14px 32px',
                              backgroundColor: '#2563eb',
                              color: '#ffffff',
                              textDecoration: 'none',
                              borderRadius: '6px',
                              fontSize: '15px',
                              fontWeight: '600',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}
                          >
                            Acompanhar Contestação
                          </a>
                        </td>
                      </tr>
                    </table>

                    {/* Info Box */}
                    <div style={{
                      backgroundColor: '#eff6ff',
                      borderLeft: '4px solid #2563eb',
                      borderRadius: '4px',
                      padding: '16px',
                      marginBottom: '24px'
                    }}>
                      <p style={{
                        margin: '0 0 8px 0',
                        color: '#1e40af',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        💡 Informação Importante
                      </p>
                      <p style={{
                        margin: '0',
                        color: '#1e3a8a',
                        fontSize: '13px',
                        lineHeight: '20px'
                      }}>
                        Você está recebendo este acesso como proprietário do imóvel. Você pode acompanhar todas as contestações e mensagens, mas não pode responder diretamente. Para qualquer ação, entre em contato com a imobiliária responsável.
                      </p>
                    </div>

                    <p style={{
                      margin: '0 0 8px 0',
                      color: '#6b7280',
                      fontSize: '13px',
                      lineHeight: '20px'
                    }}>
                      Este link é válido por 90 dias e permite acesso a todas as contestações relacionadas aos seus imóveis gerenciados pela imobiliária.
                    </p>

                    <p style={{
                      margin: '0',
                      color: '#9ca3af',
                      fontSize: '12px'
                    }}>
                      Criada em {createdAt}
                    </p>
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td style={{
                    backgroundColor: '#f9fafb',
                    padding: '24px 40px',
                    borderTop: '1px solid #e5e7eb',
                    borderBottomLeftRadius: '8px',
                    borderBottomRightRadius: '8px'
                  }}>
                    <p style={{
                      margin: '0 0 8px 0',
                      color: '#6b7280',
                      fontSize: '12px',
                      textAlign: 'center'
                    }}>
                      VistorIA Pro - Vistorias inteligentes em minutos
                    </p>
                    <p style={{
                      margin: '0',
                      color: '#9ca3af',
                      fontSize: '11px',
                      textAlign: 'center'
                    }}>
                      Este é um email automático. Por favor, não responda.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  )
}

// Plain text version for email clients that don't support HTML
export function LandlordDisputeCreatedEmailText({
  landlordName,
  propertyName,
  propertyAddress,
  protocol,
  itemDescription,
  category,
  severity,
  tenantName,
  createdAt,
  accessUrl,
}: LandlordDisputeCreatedEmailProps) {
  return `
VistorIA Pro - Nova Contestação no Seu Imóvel

Olá${landlordName ? ` ${landlordName}` : ''},

Uma nova contestação foi registrada para o seu imóvel:

IMÓVEL:
${propertyName}
${propertyAddress}

DETALHES DA CONTESTAÇÃO:
Protocolo: ${protocol}
Item Contestado: ${itemDescription}
Categoria: ${category}
Gravidade: ${severity}
Locatário: ${tenantName}
Criada em: ${createdAt}

Acompanhe a contestação clicando no link abaixo:
${accessUrl}

INFORMAÇÃO IMPORTANTE:
Você está recebendo este acesso como proprietário do imóvel. Você pode acompanhar todas as contestações e mensagens, mas não pode responder diretamente. Para qualquer ação, entre em contato com a imobiliária responsável.

Este link é válido por 90 dias e permite acesso a todas as contestações relacionadas aos seus imóveis gerenciados pela imobiliária.

---
VistorIA Pro - Vistorias inteligentes em minutos
Este é um email automático. Por favor, não responda.
  `.trim()
}
