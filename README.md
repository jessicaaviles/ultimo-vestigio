# Jogo de Investigação Multiplayer com IA

PWA multiplayer para partidas de investigação com uma IA atuando como Mestre do Caso.

## Documentação

 A documentação está na pasta `/docs`.

## Continuous Integration (CI)
- Este repositório utiliza GitHub Actions para build e testes automáticos (workflow Build and Test).
- O status do CI pode ser visto em GitHub > Actions > Build and Test.
- Veja docs/CI101.md para entender o que o CI executa e como replicar localmente.
 - Observação: esta PR adiciona documentação de CI para facilitar o onboarding.

Ordem principal de leitura:

0. `docs/roadmap-produto-completo.md`
1. `docs/05-antigravity/prompt-antigravity-mvp-1.md`
2. `docs/01-planejamento/planejador.md`
3. `docs/02-produto/prd-mvp-1.md`
4. `docs/02-produto/fluxos-mvp-1.md`
5. `docs/03-tecnico/modelo-de-dados.md`
6. `docs/03-tecnico/regras-mestre-ia.md`
7. `docs/02-produto/backlog-mvp-1.md`
8. `docs/04-casos/casos-iniciais.md`

## Conteúdo protegido

O arquivo abaixo contém spoilers e deve ser usado apenas no backend:

`docs/04-casos/private/cofre-casos-iniciais.md`

Não expor esse conteúdo no frontend, logs ou APIs públicas.

## Escopo atual

MVP Técnico 1:

- identidade anônima;
- salas para 2 a 6 jogadores;
- multiplayer em tempo real;
- turnos;
- caso rápido;
- Mestre IA;
- pistas;
- teorias;
- votação;
- revelação;
- resultado;
- feedback.
