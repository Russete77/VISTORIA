import Anthropic from '@anthropic-ai/sdk'
import type { PhotoProblem, ProblemSeverity } from '@/types/database'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface DetailedRoomAnalysis {
  piso?: string
  rodape?: string
  parede?: string
  forro?: string
  porta?: string
  janela?: string
  soleira?: string
  protecao?: string
  acabamento_eletrico?: string
  hidraulica?: string
  louca?: string
  metais?: string
  banca?: string
  box?: string
  local_do_ar?: string
  adicionais?: string
}

export interface PhotoAnalysisResult {
  hasProblems: boolean
  summary: string
  confidence: number
  detailedAnalysis: DetailedRoomAnalysis
  problems: Array<{
    description: string
    severity: ProblemSeverity
    location: string
    suggestedAction: string
    confidence: number
  }>
}

export interface TechnicalReportInput {
  photos: Array<{
    url: string
    room_name: string
    room_category: string
    ai_summary?: string
    problems?: any[]
    from_video?: boolean
    frame_number?: number
  }>
  transcription?: string
  previousReport?: any
}

export async function analyzePhoto(
  imageUrl: string,
  roomName: string,
  roomCategory: string
): Promise<PhotoAnalysisResult> {
  try {
    const prompt = generateAnalysisPrompt(roomName, roomCategory)

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'url',
                url: imageUrl,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    return parseAIResponse(responseText)
  } catch (error) {
    console.error('AI analysis failed:', error)
    throw new Error('Failed to analyze photo with AI')
  }
}

