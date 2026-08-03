import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildClarificationText,
  buildContestationText,
  buildStaticContextFromMatrix,
  applyTheoryScoreGuards,
  calculateTheoryScore,
  getCaseTruthMatrix,
  getStaticCaseContext,
  isBroadSolutionQuestion,
  processFactBasedQuestion,
  processGardenQuestion,
  processRuleBasedQuestion,
  processTutorialQuestion,
  toConciseMasterText
} from '../dist/services/aiMaster.js';

const normalize = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

const assertIncludesTerms = (text, terms, label) => {
  const normalizedText = normalize(text);
  for (const term of terms) {
    assert.match(normalizedText, new RegExp(normalize(term)), `${label} deveria mencionar "${term}"`);
  }
};

const answerWithContext = (question, context) =>
  processRuleBasedQuestion(question, context.rules, context.facts) ||
  processFactBasedQuestion(question, context.facts, context.opening || '');

const matrixContext = (slug) => buildStaticContextFromMatrix(getCaseTruthMatrix(slug));
const repoRoot = path.resolve(process.cwd(), '..');

const parseSeedHints = () => {
  const source = fs.readFileSync(path.join(repoRoot, 'backend/prisma/seed-phase3.ts'), 'utf8');
  const cases = new Map();

  for (const match of source.matchAll(/slug:\s*'(?<slug>[^']+)'[\s\S]*?hints:\s*\[(?<hints>[\s\S]*?)\]\s*\}/g)) {
    const hints = [...match.groups.hints.matchAll(/'(?<hint>(?:\\'|[^'])*)'/g)].map((hintMatch) => hintMatch.groups.hint);
    cases.set(match.groups.slug, hints);
  }

  return cases;
};

const caseSamples = [
  {
    title: 'O Presente Desaparecido',
    opening: 'Durante uma comemoração em família, a caixa de presente sobre a mesa desaparece diante de todos.',
    facts: [
      'A caixa estava vazia desde antes.',
      'O anfitrião planejou a ação.',
      'A caixa foi colocada sob a toalha da mesa.'
    ],
    question: 'A caixa estava vazia desde o começo?',
    expectedTerms: ['caixa', 'vazia']
  },
  {
    title: 'O Quarto 7',
    opening: 'Helena Duarte foi encontrada desacordada no Quarto 7 do Hotel Vesper.',
    facts: [
      'A porta foi trancada usando a chave mestra do gerente.',
      'O chá servido a Helena continha sedativo em dose não letal.',
      'O gerente queria impedir que Helena provasse a inocência do pai.'
    ],
    question: 'O chá servido para Helena tinha sedativo?',
    expectedTerms: ['chá', 'sedativo']
  },
  {
    title: 'O Elevador que Não Parou',
    opening: 'Uma mulher entra sozinha em um elevador no térreo.',
    facts: [
      'O alçapão no teto do elevador estava destrancado.',
      'O elevador parou por 3 minutos entre o segundo e o terceiro andar.',
      'A mulher conhecia a rota de manutenção interna do poço do elevador.'
    ],
    question: 'O elevador parou entre dois andares?',
    expectedTerms: ['elevador', 'parou']
  },
  {
    title: 'A Mensagem das 23h17',
    opening: 'Às 23h17, uma pessoa desaparecida envia uma mensagem.',
    facts: [
      'A mensagem foi enviada via script agendado do computador da vítima.',
      'A vítima saiu de casa voluntariamente horas antes do envio.',
      'O computador da vítima estava ligado e conectado à mesma rede.'
    ],
    question: 'A mensagem foi enviada por um script agendado?',
    expectedTerms: ['mensagem', 'script']
  },
  {
    title: 'O Retrato que Piscou',
    opening: 'Todos veem o retrato antigo da sala piscar.',
    facts: [
      'O piscar foi um reflexo no vidro ou verniz do retrato, provocado por um flash externo.',
      'Todos os convidados sofreram de cegueira temporária por 3 segundos.',
      'O garçom aproximou-se da mesa exatamente no instante do clarão.'
    ],
    question: 'O retrato piscou por causa de um reflexo no vidro?',
    expectedTerms: ['retrato', 'reflexo']
  },
  {
    title: 'Mansão Blackwell',
    opening: 'Clara Mendes foi vista pela última vez na sala de estar.',
    facts: [
      'O sangue na poltrona da sala de estar era artificial.',
      'Clara e Helena fugiram juntas pelos jardins da mansão.',
      'O livro-caixa desenterrado no jardim prova que Tomás desviava fundos.'
    ],
    question: 'O sangue na poltrona era artificial?',
    expectedTerms: ['sangue', 'artificial']
  },
  {
    title: 'A Herança de Vidro',
    opening: 'Isadora Vale foi encontrada morta no conservatório da Casa Alvarenga.',
    facts: [
      'A taça de Isadora continha traços de digitalina misturados ao vinho.',
      'O relógio do conservatório estava adiantado em 18 minutos desde a manutenção da tarde.',
      'A porta foi trancada por dentro usando o fio, que depois foi puxado para fora pela drenagem.'
    ],
    question: 'A taça de Isadora tinha digitalina no vinho?',
    expectedTerms: ['taça', 'digitalina']
  },
  {
    title: 'O Sino das Três Batidas',
    opening: 'O sino da torre desativado tocou três vezes.',
    facts: [
      'A poeira na fechadura e no batente da torre estava intacta; ninguém abriu a porta naquela noite.',
      'Uma fibra transparente ficou presa no badalo do sino.',
      'Um conduíte antigo liga o arquivo morto à torre do sino.'
    ],
    question: 'Tinha uma fibra transparente no badalo do sino?',
    expectedTerms: ['fibra', 'badalo']
  },
  {
    title: 'A Fita Sem Rosto',
    opening: 'A câmera mostra uma figura de jaleco atravessando o corredor sem rosto identificável.',
    facts: [
      'O notebook de Bruno registrou uso de câmera virtual entre 22h06 e 22h19.',
      'Fragmentos de filme reflexivo foram encontrados na lixeira técnica.',
      'Um token manual de manutenção foi emitido por Bruno às 22h11.'
    ],
    question: 'Bruno usou câmera virtual na videoconferência?',
    expectedTerms: ['Bruno', 'câmera virtual']
  },
  {
    title: 'O Jardim Sem Pegadas',
    opening: 'Nina Arantes desapareceu de um jardim-labirinto encharcado sem deixar pegadas.',
    facts: [
      'O labirinto possui trilhos de drenagem sob o cascalho central.',
      'As marcas recentes nos trilhos correspondem ao carrinho estreito de manutenção.',
      'A lona tinha odor de spray anestésico usado em restauração de peças.'
    ],
    question: 'Os trilhos de drenagem explicam a falta de pegadas?',
    expectedTerms: ['trilhos', 'drenagem']
  }
];

