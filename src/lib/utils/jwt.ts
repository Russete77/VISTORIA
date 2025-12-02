/**
 * JWT Utilities - VistorIA Pro
 * Token generation and validation for dispute public access
 */

import { SignJWT, jwtVerify } from 'jose'
import { DISPUTE_CONFIG } from '@/lib/constants'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'

// Convert secret to Uint8Array for jose library
const getSecretKey = () => {
  return new TextEncoder().encode(JWT_SECRET)
}

// =============================================================================
// Types
// =============================================================================

export interface DisputeTokenPayload {
  disputeId: string
  protocol: string
  tenantEmail: string
  inspectionId: string
}

export interface VerifiedDisputeToken extends DisputeTokenPayload {
  iat: number
  exp: number
}

export interface LandlordTokenPayload {
  landlordEmail: string
  userId: string // Admin user who created the inspection
}

export interface VerifiedLandlordToken extends LandlordTokenPayload {
  iat: number
  exp: number
}

// =============================================================================
// Generate Dispute Access Token
// =============================================================================

export async function generateDisputeToken(payload: DisputeTokenPayload): Promise<string> {
  try {
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + DISPUTE_CONFIG.TOKEN_EXPIRY_DAYS)

    const token = await new SignJWT({
      disputeId: payload.disputeId,
      protocol: payload.protocol,
      tenantEmail: payload.tenantEmail,
      inspectionId: payload.inspectionId,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiryDate)
      .setIssuer('vistoria-pro')
      .setAudience('dispute-access')
      .sign(getSecretKey())

    return token
  } catch (error) {
    console.error('Error generating dispute token:', error)
    throw new Error('Failed to generate access token')
  }
}

// =============================================================================
// Verify Dispute Access Token
// =============================================================================

export async function verifyDisputeToken(token: string): Promise<VerifiedDisputeToken | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: 'vistoria-pro',
      audience: 'dispute-access',
    })

    return {
      disputeId: payload.disputeId as string,
      protocol: payload.protocol as string,
      tenantEmail: payload.tenantEmail as string,
      inspectionId: payload.inspectionId as string,
      iat: payload.iat as number,
      exp: payload.exp as number,
    }
  } catch (error) {
    if (error instanceof Error) {
      // Token expired
      if (error.message.includes('exp')) {
        console.warn('Dispute token expired:', error.message)
        return null
      }
      // Invalid signature or malformed token
      console.warn('Invalid dispute token:', error.message)
    }
    return null
  }
}

// =============================================================================
// Check if Token is Expired
// =============================================================================

export function isTokenExpired(token: VerifiedDisputeToken): boolean {
  const now = Math.floor(Date.now() / 1000)
  return token.exp < now
}

// =============================================================================
// Get Token Expiry Date
// =============================================================================

export function getTokenExpiryDate(token: VerifiedDisputeToken): Date {
  return new Date(token.exp * 1000)
}

// =============================================================================
// Generate Short-Lived Admin Token (for immediate actions)
// =============================================================================

export async function generateShortLivedToken(disputeId: string): Promise<string> {
  try {
    const token = await new SignJWT({ disputeId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h') // 1 hour only
      .setIssuer('vistoria-pro')
      .setAudience('admin-action')
      .sign(getSecretKey())

    return token
  } catch (error) {
    console.error('Error generating short-lived token:', error)
    throw new Error('Failed to generate admin token')
  }
}

// =============================================================================
// Verify Admin Token
// =============================================================================

export async function verifyAdminToken(token: string): Promise<{ disputeId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: 'vistoria-pro',
      audience: 'admin-action',
    })

    return {
      disputeId: payload.disputeId as string,
    }
  } catch (error) {
    console.warn('Invalid admin token:', error)
    return null
  }
}

// =============================================================================
// Generate Landlord Access Token
// =============================================================================

export async function generateLandlordToken(payload: LandlordTokenPayload): Promise<string> {
  try {
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + DISPUTE_CONFIG.TOKEN_EXPIRY_DAYS)

    const token = await new SignJWT({
      landlordEmail: payload.landlordEmail,
      userId: payload.userId,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiryDate)
      .setIssuer('vistoria-pro')
      .setAudience('landlord-access')
      .sign(getSecretKey())

    return token
  } catch (error) {
    console.error('Error generating landlord token:', error)
    throw new Error('Failed to generate landlord access token')
  }
}

// =============================================================================
// Verify Landlord Access Token
// =============================================================================

export async function verifyLandlordToken(token: string): Promise<VerifiedLandlordToken | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: 'vistoria-pro',
      audience: 'landlord-access',
    })

    return {
      landlordEmail: payload.landlordEmail as string,
      userId: payload.userId as string,
      iat: payload.iat as number,
      exp: payload.exp as number,
    }
  } catch (error) {
    if (error instanceof Error) {
      // Token expired
      if (error.message.includes('exp')) {
        console.warn('Landlord token expired:', error.message)
        return null
      }
      // Invalid signature or malformed token
      console.warn('Invalid landlord token:', error.message)
    }
    return null
  }
}
