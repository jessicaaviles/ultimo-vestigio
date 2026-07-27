import test from 'node:test';
import assert from 'node:assert/strict';
import { processTutorialQuestion } from '../dist/services/aiMaster.js';

test('caso tutorial aceita perguntas sobre chuva sem pedir reformulacao', () => {
  const result = processTutorialQuestion('A água veio da chuva?');
  assert.equal(result.classification, 'NO');
  assert.equal(result.fallback_used, false);
  assert.match(result.rendered_text, /Não\./);
});

test('caso tutorial aceita perguntas sobre vazamento interno', () => {
  const result = processTutorialQuestion('O ar condicionado estava vazando no corredor?');
  assert.equal(result.classification, 'YES');
  assert.equal(result.fallback_used, false);
  assert.match(result.rendered_text, /Sim\./);
});

test('caso tutorial aceita perguntas sobre uso dentro do predio', () => {
  const result = processTutorialQuestion('A pessoa abriu o guarda-chuva dentro do prédio?');
  assert.equal(result.classification, 'YES');
  assert.equal(result.fallback_used, false);
  assert.match(result.rendered_text, /Sim\./);
});

test('caso tutorial aceita perguntas sobre sala coberta', () => {
  const result = processTutorialQuestion('Havia teto na sala?');
  assert.equal(result.classification, 'YES');
  assert.equal(result.fallback_used, false);
  assert.match(result.rendered_text, /Sim\./);
});

test('caso tutorial entende pergunta sobre funcao do guarda-chuva', () => {
  const result = processTutorialQuestion('O guarda chuva protegia alguma coisa ou alguém?');
  assert.equal(result.classification, 'YES');
  assert.equal(result.fallback_used, false);
  assert.match(result.rendered_text, /protegia/i);
  assert.doesNotMatch(result.rendered_text, /veio da chuva/i);
});

test('caso tutorial separa protecao geral de protecao contra chuva', () => {
  const result = processTutorialQuestion('O guarda-chuva protegia alguém da chuva?');
  assert.equal(result.classification, 'NO');
  assert.equal(result.fallback_used, false);
  assert.match(result.rendered_text, /não era contra chuva/i);
});