test('perguntas plausiveis de todos os casos recebem resposta com contexto correto', () => {
  for (const sample of caseSamples) {
    const result = processFactBasedQuestion(
      sample.question,
      sample.facts.map((statement) => ({ statement })),
      sample.opening
    );

    assert.ok(result, `${sample.title} deveria gerar uma resposta local`);
    assert.equal(result.classification, 'YES', sample.title);
    assert.equal(result.fallback_used, false, sample.title);
    assertIncludesTerms(result.rendered_text, sample.expectedTerms, sample.title);
  }
});

test('caso tutorial responde protecao do guarda-chuva sem confundir com chuva', () => {
  const result = processTutorialQuestion('O guarda chuva protegia alguma coisa ou alguém?');

  assert.equal(result.classification, 'YES');
  assertIncludesTerms(result.rendered_text, ['guarda-chuva', 'protegia', 'dentro do prédio'], 'O Guarda-chuva Molhado');
  assert.doesNotMatch(normalize(result.rendered_text), /agua nao veio da chuva|veio da chuva/);
});

test('caso jardim responde perguntas centrais sem cair sempre em desconhecido', () => {
  const samples = [
    ['Ela saiu sozinha do jardim?', 'NO', ['Nina', 'não', 'própria']],
    ['Ela fugiu pelo labirinto?', 'NO', ['Nina', 'não', 'própria']],
    ['Nina é uma humana?', 'YES', ['Nina', 'pessoa', 'escultora']],
    ['Nina está viva?', 'UNKNOWN', ['desaparecimento', 'estado']],
    ['Nina morreu?', 'UNKNOWN', ['desaparecimento', 'estado']],
    ['Nina estava acordada ao desaparecer?', 'UNKNOWN', ['anestésico', 'consciência', 'Nina']],
    ['Usaram anestésico em Nina?', 'YES', ['Nina', 'sedada', 'spray anestésico']],
    ['Nina teve ajuda para desaparecer?', 'PARTIAL', ['interferência', 'outra pessoa']],
    ['Nina deixou alguma evidência antes de desaparecer?', 'PARTIAL', ['vestígios', 'Nina', 'intencionalmente']],
    ['Nina descobriu que as obras dela estavam sendo falsificadas?', 'YES', ['Nina', 'obras falsas', 'atribuídas']],
    ['O motivo do desaparecimento foi a descoberta das obras falsas?', 'YES', ['motivo', 'desaparecimento', 'obras falsas']],
    ['Nina desapareceu mesmo?', 'YES', ['desaparecimento', 'Nina']],
    ['Quem contratou a Nina tem haver com o desaparecimento dela?', 'YES', ['Dario', 'responsável', 'trajeto de manutenção']],
    ['O curador tinha motivo para sumir com Nina?', 'YES', ['curador', 'obras falsas', 'motivo']],
    ['Dario transportou / moveu Nina na lona?', 'YES', ['Dario', 'Nina', 'carrinho', 'lona']],
    ['O irmão de Nina ajudava o curador com as vendas?', 'NO', ['Tomás', 'Dario', 'vendas']],
    ['Celina ajudava o curador com as negociações?', 'NO', ['Celina', 'Dario', 'negociações']],
    ['A paisagista era rival de Nina?', 'NO', ['paisagista', 'rivalidade']],
    ['A paisagista conhecia os trilhos?', 'PARTIAL', ['paisagista', 'labirinto']],
    ['O irmão de Nina estava envolvido?', 'PARTIAL', ['irmão', 'conflito familiar']],
    ['Vitor está envolvido no desaparecimento de Nina?', 'PARTIAL', ['Vítor', 'obras suspeitas']],
    ['O comprador da obra tem conexão com o sumiço?', 'PARTIAL', ['Vítor', 'obras suspeitas']],
    ['Tinha jardineiro neste labirinto?', 'YES', ['equipe de jardinagem', 'labirinto']],
    ['A tesoura incrimina os jardineiros?', 'PARTIAL', ['tesoura', 'encenação']],
    ['A estátua foi feita pela própria escultora?', 'YES', ['estátua', 'Nina']],
    ['Os trilhos explicam a falta de pegadas?', 'YES', ['trilhos', 'pegadas']],
    ['As canaletas explicam a falta de rastros?', 'YES', ['trilhos', 'pegadas']],
    ['Usaram um carrinho de manutenção?', 'YES', ['carrinho', 'manutenção', 'trilhos']],
    ['Havia algum meio de transporte nesse jardim?', 'YES', ['carrinho', 'manutenção', 'trilhos']],
    ['A lona tinha produto químico?', 'YES', ['lona', 'odor químico']],
    ['A lona protegia a estátua?', 'PARTIAL', ['lona', 'estátua', 'protegê-la']],
    ['Os vestígios encontrados na lona eram de Nina?', 'PARTIAL', ['lona', 'Nina', 'odor químico', 'fibras']],
    ['Foram encontrados produtos químicos no local?', 'YES', ['lona', 'odor químico']],
    ['O produto era de limpeza?', 'NO', ['spray de restauração', 'limpeza']],
    ['As luzes apagadas importam?', 'YES', ['iluminação', 'janela']],
    ['Houve uma falha na iluminação proposital para ajudar no desaparecimento de Nina?', 'YES', ['Dario', 'iluminação', 'cinco minutos']],
    ['Os refletores desligados importam?', 'YES', ['iluminação', 'janela']]
  ];

  for (const [question, classification, terms] of samples) {
    const result = processGardenQuestion(String(question));
    assert.equal(result?.classification, classification, String(question));
    assertIncludesTerms(result?.rendered_text || '', terms, `O Jardim Sem Pegadas - ${question}`);
  }
});

