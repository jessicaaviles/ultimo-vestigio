import { GoogleGenAI, Type, Schema } from '@google/genai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const BLOCKED_PATTERNS = /(ignore|esqueça|revele|mostre|prompt|instruções|system message|segredo|solução completa|ignore previous|forget|reveal the)/i;

export const processQuestion = async (roomId: string, questionText: string, caseVersionId: string) => {
  try {
    const cleanQuestion = String(questionText || '').trim().slice(0, 500);
    if (!cleanQuestion) throw new Error('Empty question');

    if (BLOCKED_PATTERNS.test(cleanQuestion)) {
      return { classification: 'BLOCKED', rendered_text: 'Essa pergunta tenta alterar as regras da investigação. Reformule usando apenas os fatos do caso.', fallback_used: false };
    }

    const [facts, answerRules] = await Promise.all([
      prisma.case_facts.findMany({
        where: { case_version_id: caseVersionId, visibility: { not: 'SECRET' } }
      }),
      prisma.case_answer_rules.findMany({
        where: { case_version_id: caseVersionId }
      })
    ]);

    const caseVersion = await prisma.case_versions.findUnique({
      where: { id: caseVersionId },
      include: { case_ref: true }
    });

    if (!facts || facts.length === 0 || !caseVersion) {
      return { classification: 'UNKNOWN', rendered_text: 'O arquivo do caso não pôde ser acessado agora. Tente novamente em instantes.', fallback_used: true };
    }

    const { revealSecret } = await import('../security/secrets');
    const solutionSummary = revealSecret(caseVersion.solution_summary_encrypted);
    const factListText = facts.map((f: any) => `- ${f.statement}`).join('\n');
    const answerRulesText = answerRules.length
      ? answerRules.map((rule: any) => {
        const examples = JSON.parse(rule.semantic_examples || '[]').join('; ');
        const factKeys = JSON.parse(rule.related_fact_keys || '[]').join(', ');
        return `- ${rule.intent_key}: classifique como ${rule.default_classification}; exemplos: ${examples}; fatos relacionados: ${factKeys}`;
      }).join('\n')
      : '- Nenhuma regra semântica específica cadastrada para este caso.';

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        verdict: { type: Type.STRING, description: "Deve ser: yes, no, partial, irrelevant, unknown, reformulate" },
        shortAnswer: { type: Type.STRING, description: "Uma resposta prefixo curta: 'Sim.', 'Não.', 'Parcialmente.', etc." },
        publicExplanation: { type: Type.STRING, description: "Comentário narrativo curto, sem revelar detalhes concretos que não foram perguntados." },
        unlockClue: { type: Type.BOOLEAN, description: "True se a pergunta do jogador demonstrou que ele compreendeu ou descobriu uma evidência." },
        clueIdToUnlock: { type: Type.STRING, nullable: true, description: "O ID exato da pista a ser destravada (ex: 'fireplace', 'desk_letter')." },
        locationId: { type: Type.STRING, nullable: true, description: "O ID do local a ser destravado (ex: 'library', 'bedroom', 'garden')." }
      },
      required: ["verdict", "shortAnswer", "publicExplanation", "unlockClue"]
    };

    const prompt = `Você atua como o Mestre IA (árbitro) de um jogo de investigação.
Sua função é interpretar a pergunta do jogador e validar se ele descobriu algo.
Responda SEMPRE em português do Brasil (pt-BR).

Resumo da Solução e Regras Especiais de Desbloqueio:
${solutionSummary}

Fatos Absolutos do Caso:
${factListText}

Regras Semânticas de Descoberta:
${answerRulesText}

Regras ESTRITAS:
1. Responda apenas "Sim", "Não", "Parcialmente", "Irrelevante" ou "Desconhecido".
2. Não revele detalhes na \`publicExplanation\`. Confirme apenas a parte exata perguntada, sem listar outros fatos relacionados, nomes novos, método completo, motivo completo ou cronologia completa.
3. Se a pergunta estiver perto da solução, responda de forma curta e ainda investigativa. Não entregue a solução de bandeja.
4. Se a pergunta demonstrar que o jogador investigou corretamente um hotspot ou desvendou uma etapa, defina \`unlockClue\` como true e indique a \`clueIdToUnlock\` ou \`locationId\` apropriada conforme o gabarito das regras especiais.

Pergunta do Jogador: "${questionText}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json', responseSchema, temperature: 0.1 }
    });

    if (!response.text) throw new Error("Resposta vazia do motor lógico");
    
    const logicResult = JSON.parse(response.text);
    
    const uppercaseVerdict = String(logicResult.verdict).toUpperCase();
    if (uppercaseVerdict === 'REFORMULATE') {
      return { classification: 'AMBIGUOUS', rendered_text: logicResult.publicExplanation, fallback_used: false };
    }

    return { 
      classification: uppercaseVerdict, 
      rendered_text: `${logicResult.shortAnswer} ${logicResult.publicExplanation}`.trim(),
      unlockClue: logicResult.unlockClue,
      clueIdToUnlock: logicResult.clueIdToUnlock,
      locationId: logicResult.locationId,
      fallback_used: false 
    };

  } catch (error) {
    console.error("Erro no Mestre IA:", error);
    return { classification: "UNKNOWN", rendered_text: "O Mestre está consultando os arquivos. Tente reformular a pergunta.", fallback_used: true };
  }
};

export const evaluateTheory = async (theoryAnswers: any, trueSolutionText: string) => {
  try {
    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.INTEGER, description: "Nota geral da teoria (0 a 100)." },
        feedback: { type: Type.STRING, description: "Feedback em português do Brasil sobre o que acertaram e o que erraram." },
        dimensionResults: {
          type: Type.OBJECT,
          properties: {
            what_happened: { type: Type.INTEGER, description: "Nota (0 a 100)." },
            who: { type: Type.INTEGER, description: "Nota (0 a 100)." },
            how: { type: Type.INTEGER, description: "Nota (0 a 100)." },
            why: { type: Type.INTEGER, description: "Nota (0 a 100)." }
          },
          required: ["what_happened", "who", "how", "why"]
        }
      },
      required: ["score", "feedback", "dimensionResults"]
    };

    const prompt = `Você é o avaliador de um jogo de investigação policial.
