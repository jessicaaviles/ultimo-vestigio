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

const SYNONYM_GROUPS = [
  ['culpado', 'culpada', 'responsavel', 'responsável', 'autor', 'autora', 'causador', 'causadora'],
  ['envolvido', 'envolvida', 'ligado', 'ligada', 'relacao', 'relação', 'conexao', 'conexão', 'participacao', 'participação'],
  ['desapareceu', 'desaparecer', 'desaparecimento', 'sumiu', 'sumir', 'sumiço', 'sumico'],
  ['fugiu', 'fuga', 'escapou', 'saiu', 'deixou'],
  ['pegada', 'pegadas', 'rastro', 'rastros', 'marca', 'marcas', 'barro', 'lama'],
  ['pista', 'prova', 'indicio', 'indício', 'vestigio', 'vestígio', 'evidencia', 'evidência'],
  ['luz', 'luzes', 'iluminacao', 'iluminação', 'refletor', 'refletores', 'lampada', 'lâmpada'],
  ['luz', 'exposicao', 'exposição', 'claridade', 'reflexo', 'reflexiva', 'reflexivo'],
  ['apagou', 'apagada', 'apagaram', 'desligou', 'desligar', 'desligada', 'escuro'],
  ['curador', 'organizador', 'organizou', 'contratou', 'contratante', 'exposicao', 'exposição'],
  ['colecionador', 'comprador', 'cliente'],
  ['paisagista', 'arquiteta'],
  ['jardineiro', 'jardineiros', 'jardinagem', 'jardineira', 'equipe'],
  ['trilho', 'trilhos', 'drenagem', 'canaleta', 'canaletas', 'canal', 'calha'],
  ['carrinho', 'carro', 'transporte', 'manutencao', 'manutenção'],
  ['lona', 'tecido', 'cobertura', 'pano', 'fibra', 'fibras'],
  ['quimico', 'químico', 'produto', 'odor', 'cheiro', 'spray', 'anestesico', 'anestésico'],
  ['falso', 'falsa', 'falsas', 'artificial', 'fake'],
  ['encenado', 'encenada', 'simulado', 'simulada', 'forjado', 'forjada', 'falso', 'falsa'],
  ['motivo', 'motivacao', 'motivação', 'interesse', 'vantagem', 'razão', 'razao'],
  ['rival', 'rivalidade', 'inimiga', 'inimizade', 'competia', 'concorrente'],
  ['enviou', 'enviada', 'enviado', 'enviar', 'mandou', 'mandada', 'mandado', 'disparou', 'disparada'],
  ['script', 'automacao', 'automação', 'agendada', 'agendado', 'programada', 'programado'],
  ['brincadeira', 'pegadinha', 'jogo', 'caca', 'caça', 'tesouro', 'encenacao', 'encenação'],
  ['digitalina', 'remedio', 'remédio', 'medicamento', 'cardiaco', 'cardíaco', 'veneno', 'envenenada', 'envenenado', 'adulterado', 'adulterada'],
  ['divida', 'dívida', 'dividas', 'dívidas', 'endividado', 'endividada', 'financeiro', 'financeira', 'dinheiro'],
  ['prototipo', 'protótipo', 'bateria', 'invento', 'tecnologia'],
  ['roubo', 'roubar', 'roubou', 'furto', 'furtado', 'furtou', 'levou'],
  ['arrombada', 'arrombar', 'forcada', 'forçada', 'forcado', 'forçado', 'quebrada'],
  ['bilhete', 'nota', 'carta', 'recado'],
  ['alcapao', 'alçapão', 'teto', 'escotilha'],
  ['poco', 'poço', 'shaft', 'manutencao', 'manutenção'],
  ['clarao', 'clarão', 'flash', 'brilho', 'ofuscou', 'ofuscados', 'cegou'],
  ['magia', 'fantasma', 'sobrenatural', 'assombrado', 'assombrada'],
  ['sangue', 'hemorragia', 'mancha', 'manchas'],
  ['sequestro', 'sequestrada', 'sequestrado', 'rapto', 'raptada']
];

const SYNONYM_LOOKUP = SYNONYM_GROUPS.reduce((lookup, group) => {
  const normalizedGroup = group.map((word) => normalizeText(word));
  for (const word of normalizedGroup) {
    lookup.set(word, normalizedGroup);
  }
  return lookup;
}, new Map<string, string[]>());

const expandSynonyms = (word: string) => SYNONYM_LOOKUP.get(word) || [word];

const baseTokensForMatching = (value: string) =>
  tokenize(value).filter((word) => !INTERROGATIVE_STOPWORDS.has(word));

const tokenizeForMatching = (value: string) => {
  const words = baseTokensForMatching(value);
  return [...new Set(words.flatMap(expandSynonyms))];
};

const verdictPrefix: Record<string, string> = {
  YES: 'Sim.',
  NO: 'Não.',
  PARTIAL: 'Parcialmente.',
  IRRELEVANT: 'Irrelevante.',
  UNKNOWN: 'Desconhecido.'
};

const pickBestRelatedFact = (questionText: string, relatedFacts: string[] = []) => {
  const questionWords = new Set(tokenizeForMatching(questionText));
  const exactQuestionWords = new Set(baseTokensForMatching(questionText));
  let best: { score: number; exactOverlap: number; statement: string } | null = null;

  for (const statement of relatedFacts.filter(Boolean)) {
    const factWords = new Set(tokenizeForMatching(statement));
    const exactFactWords = new Set(baseTokensForMatching(statement));
    const overlap = [...questionWords].filter((word) => factWords.has(word)).length;
    const exactOverlap = [...exactQuestionWords].filter((word) => exactFactWords.has(word)).length;
    const score = overlap / Math.max(1, Math.min(questionWords.size, factWords.size)) + exactOverlap * 0.2;
    if (!best || exactOverlap > best.exactOverlap || (exactOverlap === best.exactOverlap && score > best.score)) {
      best = { score, exactOverlap, statement };
    }
  }

  return best?.statement || relatedFacts.find(Boolean) || '';
};

const buildRuleBasedAnswer = (classification: string, relatedFacts: string[] = [], questionText = '') => {
  const normalizedClassification = classification.toUpperCase();
  const prefix = verdictPrefix[normalizedClassification] || 'Desconhecido.';
  const relatedFact = pickBestRelatedFact(questionText, relatedFacts);
  const explanation = normalizedClassification === 'YES'
    ? relatedFact || 'Essa linha de investigação é pertinente ao caso.'
    : normalizedClassification === 'NO'
      ? relatedFact || 'Essa hipótese não se confirma pelos fatos disponíveis.'
      : normalizedClassification === 'PARTIAL'
        ? relatedFact || 'Há uma parte correta nessa linha, mas ela ainda não fecha o fato inteiro.'
        : 'O arquivo não confirma essa hipótese neste momento.';

  return {
    classification: normalizedClassification,
    rendered_text: `${prefix} ${explanation}`,
    fallback_used: false
  };
};

const BROAD_SOLUTION_WORDS = new Set([
  'aconteceu',
  'culpado',
  'culpada',
  'feito',
  'motivo',
  'responsavel',
  'responsável',
  'solucao',
  'solução'
]);

type InvestigationPhase = 'IN_PROGRESS' | 'SOLVING' | 'REVEAL' | 'COMPLETED' | 'PAUSED' | string;

export const isBroadSolutionQuestion = (questionText: string) => {
  const normalized = normalizeText(questionText);
  const words = baseTokensForMatching(questionText);
  const startsBroad = /^(quem|como|qual|quais|o que|por que|porque)\b/.test(normalized);
  const mentionsBroadSolution = words.some((word) => BROAD_SOLUTION_WORDS.has(word))
    || /\b(quem matou|matou|sumiu|desapareceu|fez isso|fez tudo|por tras|por trás)\b/.test(normalized);
  const hasSpecificAnchor = words.some((word) => word.length >= 8 && !BROAD_SOLUTION_WORDS.has(word));

  return startsBroad && mentionsBroadSolution && words.length <= 3 && !hasSpecificAnchor;
};

const buildAntiSpoilerAnswer = (phase: InvestigationPhase = 'IN_PROGRESS') => ({
  classification: 'UNKNOWN',
  rendered_text: phase === 'SOLVING'
    ? 'Desconhecido. Use o relatório final para formular sua teoria; investigue fatos específicos se ainda houver dúvida.'
    : phase === 'REVEAL' || phase === 'COMPLETED'
      ? 'Desconhecido. A solução ampla pertence ao relatório final do caso.'
      : phase === 'PAUSED'
        ? 'Desconhecido. A investigação está pausada; retome a sala para consultar fatos específicos.'
        : 'Desconhecido. A pergunta está ampla demais; investigue um fato específico antes de formular a solução.',
  fallback_used: false
});

export const processRuleBasedQuestion = (questionText: string, answerRules: any[], facts: Array<{ fact_key: string; statement: string }> = [], phase: InvestigationPhase = 'IN_PROGRESS') => {
  if (isBroadSolutionQuestion(questionText)) return buildAntiSpoilerAnswer(phase);

  const questionWords = new Set(tokenizeForMatching(questionText));
  if (questionWords.size === 0) return null;

  let bestMatch: { score: number; classification: string; factKeys: string[] } | null = null;
  const factMap = new Map(facts.map((fact) => [fact.fact_key, fact.statement]));
  for (const rule of answerRules) {
    const examples = JSON.parse(rule.semantic_examples || '[]');
    const factKeys = JSON.parse(rule.related_fact_keys || '[]');
    const examplesText = Array.isArray(examples) ? examples.join(' ') : String(examples || '');
    const exampleWords = new Set(tokenizeForMatching(`${rule.intent_key} ${examplesText}`));
    if (exampleWords.size === 0) continue;

    const overlap = [...questionWords].filter((word) => exampleWords.has(word)).length;
    const score = overlap / Math.max(1, Math.min(questionWords.size, exampleWords.size));
    const hasSpecificSingleToken = questionWords.size === 1 && [...questionWords][0].length >= 8;
    const minimumOverlap = (questionWords.size <= 2 && baseTokensForMatching(questionText).length >= 2) || hasSpecificSingleToken ? 1 : 2;
    const minimumScore = minimumOverlap === 1 ? 0.5 : 0.25;
    if (overlap >= minimumOverlap && score >= minimumScore && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { score, classification: String(rule.default_classification || 'UNKNOWN'), factKeys };
    }
  }

  return bestMatch ? buildRuleBasedAnswer(bestMatch.classification, bestMatch.factKeys.map((key) => factMap.get(key) || ''), questionText) : null;
};