test('caso heranca de vidro cobre sinonimos e perguntas dificeis', () => {
  const context = matrixContext('a-heranca-de-vidro');
  const samples = [
    ['Augusto desviava dinheiro da fundação?', 'YES', ['Augusto', 'fundação']],
    ['O motivo era impedir a auditoria?', 'YES', ['testamento', 'Augusto']],
    ['Havia recibos falsos na restauração?', 'YES', ['recibos', 'falsos']],
    ['Isadora foi envenenada pelo vinho?', 'YES', ['digitalina', 'vinho']],
    ['A bebida tinha remédio cardíaco?', 'YES', ['taça', 'digitalina']],
    ['Augusto serviu vinho para Isadora?', 'YES', ['Augusto', 'vinho']],
    ['O relógio estava adiantado?', 'YES', ['relógio', 'adiantado']],
    ['22h46 era um horário falso?', 'YES', ['22h46', 'chamada']],
    ['A chamada de vídeo era álibi?', 'YES', ['22h46', 'chamada']],
    ['A porta foi fechada com linha?', 'YES', ['fio', 'porta']],
    ['O fio saiu pela drenagem?', 'YES', ['fio', 'drenagem']],
    ['A sala trancada era encenação?', 'YES', ['porta', 'fio']],
    ['O vidro quebrado foi armado?', 'YES', ['vidro', 'fragilizado']],
    ['A tempestade matou Isadora?', 'NO', ['tempestade', 'não']],
    ['Cecília matou Isadora?', 'NO', ['Cecília', 'não']]
  ];

  for (const [question, classification, terms] of samples) {
    const result = answerWithContext(String(question), context);
    assert.equal(result?.classification, classification, String(question));
    assertIncludesTerms(result?.rendered_text || '', terms, `A Herança de Vidro - ${question}`);
  }
});

test('caso sino das tres batidas cobre sinonimos e pistas centrais', () => {
  const context = matrixContext('o-sino-das-tres-batidas');
  const samples = [
    ['Alguém abriu a porta da torre?', 'NO', ['poeira', 'torre']],
    ['O sino foi tocado lá dentro?', 'NO', ['fibra', 'badalo']],
    ['A poeira da fechadura foi mexida?', 'NO', ['poeira', 'torre']],
    ['Tinha linha de pesca no badalo?', 'YES', ['fibra', 'badalo']],
    ['O sino podia ser acionado à distância?', 'YES', ['fibra', 'badalo']],
    ['O arquivo morto se ligava à torre?', 'YES', ['conduíte', 'torre']],
    ['O motivo era vender a escola?', 'YES', ['pasta', 'assinaturas']],
    ['Elias descobriu fraude?', 'YES', ['pasta', 'assinaturas']],
    ['A pasta tinha assinaturas copiadas?', 'YES', ['assinaturas', 'copiadas']],
    ['Lúcia controlava os documentos?', 'YES', ['Lúcia', 'documentos']],
    ['A presidente do conselho tinha motivo?', 'YES', ['Lúcia', 'documentos']],
    ['Elias caiu da torre?', 'NO', ['escada', 'arquivo']],
    ['A chave no bolso era uma pista falsa?', 'YES', ['chave', 'falsa']],
    ['Marina acionou o sino?', 'PARTIAL', ['Marina', 'não', 'sino']]
  ];

  for (const [question, classification, terms] of samples) {
    const result = answerWithContext(String(question), context);
    assert.equal(result?.classification, classification, String(question));
    assertIncludesTerms(result?.rendered_text || '', terms, `O Sino das Três Batidas - ${question}`);
  }
});

test('caso fita sem rosto cobre sinonimos e suspeitos', () => {
  const context = matrixContext('a-fita-sem-rosto');
  const samples = [
    ['A videoconferência era falsa?', 'YES', ['câmera virtual']],
    ['Bruno usou vídeo gravado?', 'YES', ['câmera virtual']],
    ['O álibi digital falha?', 'YES', ['câmera virtual']],
    ['A chamada tinha atraso repetido?', 'YES', ['atraso']],
    ['O invasor usou máscara reflexiva?', 'YES', ['reflexivo']],
    ['A câmera do corredor falhou?', 'YES', ['exposição', 'reflexivo']],
    ['O rosto foi apagado por luz?', 'YES', ['exposição']],
    ['Bruno tinha acesso ao cofre?', 'YES', ['cofre', 'senha']],
    ['O token foi emitido manualmente?', 'YES', ['token', 'Bruno']],
    ['A senha temporária era de manutenção?', 'YES', ['cofre', 'senha']],
    ['Bruno tinha dívida?', 'YES', ['dívidas']],
    ['Ele queria vender o protótipo para concorrente?', 'YES', ['concorrente']],
    ['Saiu pela escada de serviço?', 'YES', ['escada', 'serviço']],
    ['Ele passou pela recepção?', 'YES', ['escada', 'serviço']],
    ['Inae roubou o protótipo?', 'NO', ['Inae', 'câmera real']]
  ];

  for (const [question, classification, terms] of samples) {
    const result = answerWithContext(String(question), context);
    assert.equal(result?.classification, classification, String(question));
    assertIncludesTerms(result?.rendered_text || '', terms, `A Fita Sem Rosto - ${question}`);
  }
});

