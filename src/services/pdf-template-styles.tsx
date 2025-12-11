/**
 * PDF Template Styles Generator - VistorIA Pro
 * Generates dynamic styles based on template configuration
 */

import { StyleSheet } from '@react-pdf/renderer'
import { PDFTemplateConfig, DEFAULT_TEMPLATE_CONFIG } from '@/types/pdf-template'

/**
 * Generate StyleSheet from template configuration
 */
export function generateStylesFromTemplate(config: PDFTemplateConfig = DEFAULT_TEMPLATE_CONFIG) {
  const { colors, fonts, sections, header } = config

  return StyleSheet.create({
    // Page Styles
    coverPage: {
      padding: 30,
      fontFamily: fonts.body,
      fontSize: fonts.size.body,
      backgroundColor: colors.background,
    },
    infoPage: {
      padding: 30,
      fontFamily: fonts.body,
      fontSize: fonts.size.body,
      lineHeight: 1.4,
      backgroundColor: colors.background,
    },
    roomPage: {
      padding: 25,
      fontFamily: fonts.body,
      fontSize: fonts.size.small + 1,
      lineHeight: 1.3,
      backgroundColor: colors.background,
    },

    // Header
    header: {
      marginBottom: 20,
      textAlign: header.position,
    },
    logo: {
      fontSize: 20,
      fontFamily: fonts.title,
      color: colors.primary,
      marginBottom: 5,
    },
    reportTitle: {
      fontSize: fonts.size.subtitle + 2,
      fontFamily: fonts.title,
      marginTop: 10,
      color: colors.text,
    },
    reportNumber: {
      fontSize: fonts.size.subtitle - 2,
      color: colors.textLight,
      marginTop: 5,
    },

    // Property Info Box
    infoBox: {
      backgroundColor: colors.secondary,
      padding: 15,
      borderRadius: 8,
      marginBottom: 20,
    },
    infoRow: {
      flexDirection: 'row',
      marginBottom: 5,
    },
    infoLabel: {
      fontFamily: fonts.title,
      marginRight: 5,
      color: colors.text,
    },
    infoValue: {
      flex: 1,
      color: colors.text,
    },

    // Signatures Section
    signaturesBox: {
      backgroundColor: colors.secondary,
      padding: 20,
      borderRadius: 8,
      marginTop: 40,
    },
    signaturesTitle: {
      fontSize: fonts.size.subtitle - 2,
      fontFamily: fonts.title,
      marginBottom: 10,
      textAlign: 'center',
      color: colors.text,
    },
    signaturesText: {
      fontSize: fonts.size.small + 1,
      marginBottom: 15,
      textAlign: 'center',
      color: colors.textLight,
    },
    signatureLine: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 40,
      paddingTop: 5,
      borderTopWidth: 1,
      borderTopColor: colors.text,
      borderTopStyle: 'solid',
    },
    signatureItem: {
      width: '45%',
      textAlign: 'center',
    },

    // Informativo Page
    informativoTitle: {
      fontSize: fonts.size.subtitle,
      fontFamily: fonts.title,
      textAlign: 'center',
      marginBottom: 20,
      color: colors.primary,
    },
    informativoBox: {
      backgroundColor: colors.secondary,
      padding: 20,
      borderRadius: 8,
    },
    informativoText: {
      fontSize: fonts.size.body,
      lineHeight: 1.6,
      marginBottom: 10,
      color: colors.text,
    },
    observationTitle: {
      fontSize: fonts.size.body + 1,
      fontFamily: fonts.title,
      marginTop: 15,
      marginBottom: 10,
      color: colors.text,
    },
    bulletPoint: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    bullet: {
      marginRight: 8,
      color: colors.primary,
    },
    bulletText: {
      flex: 1,
      fontSize: fonts.size.body,
      color: colors.text,
    },

    // Room Details
    roomTitle: {
      fontSize: fonts.size.subtitle - 1,
      fontFamily: fonts.title,
      marginBottom: 10,
      paddingBottom: 4,
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
      borderBottomStyle: 'solid',
      color: colors.text,
    },
    detailsBox: {
      backgroundColor: colors.secondary,
      padding: 10,
      borderRadius: 4,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.textLight,
      borderStyle: 'solid',
      wrap: false,
    },
    detailRow: {
      marginBottom: 5,
    },
    detailLabel: {
      fontFamily: fonts.title,
      fontSize: fonts.size.small + 1,
      color: colors.text,
    },
    detailText: {
      fontSize: fonts.size.small + 1,
      lineHeight: 1.4,
      color: colors.text,
    },
    sectionSubtitle: {
      fontSize: fonts.size.body,
      fontFamily: fonts.title,
      marginBottom: 8,
      color: colors.danger,
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
      borderColor: colors.text,
      borderStyle: 'solid',
      marginRight: 8,
    },
    checkboxLabel: {
      fontSize: fonts.size.body,
      fontFamily: fonts.title,
      color: colors.text,
    },

    // Photos Grid
    photosGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 10,
    },
    photoContainer: {
      width: sections.photoLayout === '1x1' ? '100%' : '48%',
      marginBottom: 8,
      wrap: false,
    },
    photo: {
      width: '100%',
      height: sections.photoLayout === '1x1' ? 400 : 180,
      objectFit: 'cover',
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.textLight,
      borderStyle: 'solid',
    },
    photoCaption: {
      fontSize: fonts.size.small - 1,
      textAlign: 'center',
      marginTop: 2,
      color: colors.textLight,
    },

    // Footer
    footer: {
      position: 'absolute',
      bottom: 30,
      left: 40,
      right: 40,
      textAlign: 'center',
      fontSize: fonts.size.small,
      color: colors.textLight,
      borderTopWidth: 1,
      borderTopColor: colors.secondary,
      borderTopStyle: 'solid',
      paddingTop: 10,
    },

    // Severity badges
    severityLow: {
      backgroundColor: colors.success,
      color: '#ffffff',
      padding: '2 6',
      borderRadius: 3,
      fontSize: fonts.size.small,
    },
    severityMedium: {
      backgroundColor: colors.warning,
      color: '#ffffff',
      padding: '2 6',
      borderRadius: 3,
      fontSize: fonts.size.small,
    },
    severityHigh: {
      backgroundColor: colors.danger,
      color: '#ffffff',
      padding: '2 6',
      borderRadius: 3,
      fontSize: fonts.size.small,
    },
    severityUrgent: {
      backgroundColor: '#7c2d12',
      color: '#ffffff',
      padding: '2 6',
      borderRadius: 3,
      fontSize: fonts.size.small,
    },

    // Watermark
    watermark: {
      position: 'absolute',
      bottom: 100,
      left: 0,
      right: 0,
      textAlign: 'center',
      fontSize: 60,
      color: colors.secondary,
      opacity: 0.3,
      transform: 'rotate(-45deg)',
    },

    // Cost styles
    problemCost: {
      fontSize: fonts.size.body,
      fontFamily: fonts.title,
      color: colors.danger,
      marginTop: 4,
    },
    roomSubtotal: {
      fontSize: fonts.size.body + 1,
      fontFamily: fonts.title,
      color: colors.text,
      marginTop: 12,
      paddingTop: 8,
      borderTop: `1pt solid ${colors.secondary}`,
      textAlign: 'right',
    },
    costSummaryBox: {
      backgroundColor: colors.secondary,
      padding: 15,
      borderRadius: 8,
      marginTop: 20,
      marginBottom: 20,
    },
    costSummaryTitle: {
      fontSize: fonts.size.subtitle,
      fontFamily: fonts.title,
      color: colors.danger,
      marginBottom: 10,
      textAlign: 'center',
    },
    costSummaryTotal: {
      fontSize: fonts.size.subtitle + 4,
      fontFamily: fonts.title,
      color: colors.danger,
      textAlign: 'center',
      marginBottom: 10,
    },
    costDisclaimer: {
      fontSize: fonts.size.small,
      color: colors.textLight,
      textAlign: 'center',
      marginTop: 8,
      fontStyle: 'italic',
    },
  })
}

/**
 * Get the number of photos per page based on layout
 */
export function getPhotosPerPage(layout: string): number {
  switch (layout) {
    case '1x1':
      return 1
    case '2x2':
      return 4
    case '2x3':
      return 6
    case '2x4':
      return 8
    default:
      return 6
  }
}

/**
 * Get photo dimensions based on layout
 */
export function getPhotoDimensions(layout: string): { width: string; height: number } {
  switch (layout) {
    case '1x1':
      return { width: '100%', height: 400 }
    case '2x2':
      return { width: '48%', height: 220 }
    case '2x3':
      return { width: '48%', height: 180 }
    case '2x4':
      return { width: '48%', height: 140 }
    default:
      return { width: '48%', height: 180 }
  }
}

/**
 * Format severity for display
 */
export function formatSeverity(severity: string): { label: string; color: string } {
  const severityMap: Record<string, { label: string; color: string }> = {
    low: { label: 'Baixa', color: '#10b981' },
    medium: { label: 'Média', color: '#f59e0b' },
    high: { label: 'Alta', color: '#dc2626' },
    urgent: { label: 'Urgente', color: '#7c2d12' },
  }
  return severityMap[severity] || { label: severity, color: '#6b7280' }
}
