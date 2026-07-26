import { PrismaClient } from '@prisma/client';
import { sealSecret } from '../src/security/secrets';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed Fase 3 (Pistas e Teorias)...');

  // Campos de Solução Padrão (para todos os casos que não os tiverem)
  const defaultFields = [
    { key: 'what_happened', label: 'O que aconteceu?', order: 1 },
    { key: 'who', label: 'Quem foi o responsável?', order: 2 },
    { key: 'how', label: 'Como foi feito?', order: 3 },
    { key: 'why', label: 'Qual foi o motivo?', order: 4 }
  ];

  // Dicionário de Pistas Corrigidas
  const casesData = [
    {
      slug: 'o-presente-desaparecido',
      hints: [
        'A caixa parecia estar vazia desde o início.',
        'O anfitrião desviou a atenção de todos durante um brinde.',
        'O "roubo" foi, na verdade, o início de uma brincadeira planejada.'
      ]
    },
    {
      slug: 'o-quarto-7',
      hints: [
        'A fechadura não foi arrombada: alguém com acesso à chave mestra entrou ou saiu do quarto.',
        'A bandeja de chá entregue ao Quarto 7 carrega uma digital parcial e explica por que Helena foi encontrada desacordada.',
        'A câmera no corredor foi reposicionada para esconder a escada de serviço, não para vigiar a porta.',
        'O relógio quebrado não mostra a hora real do ataque, mas a hora que o culpado queria fixar na investigação.',
        'Os documentos escondidos atrás do rodapé revelam o motivo: Helena podia provar que o gerente desviou verba de manutenção e culpou injustamente o pai dela por um acidente antigo.'
      ]
    },
    {
      slug: 'o-guarda-chuva-molhado',
      hints: [
        'Como não chovia lá fora, a água deve ter vindo de dentro do próprio edifício.',
        'O teto do corredor do prédio estava passando por problemas técnicos recentes.',
        'O guarda-chuva foi usado para proteger a pessoa de um forte vazamento do ar condicionado interno.'
      ]
    },
    {
      slug: 'o-elevador-que-nao-parou',
      hints: [
        'As câmeras só filmam as portas, não o que acontece no teto do elevador.',
        'O trajeto do elevador levou muito mais tempo do que deveria para retornar ao térreo.',
        'A mulher utilizou o alçapão do teto para escapar pelo poço de manutenção.'
      ]
    },
    {
      slug: 'a-mensagem-das-23h17',
      hints: [
        'O celular nunca saiu do carregador, mas a mensagem ainda assim foi enviada.',
        'A vítima não estava fisicamente presente quando a mensagem foi disparada.',
        'O envio foi feito automaticamente por um script agendado no computador da vítima.'
      ]
    },
    {
      slug: 'o-retrato-que-piscou',
      hints: [
        'O "piscar" não veio da pintura, mas de um reflexo intenso no vidro ou verniz do retrato.',
        'Os convidados ficaram momentaneamente cegos, criando a oportunidade perfeita.',
        'O clarão veio de um equipamento escondido na bandeja do garçom, que roubou a joia na confusão.'
      ]
    },
    {
      slug: 'blackwell',
      hints: [
        'O sangue na poltrona da sala de estar era artificial.',
        'Clara e Helena fugiram juntas pelos jardins da mansão.',
        'O livro-caixa desenterrado no jardim prova que Tomás desviava fundos.'
      ]
    },
    {
      slug: 'a-heranca-de-vidro',
      hints: [
        'O vidro quebrado chama atenção, mas as marcas secas no chão indicam que a cena principal aconteceu antes da chuva entrar.',
        'O relógio do conservatório não é confiável: ele passou por manutenção naquela tarde e ficou adiantado.',
        'A taça de Isadora não aponta para uma queda acidental; há traços de uma substância cardíaca misturada ao vinho.',
        'A porta trancada por dentro pode ter sido manipulada de fora com um material fino, flexível e usado na restauração de vitrais.',
        'O envelope lacrado não era só testamento: ele continha recibos falsos que comprometiam a administração da fundação.',
        'O álibi de Augusto depende da hora marcada pelo relógio, mas essa hora foi deslocada para coincidir com a chamada de vídeo.',
        'Cecília tinha conflito familiar, mas não tinha acesso ao método: vinho, fio de restauração, manutenção do relógio e recibos falsos convergem para Augusto.',
        'A solução exige trocar a pergunta: não foi "como o vidro matou Isadora?", mas "quem usou o vidro para esconder veneno, fraude e uma porta falsamente impossível?".'
      ]
    }
  ];

  for (const data of casesData) {
    const caso = await prisma.cases.findUnique({ where: { slug: data.slug } });
    if (!caso) continue;
    
    const caseVersion = await prisma.case_versions.findFirst({ where: { case_id: caso.id } });
    if (!caseVersion) continue;

    console.log(`Processando ${caso.title}...`);

    // Inserir Pistas
    for (let index = 0; index < data.hints.length; index++) {
      const hintContent = data.hints[index];
      await prisma.case_hints.upsert({
        where: {
          case_version_id_hint_index: { case_version_id: caseVersion.id, hint_index: index + 1 }
        },
        update: { content_encrypted: sealSecret(hintContent) },
        create: {
          case_version_id: caseVersion.id,
          hint_index: index + 1,
          content_encrypted: sealSecret(hintContent),
          unlock_rule: '{}',
          penalty_points: 100,
          is_available_from_start: index === 0
        }
      });
    }

    // Inserir Campos de Solução
    for (const f of defaultFields) {
      await prisma.case_solution_fields.upsert({
        where: { case_version_id_field_key: { case_version_id: caseVersion.id, field_key: f.key } },
        update: {},
        create: {
          case_version_id: caseVersion.id,
          field_key: f.key,
          label: f.label,
          is_required: true,
          evaluation_weight: 1.0,
          accepted_answers_encrypted: sealSecret('[]'),
          display_order: f.order
        }
      });
    }
  }

  console.log('Seed Fase 3 concluído com sucesso!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
