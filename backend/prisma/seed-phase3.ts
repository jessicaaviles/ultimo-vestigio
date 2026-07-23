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
        'A fechadura da porta indica que alguém usou uma chave para entrar ou sair.',
        'A câmera no corredor foi posicionada estrategicamente por alguém que trabalha no hotel.',
        'O relógio quebrado não reflete a hora real do crime, mas sim a hora que o culpado queria que todos acreditassem.'
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
        'O "piscar" não foi uma falha na luz, mas um intenso clarão óptico direcionado.',
        'Os convidados ficaram momentaneamente cegos, criando a oportunidade perfeita.',
        'O clarão veio de um equipamento escondido pelo garçom, que roubou a joia na confusão.'
      ]
    },
    {
      slug: 'blackwell',
      hints: [
        'O sangue na poltrona da sala de estar era artificial.',
        'Clara e Helena fugiram juntas pelos jardins da mansão.',
        'O livro-caixa desenterrado no jardim prova que Tomás desviava fundos.'
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
