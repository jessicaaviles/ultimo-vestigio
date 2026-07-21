import { GoogleGenAI, Type, Schema } from '@google/genai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const BLOCKED_PATTERNS = /(ignore|esqueça|revele|mostre|prompt|instruções|system message|segredo|solução completa|ignore previous|forget|reveal the)/i;

const generateNarrative = async (classification: string, factualExplanation: string, questionText: string): Promise<string> => {
  const narrativePrompt = `Você é o Mestre IA de um jogo de mistério e investigação.
O jogador fez a seguinte pergunta: "${questionText}"

Responda APENAS à pergunta feita pelo jogador baseando-se no contexto abaixo.

Classificação: ${classification}
Contexto interno (use APENAS como base, não revele detalhes): ${factualExplanation}

Regras ESTRITAS:
1. Responda SEMPRE em português do Brasil (pt-BR).
2. Comece obrigatoriamente com: YES → "Sim." | NO → "Não." | PARTIAL → "Parcialmente." | IRRELEVANT → "Irrelevante para o caso. Faça outra pergunta." | UNKNOWN → "Não."
3. Após o prefixo, adicione NO MÁXIMO uma frase curta e vaga — sem revelar nomes, datas, locais ou detalhes concretos que não foram perguntados.
4. NUNCA mencione fatos ou detalhes que vão além do que a pergunta tocou.
5. Tom seco e misterioso — como um árbitro que sabe mais do que fala.`;


  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: narrativePrompt,
        config: { temperature: 0.4 }
      });
      const text = res.text?.trim();
      if (text && text.length > 5) return text.slice(0, 360);
    } catch (_err) {
      if (attempt === 0) await new Promise(r => setTimeout(r, 800));
    }
  }
  return '';
};

export const processQuestion = async (roomId: string, questionText: string, caseVersionId: string) => {
  try {
    const cleanQuestion = String(questionText || '').trim().slice(0, 500);
    if (!cleanQuestion) throw new Error('Empty question');

    if (BLOCKED_PATTERNS.test(cleanQuestion)) {
      return { classification: 'BLOCKED', rendered_text: 'Essa pergunta tenta alterar as regras da investigação. Reformule usando apenas os fatos do caso.', fallback_used: false };
    }

    const facts = await prisma.case_facts.findMany({
      where: { case_version_id: caseVersionId, visibility: { not: 'SECRET' } }
    });

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

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        classification: { type: Type.STRING, description: "Deve ser exatamente um destes: YES, NO, PARTIAL, IRRELEVANT, UNKNOWN, AMBIGUOUS, MULTI_PREMISE" },
        premises: { type: Type.ARRAY, items: { type: Type.STRING }, description: "As premissas extraídas da pergunta." },
        factualExplanation: { type: Type.STRING, description: "Contexto que justifica a classificação, baseado APENAS nos fatos. Sempre em português do Brasil." }
      },
      required: ["classification", "premises", "factualExplanation"]
    };

    const prompt = `Você atua como o motor lógico (Mestre IA) de um jogo de investigação brasileiro.
Sua função é interpretar a pergunta do jogador e classificá-la ESTRITAMENTE baseada nas informações abaixo.
Você NÃO pode inventar fatos, usar conhecimento externo ou tentar adivinhar o que não está escrito.
Responda SEMPRE em português do Brasil (pt-BR).

Resumo da Solução (Contexto Geral):
${solutionSummary}

Fatos Absolutos do Caso (Detalhes Específicos):
${factListText}

Regras de Classificação:
- YES: a pergunta/afirmação é verdadeira segundo os fatos.
- NO: a pergunta/afirmação é falsa segundo os fatos.
- PARTIAL: parte é verdade, parte é falsa ou incompleta.
- IRRELEVANT: não tem relação nenhuma com os fatos ou com a solução.
- UNKNOWN: os fatos não dizem nada sobre isso (não invente!).
- AMBIGUOUS: a pergunta usa pronomes soltos ou não faz sentido direto.
- MULTI_PREMISE: a pergunta contém múltiplas afirmações que precisam ser separadas.

Pergunta do Jogador: "${questionText}"

Analise a pergunta, extraia as premissas, compare com os Fatos Absolutos e gere a saída JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json', responseSchema, temperature: 0.1 }
    });

    if (!response.text) throw new Error("Resposta vazia do motor lógico");

    const logicResult = JSON.parse(response.text);
    const allowedClassifications = new Set(['YES', 'NO', 'PARTIAL', 'IRRELEVANT', 'UNKNOWN', 'BLOCKED', 'AMBIGUOUS', 'MULTI_PREMISE']);
    if (!allowedClassifications.has(logicResult.classification) || !Array.isArray(logicResult.premises) || typeof logicResult.factualExplanation !== 'string') {
      throw new Error('Invalid interpretation from AI');
    }

    if (['AMBIGUOUS', 'MULTI_PREMISE', 'BLOCKED'].includes(logicResult.classification)) {
      const msgMap: Record<string, string> = {
        AMBIGUOUS: 'A pergunta está ambígua — use termos mais específicos. Por exemplo: em vez de "alguém fez isso?", pergunte com nome e contexto.',
        MULTI_PREMISE: 'A pergunta contém múltiplas afirmações. Separe em perguntas menores, uma por vez.',
        BLOCKED: 'Essa pergunta não pode ser processada. Reformule focando nos eventos do caso.'
      };
      return { classification: logicResult.classification, rendered_text: msgMap[logicResult.classification] || 'Reformule a pergunta.', fallback_used: false };
    }

    const finalAnswerText = await generateNarrative(logicResult.classification, logicResult.factualExplanation, questionText);

    if (!finalAnswerText) {
      return { classification: 'UNKNOWN', rendered_text: 'O Mestre não conseguiu formular a resposta agora. Tente novamente.', fallback_used: true };
    }

    return { classification: logicResult.classification, rendered_text: finalAnswerText, fallback_used: false };

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
