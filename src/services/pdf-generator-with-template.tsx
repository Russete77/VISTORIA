import React from 'react'
import ReactPDF, { Document, Page, Text, View, Image } from '@react-pdf/renderer'
import { PDFTemplateConfig, DEFAULT_TEMPLATE_CONFIG } from '@/types/pdf-template'
import { generateStylesFromTemplate, getPhotosPerPage } from './pdf-template-styles'
import { TechnicalReportData } from './technical-analysis'

/**
 * Template-aware PDF Generator Service - VistorIA Pro
 * Generates inspection reports using customizable templates
 */

/**
 * Convert image URL to base64 for PDF rendering
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
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
  }
}

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

interface GeneratePDFWithTemplateOptions {
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
  technicalReport?: TechnicalReportData
  templateConfig?: PDFTemplateConfig
}

export async function generatePDFWithTemplate(options: GeneratePDFWithTemplateOptions): Promise<Buffer> {
  const { inspection, rooms, technicalReport, templateConfig = DEFAULT_TEMPLATE_CONFIG } = options

  // Generate styles from template
  const styles = generateStylesFromTemplate(templateConfig)
  const { sections, branding, header } = templateConfig

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

  // Get company name from branding or default
  const companyName = branding.companyName || 'VISTORIA PRO'
  const contactEmail = branding.companyEmail || 'contato@vistoriapro.com.br'
  const footerText = branding.footerText || `${companyName}\n${contactEmail}`

  const PHOTOS_PER_PAGE = getPhotosPerPage(sections.photoLayout)

  // Helper para formatar valores em BRL
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined || value === 0) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  // Calcular custo total dos danos
  const calcularCustoTotal = (): number => {
    if (!technicalReport?.comodos) return 0
    return technicalReport.comodos.reduce((total, comodo) => {
      const custoComodo = comodo.danos?.reduce((sum, dano) => sum + (dano.custo_estimado || 0), 0) || 0
      return total + custoComodo
    }, 0)
  }

  const custoTotalEstimado = calcularCustoTotal()

  // Header component based on style
  const HeaderComponent = ({ showTitle = false }: { showTitle?: boolean }) => {
    if (header.style === 'none') return null

    return (
      <View style={styles.header}>
        {(header.style === 'full' || header.style === 'logo-only') && (
          branding.logo ? (
            <Image src={branding.logo} style={{ height: 40, marginBottom: 5 }} />
          ) : (
            <Text style={styles.logo}>{companyName}</Text>
          )
        )}
        {header.style === 'full' && (
          <>
            {showTitle && <Text style={styles.reportTitle}>Laudo de Vistoria</Text>}
            <Text style={styles.reportNumber}>{reportNumber}</Text>
          </>
        )}
        {header.style === 'minimal' && (
          <Text style={styles.reportNumber}>{reportNumber}</Text>
        )}
      </View>
    )
  }

  // Footer component
  const FooterComponent = () => (
    <View style={styles.footer}>
      {branding.showWatermark && <Text>{companyName}</Text>}
      <Text>{contactEmail}</Text>
      {header.showPageNumber && <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />}
    </View>
  )

  const PDFDocument = () => (
    <Document>
      {/* PAGE 1: COVER */}
      {sections.showCover && (
        <Page size="A4" style={styles.coverPage}>
          <HeaderComponent showTitle />

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

          <FooterComponent />
        </Page>
      )}

      {/* PAGE 2: INFORMATIVO */}
      {sections.showInfo && (
        <Page size="A4" style={styles.infoPage}>
          <HeaderComponent />
          <Text style={styles.reportTitle}>Laudo de Vistoria</Text>

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

          <FooterComponent />
        </Page>
      )}

      {/* TECHNICAL REPORT PAGES - 8 Instructions Analysis */}
      {technicalReport && (
        <>
          {/* PAGE: RESUMO EXECUTIVO */}
          <Page size="A4" style={styles.infoPage}>
            <HeaderComponent />
            <Text style={styles.reportTitle}>Laudo Técnico Completo</Text>
            <Text style={styles.informativoTitle}>Resumo Executivo</Text>

            <View style={styles.detailsBox}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total de Cômodos:</Text>
                <Text style={styles.detailText}> {technicalReport.resumo_executivo.total_comodos}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total de Danos:</Text>
                <Text style={styles.detailText}> {technicalReport.resumo_executivo.total_danos}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Problemas Urgentes:</Text>
                <Text style={styles.detailText}> {technicalReport.resumo_executivo.problemas_urgentes}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Condição Geral:</Text>
                <Text style={styles.detailText}> {technicalReport.resumo_executivo.condicao_geral.toUpperCase()}</Text>
              </View>
            </View>

            <Text style={[styles.sectionSubtitle, { marginTop: 15 }]}>Principais Descobertas:</Text>
            <View style={styles.informativoBox}>
              {technicalReport.resumo_executivo.principais_descobertas.map((descoberta, idx) => (
                <View key={idx} style={styles.bulletPoint}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>{descoberta}</Text>
                </View>
              ))}
            </View>

            <FooterComponent />
          </Page>

          {/* PAGE: MAPA DO IMÓVEL */}
          <Page size="A4" style={styles.infoPage}>
            <HeaderComponent />
            <Text style={styles.reportTitle}>Mapa do Imóvel</Text>

            <View style={styles.detailsBox}>
              <Text style={styles.sectionSubtitle}>Fluxo de Navegação:</Text>
              <Text style={styles.detailText}>{technicalReport.mapa_imovel.fluxo_navegacao}</Text>

              <Text style={[styles.sectionSubtitle, { marginTop: 10 }]}>Descrição do Layout:</Text>
              <Text style={styles.detailText}>{technicalReport.mapa_imovel.descricao_layout}</Text>
            </View>

            <Text style={[styles.sectionSubtitle, { marginTop: 15 }]}>Cômodos Identificados:</Text>
            <View style={styles.informativoBox}>
              {technicalReport.mapa_imovel.comodos.map((comodo) => (
                <View key={comodo.ordem} style={styles.bulletPoint}>
                  <Text style={styles.bullet}>{comodo.ordem}.</Text>
                  <Text style={styles.bulletText}>
                    <Text style={{ fontWeight: 'bold' }}>{comodo.nome}</Text> ({comodo.tipo})
                    {comodo.conexoes.length > 0 && ` - Conecta com: ${comodo.conexoes.join(', ')}`}
                  </Text>
                </View>
              ))}
            </View>

            <FooterComponent />
          </Page>

          {/* PAGE: COMPARAÇÃO ANTERIOR (if exists) */}
          {technicalReport.comparacao_anterior && (
            <Page size="A4" style={styles.infoPage}>
              <HeaderComponent />
              <Text style={styles.reportTitle}>Comparação com Vistoria Anterior</Text>

              <View style={styles.detailsBox}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Novos Danos:</Text>
                  <Text style={styles.detailText}> {technicalReport.comparacao_anterior.novos_danos}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Danos Piorados:</Text>
                  <Text style={styles.detailText}> {technicalReport.comparacao_anterior.danos_piorados}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Danos Corrigidos:</Text>
                  <Text style={styles.detailText}> {technicalReport.comparacao_anterior.danos_corrigidos}</Text>
                </View>
              </View>

              <Text style={[styles.sectionSubtitle, { marginTop: 15 }]}>Detalhes da Comparação:</Text>
              <View style={styles.informativoBox}>
                {technicalReport.comparacao_anterior.detalhes.map((detalhe, idx) => (
                  <View key={idx} style={styles.bulletPoint}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>
                      <Text style={{ fontWeight: 'bold' }}>{detalhe.comodo}</Text> -{' '}
                      <Text style={{ fontStyle: 'italic' }}>[{detalhe.tipo.toUpperCase()}]</Text>{' '}
                      {detalhe.descricao}
                    </Text>
                  </View>
                ))}
              </View>

              <FooterComponent />
            </Page>
          )}

          {/* PAGE: RECOMENDAÇÕES TÉCNICAS */}
          <Page size="A4" style={styles.infoPage}>
            <HeaderComponent />
            <Text style={styles.reportTitle}>Recomendações Técnicas</Text>

            {['urgente', 'alta', 'média', 'baixa'].map((prioridade) => {
              const recomendacoes = technicalReport.recomendacoes_tecnicas.filter(
                (r) => r.prioridade === prioridade
              )
              if (recomendacoes.length === 0) return null

              return (
                <View key={prioridade} style={{ marginBottom: 15 }}>
                  <Text style={styles.sectionSubtitle}>
                    Prioridade {prioridade.toUpperCase()} ({recomendacoes.length})
                  </Text>
                  <View style={styles.informativoBox}>
                    {recomendacoes.map((rec, idx) => (
                      <View key={idx} style={styles.bulletPoint}>
                        <Text style={styles.bullet}>•</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.bulletText}>
                            <Text style={{ fontWeight: 'bold' }}>{rec.categoria}:</Text> {rec.recomendacao}
                          </Text>
                          <Text style={[styles.bulletText, { fontSize: 8, fontStyle: 'italic' }]}>
                            Prazo: {rec.prazo}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )
            })}

            <FooterComponent />
          </Page>

          {/* PAGE: AVALIAÇÃO GERAL */}
          <Page size="A4" style={styles.infoPage}>
            <HeaderComponent />
            <Text style={styles.reportTitle}>Avaliação Geral</Text>

            <View style={styles.detailsBox}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Condição Estrutural:</Text>
                <Text style={styles.detailText}> {technicalReport.avaliacao_geral.condicao_estrutural}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Condição Estética:</Text>
                <Text style={styles.detailText}> {technicalReport.avaliacao_geral.condicao_estetica}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Condição Funcional:</Text>
                <Text style={styles.detailText}> {technicalReport.avaliacao_geral.condicao_funcional}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status de Habitabilidade:</Text>
                <Text style={styles.detailText}> {technicalReport.avaliacao_geral.status_habitabilidade.toUpperCase()}</Text>
              </View>
            </View>

            <Text style={[styles.sectionSubtitle, { marginTop: 15 }]}>Observações Finais:</Text>
            <View style={styles.informativoBox}>
              <Text style={styles.informativoText}>{technicalReport.avaliacao_geral.observacoes_finais}</Text>
            </View>

            <FooterComponent />
          </Page>

          {/* PAGE: RESUMO DE CUSTOS */}
          {custoTotalEstimado > 0 && (
            <Page size="A4" style={styles.infoPage}>
              <HeaderComponent />
              <Text style={styles.reportTitle}>Estimativa de Custos de Reparo</Text>

              {/* Total em destaque */}
              <View style={styles.costSummaryBox}>
                <Text style={styles.costSummaryTitle}>CUSTO TOTAL ESTIMADO</Text>
                <Text style={styles.costSummaryTotal}>{formatCurrency(custoTotalEstimado)}</Text>
                <Text style={styles.costDisclaimer}>
                  * Valores estimados baseados em análise visual. Consulte um profissional para orçamento exato.
                </Text>
              </View>

              {/* Detalhamento por cômodo */}
              <Text style={[styles.sectionSubtitle, { marginBottom: 10 }]}>Detalhamento por Cômodo:</Text>

              {technicalReport.comodos
                .filter((comodo) => comodo.danos && comodo.danos.length > 0)
                .map((comodo, idx) => {
                  const custoComodo = comodo.danos.reduce((sum, dano) => sum + (dano.custo_estimado || 0), 0)
                  if (custoComodo === 0) return null

                  return (
                    <View key={idx} style={{ marginBottom: 15 }}>
                      <Text style={[styles.detailLabel, { fontSize: 11, marginBottom: 5 }]}>
                        {comodo.nome.toUpperCase()}
                      </Text>
                      <View style={styles.detailsBox}>
                        {comodo.danos
                          .filter((dano) => dano.custo_estimado && dano.custo_estimado > 0)
                          .map((dano, danoIdx) => (
                            <View key={danoIdx} style={styles.detailRow}>
                              <Text style={[styles.detailText, { flex: 1 }]}>
                                • {dano.descricao}
                                <Text style={{ fontSize: 8, color: '#666' }}> ({dano.severidade})</Text>
                              </Text>
                              <Text style={styles.problemCost}>{formatCurrency(dano.custo_estimado)}</Text>
                            </View>
                          ))}
                        <Text style={styles.roomSubtotal}>
                          Subtotal: {formatCurrency(custoComodo)}
                        </Text>
                      </View>
                    </View>
                  )
                })}

              <View style={styles.informativoBox}>
                <Text style={[styles.informativoText, { fontSize: 9 }]}>
                  <Text style={{ fontWeight: 'bold' }}>Importante:</Text> Os custos apresentados são estimativas
                  baseadas na análise visual das imagens fornecidas e na severidade dos problemas detectados.
                  Para um orçamento preciso, recomendamos consultar profissionais especializados em cada área.
                </Text>
                <Text style={[styles.informativoText, { fontSize: 9, marginTop: 8 }]}>
                  <Text style={{ fontWeight: 'bold' }}>O que está incluído:</Text> As estimativas consideram
                  materiais básicos e mão de obra padrão do mercado brasileiro (2025). Problemas estruturais
                  ou que requeiram inspeção mais detalhada podem ter custos superiores.
                </Text>
              </View>

              <FooterComponent />
            </Page>
          )}
        </>
      )}

      {/* PAGES 3+: ROOM DETAILS */}
      {sections.showPhotos && roomsWithBase64Photos.map((room) => {
        const photoChunks = []

        // Split photos into chunks
        for (let i = 0; i < room.photos.length; i += PHOTOS_PER_PAGE) {
          photoChunks.push(room.photos.slice(i, i + PHOTOS_PER_PAGE))
        }

        // If no photos, create one page anyway
        if (photoChunks.length === 0) {
          photoChunks.push([])
        }

        return photoChunks.map((photoChunk, chunkIndex) => (
          <Page key={`${room.id}-${chunkIndex}`} size="A4" style={styles.roomPage}>
            <View style={{ marginBottom: 15 }}>
              {branding.logo ? (
                <Image src={branding.logo} style={{ height: 30, marginBottom: 5 }} />
              ) : (
                <Text style={styles.logo}>{companyName}</Text>
              )}
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
                {/* AI Summary */}
                {sections.showAIAnalysis && room.photos.some((p) => p.ai_summary) && (
                  <View style={styles.detailsBox}>
                    {room.photos
                      .filter((p) => p.ai_summary)
                      .map((photo) => (
                        <View key={photo.id} style={styles.detailRow}>
                          <Text style={styles.detailText}>
                            <Text style={styles.detailLabel}>ANÁLISE IA:</Text> {photo.ai_summary}
                          </Text>
                        </View>
                      ))}
                  </View>
                )}

                {/* Detailed Problems List */}
                {sections.showProblems && room.photos.some((p) => p.ai_has_problems && p.problems?.length > 0) && (
                  <View style={styles.detailsBox}>
                    <Text style={styles.sectionSubtitle}>PROBLEMAS DETECTADOS:</Text>
                    {room.photos
                      .filter((p) => p.ai_has_problems && p.problems)
                      .flatMap((p) => p.problems)
                      .map((problem, idx) => (
                        <View key={idx} style={styles.detailRow}>
                          <Text style={styles.detailText}>
                            • {problem.description}
                            {problem.location && ` (${problem.location})`}
                          </Text>
                          {problem.suggested_action && (
                            <Text style={[styles.detailText, { marginLeft: 10, fontSize: 8 }]}>
                              Ação: {problem.suggested_action}
                            </Text>
                          )}
                        </View>
                      ))}
                  </View>
                )}

                {/* Basic observation for rooms without AI analysis */}
                {!room.photos.some((p) => p.ai_summary || p.ai_has_problems) && (
                  <View style={styles.detailsBox}>
                    <Text style={styles.detailText}>
                      Aguardando análise detalhada ou observações adicionais.
                    </Text>
                  </View>
                )}

                {/* Photo Registration Checkbox */}
                {sections.showChecklist && (
                  <View style={styles.checkbox}>
                    <View style={styles.checkboxSquare} />
                    <Text style={styles.checkboxLabel}>REGISTRO FOTOGRÁFICO</Text>
                  </View>
                )}
              </>
            )}

            {/* Photos Grid */}
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

            <FooterComponent />
          </Page>
        ))
      })}

      {/* FINAL PAGE: ASSINATURAS */}
      {sections.showSignatures && (
        <Page size="A4" style={styles.infoPage}>
          <HeaderComponent />
          <Text style={styles.reportTitle}>Assinaturas</Text>

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
              {companyName} - Laudo de Vistoria Profissional
            </Text>
          </View>

          <FooterComponent />
        </Page>
      )}
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