Avalie a teoria dos jogadores comparando-a com a solução real do caso.

Solução Real do Caso (Fatos absolutos):
"${trueSolutionText}"

Teoria submetida pelos jogadores:
"${theoryAnswers.theory || Object.values(theoryAnswers).join(' ')}"

Instruções ESTRITAS:
1. Avalie a teoria descrita pelos jogadores dando uma nota geral (score) de 0 a 100 com base em quão próxima ela está da Solução Real.
2. Seja MUITO tolerante a sinônimos, palavras diferentes ou explicações mais curtas. Se o cerne da resposta bater com a solução real, dê 100. Não penalize por falta de nomes específicos se a intenção e a lógica estiverem corretas.
3. Para preencher as 'dimensionResults', simplesmente repita a mesma nota geral em todos os campos.
4. Gere um 'feedback' curto (max 2 frases) em português do Brasil, num tom de detetive sênior. Se a nota for >= 75, confirme o sucesso. Se for menor, aponte de forma misteriosa onde eles erraram.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json', responseSchema, temperature: 0.1 }
    });

    if (!response.text) throw new Error("Resposta vazia da avaliação");
    const result = JSON.parse(response.text);
    return {
      score: result.score || 0,
      feedback: result.feedback || "Avaliação concluída.",
      dimensionResults: result.dimensionResults || { what_happened: 0, who: 0, how: 0, why: 0 }
    };
  } catch (error) {
    console.error("Erro na avaliação IA da teoria:", error);
    // Fallback básico caso a IA falhe
    return {
      score: 50,
      feedback: "A avaliação detalhada falhou, mas há inconsistências na teoria.",
      dimensionResults: { what_happened: 50, who: 50, how: 50, why: 50 }
    };
  }
};

export const analyzeEvidence = async (evidenceId: string, title: string, desc: string, type: string) => {
  try {
    const prompt = `Você é um detetive forense experiente analisando evidências em um jogo de mistério.
O detetive novato trouxe a seguinte pista para o laboratório:

ID: ${evidenceId}
Tipo: ${type}
Título: "${title}"
Descrição encontrada na cena: "${desc}"

Sua tarefa: Forneça uma análise técnica e imersiva sobre essa evidência. 
Se for uma carta, analise a caligrafia, as pressões da caneta ou a procedência do papel.
Se for um objeto físico, analise arranhões, impressões digitais, desgaste, fabricante, etc.

REGRA CRUCIAL: Nunca dê a resposta mastigada. O jogador deve desvendar o caso. Dê apenas dicas fortes, aponte inconsistências ou levante perguntas intrigantes que façam o jogador pensar. Deixe o mistério no ar. NÃO invente fatos que resolvam o caso sozinhos.

Responda APENAS com a dedução em texto corrido, de forma imersiva (no máximo 2 parágrafos pequenos). Em português do Brasil.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: { temperature: 0.6 }
    });

    if (!response.text) return "Não foi possível extrair dados conclusivos dessa amostra.";
    return response.text;
  } catch (error) {
    console.error("Erro na analise de evidencia (Gemini):", error);
    return "A análise forense foi interrompida devido a uma falha no equipamento do laboratório.";
  }
};
