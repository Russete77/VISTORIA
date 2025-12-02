import React from 'react'
import ReactPDF, { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import type { ComparisonWithDetails, ComparisonDifference, ProblemSeverity } from '@/types/database'

/**
 * Comparison PDF Generator Service - VistorIA Pro
 * Generates comparison reports between move-in and move-out inspections
 */

/**
 * Convert image URL to base64 for PDF rendering
 */
async function fetchImageAsBase64(url: string): Promise<string> {
  try {
    console.log('[PDF Comparison] Fetching image:', url)
    const response = await fetch(url)

    if (!response.ok) {
      console.error('[PDF Comparison] Failed to fetch image - Status:', response.status)
      throw new Error(`HTTP ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')

    let mimeType = 'image/jpeg'
    if (url.toLowerCase().endsWith('.png')) {
      mimeType = 'image/png'
    } else if (url.toLowerCase().endsWith('.webp')) {
      mimeType = 'image/webp'
    }

    return `data:${mimeType};base64,${base64}`
  } catch (error) {
    console.error('[PDF Comparison] Failed to fetch image:', url, error)
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
  }
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 5,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  reportNumber: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  infoBox: {
    backgroundColor: '#E0F2FE',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    fontWeight: 'bold',
    marginRight: 5,
    width: 120,
  },
  infoValue: {
    flex: 1,
  },
  statsBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '23%',
    padding: 12,
    borderRadius: 8,
    textAlign: 'center',
  },
  statCardBlue: {
    backgroundColor: '#DBEAFE',
  },
  statCardRed: {
    backgroundColor: '#FEE2E2',
  },
  statCardOrange: {
    backgroundColor: '#FEF3C7',
  },
  statCardGreen: {
    backgroundColor: '#DCFCE7',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 8,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: '#1E40AF',
    borderBottomStyle: 'solid',
  },
  roomSection: {
    marginBottom: 20,
  },
  roomTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: '#F1F5F9',
    padding: 8,
    marginBottom: 10,
  },
  differenceCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'solid',
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
  },
  differenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 8,
    fontWeight: 'bold',
  },
  badgeUrgent: {
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
  },
  badgeHigh: {
    backgroundColor: '#F97316',
    color: '#FFFFFF',
  },
  badgeMedium: {
    backgroundColor: '#EAB308',
    color: '#000000',
  },
  badgeLow: {
    backgroundColor: '#22C55E',
    color: '#FFFFFF',
  },
  badgeNewDamage: {
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
  },
  badgeNaturalWear: {
    backgroundColor: '#6B7280',
    color: '#FFFFFF',
  },
  differenceDescription: {
    fontSize: 10,
    marginBottom: 6,
  },
  differenceLocation: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 6,
  },
  differenceCost: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#DC2626',
    textAlign: 'right',
  },
  photosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  photoContainer: {
    width: '48%',
  },
  photoLabel: {
    fontSize: 8,
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  photo: {
    width: '100%',
    height: 120,
    objectFit: 'cover',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'solid',
  },
  summaryBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderStyle: 'solid',
    borderRadius: 8,
    padding: 15,
    marginTop: 20,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#166534',
  },
  summaryText: {
    fontSize: 10,
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#64748B',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    borderTopStyle: 'solid',
    paddingTop: 10,
  },
  noPhoto: {
    width: '100%',
    height: 120,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  noPhotoText: {
    fontSize: 8,
    color: '#94A3B8',
  },
})

const severityLabels: Record<ProblemSeverity, string> = {
  urgent: 'URGENTE',
  high: 'ALTO',
  medium: 'MÉDIO',
  low: 'BAIXO',
}

const getSeverityStyle = (severity: ProblemSeverity | null) => {
  switch (severity) {
    case 'urgent':
      return styles.badgeUrgent
    case 'high':
      return styles.badgeHigh
    case 'medium':
      return styles.badgeMedium
    case 'low':
    default:
      return styles.badgeLow
  }
}

interface DifferenceWithPhotos extends ComparisonDifference {
  before_photo_url?: string
  after_photo_url?: string
}

interface GenerateComparisonPDFOptions {
  comparison: ComparisonWithDetails
  differences: DifferenceWithPhotos[]
  beforePhotosMap: Map<string, string> // room_name -> photo_url
  afterPhotosMap: Map<string, string>  // room_name -> photo_url
}

export async function generateComparisonPDF(options: GenerateComparisonPDFOptions): Promise<Buffer> {
  const { comparison, differences, beforePhotosMap, afterPhotosMap } = options

  const reportNumber = `COMP ${new Date().getFullYear()} – ${comparison.id.slice(0, 6).toUpperCase()}`

  // Format currency
  const formatCurrency = (value: number | null) => {
    if (value === null || value === 0) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  // Group differences by room
  const differencesByRoom = differences.reduce((acc, diff) => {
    const room = diff.room_name
    if (!acc[room]) {
      acc[room] = []
    }
    acc[room].push(diff)
    return acc
  }, {} as Record<string, DifferenceWithPhotos[]>)

  // Convert photos to base64
  console.log('[PDF Comparison] Converting photos to base64...')
  const photosBase64Map = new Map<string, string>()

  for (const [roomName, url] of beforePhotosMap) {
    photosBase64Map.set(`before_${roomName}`, await fetchImageAsBase64(url))
  }
  for (const [roomName, url] of afterPhotosMap) {
    photosBase64Map.set(`after_${roomName}`, await fetchImageAsBase64(url))
  }

  console.log('[PDF Comparison] Photo conversion complete')

  const PDFDocument = () => (
    <Document>
      {/* PAGE 1: COVER & SUMMARY */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>VISTORIA PRO</Text>
          <Text style={styles.reportTitle}>Relatório de Comparação</Text>
          <Text style={styles.reportNumber}>{reportNumber}</Text>
        </View>

        {/* Property Info */}
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>IMÓVEL:</Text>
            <Text style={styles.infoValue}>{comparison.property.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ENDEREÇO:</Text>
            <Text style={styles.infoValue}>{comparison.property.address}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>DATA ENTRADA:</Text>
            <Text style={styles.infoValue}>
              {new Date(comparison.move_in_inspection.created_at).toLocaleDateString('pt-BR')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>DATA SAÍDA:</Text>
            <Text style={styles.infoValue}>
              {new Date(comparison.move_out_inspection.created_at).toLocaleDateString('pt-BR')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>DATA COMPARAÇÃO:</Text>
            <Text style={styles.infoValue}>
              {new Date(comparison.created_at).toLocaleDateString('pt-BR')}
            </Text>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsBox}>
          <View style={[styles.statCard, styles.statCardBlue]}>
            <Text style={styles.statValue}>{comparison.differences_detected}</Text>
            <Text style={styles.statLabel}>DIFERENÇAS</Text>
          </View>
          <View style={[styles.statCard, styles.statCardRed]}>
            <Text style={styles.statValue}>{comparison.new_damages}</Text>
            <Text style={styles.statLabel}>DANOS NOVOS</Text>
          </View>
          <View style={[styles.statCard, styles.statCardOrange]}>
            <Text style={styles.statValue}>
              {comparison.differences_detected - comparison.new_damages}
            </Text>
            <Text style={styles.statLabel}>DESGASTE NATURAL</Text>
          </View>
          <View style={[styles.statCard, styles.statCardGreen]}>
            <Text style={styles.statValue}>
              {formatCurrency(comparison.estimated_repair_cost)}
            </Text>
            <Text style={styles.statLabel}>CUSTO ESTIMADO</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Resumo da Análise</Text>
          <Text style={styles.summaryText}>
            A comparação entre as vistorias de entrada e saída identificou{' '}
            {comparison.differences_detected} diferença(s) no imóvel.{' '}
            {comparison.new_damages > 0
              ? `Destes, ${comparison.new_damages} são considerados danos novos que podem ser de responsabilidade do inquilino.`
              : 'Não foram identificados danos novos significativos.'}{' '}
            {comparison.estimated_repair_cost && comparison.estimated_repair_cost > 0
              ? `O custo total estimado de reparo é de ${formatCurrency(comparison.estimated_repair_cost)}.`
              : ''}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>VISTORIA PRO - Relatório gerado automaticamente com IA</Text>
          <Text>contato@vistoriapro.com.br</Text>
        </View>
      </Page>

      {/* PAGES 2+: DIFFERENCES BY ROOM */}
      {Object.entries(differencesByRoom).map(([roomName, roomDiffs]) => (
        <Page key={roomName} size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.logo}>VISTORIA PRO</Text>
            <Text style={styles.reportNumber}>{reportNumber}</Text>
          </View>

          <View style={styles.roomSection}>
            <Text style={styles.roomTitle}>{roomName.toUpperCase()}</Text>

            {/* Photos comparison */}
            <View style={styles.photosRow}>
              <View style={styles.photoContainer}>
                <Text style={styles.photoLabel}>ENTRADA</Text>
                {photosBase64Map.has(`before_${roomName}`) ? (
                  <Image
                    src={photosBase64Map.get(`before_${roomName}`)!}
                    style={styles.photo}
                  />
                ) : (
                  <View style={styles.noPhoto}>
                    <Text style={styles.noPhotoText}>Sem foto</Text>
                  </View>
                )}
              </View>
              <View style={styles.photoContainer}>
                <Text style={styles.photoLabel}>SAÍDA</Text>
                {photosBase64Map.has(`after_${roomName}`) ? (
                  <Image
                    src={photosBase64Map.get(`after_${roomName}`)!}
                    style={styles.photo}
                  />
                ) : (
                  <View style={styles.noPhoto}>
                    <Text style={styles.noPhotoText}>Sem foto</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Differences list */}
            <Text style={[styles.sectionTitle, { marginTop: 15 }]}>
              Diferenças Detectadas ({roomDiffs.length})
            </Text>

            {roomDiffs.map((diff, index) => (
              <View key={diff.id || index} style={styles.differenceCard} wrap={false}>
                <View style={styles.differenceHeader}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <Text
                      style={[
                        styles.badge,
                        diff.is_new_damage ? styles.badgeNewDamage : styles.badgeNaturalWear,
                      ]}
                    >
                      {diff.is_new_damage ? 'DANO NOVO' : 'DESGASTE NATURAL'}
                    </Text>
                    {diff.severity && (
                      <Text style={[styles.badge, getSeverityStyle(diff.severity)]}>
                        {severityLabels[diff.severity]}
                      </Text>
                    )}
                  </View>
                  {diff.estimated_repair_cost !== null && diff.estimated_repair_cost > 0 && (
                    <Text style={styles.differenceCost}>
                      {formatCurrency(diff.estimated_repair_cost)}
                    </Text>
                  )}
                </View>
                <Text style={styles.differenceDescription}>{diff.description}</Text>
                {diff.markers && typeof diff.markers === 'object' && 'location' in diff.markers && (
                  <Text style={styles.differenceLocation}>
                    Localização: {(diff.markers as { location: string }).location}
                  </Text>
                )}
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <Text>VISTORIA PRO - Relatório gerado automaticamente com IA</Text>
            <Text>contato@vistoriapro.com.br</Text>
          </View>
        </Page>
      ))}

      {/* FINAL PAGE: SIGNATURES */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>VISTORIA PRO</Text>
          <Text style={styles.reportNumber}>{reportNumber}</Text>
        </View>

        <Text style={styles.sectionTitle}>Termo de Aceite</Text>

        <View style={styles.infoBox}>
          <Text style={{ fontSize: 10, lineHeight: 1.6, marginBottom: 15 }}>
            Declaro que recebi o presente relatório de comparação entre as vistorias de entrada
            e saída do imóvel localizado em {comparison.property.address}, e que estou ciente
            das diferenças identificadas, conforme detalhado neste documento.
          </Text>
          <Text style={{ fontSize: 10, lineHeight: 1.6, marginBottom: 15 }}>
            Este relatório foi gerado automaticamente utilizando tecnologia de inteligência
            artificial para análise comparativa das imagens. Em caso de discordância, favor
            entrar em contato para revisão manual.
          </Text>

          <View style={{ marginTop: 40 }}>
            <View style={{ marginBottom: 50 }}>
              <Text style={{ fontSize: 10, marginBottom: 5 }}>
                PROPRIETÁRIO / LOCADOR:
              </Text>
              <Text style={{ borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 20 }}>
                {''}
              </Text>
              <Text style={{ fontSize: 8, color: '#666', marginTop: 5 }}>
                Nome: _________________________________ Data: ___/___/______
              </Text>
            </View>

            <View style={{ marginBottom: 50 }}>
              <Text style={{ fontSize: 10, marginBottom: 5 }}>
                INQUILINO / LOCATÁRIO:
              </Text>
              <Text style={{ borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 20 }}>
                {''}
              </Text>
              <Text style={{ fontSize: 8, color: '#666', marginTop: 5 }}>
                Nome: _________________________________ Data: ___/___/______
              </Text>
            </View>

            <View>
              <Text style={{ fontSize: 10, marginBottom: 5 }}>
                IMOBILIÁRIA / ADMINISTRADOR:
              </Text>
              <Text style={{ borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 20 }}>
                {''}
              </Text>
              <Text style={{ fontSize: 8, color: '#666', marginTop: 5 }}>
                Nome: _________________________________ Data: ___/___/______
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>VISTORIA PRO - Relatório gerado automaticamente com IA</Text>
          <Text>contato@vistoriapro.com.br</Text>
        </View>
      </Page>
    </Document>
  )

  // Generate PDF buffer
  const stream = await ReactPDF.renderToStream(<PDFDocument />)

  // Convert stream to buffer
  const chunks: Uint8Array[] = []
  return new Promise<Buffer>((resolve, reject) => {
    stream.on('data', (chunk: Uint8Array) => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
  })
}
