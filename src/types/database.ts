/**
 * Database Types - VistorIA Pro
 * Auto-generated types from Supabase schema
 * These types match the schema.sql file
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserTier = 'free' | 'pay_per_use' | 'professional' | 'business' | 'enterprise'

export type PropertyType = 'apartment' | 'house' | 'commercial' | 'land' | 'other'

export type PropertyStatus = 'active' | 'inactive' | 'archived'

export type InspectionType = 'move_in' | 'move_out' | 'periodic'

export type InspectionStatus = 'draft' | 'in_progress' | 'completed' | 'signed'

export type RoomCategory =
  | 'living_room'
  | 'kitchen'
  | 'bathroom'
  | 'bedroom'
  | 'hallway'
  | 'balcony'
  | 'garage'
  | 'other'

export type ProblemSeverity = 'low' | 'medium' | 'high' | 'urgent'

export type ComparisonStatus = 'pending' | 'processing' | 'completed' | 'failed'

export type TransactionType = 'credit_purchase' | 'subscription' | 'add_on'

export type TransactionStatus = 'pending' | 'succeeded' | 'failed' | 'refunded'

export interface UserPreferences {
  language?: string
  email_notifications?: boolean
  push_notifications?: boolean
  marketing_emails?: boolean
  weekly_reports?: boolean
}

export interface User {
  id: string
  clerk_id: string
  email: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  image_url: string | null
  tier: UserTier
  credits: number
  total_vistorias: number
  preferences?: UserPreferences
  created_at: string
  updated_at: string
  last_login_at: string | null
  deleted_at: string | null
}

export interface PropertyCoordinates {
  lat: number
  lng: number
}

export interface Property {
  id: string
  user_id: string
  name: string
  address: string
  city: string | null
  state: string | null
  zip_code: string | null
  // Legacy fields (will be deprecated)
  latitude?: number | null
  longitude?: number | null
  property_type?: PropertyType | null
  area_sqm?: number | null
  // New fields
  type: PropertyType
  bedrooms: number | null
  bathrooms: number | null
  area: number | null
  floor: number | null
  parking_spaces: number | null
  has_elevator: boolean | null
  is_furnished: boolean | null
  coordinates: PropertyCoordinates | null
  thumbnail_url: string | null
  year_built: number | null
  status: PropertyStatus
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Inspection {
  id: string
  user_id: string
  property_id: string
  type: InspectionType
  status: InspectionStatus
  inspector_name: string | null
  tenant_name: string | null
  landlord_name: string | null
  scheduled_date: string | null
  started_at: string | null
  completed_at: string | null
  report_url: string | null
  report_generated_at: string | null
  inspector_signature: string | null
  tenant_signature: string | null
  landlord_signature: string | null
  total_problems: number
  urgent_problems: number
  high_problems: number
  medium_problems: number
  low_problems: number
  charged_credits: number
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface InspectionPhoto {
  id: string
  inspection_id: string
  user_id: string
  room_name: string
  room_category: RoomCategory | null
  storage_path: string
  thumbnail_path: string | null
  file_size: number | null
  ai_analyzed: boolean
  ai_analysis_at: string | null
  ai_has_problems: boolean
  ai_summary: string | null
  ai_confidence: number | null
  user_edited: boolean
  user_notes: string | null
  display_order: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface PhotoProblem {
  id: string
  photo_id: string
  inspection_id: string
  description: string
  severity: ProblemSeverity
  location: string | null
  suggested_action: string | null
  ai_confidence: number | null
  user_confirmed: boolean
  user_dismissed: boolean
  user_notes: string | null
  created_at: string
  updated_at: string
}

export interface Comparison {
  id: string
  user_id: string
  property_id: string
  move_in_inspection_id: string
  move_out_inspection_id: string
  status: ComparisonStatus
  differences_detected: number
  new_damages: number
  estimated_repair_cost: number | null
  report_url: string | null
  report_generated_at: string | null
  charged_credits: number
  created_at: string
  updated_at: string
}

export interface ComparisonDifference {
  id: string
  comparison_id: string
  before_photo_id: string | null
  after_photo_id: string | null
  room_name: string
  description: string
  severity: ProblemSeverity | null
  is_new_damage: boolean
  is_natural_wear: boolean
  estimated_repair_cost: number | null
  markers: Json | null
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  stripe_payment_intent_id: string | null
  stripe_invoice_id: string | null
  type: TransactionType
  amount: number
  currency: string
  credits_purchased: number | null
  credits_before: number | null
  credits_after: number | null
  status: TransactionStatus
  product_name: string | null
  product_tier: string | null
  metadata: Json | null
  created_at: string
  updated_at: string
}

export interface CreditUsage {
  id: string
  user_id: string
  inspection_id: string | null
  comparison_id: string | null
  credits_used: number
  credits_before: number
  credits_after: number
  reason: string | null
  created_at: string
}

// Extended types with relations
export interface PropertyWithInspections extends Property {
  inspections: Inspection[]
}

export interface InspectionWithPhotos extends Inspection {
  photos: InspectionPhoto[]
  property: Property
}

export interface InspectionPhotoWithProblems extends InspectionPhoto {
  problems: PhotoProblem[]
}

export interface ComparisonWithDetails extends Comparison {
  property: Property
  move_in_inspection: Inspection
  move_out_inspection: Inspection
  differences: ComparisonDifference[]
}

// Team Management Types
export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer'

export type TeamMemberStatus = 'active' | 'pending' | 'inactive'

export type TeamInviteStatus = 'pending' | 'accepted' | 'expired' | 'cancelled'

export interface TeamMember {
  id: string
  user_id: string
  email: string
  name: string
  role: TeamRole
  status: TeamMemberStatus
  invited_at: string
  accepted_at: string | null
  last_active_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface TeamInvite {
  id: string
  user_id: string
  email: string
  role: TeamRole
  token: string
  status: TeamInviteStatus
  expires_at: string
  created_at: string
}

export interface TeamActivity {
  id: string
  user_id: string
  team_member_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  metadata: Json
  created_at: string
}

export interface TeamMemberStats {
  inspections_count: number
  reports_generated: number
  last_inspection_date: string | null
}

export interface TeamMemberWithStats extends TeamMember {
  inspections_count: number
  reports_generated: number
  last_inspection_date: string | null
}

export interface TeamActivityWithMember extends TeamActivity {
  team_member: TeamMember | null
}
