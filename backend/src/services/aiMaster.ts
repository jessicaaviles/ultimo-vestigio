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
    const clampScore = (value: unknown) => {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return 0;
      return Math.max(0, Math.min(100, Math.round(numeric)));
    };

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

    const structuredAnswers = {
      what_happened: String(theoryAnswers.what_happened || theoryAnswers.theory || '').trim(),
      who: String(theoryAnswers.who || '').trim(),
      how: String(theoryAnswers.how || '').trim(),
      why: String(theoryAnswers.why || '').trim()
    };

    const prompt = `Você é o avaliador de um jogo de investigação policial.
Avalie a teoria dos jogadores comparando cada campo com a solução real do caso.

Solução Real do Caso (Fatos absolutos):
"${trueSolutionText}"

Teoria submetida pelos jogadores, separada por campo:
1. O que aconteceu?
"${structuredAnswers.what_happened}"

2. Quem foi o responsável?
"${structuredAnswers.who}"

3. Como foi feito?
"${structuredAnswers.how}"

4. Por quê?
"${structuredAnswers.why}"

Instruções ESTRITAS:
1. Avalie cada campo separadamente em dimensionResults, de 0 a 100.
2. what_happened: mede se identificaram corretamente a natureza real do caso, não só a aparência da cena.
3. who: mede se apontaram o responsável correto ou os envolvidos corretos. Aceite nomes, sobrenomes, cargos ou descrições inequívocas.
4. how: mede o método, mecanismo, sequência e uso de pistas falsas. Este campo deve ser mais exigente.
5. why: mede a motivação central. Aceite resumo curto se a motivação principal estiver correta.
6. Seja tolerante a sinônimos e formulações incompletas, mas não dê nota alta quando o campo acertar só por chute sem lógica.
7. O score geral deve refletir os quatro campos, mas será recalculado pelo sistema. Ainda assim, retorne uma estimativa coerente.
8. Gere um feedback curto, no máximo 2 frases, em português do Brasil. Aponte o campo mais fraco sem revelar uma nova pista que os jogadores não tenham citado.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json', responseSchema, temperature: 0.1 }
    });

    if (!response.text) throw new Error("Resposta vazia da avaliação");
    const result = JSON.parse(response.text);
    const dimensionResults = {
      what_happened: clampScore(result.dimensionResults?.what_happened),
      who: clampScore(result.dimensionResults?.who),
      how: clampScore(result.dimensionResults?.how),
      why: clampScore(result.dimensionResults?.why)
    };
    const weightedScore = Math.round(
      (dimensionResults.what_happened * 0.25)
      + (dimensionResults.who * 0.25)
      + (dimensionResults.how * 0.35)
      + (dimensionResults.why * 0.15)
    );

    return {
      score: weightedScore,
      feedback: result.feedback || "Avaliação concluída.",
      dimensionResults
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
