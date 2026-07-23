import { PrismaClient } from '@prisma/client';
import { sealSecret } from '../src/security/secrets';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed do banco de dados...');

  // 1. Criar o Caso: O Presente Desaparecido
  const caso = await prisma.cases.upsert({
    where: { slug: 'o-presente-desaparecido' },
    update: {},
    create: {
      slug: 'o-presente-desaparecido',
      title: 'O Presente Desaparecido',
      short_synopsis: 'Durante uma comemoração em família, um presente desaparece de uma mesa diante de todos. Ninguém saiu do ambiente.',
      case_type: 'Rápido',
      difficulty: 'Fácil',
      estimated_duration_minutes: 8,
      min_players: 2,
      max_players: 6,
      tension_level: 1,
      status: 'PUBLISHED'
    }
  });

  // 2. Criar a Versão do Caso
  const caseVersion = await prisma.case_versions.upsert({
    where: {
      case_id_version_number: {
        case_id: caso.id,
        version_number: '1.0'
      }
    },
    update: {
      solution_summary_encrypted: sealSecret('O anfitrião planejou iniciar uma caça ao tesouro e guardou a caixa sob a toalha.'),
      full_solution_encrypted: sealSecret('A caixa era apenas cenográfica (sem presente dentro). O anfitrião (responsável), dobrou a caixa vazia de papel e colocou sob a toalha da mesa durante o brinde como distração, para iniciar uma caça ao tesouro.'),
      chronology_encrypted: sealSecret(JSON.stringify([]))
    },
    create: {
      case_id: caso.id,
      version_number: '1.0',
      opening: 'Durante uma comemoração em família, um presente desaparece de uma mesa diante de todos. Ninguém saiu do ambiente e nenhuma pessoa admite ter tocado na caixa.',
      master_style: JSON.stringify({ tone: "familiar", humorAllowed: false, maxSentences: 2 }),
      scoring_rules: JSON.stringify({ baseScore: 1000, penaltyPerHint: 100 }),
       solution_summary_encrypted: sealSecret('O anfitrião planejou iniciar uma caça ao tesouro e guardou a caixa sob a toalha.'),
       full_solution_encrypted: sealSecret('A caixa era apenas cenográfica (sem presente dentro). O anfitrião (responsável), dobrou a caixa vazia de papel e colocou sob a toalha da mesa durante o brinde como distração, para iniciar uma caça ao tesouro.'),
       chronology_encrypted: sealSecret(JSON.stringify([])),
      publication_status: 'PUBLISHED',
      published_at: new Date()
    }
  });

  // 3. Fatos Essenciais (case_facts)
  const facts = [
    { fact_key: 'no_theft', statement: 'Ninguém roubou o conteúdo naquele momento.', visibility: 'ANSWER', pre_unlock_policy: 'ANSWER' },
    { fact_key: 'box_was_empty', statement: 'A caixa estava vazia desde antes.', visibility: 'ANSWER', pre_unlock_policy: 'ANSWER' },
    { fact_key: 'host_action', statement: 'O anfitrião planejou a ação.', visibility: 'ANSWER', pre_unlock_policy: 'ANSWER' },
    { fact_key: 'present_hidden', statement: 'O presente real estava escondido em outro lugar da casa.', visibility: 'ANSWER', pre_unlock_policy: 'ANSWER' },
    { fact_key: 'box_folded', statement: 'A caixa era de papel rígido e foi dobrada.', visibility: 'ANSWER', pre_unlock_policy: 'ANSWER' },
    { fact_key: 'hid_under_table', statement: 'A caixa foi colocada sob a toalha da mesa.', visibility: 'ANSWER', pre_unlock_policy: 'ANSWER' }
  ];

  for (const f of facts) {
    await prisma.case_facts.upsert({
      where: {
        case_version_id_fact_key: {
          case_version_id: caseVersion.id,
          fact_key: f.fact_key
        }
      },
      update: {},
      create: {
        case_version_id: caseVersion.id,
        fact_key: f.fact_key,
        statement: f.statement,
        visibility: f.visibility,
        pre_unlock_policy: f.pre_unlock_policy,
        is_solution_critical: true
      }
    });
  }

  // Caso oficial da direção de arte: O Quarto 7.
  const officialCase = await prisma.cases.upsert({
    where: { slug: 'o-quarto-7' },
    update: { status: 'PUBLISHED' },
    create: {
      slug: 'o-quarto-7',
      title: 'O Quarto 7',
      short_synopsis: 'Helena Duarte foi encontrada no Hotel Vesper. Uma chave, uma câmera e um relógio quebrado aguardam uma explicação.',
      case_type: 'Caso Oficial', difficulty: 'Fácil', estimated_duration_minutes: 20, min_players: 2, max_players: 6, tension_level: 3, status: 'PUBLISHED'
    }
  });
  const officialVersion = await prisma.case_versions.upsert({
    where: { case_id_version_number: { case_id: officialCase.id, version_number: '1.0' } },
    update: {},
    create: {
      case_id: officialCase.id, version_number: '1.0',
      opening: 'Helena Duarte foi encontrada no Hotel Vesper. A porta do Quarto 7 estava trancada, uma câmera apontava para o corredor e um relógio quebrado marcava 23h17.',
      master_style: JSON.stringify({ tone: 'investigative', maxSentences: 2 }), scoring_rules: JSON.stringify({ baseScore: 1000, penaltyPerHint: 100 }),
      solution_summary_encrypted: sealSecret('A cena foi preparada para parecer um quarto trancado por dentro.'),
      full_solution_encrypted: sealSecret('O gerente do Hotel Vesper usou uma chave reserva para entrar no Quarto 7, posicionou a câmera para criar um álibi e quebrou o relógio durante a encenação. O bilhete e a digital parcial ligam a preparação ao gerente.'),
      chronology_encrypted: sealSecret(JSON.stringify([{ time: '23h17', event: 'A câmera registra o corredor' }])), publication_status: 'PUBLISHED', published_at: new Date()
    }
  });
  const officialFacts = [
    ['door_locked', 'A porta foi trancada usando uma chave reserva.', 'ANSWER'],
    ['camera_positioned', 'A câmera foi posicionada para produzir um álibi.', 'ANSWER'],
    ['broken_clock', 'O relógio foi quebrado durante a encenação.', 'ANSWER'],
    ['partial_fingerprint', 'A digital parcial pertence ao gerente do hotel.', 'ANSWER'],
    ['note_relevant', 'O bilhete foi deixado para direcionar a investigação.', 'ANSWER']
  ];
  for (const [fact_key, statement, visibility] of officialFacts) await prisma.case_facts.upsert({ where: { case_version_id_fact_key: { case_version_id: officialVersion.id, fact_key } }, update: {}, create: { case_version_id: officialVersion.id, fact_key, statement, visibility, pre_unlock_policy: 'ANSWER', is_solution_critical: true } });

  // 4. Caso: O Guarda-chuva Molhado
  const caseGuardaChuva = await prisma.cases.upsert({
    where: { slug: 'o-guarda-chuva-molhado' },
    update: { status: 'PUBLISHED' },
    create: {
      slug: 'o-guarda-chuva-molhado',
      title: 'O Guarda-chuva Molhado',
      short_synopsis: 'Uma pessoa entra em uma sala vazia e encontra um guarda-chuva completamente molhado. O céu está limpo.',
      case_type: 'Caso Tutorial', difficulty: 'Muito fácil', estimated_duration_minutes: 5, min_players: 2, max_players: 6, tension_level: 1, status: 'PUBLISHED'
    }
  });
  const versionGuardaChuva = await prisma.case_versions.upsert({
    where: { case_id_version_number: { case_id: caseGuardaChuva.id, version_number: '1.0' } },
    update: {},
    create: {
      case_id: caseGuardaChuva.id, version_number: '1.0',
      opening: 'Uma pessoa entra em uma sala vazia e encontra um guarda-chuva completamente molhado. O céu está limpo e não choveu naquele dia.',
      master_style: JSON.stringify({ tone: 'investigative', maxSentences: 2 }), scoring_rules: JSON.stringify({ baseScore: 1000, penaltyPerHint: 100 }),
      solution_summary_encrypted: sealSecret('O guarda-chuva estava molhado porque foi usado para se proteger do ar condicionado com vazamento.'),
      full_solution_encrypted: sealSecret('A pessoa usou o guarda-chuva dentro do próprio prédio comercial para se proteger de um forte vazamento de água na tubulação do ar condicionado no corredor antes de entrar na sala.'),
      chronology_encrypted: sealSecret(JSON.stringify([])), publication_status: 'PUBLISHED', published_at: new Date()
    }
  });
  const factsGuardaChuva = [
    ['no_rain', 'Não choveu na região durante todo o dia.', 'ANSWER'],
    ['ac_leak', 'Havia um vazamento grave na tubulação de ar condicionado do corredor.', 'ANSWER'],
    ['umbrella_used_inside', 'O guarda-chuva foi aberto e utilizado dentro do prédio.', 'ANSWER']
  ];
  for (const [fact_key, statement, visibility] of factsGuardaChuva) await prisma.case_facts.upsert({ where: { case_version_id_fact_key: { case_version_id: versionGuardaChuva.id, fact_key } }, update: {}, create: { case_version_id: versionGuardaChuva.id, fact_key, statement, visibility, pre_unlock_policy: 'ANSWER', is_solution_critical: true } });

  // 5. Caso: O Elevador que Não Parou
  const caseElevador = await prisma.cases.upsert({
    where: { slug: 'o-elevador-que-nao-parou' },
    update: { status: 'PUBLISHED' },
    create: {
      slug: 'o-elevador-que-nao-parou',
      title: 'O Elevador que Não Parou',
      short_synopsis: 'Uma mulher entra sozinha em um elevador, mas quando ele retorna ao térreo, está vazio.',
      case_type: 'Caso Rápido', difficulty: 'Média', estimated_duration_minutes: 10, min_players: 2, max_players: 6, tension_level: 3, status: 'PUBLISHED'
    }
  });
  const versionElevador = await prisma.case_versions.upsert({
    where: { case_id_version_number: { case_id: caseElevador.id, version_number: '1.0' } },
    update: {},
    create: {
      case_id: caseElevador.id, version_number: '1.0',
      opening: 'Uma mulher entra sozinha em um elevador no térreo. As câmeras mostram as portas se fechando, mas o elevador não para em nenhum andar e, quando retorna ao térreo, está vazio.',
      master_style: JSON.stringify({ tone: 'investigative', maxSentences: 2 }), scoring_rules: JSON.stringify({ baseScore: 1000, penaltyPerHint: 100 }),
      solution_summary_encrypted: sealSecret('A mulher saiu pelo alçapão do elevador que ficou preso entre dois andares por alguns minutos.'),
      full_solution_encrypted: sealSecret('O elevador foi parado intencionalmente entre o 2º e o 3º andar. A mulher escapou pelo alçapão do teto do elevador, acessando o poço de manutenção do prédio para sair sem ser vista pelas câmeras dos andares.'),
      chronology_encrypted: sealSecret(JSON.stringify([])), publication_status: 'PUBLISHED', published_at: new Date()
    }
  });
  const factsElevador = [
    ['trapdoor_open', 'O alçapão no teto do elevador estava destrancado.', 'ANSWER'],
    ['stopped_between', 'O elevador parou por 3 minutos entre o segundo e o terceiro andar.', 'ANSWER'],
    ['maintenance_exit', 'A mulher conhecia a rota de manutenção interna do poço do elevador.', 'ANSWER']
  ];
  for (const [fact_key, statement, visibility] of factsElevador) await prisma.case_facts.upsert({ where: { case_version_id_fact_key: { case_version_id: versionElevador.id, fact_key } }, update: {}, create: { case_version_id: versionElevador.id, fact_key, statement, visibility, pre_unlock_policy: 'ANSWER', is_solution_critical: true } });

  // 6. Caso: A Mensagem das 23h17
  const caseMensagem = await prisma.cases.upsert({
    where: { slug: 'a-mensagem-das-23h17' },
    update: { status: 'PUBLISHED' },
    create: {
      slug: 'a-mensagem-das-23h17',
      title: 'A Mensagem das 23h17',
      short_synopsis: 'Às 23h17, uma mensagem é enviada do celular de uma pessoa desaparecida enquanto o aparelho estava no carregador.',
      case_type: 'Caso Rápido', difficulty: 'Difícil', estimated_duration_minutes: 12, min_players: 3, max_players: 6, tension_level: 4, status: 'PUBLISHED'
    }
  });
  const versionMensagem = await prisma.case_versions.upsert({
    where: { case_id_version_number: { case_id: caseMensagem.id, version_number: '1.0' } },
    update: {},
    create: {
      case_id: caseMensagem.id, version_number: '1.0',
      opening: 'Às 23h17, uma pessoa desaparecida envia uma mensagem dizendo: "Agora todos vão entender". Poucos minutos depois, desaparece. O celular é encontrado em casa no carregador.',
      master_style: JSON.stringify({ tone: 'investigative', maxSentences: 2 }), scoring_rules: JSON.stringify({ baseScore: 1000, penaltyPerHint: 100 }),
      solution_summary_encrypted: sealSecret('A mensagem foi enviada usando um agendamento de mensagens prévio ou aplicativo sincronizado no computador.'),
      full_solution_encrypted: sealSecret('A vítima planejou seu sumiço voluntário. Ela saiu de casa às 22h, deixando o celular carregando, mas agendou a mensagem de texto para ser enviada automaticamente às 23h17 usando um script de automação para simular que ainda estava lá.'),
      chronology_encrypted: sealSecret(JSON.stringify([])), publication_status: 'PUBLISHED', published_at: new Date()
    }
  });
  const factsMensagem = [
    ['scheduled_sms', 'A mensagem foi enviada via script agendado do computador da vítima.', 'ANSWER'],
    ['voluntary_departure', 'A vítima saiu de casa voluntariamente horas antes do envio.', 'ANSWER'],
    ['pc_turned_on', 'O computador da vítima estava ligado e conectado à mesma rede.', 'ANSWER']
  ];
  for (const [fact_key, statement, visibility] of factsMensagem) await prisma.case_facts.upsert({ where: { case_version_id_fact_key: { case_version_id: versionMensagem.id, fact_key } }, update: {}, create: { case_version_id: versionMensagem.id, fact_key, statement, visibility, pre_unlock_policy: 'ANSWER', is_solution_critical: true } });

  // 7. Caso: O Retrato que Piscou
  const caseRetrato = await prisma.cases.upsert({
    where: { slug: 'o-retrato-que-piscou' },
    update: { status: 'PUBLISHED' },
    create: {
      slug: 'o-retrato-que-piscou',
      title: 'O Retrato que Piscou',
      short_synopsis: 'Todos veem o retrato piscar e uma joia desaparece. A pintura não possui mecanismos.',
      case_type: 'Caso Rápido', difficulty: 'Sobrenatural', estimated_duration_minutes: 10, min_players: 2, max_players: 6, tension_level: 3, status: 'PUBLISHED'
    }
  });
  const versionRetrato = await prisma.case_versions.upsert({
    where: { case_id_version_number: { case_id: caseRetrato.id, version_number: '1.0' } },
    update: {},
    create: {
      case_id: caseRetrato.id, version_number: '1.0',
      opening: 'Durante um jantar, todos veem o retrato antigo da sala piscar. Segundos depois, uma joia desaparece de uma mesa próxima. A pintura não possui mecanismos.',
      master_style: JSON.stringify({ tone: 'investigative', maxSentences: 2 }), scoring_rules: JSON.stringify({ baseScore: 1000, penaltyPerHint: 100 }),
      solution_summary_encrypted: sealSecret('O "piscar" foi o reflexo de um flash de câmera usado para cegar momentaneamente os convidados enquanto o garçom roubava a joia.'),
      full_solution_encrypted: sealSecret('Um garçom cúmplice utilizou um pequeno emissor de flash de alta intensidade escondido na moldura do retrato antigo para criar um clarão forte (cegando todos por um instante). Nesse piscar de olhos, ele pegou a joia da mesa próxima.'),
      chronology_encrypted: sealSecret(JSON.stringify([])), publication_status: 'PUBLISHED', published_at: new Date()
    }
  });
  const factsRetrato = [
    ['flash_reflection', 'O piscar do retrato foi um clarão óptico de alta intensidade direcionado.', 'ANSWER'],
    ['temporary_blindness', 'Todos os convidados sofreram de cegueira temporária por 3 segundos.', 'ANSWER'],
    ['waiter_accomplice', 'O garçom aproximou-se da mesa exatamente no instante do clarão.', 'ANSWER']
  ];
  for (const [fact_key, statement, visibility] of factsRetrato) await prisma.case_facts.upsert({ where: { case_version_id_fact_key: { case_version_id: versionRetrato.id, fact_key } }, update: {}, create: { case_version_id: versionRetrato.id, fact_key, statement, visibility, pre_unlock_policy: 'ANSWER', is_solution_critical: true } });

  // 8. Caso: Mansão Blackwell (blackwell)
  const caseBlackwell = await prisma.cases.upsert({
    where: { slug: 'blackwell' },
    update: { status: 'PUBLISHED' },
    create: {
      slug: 'blackwell',
      title: 'Mansão Blackwell',
      short_synopsis: 'Investigue o sumiço misterioso de Clara Mendes na mansão da família Blackwell.',
      case_type: 'Investigação', difficulty: 'Médio', estimated_duration_minutes: 30, min_players: 2, max_players: 6, tension_level: 2, status: 'PUBLISHED'
    }
  });
  const versionBlackwell = await prisma.case_versions.upsert({
    where: { case_id_version_number: { case_id: caseBlackwell.id, version_number: '1.0' } },
    update: {},
    create: {
      case_id: caseBlackwell.id, version_number: '1.0',
      opening: 'Clara Mendes foi vista pela última vez na sala de estar. Pistas se espalham pela mansão aguardando análise para desvendar o mistério.',
      master_style: JSON.stringify({ tone: 'investigative', maxSentences: 2 }), scoring_rules: JSON.stringify({ baseScore: 1000, penaltyPerHint: 100 }),
      solution_summary_encrypted: sealSecret('Clara Mendes simulou o próprio sequestro com ajuda de Helena para incriminar Tomás pelos desvios financeiros.'),
      full_solution_encrypted: sealSecret('Clara forjou a própria morte/sequestro usando sangue artificial na poltrona e fugiu pelo portão com Helena, deixando pistas falsas para incriminar o Sr. Tomás pelos desvios de fundos documentados no livro-caixa.'),
      chronology_encrypted: sealSecret(JSON.stringify([])), publication_status: 'PUBLISHED', published_at: new Date()
    }
  });
  const factsBlackwell = [
    ['fake_blood', 'O sangue na poltrona da sala de estar era artificial.', 'ANSWER'],
    ['escape_garden', 'Clara e Helena fugiram juntas pelos jardins da mansão.', 'ANSWER'],
    ['financial_motive', 'O livro-caixa desenterrado no jardim prova que Tomás desviava fundos.', 'ANSWER']
  ];
  for (const [fact_key, statement, visibility] of factsBlackwell) await prisma.case_facts.upsert({ where: { case_version_id_fact_key: { case_version_id: versionBlackwell.id, fact_key } }, update: {}, create: { case_version_id: versionBlackwell.id, fact_key, statement, visibility, pre_unlock_policy: 'ANSWER', is_solution_critical: true } });

  console.log('Seed dos casos oficiais concluído!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