function generateAnalysisPrompt(roomName: string, roomCategory: string): string {
  // Traduzir categoria para português
  const categoryMap: Record<string, string> = {
    'living_room': 'sala de estar',
    'kitchen': 'cozinha',
    'bedroom': 'quarto',
    'bathroom': 'banheiro',
    'balcony': 'varanda',
    'garage': 'garagem',
    'laundry': 'área de serviço',
    'hallway': 'corredor',
    'entrance': 'entrada',
    'other': 'outro ambiente'
  }

  const categoryPt = categoryMap[roomCategory] || roomCategory

  return `Você é um vistoriador CRÍTICO e experiente de imóveis no Brasil, especializado em laudos técnicos detalhados.

Analise esta foto do cômodo "${roomName}" (tipo: ${categoryPt}) com olhar CRÍTICO para detectar TODOS os problemas.

IMPORTANTE: Use SEMPRE o nome "${roomName}" ao se referir a este ambiente nas suas descrições e análises. NÃO use a categoria genérica.

ATENÇÃO - ANÁLISE FIEL À REALIDADE:
Seja CRÍTICO mas PRECISO. Diferencie entre:

**IMPORTANTE - ORIENTAÇÃO DA FOTO:**
- PISO = superfície HORIZONTAL na PARTE INFERIOR da foto
- TETO/FORRO = superfície HORIZONTAL na PARTE SUPERIOR da foto
- PAREDES = superfícies VERTICAIS nas laterais
- NÃO confunda piso com teto! Observe a orientação!

1. CARACTERÍSTICAS NORMAIS DO MATERIAL vs DEFEITOS:
   - Piso de madeira em tábuas = junções entre peças são NORMAIS
   - Piso taco/parquet = pequenos blocos conectados são o DESIGN, NÃO rachaduras
   - Piso laminado = linhas de junção são NORMAIS
   - Azulejo = rejuntes são NORMAIS
   - NÃO confunda o padrão/design do material com defeitos!

2. PISO DE MADEIRA ANTIGO - CARACTERÍSTICAS NORMAIS:
   - Madeira escurecida nos cantos/bordas = NORMAL (cera acumulada, envelhecimento)
   - Variação de tonalidade entre tábuas = NATURAL da madeira
   - Desgaste desigual do verniz = USO NORMAL ao longo do tempo
   - Riscos superficiais cruzados = marcas de móveis, uso diário (NÃO são rachaduras)
   - INFILTRAÇÃO REAL = empenamento da madeira + bolhas + mofo, não apenas cor escura

3. ARRANHÕES vs RACHADURAS vs JUNÇÕES:
   - Arranhões = riscos superficiais finos (uso normal)
   - Rachadura = madeira QUEBRADA, fenda profunda, separação visível
   - Junções do design = linhas retas entre peças (parquet/taco)
   - NÃO confunda riscos de uso com rachaduras estruturais!

4. MANCHAS vs INFILTRAÇÕES em MADEIRA:
   - Infiltração REAL = madeira inchada/empenada + mofo + textura alterada
   - Escurecimento natural = cera acumulada, envelhecimento, exposição
   - Se a madeira não está empenada/inchada = NÃO é infiltração!
   - Variação de cor é NORMAL em pisos antigos

FOCO PRINCIPAL: IDENTIFICAR **DEFEITOS REAIS**
Procure por PROBLEMAS VERDADEIROS:
- Infiltrações (manchas amareladas com descascamento, bolhas, umidade)
- Rachaduras REAIS (quebras profundas no material, não junções de design)
- Mofo verdadeiro (manchas esverdeadas/pretas de fungo)
- Desgaste excessivo (não uso normal)
- Danos estruturais (fissuras, descolamento real)
- Problemas funcionais (tomadas quebradas, vazamentos ativos)

SEJA HONESTO E REALISTA:
- Piso antigo com desgaste normal de uso = NÃO é problema grave
- Madeira escurecida sem empenamento = envelhecimento natural, não infiltração
- Riscos superficiais = uso normal, não rachaduras
- Se você não vê empenamento, bolhas, mofo ou quebras = NÃO invente problemas!
- Descreva o que VÊ, não o que IMAGINA que pode ter acontecido

PRINCÍPIO: Seja um vistoriador PROFISSIONAL e HONESTO, não um alarmista que inventa defeitos inexistentes!

Forneça descrições detalhadas para TODOS os elementos visíveis usando este formato:
- PISO: material, estado de conservação, detalhes (ex: "porcelanato polido conservado, leves arranhões superficiais")
- RODAPÉ: material, pintura, estado (ex: "madeira, pintura usinada conservada branca, manchas de sujeira")
- PAREDE: revestimento, pintura, estado (ex: "pintura acrílica fosca antiga branca, manchas de sujeira em grau leve")
- FORRO: tipo, pintura, estado, DEFEITOS (ex: "rebaixado em gesso, pintura acrílica fosca conservada branca com INFILTRAÇÃO visível - manchas amareladas no canto esquerdo")
- PORTA: material, acabamento, ferragens (ex: "madeira, pintura acetinada fosca, maçanetas oxidadas")
- JANELA: tipo, material, estado (ex: "esquadria de alumínio anodizado bronze, vidros lisos")
- SOLEIRA: material, estado
- PROTEÇÃO: guarda-corpo, redes (se aplicável)
- ACAB. ELÉTRICO: tomadas, interruptores, luminárias (ex: "com energia, embutida, interruptores com espelhos")
- HIDRÁULICA: funcionamento (se testável)
- LOUÇA: vaso, pia, estado
- METAIS: torneiras, registros, estado
- BANCA: material, estado
- BOX: material, vidros, estado
- LOCAL DO AR: aparelho instalado, marca, funcionamento
- ADICIONAIS: móveis, objetos, detalhes extras

Retorne em formato JSON:
{
  "hasProblems": boolean,
  "summary": "resumo geral do estado do cômodo usando o nome '${roomName}'",
  "confidence": 0.0-1.0,
  "detailedAnalysis": {
    "piso": "descrição detalhada",
    "rodape": "descrição detalhada",
    "parede": "descrição detalhada",
    "forro": "descrição detalhada",
    "porta": "descrição detalhada",
    "janela": "descrição detalhada",
    "soleira": "descrição (se visível)",
    "protecao": "descrição (se aplicável)",
    "acabamento_eletrico": "descrição detalhada",
    "hidraulica": "descrição (se aplicável)",
    "louca": "descrição (se aplicável)",
    "metais": "descrição (se aplicável)",
    "banca": "descrição (se aplicável)",
    "box": "descrição (se aplicável)",
    "local_do_ar": "descrição (se visível)",
    "adicionais": "móveis, objetos, observações extras"
  },
  "problems": [
    {
      "description": "descrição técnica do problema",
      "severity": "low" | "medium" | "high" | "urgent",
      "location": "localização específica",
      "suggestedAction": "ação corretiva",
      "confidence": 0.0-1.0
    }
  ]
}

CRITÉRIOS DE SEVERIDADE (seja REALISTA e PRECISO):
- low: arranhões superficiais normais de uso, pequenas manchas de sujeira removível, desgaste estético leve esperado
- medium: pintura antiga necessitando renovação, ferragens oxidadas, manchas permanentes não estruturais
- high: INFILTRAÇÕES CONFIRMADAS (manchas + descascamento/bolhas), rachaduras estruturais REAIS, mofo extenso
- urgent: risco estrutural imediato, vazamentos ativos, instalações elétricas expostas

EXEMPLOS DE ANÁLISE CORRETA vs INCORRETA:

PISO DE MADEIRA ANTIGO:
❌ ERRADO: "Manchas escuras = infiltração"
✅ CORRETO: "Piso de madeira com envelhecimento natural, variação de tonalidade típica de cera acumulada"

❌ ERRADO: "Riscos cruzados = rachaduras estruturais"
✅ CORRETO: "Riscos superficiais de uso normal, marcas de arraste de móveis"

❌ ERRADO: "Desgaste irregular do verniz = problema"
✅ CORRETO: "Verniz com desgaste natural de uso, pode ser renovado com polimento"

INFILTRAÇÃO REAL:
✅ Mancha amarelada no teto + bolhas + descascamento = INFILTRAÇÃO (high)
✅ Madeira empenada + inchada + mofo = INFILTRAÇÃO em piso (high)
❌ Apenas cor escurecida sem empenamento = NÃO é infiltração

RACHADURAS:
✅ Rachadura = madeira fissurada, quebrada, separada (reportar)
❌ Linhas retas entre blocos de parquet = junção de design (não reportar)
❌ Riscos finos superficiais = arranhões de uso (low severity no máximo)

REGRAS DE ANÁLISE:
1. IDENTIFIQUE o material e seu design ANTES de reportar defeitos
2. Diferencie marcas de uso normal de problemas reais
3. Infiltração = mancha + sinais de umidade (bolha, descascamento, mofo)
4. Rachadura = quebra real no material, não junção de design
5. Use linguagem técnica mas HONESTA
6. Omita campos do detailedAnalysis que NÃO são visíveis
7. Seja crítico mas JUSTO - não exagere problemas inexistentes`
}