test('matriz de verdade existe para casos estruturados com entidades e vereditos variados', () => {
  const slugs = [
    'o-presente-desaparecido',
    'o-quarto-7',
    'o-elevador-que-nao-parou',
    'a-mensagem-das-23h17',
    'o-retrato-que-piscou',
    'blackwell',
    'a-heranca-de-vidro',
    'o-sino-das-tres-batidas',
    'a-fita-sem-rosto'
  ];

  for (const slug of slugs) {
    const matrix = getCaseTruthMatrix(slug);
    assert.ok(matrix, `${slug} deveria ter matriz de verdade`);
    assert.ok(matrix.entities.length >= 2, `${slug} deveria listar entidades e sinonimos`);
    assert.ok(matrix.truths.some((entry) => entry.verdict === 'YES'), `${slug} deveria ter fatos confirmados`);
    assert.ok(matrix.truths.some((entry) => entry.verdict === 'NO'), `${slug} deveria ter fatos negados`);
    assert.ok(matrix.truths.some((entry) => entry.verdict === 'PARTIAL'), `${slug} deveria ter fatos parciais`);
    assert.ok(matrix.truths.every((entry) => entry.examples.length > 0), `${slug} deveria ter exemplos por fato`);

    const generatedContext = buildStaticContextFromMatrix(matrix);
    assert.equal(generatedContext.facts.length, matrix.truths.length, `${slug} deveria gerar fatos da matriz`);
    assert.equal(generatedContext.rules.length, matrix.truths.length, `${slug} deveria gerar regras da matriz`);
  }
});

test('matriz responde parcialmente para pistas falsas e suspeitos com conexao limitada', () => {
  const samples = [
    ['o-presente-desaparecido', 'Todos viram o presente sumir?', ['convidados', 'toalha']],
    ['o-quarto-7', 'Helena estava instável?', ['Helena', 'sedativo']],
    ['o-elevador-que-nao-parou', 'As câmeras viram tudo?', ['câmeras', 'manutenção']],
    ['a-mensagem-das-23h17', 'O celular em casa prova que ela estava lá?', ['celular', 'automação']],
    ['o-retrato-que-piscou', 'O retrato piscou de verdade?', ['retrato', 'luz']],
    ['blackwell', 'Tomás sequestrou Clara?', ['Tomás', 'não prova']],
    ['a-heranca-de-vidro', 'O remédio de Isadora causou a morte?', ['remédio', 'digitalina']],
    ['o-sino-das-tres-batidas', 'Marina está envolvida?', ['Marina', 'protestos']],
    ['a-fita-sem-rosto', 'Sara estava envolvida?', ['Sara', 'servidores']]
  ];

  for (const [slug, question, terms] of samples) {
    const context = getStaticCaseContext(String(slug));
    const result = answerWithContext(String(question), context);
    assert.equal(result?.classification, 'PARTIAL', `${slug} - ${question}`);
    assertIncludesTerms(result?.rendered_text || '', terms, `${slug} - ${question}`);
  }
});

test('suspeitos cadastrados usam retratos existentes no frontend', () => {
  const sources = [
    path.join(repoRoot, 'backend/prisma/seed.ts'),
    path.join(repoRoot, 'frontend/src/components/FinalTheoryForm.tsx')
  ];
  const imagePaths = new Set();

  for (const sourcePath of sources) {
    const source = fs.readFileSync(sourcePath, 'utf8');
    for (const match of source.matchAll(/['"](?<image>\/suspects\/[^'"]+\.png)['"]/g)) {
      imagePaths.add(match.groups.image);
    }
  }

  assert.ok(imagePaths.size > 0, 'deveria encontrar retratos de suspeitos cadastrados');

  for (const imagePath of imagePaths) {
    const publicPath = path.join(repoRoot, 'frontend/public', String(imagePath));
    assert.ok(fs.existsSync(publicPath), `Retrato ausente: ${imagePath}`);
  }
});

