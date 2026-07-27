import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMasterPrompt } from '../dist/services/aiMaster.js';

test('prompt do mestre inclui contexto completo do caso sem remover regras de sigilo', () => {
  const prompt = buildMasterPrompt({
    caseTitle: 'O Caso Exemplo',
    caseSynopsis: 'Uma cena impossível precisa de leitura lógica.',
    caseType: 'Caso Clássico',
    caseDifficulty: 'Difícil',
    caseOpening: 'A porta estava fechada e o relógio parado.',
    masterStyle: JSON.stringify({ tone: 'investigative', maxSentences: 2 }),
    solutionSummary: 'A solução real deve orientar o árbitro, mas não ser revelada.',
    chronology: JSON.stringify([{ time: '21h10', event: 'A luz apagou por dois minutos.' }]),
    facts: [{ fact_key: 'locked_door', statement: 'A porta foi travada por fora.', is_solution_critical: true }],
    answerRules: [{
      intent_key: 'door_trick',
      semantic_examples: JSON.stringify(['A porta foi travada por fora?']),
      related_fact_keys: JSON.stringify(['locked_door']),
      default_classification: 'YES'
    }],
    hints: [{ hint_index: 1, content: 'Observe a marca perto da fechadura.', penalty_points: 80 }],
    solutionFields: [{ field_key: 'how', label: 'Como foi feito?', is_required: true }],
    questionText: 'A porta foi travada por fora?'
  });

  assert.match(prompt, /Contexto Narrativo do Caso/);
  assert.match(prompt, /O Caso Exemplo/);
  assert.match(prompt, /A porta estava fechada e o relógio parado/);
  assert.match(prompt, /Cronologia Privada do Caso/);
  assert.match(prompt, /21h10: A luz apagou por dois minutos/);
  assert.match(prompt, /Pistas Cadastradas/);
  assert.match(prompt, /Observe a marca perto da fechadura/);
  assert.match(prompt, /Campos da Solução Final/);
  assert.match(prompt, /Como foi feito/);
  assert.match(prompt, /não transforme esse contexto em dica gratuita/i);
});
