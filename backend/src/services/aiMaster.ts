import { GoogleGenAI, Type, Schema } from '@google/genai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const BLOCKED_PATTERNS = /(ignore|esqueça|revele|mostre|prompt|instruções|system message|segredo|solução completa|ignore previous|forget|reveal the)/i;

const generateNarrative = async (classification: string, factualExplanation: string): Promise<string> => {
  const narrativePrompt = `Você é o Mestre IA de um jogo de mistério e investigação brasileiro.
Sua tarefa é redigir a resposta final ao jogador, baseada na análise lógica abaixo.

Classificação lógica: ${classification}
Justificativa factual: ${factualExplanation}

Regras obrigatórias:
1. Responda SEMPRE em português do Brasil (pt-BR). Nunca use outro idioma.
2. Responda em no máximo 2 frases curtas e diretas.
3. Não invente nada que não esteja na justificativa factual.
4. Prefixos obrigatórios: YES → "Sim." | NO → "Não." | PARTIAL → "Parcialmente." | IRRELEVANT → "Isso é irrelevante para o caso." | UNKNOWN → "Os registros não revelam isso."
5. Use um tom levemente misterioso e narrativo, como um narrador de noir.`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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

    if (!facts || facts.length === 0) {
      return { classification: 'UNKNOWN', rendered_text: 'O arquivo do caso não pôde ser acessado agora. Tente novamente em instantes.', fallback_used: true };
    }

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
Sua função é interpretar a pergunta do jogador e classificá-la ESTRITAMENTE baseada nos fatos fornecidos abaixo.
Você NÃO pode inventar fatos, usar conhecimento externo ou tentar adivinhar o que não está escrito.
Responda SEMPRE em português do Brasil (pt-BR).

Fatos Absolutos do Caso:
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
      model: 'gemini-2.5-flash',
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

    const finalAnswerText = await generateNarrative(logicResult.classification, logicResult.factualExplanation);

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
  const stopWords = new Set(['para', 'como', 'uma', 'que', 'foi', 'com', 'dos', 'das', 'por', 'antes', 'durante', 'the', 'and']);
  const tokens = (value: string) => new Set(String(value || '').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').match(/[a-z0-9]{4,}/g)?.filter((word) => !stopWords.has(word)) || []);
  const solutionTokens = tokens(trueSolutionText);
  const fields = ['what_happened', 'who', 'how', 'why'];
  const dimensionResults = fields.reduce<Record<string, number>>((result, field) => {
    const answerTokens = tokens(theoryAnswers?.[field]);
    const overlap = [...answerTokens].filter((token) => solutionTokens.has(token)).length;
    result[field] = answerTokens.size ? Math.min(100, Math.round((overlap / Math.min(answerTokens.size, 6)) * 100)) : 0;
    return result;
  }, {});
  const score = Math.max(0, Math.min(100, Math.round(Object.values(dimensionResults).reduce((sum, value) => sum + value, 0) / fields.length)));
  return {
    score,
    feedback: score >= 75
      ? 'A teoria acompanha os fatos essenciais do caso.'
      : score >= 40
        ? 'Há conexões corretas, mas alguns detalhes ainda não fecham a linha do tempo.'
        : 'A hipótese se afasta dos fatos disponíveis. Volte ao histórico e observe as pequenas inconsistências.',
    dimensionResults
  };
};
