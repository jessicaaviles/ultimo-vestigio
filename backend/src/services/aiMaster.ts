import { GoogleGenAI, Type, Schema } from '@google/genai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getAiClient = () => {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured');
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

const BLOCKED_PATTERNS = /(ignore|esqueça|revele|mostre|prompt|instruções|system message|segredo|solução completa|ignore previous|forget|reveal the)/i;

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');

const tokenize = (value: string) =>
  normalizeText(value)
    .split(/\W+/)
    .filter((word) => word.length > 3);

const INTERROGATIVE_STOPWORDS = new Set([
  'aconteceu',
  'alguma',
  'algum',
  'alguem',
  'aquela',
  'aquele',
  'aquilo',
  'caso',
  'coisa',
  'como',
  'comum',
  'dava',
  'dele',
  'dela',
  'deles',
  'delas',
  'disso',
  'disto',
  'essa',
  'esse',
  'esta',
  'este',
  'estava',
  'foram',
  'havia',
  'isso',
  'isto',
  'naquele',
  'naquela',
  'onde',
  'para',
  'pela',
  'pelo',
  'porque',
  'qual',
  'quando',
  'quem',
  'sobre',
  'tinha'
]);

const tokenizeForMatching = (value: string) =>
  tokenize(value).filter((word) => !INTERROGATIVE_STOPWORDS.has(word));

const verdictPrefix: Record<string, string> = {
  YES: 'Sim.',
  NO: 'Não.',
  PARTIAL: 'Parcialmente.',
  IRRELEVANT: 'Irrelevante.',
  UNKNOWN: 'Desconhecido.'
};

const buildRuleBasedAnswer = (classification: string) => {
  const normalizedClassification = classification.toUpperCase();
  const prefix = verdictPrefix[normalizedClassification] || 'Desconhecido.';
  const explanation = normalizedClassification === 'YES'
    ? 'Essa linha de investigação é pertinente ao caso.'
    : normalizedClassification === 'NO'
      ? 'Essa hipótese não se confirma pelos fatos disponíveis.'
      : normalizedClassification === 'PARTIAL'
        ? 'Há uma parte correta nessa linha, mas ela ainda não fecha o fato inteiro.'
        : 'O arquivo não confirma essa hipótese neste momento.';

  return {
    classification: normalizedClassification,
    rendered_text: `${prefix} ${explanation}`,
    fallback_used: false
  };
};

const processRuleBasedQuestion = (questionText: string, answerRules: any[]) => {
  const questionWords = new Set(tokenizeForMatching(questionText));
  if (questionWords.size === 0) return null;

  let bestMatch: { score: number; classification: string } | null = null;
  for (const rule of answerRules) {
    const examples = JSON.parse(rule.semantic_examples || '[]');
    const examplesText = Array.isArray(examples) ? examples.join(' ') : String(examples || '');
    const exampleWords = new Set(tokenizeForMatching(`${rule.intent_key} ${examplesText}`));
    if (exampleWords.size === 0) continue;

    const overlap = [...questionWords].filter((word) => exampleWords.has(word)).length;
    const score = overlap / Math.max(1, Math.min(questionWords.size, exampleWords.size));
    if (overlap >= 2 && score >= 0.35 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { score, classification: String(rule.default_classification || 'UNKNOWN') };
    }
  }

  return bestMatch ? buildRuleBasedAnswer(bestMatch.classification) : null;
};

const buildFactBasedAnswer = (classification = 'UNKNOWN') => ({
  classification,
  rendered_text: classification === 'YES'
    ? 'Sim. Essa linha aparece nos fatos confirmados do caso.'
    : 'Desconhecido. O arquivo não confirma essa hipótese neste momento.',
  fallback_used: false
});

export const processFactBasedQuestion = (questionText: string, facts: Array<{ statement: string }>, opening = '') => {
  const questionWords = new Set(tokenizeForMatching(questionText));
  if (questionWords.size === 0) return null;

  let bestScore = 0;
  for (const fact of facts) {
    const factWords = new Set(tokenizeForMatching(fact.statement || ''));
    if (factWords.size === 0) continue;
    const overlap = [...questionWords].filter((word) => factWords.has(word)).length;
    const score = overlap / Math.max(1, Math.min(questionWords.size, factWords.size));
    if (overlap >= 2 && score > bestScore) bestScore = score;
  }

  if (bestScore >= 0.34) return buildFactBasedAnswer('YES');

  const caseVocabulary = new Set(tokenizeForMatching(`${opening} ${facts.map((fact) => fact.statement).join(' ')}`));
  const relevantWords = [...questionWords].filter((word) => caseVocabulary.has(word));
  if (relevantWords.length > 0) return buildFactBasedAnswer('UNKNOWN');

  return null;
};

const isTooAmbiguousForPlay = (questionText: string) => {
  const questionWords = tokenizeForMatching(questionText);
  return questionWords.length <= 1;
};