test('casos com suspeitos apresentam personagens no enunciado com funcao editorial', () => {
  const editorialCases = [
    {
      slug: 'a-heranca-de-vidro',
      opening: 'Isadora Vale, restauradora de vitrais e herdeira menor da família, foi encontrada morta no conservatório da Casa Alvarenga. Estavam diretamente ligados à noite: Augusto Alvarenga, tio e administrador da fundação; Cecília Alvarenga, prima que discutiu sobre herança; Dr. Renato Salles, médico da família; e Marta Nóbrega, governanta com acesso às chaves. A porta estava trancada por dentro, o teto de vidro tinha uma rachadura recente e o relógio de bronze parou às 22h46. Horas antes, Isadora avisou que mudaria o testamento e tiraria o controle da fundação das mãos de Augusto.',
      suspects: [
        { name: 'Augusto Alvarenga', role: 'Administrador da fundação', description: 'Tio de Isadora. Controlava as contas da família e perderia poder com a nova auditoria.' },
        { name: 'Cecília Alvarenga', role: 'Prima de Isadora', description: 'Discutiu com Isadora sobre herança e foi vista deixando a casa antes da tempestade.' },
        { name: 'Dr. Renato Salles', role: 'Médico da família', description: 'Receitava medicamentos cardíacos e conhecia o histórico clínico dos Alvarenga.' },
        { name: 'Marta Nóbrega', role: 'Governanta', description: 'Tinha acesso às chaves da casa e encontrou o conservatório pouco antes da polícia chegar.' }
      ]
    },
    {
      slug: 'o-sino-das-tres-batidas',
      opening: 'Na antiga Escola São Brás, o conselho se reuniu para decidir a venda do prédio histórico. Estavam diretamente ligados à decisão: Lúcia Ferraz, presidente do conselho; Padre Miguel, ex-diretor; Otávio Nunes, comprador interessado; e Marina Reis, professora que liderava protestos. Às 21h, o sino da torre, desativado havia anos, tocou três vezes. O acesso à torre estava trancado, o zelador Elias caiu no pátio interno e a chave da torre estava no bolso dele.',
      suspects: [
        { name: 'Lúcia Ferraz', role: 'Presidente do conselho', description: 'Defendia a venda imediata da escola e controlava os documentos da negociação.' },
        { name: 'Padre Miguel', role: 'Ex-diretor', description: 'Era contra a venda e tinha acesso histórico à torre.' },
        { name: 'Otávio Nunes', role: 'Comprador interessado', description: 'Representava a empresa que compraria o prédio.' },
        { name: 'Marina Reis', role: 'Professora', description: 'Organizou protestos contra a reunião do conselho.' }
      ]
    },
    {
      slug: 'a-fita-sem-rosto',
      opening: 'No laboratório Nereida, um protótipo de bateria biológica desapareceu às 22h13. Estavam diretamente ligados ao projeto: Bruno Tavares, coordenador técnico; Inae Moura, bioquímica; Sara Fontes, estagiária; e Heitor Campos, investidor. A câmera mostra uma figura de jaleco atravessando o corredor sem rosto identificável. Os quatro apareciam em videoconferência no mesmo horário, com áudio e imagem ativos.',
      suspects: [
        { name: 'Bruno Tavares', role: 'Coordenador técnico', description: 'Administrava tokens de manutenção e tinha dívidas recentes.' },
        { name: 'Inae Moura', role: 'Bioquímica', description: 'Disputava autoria da patente com Bruno.' },
        { name: 'Sara Fontes', role: 'Estagiária', description: 'Foi vista perto da sala de servidores mais cedo.' },
        { name: 'Heitor Campos', role: 'Investidor', description: 'Pressionava a equipe por resultados antes da rodada de financiamento.' }
      ]
    },
    {
      slug: 'o-jardim-sem-pegadas',
      opening: 'Durante a inauguração de um jardim-labirinto, a escultora Nina Arantes desapareceu entre 20h40 e 21h05. A chuva deixou a terra mole, mas não havia pegadas saindo do centro. Estavam diretamente ligados ao evento: Dario Velloso, curador que organizou a exposição; Celina Prado, paisagista do labirinto; Tomás Arantes, irmão de Nina; e Vítor Leme, colecionador que comprou uma obra suspeita. Uma tesoura de poda estava caída ao lado da estátua principal, recém-lavada pela água.',
      suspects: [
        { name: 'Dario Velloso', role: 'Curador', description: 'Organizou a exposição e negociava obras em nome de Nina.' },
        { name: 'Celina Prado', role: 'Paisagista', description: 'Conhecia o desenho do labirinto e os trilhos de drenagem.' },
        { name: 'Tomás Arantes', role: 'Irmão de Nina', description: 'Discutiu com Nina sobre direitos autorais da família.' },
        { name: 'Vítor Leme', role: 'Colecionador', description: 'Comprou uma obra suspeita de autenticidade.' }
      ]
    }
  ];

  for (const caseData of editorialCases) {
    const opening = normalize(caseData.opening);
    for (const suspect of caseData.suspects) {
      const firstName = suspect.name.split(/\s+/)[0];
      assert.match(opening, new RegExp(normalize(firstName)), `${caseData.slug} deveria citar ${suspect.name} no enunciado`);
      assert.ok(String(suspect.role || '').trim().length >= 5, `${caseData.slug} - ${suspect.name} precisa de funcao`);
      assert.ok(String(suspect.description || '').trim().length >= 35, `${caseData.slug} - ${suspect.name} precisa de contexto/motivo possivel`);
    }
  }
});

test('pistas seguem quantidade editorial e nao se repetem por caso', () => {
  const hintsByCase = parseSeedHints();
  const expectedHintCounts = {
    'o-presente-desaparecido': 3,
    'o-guarda-chuva-molhado': 3,
    'o-elevador-que-nao-parou': 3,
    'a-mensagem-das-23h17': 3,
    'o-retrato-que-piscou': 3,
    blackwell: 3,
    'o-quarto-7': 5,
    'a-heranca-de-vidro': 5,
    'o-sino-das-tres-batidas': 5,
    'a-fita-sem-rosto': 5,
    'o-jardim-sem-pegadas': 5
  };

  for (const [slug, expectedCount] of Object.entries(expectedHintCounts)) {
    const hints = hintsByCase.get(slug);
    assert.ok(hints, `${slug} deveria ter pistas cadastradas`);
    assert.equal(hints.length, expectedCount, `${slug} deveria ter ${expectedCount} pistas`);

    const normalizedHints = hints.map(normalize);
    assert.equal(new Set(normalizedHints).size, hints.length, `${slug} nao deveria repetir pistas`);

    for (const hint of hints) {
      const words = normalize(hint).split(/\s+/).filter(Boolean);
      assert.ok(words.length >= 8, `${slug} tem pista curta demais: ${hint}`);
      assert.doesNotMatch(normalize(hint), /culpado e|responsavel e|solucao e/, `${slug} nao deve entregar a solucao direto: ${hint}`);
    }
  }
});

test('formulario final envia quatro campos de resolucao sem duplicar como e porque', () => {
  const formSource = fs.readFileSync(path.join(repoRoot, 'frontend/src/components/FinalTheoryForm.tsx'), 'utf8');

  assert.match(formSource, /const \[why, setWhy\] = useState\(''\)/, 'formulario deve ter estado separado para why');
  assert.match(formSource, /4\. Por que isso aconteceu\?/, 'formulario deve exibir o quarto campo');
  assert.match(formSource, /why:\s*why/, 'envio deve usar why separado');
  assert.doesNotMatch(formSource, /why:\s*how/, 'why nao deve duplicar how');
});