function parseAIResponse(responseText: string): PhotoAnalysisResult {
  try {
    // Remove markdown code blocks if present
    const cleanedText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const parsed = JSON.parse(cleanedText)

    // Validate and normalize the response
    return {
      hasProblems: Boolean(parsed.hasProblems),
      summary: String(parsed.summary || 'Análise concluída'),
      confidence: Number(parsed.confidence || 0.8),
      detailedAnalysis: parsed.detailedAnalysis || {},
      problems: Array.isArray(parsed.problems)
        ? parsed.problems.map((p: unknown) => ({
            description: String((p as { description?: string }).description || ''),
            severity: validateSeverity((p as { severity?: string }).severity || 'medium'),
            location: String((p as { location?: string }).location || ''),
            suggestedAction: String((p as { suggestedAction?: string }).suggestedAction || ''),
            confidence: Number((p as { confidence?: number }).confidence || 0.8),
          }))
        : [],
    }
  } catch (error) {
    console.error('Failed to parse AI response:', error)
    throw new Error('Invalid AI response format')
  }
}

function validateSeverity(severity: string): ProblemSeverity {
  const validSeverities: ProblemSeverity[] = ['low', 'medium', 'high', 'urgent']
  return validSeverities.includes(severity as ProblemSeverity)
    ? (severity as ProblemSeverity)
    : 'medium'
}

export async function analyzePhotoBase64(
  base64Data: string,
  roomName: string,
  roomCategory: string
): Promise<PhotoAnalysisResult> {
  try {
    const prompt = generateAnalysisPrompt(roomName, roomCategory)

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    return parseAIResponse(responseText)
  } catch (error) {
    console.error('AI analysis failed:', error)
    throw new Error('Failed to analyze photo with AI')
  }
}