const buildFactBasedAnswer = (classification = 'UNKNOWN', relatedFact = '') => ({
  classification,
  rendered_text: classification === 'YES'
    ? `Sim. ${relatedFact || 'Essa linha aparece nos fatos confirmados do caso.'}`
    : classification === 'NO'
      ? `Não. ${relatedFact || 'Essa hipótese não se confirma pelos fatos disponíveis.'}`
      : classification === 'PARTIAL'
        ? `Parcialmente. ${relatedFact || 'Há uma parte correta, mas ela não fecha o fato inteiro.'}`
    : 'Desconhecido. O arquivo não confirma essa hipótese neste momento.',
  fallback_used: false
});

const staticRule = (intent_key: string, examples: string[], relatedFactKeys: string[], defaultClassification = 'YES') => ({
  intent_key,
  semantic_examples: JSON.stringify(examples),
  related_fact_keys: JSON.stringify(relatedFactKeys),
  default_classification: defaultClassification
});

type TruthVerdict = 'YES' | 'NO' | 'PARTIAL' | 'UNKNOWN';

type CaseTruthEntry = {
  fact_key: string;
  statement: string;
  examples: string[];
  verdict: TruthVerdict;
  is_solution_critical?: boolean;
};

type CaseEntityAlias = {
  canonical: string;
  aliases: string[];
};

type CaseTruthMatrix = {
  opening?: string;
  entities: CaseEntityAlias[];
  truths: CaseTruthEntry[];
};

const truth = (
  fact_key: string,
  statement: string,
  examples: string[],
  verdict: TruthVerdict = 'YES',
  is_solution_critical = false
): CaseTruthEntry => ({ fact_key, statement, examples, verdict, is_solution_critical });

const entity = (canonical: string, aliases: string[] = []): CaseEntityAlias => ({ canonical, aliases });

