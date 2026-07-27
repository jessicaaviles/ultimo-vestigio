import test from 'node:test';
import assert from 'node:assert/strict';
import { processFactBasedQuestion } from '../dist/services/aiMaster.js';

const caseSamples = [
  {
    title: 'O Presente Desaparecido',
    opening: 'Durante uma comemoração em família, a caixa de presente sobre a mesa desaparece diante de todos.',
    facts: [
      'A caixa estava vazia desde antes.',
      'O anfitrião planejou a ação.',
      'A caixa foi colocada sob a toalha da mesa.'
    ],
    question: 'A caixa estava vazia desde o começo?'
  },
  {
    title: 'O Quarto 7',
    opening: 'Helena Duarte foi encontrada desacordada no Quarto 7 do Hotel Vesper.',
    facts: [
      'A porta foi trancada usando a chave mestra do gerente.',
      'O chá servido a Helena continha sedativo em dose não letal.',
      'O gerente queria impedir que Helena provasse a inocência do pai.'
    ],
    question: 'O chá servido para Helena tinha sedativo?'
  },
  {
    title: 'O Elevador que Não Parou',
    opening: 'Uma mulher entra sozinha em um elevador no térreo.',
    facts: [
      'O alçapão no teto do elevador estava destrancado.',
      'O elevador parou por 3 minutos entre o segundo e o terceiro andar.',
      'A mulher conhecia a rota de manutenção interna do poço do elevador.'
    ],
    question: 'O elevador parou entre dois andares?'
  },
  {
    title: 'A Mensagem das 23h17',
    opening: 'Às 23h17, uma pessoa desaparecida envia uma mensagem.',
    facts: [
      'A mensagem foi enviada via script agendado do computador da vítima.',
      'A vítima saiu de casa voluntariamente horas antes do envio.',
      'O computador da vítima estava ligado e conectado à mesma rede.'
    ],
    question: 'A mensagem foi enviada por um script agendado?'
  },
  {
    title: 'O Retrato que Piscou',
    opening: 'Todos veem o retrato antigo da sala piscar.',
    facts: [
      'O piscar foi um reflexo no vidro ou verniz do retrato, provocado por um flash externo.',
      'Todos os convidados sofreram de cegueira temporária por 3 segundos.',
      'O garçom aproximou-se da mesa exatamente no instante do clarão.'
    ],
    question: 'O retrato piscou por causa de um reflexo no vidro?'
  },
  {
    title: 'Mansão Blackwell',
    opening: 'Clara Mendes foi vista pela última vez na sala de estar.',
    facts: [
      'O sangue na poltrona da sala de estar era artificial.',
      'Clara e Helena fugiram juntas pelos jardins da mansão.',
      'O livro-caixa desenterrado no jardim prova que Tomás desviava fundos.'
    ],
    question: 'O sangue na poltrona era artificial?'
  },
  {
    title: 'A Herança de Vidro',
    opening: 'Isadora Vale foi encontrada morta no conservatório da Casa Alvarenga.',
    facts: [
      'A taça de Isadora continha traços de digitalina misturados ao vinho.',
      'O relógio do conservatório estava adiantado em 18 minutos desde a manutenção da tarde.',
      'A porta foi trancada por dentro usando o fio, que depois foi puxado para fora pela drenagem.'
    ],
    question: 'A taça de Isadora tinha digitalina no vinho?'
  },
  {
    title: 'O Sino das Três Batidas',
    opening: 'O sino da torre desativado tocou três vezes.',
    facts: [
      'A poeira na fechadura e no batente da torre estava intacta; ninguém abriu a porta naquela noite.',
      'Uma fibra transparente ficou presa no badalo do sino.',
      'Um conduíte antigo liga o arquivo morto à torre do sino.'
    ],
    question: 'Tinha uma fibra transparente no badalo do sino?'
  },
  {
    title: 'A Fita Sem Rosto',
    opening: 'A câmera mostra uma figura de jaleco atravessando o corredor sem rosto identificável.',
    facts: [
      'O notebook de Bruno registrou uso de câmera virtual entre 22h06 e 22h19.',
      'Fragmentos de filme reflexivo foram encontrados na lixeira técnica.',
      'Um token manual de manutenção foi emitido por Bruno às 22h11.'
    ],
    question: 'Bruno usou câmera virtual na videoconferência?'
  },
  {
    title: 'O Jardim Sem Pegadas',
    opening: 'Nina Arantes desapareceu de um jardim-labirinto encharcado sem deixar pegadas.',
    facts: [
      'O labirinto possui trilhos de drenagem sob o cascalho central.',
      'As marcas recentes nos trilhos correspondem ao carrinho estreito de manutenção.',
      'A lona tinha odor de spray anestésico usado em restauração de peças.'
    ],
    question: 'Os trilhos de drenagem explicam a falta de pegadas?'
  }
];

test('perguntas plausiveis de todos os casos nao pedem reformulacao', () => {
  for (const sample of caseSamples) {
    const result = processFactBasedQuestion(
      sample.question,
      sample.facts.map((statement) => ({ statement })),
      sample.opening
    );

    assert.ok(result, `${sample.title} deveria gerar uma resposta local`);
    assert.notEqual(result.classification, 'AMBIGUOUS', sample.title);
    assert.notEqual(result.classification, 'MULTI_PREMISE', sample.title);
    assert.notEqual(result.classification, 'BLOCKED', sample.title);
    assert.equal(result.fallback_used, false, sample.title);
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