test('tela de jogo renderiza encerramento para status completed', () => {
  const gameSource = fs.readFileSync(path.join(repoRoot, 'frontend/src/pages/Game.tsx'), 'utf8');
  const backendSource = fs.readFileSync(path.join(repoRoot, 'backend/src/index.ts'), 'utf8');

  assert.match(gameSource, /const isGameFinished = status === 'GAME_OVER' \|\| status === 'COMPLETED'/, 'Game deve tratar COMPLETED como fim');
  assert.match(gameSource, /buildPersistedGameResult/, 'Game deve hidratar resultado salvo da sala');
  assert.match(gameSource, /\{isGameFinished && effectiveGameResult && \(/, 'Tela final deve renderizar para COMPLETED e GAME_OVER');
  assert.match(backendSource, /game_result:/, 'Estado da sala deve enviar resultado salvo');
  assert.match(backendSource, /final_evaluations:/, 'Estado da sala deve enviar avaliacoes finais reais');
  assert.match(backendSource, /full_solution_encrypted: _fullSolutionEncrypted/, 'Estado publico deve remover a solucao criptografada bruta');
});

test('feedback de conclusao usa metricas reais da sala', () => {
  const feedbackSource = fs.readFileSync(path.join(repoRoot, 'frontend/src/pages/Feedback.tsx'), 'utf8');

  assert.match(feedbackSource, /summary\?\.result\?\.score \|\| 0/, 'Feedback deve usar score real');
  assert.match(feedbackSource, /summary\?\.result\?\.questionCount \|\| 0/, 'Feedback deve usar perguntas reais');
  assert.match(feedbackSource, /summary\?\.result\?\.hintsUsed \|\| 0/, 'Feedback deve usar pistas reais');
  assert.doesNotMatch(feedbackSource, /18\/29|4\/6|7\/12|A carta anônima|nova pista desbloqueada/, 'Feedback nao deve exibir mocks de progresso');
});

test('pagina de amigos nao cria rede local ficticia', () => {
  const friendsSource = fs.readFileSync(path.join(repoRoot, 'frontend/src/pages/Friends.tsx'), 'utf8');

  assert.doesNotMatch(friendsSource, /uv_friends|uv_friend_invites|localStorage\.setItem|Convite aceito|Primeiro caso/, 'Amigos nao deve persistir amigos ou conquistas ficticias');
  assert.match(friendsSource, /const friends: Friend\[\] = \[\]/, 'Amigos deve permanecer vazio ate existir fonte real');
  assert.match(friendsSource, /rede de amigos será sincronizada quando o serviço estiver ativo/, 'Adicionar amigo deve explicar que a sincronizacao real ainda depende do servico');
});

test('telas imersivas de blackwell nao vazam para outros casos nem entregam solucao fixa', () => {
  const mapSource = fs.readFileSync(path.join(repoRoot, 'frontend/src/pages/MapOverview.tsx'), 'utf8');
  const filesSource = fs.readFileSync(path.join(repoRoot, 'frontend/src/pages/CaseFiles.tsx'), 'utf8');
  const boardSource = fs.readFileSync(path.join(repoRoot, 'frontend/src/pages/InvestigationBoard.tsx'), 'utf8');

  assert.match(mapSource, /caseId !== 'blackwell'/, 'Mapa deve bloquear casos sem mapa imersivo proprio');
  assert.match(filesSource, /caseId === 'blackwell' \? allEvidences\.filter/, 'Inventario deve filtrar evidencias apenas para Blackwell');
  assert.match(boardSource, /caseId !== 'blackwell'/, 'Quadro deve bloquear casos sem quadro imersivo proprio');
  assert.match(boardSource, /visibleCards = cards\.filter/, 'Quadro deve mostrar apenas evidencias desbloqueadas');
  assert.doesNotMatch(boardSource, /Forjou a própria morte|Ajudou na fuga|O motivo:|Fugiram pelo portão/, 'Quadro nao deve exibir spoilers fixos de solucao');
  assert.doesNotMatch(filesSource, /Coletada em \{item\.date\}|12\/05|13\/05|14\/05|15\/05/, 'Inventario nao deve exibir datas ficticias');
});

test('runtime nao exibe abas em construcao nem logs verbosos de debug', () => {
  const boardSource = fs.readFileSync(path.join(repoRoot, 'frontend/src/pages/InvestigationBoard.tsx'), 'utf8');
  const gameSource = fs.readFileSync(path.join(repoRoot, 'frontend/src/pages/Game.tsx'), 'utf8');
  const backendSource = fs.readFileSync(path.join(repoRoot, 'backend/src/index.ts'), 'utf8');

  assert.doesNotMatch(boardSource, /Conteúdo em construção|será implementada na próxima versão|pistas', 'pessoas', 'locais'/, 'Quadro nao deve expor abas sem funcionalidade real');
  assert.doesNotMatch(gameSource, /console\.log\('\[Game\]/, 'Game nao deve manter log de debug com dados de jogadores');
  assert.doesNotMatch(backendSource, /console\.log\(`\[HTTP\]|console\.log\('\[start_game\]|console\.log\(`\[PASS_TURN\]|console\.log\(`\[typing\]/, 'Backend nao deve logar payloads ou eventos verbosos de sala');
});

test('caso guarda-chuva cobre sinonimos e perguntas faceis', () => {
  const samples = [
    ['A água veio da chuva?', 'NO', ['água', 'chuva']],
    ['Tinha goteira no corredor?', 'YES', ['instalação', 'interna']],
    ['Era água do ar condicionado?', 'YES', ['instalação', 'interna']],
    ['O guarda-chuva protegia alguém da chuva?', 'NO', ['proteção', 'chuva']],
    ['A sala tinha teto?', 'YES', ['sala', 'interna']]
  ];

  for (const [question, classification, terms] of samples) {
    const result = processTutorialQuestion(String(question));
    assert.equal(result?.classification, classification, String(question));
    assertIncludesTerms(result?.rendered_text || '', terms, `O Guarda-chuva Molhado - ${question}`);
  }
});

test('caso presente desaparecido cobre sinonimos e perguntas faceis', () => {
  const context = getStaticCaseContext('o-presente-desaparecido');
  const samples = [
    ['Era pegadinha do anfitrião?', 'YES', ['anfitrião', 'caça ao tesouro']],
    ['O presente real estava escondido?', 'YES', ['presente real', 'escondido']],
    ['A embalagem ficou sob a toalha?', 'YES', ['embalagem', 'toalha']],
    ['Alguém roubou o presente?', 'NO', ['ninguém', 'roubou']]
  ];

  for (const [question, classification, terms] of samples) {
    const result = answerWithContext(String(question), context);
    assert.equal(result?.classification, classification, String(question));
    assertIncludesTerms(result?.rendered_text || '', terms, `O Presente Desaparecido - ${question}`);
  }
});

test('caso quarto 7 cobre sinonimos e perguntas medias', () => {
  const context = getStaticCaseContext('o-quarto-7');
  const samples = [
    ['Renato é o responsável?', 'YES', ['Renato', 'chave mestra']],
    ['A porta foi arrombada?', 'NO', ['porta', 'não', 'arrombada']],
    ['Helena tentou se matar?', 'NO', ['bilhete', 'forjado']],
    ['A bebida foi adulterada?', 'YES', ['chá', 'sedativo']],
    ['A escada de serviço era a rota?', 'YES', ['escada', 'serviço']]
  ];

  for (const [question, classification, terms] of samples) {
    const result = answerWithContext(String(question), context);
    assert.equal(result?.classification, classification, String(question));
    assertIncludesTerms(result?.rendered_text || '', terms, `O Quarto 7 - ${question}`);
  }
});

test('caso elevador cobre sinonimos e perguntas medias', () => {
  const context = getStaticCaseContext('o-elevador-que-nao-parou');
  const samples = [
    ['O elevador ficou preso entre andares?', 'YES', ['elevador', 'entre']],
    ['O alçapão do teto estava destrancado?', 'YES', ['alçapão', 'destrancado']],
    ['Ela saiu pelo poço de manutenção?', 'YES', ['rota', 'manutenção']],
    ['Ela saiu em algum andar?', 'NO', ['rota', 'manutenção']],
    ['Ela evaporou?', 'NO', ['não', 'magia']]
  ];

  for (const [question, classification, terms] of samples) {
    const result = answerWithContext(String(question), context);
    assert.equal(result?.classification, classification, String(question));
    assertIncludesTerms(result?.rendered_text || '', terms, `O Elevador que Não Parou - ${question}`);
  }
});

test('caso mensagem 23h17 cobre sinonimos e perguntas medias', () => {
  const context = getStaticCaseContext('a-mensagem-das-23h17');
  const samples = [
    ['A mensagem foi automática?', 'YES', ['mensagem', 'automação']],
    ['Foi programada no computador?', 'YES', ['computador', 'envio']],
    ['O celular ficou carregando?', 'YES', ['celular', 'carregador']],
    ['Ela mandou a mensagem na hora?', 'NO', ['saiu', 'antes']],
    ['Ela já tinha saído antes?', 'YES', ['saiu', 'antes']]
  ];

  for (const [question, classification, terms] of samples) {
    const result = answerWithContext(String(question), context);
    assert.equal(result?.classification, classification, String(question));
    assertIncludesTerms(result?.rendered_text || '', terms, `A Mensagem das 23h17 - ${question}`);
  }
});

test('caso retrato que piscou cobre sinonimos e perguntas medias', () => {
  const context = getStaticCaseContext('o-retrato-que-piscou');
  const samples = [
    ['Foi clarão no vidro?', 'YES', ['reflexo', 'flash']],
    ['O quadro tinha mecanismo?', 'NO', ['mecanismo']],
    ['Foi magia?', 'NO', ['sobrenatural']],
    ['O garçom roubou a joia?', 'YES', ['garçom', 'clarão']],
    ['O flash ofuscou os convidados?', 'YES', ['flash', 'cegou']]
  ];

  for (const [question, classification, terms] of samples) {
    const result = answerWithContext(String(question), context);
    assert.equal(result?.classification, classification, String(question));
    assertIncludesTerms(result?.rendered_text || '', terms, `O Retrato que Piscou - ${question}`);
  }
});

test('caso blackwell cobre sinonimos e perguntas medias', () => {
  const context = getStaticCaseContext('blackwell');
  const samples = [
    ['Clara morreu na sala?', 'NO', ['Clara', 'não', 'morreu']],
    ['O sangue era real?', 'NO', ['sangue', 'artificial']],
    ['Foi sequestro de verdade?', 'NO', ['sumiço', 'encenado']],
    ['Clara fugiu com Helena?', 'YES', ['Clara', 'Helena']],
    ['Tomás desviava fundos?', 'YES', ['Tomás', 'desvio']]
  ];

  for (const [question, classification, terms] of samples) {
    const result = answerWithContext(String(question), context);
    assert.equal(result?.classification, classification, String(question));
    assertIncludesTerms(result?.rendered_text || '', terms, `Blackwell - ${question}`);
  }
});

test('pergunta relacionada mas nao confirmada vira desconhecido em vez de reformulacao', () => {
  const result = processFactBasedQuestion(
    'A porta do quarto foi arrombada?',
    [{ statement: 'A porta foi trancada usando a chave mestra do gerente.' }],
    'Helena Duarte foi encontrada desacordada no Quarto 7.'
  );

  assert.equal(result?.classification, 'UNKNOWN');
  assert.match(result?.rendered_text || '', /Desconhecido/);
});

test('contexto estatico complementa respostas em casos diferentes', () => {
  const samples = [
    ['o-quarto-7', 'A bebida tinha sedativo?', 'YES', ['chá', 'sedativo']],
    ['o-quarto-7', 'O relógio marcava hora falsa?', 'YES', ['relógio', 'hora falsa']],
    ['o-elevador-que-nao-parou', 'Ela saiu pelo teto do elevador?', 'YES', ['alçapão']],
    ['o-presente-desaparecido', 'Foi uma brincadeira?', 'YES', ['anfitrião', 'caça ao tesouro']],
    ['a-mensagem-das-23h17', 'A mensagem foi agendada por script?', 'YES', ['automação', 'agendada']],
    ['a-mensagem-das-23h17', 'Foi enviada por script?', 'YES', ['automação', 'agendada']],
    ['o-retrato-que-piscou', 'O quadro tinha mecanismo?', 'NO', ['retrato', 'mecanismo']],
    ['o-retrato-que-piscou', 'Era sobrenatural?', 'NO', ['sobrenatural', 'luz']],
    ['blackwell', 'O sangue era artificial?', 'YES', ['sangue', 'artificial']],
    ['blackwell', 'O autor usou sangue falso?', 'YES', ['sangue', 'artificial']],
    ['blackwell', 'Foi sequestro real?', 'NO', ['encenado']]
  ];

  for (const [slug, question, classification, terms] of samples) {
    const context = getStaticCaseContext(slug);
    const result = processRuleBasedQuestion(question, context.rules, context.facts);
    assert.equal(result?.classification, classification, slug);
    assertIncludesTerms(result?.rendered_text || '', terms, slug);
  }
});

test('trava anti-spoiler segura perguntas amplas sem bloquear perguntas especificas', () => {
  const context = getStaticCaseContext('o-sino-das-tres-batidas');
  const broad = processRuleBasedQuestion('Quem foi o culpado?', context.rules, context.facts);
  assert.equal(broad?.classification, 'UNKNOWN');
  assertIncludesTerms(broad?.rendered_text || '', ['ampla', 'fato específico'], 'Anti-spoiler amplo');
  assert.equal(isBroadSolutionQuestion('Quem foi o culpado?'), true);

  const solving = processRuleBasedQuestion('Quem foi o culpado?', context.rules, context.facts, 'SOLVING');
  assert.equal(solving?.classification, 'UNKNOWN');
  assertIncludesTerms(solving?.rendered_text || '', ['relatório final', 'teoria'], 'Anti-spoiler em formulacao');

  const reveal = processRuleBasedQuestion('Quem foi o culpado?', context.rules, context.facts, 'REVEAL');
  assert.equal(reveal?.classification, 'UNKNOWN');
  assertIncludesTerms(reveal?.rendered_text || '', ['relatório final', 'solução'], 'Anti-spoiler em revelacao');

  const completed = processRuleBasedQuestion('Quem foi o culpado?', context.rules, context.facts, 'COMPLETED');
  assert.equal(completed?.classification, 'UNKNOWN');
  assertIncludesTerms(completed?.rendered_text || '', ['relatório final', 'solução'], 'Anti-spoiler em caso concluido');

  const specific = processRuleBasedQuestion('Lúcia tinha motivo?', context.rules, context.facts);
  assert.equal(specific?.classification, 'YES');
  assertIncludesTerms(specific?.rendered_text || '', ['Lúcia', 'documentos'], 'Pergunta especifica');
  assert.equal(isBroadSolutionQuestion('Lúcia tinha motivo?'), false);
});

test('respostas do mestre sao reduzidas para uma frase curta', () => {
  const result = toConciseMasterText('Sim.', 'Esse fato aparece no arquivo. Esta segunda frase não deve aparecer.');
  assert.equal(result, 'Sim. Esse fato aparece no arquivo.');
  assert.ok(result.length <= 180);
});

test('avaliacao da teoria aplica travas para campos vazios ou curtos demais', () => {
  const guarded = applyTheoryScoreGuards(
    { what_happened: 95, who: 100, how: 90, why: 85 },
    {
      what_happened: '',
      who: 'Lúcia',
      how: 'linha',
      why: 'venda'
    }
  );

  assert.equal(guarded.what_happened, 0);
  assert.equal(guarded.who, 80);
  assert.equal(guarded.how, 45);
  assert.equal(guarded.why, 45);
  assert.equal(calculateTheoryScore(guarded), 43);
});

test('avaliacao da teoria limita acertos sem mecanismo coerente', () => {
  const guarded = applyTheoryScoreGuards(
    { what_happened: 100, who: 100, how: 40, why: 90 },
    {
      what_happened: 'O sino foi acionado de fora da torre',
      who: 'Lúcia Ferraz',
      how: 'por alguma coisa',
      why: 'ocultar a venda fraudulenta da escola'
    }
  );

  assert.equal(guarded.what_happened, 80);
  assert.equal(guarded.who, 80);
  assert.equal(guarded.how, 40);
  assert.equal(guarded.why, 90);
  assert.equal(calculateTheoryScore(guarded), 68);
});

test('esclarecimento e contestacao produzem revisoes uteis', () => {
  const yesClarification = buildClarificationText('O relógio estava adiantado?', {
    classification: 'YES',
    rendered_text: 'Sim. O relógio do conservatório estava adiantado em 18 minutos.'
  });
  assertIncludesTerms(yesClarification, ['Confirma', 'relógio', 'adiantado'], 'Esclarecimento positivo');

  const noClarification = buildClarificationText('A tempestade matou Isadora?', {
    classification: 'NO',
    rendered_text: 'Não. A tempestade reforçou a cena, mas não foi a causa real da morte.'
  });
  assertIncludesTerms(noClarification, ['Nega', 'tempestade', 'não'], 'Esclarecimento negativo');

  const clarification = buildClarificationText('Nina teve ajuda para desaparecer?', {
    classification: 'PARTIAL',
    rendered_text: 'Parcialmente. O arquivo indica interferência de outra pessoa no desaparecimento.'
  });
  assertIncludesTerms(clarification, ['parte correta', 'interferência'], 'Esclarecimento parcial');

  const contestation = buildContestationText(
    { classification: 'UNKNOWN', rendered_text: 'Desconhecido. O arquivo não confirma essa hipótese neste momento.' },
    { classification: 'YES', rendered_text: 'Sim. A pessoa ligada à exposição de Nina tem relação relevante com o desaparecimento.' }
  );
  assertIncludesTerms(contestation, ['Aceita', 'Resposta corrigida'], 'Contestacao corrigida');
});