export const getCaseTruthMatrix = (slug: string): CaseTruthMatrix | null => {
  const matrices: Record<string, CaseTruthMatrix> = {
    'o-presente-desaparecido': {
      entities: [
        entity('anfitrião', ['dono da casa', 'organizador', 'host']),
        entity('presente', ['caixa', 'embrulho', 'embalagem'])
      ],
      truths: [
        truth('empty_box_before_party', 'A caixa já estava vazia antes do desaparecimento.', ['A caixa estava vazia?', 'O presente estava dentro da caixa?', 'Tinha algo na caixa?'], 'YES', true),
        truth('folded_under_tablecloth', 'A embalagem foi dobrada e escondida sob a toalha.', ['A caixa foi escondida na mesa?', 'Estava debaixo da toalha?', 'A embalagem ficou sob a toalha?'], 'YES', true),
        truth('host_staged_game', 'O anfitrião encenou o sumiço para iniciar uma caça ao tesouro.', ['Foi encenação?', 'O anfitrião planejou?', 'Era uma brincadeira?', 'Era pegadinha?', 'Foi caça ao tesouro?'], 'YES', true),
        truth('real_present_elsewhere', 'O presente real estava escondido em outro lugar da casa.', ['O presente estava em outro lugar?', 'O presente real estava escondido?'], 'YES', true),
        truth('nobody_left_room', 'Ninguém precisou sair do ambiente para a caixa desaparecer.', ['Alguém saiu da sala?', 'Precisaram sair do ambiente?', 'Alguém deixou a sala?'], 'NO'),
        truth('present_not_stolen', 'Ninguém roubou o presente; o sumiço foi uma encenação planejada.', ['Alguém roubou o presente?', 'Foi roubo?', 'O presente foi furtado?', 'Alguém levou o presente?'], 'NO', true),
        truth('guests_saw_disappearance', 'Os convidados viram a caixa sumir, mas isso não significa que todos perceberam a dobra sob a toalha.', ['Todos viram o presente sumir?', 'Os convidados perceberam tudo?', 'Todo mundo viu a manobra?'], 'PARTIAL')
      ]
    },
    'o-quarto-7': {
      entities: [
        entity('Helena Duarte', ['helena', 'hospede', 'mulher']),
        entity('Renato Álvares', ['renato', 'gerente']),
        entity('Hotel Vesper', ['hotel', 'vesper'])
      ],
      truths: [
        truth('renato_master_key', 'Renato usou a chave mestra para encenar o quarto trancado.', ['A porta foi trancada por dentro?', 'Renato usou chave mestra?', 'O quarto trancado era falso?', 'Renato é o responsável?', 'Renato é culpado?'], 'YES', true),
        truth('door_not_forced', 'A porta não foi arrombada; Renato usou uma chave mestra.', ['A porta foi arrombada?', 'A porta foi forçada?', 'A fechadura foi quebrada?'], 'NO', true),
        truth('tea_sedative', 'O chá de Helena continha sedativo não letal.', ['O chá tinha sedativo?', 'A bebida tinha sedativo?', 'Helena foi drogada?', 'A bebida foi adulterada?'], 'YES', true),
        truth('camera_service_stairs', 'A câmera foi virada para ocultar a rota pela escada de serviço.', ['A câmera foi mexida?', 'A escada de serviço importa?', 'A escada era a rota?'], 'YES', true),
        truth('clock_false_time', 'O relógio quebrado em 23h17 criou uma hora falsa.', ['O relógio marcava hora falsa?', 'O horário 23h17 era falso?', 'O relógio foi usado no álibi?'], 'YES', true),
        truth('father_motive', 'Helena tinha provas ligadas à inocência do pai e aos desvios do hotel.', ['O motivo era o pai de Helena?', 'Helena ia denunciar o hotel?', 'Havia desvio de manutenção?'], 'YES', true),
        truth('forged_note', 'O bilhete de despedida foi forjado para simular uma tentativa de suicídio.', ['Helena tentou se matar?', 'Foi suicídio?', 'O bilhete era verdadeiro?', 'A nota era verdadeira?'], 'NO', true),
        truth('helena_not_unstable', 'Helena estava sob sedativo e havia uma encenação contra ela; isso não prova instabilidade emocional real.', ['Helena estava instável?', 'Helena parecia perturbada?', 'Helena escreveu algo dramático?'], 'PARTIAL')
      ]
    },
    'o-elevador-que-nao-parou': {
      entities: [
        entity('mulher desaparecida', ['mulher', 'ela', 'passageira']),
        entity('elevador', ['cabine']),
        entity('rota de manutenção', ['poço', 'shaft', 'alçapão', 'escotilha'])
      ],
      truths: [
        truth('elevator_stopped_between_floors', 'O elevador parou por alguns minutos entre o segundo e o terceiro andar.', ['O elevador parou?', 'Ele parou entre andares?', 'Ficou parado no meio?', 'O elevador ficou preso?', 'Travou entre andares?'], 'YES', true),
        truth('elevator_trapdoor_unlocked', 'O alçapão do teto do elevador estava destrancado.', ['Ela saiu pelo teto?', 'O alçapão estava aberto?', 'Foi pela escotilha?', 'O alçapão estava destrancado?'], 'YES', true),
        truth('shaft_exit_route', 'A saída ocorreu pela rota de manutenção do poço do elevador.', ['Usou o poço do elevador?', 'Saiu pela rota de manutenção?', 'Ela saiu pelo poço de manutenção?'], 'YES', true),
        truth('elevator_no_floor_exit', 'Ela não saiu por nenhum andar monitorado; a rota foi o poço de manutenção.', ['Ela saiu em algum andar?', 'A porta abriu no andar?', 'Passou pela recepção?'], 'NO', true),
        truth('not_empty_magic', 'O elevador não estava vazio por truque sobrenatural; houve fuga técnica.', ['Foi sobrenatural?', 'Foi magia?', 'Desapareceu por fantasma?'], 'NO'),
        truth('not_vanished', 'A pessoa não evaporou nem desapareceu por magia; ela saiu pela manutenção.', ['Ela evaporou?', 'Ela sumiu por mágica?'], 'NO'),
        truth('cameras_limited', 'As câmeras mostram a cabine e os andares, mas não cobrem a rota de manutenção do poço.', ['As câmeras viram tudo?', 'As câmeras provam que ela desapareceu?', 'A gravação mostra toda a rota?'], 'PARTIAL')
      ]
    },
    'a-mensagem-das-23h17': {
      entities: [
        entity('pessoa desaparecida', ['vitima', 'vítima', 'ela']),
        entity('celular', ['telefone', 'aparelho']),
        entity('computador', ['notebook', 'pc'])
      ],
      truths: [
        truth('message_scheduled_script', 'A mensagem das 23h17 foi enviada por automação agendada.', ['A mensagem foi agendada?', 'Foi script?', 'Foi automática?', 'Foi automação?', 'Foi programada?'], 'YES', true),
        truth('computer_sent_message', 'O computador ligado executou a automação agendada de envio sincronizado.', ['O computador enviou?', 'Foi programada no computador?', 'O notebook disparou a mensagem?'], 'YES', true),
        truth('phone_left_charging', 'O celular ficou em casa no carregador.', ['O celular ficou carregando?'], 'YES', true),
        truth('phone_not_with_victim', 'A pessoa não estava com o celular; ele ficou em casa no carregador.', ['A pessoa estava com o celular?', 'O celular estava com ela?'], 'NO', true),
        truth('message_not_sent_live', 'A pessoa desaparecida saiu antes do envio e não mandou a mensagem na hora.', ['Ela mandou a mensagem na hora?', 'A pessoa enviou na hora?', 'Foi enviada ao vivo?'], 'NO', true),
        truth('victim_left_earlier', 'A pessoa desaparecida saiu voluntariamente antes do envio.', ['Ela saiu voluntariamente?', 'Ela já tinha saído antes?'], 'YES', true),
        truth('phone_presence_red_herring', 'O celular em casa faz parecer presença no local, mas a mensagem foi enviada por automação.', ['O celular em casa prova que ela estava lá?', 'O carregador prova presença?', 'O telefone prova que ela não saiu?'], 'PARTIAL')
      ]
    },
    'o-retrato-que-piscou': {
      entities: [
        entity('garçom', ['garcom', 'funcionario', 'cúmplice', 'cumplice']),
        entity('retrato', ['quadro', 'pintura']),
        entity('joia', ['jóia', 'colar'])
      ],
      truths: [
        truth('portrait_reflection_flash', 'O piscar foi reflexo de um flash no vidro ou verniz do retrato.', ['O retrato piscou por reflexo?', 'Tinha flash?', 'Foi luz no vidro?', 'Foi clarão?', 'O brilho veio do vidro?'], 'YES', true),
        truth('portrait_no_mechanism', 'O retrato não tinha mecanismo interno.', ['O quadro tinha mecanismo?', 'Tinha mecanismo dentro?', 'O retrato se mexeu sozinho?'], 'NO', true),
        truth('portrait_not_supernatural', 'Não houve fenômeno sobrenatural; o efeito veio de luz e reflexo.', ['Era sobrenatural?', 'Foi magia?', 'Tinha fantasma?'], 'NO'),
        truth('waiter_near_jewel', 'O garçom estava junto da mesa no instante do clarão.', ['O garçom roubou a joia?', 'O garçom era cúmplice?', 'O funcionário estava perto da joia?'], 'YES', true),
        truth('temporary_blindness_flash', 'O flash cegou os convidados por poucos segundos.', ['O clarão ajudou o roubo?', 'Todos ficaram cegos?', 'O flash ofuscou os convidados?', 'A joia sumiu durante a cegueira?'], 'YES', true),
        truth('portrait_blink_partial', 'O retrato pareceu piscar, mas o movimento era efeito de luz refletida, não ação do quadro.', ['O retrato piscou de verdade?', 'O quadro se moveu?', 'A pintura piscou sozinha?'], 'PARTIAL')
      ]
    },
    blackwell: {
      entities: [
        entity('Clara Mendes', ['clara']),
        entity('Helena Blackwell', ['helena']),
        entity('Tomás Blackwell', ['tomas', 'tomás']),
        entity('sangue artificial', ['sangue falso', 'mancha'])
      ],
      truths: [
        truth('blackwell_fake_blood', 'O sangue na poltrona era artificial.', ['O sangue era falso?', 'O sangue era artificial?'], 'YES', true),
        truth('blackwell_blood_not_real', 'O sangue na poltrona era artificial, não sangue real.', ['O sangue era real?', 'Era sangue de verdade?'], 'NO', true),
        truth('clara_not_dead_scene', 'Clara não morreu na sala; a cena foi montada com sangue artificial.', ['Clara morreu na sala?', 'Clara foi assassinada?', 'Houve morte na sala?'], 'NO', true),
        truth('clara_helena_escape', 'Clara e Helena fugiram juntas pelos jardins.', ['Clara fugiu com Helena?', 'Elas saíram pelo jardim?', 'Clara saiu com Helena?'], 'YES', true),
        truth('tomas_financial_fraud', 'O livro-caixa indica desvio de fundos por Tomás.', ['Tomás desviava dinheiro?', 'O livro-caixa incrimina Tomás?', 'Havia fraude financeira?', 'Tomás desviava fundos?'], 'YES', true),
        truth('blackwell_kidnapping_not_real', 'O sequestro não foi real; o sumiço foi encenado para expor os desvios.', ['Foi sequestro real?', 'Clara foi sequestrada de verdade?', 'O sequestro aconteceu mesmo?'], 'NO', true),
        truth('staged_kidnapping', 'O sumiço foi encenado para expor os desvios.', ['O sequestro foi encenado?', 'Foi uma armação?', 'O sumiço foi armado?'], 'YES', true),
        truth('tomas_red_herring_partial', 'Tomás está ligado aos desvios financeiros, mas isso não prova que ele sequestrou Clara.', ['Tomás sequestrou Clara?', 'Tomás fez o sumiço?', 'Tomás é o sequestrador?'], 'PARTIAL')
      ]
    },
    'a-heranca-de-vidro': {
      entities: [
        entity('Isadora Vale', ['isadora', 'herdeira', 'restauradora']),
        entity('Augusto Alvarenga', ['augusto', 'tio', 'administrador']),
        entity('Cecília Alvarenga', ['cecilia', 'cecília', 'prima']),
        entity('conservatório', ['conservatorio', 'sala de vidro'])
      ],
      truths: [
        truth('testament_change', 'Isadora pretendia alterar o testamento e retirar Augusto da gestão da fundação.', ['Augusto desviava dinheiro da fundação?', 'O motivo era impedir a auditoria?', 'Isadora ia mudar o testamento?', 'A fundação era o motivo?'], 'YES', true),
        truth('fake_receipts', 'Os recibos de restauração eram falsos e beneficiavam empresas ligadas a Augusto.', ['Havia recibos falsos?', 'Os recibos de restauração eram falsos?', 'As empresas eram ligadas a Augusto?'], 'YES', true),
        truth('digitalis_wine', 'A taça de Isadora continha traços de digitalina misturados ao vinho.', ['Isadora foi envenenada pelo vinho?', 'A taça tinha digitalina?', 'A bebida tinha remédio cardíaco?', 'O vinho estava adulterado?'], 'YES', true),
        truth('augusto_administered_wine', 'Augusto foi a última pessoa confirmada a servir vinho a Isadora.', ['Augusto serviu vinho?', 'Quem serviu a bebida?', 'Augusto deu a taça?'], 'YES', true),
        truth('clock_fast', 'O relógio do conservatório estava adiantado em 18 minutos, criando o horário falso de 22h46 para combinar com a chamada de Augusto.', ['O relógio estava adiantado?', 'O relógio foi mexido?', 'O horário 22h46 era falso?'], 'YES', true),
        truth('false_time', 'A hora de 22h46 foi usada para deslocar a morte para o período da chamada de vídeo de Augusto.', ['A hora da morte foi falsificada?', 'A chamada de vídeo era álibi falso?', '22h46 era horário falso?'], 'YES', true),
        truth('restoration_thread', 'Um fio de restauração passou pela fresta inferior da porta e deixou fibras presas na grelha de drenagem.', ['A porta foi trancada com um fio?', 'Usaram linha para fechar a porta?', 'O fio saiu pela drenagem?'], 'YES', true),
        truth('locked_room_trick', 'A porta foi trancada por dentro usando o fio, que depois foi puxado para fora pela drenagem.', ['A sala trancada era encenação?', 'O conservatório era impossível?', 'A porta realmente ficou impossível?'], 'YES', true),
        truth('glass_staged', 'O vidro do teto foi fragilizado antes da tempestade para parecer a causa do acidente.', ['O vidro quebrado foi armado?', 'O teto foi preparado antes?', 'O vidro era pista falsa?'], 'YES', true),
        truth('storm_not_cause', 'A tempestade reforçou a cena, mas não foi a causa real da morte de Isadora.', ['A tempestade matou Isadora?', 'Ela morreu por causa do vidro?', 'Foi acidente da tempestade?'], 'NO', true),
        truth('dry_footprints', 'As marcas de sapato ao lado do corpo estavam secas sob a camada posterior de água da chuva.', ['As pegadas estavam secas?', 'As marcas foram feitas antes da chuva?', 'A cena foi montada antes?'], 'YES', true),
        truth('cecilia_not_responsible', 'Cecília discutiu com Isadora, mas saiu antes do vinho ser servido e não tinha acesso ao fio de restauração.', ['Cecília matou Isadora?', 'A prima matou Isadora?', 'Cecília é a culpada?', 'Cecília causou a morte?'], 'NO'),
        truth('medical_red_herring_partial', 'O remédio de Isadora era real, mas não explica a morte sem a digitalina misturada ao vinho.', ['O remédio de Isadora causou a morte?', 'O frasco cardíaco era importante?', 'O medicamento explica tudo?'], 'PARTIAL')
      ]
    },
    'o-sino-das-tres-batidas': {
      entities: [
        entity('Lúcia Ferraz', ['lucia', 'lúcia', 'presidente do conselho']),
        entity('Elias', ['zelador']),
        entity('torre do sino', ['torre', 'sino']),
        entity('arquivo morto', ['arquivo'])
      ],
      truths: [
        truth('tower_dust_intact', 'A poeira na fechadura e no batente da torre estava intacta; ninguém abriu a porta naquela noite.', ['Alguém entrou na torre?', 'A poeira da torre foi mexida?', 'A porta da torre foi aberta?'], 'NO', true),
        truth('bell_not_inside_tower', 'O sino não foi tocado por alguém dentro da torre; a fibra no badalo aponta para acionamento externo.', ['O sino foi tocado de dentro da torre?', 'Alguém tocou o sino lá dentro?'], 'NO', true),
        truth('transparent_line', 'Uma fibra transparente ficou presa no badalo do sino.', ['Tinha linha de pesca no badalo?', 'Tinha fibra transparente no sino?', 'A fibra no badalo importa?'], 'YES', true),
        truth('archive_conduit', 'Um conduíte antigo ligava o arquivo à torre, e a fibra no badalo permitia acionar o sino à distância.', ['O conduíte liga o arquivo à torre?', 'Dava para tocar o sino à distância?', 'O sino podia ser acionado à distância?', 'O arquivo se ligava à torre?'], 'YES', true),
        truth('forged_sale_docs', 'A pasta da venda continha assinaturas copiadas de atas antigas.', ['Havia documentos falsos?', 'A pasta tinha assinaturas copiadas?', 'Elias descobriu uma fraude?'], 'YES', true),
        truth('lucia_controlled_docs', 'Lúcia era a responsável por guardar e apresentar os documentos da venda.', ['Lúcia foi responsável?', 'Quem controlava os documentos?', 'Lúcia tinha motivo?', 'A presidente do conselho tinha motivo?'], 'YES', true),
        truth('sale_motive', 'O motivo estava ligado à pasta da venda fraudulenta da escola, com assinaturas copiadas.', ['O motivo era a venda da escola?', 'Queriam vender a escola?', 'A venda era fraudulenta?'], 'YES', true),
        truth('side_stair_fall', 'As marcas de impacto indicam queda da escada lateral do arquivo, não da torre.', ['Elias caiu da torre?', 'Ele despencou da torre?', 'A queda foi da torre?'], 'NO', true),
        truth('fall_location', 'A queda ocorreu na escada lateral do arquivo.', ['O corpo veio da escada do arquivo?', 'A queda foi na escada lateral?', 'Elias caiu no arquivo?'], 'YES', true),
        truth('key_staging', 'A chave no bolso de Elias não prova entrada na torre; ela estava ali para sustentar a falsa cena.', ['A chave era encenação?', 'A chave no bolso era pista falsa?', 'A chave prova que ele entrou?'], 'YES', true),
        truth('marina_protest_partial', 'Os protestos de Marina explicam barulho no portão, mas não o acionamento do sino nem a queda de Elias.', ['Marina está envolvida?', 'Os protestos explicam o sino?', 'O barulho do portão incrimina Marina?'], 'PARTIAL')
      ]
    },
    'a-fita-sem-rosto': {
      entities: [
        entity('Bruno Tavares', ['bruno', 'coordenador técnico']),
        entity('Inae Moura', ['inae', 'bioquimica', 'bioquímica']),
        entity('protótipo', ['prototipo', 'bateria']),
        entity('câmera virtual', ['camera virtual', 'vídeo gravado', 'video gravado'])
      ],
      truths: [
        truth('virtual_camera_log', 'O notebook de Bruno registrou uso de câmera virtual entre 22h06 e 22h19.', ['A videoconferência era falsa?', 'Bruno usou vídeo gravado?', 'Bruno usou câmera virtual?', 'O álibi digital dele falha?'], 'YES', true),
        truth('repeated_audio_delay', 'A fala de Bruno na chamada repetia o mesmo atraso de milissegundos em dois trechos.', ['A chamada tinha atraso repetido?', 'O áudio repetia atraso?', 'O vídeo era gravação?'], 'YES', true),
        truth('manual_token', 'Um token manual de manutenção gerou a senha temporária do cofre emitida por Bruno às 22h11.', ['O token foi emitido manualmente?', 'O token era de manutenção?', 'A senha temporária era de manutenção?', 'Bruno emitiu o token?'], 'YES', true),
        truth('prototype_access', 'O cofre exigia cartão e senha temporária, ambos dentro das permissões de Bruno.', ['Bruno tinha acesso ao cofre?', 'Quem podia abrir o cofre?', 'A senha temporária era dele?'], 'YES', true),
        truth('reflective_mask', 'Fragmentos de filme reflexivo foram encontrados na lixeira técnica.', ['O invasor usou máscara reflexiva?', 'Foi máscara reflexiva?', 'Havia filme reflexivo?'], 'YES', true),
        truth('face_overexposed', 'A câmera do corredor não falhou; a exposição foi saturada por material reflexivo.', ['A câmera do corredor falhou?', 'O rosto foi apagado por luz?', 'A exposição apagou o rosto?', 'Por que o rosto não aparece?'], 'YES', true),
        truth('service_stairs', 'A escada de serviço permitia sair da sala de Bruno sem passar pela recepção.', ['Saiu pela escada de serviço?', 'Ele passou pela recepção?', 'Bruno saiu por rota interna?'], 'YES', true),
        truth('debt_motive', 'Bruno acumulava dívidas e recebeu contato de uma concorrente dias antes.', ['Bruno tinha dívida?', 'Bruno tinha motivo financeiro?', 'Ele queria vender o protótipo para concorrente?', 'Havia contato com concorrente?'], 'YES', true),
        truth('inae_not_thief', 'Inae tinha conflito de autoria, mas permaneceu em câmera real durante todo o intervalo crítico.', ['Inae roubou o protótipo?', 'A bioquímica pegou a bateria?', 'Inae era a invasora?', 'Inae sumiu com o protótipo?'], 'NO'),
        truth('sara_server_partial', 'Sara esteve na sala de servidores antes do roubo, mas isso se liga a uma impressora de etiquetas, não ao cofre.', ['Sara estava envolvida?', 'A estagiária entrou na sala de servidores?', 'Sara ajudou no roubo?'], 'PARTIAL')
      ]
    }
  };

  return matrices[slug] || null;
};

