import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildClarificationText,
  buildContestationText,
  getStaticCaseContext,
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
    ['Nina teve ajuda para desaparecer?', 'PARTIAL', ['interferência', 'outra pessoa']],
    ['Nina desapareceu mesmo?', 'YES', ['desaparecimento', 'Nina']],
    ['Quem contratou a Nina tem haver com o desaparecimento dela?', 'YES', ['curador', 'exposição', 'desaparecimento']],
    ['O curador tinha motivo para sumir com Nina?', 'YES', ['curador', 'obras falsas', 'motivo']],
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
    ['Usaram um carrinho de manutenção?', 'YES', ['carrinho', 'trilhos']],
    ['A lona tinha produto químico?', 'YES', ['lona', 'odor químico']],
    ['As luzes apagadas importam?', 'YES', ['iluminação', 'janela']],
    ['Os refletores desligados importam?', 'YES', ['iluminação', 'janela']]
  ];

  for (const [question, classification, terms] of samples) {
    const result = processGardenQuestion(String(question));
    assert.equal(result?.classification, classification, String(question));
    assertIncludesTerms(result?.rendered_text || '', terms, `O Jardim Sem Pegadas - ${question}`);
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
    ['o-elevador-que-nao-parou', 'Ela saiu pelo teto do elevador?', 'YES', ['alçapão']],
    ['a-mensagem-das-23h17', 'A mensagem foi agendada por script?', 'YES', ['automação', 'agendada']],
    ['o-retrato-que-piscou', 'O quadro tinha mecanismo?', 'NO', ['retrato', 'mecanismo']],
    ['blackwell', 'O sangue era artificial?', 'YES', ['sangue', 'artificial']],
    ['blackwell', 'O autor usou sangue falso?', 'YES', ['sangue', 'artificial']]
  ];

  for (const [slug, question, classification, terms] of samples) {
    const context = getStaticCaseContext(slug);
    const result = processRuleBasedQuestion(question, context.rules, context.facts);
    assert.equal(result?.classification, classification, slug);
    assertIncludesTerms(result?.rendered_text || '', terms, slug);
  }
});

test('respostas do mestre sao reduzidas para uma frase curta', () => {
  const result = toConciseMasterText('Sim.', 'Esse fato aparece no arquivo. Esta segunda frase não deve aparecer.');
  assert.equal(result, 'Sim. Esse fato aparece no arquivo.');
  assert.ok(result.length <= 180);
});

test('esclarecimento e contestacao produzem revisoes uteis', () => {
  const clarification = buildClarificationText('Nina teve ajuda para desaparecer?', {
    classification: 'PARTIAL',
    rendered_text: 'Parcialmente. O arquivo indica interferência de outra pessoa no desaparecimento.'
  });
  assertIncludesTerms(clarification, ['parte correta', 'conclusão'], 'Esclarecimento parcial');

  const contestation = buildContestationText(
    { classification: 'UNKNOWN', rendered_text: 'Desconhecido. O arquivo não confirma essa hipótese neste momento.' },
    { classification: 'YES', rendered_text: 'Sim. A pessoa ligada à exposição de Nina tem relação relevante com o desaparecimento.' }
  );
  assertIncludesTerms(contestation, ['Revisão aceita', 'Resposta corrigida'], 'Contestacao corrigida');
});
