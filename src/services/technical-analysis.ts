/**
 * Serviço de Análise Técnica Completa
 * Gera laudo técnico seguindo as 8 instruções profissionais
 */

import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface PhotoWithAnalysis {
  url: string
  room_name: string
  room_category: string
  ai_summary?: string
  problems?: Array<{
    description: string
    severity: string
    location: string
    suggested_action: string
  }>
  from_video?: boolean
  frame_number?: number
}

export interface TechnicalAnalysisInput {
  photos: PhotoWithAnalysis[]
  transcription?: string | null
  previousReport?: any
}

export interface TechnicalReportData {
  resumo_executivo: {
    total_comodos: number
    total_danos: number
    problemas_urgentes: number
    condicao_geral: 'excelente' | 'bom' | 'regular' | 'ruim' | 'péssimo'
    principais_descobertas: string[]
  }
  mapa_imovel: {
    comodos: Array<{
      ordem: number
      nome: string
      tipo: string
      conexoes: string[]
    }>
    fluxo_navegacao: string
    descricao_layout: string
  }
  comodos: Array<{
    nome: string
    tipo: string
    confianca_identificacao: number
    caracteristicas_visuais: string[]
    condicao_geral: string
    danos: Array<{
      descricao: string
      severidade: 'leve' | 'moderado' | 'grave' | 'crítico'
      impacto: string[]
      localizacao: string
      anotacao_visual?: {
        tipo: 'círculo' | 'seta' | 'destaque'
        posicao: string
        instrucao: string
      }
      geolocalizacao_interna: string
      recomendacao_tecnica: string
      custo_estimado: number
    }>
  }>
  comparacao_anterior?: {
    novos_danos: number
    danos_piorados: number
    danos_corrigidos: number
    detalhes: Array<{
      comodo: string
      tipo: 'novo' | 'piorou' | 'corrigido' | 'inalterado'
      descricao: string
    }>
  }
  recomendacoes_tecnicas: Array<{
    prioridade: 'urgente' | 'alta' | 'média' | 'baixa'
    categoria: string
    recomendacao: string
    prazo: string
  }>
  avaliacao_geral: {
    condicao_estrutural: string
    condicao_estetica: string
    condicao_funcional: string
    status_habitabilidade: 'habitável' | 'habitável com ressalvas' | 'não habitável'
    observacoes_finais: string
  }
}

