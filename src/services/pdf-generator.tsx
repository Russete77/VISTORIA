import ReactPDF, { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer'

/**
 * PDF Generator Service - VistorIA Pro
 * Generates professional inspection reports using React-PDF
 */

// Register fonts (optional - for better typography)
// Font.register({
//   family: 'Inter',
//   src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2',
// })

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: '#6366F1',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  section: {
    marginTop: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottom: 1,
    borderBottomColor: '#E2E8F0',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '30%',
    fontWeight: 'bold',
    color: '#475569',
  },
  value: {
    width: '70%',
    color: '#1E293B',
  },
  roomContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  roomTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 10,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photo: {
    width: '48%',
    height: 150,
    objectFit: 'cover',
    borderRadius: 4,
  },
  issueContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FEF2F2',
    borderLeft: 3,
    borderLeftColor: '#EF4444',
    borderRadius: 4,
  },
  issueTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#991B1B',
    marginBottom: 3,
  },
  issueDescription: {
    fontSize: 10,
    color: '#7F1D1D',
  },
  severityBadge: {
    padding: '3 8',
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 5,
  },
  severityLow: {
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
  },
  severityMedium: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  severityHigh: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  severityUrgent: {
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#94A3B8',
    borderTop: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
  },
  signature: {
    marginTop: 40,
    padding: 15,
    borderTop: 1,
    borderTopColor: '#CBD5E1',
  },
  signatureText: {
    fontSize: 10,
    color: '#475569',
    marginBottom: 5,
  },
  signatureImage: {
    width: 200,
    height: 80,
    marginTop: 10,
  },
})

// Helper function to get severity style
const getSeverityStyle = (severity: string) => {
  switch (severity) {
    case 'low':
      return styles.severityLow
    case 'medium':
      return styles.severityMedium
    case 'high':
      return styles.severityHigh
    case 'urgent':
      return styles.severityUrgent
    default:
      return {}
  }
}

interface GeneratePDFOptions {
  inspection: any
  user: any
}

export async function generateInspectionPDF(options: GeneratePDFOptions): Promise<Buffer> {
  const { inspection, user } = options

  const typeLabels: Record<string, string> = {
    move_in: 'Entrada',
    move_out: 'Saída',
    periodic: 'Periódica',
  }

  const severityLabels: Record<string, string> = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    urgent: 'Urgente',
  }

  const PDFDocument = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Laudo de Vistoria</Text>
          <Text style={styles.subtitle}>
            {typeLabels[inspection.type]} - {new Date(inspection.created_at).toLocaleDateString('pt-BR')}
          </Text>
        </View>

        {/* Property Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações do Imóvel</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nome:</Text>
            <Text style={styles.value}>{inspection.property.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Endereço:</Text>
            <Text style={styles.value}>{inspection.property.address}</Text>
          </View>
          {inspection.property.city && (
            <View style={styles.row}>
              <Text style={styles.label}>Cidade/Estado:</Text>
              <Text style={styles.value}>
                {inspection.property.city}, {inspection.property.state}
              </Text>
            </View>
          )}
          {inspection.property.area && (
            <View style={styles.row}>
              <Text style={styles.label}>Área:</Text>
              <Text style={styles.value}>{inspection.property.area} m²</Text>
            </View>
          )}
        </View>

        {/* Inspection Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações da Vistoria</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Vistoriador:</Text>
            <Text style={styles.value}>{inspection.inspector_name}</Text>
          </View>
          {inspection.tenant_name && (
            <View style={styles.row}>
              <Text style={styles.label}>Locatário:</Text>
              <Text style={styles.value}>{inspection.tenant_name}</Text>
            </View>
          )}
          {inspection.landlord_name && (
            <View style={styles.row}>
              <Text style={styles.label}>Proprietário:</Text>
              <Text style={styles.value}>{inspection.landlord_name}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Data:</Text>
            <Text style={styles.value}>
              {new Date(inspection.scheduled_date).toLocaleDateString('pt-BR')}
            </Text>
          </View>
        </View>

        {/* Rooms and Photos */}
        {inspection.rooms && inspection.rooms.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cômodos Vistoriados</Text>
            {inspection.rooms
              .sort((a: any, b: any) => a.order_index - b.order_index)
              .map((room: any) => (
                <View key={room.id} style={styles.roomContainer}>
                  <Text style={styles.roomTitle}>{room.name}</Text>

                  {/* Photos */}
                  {room.photos && room.photos.length > 0 && (
                    <View style={styles.photoGrid}>
                      {room.photos.slice(0, 4).map((photo: any) => (
                        <Image
                          key={photo.id}
                          src={photo.photo_url}
                          style={styles.photo}
                        />
                      ))}
                    </View>
                  )}

                  {/* AI Detected Issues */}
                  {room.photos && room.photos.some((p: any) => p.ai_analysis?.hasProblems) && (
                    <View style={{ marginTop: 10 }}>
                      {room.photos
                        .filter((p: any) => p.ai_analysis?.hasProblems)
                        .flatMap((p: any) => p.ai_analysis.problems)
                        .map((problem: any, idx: number) => (
                          <View key={idx} style={styles.issueContainer}>
                            <Text style={styles.issueTitle}>{problem.title}</Text>
                            <Text style={styles.issueDescription}>
                              {problem.description}
                            </Text>
                            <View
                              style={[
                                styles.severityBadge,
                                getSeverityStyle(problem.severity),
                              ]}
                            >
                              <Text>
                                Gravidade: {severityLabels[problem.severity]}
                              </Text>
                            </View>
                          </View>
                        ))}
                    </View>
                  )}
                </View>
              ))}
          </View>
        )}

        {/* Issues Summary */}
        {inspection.issues && inspection.issues.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Resumo de Problemas ({inspection.issues.length})
            </Text>
            {inspection.issues.map((issue: any) => (
              <View key={issue.id} style={styles.issueContainer}>
                <Text style={styles.issueTitle}>{issue.title}</Text>
                <Text style={styles.issueDescription}>{issue.description}</Text>
                <View
                  style={[
                    styles.severityBadge,
                    getSeverityStyle(issue.severity),
                  ]}
                >
                  <Text>Gravidade: {severityLabels[issue.severity]}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        {inspection.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observações</Text>
            <Text>{inspection.notes}</Text>
          </View>
        )}

        {/* Signatures */}
        <View style={styles.signature}>
          <Text style={styles.signatureText}>Assinaturas:</Text>
          <View style={styles.row}>
            <View style={{ width: '50%', paddingRight: 10 }}>
              <Text style={{ fontSize: 9, marginTop: 20 }}>
                _________________________________
              </Text>
              <Text style={{ fontSize: 9, marginTop: 5 }}>Vistoriador</Text>
            </View>
            <View style={{ width: '50%', paddingLeft: 10 }}>
              <Text style={{ fontSize: 9, marginTop: 20 }}>
                _________________________________
              </Text>
              <Text style={{ fontSize: 9, marginTop: 5 }}>Responsável</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Gerado com VistorIA Pro - {new Date().toLocaleDateString('pt-BR')}
          </Text>
          <Text>
            Laudo gerado automaticamente com análise de IA
          </Text>
        </View>
      </Page>
    </Document>
  )

  // Generate PDF buffer
  const pdfBuffer = await ReactPDF.renderToBuffer(<PDFDocument />)
  return pdfBuffer
}