export const processTutorialQuestion = (questionText: string) => {
  const question = normalizeText(questionText);
  const hasAny = (words: string[]) => words.some((word) => question.includes(word));
  const mentionsUmbrella = question.includes('guarda-chuva') || question.includes('guarda chuva');

  if (question.includes('ceu') && question.includes('limpo')) {
    return {
      classification: 'YES',
      rendered_text: 'Sim. O céu estava limpo, então a água não veio da chuva.',
      fallback_used: false
    };
  }

  if (mentionsUmbrella && hasAny(['dentro', 'predio', 'sala', 'interno', 'usou', 'abriu'])) {
    return {
      classification: 'YES',
      rendered_text: 'Sim. O guarda-chuva foi usado dentro do prédio.',
      fallback_used: false
    };
  }

  if (mentionsUmbrella && hasAny(['molhado', 'agua'])) {
    return {
      classification: 'PARTIAL',
      rendered_text: 'Parcialmente. O guarda-chuva realmente foi molhado por água, mas não por chuva.',
      fallback_used: false
    };
  }

  if (hasAny(['choveu', 'chuva', 'temporal', 'ceu', 'clima', 'tempo'])) {
    return {
      classification: question.includes('nao choveu') || question.includes('sem chuva') ? 'YES' : 'NO',
      rendered_text: question.includes('nao choveu') || question.includes('sem chuva')
        ? 'Sim. Não há registro de chuva naquele dia.'
        : 'Não. A água não veio da chuva.',
      fallback_used: false
    };
  }

  if (hasAny(['ar condicionado', 'condicionado', 'vazamento', 'tubulacao', 'tubo', 'cano', 'corredor', 'goteira'])) {
    return {
      classification: 'YES',
      rendered_text: 'Sim. Há relação com água vindo de uma instalação interna do prédio.',
      fallback_used: false
    };
  }

  if (hasAny(['teto', 'forro', 'cobertura'])) {
    return {
      classification: 'YES',
      rendered_text: 'Sim. Era uma sala interna, protegida da chuva direta.',
      fallback_used: false
    };
  }

  if (hasAny(['dentro', 'predio', 'sala', 'interno', 'usou', 'abriu'])) {
    return {
      classification: 'YES',
      rendered_text: 'Sim. O guarda-chuva foi usado dentro do prédio.',
      fallback_used: false
    };
  }

  if (hasAny(['molhado', 'agua', 'guarda-chuva', 'guarda chuva'])) {
    return {
      classification: 'PARTIAL',
      rendered_text: 'Parcialmente. O guarda-chuva realmente foi molhado por água, mas não por chuva.',
      fallback_used: false
    };
  }

  return {
    classification: 'UNKNOWN',
    rendered_text: 'Desconhecido. Essa pergunta não aponta para um fato confirmado no arquivo.',
    fallback_used: false
  };
};

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

    if (!caseVersion) {
      return { classification: 'UNKNOWN', rendered_text: 'O arquivo do caso não pôde ser acessado agora. Tente novamente em instantes.', fallback_used: true };
    }

    if (caseVersion.case_ref.slug === 'o-guarda-chuva-molhado') {
      return processTutorialQuestion(cleanQuestion);
    }

    if (!facts || facts.length === 0) {
      return { classification: 'UNKNOWN', rendered_text: 'O arquivo do caso não pôde ser acessado agora. Tente novamente em instantes.', fallback_used: true };
    }

    const ruleBasedAnswer = processRuleBasedQuestion(cleanQuestion, answerRules);
    if (ruleBasedAnswer) return ruleBasedAnswer;

    const factBasedAnswer = processFactBasedQuestion(cleanQuestion, facts, caseVersion.opening);
    if (factBasedAnswer) return factBasedAnswer;

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

    const response = await getAiClient().models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json', responseSchema, temperature: 0.1 }
    });

    if (!response.text) throw new Error("Resposta vazia do motor lógico");
    
    const logicResult = JSON.parse(response.text);
    
    const uppercaseVerdict = String(logicResult.verdict).toUpperCase();
    if (uppercaseVerdict === 'REFORMULATE') {
      if (isTooAmbiguousForPlay(cleanQuestion)) {
        return { classification: 'AMBIGUOUS', rendered_text: logicResult.publicExplanation || 'A pergunta está ambígua demais. Dê um pouco mais de contexto.', fallback_used: false };
      }
      return { classification: 'UNKNOWN', rendered_text: 'Desconhecido. O arquivo não confirma essa hipótese neste momento.', fallback_used: false };
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
    return {
      classification: "UNKNOWN",
      rendered_text: "Desconhecido. O arquivo não confirma essa hipótese neste momento.",
      fallback_used: false
    };
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

    const response = await getAiClient().models.generateContent({
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

    const response = await getAiClient().models.generateContent({
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
