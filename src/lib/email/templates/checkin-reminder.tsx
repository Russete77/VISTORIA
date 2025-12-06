/**
 * Email Template: Check-in Reminder - VistorIA Pro
 * Lembrete de check-in para reservas
 */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

export interface CheckinReminderEmailProps {
  recipientName: string
  propertyName: string
  propertyAddress: string
  checkInDate: string // Ex: "15 de dezembro de 2025"
  daysUntil: number // 0 = hoje, 1 = amanhã, 2+ = X dias
  bookingUrl: string
  guestName?: string
}

export function CheckinReminderEmail({
  recipientName,
  propertyName,
  propertyAddress,
  checkInDate,
  daysUntil,
  bookingUrl,
  guestName,
}: CheckinReminderEmailProps) {
  const isToday = daysUntil === 0
  const isTomorrow = daysUntil === 1

  const previewText = isToday
    ? `Check-in HOJE no ${propertyName}`
    : `Check-in no ${propertyName} ${isTomorrow ? 'amanhã' : `em ${daysUntil} dias`}`

  const urgencyLevel = isToday ? 'high' : isTomorrow ? 'medium' : 'low'

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Heading style={styles.title}>VistorIA Pro</Heading>
            <Text style={styles.subtitle}>Vistorias Inteligentes</Text>
          </Section>

          {/* Body */}
          <Section style={styles.content}>
            <Heading style={styles.h1}>
              {recipientName ? `Olá, ${recipientName}!` : 'Olá!'}
            </Heading>

            {/* Urgency Badge */}
            {isToday && (
              <Section style={styles.urgentBadge}>
                <Text style={styles.urgentText}>⏰ HOJE</Text>
              </Section>
            )}

            {isTomorrow && (
              <Section style={styles.mediumBadge}>
                <Text style={styles.mediumText}>📅 AMANHÃ</Text>
              </Section>
            )}

            <Text style={styles.text}>
              {isToday ? (
                <>
                  <strong>Hoje é o dia do check-in!</strong> Não se esqueça de realizar a
                  vistoria de entrada no imóvel.
                </>
              ) : isTomorrow ? (
                <>
                  <strong>Amanhã é o check-in!</strong> Prepare-se para realizar a vistoria
                  de entrada no imóvel.
                </>
              ) : (
                <>
                  O check-in no imóvel está previsto para <strong>{daysUntil} dias</strong>.
                  Este é um lembrete para que você se prepare!
                </>
              )}
            </Text>

            {/* Booking Info Card */}
            <Section style={styles.card}>
              <Heading style={styles.h2}>Informações da Reserva</Heading>

              <table style={styles.table}>
                <tbody>
                  <tr>
                    <td style={styles.labelCell}>Imóvel:</td>
                    <td style={styles.valueCell}>{propertyName}</td>
                  </tr>
                  <tr>
                    <td style={styles.labelCell}>Endereço:</td>
                    <td style={styles.valueCell}>{propertyAddress}</td>
                  </tr>
                  <tr>
                    <td style={styles.labelCell}>Data Check-in:</td>
                    <td style={styles.valueCell}>
                      <strong>{checkInDate}</strong>
                    </td>
                  </tr>
                  {guestName && (
                    <tr>
                      <td style={styles.labelCell}>Hóspede:</td>
                      <td style={styles.valueCell}>{guestName}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Section>

            {/* Checklist */}
            <Section style={styles.checklistCard}>
              <Heading style={styles.h2}>
                ✅ Checklist para a Vistoria de Entrada
              </Heading>

              <ul style={styles.list}>
                <li style={styles.listItem}>
                  <strong>Antes do check-in:</strong> Revise o estado geral do imóvel
                </li>
                <li style={styles.listItem}>
                  <strong>Durante a vistoria:</strong> Fotografe todos os cômodos e
                  detalhes importantes
                </li>
                <li style={styles.listItem}>
                  <strong>Use a IA:</strong> Deixe nossa inteligência artificial identificar
                  problemas automaticamente
                </li>
                <li style={styles.listItem}>
                  <strong>Documente tudo:</strong> Quanto mais fotos, melhor a proteção
                </li>
                <li style={styles.listItem}>
                  <strong>Gere o laudo:</strong> Compartilhe o relatório com o hóspede
                </li>
              </ul>
            </Section>

            {/* CTA Button */}
            <Section style={styles.buttonContainer}>
              <Button style={styles.button} href={bookingUrl}>
                {isToday
                  ? 'Fazer Vistoria Agora'
                  : 'Ver Detalhes da Reserva'}
              </Button>
            </Section>

            <Text style={styles.note}>
              Ou copie e cole este link no seu navegador:
              <br />
              <Link href={bookingUrl} style={styles.link}>
                {bookingUrl}
              </Link>
            </Text>

            <Hr style={styles.hr} />

            {/* Important Note */}
            {isToday && (
              <Section style={styles.alertCard}>
                <Text style={styles.alertText}>
                  <strong>⚠️ Importante:</strong> A vistoria de entrada deve ser realizada
                  no dia do check-in para garantir máxima proteção legal. Fotografe o estado
                  atual do imóvel antes da chegada do hóspede.
                </Text>
              </Section>
            )}

            <Text style={styles.footerText}>
              Lembretes como este ajudam você a nunca perder um prazo e manter suas
              vistorias em dia. Você pode ajustar suas preferências de notificação nas
              configurações.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerNote}>
              Este é um lembrete automático do VistorIA Pro.
              <br />
              Se você não deseja mais receber estes lembretes, ajuste suas preferências nas
              configurações.
            </Text>

            <Text style={styles.copyright}>
              © {new Date().getFullYear()} VistorIA Pro. Todos os direitos reservados.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Estilos inline (compatibilidade com clientes de email)
const styles = {
  main: {
    backgroundColor: '#F3F4F6',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  container: {
    backgroundColor: '#FFFFFF',
    margin: '0 auto',
    padding: '20px 0',
    maxWidth: '600px',
  },
  header: {
    backgroundColor: '#10B981',
    padding: '40px 20px',
    textAlign: 'center' as const,
  },
  title: {
    color: '#FFFFFF',
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
  },
  subtitle: {
    color: '#D1FAE5',
    fontSize: '16px',
    margin: '0',
  },
  content: {
    padding: '40px 20px',
  },
  h1: {
    color: '#1F2937',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 0 16px 0',
  },
  h2: {
    color: '#374151',
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0 0 16px 0',
  },
  text: {
    color: '#4B5563',
    fontSize: '16px',
    lineHeight: '24px',
    margin: '0 0 24px 0',
  },
  urgentBadge: {
    backgroundColor: '#FEE2E2',
    borderLeft: '4px solid #DC2626',
    padding: '16px 20px',
    margin: '0 0 24px 0',
    borderRadius: '4px',
  },
  urgentText: {
    color: '#991B1B',
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0',
    textAlign: 'center' as const,
  },
  mediumBadge: {
    backgroundColor: '#FEF3C7',
    borderLeft: '4px solid #F59E0B',
    padding: '16px 20px',
    margin: '0 0 24px 0',
    borderRadius: '4px',
  },
  mediumText: {
    color: '#92400E',
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '0',
    textAlign: 'center' as const,
  },
  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    padding: '24px',
    margin: '0 0 24px 0',
  },
  checklistCard: {
    backgroundColor: '#EFF6FF',
    border: '2px solid #3B82F6',
    borderRadius: '8px',
    padding: '24px',
    margin: '0 0 24px 0',
  },
  alertCard: {
    backgroundColor: '#FEF2F2',
    border: '2px solid #DC2626',
    borderRadius: '8px',
    padding: '20px',
    margin: '0 0 24px 0',
  },
  alertText: {
    color: '#991B1B',
    fontSize: '14px',
    lineHeight: '20px',
    margin: '0',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  labelCell: {
    color: '#6B7280',
    fontSize: '14px',
    fontWeight: 'bold',
    padding: '8px 12px 8px 0',
    verticalAlign: 'top' as const,
    width: '40%',
  },
  valueCell: {
    color: '#1F2937',
    fontSize: '14px',
    padding: '8px 0',
    verticalAlign: 'top' as const,
  },
  list: {
    margin: '0',
    padding: '0 0 0 20px',
    color: '#1F2937',
  },
  listItem: {
    fontSize: '14px',
    lineHeight: '24px',
    margin: '0 0 12px 0',
  },
  buttonContainer: {
    textAlign: 'center' as const,
    margin: '32px 0',
  },
  button: {
    backgroundColor: '#10B981',
    borderRadius: '8px',
    color: '#FFFFFF',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '16px 32px',
  },
  note: {
    color: '#6B7280',
    fontSize: '12px',
    lineHeight: '18px',
    textAlign: 'center' as const,
    margin: '0 0 24px 0',
  },
  link: {
    color: '#10B981',
    textDecoration: 'underline',
    wordBreak: 'break-all' as const,
  },
  hr: {
    border: 'none',
    borderTop: '1px solid #E5E7EB',
    margin: '32px 0',
  },
  footerText: {
    color: '#6B7280',
    fontSize: '14px',
    lineHeight: '20px',
    margin: '0',
  },
  footer: {
    padding: '0 20px 20px 20px',
    textAlign: 'center' as const,
  },
  footerNote: {
    color: '#9CA3AF',
    fontSize: '12px',
    lineHeight: '18px',
    margin: '0 0 16px 0',
  },
  copyright: {
    color: '#9CA3AF',
    fontSize: '12px',
    margin: '0',
  },
}

export default CheckinReminderEmail
