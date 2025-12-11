import React from 'react'
import ReactPDF, { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer'

/**
 * Satélit PDF Generator Service - VistorIA Pro
 * Generates inspection reports matching the Satélit format
 */

/**
 * Convert image URL to base64 for PDF rendering
 * react-pdf requires images to be accessible, base64 works universally
 */
async function fetchImageAsBase64(url: string): Promise<string> {
  try {
    console.log('[PDF] Fetching image:', url)
    const response = await fetch(url)

    if (!response.ok) {
      console.error('[PDF] Failed to fetch image - Status:', response.status, response.statusText)
      throw new Error(`HTTP ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')

    // Detect image type from URL or default to jpeg
    let mimeType = 'image/jpeg'
    if (url.toLowerCase().endsWith('.png')) {
      mimeType = 'image/png'
    } else if (url.toLowerCase().endsWith('.webp')) {
      mimeType = 'image/webp'
    }

    console.log('[PDF] Successfully converted image to base64, size:', base64.length)
    return `data:${mimeType};base64,${base64}`
  } catch (error) {
    console.error('[PDF] Failed to fetch image:', url, error)
    // Return a transparent 1x1 pixel as fallback
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
  }
}

const styles = StyleSheet.create({
  // Page Styles
  coverPage: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  infoPage: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.4,
  },
  roomPage: {
    padding: 25,
    fontFamily: 'Helvetica',
    fontSize: 9,
    lineHeight: 1.3,
  },

  // Header
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

  // Property Info Box
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
  },
  infoValue: {
    flex: 1,
  },

  // Signatures Section
  signaturesBox: {
    backgroundColor: '#F1F5F9',
    padding: 20,
    borderRadius: 8,
    marginTop: 40,
  },
  signaturesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  signaturesText: {
    fontSize: 9,
    marginBottom: 15,
    textAlign: 'center',
  },
  signatureLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#000',
    borderTopStyle: 'solid',
  },
  signatureItem: {
    width: '45%',
    textAlign: 'center',
  },

  // Informativo Page
  informativoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1E40AF',
  },
  informativoBox: {
    backgroundColor: '#E0F2FE',
    padding: 20,
    borderRadius: 8,
  },
  informativoText: {
    fontSize: 10,
    lineHeight: 1.6,
    marginBottom: 10,
  },
  observationTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    marginRight: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
  },

  // Room Details
  roomTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: '#1E40AF',
    borderBottomStyle: 'solid',
  },
  detailsBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'solid',
    wrap: false, // Prevent box from being cut across pages
  },
  detailRow: {
    marginBottom: 5,
  },
  detailLabel: {
    fontWeight: 'bold',
    fontSize: 9,
  },
  detailText: {
    fontSize: 9,
    lineHeight: 1.4,
  },
  sectionSubtitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#DC2626',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  checkboxSquare: {
    width: 12,
    height: 12,
    borderWidth: 2,
    borderColor: '#000',
    borderStyle: 'solid',
    marginRight: 8,
  },
  checkboxLabel: {
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Photos Grid
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  photoContainer: {
    width: '48%',
    marginBottom: 8,
    wrap: false, // Prevent photo from being cut across pages
  },
  photo: {
    width: '100%',
    height: 180,
    objectFit: 'cover',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'solid',
  },
  photoCaption: {
    fontSize: 7,
    textAlign: 'center',
    marginTop: 2,
    color: '#64748B',
  },

  // Footer - NOT absolute positioned to avoid overlapping
  footer: {
    marginTop: 'auto',
    textAlign: 'center',
    fontSize: 8,
    color: '#64748B',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    borderTopStyle: 'solid',
    paddingTop: 10,
    paddingBottom: 5,
  },
})

interface RoomWithPhotos {
  id: string
  name: string
  type: string
  photos: Array<{
    id: string
    photo_url: string
    storage_path: string
    ai_summary: string | null
    ai_has_problems: boolean
    problems: Array<{
      id: string
      description: string
      severity: string
      location: string | null
      suggested_action: string | null
    }>
  }>
}

interface GenerateSatelitPDFOptions {
  inspection: {
    id: string
    type: string
    status: string
    scheduled_date: string
    created_at: string
    inspector_name?: string
    tenant_name?: string
    landlord_name?: string
    property: {
      name: string
      address: string
      city: string
      state: string
      type: string
      area?: number
    }
  }
  rooms: RoomWithPhotos[]
}

export async function generateSatelitPDF(options: GenerateSatelitPDFOptions): Promise<Buffer> {
  const { inspection, rooms } = options

  const typeLabels: Record<string, string> = {
    move_in: 'ENTRADA',
    move_out: 'SAÍDA',
    periodic: 'PERIÓDICA',
  }

  const propertyTypeLabels: Record<string, string> = {
    apartment: 'APARTAMENTO',
    house: 'CASA',
    commercial: 'COMERCIAL',
    land: 'TERRENO',
    other: 'OUTRO',
  }

  const reportNumber = `VIA ${new Date().getFullYear()} – ${inspection.id.slice(0, 6).toUpperCase()}`
  const vistoriaType = typeLabels[inspection.type] || inspection.type.toUpperCase()
  const propertyType = inspection.property.type
    ? (propertyTypeLabels[inspection.property.type] || inspection.property.type.toUpperCase())
    : 'NÃO ESPECIFICADO'

  // Convert all photo URLs to base64 for PDF rendering
  console.log('[PDF] Converting images to base64...')
  const roomsWithBase64Photos = await Promise.all(
    rooms.map(async (room) => ({
      ...room,
      photos: await Promise.all(
        room.photos.map(async (photo) => ({
          ...photo,
          photo_url_base64: await fetchImageAsBase64(photo.photo_url),
        }))
      ),
    }))
  )
  console.log('[PDF] Image conversion complete')

  const PDFDocument = () => (
    <Document>
      {/* PAGE 1: COVER */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.header}>
          <Text style={styles.logo}>VISTORIA PRO</Text>
          <Text style={styles.reportTitle}>Laudo de Vistoria</Text>
          <Text style={styles.reportNumber}>{reportNumber}</Text>
        </View>

        {/* Property Info */}
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ENDEREÇO:</Text>
            <Text style={styles.infoValue}>{inspection.property.address}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>BAIRRO:</Text>
            <Text style={styles.infoValue}>{inspection.property.city}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>CIDADE:</Text>
            <Text style={styles.infoValue}>{inspection.property.city}</Text>
            <Text style={styles.infoLabel}>ESTADO:</Text>
            <Text style={styles.infoValue}>{inspection.property.state}</Text>
          </View>
          {inspection.property.area && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>METRAGEM:</Text>
              <Text style={styles.infoValue}>{inspection.property.area} M²</Text>
            </View>
          )}
        </View>

        {/* Inspection Info */}
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>LOCAÇÃO:</Text>
            <Text style={styles.infoValue}>RESIDENCIAL</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>TIPIFICAÇÃO:</Text>
            <Text style={styles.infoValue}>{propertyType}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>VISTORIA:</Text>
            <Text style={styles.infoValue}>{vistoriaType}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>DATA DA VISTORIA:</Text>
            <Text style={styles.infoValue}>
              {new Date(inspection.scheduled_date || inspection.created_at).toLocaleDateString('pt-BR')}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>VISTORIA PRO</Text>
          <Text>contato@vistoriapro.com.br</Text>
        </View>
      </Page>

      {/* PAGE 2: INFORMATIVO */}
      <Page size="A4" style={styles.infoPage}>
        <View style={styles.header}>
          <Text style={styles.logo}>VISTORIA PRO</Text>
          <Text style={styles.reportNumber}>{reportNumber}</Text>
          <Text style={styles.reportTitle}>Laudo de Vistoria</Text>
        </View>

        <Text style={styles.informativoTitle}>Informativo</Text>

        <View style={styles.informativoBox}>
          <Text style={styles.informativoText}>
            O laudo de vistoria apresentará em seu contexto a descrição detalhada de cada ambiente, contendo o registro fotográfico (fotos ilimitadas de acordo com a necessidade de cada imóvel).
          </Text>
          <Text style={styles.informativoText}>
            Havendo lacuna na descrição do laudo de vistoria o locador/locatário recorrerá ao registro fotográfico, SENDO ESTE A PROVA MATERIAL para maior precisão e auxílio nos detalhes de cada ambiente.
          </Text>
          <Text style={styles.informativoText}>
            Outrossim, o presente termo passa a fazer parte integrante do contrato de locação firmado entre o locador e locatário, que as partes reciprocamente reconhecem.
          </Text>

          <Text style={styles.observationTitle}>Observações importantes:</Text>

          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              A Vistoria Pro não detecta danos na parte elétrica: como curto, corrente elétrica interrompida ou qualquer dano interno.
            </Text>
          </View>

          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              A Vistoria Pro não detecta na parte hidráulica: entupimento na tubulação interna.
            </Text>
          </View>

          <View style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>
              A Vistoria Pro não detecta dano(s) no(s) aparelho(s) de aquecedor(es), sendo a companhia de fornecimento de gás ou prestadoras de serviços responsáveis pela vistoria de manutenção e/ou funcionamento.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>VISTORIA PRO</Text>
          <Text>contato@vistoriapro.com.br</Text>
        </View>
      </Page>

      {/* PAGES 3+: ROOM DETAILS */}
      {roomsWithBase64Photos.map((room) => {
        // Use 4 photos per page to leave room for analysis text
        const PHOTOS_PER_PAGE = 4
        const photoChunks = []

        // Split photos into chunks of 6
        for (let i = 0; i < room.photos.length; i += PHOTOS_PER_PAGE) {
          photoChunks.push(room.photos.slice(i, i + PHOTOS_PER_PAGE))
        }

        // If no photos, create one page anyway
        if (photoChunks.length === 0) {
          photoChunks.push([])
        }

        // Consolidate AI analysis for the room (only show once, not per photo)
        const roomAnalysisSummary = room.photos
          .filter((p) => p.ai_summary)
          .map((p) => p.ai_summary)
          .slice(0, 2) // Max 2 summaries
          .join(' | ')

        const allProblems = room.photos
          .filter((p) => p.ai_has_problems && p.problems?.length > 0)
          .flatMap((p) => p.problems)
          .slice(0, 5) // Max 5 problems per room

        return photoChunks.map((photoChunk, chunkIndex) => (
          <Page key={`${room.id}-${chunkIndex}`} size="A4" style={styles.roomPage}>
            <View style={{ marginBottom: 15 }}>
              <Text style={styles.logo}>VISTORIA PRO</Text>
              <Text style={styles.reportNumber}>{reportNumber}</Text>
              <Text style={{ fontSize: 12, fontWeight: 'bold', marginTop: 5 }}>
                LAUDO DE VISTORIA DE IMÓVEL
              </Text>
              <Text style={{ fontSize: 11, marginTop: 2 }}>
                DETALHAMENTO POR DEPENDÊNCIA
              </Text>
            </View>

            <Text style={styles.roomTitle}>
              {room.name.toUpperCase()}
              {photoChunks.length > 1 && ` (${chunkIndex + 1}/${photoChunks.length})`}
            </Text>

            {/* Show details only on first page of room */}
            {chunkIndex === 0 && (
              <>
                {/* Consolidated AI Summary for Room */}
                {roomAnalysisSummary && (
                  <View style={styles.detailsBox}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>ANÁLISE DO CÔMODO: </Text>
                        {roomAnalysisSummary.length > 300 
                          ? roomAnalysisSummary.substring(0, 300) + '...'
                          : roomAnalysisSummary
                        }
                      </Text>
                    </View>
                  </View>
                )}

                {/* Consolidated Problems List */}
                {allProblems.length > 0 && (
                  <View style={styles.detailsBox}>
                    <Text style={styles.sectionSubtitle}>PROBLEMAS DETECTADOS ({allProblems.length}):</Text>
                    {allProblems.map((problem, idx) => (
                      <View key={idx} style={styles.detailRow}>
                        <Text style={styles.detailText}>
                          • {problem.description.length > 100 
                              ? problem.description.substring(0, 100) + '...' 
                              : problem.description
                            }
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Basic observation for rooms without AI analysis */}
                {!roomAnalysisSummary && allProblems.length === 0 && (
                  <View style={styles.detailsBox}>
                    <Text style={styles.detailText}>
                      Ambiente vistoriado. Sem problemas detectados pela análise automática.
                    </Text>
                  </View>
                )}

                {/* Photo Registration Checkbox */}
                <View style={styles.checkbox}>
                  <View style={styles.checkboxSquare} />
                  <Text style={styles.checkboxLabel}>REGISTRO FOTOGRÁFICO</Text>
                </View>
              </>
            )}

            {/* Photos - 6 per page in 2 columns */}
            {photoChunk.length > 0 && (
              <View style={styles.photosGrid}>
                {photoChunk.map((photo: any, idx) => {
                  const photoNumber = chunkIndex * PHOTOS_PER_PAGE + idx + 1
                  return (
                    <View key={photo.id} style={styles.photoContainer}>
                      <Image src={photo.photo_url_base64} style={styles.photo} />
                      <Text style={styles.photoCaption}>Foto {photoNumber}</Text>
                    </View>
                  )
                })}
              </View>
            )}

            <View style={styles.footer}>
              <Text>VISTORIA PRO</Text>
              <Text>contato@vistoriapro.com.br</Text>
            </View>
          </Page>
        ))
      })}

      {/* FINAL PAGE: ASSINATURAS */}
      <Page size="A4" style={styles.infoPage}>
        <View style={styles.header}>
          <Text style={styles.logo}>VISTORIA PRO</Text>
          <Text style={styles.reportNumber}>{reportNumber}</Text>
          <Text style={styles.reportTitle}>Assinaturas</Text>
        </View>

        <View style={styles.informativoBox}>
          <Text style={styles.informativoText}>
            O presente termo passa a fazer parte integrante do contrato de locação firmado entre o locador e locatário, que as partes reciprocamente reconhecem.
          </Text>
          <Text style={styles.informativoText}>
            As assinaturas abaixo atestam a concordância com as condições do imóvel na data da vistoria conforme documentado neste laudo.
          </Text>
        </View>

        <View style={{ marginTop: 40 }}>
          <View style={{ marginBottom: 50 }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>LOCADOR(A):</Text>
            <View style={{ borderBottom: '1pt solid #000', paddingBottom: 20, marginTop: 30 }} />
            <Text style={{ fontSize: 9, color: '#666', marginTop: 5 }}>
              Nome: _________________________________ Data: ___/___/______
            </Text>
          </View>

          <View style={{ marginBottom: 50 }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>LOCATÁRIO(A):</Text>
            <View style={{ borderBottom: '1pt solid #000', paddingBottom: 20, marginTop: 30 }} />
            <Text style={{ fontSize: 9, color: '#666', marginTop: 5 }}>
              Nome: _________________________________ Data: ___/___/______
            </Text>
          </View>

          <View style={{ marginBottom: 50 }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>FIADOR(A) (se aplicável):</Text>
            <View style={{ borderBottom: '1pt solid #000', paddingBottom: 20, marginTop: 30 }} />
            <Text style={{ fontSize: 9, color: '#666', marginTop: 5 }}>
              Nome: _________________________________ Data: ___/___/______
            </Text>
          </View>

          <View style={{ marginBottom: 30 }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>TESTEMUNHA 1:</Text>
            <View style={{ borderBottom: '1pt solid #000', paddingBottom: 20, marginTop: 30 }} />
            <Text style={{ fontSize: 9, color: '#666', marginTop: 5 }}>
              Nome: _________________________________ CPF: _______________________
            </Text>
          </View>

          <View>
            <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>TESTEMUNHA 2:</Text>
            <View style={{ borderBottom: '1pt solid #000', paddingBottom: 20, marginTop: 30 }} />
            <Text style={{ fontSize: 9, color: '#666', marginTop: 5 }}>
              Nome: _________________________________ CPF: _______________________
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1pt solid #e2e8f0' }}>
          <Text style={{ fontSize: 8, textAlign: 'center', color: '#64748b' }}>
            Documento gerado em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            {' '}às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Text style={{ fontSize: 8, textAlign: 'center', color: '#64748b', marginTop: 5 }}>
            VISTORIA PRO - Laudo de Vistoria Profissional
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>VISTORIA PRO</Text>
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
