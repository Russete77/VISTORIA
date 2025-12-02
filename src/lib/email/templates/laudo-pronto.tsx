/**
 * Email Template: Laudo Pronto - VistorIA Pro
 * Template de email para notificar que o laudo está pronto
 */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { LaudoProntoEmailProps } from '../types'

const INSPECTION_TYPE_LABELS = {
  move_in: 'Entrada',
  move_out: 'Saída',
  periodic: 'Periódica',
}

export function LaudoProntoEmail({
  recipientName,
  propertyName,
  propertyAddress,
  inspectorName,
  inspectionDate,
  inspectionType,
  totalProblems,
  urgentProblems,
  highProblems,
  mediumProblems,
  lowProblems,
  reportUrl,
}: LaudoProntoEmailProps) {
  const previewText = `Seu laudo de vistoria do imóvel ${propertyName} está pronto!`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          {/* Header com logo */}
          <Section style={styles.header}>
            <Heading style={styles.title}>VistorIA Pro</Heading>
            <Text style={styles.subtitle}>Vistorias Inteligentes</Text>
          </Section>

          {/* Corpo do email */}
          <Section style={styles.content}>
            <Heading style={styles.h1}>
              {recipientName
                ? `Olá, ${recipientName}!`
                : 'Olá!'}
            </Heading>

            <Text style={styles.text}>
              Seu laudo de vistoria está pronto e disponível para download! 🎉
            </Text>

            {/* Informações do imóvel */}
            <Section style={styles.card}>
              <Heading style={styles.h2}>Informações da Vistoria</Heading>

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
                    <td style={styles.labelCell}>Tipo:</td>
                    <td style={styles.valueCell}>
                      {INSPECTION_TYPE_LABELS[inspectionType]}
                    </td>
                  </tr>
                  <tr>
                    <td style={styles.labelCell}>Vistoriador:</td>
                    <td style={styles.valueCell}>{inspectorName}</td>
                  </tr>
                  <tr>
                    <td style={styles.labelCell}>Data:</td>
                    <td style={styles.valueCell}>{inspectionDate}</td>
                  </tr>
                </tbody>
              </table>
            </Section>

            {/* Resumo de problemas */}
            {totalProblems > 0 ? (
              <Section style={styles.card}>
                <Heading style={styles.h2}>Resumo de Problemas</Heading>

                <table style={styles.statsTable}>
                  <tbody>
                    <tr>
                      <td style={styles.statCell}>
                        <div style={styles.statNumber}>{totalProblems}</div>
                        <div style={styles.statLabel}>Total</div>
                      </td>
                      {urgentProblems > 0 && (
                        <td style={styles.statCell}>
                          <div
                            style={{
                              ...styles.statNumber,
                              color: '#DC2626',
                            }}
                          >
                            {urgentProblems}
                          </div>
                          <div style={styles.statLabel}>Urgentes</div>
                        </td>
                      )}
                      {highProblems > 0 && (
                        <td style={styles.statCell}>
                          <div
                            style={{
                              ...styles.statNumber,
                              color: '#EA580C',
                            }}
                          >
                            {highProblems}
                          </div>
                          <div style={styles.statLabel}>Altos</div>
                        </td>
                      )}
                      {mediumProblems > 0 && (
                        <td style={styles.statCell}>
                          <div
                            style={{
                              ...styles.statNumber,
                              color: '#D97706',
                            }}
                          >
                            {mediumProblems}
                          </div>
                          <div style={styles.statLabel}>Médios</div>
                        </td>
                      )}
                      {lowProblems > 0 && (
                        <td style={styles.statCell}>
                          <div
                            style={{
                              ...styles.statNumber,
                              color: '#2563EB',
                            }}
                          >
                            {lowProblems}
                          </div>
                          <div style={styles.statLabel}>Baixos</div>
                        </td>
                      )}
                    </tr>
                  </tbody>
                </table>

                {urgentProblems > 0 && (
                  <Section style={styles.alert}>
                    <Text style={styles.alertText}>
                      ⚠️ Atenção: Este laudo contém{' '}
                      <strong>
                        {urgentProblems}{' '}
                        {urgentProblems === 1
                          ? 'problema urgente'
                          : 'problemas urgentes'}
                      </strong>{' '}
                      que requerem ação imediata.
                    </Text>
                  </Section>
                )}
              </Section>
            ) : (
              <Section style={styles.successCard}>
                <Text style={styles.successText}>
                  ✅ Nenhum problema detectado! O imóvel está em boas condições.
                </Text>
              </Section>
            )}

            {/* Botão de CTA */}
            <Section style={styles.buttonContainer}>
              <Button style={styles.button} href={reportUrl}>
                Visualizar Laudo Completo
              </Button>
            </Section>

            <Text style={styles.note}>
              Ou copie e cole este link no seu navegador:
              <br />
              <Link href={reportUrl} style={styles.link}>
                {reportUrl}
              </Link>
            </Text>

            <Hr style={styles.hr} />

            {/* Informações adicionais */}
            <Text style={styles.footerText}>
              O laudo completo contém todas as fotos, análises detalhadas e
              recomendações da IA. Recomendamos que você revise o documento
              cuidadosamente e compartilhe com as partes interessadas.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerNote}>
              Este é um email automático enviado pelo VistorIA Pro.
              <br />
              Se você não solicitou este laudo, por favor ignore este email.
            </Text>

            <Text style={styles.copyright}>
              © {new Date().getFullYear()} VistorIA Pro. Todos os direitos
              reservados.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Estilos inline (necessário para compatibilidade com clientes de email)
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
    backgroundColor: '#6366F1',
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
    color: '#E0E7FF',
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
  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    padding: '24px',
    margin: '0 0 24px 0',
  },
  successCard: {
    backgroundColor: '#ECFDF5',
    border: '2px solid #10B981',
    borderRadius: '8px',
    padding: '24px',
    margin: '0 0 24px 0',
  },
  successText: {
    color: '#065F46',
    fontSize: '16px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
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
    width: '35%',
  },
  valueCell: {
    color: '#1F2937',
    fontSize: '14px',
    padding: '8px 0',
    verticalAlign: 'top' as const,
  },
  statsTable: {
    width: '100%',
    textAlign: 'center' as const,
  },
  statCell: {
    padding: '16px',
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1F2937',
    margin: '0 0 8px 0',
  },
  statLabel: {
    fontSize: '14px',
    color: '#6B7280',
  },
  alert: {
    backgroundColor: '#FEF2F2',
    border: '2px solid #DC2626',
    borderRadius: '8px',
    padding: '16px',
    margin: '16px 0 0 0',
  },
  alertText: {
    color: '#991B1B',
    fontSize: '14px',
    lineHeight: '20px',
    margin: '0',
  },
  buttonContainer: {
    textAlign: 'center' as const,
    margin: '32px 0',
  },
  button: {
    backgroundColor: '#6366F1',
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
    color: '#6366F1',
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

export default LaudoProntoEmail