export const buildStaticContextFromMatrix = (matrix: CaseTruthMatrix | null) => {
  if (!matrix) return { facts: [], rules: [] };
  return {
    facts: matrix.truths.map(({ fact_key, statement, is_solution_critical }) => ({ fact_key, statement, is_solution_critical })),
    rules: matrix.truths.map(({ fact_key, examples, verdict }) => staticRule(fact_key, examples, [fact_key], verdict))
  };
};

export const getStaticCaseContext = (slug: string) => {
  const matrixContext = buildStaticContextFromMatrix(getCaseTruthMatrix(slug));
  if (matrixContext.facts.length > 0) return matrixContext;

  const context: Record<string, { facts: Array<{ fact_key: string; statement: string; is_solution_critical?: boolean }>; rules: any[] }> = {
    'o-presente-desaparecido': {
      facts: [
        { fact_key: 'empty_box_before_party', statement: 'A caixa já estava vazia antes do desaparecimento.' },
        { fact_key: 'folded_under_tablecloth', statement: 'A embalagem foi dobrada e escondida sob a toalha.' },
        { fact_key: 'host_staged_game', statement: 'O anfitrião encenou o sumiço para iniciar uma caça ao tesouro.' },
        { fact_key: 'real_present_elsewhere', statement: 'O presente real estava escondido em outro lugar da casa.' },
        { fact_key: 'nobody_left_room', statement: 'Ninguém precisou sair do ambiente para a caixa desaparecer.' },
        { fact_key: 'present_not_stolen', statement: 'Ninguém roubou o presente; o sumiço foi uma encenação planejada.' }
      ],
      rules: [
        staticRule('present_empty', ['A caixa estava vazia?', 'O presente estava dentro da caixa?', 'Tinha algo na caixa?'], ['empty_box_before_party'], 'YES'),
        staticRule('present_staged', ['Foi encenação?', 'O anfitrião planejou?', 'Era uma brincadeira?', 'Era pegadinha?', 'Foi caça ao tesouro?'], ['host_staged_game'], 'YES'),
        staticRule('present_hidden', ['O presente estava em outro lugar?', 'A caixa foi escondida na mesa?', 'Estava debaixo da toalha?', 'A embalagem ficou sob a toalha?'], ['real_present_elsewhere', 'folded_under_tablecloth'], 'YES'),
        staticRule('present_not_stolen', ['Alguém roubou o presente?', 'Foi roubo?', 'O presente foi furtado?', 'Alguém levou o presente?'], ['present_not_stolen'], 'NO')
      ]
    },
    'o-quarto-7': {
      facts: [
        { fact_key: 'renato_master_key', statement: 'Renato usou a chave mestra para encenar o quarto trancado.' },
        { fact_key: 'tea_sedative', statement: 'O chá de Helena continha sedativo não letal.' },
        { fact_key: 'camera_service_stairs', statement: 'A câmera foi virada para ocultar a rota pela escada de serviço.' },
        { fact_key: 'clock_false_time', statement: 'O relógio quebrado em 23h17 criou uma hora falsa.' },
        { fact_key: 'father_motive', statement: 'Helena tinha provas ligadas à inocência do pai e aos desvios do hotel.' },
        { fact_key: 'forged_note', statement: 'O bilhete de despedida foi forjado para simular uma tentativa de suicídio.' },
        { fact_key: 'door_not_forced', statement: 'A porta não foi arrombada; Renato usou uma chave mestra.' }
      ],
      rules: [
        staticRule('room_locked_staged', ['A porta foi trancada por dentro?', 'Renato usou chave mestra?', 'O quarto trancado era falso?', 'Renato é o responsável?', 'Renato é culpado?'], ['renato_master_key', 'father_motive'], 'YES'),
        staticRule('door_not_forced', ['A porta foi arrombada?', 'A porta foi forçada?', 'A fechadura foi quebrada?'], ['door_not_forced'], 'NO'),
        staticRule('tea_sedative', ['O chá tinha sedativo?', 'A bebida tinha sedativo?', 'Helena foi drogada?', 'A bebida foi adulterada?'], ['tea_sedative'], 'YES'),
        staticRule('camera_clock', ['A câmera foi mexida?', 'O relógio marcava hora falsa?', 'A escada de serviço importa?'], ['camera_service_stairs', 'clock_false_time'], 'YES'),
        staticRule('helena_motive', ['O motivo era o pai de Helena?', 'Helena ia denunciar o hotel?', 'Havia desvio de manutenção?'], ['father_motive'], 'YES'),
        staticRule('forged_note', ['Helena tentou se matar?', 'Foi suicídio?', 'O bilhete era verdadeiro?', 'A nota era verdadeira?'], ['forged_note'], 'NO')
      ]
    },
    'o-elevador-que-nao-parou': {
      facts: [
        { fact_key: 'elevator_stopped_between_floors', statement: 'O elevador parou por alguns minutos entre o segundo e o terceiro andar.' },
        { fact_key: 'elevator_trapdoor_unlocked', statement: 'O alçapão do teto do elevador estava destrancado.' },
        { fact_key: 'shaft_exit_route', statement: 'A saída ocorreu pela rota de manutenção do poço do elevador.' },
        { fact_key: 'not_empty_magic', statement: 'O elevador não estava vazio por truque sobrenatural; houve fuga técnica.' },
        { fact_key: 'not_vanished', statement: 'A pessoa não evaporou nem desapareceu por magia; ela saiu pela manutenção.' }
      ],
      rules: [
        staticRule('elevator_stopped', ['O elevador parou?', 'Ele parou entre andares?', 'Ficou parado no meio?', 'O elevador ficou preso?', 'Travou entre andares?'], ['elevator_stopped_between_floors'], 'YES'),
        staticRule('elevator_trapdoor', ['Ela saiu pelo teto?', 'O alçapão estava aberto?', 'Usou o poço do elevador?', 'Foi pela escotilha?', 'Saiu pela rota de manutenção?'], ['elevator_trapdoor_unlocked', 'shaft_exit_route'], 'YES'),
        staticRule('elevator_no_floor_exit', ['Ela saiu em algum andar?', 'A porta abriu no andar?', 'Passou pela recepção?'], ['shaft_exit_route'], 'NO'),
        staticRule('elevator_not_magic', ['Ela evaporou?', 'Foi sobrenatural?', 'Foi magia?', 'Desapareceu por fantasma?'], ['not_vanished', 'not_empty_magic'], 'NO')
      ]
    },
    'a-mensagem-das-23h17': {
      facts: [
        { fact_key: 'message_scheduled_script', statement: 'A mensagem das 23h17 foi enviada por automação agendada.' },
        { fact_key: 'phone_left_charging', statement: 'O celular ficou em casa no carregador.' },
        { fact_key: 'victim_left_earlier', statement: 'A pessoa desaparecida saiu voluntariamente antes do envio e não mandou a mensagem na hora.' },
        { fact_key: 'computer_sent_message', statement: 'O computador ligado executou o envio sincronizado.' }
      ],
      rules: [
        staticRule('message_scheduled', ['A mensagem foi agendada?', 'Foi script?', 'O computador enviou?', 'Foi automática?', 'Foi automação?', 'Foi programada?'], ['message_scheduled_script', 'computer_sent_message'], 'YES'),
        staticRule('message_not_sent_live', ['Ela mandou a mensagem na hora?', 'A pessoa enviou na hora?', 'Foi enviada ao vivo?'], ['victim_left_earlier', 'message_scheduled_script'], 'NO'),
        staticRule('phone_not_used_live', ['O celular enviou sozinho?', 'A pessoa estava com o celular?', 'O celular ficou carregando?'], ['phone_left_charging', 'victim_left_earlier'], 'NO'),
        staticRule('voluntary_disappearance', ['Ela saiu voluntariamente?', 'Foi sumiço planejado?', 'Ela já tinha saído antes?'], ['victim_left_earlier'], 'YES')
      ]
    },
    'o-retrato-que-piscou': {
      facts: [
        { fact_key: 'portrait_reflection_flash', statement: 'O piscar foi reflexo de um flash no vidro ou verniz do retrato.' },
        { fact_key: 'portrait_no_mechanism', statement: 'O retrato não tinha mecanismo interno.' },
        { fact_key: 'portrait_not_supernatural', statement: 'Não houve fenômeno sobrenatural; o efeito veio de luz e reflexo.' },
        { fact_key: 'waiter_near_jewel', statement: 'O garçom estava junto da mesa no instante do clarão.' },
        { fact_key: 'temporary_blindness_flash', statement: 'O flash cegou os convidados por poucos segundos.' }
      ],
      rules: [
        staticRule('portrait_flash', ['O retrato piscou por reflexo?', 'Tinha flash?', 'Foi luz no vidro?', 'Foi clarão?', 'O brilho veio do vidro?'], ['portrait_reflection_flash'], 'YES'),
        staticRule('portrait_no_mechanism', ['O quadro tinha mecanismo?', 'Era sobrenatural?', 'Foi magia?', 'Tinha fantasma?', 'O retrato se mexeu sozinho?'], ['portrait_no_mechanism', 'portrait_not_supernatural'], 'NO'),
        staticRule('jewel_waiter', ['O garçom roubou a joia?', 'O clarão ajudou o roubo?', 'Todos ficaram cegos?', 'O flash ofuscou os convidados?', 'A joia sumiu durante a cegueira?'], ['waiter_near_jewel', 'temporary_blindness_flash'], 'YES')
      ]
    },
    blackwell: {
      facts: [
        { fact_key: 'blackwell_fake_blood', statement: 'O sangue na poltrona era artificial.' },
        { fact_key: 'clara_not_dead_scene', statement: 'Clara não morreu na sala; a cena foi montada com sangue artificial.' },
        { fact_key: 'clara_helena_escape', statement: 'Clara e Helena fugiram juntas pelos jardins.' },
        { fact_key: 'tomas_financial_fraud', statement: 'O livro-caixa indica desvio de fundos por Tomás.' },
        { fact_key: 'staged_kidnapping', statement: 'O sumiço foi encenado para expor os desvios.' }
      ],
      rules: [
        staticRule('blackwell_blood_fake', ['O sangue era falso?', 'O sangue era artificial?'], ['blackwell_fake_blood'], 'YES'),
        staticRule('blackwell_blood_not_real', ['O sangue era real?', 'Era sangue de verdade?'], ['blackwell_fake_blood'], 'NO'),
        staticRule('blackwell_clara_not_dead', ['Clara morreu na sala?', 'Clara foi assassinada?', 'Houve morte na sala?'], ['clara_not_dead_scene'], 'NO'),
        staticRule('blackwell_escape', ['Clara fugiu com Helena?', 'Elas saíram pelo jardim?', 'Clara saiu com Helena?'], ['clara_helena_escape', 'staged_kidnapping'], 'YES'),
        staticRule('blackwell_real_kidnapping', ['Foi sequestro real?', 'Clara foi sequestrada de verdade?', 'O sequestro aconteceu mesmo?'], ['staged_kidnapping'], 'NO'),
        staticRule('blackwell_tomas', ['Tomás desviava dinheiro?', 'O livro-caixa incrimina Tomás?', 'Havia fraude financeira?'], ['tomas_financial_fraud'], 'YES')
      ]
    }
  };

  return context[slug] || { facts: [], rules: [] };
};

