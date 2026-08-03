import test from 'node:test';
import assert from 'node:assert/strict';
import { majorityWinner, normalizeQuestion, theoryIsComplete } from '../dist/game/rules.js';
import { revealSecret, sealSecret } from '../dist/security/secrets.js';

test('normaliza e limita perguntas', () => {
  assert.equal(normalizeQuestion('  uma   pergunta  '), 'uma pergunta');
  assert.equal(normalizeQuestion('x'.repeat(600)).length, 500);
});

test('aplica maioria simples e não cria vencedor em empate', () => {
  assert.equal(majorityWinner(['a', 'a', 'b'], 3), 'a');
  assert.equal(majorityWinner(['a', 'b'], 2), null);
});

test('valida todos os campos obrigatórios da teoria', () => {
  assert.equal(theoryIsComplete({ who: 'A', how: 'B' }, ['who', 'how']), true);
  assert.equal(theoryIsComplete({ who: 'A', how: '' }, ['who', 'how']), false);
  const finalFields = ['what_happened', 'who', 'how', 'why'];
  assert.equal(theoryIsComplete({ what_happened: 'A', who: 'B', how: 'C', why: 'D' }, finalFields), true);
  assert.equal(theoryIsComplete({ what_happened: 'A', who: 'B', how: 'C' }, finalFields), false);
});

test('protege e recupera conteúdo secreto sem expor texto em repouso', () => {
  const sealed = sealSecret('solução privada');
  assert.notEqual(sealed, 'solução privada');
  assert.equal(revealSecret(sealed), 'solução privada');
});
