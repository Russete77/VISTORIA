/**
 * Dispute Validation Schemas - VistorIA Pro
 * Zod schemas for dispute-related API validation
 */

import { z } from 'zod'

// =============================================================================
// Enums
// =============================================================================

export const disputeCategorySchema = z.enum([
  'damage_assessment',
  'missing_item',
  'cleaning_standard',
  'appliance_condition',
  'general_condition',
  'other',
])

export const disputeStatusSchema = z.enum([
  'pending',
  'under_review',
  'accepted',
  'rejected',
  'resolved',
])

export const disputeMessageAuthorTypeSchema = z.enum(['tenant', 'admin', 'system'])

export const problemSeveritySchema = z.enum(['low', 'medium', 'high', 'urgent'])

// =============================================================================
// Create Dispute Schema
// =============================================================================

export const createDisputeSchema = z.object({
  inspection_id: z.string().uuid('ID de vistoria inválido'),
  tenant_name: z
    .string()
    .min(2, 'Nome do inquilino deve ter pelo menos 2 caracteres')
    .max(200, 'Nome do inquilino muito longo'),
  tenant_email: z.string().email('Email inválido'),
  tenant_phone: z
    .string()
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .max(20, 'Telefone muito longo')
    .optional()
    .nullable(),
  item_description: z
    .string()
    .min(3, 'Descrição do item deve ter pelo menos 3 caracteres')
    .max(500, 'Descrição do item muito longa'),
  item_location: z.string().max(200, 'Localização muito longa').optional().nullable(),
  category: disputeCategorySchema,
  severity: problemSeveritySchema,
  description: z
    .string()
    .min(10, 'Descrição da contestação deve ter pelo menos 10 caracteres')
    .max(2000, 'Descrição da contestação muito longa'),
  tenant_notes: z.string().max(1000, 'Notas muito longas').optional().nullable(),
})

export type CreateDisputeSchema = z.infer<typeof createDisputeSchema>

// =============================================================================
// Create Dispute Message Schema
// =============================================================================

export const createDisputeMessageSchema = z.object({
  message: z
    .string()
    .min(1, 'Mensagem não pode estar vazia')
    .max(2000, 'Mensagem muito longa'),
  author_type: disputeMessageAuthorTypeSchema,
  author_name: z.string().max(200, 'Nome muito longo').optional().nullable(),
  is_internal_note: z.boolean().optional().default(false),
})

export type CreateDisputeMessageSchema = z.infer<typeof createDisputeMessageSchema>

// =============================================================================
// Update Dispute Status Schema
// =============================================================================

export const updateDisputeStatusSchema = z.object({
  status: disputeStatusSchema,
  resolution_notes: z.string().max(2000, 'Notas de resolução muito longas').optional().nullable(),
})

export type UpdateDisputeStatusSchema = z.infer<typeof updateDisputeStatusSchema>

// =============================================================================
// Upload Dispute Attachment Schema
// =============================================================================

export const uploadDisputeAttachmentSchema = z.object({
  file_name: z.string().min(1, 'Nome do arquivo não pode estar vazio').max(255, 'Nome do arquivo muito longo'),
  file_size: z.number().positive('Tamanho do arquivo deve ser positivo').max(10 * 1024 * 1024, 'Arquivo muito grande (máximo 10MB)'),
  mime_type: z.string().regex(/^image\/(jpeg|jpg|png|webp)$/, 'Tipo de arquivo inválido. Use JPEG, PNG ou WebP'),
  description: z.string().max(500, 'Descrição muito longa').optional().nullable(),
})

export type UploadDisputeAttachmentSchema = z.infer<typeof uploadDisputeAttachmentSchema>

// =============================================================================
// Query Params Schemas
// =============================================================================

export const listDisputesQuerySchema = z.object({
  status: disputeStatusSchema.optional(),
  category: disputeCategorySchema.optional(),
  search: z.string().max(100, 'Busca muito longa').optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export type ListDisputesQuerySchema = z.infer<typeof listDisputesQuerySchema>