export async function generateCompleteTechnicalReport(
  input: TechnicalAnalysisInput
): Promise<TechnicalReportData> {
  const { photos, transcription, previousReport } = input

  // Montar contexto das fotos
  const photosContext = photos
    .map((photo, idx) => {
      const problemsText = photo.problems?.length
        ? photo.problems
            .map((p) => `  - ${p.description} (${p.severity}) - ${p.location}`)
            .join('\n')
        : '  Nenhum problema detectado'

      return `
FOTO ${idx + 1}${photo.from_video ? ` (Frame ${photo.frame_number} do vídeo)` : ''}:
- Cômodo: ${photo.room_name} (${photo.room_category})
- Resumo IA: ${photo.ai_summary || 'N/A'}
- Problemas:
${problemsText}
`
    })
    .join('\n---\n')

  const prompt = `Você é uma IA especializada em vistoria de imóveis, inspeções técnicas e geração de laudos profissionais.
Sua função é analisar vídeos, imagens, frames e transcrições já fornecidas pelo meu sistema (não faça transcrição).
Com base nesses materiais, produza um laudo de vistoria extremamente completo, claro, técnico e detalhado.

=== DADOS FORNECIDOS ===

${transcription ? `TRANSCRIÇÃO DO ÁUDIO/VÍDEO:\n${transcription}\n\n` : ''}

ANÁLISES DAS FOTOS/FRAMES:
${photosContext}

${previousReport ? `\nVISTORIA ANTERIOR (para comparação):\n${JSON.stringify(previousReport, null, 2)}\n` : ''}

=== INSTRUÇÕES QUE VOCÊ DEVE SEGUIR SEMPRE ===

1. Análise do imóvel
- Observe atentamente todos os frames e imagens enviados.
- Identifique cada cômodo automaticamente usando características visuais (ex.: bancada = cozinha, box = banheiro, azulejos = áreas molhadas, cama = quarto, etc.).
- Caso haja dúvida, indique o nível de certeza.

2. Detecção de danos e problemas
Para cada cômodo e para cada parte visível do imóvel, você deve identificar:
- rachaduras
- infiltrações
- mofo
- pintura descascada
- danos em piso, cerâmica ou revestimentos
- portas ou janelas desalinhadas
- tomadas soltas ou danificadas
- umidade
- danos estruturais
- problemas hidráulicos ou elétricos visíveis
- qualquer outro problema relevante para uma vistoria profissional

Sempre descreva:
- o que é o dano
- sua severidade (leve, moderado, grave ou crítico)
- impacto potencial (estético, segurança, estrutural, funcional)
- recomendação técnica de manutenção ou reparo
- **CUSTO ESTIMADO DE REPARO em Reais (R$):**
  - Considere a severidade, tamanho aproximado da área, tipo de material e mão de obra
  - Forneça uma estimativa realista baseada no mercado brasileiro
  - Para problemas leves: R$ 20-100
  - Para problemas moderados: R$ 100-500
  - Para problemas graves: R$ 500-2000
  - Para problemas críticos: R$ 2000+
  - Se não for possível estimar (problema muito vago), use 0

3. Anotações visuais
Para cada dano encontrado:
- descreva onde exatamente ele aparece na imagem
- explique como deve ser marcada a área (círculo, seta ou destaque)
- aponte a região aproximada (parte superior, inferior, esquerda, direita, centro etc.)

Você não desenha os círculos, apenas informa onde devem ser colocados.

4. Mapa do imóvel
Com base nos vídeos e imagens:
- identifique todos os cômodos
- descreva a ordem em que aparecem
- explique como cada ambiente se conecta ao próximo quando isso for possível
- organize o laudo por cômodo, sempre mantendo a sequência lógica da casa

5. Geolocalização interna (posição na planta)
Sempre que possível:
- indique a posição do dano dentro do cômodo
- relacione o dano com pontos de referência (porta, janela, canto da parede, bancada, chuveiro etc.)
- descreva a provável localização desse cômodo na planta do imóvel (ex.: "cômodo ao lado da cozinha, provavelmente uma área de serviço")

6. Comparação com a vistoria anterior (se fornecida)
${
  previousReport
    ? `
Se o sistema enviar dados de vistoria anterior, você deve:
- comparar cada dano antigo com o atual
- identificar o que piorou, melhorou ou foi corrigido
- listar novos danos
- listar danos que desapareceram
- indicar agravamento ou regressão
Organize esta análise de forma clara e objetiva.
`
    : 'Não há vistoria anterior para comparação.'
}

7. Construção do laudo final
Monte um laudo técnico completo, sempre incluindo:
- Resumo executivo da vistoria
- Descrição de todos os cômodos identificados
- Lista detalhada de danos por cômodo
- Severidade e impacto de cada problema
- Anotações visuais a serem aplicadas nas imagens
- Mapa e localização dos ambientes
- Geolocalização interna de cada dano
- Comparativo Antes/Depois, quando aplicável
- Recomendações técnicas de reparo e manutenção
- Avaliação geral do estado do imóvel

O laudo deve ser escrito com linguagem técnica, objetiva, profissional e completa — como um relatório de vistoria de engenheiro, arquiteto ou perito imobiliário.

8. Regras importantes
- Não invente danos: só descreva o que realmente aparece nas imagens.
- Não transcreva áudio: a transcrição é fornecida pela minha própria API.
- Use o máximo de detalhes possíveis.
- Nunca seja vago ou genérico.
- Se houver incerteza, diga claramente.

=== FORMATO DE SAÍDA ===

Retorne APENAS um JSON válido com esta estrutura:

{
  "resumo_executivo": {
    "total_comodos": number,
    "total_danos": number,
    "problemas_urgentes": number,
    "condicao_geral": "excelente|bom|regular|ruim|péssimo",
    "principais_descobertas": string[]
  },
  "mapa_imovel": {
    "comodos": [{
      "ordem": number,
      "nome": string,
      "tipo": string,
      "conexoes": string[]
    }],
    "fluxo_navegacao": string,
    "descricao_layout": string
  },
  "comodos": [{
    "nome": string,
    "tipo": string,
    "confianca_identificacao": number,
    "caracteristicas_visuais": string[],
    "condicao_geral": string,
    "danos": [{
      "descricao": string,
      "severidade": "leve|moderado|grave|crítico",
      "impacto": string[],
      "localizacao": string,
      "anotacao_visual": {
        "tipo": "círculo|seta|destaque",
        "posicao": string,
        "instrucao": string
      },
      "geolocalizacao_interna": string,
      "recomendacao_tecnica": string,
      "custo_estimado": number
    }]
  }],
  ${
    previousReport
      ? `
  "comparacao_anterior": {
    "novos_danos": number,
    "danos_piorados": number,
    "danos_corrigidos": number,
    "detalhes": [{
      "comodo": string,
      "tipo": "novo|piorou|corrigido|inalterado",
      "descricao": string
    }]
  },
  `
      : ''
  }
  "recomendacoes_tecnicas": [{
    "prioridade": "urgente|alta|média|baixa",
    "categoria": string,
    "recomendacao": string,
    "prazo": string
  }],
  "avaliacao_geral": {
    "condicao_estrutural": string,
    "condicao_estetica": string,
    "condicao_funcional": string,
    "status_habitabilidade": "habitável|habitável com ressalvas|não habitável",
    "observacoes_finais": string
  }
}`

  try {
    console.log('[Technical Analysis] Iniciando análise técnica completa...')

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    const cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const report = JSON.parse(cleanedResponse) as TechnicalReportData

    console.log('[Technical Analysis] Análise concluída com sucesso')
    console.log('[Technical Analysis] Tokens usados:', message.usage.output_tokens)

    return report
  } catch (error) {
    console.error('[Technical Analysis] Erro ao gerar análise:', error)
    throw new Error(
      `Falha ao gerar análise técnica: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    )
  }
}
