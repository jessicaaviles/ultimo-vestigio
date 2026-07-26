import { PrismaClient } from '@prisma/client';
import { sealSecret } from '../src/security/secrets';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed do banco de dados...');

  // 1. Criar o Caso: O Presente Desaparecido
  const caso = await prisma.cases.upsert({
    where: { slug: 'o-presente-desaparecido' },
    update: {
      short_synopsis: 'Durante uma comemoração em família, a caixa de presente sobre a mesa desaparece diante de todos. Ninguém saiu do ambiente.',
      status: 'PUBLISHED'
    },
    create: {
      slug: 'o-presente-desaparecido',
      title: 'O Presente Desaparecido',
      short_synopsis: 'Durante uma comemoração em família, a caixa de presente sobre a mesa desaparece diante de todos. Ninguém saiu do ambiente.',
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
      opening: 'Durante uma comemoração em família, a caixa de presente sobre a mesa desaparece diante de todos. Ninguém saiu do ambiente e nenhuma pessoa admite ter tocado na caixa.',
      solution_summary_encrypted: sealSecret('Não houve roubo: o presente real nunca esteve naquela caixa, e o anfitrião dobrou a embalagem cenográfica sob a toalha para iniciar uma caça ao tesouro.'),
      full_solution_encrypted: sealSecret('A caixa sobre a mesa era apenas uma embalagem cenográfica vazia. Durante o brinde, o anfitrião dobrou a caixa de papel rígido e a colocou sob a toalha da mesa, usando a distração para iniciar uma caça ao tesouro com o presente real escondido em outro lugar da casa.'),
      chronology_encrypted: sealSecret(JSON.stringify([]))
    },
    create: {
      case_id: caso.id,
      version_number: '1.0',
      opening: 'Durante uma comemoração em família, a caixa de presente sobre a mesa desaparece diante de todos. Ninguém saiu do ambiente e nenhuma pessoa admite ter tocado na caixa.',
      master_style: JSON.stringify({ tone: "familiar", humorAllowed: false, maxSentences: 2 }),
      scoring_rules: JSON.stringify({ baseScore: 1000, penaltyPerHint: 100 }),
       solution_summary_encrypted: sealSecret('Não houve roubo: o presente real nunca esteve naquela caixa, e o anfitrião dobrou a embalagem cenográfica sob a toalha para iniciar uma caça ao tesouro.'),
       full_solution_encrypted: sealSecret('A caixa sobre a mesa era apenas uma embalagem cenográfica vazia. Durante o brinde, o anfitrião dobrou a caixa de papel rígido e a colocou sob a toalha da mesa, usando a distração para iniciar uma caça ao tesouro com o presente real escondido em outro lugar da casa.'),
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
    update: {
      short_synopsis: 'Helena Duarte foi encontrada desacordada no Quarto 7 do Hotel Vesper após ameaçar revelar um escândalo antigo. Uma chave mestra, uma câmera reposicionada e um relógio quebrado escondem o verdadeiro motivo.',
      status: 'PUBLISHED'
    },
    create: {
      slug: 'o-quarto-7',
      title: 'O Quarto 7',
      short_synopsis: 'Helena Duarte foi encontrada desacordada no Quarto 7 do Hotel Vesper após ameaçar revelar um escândalo antigo. Uma chave mestra, uma câmera reposicionada e um relógio quebrado escondem o verdadeiro motivo.',
      case_type: 'Caso Oficial', difficulty: 'Fácil', estimated_duration_minutes: 20, min_players: 2, max_players: 6, tension_level: 3, status: 'PUBLISHED'
    }
  });
  const officialVersion = await prisma.case_versions.upsert({
    where: { case_id_version_number: { case_id: officialCase.id, version_number: '1.0' } },
    update: {
      opening: 'Helena Duarte foi encontrada desacordada no Quarto 7 do Hotel Vesper. A porta estava trancada por dentro, a câmera do corredor apontava para um ângulo inútil e o relógio quebrado marcava 23h17. Horas antes, Helena havia dito que revelaria "o que o hotel fez com a família dela".',
      solution_summary_encrypted: sealSecret('O gerente do Hotel Vesper encenou o quarto trancado para silenciar Helena, que havia descoberto provas de desvio de verbas de manutenção ligado à morte do pai dela.'),
      full_solution_encrypted: sealSecret('Helena Duarte voltou ao Hotel Vesper para confrontar o gerente Renato Álvares com documentos que provavam o desvio de verbas de manutenção. O pai de Helena havia sido culpado injustamente por um acidente antigo no hotel, mas os registros mostravam que Renato cortou custos e ocultou laudos para proteger a reputação do Vesper. Com medo de prisão, falência do hotel e exposição pública, Renato serviu chá com sedativo a Helena, entrou no Quarto 7 usando uma chave mestra, trancou a porta para simular um mistério impossível e reposicionou a câmera do corredor para esconder sua rota pela escada de serviço. Depois quebrou o relógio em 23h17 para criar uma hora falsa e deixou um bilhete dramático para fazer parecer que Helena estava instável. A digital parcial na bandeja de serviço, o registro apagado da chave mestra e os documentos escondidos por Helena atrás do rodapé ligam Renato à encenação e revelam o motivo emocional do crime.'),
      chronology_encrypted: sealSecret(JSON.stringify([
        { time: '21h40', event: 'Helena chega ao Hotel Vesper com cópias de documentos antigos de manutenção.' },
        { time: '22h10', event: 'Renato serve chá com sedativo e tenta convencê-la a desistir da denúncia.' },
        { time: '22h35', event: 'Helena esconde os documentos atrás do rodapé do Quarto 7.' },
        { time: '23h17', event: 'Renato quebra o relógio e reposiciona a câmera para fixar uma hora falsa.' }
      ]))
    },
    create: {
      case_id: officialCase.id, version_number: '1.0',
      opening: 'Helena Duarte foi encontrada desacordada no Quarto 7 do Hotel Vesper. A porta estava trancada por dentro, a câmera do corredor apontava para um ângulo inútil e o relógio quebrado marcava 23h17. Horas antes, Helena havia dito que revelaria "o que o hotel fez com a família dela".',
      master_style: JSON.stringify({ tone: 'investigative', maxSentences: 2 }), scoring_rules: JSON.stringify({ baseScore: 1000, penaltyPerHint: 100 }),
      solution_summary_encrypted: sealSecret('O gerente do Hotel Vesper encenou o quarto trancado para silenciar Helena, que havia descoberto provas de desvio de verbas de manutenção ligado à morte do pai dela.'),
      full_solution_encrypted: sealSecret('Helena Duarte voltou ao Hotel Vesper para confrontar o gerente Renato Álvares com documentos que provavam o desvio de verbas de manutenção. O pai de Helena havia sido culpado injustamente por um acidente antigo no hotel, mas os registros mostravam que Renato cortou custos e ocultou laudos para proteger a reputação do Vesper. Com medo de prisão, falência do hotel e exposição pública, Renato serviu chá com sedativo a Helena, entrou no Quarto 7 usando uma chave mestra, trancou a porta para simular um mistério impossível e reposicionou a câmera do corredor para esconder sua rota pela escada de serviço. Depois quebrou o relógio em 23h17 para criar uma hora falsa e deixou um bilhete dramático para fazer parecer que Helena estava instável. A digital parcial na bandeja de serviço, o registro apagado da chave mestra e os documentos escondidos por Helena atrás do rodapé ligam Renato à encenação e revelam o motivo emocional do crime.'),
      chronology_encrypted: sealSecret(JSON.stringify([
        { time: '21h40', event: 'Helena chega ao Hotel Vesper com cópias de documentos antigos de manutenção.' },
        { time: '22h10', event: 'Renato serve chá com sedativo e tenta convencê-la a desistir da denúncia.' },
        { time: '22h35', event: 'Helena esconde os documentos atrás do rodapé do Quarto 7.' },
        { time: '23h17', event: 'Renato quebra o relógio e reposiciona a câmera para fixar uma hora falsa.' }
      ])), publication_status: 'PUBLISHED', published_at: new Date()
    }
  });
  const officialFacts = [
    ['door_locked', 'A porta foi trancada usando a chave mestra do gerente.', 'ANSWER'],
    ['camera_positioned', 'A câmera foi reposicionada para esconder a passagem pela escada de serviço.', 'ANSWER'],
    ['broken_clock', 'O relógio foi quebrado em 23h17 para criar uma hora falsa para a cena.', 'ANSWER'],
    ['partial_fingerprint', 'A digital parcial do gerente aparece na bandeja de chá entregue ao Quarto 7.', 'ANSWER'],
    ['note_relevant', 'O bilhete foi forjado para fazer Helena parecer emocionalmente instável.', 'ANSWER'],
    ['sedative_tea', 'O chá servido a Helena continha sedativo em dose não letal.', 'ANSWER'],
    ['hidden_documents', 'Helena escondeu cópias dos laudos de manutenção atrás do rodapé do quarto.', 'ANSWER'],
    ['emotional_motive', 'O gerente queria impedir que Helena provasse a inocência do pai e expusesse os desvios do hotel.', 'ANSWER']
  ];
  for (const [fact_key, statement, visibility] of officialFacts) await prisma.case_facts.upsert({ where: { case_version_id_fact_key: { case_version_id: officialVersion.id, fact_key } }, update: { statement, visibility, pre_unlock_policy: 'ANSWER', is_solution_critical: true }, create: { case_version_id: officialVersion.id, fact_key, statement, visibility, pre_unlock_policy: 'ANSWER', is_solution_critical: true } });

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
    update: {
      opening: 'Durante um jantar, todos veem o retrato antigo da sala piscar. Segundos depois, uma joia desaparece de uma mesa próxima. A pintura não possui mecanismos.',
      solution_summary_encrypted: sealSecret('O "piscar" foi o reflexo de um flash externo no vidro ou verniz do retrato, usado para cegar momentaneamente os convidados enquanto o garçom roubava a joia.'),
      full_solution_encrypted: sealSecret('O retrato não tinha mecanismo algum. Um garçom cúmplice acionou um pequeno flash de alta intensidade escondido em sua bandeja de serviço e direcionado ao vidro ou verniz do quadro, fazendo o reflexo parecer um piscar. O clarão cegou os convidados por poucos segundos; nesse intervalo, ele retirou a joia da mesa próxima.'),
      chronology_encrypted: sealSecret(JSON.stringify([]))
    },
    create: {
      case_id: caseRetrato.id, version_number: '1.0',
      opening: 'Durante um jantar, todos veem o retrato antigo da sala piscar. Segundos depois, uma joia desaparece de uma mesa próxima. A pintura não possui mecanismos.',
      master_style: JSON.stringify({ tone: 'investigative', maxSentences: 2 }), scoring_rules: JSON.stringify({ baseScore: 1000, penaltyPerHint: 100 }),
      solution_summary_encrypted: sealSecret('O "piscar" foi o reflexo de um flash externo no vidro ou verniz do retrato, usado para cegar momentaneamente os convidados enquanto o garçom roubava a joia.'),
      full_solution_encrypted: sealSecret('O retrato não tinha mecanismo algum. Um garçom cúmplice acionou um pequeno flash de alta intensidade escondido em sua bandeja de serviço e direcionado ao vidro ou verniz do quadro, fazendo o reflexo parecer um piscar. O clarão cegou os convidados por poucos segundos; nesse intervalo, ele retirou a joia da mesa próxima.'),
      chronology_encrypted: sealSecret(JSON.stringify([])), publication_status: 'PUBLISHED', published_at: new Date()
    }
  });
  const factsRetrato = [
    ['flash_reflection', 'O piscar foi um reflexo no vidro ou verniz do retrato, provocado por um flash externo.', 'ANSWER'],
    ['temporary_blindness', 'Todos os convidados sofreram de cegueira temporária por 3 segundos.', 'ANSWER'],
    ['waiter_accomplice', 'O garçom aproximou-se da mesa exatamente no instante do clarão.', 'ANSWER']
  ];
  for (const [fact_key, statement, visibility] of factsRetrato) await prisma.case_facts.upsert({ where: { case_version_id_fact_key: { case_version_id: versionRetrato.id, fact_key } }, update: { statement, visibility, pre_unlock_policy: 'ANSWER', is_solution_critical: true }, create: { case_version_id: versionRetrato.id, fact_key, statement, visibility, pre_unlock_policy: 'ANSWER', is_solution_critical: true } });

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

  // 9. Caso premium modelo: A Herança de Vidro
  const caseHerancaVidro = await prisma.cases.upsert({
    where: { slug: 'a-heranca-de-vidro' },
    update: {
      title: 'A Herança de Vidro',
      short_synopsis: 'Uma restauradora morre dentro de um conservatório trancado na noite em que mudaria o testamento da família. O vidro quebrado aponta para fora, mas a verdade veio de dentro.',
      case_type: 'Caso Premium',
      difficulty: 'Difícil',
      estimated_duration_minutes: 35,
      min_players: 3,
      max_players: 6,
      tension_level: 5,
      status: 'PUBLISHED'
    },
    create: {
      slug: 'a-heranca-de-vidro',
      title: 'A Herança de Vidro',
      short_synopsis: 'Uma restauradora morre dentro de um conservatório trancado na noite em que mudaria o testamento da família. O vidro quebrado aponta para fora, mas a verdade veio de dentro.',
      case_type: 'Caso Premium',
      difficulty: 'Difícil',
      estimated_duration_minutes: 35,
      min_players: 3,
      max_players: 6,
      tension_level: 5,
      status: 'PUBLISHED'
    }
  });

  const herancaVidroMasterStyle = JSON.stringify({
    tone: 'precise_noir',
    maxSentences: 2,
    difficulty: 'hard',
    allowRedHerrings: true,
    suspects: [
      { id: 'augusto', name: 'Augusto Alvarenga', age: 57, role: 'Administrador da fundação', description: 'Tio de Isadora. Controlava as contas da família e perderia poder com a nova auditoria.', image: '/suspects/augusto-alvarenga.png', clueCount: 5 },
      { id: 'cecilia', name: 'Cecília Alvarenga', age: 34, role: 'Prima de Isadora', description: 'Discutiu com Isadora sobre herança e foi vista deixando a casa antes da tempestade.', image: '/suspects/cecilia-alvarenga.png', clueCount: 2 },
      { id: 'renato', name: 'Dr. Renato Salles', age: 49, role: 'Médico da família', description: 'Receitava medicamentos cardíacos e conhecia o histórico clínico dos Alvarenga.', image: '/suspects/renato-salles.png', clueCount: 3 },
      { id: 'marta', name: 'Marta Nóbrega', age: 46, role: 'Governanta', description: 'Tinha acesso às chaves da casa e encontrou o conservatório pouco antes da polícia chegar.', image: '/suspects/marta-nobrega.png', clueCount: 2 },
      { id: 'other', name: 'Outra pessoa', role: 'Fora da lista', description: 'Use esta opção se a equipe acredita que o responsável não está entre os suspeitos principais.', clueCount: 0, isOtherOption: true }
    ]
  });

  const versionHerancaVidro = await prisma.case_versions.upsert({
    where: { case_id_version_number: { case_id: caseHerancaVidro.id, version_number: '1.0' } },
    update: {
      opening: 'Isadora Vale, restauradora de vitrais e herdeira menor da família, foi encontrada morta no conservatório da Casa Alvarenga. A porta estava trancada por dentro, o teto de vidro tinha uma rachadura recente e o relógio de bronze parou às 22h46. Horas antes, Isadora avisou que mudaria o testamento e tiraria o controle da fundação das mãos do tio Augusto.',
      master_style: herancaVidroMasterStyle,
      solution_summary_encrypted: sealSecret('Augusto Alvarenga matou Isadora antes da tempestade e montou um falso acidente no conservatório para proteger o esquema de desvio da fundação. A chave do crime não foi o vidro quebrado, mas a restauração recente do vitral, o relógio adiantado e o vinho medicado.'),
      full_solution_encrypted: sealSecret('Augusto Alvarenga, tio de Isadora e administrador da fundação da família, descobriu que ela transferiria a gestão dos bens para uma auditoria independente. Isadora também havia encontrado recibos falsos de restauração usados por Augusto para desviar dinheiro da fundação. Na noite da tempestade, Augusto a levou ao conservatório sob o pretexto de discutir o novo testamento, serviu vinho com digitalina em baixa dose e esperou a arritmia começar. Depois trancou a porta por dentro usando um fio de restauração passado pela fresta inferior, retirou o fio pela grade de drenagem e quebrou de propósito um painel do teto já fragilizado para simular queda de vidro. O relógio de bronze marcava 22h46 porque havia sido adiantado em 18 minutos durante a manutenção, criando um falso horário de morte enquanto Augusto aparecia em uma chamada de vídeo no escritório. A prova decisiva é o conjunto: resíduo de cola de vitral no punho de Augusto, fio de restauração preso na grelha, digitalina na taça de Isadora, recibos falsos no envelope lacrado e a ausência de chuva dentro das marcas de sapato, indicando que a cena foi montada antes do vidro quebrar.'),
      chronology_encrypted: sealSecret(JSON.stringify([
        { time: '20h30', event: 'Isadora informa ao advogado que assinará a mudança do testamento na manhã seguinte.' },
        { time: '21h12', event: 'Augusto encontra Isadora no conservatório e serve vinho com digitalina.' },
        { time: '21h34', event: 'Isadora sofre arritmia e derruba a taça perto da mesa de restauração.' },
        { time: '21h41', event: 'Augusto tranca a porta por dentro usando fio de restauração e o retira pela grelha de drenagem.' },
        { time: '22h28', event: 'Augusto entra em chamada de vídeo no escritório para criar álibi.' },
        { time: '22h46', event: 'O relógio adulterado para, registrando uma hora falsa para a morte.' },
        { time: '23h05', event: 'A tempestade abre a rachadura do teto já fragilizado, reforçando o falso acidente.' }
      ]))
    },
    create: {
      case_id: caseHerancaVidro.id,
      version_number: '1.0',
      opening: 'Isadora Vale, restauradora de vitrais e herdeira menor da família, foi encontrada morta no conservatório da Casa Alvarenga. A porta estava trancada por dentro, o teto de vidro tinha uma rachadura recente e o relógio de bronze parou às 22h46. Horas antes, Isadora avisou que mudaria o testamento e tiraria o controle da fundação das mãos do tio Augusto.',
      master_style: herancaVidroMasterStyle,
      scoring_rules: JSON.stringify({ baseScore: 1400, penaltyPerHint: 120, bonusForMotive: 200, bonusForTimeline: 200 }),
      solution_summary_encrypted: sealSecret('Augusto Alvarenga matou Isadora antes da tempestade e montou um falso acidente no conservatório para proteger o esquema de desvio da fundação. A chave do crime não foi o vidro quebrado, mas a restauração recente do vitral, o relógio adiantado e o vinho medicado.'),
      full_solution_encrypted: sealSecret('Augusto Alvarenga, tio de Isadora e administrador da fundação da família, descobriu que ela transferiria a gestão dos bens para uma auditoria independente. Isadora também havia encontrado recibos falsos de restauração usados por Augusto para desviar dinheiro da fundação. Na noite da tempestade, Augusto a levou ao conservatório sob o pretexto de discutir o novo testamento, serviu vinho com digitalina em baixa dose e esperou a arritmia começar. Depois trancou a porta por dentro usando um fio de restauração passado pela fresta inferior, retirou o fio pela grade de drenagem e quebrou de propósito um painel do teto já fragilizado para simular queda de vidro. O relógio de bronze marcava 22h46 porque havia sido adiantado em 18 minutos durante a manutenção, criando um falso horário de morte enquanto Augusto aparecia em uma chamada de vídeo no escritório. A prova decisiva é o conjunto: resíduo de cola de vitral no punho de Augusto, fio de restauração preso na grelha, digitalina na taça de Isadora, recibos falsos no envelope lacrado e a ausência de chuva dentro das marcas de sapato, indicando que a cena foi montada antes do vidro quebrar.'),
      chronology_encrypted: sealSecret(JSON.stringify([
        { time: '20h30', event: 'Isadora informa ao advogado que assinará a mudança do testamento na manhã seguinte.' },
        { time: '21h12', event: 'Augusto encontra Isadora no conservatório e serve vinho com digitalina.' },
        { time: '21h34', event: 'Isadora sofre arritmia e derruba a taça perto da mesa de restauração.' },
        { time: '21h41', event: 'Augusto tranca a porta por dentro usando fio de restauração e o retira pela grelha de drenagem.' },
        { time: '22h28', event: 'Augusto entra em chamada de vídeo no escritório para criar álibi.' },
        { time: '22h46', event: 'O relógio adulterado para, registrando uma hora falsa para a morte.' },
        { time: '23h05', event: 'A tempestade abre a rachadura do teto já fragilizado, reforçando o falso acidente.' }
      ])),
      publication_status: 'PUBLISHED',
      published_at: new Date()
    }
  });

  const factsHerancaVidro = [
    { fact_key: 'testament_change', statement: 'Isadora pretendia alterar o testamento e retirar Augusto da gestão da fundação.', visibility: 'ANSWER', critical: true },
    { fact_key: 'fake_receipts', statement: 'Os recibos de restauração no envelope lacrado eram falsos e beneficiavam empresas ligadas a Augusto.', visibility: 'ANSWER', critical: true },
    { fact_key: 'digitalis_wine', statement: 'A taça de Isadora continha traços de digitalina misturados ao vinho.', visibility: 'ANSWER', critical: true },
    { fact_key: 'augusto_administered_wine', statement: 'Augusto foi a última pessoa confirmada a servir vinho a Isadora.', visibility: 'ANSWER', critical: true },
    { fact_key: 'clock_fast', statement: 'O relógio do conservatório estava adiantado em 18 minutos desde a manutenção da tarde.', visibility: 'ANSWER', critical: true },
    { fact_key: 'false_time', statement: 'A hora de 22h46 foi usada para deslocar a morte para o período da chamada de vídeo de Augusto.', visibility: 'ANSWER', critical: true },
    { fact_key: 'restoration_thread', statement: 'Um fio de restauração passou pela fresta inferior da porta e deixou fibras presas na grelha de drenagem.', visibility: 'ANSWER', critical: true },
    { fact_key: 'locked_room_trick', statement: 'A porta foi trancada por dentro usando o fio, que depois foi puxado para fora pela drenagem.', visibility: 'ANSWER', critical: true },
    { fact_key: 'glass_staged', statement: 'O vidro do teto foi fragilizado antes da tempestade para parecer a causa do acidente.', visibility: 'ANSWER', critical: true },
    { fact_key: 'dry_footprints', statement: 'As marcas de sapato ao lado do corpo estavam secas sob a camada posterior de água da chuva.', visibility: 'ANSWER', critical: true },
    { fact_key: 'glue_on_cuff', statement: 'O punho do casaco de Augusto tinha resíduo da mesma cola usada na restauração do vitral.', visibility: 'ANSWER', critical: true },
    { fact_key: 'lawyer_call', statement: 'O advogado recebeu de Isadora a confirmação da mudança do testamento às 20h30.', visibility: 'ANSWER', critical: true },
    { fact_key: 'medical_red_herring', statement: 'O frasco de remédio de Isadora era real, mas a dosagem regular não explicava uma morte súbita sem a digitalina no vinho.', visibility: 'ANSWER', critical: false },
    { fact_key: 'cousin_red_herring', statement: 'Cecília discutiu com Isadora sobre herança, mas saiu antes do vinho ser servido e não tinha acesso ao fio de restauração.', visibility: 'ANSWER', critical: false }
  ];

  for (const fact of factsHerancaVidro) {
    await prisma.case_facts.upsert({
      where: { case_version_id_fact_key: { case_version_id: versionHerancaVidro.id, fact_key: fact.fact_key } },
      update: {
        statement: fact.statement,
        visibility: fact.visibility,
        pre_unlock_policy: 'ANSWER',
        is_solution_critical: fact.critical
      },
      create: {
        case_version_id: versionHerancaVidro.id,
        fact_key: fact.fact_key,
        statement: fact.statement,
        visibility: fact.visibility,
        pre_unlock_policy: 'ANSWER',
        is_solution_critical: fact.critical
      }
    });
  }

  const rulesHerancaVidro = [
    {
      intent_key: 'motive_financial_foundation',
      examples: ['Augusto desviava dinheiro da fundação?', 'O motivo era impedir a auditoria?', 'Isadora ia mudar o testamento?'],
      facts: ['testament_change', 'fake_receipts'],
      classification: 'YES'
    },
    {
      intent_key: 'poisoned_wine',
      examples: ['Isadora foi envenenada pelo vinho?', 'A taça tinha algum medicamento?', 'A digitalina causou a morte?'],
      facts: ['digitalis_wine', 'augusto_administered_wine'],
      classification: 'YES'
    },
    {
      intent_key: 'false_clock_alibi',
      examples: ['O relógio estava adiantado?', 'A hora da morte foi falsificada?', 'A chamada de vídeo era álibi falso?'],
      facts: ['clock_fast', 'false_time'],
      classification: 'YES'
    },
    {
      intent_key: 'locked_room_thread',
      examples: ['A porta foi trancada com um fio?', 'O fio saiu pela drenagem?', 'O conservatório não estava realmente impossível?'],
      facts: ['restoration_thread', 'locked_room_trick'],
      classification: 'YES'
    },
    {
      intent_key: 'glass_as_staging',
      examples: ['O vidro quebrado foi encenação?', 'A tempestade não matou Isadora?', 'O teto foi preparado antes?'],
      facts: ['glass_staged', 'dry_footprints'],
      classification: 'YES'
    }
  ];

  for (const rule of rulesHerancaVidro) {
    await prisma.case_answer_rules.upsert({
      where: { id: `${versionHerancaVidro.id}:${rule.intent_key}` },
      update: {
        semantic_examples: JSON.stringify(rule.examples),
        related_fact_keys: JSON.stringify(rule.facts),
        default_classification: rule.classification
      },
      create: {
        id: `${versionHerancaVidro.id}:${rule.intent_key}`,
        case_version_id: versionHerancaVidro.id,
        intent_key: rule.intent_key,
        semantic_examples: JSON.stringify(rule.examples),
        related_fact_keys: JSON.stringify(rule.facts),
        default_classification: rule.classification,
        response_constraints: JSON.stringify({ maxSentences: 2, avoidFullSolution: true })
      }
    });
  }

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
