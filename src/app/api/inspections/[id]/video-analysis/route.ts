/**
 * API: Análise de Vídeo de Vistoria
 * POST /api/inspections/[id]/video-analysis
 *
 * Usa OpenAI Vision para analisar vídeos MP4
 * - Suporta vídeos até 128MB
 * - Análise em tempo real com visão computacional
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[Video Analysis] START')
    
    // 1. Autenticação
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: inspectionId } = await params
    console.log('[Video Analysis] inspectionId:', inspectionId)
    
    const supabase = createAdminClient()

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, clerk_id, email')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      console.error('[Video Analysis] User not found')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 2. Verificar se a vistoria existe e pertence ao usuário
    const { data: inspection, error: inspectionError } = await supabase
      .from('inspections')
      .select('id, property_id, user_id')
      .eq('id', inspectionId)
      .eq('user_id', user.id)
      .single()

    if (inspectionError || !inspection) {
      console.error('[Video Analysis] Inspection not found')
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 })
    }

    // 3. Receber o vídeo
    const formData = await request.formData()
    const videoFile = formData.get('video') as File
    const roomId = formData.get('room_id') as string
    const roomName = formData.get('room_name') as string
    const roomType = formData.get('room_type') as string

    if (!videoFile) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 })
    }

    console.log('[Video Analysis] Processing video:', {
      fileName: videoFile.name,
      size: videoFile.size,
      type: videoFile.type,
      roomName,
      roomType
    })

    // Check file size (max 128MB for OpenAI Vision)
    const MAX_VIDEO_SIZE = 128 * 1024 * 1024 // 128MB
    if (videoFile.size > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        { error: `Video file too large. Maximum size: 128MB, received: ${(videoFile.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 400 }
      )
    }

    // 4. Converter vídeo para base64
    const bytes = await videoFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')

    console.log('[Video Analysis] Video converted to base64, analyzing with OpenAI Vision...')

    // 5. Analisar vídeo com OpenAI Vision
    const analysisPrompt = `Você é um VISTORIADOR PROFISSIONAL DE IMÓVEIS gerando um LAUDO DE VISTORIA TÉCNICO para o ${roomType} (${roomName}).

Seu objetivo é realizar uma inspeção MINUCIOSA e DOCUMENTAR TODOS OS DETALHES relevantes para o laudo.

ANALISE CUIDADOSAMENTE o vídeo e IDENTIFIQUE:

**1. ESTRUTURA E ALVENARIA:**
- Rachaduras (tamanho, localização, padrão)
- Trincas
- Umidade/Infiltração (manchas, bolor, mofo)
- Desaprumo de paredes
- Eflorescência
- Sinais de movimentação estrutural

**2. REVESTIMENTOS E ACABAMENTOS:**
- Pintura (descascando, manchada, descolando)
- Papel de parede (danificado, destacando)
- Azulejos/Cerâmica (soltos, trincados, faltando)
- Gesso/Reboco (descolando, rachado)
- Rodapé (solto, danificado, ausente)
- Molduras/Frisos (estado de conservação)

**3. ABERTURAS:**
- Portas (empenadas, danificadas, funcionamento)
- Janelas (vidros trincados, ferragens soltas, estanqueidade)
- Fechaduras (funcionamento, desgaste)
- Vidros (riscos, opacidade, integridade)

**4. PISO:**
- Material (tipo, condição)
- Nivelamento
- Fissuras/Trincas
- Umidade (manchas, inchaço em madeira)
- Desgaste (áreas de alto trânsito)
- Soltura (tacos, cerâmica)

**5. TETO:**
- Material
- Manchas de umidade/Infiltração
- Descolamento de reboco/Gesso
- Mofo/Bolor
- Fissuras
- Desaprumo

**6. INSTALAÇÕES VISÍVEIS:**
- Fiação elétrica (exposta, adequada, danos)
- Tomadas/Interruptores (funcionamento, estado)
- Canos visíveis (oxidação, vazamentos, emperramento)
- Dutos de ar/Exaustão (estado, funcionamento)
- Luminárias (funcionamento, estado)

**7. MÓVEIS E EQUIPAMENTOS FIXOS:**
- Estado de conservação
- Danos/Marcas
- Funcionalidade visível
- Marcas de uso (normal vs excessivo)

**8. HIGIENE E LIMPEZA:**
- Presença de pó/Sujeira
- Mofo/Bolor em côncanavos
- Falta de higiene
- Necessidade de limpeza profunda

**9. ACESSÓRIOS E DETALHES:**
- Espelhos (trincados, descolando)
- Nichos (estado, desaprumo)
- Corrimãos (soltos, danificados)
- Prateleiras (soltas, danificadas)
- Qualquer outro detalhe relevante para o laudo

**PADRÃO DE RESPOSTA - Responda APENAS em JSON válido (sem markdown, sem explicações adicionais):**

{
  "hasProblems": boolean,
  "summary": "Resumo executivo (2-3 frases) do estado GERAL do ${roomName}",
  "overallCondition": "excelente|bom|aceitável|precisa_reparo|crítico",
  "inspectionFindings": "Observações gerais da inspeção",
  "problems": [
    {
      "category": "estrutura|revestimentos|aberturas|piso|teto|instalações|móveis|higiene|acessórios|outro",
      "description": "Descrição DETALHADA e TÉCNICA do problema (como apareceria em um laudo profissional)",
      "location": "Localização PRECISA no cômodo (ex: parede norte próximo à janela, canto inferior direito)",
      "dimension": "Dimensão/Tamanho do problema se aplicável (ex: rachadura de 2mm, mancha de 30x20cm)",
      "severity": "baixa|média|alta|crítica",
      "implications": "Implicações técnicas (risco estrutural, segurança, durabilidade, conforto)",
      "suggestedAction": "Ação recomendada para reparação",
      "estimatedCost": "Faixa de custo estimado (ex: R$ 150-400) ou 'A orçar se necessário'",
      "urgency": "baixa|média|alta|crítica - recomenda-se reparo imediato?",
      "confidence": 0.0-1.0
    }
  ],
  "recommendations": [
    "Recomendação importante para reparo ou manutenção"
  ],
  "confidence": 0.0-1.0,
  "analysisNotes": "Notas técnicas adicionais relevantes para o laudo"
}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'video_url',
              video_url: {
                url: `data:${videoFile.type};base64,${base64}`,
              },
            },
            {
              type: 'text',
              text: analysisPrompt,
            },
          ] as any,
        },
      ],
      max_tokens: 4096,
    } as any)

    // 6. Extrair análise da resposta
    const responseText = response.choices[0]?.message?.content || ''
    console.log('[Video Analysis] OpenAI response received, parsing...')

    let analysis: any = {
      hasProblems: false,
      problems: [],
      summary: '',
      confidence: 0.5,
      overallCondition: 'aceitável',
      analysisNotes: ''
    }

    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        console.warn('[Video Analysis] Could not find JSON in response')
        analysis.summary = responseText
        analysis.analysisNotes = 'Análise em formato texto'
      }
    } catch (parseErr) {
      console.error('[Video Analysis] Failed to parse OpenAI response:', parseErr)
      analysis.summary = responseText
      analysis.analysisNotes = 'Erro ao fazer parse da resposta - revise manualmente'
    }

    // 7. Upload do vídeo para Supabase Storage
    const timestamp = Date.now()
    const storagePath = `${inspectionId}/${roomName}_video_${timestamp}.${videoFile.name.split('.').pop()}`
    
    console.log('[Video Analysis] Uploading video to storage...')
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('inspection-videos')
      .upload(storagePath, buffer, {
        contentType: videoFile.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('[Video Analysis] Upload error:', uploadError)
      // Continue mesmo com erro de upload
    }

    // 8. Salvar análise no banco de dados
    const problemCount = analysis.problems?.length || 0
    const severitySummary = {
      baixa: analysis.problems?.filter((p: any) => p.severity === 'baixa').length || 0,
      média: analysis.problems?.filter((p: any) => p.severity === 'média').length || 0,
      alta: analysis.problems?.filter((p: any) => p.severity === 'alta').length || 0,
    }

    console.log('[Video Analysis] Saving analysis to database...')
    const { data: videoRecord, error: analysisError } = await supabase
      .from('inspection_videos')
      .insert({
        inspection_id: inspectionId,
        user_id: user.id,
        room_name: roomName,
        room_category: roomType,
        storage_path: storagePath,
        file_size: buffer.byteLength,
        analysis: analysis,
        has_problems: analysis.hasProblems || false,
        confidence: analysis.confidence || 0.5,
        overall_condition: analysis.overallCondition || 'aceitável',
        problem_count: problemCount,
        severity_summary: severitySummary,
      })
      .select()

    if (analysisError) {
      console.error('[Video Analysis] Save analysis error:', analysisError)
    }

    console.log('[Video Analysis] ✓ Complete')

    return NextResponse.json({
      success: true,
      videoId: videoRecord?.[0]?.id,
      analysis,
      problemsFound: problemCount,
      message: `Vídeo de ${roomName} analisado! ${problemCount > 0 ? `${problemCount} problema(s) detectado(s).` : 'Nenhum problema detectado.'}`
    })

  } catch (error) {
    console.error('[Video Analysis] ✗ Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process video',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
