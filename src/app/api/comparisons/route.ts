import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import { comparePhotos } from '@/lib/anthropic/compare'
import { z } from 'zod'
import type { InspectionPhoto, ComparisonStatus } from '@/types/database'

/**
 * Comparisons API - VistorIA Pro
 * GET: List all comparisons for authenticated user
 * POST: Create new comparison
 */

const createComparisonSchema = z.object({
  property_id: z.string().uuid(),
  move_in_inspection_id: z.string().uuid(),
  move_out_inspection_id: z.string().uuid(),
})

// GET: List all comparisons
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Get user from database
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user settings for AI strictness default
    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('ai_inspection_strictness')
      .eq('user_id', user.id)
      .maybeSingle()


    // Get search params
    const searchParams = request.nextUrl.searchParams
    const propertyId = searchParams.get('property_id')
    const status = searchParams.get('status')

    // Build query
    let query = supabase
      .from('comparisons')
      .select(`
        *,
        property:properties(id, name, address),
        move_in_inspection:inspections!comparisons_move_in_inspection_id_fkey(id, type, created_at),
        move_out_inspection:inspections!comparisons_move_out_inspection_id_fkey(id, type, created_at)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: comparisons, error } = await query

    if (error) {
      console.error('Error fetching comparisons:', error)
      return NextResponse.json(
        { error: 'Failed to fetch comparisons' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      comparisons: comparisons || [],
      count: comparisons?.length || 0,
    })
  } catch (error) {
    console.error('Error in GET /api/comparisons:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create new comparison
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Get user from database
    const { data: user } = await supabase
      .from('users')
      .select('id, credits, email')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user settings for AI strictness default
    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('ai_inspection_strictness')
      .eq('user_id', user.id)
      .maybeSingle()

    // Verificar créditos (1 crédito necessário)
    if (user.credits < 1) {
      return NextResponse.json(
        { error: 'Créditos insuficientes. Compre mais créditos para criar comparações.' },
        { status: 402 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createComparisonSchema.parse(body)

    // Verificar que a propriedade pertence ao usuário
    const { data: property } = await supabase
      .from('properties')
      .select('id')
      .eq('id', validatedData.property_id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (!property) {
      return NextResponse.json(
        { error: 'Propriedade não encontrada' },
        { status: 404 }
      )
    }

    // Buscar as duas vistorias
    const { data: inspections } = await supabase
      .from('inspections')
      .select('id, type, property_id, ai_strictness_level')
      .in('id', [validatedData.move_in_inspection_id, validatedData.move_out_inspection_id])
      .eq('user_id', user.id)
      .is('deleted_at', null)

    if (!inspections || inspections.length !== 2) {
      return NextResponse.json(
        { error: 'Uma ou ambas as vistorias não foram encontradas' },
        { status: 404 }
      )
    }

    // Validar que são do mesmo imóvel
    const allSameProperty = inspections.every(
      (insp) => insp.property_id === validatedData.property_id
    )
    if (!allSameProperty) {
      return NextResponse.json(
        { error: 'As vistorias devem ser do mesmo imóvel' },
        { status: 400 }
      )
    }

    // Validar que uma é move_in e outra move_out
    const types = inspections.map((insp) => insp.type)
    if (!types.includes('move_in') || !types.includes('move_out')) {
      return NextResponse.json(
        { error: 'É necessário uma vistoria de entrada e uma de saída' },
        { status: 400 }
      )
    }

    // Verificar se já existe comparação para essas vistorias
    const { data: existingComparison } = await supabase
      .from('comparisons')
      .select('id')
      .eq('move_in_inspection_id', validatedData.move_in_inspection_id)
      .eq('move_out_inspection_id', validatedData.move_out_inspection_id)
      .single()

    if (existingComparison) {
      return NextResponse.json(
        { error: 'Já existe uma comparação para essas vistorias' },
        { status: 409 }
      )
    }

    // Criar registro de comparação com status 'processing'
    const { data: comparison, error: comparisonError } = await supabase
      .from('comparisons')
      .insert({
        user_id: user.id,
        property_id: validatedData.property_id,
        move_in_inspection_id: validatedData.move_in_inspection_id,
        move_out_inspection_id: validatedData.move_out_inspection_id,
        status: 'processing' as ComparisonStatus,
      })
      .select()
      .single()

    if (comparisonError || !comparison) {
      console.error('Error creating comparison:', comparisonError)
      return NextResponse.json(
        { error: 'Falha ao criar comparação' },
        { status: 500 }
      )
    }

    // Processar comparação em background (async)
    processComparison(comparison.id, validatedData, user.id, user.credits)
      .catch((error) => {
        console.error('Error processing comparison:', error)
      })

    return NextResponse.json(
      {
        comparison,
        message: 'Comparação criada com sucesso. O processamento está em andamento.',
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/comparisons:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Processa a comparação em background
 * Compara fotos, detecta diferenças, calcula custos
 */
async function processComparison(
  comparisonId: string,
  data: z.infer<typeof createComparisonSchema>,
  userId: string,
  currentCredits: number
) {
  const supabase = createAdminClient()

  try {
    console.log(`[Comparison ${comparisonId}] Starting processing...`)
    console.log(`[Comparison ${comparisonId}] Move In ID: ${data.move_in_inspection_id}`)
    console.log(`[Comparison ${comparisonId}] Move Out ID: ${data.move_out_inspection_id}`)

    // Buscar as vistorias para obter ai_strictness_level
    const { data: inspections, error: inspectionsError } = await supabase
      .from('inspections')
      .select('id, type, ai_strictness_level')
      .in('id', [data.move_in_inspection_id, data.move_out_inspection_id])

    if (inspectionsError || !inspections) {
      console.error(`[Comparison ${comparisonId}] Error fetching inspections:`, inspectionsError)
      throw new Error('Erro ao buscar vistorias')
    }

    console.log(`[Comparison ${comparisonId}] Found ${inspections.length} inspections`)

    // Buscar configurações do usuário
    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('ai_inspection_strictness')
      .eq('user_id', userId)
      .maybeSingle()

    console.log(`[Comparison ${comparisonId}] User settings:`, userSettings)

    // Buscar todas as fotos de ambas as vistorias
    const { data: moveInPhotos } = await supabase
      .from('inspection_photos')
      .select('*')
      .eq('inspection_id', data.move_in_inspection_id)
      .is('deleted_at', null)
      .order('room_name')

    const { data: moveOutPhotos } = await supabase
      .from('inspection_photos')
      .select('*')
      .eq('inspection_id', data.move_out_inspection_id)
      .is('deleted_at', null)
      .order('room_name')

    if (!moveInPhotos || !moveOutPhotos) {
      console.error(`[Comparison ${comparisonId}] Photos not found`)
      throw new Error('Fotos não encontradas')
    }

    console.log(`[Comparison ${comparisonId}] Found photos:`, {
      moveIn: moveInPhotos.length,
      moveOut: moveOutPhotos.length,
    })

    // Agrupar fotos por cômodo
    const photosByRoom = matchPhotosByRoom(moveInPhotos, moveOutPhotos)

    console.log(`[Comparison ${comparisonId}] Grouped into ${photosByRoom.length} room pairs`)

    let totalDifferences = 0
    let totalNewDamages = 0
    let totalCost = 0

    // Log rooms que não têm pares completos para debug
    console.log(`[Comparison ${comparisonId}] Photo matching summary:`)
    for (const { roomName, beforePhotos, afterPhotos } of photosByRoom) {
      console.log(`[Comparison ${comparisonId}] Room "${roomName}": ${beforePhotos.length} before, ${afterPhotos.length} after`)
      if (beforePhotos.length === 0 || afterPhotos.length === 0) {
        console.warn(`[Comparison ${comparisonId}] Room "${roomName}" has incomplete photo pairs:`, {
          beforePhotos: beforePhotos.length,
          afterPhotos: afterPhotos.length,
          moveInNames: moveInPhotos.map(p => `"${p.room_name}"`),
          moveOutNames: moveOutPhotos.map(p => `"${p.room_name}"`),
        })
      }
    }

    // Determine AI strictness level
    // Priority: inspection override > user settings > default (standard)
    const moveOutInspection = inspections.find(i => i.type === 'move_out')
    const strictnessLevel = moveOutInspection?.ai_strictness_level || userSettings?.ai_inspection_strictness || 'standard'

    console.log(`[Comparison ${comparisonId}] Using strictness level: ${strictnessLevel}`)

    // Processar cada par de fotos
    for (const { roomName, beforePhotos, afterPhotos } of photosByRoom) {
      // Comparar primeira foto de cada cômodo (por simplicidade)
      // Em produção, você pode comparar múltiplas fotos
      if (beforePhotos.length > 0 && afterPhotos.length > 0) {
        const beforePhoto = beforePhotos[0]
        const afterPhoto = afterPhotos[0]

        console.log(`[Comparison ${comparisonId}] Processing room "${roomName}"...`)

        // Obter URLs públicas
        const beforeUrl = supabase.storage
          .from('inspection-photos')
          .getPublicUrl(beforePhoto.storage_path).data.publicUrl

        const afterUrl = supabase.storage
          .from('inspection-photos')
          .getPublicUrl(afterPhoto.storage_path).data.publicUrl

        console.log(`[Comparison ${comparisonId}] Photo URLs for "${roomName}":`, {
          before: beforeUrl,
          after: afterUrl,
        })

        // Comparar com IA
        console.log(`[Comparison ${comparisonId}] Calling Claude API for room "${roomName}"...`)
        const analysisResult = await comparePhotos(beforeUrl, afterUrl, roomName, strictnessLevel)
        console.log(`[Comparison ${comparisonId}] Claude response for "${roomName}":`, analysisResult)

        // Salvar diferenças
        if (analysisResult.hasDifference && analysisResult.differences.length > 0) {
          console.log(`[Comparison ${comparisonId}] Room "${roomName}" has ${analysisResult.differences.length} differences`)

          for (const diff of analysisResult.differences) {
            console.log(`[Comparison ${comparisonId}] Saving difference:`, {
              room: roomName,
              description: diff.description,
              severity: diff.severity,
              isNewDamage: diff.isNewDamage,
              cost: diff.estimatedCost,
            })

            const { error: insertError } = await supabase.from('comparison_differences').insert({
              comparison_id: comparisonId,
              before_photo_id: beforePhoto.id,
              after_photo_id: afterPhoto.id,
              room_name: roomName,
              description: diff.description,
              severity: diff.severity,
              is_new_damage: diff.isNewDamage,
              is_natural_wear: diff.isNaturalWear,
              estimated_repair_cost: diff.estimatedCost,
              markers: { location: diff.location },
            })

            if (insertError) {
              console.error(`[Comparison ${comparisonId}] Error saving difference:`, insertError)
            } else {
              console.log(`[Comparison ${comparisonId}] Difference saved successfully`)
            }

            totalDifferences++
            if (diff.isNewDamage) {
              totalNewDamages++
              totalCost += diff.estimatedCost
            }
          }
        } else {
          console.log(`[Comparison ${comparisonId}] Room "${roomName}" has NO differences`)
        }
      }
    }

    console.log(`[Comparison ${comparisonId}] Processing complete. Summary:`, {
      totalDifferences,
      totalNewDamages,
      totalCost,
    })

    // Atualizar comparação com resultados
    const { error: updateError } = await supabase
      .from('comparisons')
      .update({
        status: 'completed' as ComparisonStatus,
        differences_detected: totalDifferences,
        new_damages: totalNewDamages,
        estimated_repair_cost: totalCost,
        updated_at: new Date().toISOString(),
      })
      .eq('id', comparisonId)

    if (updateError) {
      console.error(`[Comparison ${comparisonId}] Error updating comparison:`, updateError)
    } else {
      console.log(`[Comparison ${comparisonId}] Comparison updated with results`)
    }

    // Deduzir 1 crédito
    const newCredits = currentCredits - 1
    const { error: creditsError } = await supabase
      .from('users')
      .update({ credits: newCredits })
      .eq('id', userId)

    if (creditsError) {
      console.error(`[Comparison ${comparisonId}] Error deducting credits:`, creditsError)
    } else {
      console.log(`[Comparison ${comparisonId}] Credits deducted: ${currentCredits} -> ${newCredits}`)
    }

    // Registrar uso de crédito
    const { error: usageError } = await supabase.from('credit_usage').insert({
      user_id: userId,
      comparison_id: comparisonId,
      credits_used: 1,
      credits_before: currentCredits,
      credits_after: newCredits,
      reason: 'Comparação de vistorias',
    })

    if (usageError) {
      console.error(`[Comparison ${comparisonId}] Error logging credit usage:`, usageError)
    }

    console.log(`[Comparison ${comparisonId}] Processing completed successfully!`)
  } catch (error) {
    console.error(`[Comparison ${comparisonId}] FATAL ERROR during processing:`, error)

    // Marcar como failed
    await supabase
      .from('comparisons')
      .update({
        status: 'failed' as ComparisonStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', comparisonId)

    console.error(`[Comparison ${comparisonId}] Marked as failed`)
  }
}

/**
 * Calcula a distância de Levenshtein entre duas strings
 * Usado para fuzzy matching de nomes de cômodos
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length

  // Cria matriz de distâncias
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0))

  // Inicializa primeira coluna
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i
  }

  // Inicializa primeira linha
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j
  }

  // Preenche a matriz
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // Deletion
          dp[i][j - 1],     // Insertion
          dp[i - 1][j - 1]  // Substitution
        )
      }
    }
  }

  return dp[m][n]
}

/**
 * Calcula a similaridade entre duas strings (0 a 1)
 * 1 = strings idênticas, 0 = completamente diferentes
 */
function calculateSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length)
  if (maxLen === 0) return 1

  const distance = levenshteinDistance(str1, str2)
  return 1 - distance / maxLen
}

/**
 * Normaliza o nome do cômodo para matching
 * Remove espaços extras, acentos e converte para lowercase
 * Usado APENAS para comparação/matching, não para exibição
 */
function normalizeRoomName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s]/g, '')     // Remove caracteres especiais
    .replace(/\s+/g, ' ')             // Normaliza espaços múltiplos
}

/**
 * Extrai a parte base do nome do cômodo (sem números)
 * Ex: "quarto1" -> "quarto", "sala 2" -> "sala"
 */
function extractBaseName(name: string): string {
  return name
    .replace(/\d+/g, '')  // Remove números
    .replace(/\s+/g, ' ') // Normaliza espaços
    .trim()
}

/**
 * Encontra o melhor match para um nome de cômodo
 * Retorna o nome normalizado do cômodo mais similar ou null se não encontrar
 */
function findBestMatch(
  roomName: string,
  existingRooms: Map<string, { originalName: string; beforePhotos: InspectionPhoto[]; afterPhotos: InspectionPhoto[] }>,
  threshold: number = 0.75 // 75% de similaridade mínima
): string | null {
  const normalizedName = normalizeRoomName(roomName)
  const baseName = extractBaseName(normalizedName)

  let bestMatch: string | null = null
  let bestSimilarity = 0

  for (const [existingNormalized, data] of existingRooms) {
    // Primeiro, verifica match exato (já normalizado)
    if (existingNormalized === normalizedName) {
      return existingNormalized
    }

    // Calcula similaridade entre nomes completos
    const fullSimilarity = calculateSimilarity(existingNormalized, normalizedName)

    // Calcula similaridade entre bases (sem números)
    const existingBase = extractBaseName(existingNormalized)
    const baseSimilarity = calculateSimilarity(existingBase, baseName)

    // Usa a maior similaridade entre os dois métodos
    const similarity = Math.max(fullSimilarity, baseSimilarity)

    if (similarity > bestSimilarity && similarity >= threshold) {
      bestSimilarity = similarity
      bestMatch = existingNormalized
    }
  }

  return bestMatch
}

/**
 * Agrupa fotos por cômodo para comparação com fuzzy matching
 * Permite matching de nomes similares como "quarto1" vs "quarto", etc.
 */
function matchPhotosByRoom(
  moveInPhotos: InspectionPhoto[],
  moveOutPhotos: InspectionPhoto[]
): Array<{
  roomName: string
  beforePhotos: InspectionPhoto[]
  afterPhotos: InspectionPhoto[]
}> {
  const roomMap = new Map<
    string,
    {
      originalName: string
      beforePhotos: InspectionPhoto[]
      afterPhotos: InspectionPhoto[]
    }
  >()

  // Agrupar fotos de entrada (usamos como referência)
  for (const photo of moveInPhotos) {
    const normalizedName = normalizeRoomName(photo.room_name)
    if (!roomMap.has(normalizedName)) {
      roomMap.set(normalizedName, {
        originalName: photo.room_name, // Preservar nome original
        beforePhotos: [],
        afterPhotos: []
      })
    }
    roomMap.get(normalizedName)!.beforePhotos.push(photo)
  }

  console.log('[Fuzzy Match] Entry rooms:', Array.from(roomMap.keys()))

  // Agrupar fotos de saída com fuzzy matching
  for (const photo of moveOutPhotos) {
    const normalizedName = normalizeRoomName(photo.room_name)

    // Primeiro, tenta match exato
    if (roomMap.has(normalizedName)) {
      roomMap.get(normalizedName)!.afterPhotos.push(photo)
      console.log(`[Fuzzy Match] Exit photo "${photo.room_name}" -> exact match`)
      continue
    }

    // Tenta fuzzy match
    const bestMatch = findBestMatch(photo.room_name, roomMap)

    if (bestMatch) {
      console.log(`[Fuzzy Match] Exit photo "${photo.room_name}" -> fuzzy matched to "${roomMap.get(bestMatch)!.originalName}"`)
      roomMap.get(bestMatch)!.afterPhotos.push(photo)
    } else {
      // Sem match, cria novo grupo
      console.log(`[Fuzzy Match] Exit photo "${photo.room_name}" -> no match found, creating new group`)
      roomMap.set(normalizedName, {
        originalName: photo.room_name,
        beforePhotos: [],
        afterPhotos: [photo]
      })
    }
  }

  // Converter para array usando nome original para exibição
  const result = Array.from(roomMap.entries()).map(([normalizedName, photos]) => ({
    roomName: photos.originalName,
    beforePhotos: photos.beforePhotos,
    afterPhotos: photos.afterPhotos,
  }))

  // Log do resultado final
  console.log('[Fuzzy Match] Final matching result:')
  for (const room of result) {
    console.log(`  - "${room.roomName}": ${room.beforePhotos.length} before, ${room.afterPhotos.length} after`)
  }

  return result
}
