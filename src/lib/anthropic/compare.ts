/**
 * Anthropic Photo Comparison - VistorIA Pro
 * Uses Claude Vision to compare before/after photos and detect differences
 * Supports configurable strictness levels
 */

import { anthropic, ANTHROPIC_CONFIG } from './config'
import type { DifferenceAnalysisResult, ProblemSeverity, AIStrictnessLevel } from '@/types/database'

/**
 * Compara duas fotos usando Claude Vision
 * Detecta diferenças, classifica danos e estima custos de reparo
 * @param strictnessLevel - Nível de rigor da análise (standard, strict, very_strict)
 */
export async function comparePhotos(
  beforePhotoUrl: string,
  afterPhotoUrl: string,
  roomName: string,
  strictnessLevel: AIStrictnessLevel = 'standard'
): Promise<DifferenceAnalysisResult> {
  try {
    console.log(`[Claude API] Starting comparison for room: ${roomName}`)
    console.log(`[Claude API] Strictness level: ${strictnessLevel}`)
    console.log(`[Claude API] Before photo URL: ${beforePhotoUrl}`)
    console.log(`[Claude API] After photo URL: ${afterPhotoUrl}`)

    const prompt = buildComparisonPrompt(roomName, strictnessLevel)

    console.log(`[Claude API] Calling Anthropic API...`)
    const startTime = Date.now()

    const message = await anthropic.messages.create({
      model: ANTHROPIC_CONFIG.model,
      max_tokens: 2048, // Mais tokens para análise detalhada
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'url',
                url: beforePhotoUrl,
              },
            },
            {
              type: 'text',
              text: '**FOTO 1 (ANTES - Entrada do inquilino)**',
            },
            {
              type: 'image',
              source: {
                type: 'url',
                url: afterPhotoUrl,
              },
            },
            {
              type: 'text',
              text: '**FOTO 2 (DEPOIS - Saída do inquilino)**',
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    })

    const endTime = Date.now()
    console.log(`[Claude API] API call completed in ${endTime - startTime}ms`)
    console.log(`[Claude API] Response usage:`, message.usage)

    // Extrair texto da resposta
    const responseText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => ('text' in block ? block.text : ''))
      .join('')

    console.log(`[Claude API] Response text length: ${responseText.length} characters`)
    console.log(`[Claude API] Response text preview: ${responseText.substring(0, 200)}...`)

    // Parse JSON da resposta
    const result = parseAIResponse(responseText)

    console.log(`[Claude API] Parsed result:`, {
      hasDifference: result.hasDifference,
      differencesCount: result.differences.length,
      totalCost: result.totalEstimatedCost,
    })

    return result
  } catch (error) {
    console.error('[Claude API] Error comparing photos with Claude:', error)
    console.error('[Claude API] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    throw new Error('Falha ao comparar fotos com IA')
  }
}

/**
 * Constrói o prompt para comparação de fotos com instruções de rigor
 */