export const processFactBasedQuestion = (questionText: string, facts: Array<{ statement: string }>, opening = '') => {
  const questionWords = new Set(tokenizeForMatching(questionText));
  const exactQuestionWords = new Set(baseTokensForMatching(questionText));
  if (questionWords.size === 0) return null;

  let bestMatch: { score: number; exactOverlap: number; statement: string } | null = null;
  for (const fact of facts) {
    const factWords = new Set(tokenizeForMatching(fact.statement || ''));
    const exactFactWords = new Set(baseTokensForMatching(fact.statement || ''));
    if (factWords.size === 0) continue;
    const overlap = [...questionWords].filter((word) => factWords.has(word)).length;
    const exactOverlap = [...exactQuestionWords].filter((word) => exactFactWords.has(word)).length;
    const score = overlap / Math.max(1, Math.min(questionWords.size, factWords.size)) + exactOverlap * 0.2;
    if (overlap >= 2 && (!bestMatch || exactOverlap > bestMatch.exactOverlap || (exactOverlap === bestMatch.exactOverlap && score > bestMatch.score))) {
      bestMatch = { score, exactOverlap, statement: fact.statement || '' };
    }
  }

  if (bestMatch && bestMatch.score >= 0.34) return buildFactBasedAnswer('YES', bestMatch.statement);

  const caseVocabulary = new Set(tokenizeForMatching(`${opening} ${facts.map((fact) => fact.statement).join(' ')}`));
  const relevantWords = [...questionWords].filter((word) => caseVocabulary.has(word));
  if (relevantWords.length > 0) return buildFactBasedAnswer('UNKNOWN');

  return null;
};

const safeJsonParse = (value: string | null | undefined, fallback: any = null) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const formatContextBlock = (title: string, lines: string[]) => {
  const content = lines.filter(Boolean).join('\n');
  return `${title}:\n${content || '- Não cadastrado.'}`;
};

const formatChronology = (chronologyText: string) => {
  const chronology = safeJsonParse(chronologyText, []);
  if (!Array.isArray(chronology) || chronology.length === 0) return ['- Não cadastrada.'];
  return chronology.map((entry: any) => {
    const time = entry.time ? `${entry.time}: ` : '';
    return `- ${time}${entry.event || entry.description || JSON.stringify(entry)}`;
  });
};