export async function batchAnalyzePhotos(
  photos: Array<{
    url: string
    roomName: string
    roomCategory: string
  }>
): Promise<PhotoAnalysisResult[]> {
  const results = await Promise.allSettled(
    photos.map((photo) =>
      analyzePhoto(photo.url, photo.roomName, photo.roomCategory)
    )
  )

  return results.map((result) => {
    if (result.status === 'fulfilled') {
      return result.value
    }
    console.error('Photo analysis failed:', result.reason)
    return {
      hasProblems: false,
      summary: 'Erro ao analisar foto',
      confidence: 0,
      detailedAnalysis: {},
      problems: [],
    }
  })
}

/**
 * Analyze video frame with optimized prompt for lower quality images
 * More tolerant of compression artifacts, motion blur, and lower resolution
 */
export async function analyzeVideoFrame(
  base64Data: string,
  roomName: string,
  roomCategory: string,
  frameNumber: number,
  transcription?: string
): Promise<PhotoAnalysisResult> {
  try {
    const videoPrompt = generateVideoFramePrompt(roomName, roomCategory, frameNumber, transcription)

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024, // Shorter response for video frames
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: videoPrompt,
            },
          ],
        },
      ],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    return parseAIResponse(responseText)
  } catch (error) {
    console.error('Video frame analysis failed:', error)
    return {
      hasProblems: false,
      summary: `Frame ${frameNumber} do ${roomName} - análise não disponível`,
      confidence: 0,
      detailedAnalysis: {},
      problems: [],
    }
  }
}

/**
 * Generate optimized prompt for video frame analysis
 * Focused on obvious problems, tolerant of image quality issues
 */
function generateVideoFramePrompt(
  roomName: string, 
  roomCategory: string, 
  frameNumber: number,
  transcription?: string
): string {
  const categoryMap: Record<string, string> = {
    'living_room': 'sala de estar',
    'kitchen': 'cozinha',
    'bedroom': 'quarto',
    'bathroom': 'banheiro',
    'balcony': 'varanda',
    'garage': 'garagem',
    'laundry': 'área de serviço',
    'hallway': 'corredor',
    'entrance': 'entrada',
    'other': 'outro ambiente'
  }

  const categoryPt = categoryMap[roomCategory] || roomCategory

  let transcriptionContext = ''
  if (transcription) {
    transcriptionContext = `
TRANSCRIÇÃO DO VÍDEO (áudio do vistoriador):
"${transcription}"

Use esta transcrição como contexto adicional para sua análise.
`
  }

  return `Você é um vistoriador analisando o FRAME ${frameNumber} de um VÍDEO de vistoria.
Cômodo: "${roomName}" (tipo: ${categoryPt})
${transcriptionContext}
IMPORTANTE - ESTE É UM FRAME DE VÍDEO:
- A qualidade pode ser inferior a uma foto (compressão, motion blur)
- Foque APENAS em problemas CLARAMENTE visíveis e ÓBVIOS
- NÃO reporte artefatos de compressão de vídeo como problemas
- NÃO reporte desfoque de movimento como problema
- Seja CONSERVADOR - se não tem certeza, NÃO reporte

ANALISE APENAS O QUE É CLARAMENTE VISÍVEL:
- Danos estruturais ÓBVIOS (rachaduras grandes, buracos)
- Manchas/infiltrações EVIDENTES (não sombras)
- Problemas de conservação CLAROS
- Estado geral do ambiente

Retorne em JSON:
{
  "hasProblems": boolean,
  "summary": "resumo BREVE do estado do ${roomName} visível neste frame (máx 100 palavras)",
  "confidence": 0.0-1.0 (reduza se imagem borrada ou escura),
  "detailedAnalysis": {
    "piso": "estado se visível",
    "parede": "estado se visível",
    "forro": "estado se visível"
  },
  "problems": [
    {
      "description": "apenas problemas ÓBVIOS e CLAROS",
      "severity": "low" | "medium" | "high",
      "location": "localização",
      "suggestedAction": "ação",
      "confidence": 0.0-1.0
    }
  ]
}

REGRAS:
1. Máximo 2 problemas por frame (priorize os mais graves)
2. Confidence < 0.5 se imagem com baixa qualidade
3. Seja BREVE e OBJETIVO
4. NÃO invente problemas que não são claramente visíveis`
}