function buildComparisonPrompt(roomName: string, strictnessLevel: AIStrictnessLevel): string {
  // Instruções específicas por nível de rigor
  const strictnessInstructions = {
    standard: `
**NÍVEL DE RIGOR: PADRÃO (EQUILIBRADO)**

Seja EQUILIBRADO na análise:
- Identifique danos CLAROS e EVIDENTES
- Diferencie desgaste natural de danos causados por negligência
- Use bom senso ao classificar severidade
- Pequenos riscos de uso normal = desgaste natural
- Manchas leves por tempo = desgaste natural
- Danos estruturais ou visíveis = dano novo
`,
    strict: `
**NÍVEL DE RIGOR: RIGOROSO (CRÍTICO)**

Seja MAIS CRÍTICO na análise:
- Identifique danos MENORES também (pequenos riscos, manchas leves)
- Seja mais rigoroso ao classificar como "dano novo" vs "desgaste natural"
- Aumente a severidade em 1 nível quando em dúvida (low -> medium, medium -> high)
- Detecte manchas, arranhões pequenos, marcas de uso excessivo
- Presuma que mudanças visíveis podem ser causadas por uso inadequado
`,
    very_strict: `
**NÍVEL DE RIGOR: MUITO RIGOROSO (HIPER-CRÍTICO)**

Seja HIPER-CRÍTICO na análise:
- Identifique QUALQUER diferença visível, por menor que seja
- Considere qualquer alteração como possível dano
- Classifique severidade no nível MAIS ALTO possível
- Detecte micro-arranhões, pequenas manchas, mínimas alterações
- Presuma que TODAS as mudanças são causadas por mau uso, NÃO desgaste natural
- Use "urgent" e "high" com frequência
- Seja maximalista nas estimativas de custo
`,
  }

  return `
Você é um especialista em vistorias imobiliárias no Brasil com mais de 20 anos de experiência.

${strictnessInstructions[strictnessLevel]}

**CONTEXTO:**
Você está analisando o cômodo: "${roomName}"
As fotos mostram o MESMO cômodo em dois momentos:
- FOTO 1: No momento da ENTRADA do inquilino (início do contrato)
- FOTO 2: No momento da SAÍDA do inquilino (fim do contrato)

**SUA TAREFA:**
Compare minuciosamente as duas fotos e identifique TODAS as diferenças visíveis de acordo com o nível de rigor especificado.

Para cada diferença encontrada, você deve:

1. **Classificar como:**
   - "DANO NOVO" = Dano claramente causado pelo inquilino (riscos profundos, manchas, quebrados, buracos, pinturas danificadas)
   - "DESGASTE NATURAL" = Envelhecimento esperado pelo tempo (desbotamento leve, pequenos riscos de uso normal)

2. **Avaliar a gravidade:**
   - "urgent" = Problema grave que requer atenção imediata (infiltração, estrutura comprometida)
   - "high" = Dano significativo que precisa reparo (paredes riscadas, piso danificado)
   - "medium" = Dano moderado (pequenos riscos, manchas leves)
   - "low" = Dano mínimo ou desgaste normal esperado

3. **Estimar custo de reparo em REAIS (R$):**
   - Baseie-se em valores médios de mercado no Brasil
   - Considere mão de obra + material
   - Seja realista e justo conforme o nível de rigor
   - Desgaste natural = R$ 0,00

**IMPORTANTE:**
- Seja extremamente detalhista conforme o nível de rigor
- Considere iluminação diferente nas fotos
- Não confunda mudança de ângulo com dano
- Se não houver diferenças visíveis, indique claramente

**RESPONDA EM JSON VÁLIDO:**

\`\`\`json
{
  "hasDifference": boolean,
  "differences": [
    {
      "description": "string - Descrição detalhada e específica da diferença",
      "isNewDamage": boolean,
      "isNaturalWear": boolean,
      "severity": "urgent" | "high" | "medium" | "low",
      "estimatedCost": number,
      "location": "string - Localização exata (ex: parede esquerda, piso central, teto próximo à janela)"
    }
  ],
  "overallAssessment": "string - Avaliação geral do estado do cômodo comparando entrada e saída",
  "totalEstimatedCost": number
}
\`\`\`

**EXEMPLOS DE RESPOSTA:**

Exemplo 1 - COM diferenças:
\`\`\`json
{
  "hasDifference": true,
  "differences": [
    {
      "description": "Risco profundo de aproximadamente 40cm na parede esquerda, próximo ao interruptor de luz, expondo a massa corrida",
      "isNewDamage": true,
      "isNaturalWear": false,
      "severity": "high",
      "estimatedCost": 180.00,
      "location": "Parede esquerda, 1.5m de altura, ao lado do interruptor"
    },
    {
      "description": "Mancha escura de umidade no teto, próximo ao canto direito, indicando possível infiltração",
      "isNewDamage": true,
      "isNaturalWear": false,
      "severity": "urgent",
      "estimatedCost": 450.00,
      "location": "Teto, canto superior direito"
    },
    {
      "description": "Pintura levemente desbotada na parede próxima à janela, devido à exposição solar",
      "isNewDamage": false,
      "isNaturalWear": true,
      "severity": "low",
      "estimatedCost": 0,
      "location": "Parede ao redor da janela"
    }
  ],
  "overallAssessment": "O cômodo apresenta dois danos novos significativos que devem ser reparados pelo inquilino: um risco profundo na parede e uma mancha de umidade no teto. Há também desgaste natural esperado na pintura próxima à janela.",
  "totalEstimatedCost": 630.00
}
\`\`\`

Exemplo 2 - SEM diferenças:
\`\`\`json
{
  "hasDifference": false,
  "differences": [],
  "overallAssessment": "O cômodo está em excelente estado. Não foram identificadas diferenças significativas entre a entrada e saída. O imóvel foi bem conservado pelo inquilino.",
  "totalEstimatedCost": 0
}
\`\`\`

Agora analise as fotos fornecidas e retorne APENAS o JSON, sem texto adicional.
`.trim()
}

/**
 * Faz parse da resposta da IA
 */
function parseAIResponse(responseText: string): DifferenceAnalysisResult {
  try {
    // Tentar extrair JSON da resposta
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Resposta da IA não contém JSON válido')
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Validar estrutura
    if (typeof parsed.hasDifference !== 'boolean') {
      throw new Error('Campo hasDifference inválido')
    }

    if (!Array.isArray(parsed.differences)) {
      throw new Error('Campo differences deve ser um array')
    }

    // Validar cada diferença
    const validatedDifferences = parsed.differences.map((diff: any) => {
      const severity = validateSeverity(diff.severity)

      return {
        description: String(diff.description || ''),
        isNewDamage: Boolean(diff.isNewDamage),
        isNaturalWear: Boolean(diff.isNaturalWear),
        severity,
        estimatedCost: Number(diff.estimatedCost || 0),
        location: String(diff.location || ''),
      }
    })

    return {
      hasDifference: parsed.hasDifference,
      differences: validatedDifferences,
      overallAssessment: String(parsed.overallAssessment || ''),
      totalEstimatedCost: Number(parsed.totalEstimatedCost || 0),
    }
  } catch (error) {
    console.error('Error parsing AI response:', error)
    console.error('Response text:', responseText)

    // Retornar resultado vazio em caso de erro
    return {
      hasDifference: false,
      differences: [],
      overallAssessment: 'Erro ao processar resposta da IA. Por favor, tente novamente.',
      totalEstimatedCost: 0,
    }
  }
}

/**
 * Valida e normaliza severity
 */
function validateSeverity(severity: string): ProblemSeverity {
  const validSeverities: ProblemSeverity[] = ['low', 'medium', 'high', 'urgent']

  if (validSeverities.includes(severity as ProblemSeverity)) {
    return severity as ProblemSeverity
  }

  // Default para medium se inválido
  return 'medium'
}