const formatMasterStyle = (masterStyleText: string | null | undefined) => {
  const style = safeJsonParse(masterStyleText, {});
  if (!style || typeof style !== 'object') return ['- Tom investigativo, respostas curtas.'];
  return Object.entries(style).map(([key, value]) => `- ${key}: ${String(value)}`);
};

export const buildMasterPrompt = ({
  caseTitle,
  caseSynopsis,
  caseType,
  caseDifficulty,
  caseOpening,
  masterStyle,
  solutionSummary,
  chronology,
  facts,
  answerRules,
  hints,
  solutionFields,
  questionText
}: {
  caseTitle: string;
  caseSynopsis: string;
  caseType: string;
  caseDifficulty: string;
  caseOpening: string;
  masterStyle: string;
  solutionSummary: string;
  chronology: string;
  facts: Array<{ fact_key?: string; statement: string; is_solution_critical?: boolean }>;
  answerRules: any[];
  hints: Array<{ hint_index: number; content: string; penalty_points?: number }>;
  solutionFields: Array<{ field_key: string; label: string; is_required: boolean }>;
  questionText: string;
}) => {
  const factListText = facts.map((fact: any) => {
    const critical = fact.is_solution_critical ? 'essencial' : 'apoio';
    return `- [${fact.fact_key || 'fato'} | ${critical}] ${fact.statement}`;
  });
  const answerRulesText = answerRules.length
    ? answerRules.map((rule: any) => {
      const examples = safeJsonParse(rule.semantic_examples, []).join('; ');
      const factKeys = safeJsonParse(rule.related_fact_keys, []).join(', ');
      return `- ${rule.intent_key}: classifique como ${rule.default_classification}; exemplos: ${examples}; fatos relacionados: ${factKeys}`;
    })
    : ['- Nenhuma regra semântica específica cadastrada para este caso.'];
  const hintsText = hints.length
    ? hints.map((hint) => `- Pista ${hint.hint_index}: ${hint.content}${hint.penalty_points ? ` (-${hint.penalty_points} pts)` : ''}`)
    : ['- Nenhuma pista cadastrada.'];
  const fieldsText = solutionFields.length
    ? solutionFields.map((field) => `- ${field.field_key}: ${field.label}${field.is_required ? ' (obrigatório)' : ''}`)
    : ['- Usar os campos padrão: o que aconteceu, quem, como e por quê.'];

  return `Você atua como o Mestre IA (árbitro) de um jogo de investigação.
Sua função é interpretar a pergunta do jogador e validar se ele descobriu algo.
Responda SEMPRE em português do Brasil (pt-BR).

${formatContextBlock('Contexto Narrativo do Caso', [
  `- Título: ${caseTitle}`,
  `- Tipo: ${caseType}`,
  `- Dificuldade: ${caseDifficulty}`,
  `- Sinopse: ${caseSynopsis}`,
  `- Abertura apresentada aos jogadores: ${caseOpening}`
])}

${formatContextBlock('Estilo do Mestre', formatMasterStyle(masterStyle))}

Resumo da Solução e Regras Especiais de Desbloqueio:
${solutionSummary}

${formatContextBlock('Cronologia Privada do Caso', formatChronology(chronology))}

${formatContextBlock('Fatos Absolutos do Caso', factListText)}

${formatContextBlock('Pistas Cadastradas', hintsText)}

${formatContextBlock('Campos da Solução Final', fieldsText)}

${formatContextBlock('Regras Semânticas de Descoberta', answerRulesText)}

Regras ESTRITAS:
1. Responda apenas "Sim", "Não", "Parcialmente", "Irrelevante" ou "Desconhecido".
2. Use todo o contexto privado acima para entender intenção, cronologia, suspeitos, pistas e causa real, mas não transforme esse contexto em dica gratuita.
3. Não revele detalhes na \`publicExplanation\`. Confirme apenas a parte exata perguntada, sem listar outros fatos relacionados, nomes novos, método completo, motivo completo ou cronologia completa.
4. Se a pergunta estiver perto da solução, responda de forma curta e ainda investigativa. Não entregue a solução de bandeja.
5. Se a pergunta demonstrar que o jogador investigou corretamente um hotspot ou desvendou uma etapa, defina \`unlockClue\` como true e indique a \`clueIdToUnlock\` ou \`locationId\` apropriada conforme o gabarito das regras especiais.
6. Se a pergunta for vaga, ampla ou não puder ser confirmada pelo contexto do caso, use "Desconhecido" em vez de inventar uma confirmação.
7. Responda em uma única frase curta. Não explique além do necessário.

Pergunta do Jogador: "${questionText}"`;
};

const isTooAmbiguousForPlay = (questionText: string) => {
  const questionWords = tokenizeForMatching(questionText);
  return questionWords.length <= 1;
};

export const toConciseMasterText = (shortAnswer: string, publicExplanation = '') => {
  const text = `${String(shortAnswer || '').trim()} ${String(publicExplanation || '').trim()}`
    .replace(/\s+/g, ' ')
    .trim();
  const sentences = text.match(/[^.!?]+[.!?]+/g)?.map((sentence) => sentence.trim()) || [];
  const first = sentences[0] || text || 'Desconhecido.';
  const firstIsVerdict = /^(Sim|Não|Parcialmente|Irrelevante|Desconhecido)\.$/i.test(first);
  const concise = firstIsVerdict && sentences[1] ? `${first} ${sentences[1]}` : first;
  return concise.slice(0, 180).trim();
};

