import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from '@react-email/components'
import * as React from 'react'

interface ComparisonReportEmailProps {
  propertyName: string
  propertyAddress: string
  moveInDate: string
  moveOutDate: string
  totalDifferences: number
  newDamages: number
  estimatedCost: string
  reportUrl: string
  recipientName?: string
}

export const ComparisonReportEmail = ({
  propertyName = 'Apartamento 101',
  propertyAddress = 'Rua das Flores, 123',
  moveInDate = '01/01/2024',
  moveOutDate = '01/12/2024',
  totalDifferences = 5,
  newDamages = 2,
  estimatedCost = 'R$ 850,00',
  reportUrl = 'https://app.vistoriapro.com.br/comparisons/123',
  recipientName = 'Cliente',
}: ComparisonReportEmailProps) => {
  const previewText = `Relatório de Comparação - ${propertyName}`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>VISTORIA PRO</Heading>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={title}>Relatório de Comparação</Heading>

            <Text style={greeting}>
              Olá, {recipientName}!
            </Text>

            <Text style={paragraph}>
              O relatório de comparação entre as vistorias de entrada e saída do imóvel foi
              concluído. Abaixo estão os principais resultados:
            </Text>

            {/* Property Info */}
            <Section style={infoBox}>
              <Text style={infoTitle}>Informações do Imóvel</Text>
              <Text style={infoText}>
                <strong>Imóvel:</strong> {propertyName}
              </Text>
              <Text style={infoText}>
                <strong>Endereço:</strong> {propertyAddress}
              </Text>
              <Text style={infoText}>
                <strong>Data de Entrada:</strong> {moveInDate}
              </Text>
              <Text style={infoText}>
                <strong>Data de Saída:</strong> {moveOutDate}
              </Text>
            </Section>

            {/* Statistics */}
            <Section style={statsSection}>
              <Row>
                <Column style={statBox}>
                  <Text style={statValue}>{totalDifferences}</Text>
                  <Text style={statLabel}>Diferenças Encontradas</Text>
                </Column>
                <Column style={statBoxRed}>
                  <Text style={statValue}>{newDamages}</Text>
                  <Text style={statLabel}>Danos Novos</Text>
                </Column>
                <Column style={statBoxGreen}>
                  <Text style={statValue}>{estimatedCost}</Text>
                  <Text style={statLabel}>Custo Estimado</Text>
                </Column>
              </Row>
            </Section>

            {/* Summary */}
            <Text style={paragraph}>
              {newDamages > 0 ? (
                <>
                  Foram identificados <strong>{newDamages} dano(s) novo(s)</strong> que podem
                  ser de responsabilidade do inquilino. O custo estimado para reparos é de{' '}
                  <strong>{estimatedCost}</strong>.
                </>
              ) : (
                <>
                  Não foram identificados danos novos significativos. O imóvel está em boas
                  condições.
                </>
              )}
            </Text>

            {/* CTA Button */}
            <Section style={ctaSection}>
              <Link href={reportUrl} style={button}>
                Ver Relatório Completo
              </Link>
            </Section>

            <Text style={smallText}>
              Este relatório foi gerado automaticamente utilizando inteligência artificial
              para análise comparativa das imagens. Em caso de dúvidas ou discordância,
              entre em contato conosco.
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              VistorIA Pro - Sistema de Vistorias Imobiliárias com IA
            </Text>
            <Text style={footerText}>
              <Link href="mailto:contato@vistoriapro.com.br" style={footerLink}>
                contato@vistoriapro.com.br
              </Link>
            </Text>
            <Text style={footerSmall}>
              Este email foi enviado automaticamente. Por favor, não responda diretamente.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default ComparisonReportEmail

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '600px',
}

const header = {
  backgroundColor: '#1e40af',
  padding: '30px 40px',
  textAlign: 'center' as const,
}

const logo = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  margin: '0',
}

const content = {
  padding: '40px',
}

const title = {
  color: '#1e40af',
  fontSize: '24px',
  fontWeight: 'bold' as const,
  marginBottom: '20px',
  textAlign: 'center' as const,
}

const greeting = {
  color: '#333',
  fontSize: '16px',
  marginBottom: '15px',
}

const paragraph = {
  color: '#555',
  fontSize: '14px',
  lineHeight: '24px',
  marginBottom: '20px',
}

const infoBox = {
  backgroundColor: '#e0f2fe',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '25px',
}

const infoTitle = {
  color: '#1e40af',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  marginBottom: '10px',
  marginTop: '0',
}

const infoText = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '5px 0',
}

const statsSection = {
  marginBottom: '25px',
}

const statBox = {
  backgroundColor: '#dbeafe',
  borderRadius: '8px',
  padding: '15px',
  textAlign: 'center' as const,
  width: '30%',
}

const statBoxRed = {
  backgroundColor: '#fee2e2',
  borderRadius: '8px',
  padding: '15px',
  textAlign: 'center' as const,
  width: '30%',
}

const statBoxGreen = {
  backgroundColor: '#dcfce7',
  borderRadius: '8px',
  padding: '15px',
  textAlign: 'center' as const,
  width: '30%',
}

const statValue = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold' as const,
  margin: '0',
}

const statLabel = {
  color: '#666',
  fontSize: '11px',
  margin: '5px 0 0 0',
}

const ctaSection = {
  textAlign: 'center' as const,
  marginTop: '30px',
  marginBottom: '30px',
}

const button = {
  backgroundColor: '#1e40af',
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  padding: '14px 30px',
  textDecoration: 'none',
}

const smallText = {
  color: '#888',
  fontSize: '12px',
  lineHeight: '20px',
  textAlign: 'center' as const,
}

const hr = {
  borderColor: '#e6e6e6',
  margin: '0',
}

const footer = {
  padding: '30px 40px',
  textAlign: 'center' as const,
}

const footerText = {
  color: '#666',
  fontSize: '14px',
  margin: '5px 0',
}

const footerLink = {
  color: '#1e40af',
  textDecoration: 'none',
}

const footerSmall = {
  color: '#999',
  fontSize: '11px',
  marginTop: '15px',
}