export const processTutorialQuestion = (questionText: string) => {
  const question = normalizeText(questionText);
  const questionWithoutUmbrellaTerm = question.replace(/guarda[\s-]?chuva/g, 'guarda objeto');
  const hasAny = (words: string[]) => words.some((word) => question.includes(word));
  const hasAnyOutsideUmbrellaTerm = (words: string[]) => words.some((word) => questionWithoutUmbrellaTerm.includes(word));
  const mentionsUmbrella = question.includes('guarda-chuva') || question.includes('guarda chuva');
  const mentionsProtection = hasAny(['protegia', 'proteger', 'protegeu', 'proteção', 'protecao', 'cobria', 'cobrir']);
  const mentionsWeatherOutsideUmbrellaTerm = hasAnyOutsideUmbrellaTerm(['choveu', 'chuva', 'temporal', 'ceu', 'clima', 'tempo']);
  const mentionsInternalPlace = hasAny(['predio', 'sala', 'interno', 'interna', 'dentro']);
  const mentionsPerson = hasAny(['pessoa', 'alguem', 'morador', 'funcionario', 'homem', 'mulher']);
  const mentionsEntering = hasAny(['entrou', 'entrar', 'entrada']);
  const mentionsUsing = hasAny(['usou', 'abriu', 'usar', 'abrir']);

  if (question.includes('ceu') && question.includes('limpo')) {
    return {
      classification: 'YES',
      rendered_text: 'Sim. O céu estava limpo, então a água não veio da chuva.',
      fallback_used: false
    };
  }

  if (mentionsUmbrella && mentionsProtection && mentionsWeatherOutsideUmbrellaTerm) {
    return {
      classification: 'NO',
      rendered_text: 'Não. A proteção não era contra chuva.',
      fallback_used: false
    };
  }

  if (mentionsUmbrella && mentionsProtection) {
    return {
      classification: 'YES',
      rendered_text: 'Sim. O guarda-chuva protegia uma pessoa de água dentro do prédio.',
      fallback_used: false
    };
  }

  if (mentionsUmbrella && (mentionsInternalPlace || mentionsUsing)) {
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

  if (mentionsWeatherOutsideUmbrellaTerm) {
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

  if (mentionsPerson && mentionsEntering && mentionsInternalPlace) {
    return {
      classification: 'YES',
      rendered_text: 'Sim. A pessoa entrou em uma sala interna do prédio.',
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

export const processGardenQuestion = (questionText: string) => {
  const question = normalizeText(questionText);
  const questionTokens = new Set(tokenizeForMatching(question));
  const hasAny = (words: string[]) => words.some((word) => {
    const normalizedTerm = normalizeText(word);
    if (question.includes(normalizedTerm)) return true;
    return tokenizeForMatching(normalizedTerm).some((token) => questionTokens.has(token));
  });
  const asksAbout = (terms: string[]) => hasAny(terms);
  const asksExistence = asksAbout(['tinha', 'havia', 'existia', 'existiam', 'estava', 'estavam', 'tem']);
  const asksRelationship = asksAbout(['relacao', 'relação', 'envolvido', 'envolvida', 'culpa', 'culpado', 'responsavel', 'responsável', 'tem haver', 'tem a ver', 'ligado', 'ligada']);
  const asksRivalry = asksAbout(['rival', 'rivalidade', 'competia', 'inimiga', 'inimizade']);
  const asksMotive = asksAbout(['motivo', 'motivacao', 'motivação', 'porque', 'por que', 'vender', 'vendas', 'falsa', 'falsas', 'falso', 'denunciar']);
  const asksDisappearance = asksAbout(['desapareceu', 'desaparecer', 'sumiu', 'sumir', 'desaparecimento']);
  const asksExit = asksAbout(['fugiu', 'fuga', 'escapou', 'saiu', 'deixou', 'foi embora', 'voluntariamente', 'sozinha', 'sozinho', 'propria']);
  const asksMethod = asksAbout(['como', 'retirada', 'retirado', 'levada', 'levado', 'removeu', 'carregada', 'rota', 'caminho', 'saiu']);
  const asksEvidence = asksAbout(['pista', 'prova', 'indicio', 'indício', 'evidencia', 'evidência', 'importa', 'relevante', 'vestigio', 'vestígio']);
  const asksLeftEvidence = asksEvidence && asksAbout(['deixou', 'deixar', 'deixada', 'deixado', 'restou', 'sobrou']);
  const asksTransport = asksAbout(['transportou', 'transportar', 'moveu', 'mover', 'removeu', 'retirou', 'retirar', 'levou', 'carregou', 'carregar']);
  const asksLifeState = asksAbout(['viva', 'vivo', 'morta', 'morto', 'morreu', 'sobreviveu', 'sobrevivente']);
  const asksConsciousState = asksAbout(['acordada', 'acordado', 'consciente', 'inconsciente', 'desmaiada', 'desmaiado', 'sedada', 'sedado', 'dopada', 'dopado']);
  const asksCleaningProduct = asksAbout(['limpeza', 'desinfetante', 'detergente', 'sabao', 'sabão', 'alcool', 'álcool', 'higienizacao', 'higienização']);
  const asksProtection = asksAbout(['protegia', 'proteger', 'protegeu', 'protecao', 'proteção', 'cobria', 'cobrir', 'cobertura']);
  const asksOrigin = asksAbout(['era de', 'eram de', 'de nina', 'da nina', 'dela', 'pertencia', 'pertenciam', 'origem', 'dna', 'sangue', 'fio de cabelo', 'cabelo', 'biologico', 'biológico']);
  const asksForgery = asksAbout(['falsificada', 'falsificadas', 'falsificado', 'falsificados', 'falsa', 'falsas', 'falso', 'falsos']);
  const asksIntentional = asksAbout(['proposital', 'intencional', 'intencionalmente', 'planejado', 'planejada', 'armado', 'armada']);

  const entities = {
    nina: asksAbout(['nina', 'escultora', 'ela']),
    dario: asksAbout(['dario', 'curador', 'contratou', 'contratante', 'organizou', 'organizador', 'exposicao']),
    celina: asksAbout(['celina', 'paisagista']),
    tomas: asksAbout(['tomas', 'irmao', 'irmão']),
    vitor: asksAbout(['vitor', 'vítor', 'colecionador']),
    gardener: asksAbout(['jardineiro', 'jardineiros', 'jardinagem', 'equipe de jardinagem']),
    garden: asksAbout(['jardim', 'labirinto', 'centro']),
    footprints: asksAbout(['pegada', 'pegadas', 'barro', 'lama']),
    tracks: asksAbout(['trilho', 'trilhos', 'drenagem', 'cascalho']),
    cart: asksAbout(['carrinho', 'carrinho de manutencao', 'manutencao']),
    statue: asksAbout(['estatua', 'escultura', 'obra']),
    shears: asksAbout(['tesoura', 'poda']),
    lona: asksAbout(['lona', 'tecido', 'fibra', 'fibras']),
    chemical: asksAbout(['spray', 'anestesico', 'anestésico', 'produto', 'quimico', 'químico', 'odor', 'cheiro']),
    lights: asksAbout(['luz', 'luzes', 'iluminacao', 'iluminação', 'apagou', 'apagada', 'desligar', 'desligou'])
  };

  const mentionsAnySuspect = entities.dario || entities.celina || entities.tomas || entities.vitor || entities.gardener;

  if (entities.nina && asksLifeState) {
    return {
      classification: 'UNKNOWN',
      rendered_text: 'Desconhecido. O arquivo confirma o desaparecimento de Nina, mas não confirma o estado dela.',
      fallback_used: false
    };
  }

  if (entities.nina && asksConsciousState) {
    return {
      classification: 'UNKNOWN',
      rendered_text: 'Desconhecido. Há indício de anestésico na cena, mas o arquivo não confirma o estado de consciência de Nina.',
      fallback_used: false
    };
  }

  if (entities.nina && asksAbout(['humana', 'humano', 'pessoa', 'mulher', 'existia'])) {
    return {
      classification: 'YES',
      rendered_text: 'Sim. Nina é uma pessoa, a escultora desaparecida.',
      fallback_used: false
    };
  }

  if (asksMotive && asksForgery && asksDisappearance) {
    return {
      classification: 'YES',
      rendered_text: 'Sim. A descoberta das obras falsas foi o motivo do desaparecimento de Nina.',
      fallback_used: false
    };
  }

  if (entities.nina && asksForgery) {
    return {
      classification: 'YES',
      rendered_text: 'Sim. Nina descobriu vendas de obras falsas atribuídas a ela.',
      fallback_used: false
    };
  }

  if (entities.tomas && entities.dario) {
    return {
      classification: 'NO',
      rendered_text: 'Não. O arquivo não confirma que Tomás ajudasse Dario nas vendas ou no desaparecimento.',
      fallback_used: false
    };
  }

  if (entities.celina && entities.dario) {
    return {
      classification: 'NO',
      rendered_text: 'Não. O arquivo não confirma que Celina ajudasse Dario nas negociações ou nas obras falsas.',
      fallback_used: false
    };
  }

  if (entities.dario) {
    if (asksMotive) {
      return {
        classification: 'YES',
        rendered_text: 'Sim. O curador tinha ligação com obras falsas e um motivo para silenciar Nina.',
        fallback_used: false
      };
    }

    if (entities.lights) {
      return {
        classification: 'YES',
        rendered_text: 'Sim. Dario mandou apagar a iluminação por cinco minutos para abrir a janela do desaparecimento.',
        fallback_used: false
      };
    }

    if (entities.nina && (asksTransport || entities.lona || entities.cart || asksMethod)) {
      return {
        classification: 'YES',
        rendered_text: 'Sim. Dario sedou Nina e a retirou no carrinho de manutenção, coberta pela lona.',
        fallback_used: false
      };
    }

    if (asksRelationship || asksDisappearance || entities.nina) {
      return {
        classification: 'YES',
        rendered_text: 'Sim. Dario é o responsável: tinha motivo, apagou a luz e retirou Nina pelo trajeto de manutenção.',
        fallback_used: false
      };
    }

    return {
      classification: 'PARTIAL',
      rendered_text: 'Parcialmente. O curador é uma figura importante do evento, mas pergunte sobre motivo, luzes ou exposição.',
      fallback_used: false
    };
  }

  if (entities.celina) {
    if (asksRivalry) {
      return {
        classification: 'NO',
        rendered_text: 'Não. A paisagista conhecia o labirinto, mas não há rivalidade confirmada com Nina.',
        fallback_used: false
      };
    }

    if (entities.tracks || entities.garden || asksRelationship) {
      return {
        classification: 'PARTIAL',
        rendered_text: 'Parcialmente. A paisagista conhecia o labirinto, mas isso não prova participação direta.',
        fallback_used: false
      };
    }

    return {
      classification: 'UNKNOWN',
      rendered_text: 'Desconhecido. O arquivo não confirma participação direta da paisagista.',
      fallback_used: false
    };
  }

  if (entities.tomas) {
    if (asksMotive || asksRelationship || asksDisappearance) {
      return {
        classification: 'PARTIAL',
        rendered_text: 'Parcialmente. O irmão tinha conflito familiar, mas isso não o liga à retirada de Nina.',
        fallback_used: false
      };
    }

    return {
      classification: 'UNKNOWN',
      rendered_text: 'Desconhecido. O arquivo não confirma participação do irmão no desaparecimento.',
      fallback_used: false
    };
  }

  if (entities.vitor) {
    if (asksMotive || entities.statue || asksRelationship || asksDisappearance) {
      return {
        classification: 'PARTIAL',
        rendered_text: 'Parcialmente. Vítor se conecta às obras suspeitas, mas não à retirada de Nina.',
        fallback_used: false
      };
    }

    return {
      classification: 'UNKNOWN',
      rendered_text: 'Desconhecido. O arquivo não confirma que o colecionador tenha agido no labirinto.',
      fallback_used: false
    };
  }

  if (entities.shears) {
    return {
      classification: 'PARTIAL',
      rendered_text: 'Parcialmente. A tesoura é relevante, mas parece mais encenação do que prova direta.',
      fallback_used: false
    };
  }

  if (entities.gardener) {
    if (asksExistence) {
      return {
        classification: 'YES',
        rendered_text: 'Sim. Havia equipe de jardinagem ligada ao labirinto.',
        fallback_used: false
      };
    }

    if (entities.shears || asksRelationship || asksDisappearance) {
      return {
        classification: 'PARTIAL',
        rendered_text: 'Parcialmente. A jardinagem aparece na cena, mas parece uma direção plantada.',
        fallback_used: false
      };
    }

    return {
      classification: 'UNKNOWN',
      rendered_text: 'Desconhecido. O arquivo não confirma participação direta de jardineiros.',
      fallback_used: false
    };
  }

  if (entities.footprints || entities.tracks) {
    if (entities.footprints && asksAbout(['nao', 'não', 'sem', 'ausencia', 'ausência'])) {
      return {
        classification: 'YES',
        rendered_text: 'Sim. A ausência de pegadas é real e se explica por uma rota fora do barro.',
        fallback_used: false
      };
    }

    if (entities.tracks || asksMethod) {
      return {
        classification: 'YES',
        rendered_text: 'Sim. Os trilhos de drenagem explicam como a retirada não deixou pegadas no barro.',
        fallback_used: false
      };
    }

    return {
      classification: 'PARTIAL',
      rendered_text: 'Parcialmente. As pegadas importam porque a ausência delas aponta para outra rota.',
      fallback_used: false
    };
  }

  if (entities.cart) {
    if (!entities.nina && !asksDisappearance && !asksTransport && !asksMethod) {
      return {
        classification: 'YES',
        rendered_text: 'Sim. Havia um carrinho de manutenção associado aos trilhos do labirinto.',
        fallback_used: false
      };
    }

    return {
      classification: 'YES',
      rendered_text: 'Sim. O carrinho de manutenção foi usado para retirar Nina pelos trilhos sem pisar no barro.',
      fallback_used: false
    };
  }

  if (entities.chemical && asksCleaningProduct) {
    return {
      classification: 'NO',
      rendered_text: 'Não. O arquivo aponta para spray de restauração com efeito anestésico, não produto de limpeza.',
      fallback_used: false
    };
  }

  if (entities.nina && entities.chemical) {
    return {
      classification: 'YES',
      rendered_text: 'Sim. O arquivo indica que Nina foi sedada com spray anestésico usado em restauração.',
      fallback_used: false
    };
  }

  if (entities.lona && entities.statue && asksProtection) {
    return {
      classification: 'PARTIAL',
      rendered_text: 'Parcialmente. A lona cobria a estátua, mas não há confirmação de que a função fosse protegê-la.',
      fallback_used: false
    };
  }

  if (entities.lona && entities.nina && asksOrigin) {
    return {
      classification: 'PARTIAL',
      rendered_text: 'Parcialmente. A lona se liga à retirada de Nina, mas os vestígios confirmados são odor químico e fibras da própria lona.',
      fallback_used: false
    };
  }

  if (entities.lona || entities.chemical) {
    return {
      classification: 'YES',
      rendered_text: 'Sim. A lona e o odor químico são pistas físicas importantes.',
      fallback_used: false
    };
  }

  if (entities.lights) {
    return {
      classification: 'YES',
      rendered_text: asksIntentional
        ? 'Sim. A falha foi provocada: Dario mandou apagar a iluminação por cinco minutos.'
        : 'Sim. A iluminação apagada criou a janela curta do desaparecimento.',
      fallback_used: false
    };
  }

  if (entities.statue) {
    if (asksAbout(['feita', 'fez', 'autoria', 'autora', 'propria', 'dela'])) {
      return {
        classification: 'YES',
        rendered_text: 'Sim. A estátua fazia parte das obras atribuídas a Nina na exposição.',
        fallback_used: false
      };
    }

    return {
      classification: 'PARTIAL',
      rendered_text: 'Parcialmente. A estátua importa por estar recém-lavada e associada à lona.',
      fallback_used: false
    };
  }

  if (entities.nina && asksAbout(['ajuda', 'ajudou', 'auxilio', 'auxiliou', 'cumplice', 'alguem'])) {
    return {
      classification: 'PARTIAL',
      rendered_text: 'Parcialmente. O arquivo indica interferência de outra pessoa no desaparecimento.',
      fallback_used: false
    };
  }

  if (entities.nina && asksLeftEvidence) {
    return {
      classification: 'PARTIAL',
      rendered_text: 'Parcialmente. Há vestígios ligados ao que ocorreu com Nina, mas não há confirmação de que ela os tenha deixado intencionalmente.',
      fallback_used: false
    };
  }

  if (entities.nina && asksDisappearance) {
    return {
      classification: 'YES',
      rendered_text: 'Sim. O desaparecimento de Nina é o evento central do caso.',
      fallback_used: false
    };
  }

  if (entities.nina && asksExit) {
    return {
      classification: 'NO',
      rendered_text: 'Não. Nina não deixou o jardim por conta própria.',
      fallback_used: false
    };
  }

  if (entities.garden || entities.nina || mentionsAnySuspect || asksEvidence || asksMethod) {
    return {
      classification: 'UNKNOWN',
      rendered_text: 'Desconhecido. O arquivo não confirma essa hipótese neste momento.',
      fallback_used: false
    };
  }

  return null;
};

const stripVerdictPrefix = (value: string) =>
  String(value || '').trim().replace(/^(Sim|Não|Nao|Parcialmente|Irrelevante|Desconhecido|Ambíguo|Ambiguo)\.\s*/i, '');

export const buildClarificationText = (questionText: string, answer: { classification?: string; rendered_text?: string }) => {
  const classification = String(answer.classification || '').toUpperCase();
  const rendered = String(answer.rendered_text || '').trim();
  const core = stripVerdictPrefix(rendered);
  const cleanQuestion = String(questionText || '').trim();

  if (classification === 'YES') {
    return `Confirma a hipótese perguntada: ${core || cleanQuestion}.`;
  }

  if (classification === 'NO') {
    return `Nega essa hipótese específica. ${core || 'Isso não invalida outras perguntas sobre o mesmo assunto.'}`;
  }

  if (classification === 'PARTIAL') {
    return `Há uma parte correta, mas a conclusão ainda não fica comprovada. ${core}`;
  }

  if (classification === 'IRRELEVANT') {
    return `Essa linha não se conecta aos fatos centrais confirmados até agora.`;
  }

  if (classification === 'UNKNOWN') {
    return `O arquivo não confirma essa hipótese do jeito que ela foi formulada. Tente perguntar por um fato mais específico.`;
  }

  return rendered || 'O Mestre não encontrou um fato confirmado para detalhar melhor essa resposta.';
};

export const buildContestationText = (
  previousAnswer: { classification?: string; rendered_text?: string },
  reviewedAnswer: { classification?: string; rendered_text?: string }
) => {
  const previousClassification = String(previousAnswer.classification || '').toUpperCase();
  const reviewedClassification = String(reviewedAnswer.classification || '').toUpperCase();
  const previousText = String(previousAnswer.rendered_text || '').trim();
  const reviewedText = String(reviewedAnswer.rendered_text || '').trim();
  const changed = previousClassification !== reviewedClassification || previousText !== reviewedText;

  if (changed) {
    return `Aceita. Resposta corrigida: ${reviewedText}`;
  }

  return `Concluída. A resposta permanece válida: ${reviewedText || previousText}`;
};

export const processQuestion = async (roomId: string, questionText: string, caseVersionId: string, phase: InvestigationPhase = 'IN_PROGRESS') => {
  try {
    const cleanQuestion = String(questionText || '').trim().slice(0, 500);
    if (!cleanQuestion) throw new Error('Empty question');

    if (BLOCKED_PATTERNS.test(cleanQuestion)) {
      return { classification: 'BLOCKED', rendered_text: 'Essa pergunta tenta alterar as regras da investigação. Reformule usando apenas os fatos do caso.', fallback_used: false };
    }

    const [facts, answerRules, hints, solutionFields] = await Promise.all([
      prisma.case_facts.findMany({
        where: { case_version_id: caseVersionId, visibility: { not: 'SECRET' } }
      }),
      prisma.case_answer_rules.findMany({
        where: { case_version_id: caseVersionId }
      }),
      prisma.case_hints.findMany({
        where: { case_version_id: caseVersionId },
        orderBy: { hint_index: 'asc' }
      }),
      prisma.case_solution_fields.findMany({
        where: { case_version_id: caseVersionId },
        orderBy: { display_order: 'asc' }
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

    if (caseVersion.case_ref.slug === 'o-jardim-sem-pegadas') {
      const gardenAnswer = processGardenQuestion(cleanQuestion);
      if (gardenAnswer) return gardenAnswer;
    }

    const staticContext = getStaticCaseContext(caseVersion.case_ref.slug);
    const contextualFacts = [...facts, ...staticContext.facts];
    const contextualAnswerRules = [...answerRules, ...staticContext.rules];

    if (!contextualFacts || contextualFacts.length === 0) {
      return { classification: 'UNKNOWN', rendered_text: 'O arquivo do caso não pôde ser acessado agora. Tente novamente em instantes.', fallback_used: true };
    }

    const ruleBasedAnswer = processRuleBasedQuestion(cleanQuestion, contextualAnswerRules, contextualFacts, phase);
    if (ruleBasedAnswer) return ruleBasedAnswer;

    const factBasedAnswer = processFactBasedQuestion(cleanQuestion, contextualFacts, caseVersion.opening);
    if (factBasedAnswer) return factBasedAnswer;

    const { revealSecret } = await import('../security/secrets');
    const solutionSummary = revealSecret(caseVersion.solution_summary_encrypted);
    const chronology = revealSecret(caseVersion.chronology_encrypted);
    const promptHints = hints.map((hint: any) => ({
      hint_index: hint.hint_index,
      content: revealSecret(hint.content_encrypted),
      penalty_points: hint.penalty_points
    }));

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

    const prompt = buildMasterPrompt({
      caseTitle: caseVersion.case_ref.title,
      caseSynopsis: caseVersion.case_ref.short_synopsis,
      caseType: caseVersion.case_ref.case_type,
      caseDifficulty: caseVersion.case_ref.difficulty,
      caseOpening: caseVersion.opening,
      masterStyle: caseVersion.master_style,
      solutionSummary,
      chronology,
      facts: contextualFacts,
      answerRules: contextualAnswerRules,
      hints: promptHints,
      solutionFields,
      questionText
    });

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
      rendered_text: toConciseMasterText(logicResult.shortAnswer, logicResult.publicExplanation),
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

2. Qual é a causa ou responsável?
"${structuredAnswers.who}"

3. Como isso foi possível?
"${structuredAnswers.how}"

4. Qual era a intenção, motivo ou finalidade?
"${structuredAnswers.why}"

Instruções ESTRITAS:
1. Avalie cada campo separadamente em dimensionResults, de 0 a 100.
2. what_happened: mede se identificaram corretamente a verdade central do caso, não só a aparência da cena.
3. who: mede se apontaram a pessoa responsável, causa principal, objeto, fenômeno ou condição correta. Nem todo caso clássico tem culpado humano; não penalize quando o campo trouxer a causa certa.
4. how: mede o mecanismo, sequência, condição escondida e uso de pistas falsas. Este campo deve ser mais exigente.
5. why: mede a motivação central quando houver ação humana. Em enigmas sem culpado, aceite finalidade, função ou motivo da confusão aparente.
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
