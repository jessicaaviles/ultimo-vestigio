# Roadmap para Produto Completo
## Ultimo Vestigio

Este documento organiza os proximos passos para transformar o app em um produto jogavel, escalavel e publicavel. A ordem abaixo prioriza o nucleo do jogo: casos bem estruturados, Mestre IA confiavel e progresso consistente.

---

## Principio

O jogo deve ser sustentado por casos estruturados. A IA interpreta e redige, mas a verdade vem dos dados do caso.

Cada nova funcionalidade deve responder a uma destas perguntas:

- melhora a qualidade da investigacao?
- reduz resposta errada do Mestre?
- facilita criar novos casos?
- aumenta retencao do jogador?
- aproxima o app da publicacao mobile?

---

## Fase 1 - Motor do Mestre IA

### Objetivo

Garantir que perguntas de todos os casos recebam respostas curtas, assertivas, contextualizadas e sem spoilers gratuitos.

### Entregaveis

- matriz de fatos por caso:
  - fatos confirmados;
  - fatos negados;
  - fatos parcialmente verdadeiros;
  - fatos desconhecidos;
  - entidades e sinonimos;
  - perguntas perigosas que podem entregar a solucao.
- testes automatizados por dificuldade:
  - muito facil;
  - facil;
  - medio;
  - dificil;
  - premium dificil.
- padrao de resposta do Mestre:
  - `Sim. [fato diretamente perguntado]`;
  - `Nao. [correcao curta]`;
  - `Parcialmente. [parte verdadeira + limite]`;
  - `Desconhecido. [quando o arquivo nao confirma]`.
- limite anti-spoiler por fase:
  - investigacao em andamento;
  - formulando teoria;
  - revelacao;
  - caso concluido.

### Criterios de aceite

- o Mestre nao responde tudo como desconhecido;
- perguntas com sinonimos sao reconhecidas;
- perguntas negativas nao recebem `Sim` invertido;
- respostas nao entregam a resolucao inteira;
- cada caso tem bateria minima de testes;
- contestar e esclarecer usam a mesma base de verdade.

---

## Fase 2 - Padrao Editorial de Casos

### Objetivo

Criar uma estrutura repetivel para escrever casos melhores, mais justos e mais misteriosos.

### Entregaveis

- template oficial de caso classico;
- checklist editorial antes de publicar;
- guia de dificuldade;
- regra para personagens:
  - todo personagem citado na solucao deve aparecer no enunciado, pistas ou pessoas citadas;
  - todo personagem importante deve ter funcao, motivo possivel e relacao com o caso;
  - nao criar nomes que o jogador nunca viu.
- padrao de pistas:
  - 3 pistas para casos classicos simples;
  - mais camadas apenas para casos premium/dificeis;
  - pistas intermediarias sem entregar a solucao.
- padrao de resolucao:
  - o que aconteceu;
  - quem foi responsavel;
  - como foi feito;
  - por que foi feito.

### Criterios de aceite

- a solucao faz sentido sem depender de informacao escondida demais;
- as pistas nao se repetem;
- a resolucao parece inevitavel depois da revelacao;
- o jogador consegue inferir a resposta com perguntas, nao por tentativa cega.

---

## Fase 3 - Editor Interno de Casos

### Objetivo

Permitir criar e revisar casos sem editar seed manualmente.

### Entregaveis

- pagina administrativa protegida;
- formulario de metadados do caso;
- cadastro de personagens;
- upload/geracao de imagens;
- cadastro de fatos, regras e sinonimos;
- cadastro de pistas;
- cadastro de campos de resolucao;
- simulador de perguntas do Mestre;
- status de publicacao: rascunho, teste, publicado.

### Criterios de aceite

- criar um caso novo sem mexer no codigo;
- testar perguntas antes de publicar;
- impedir publicacao se faltar fato essencial, pista ou regra minima;
- manter spoilers fora do frontend.

---

## Fase 4 - Experiencia de Jogo

### Objetivo

Deixar modo solo e modo grupo claros, estaveis e prazerosos.

### Entregaveis

- separacao visual entre solo e grupo;
- sala em andamento acessivel por participantes;
- sala fecha automaticamente ao resolver;
- historico real de votos;
- dicas sincronizadas para todos;
- notificacao de turno com som e vibracao;
- resultado final com estatisticas reais dos jogadores;
- mensagens explicadas e conectadas a sala/caso.

### Criterios de aceite

- jogador nao fica preso em sala antiga;
- jogador entende de quem e a vez;
- caso resolvido nao aparece como em andamento;
- dados ficticios nao aparecem em telas reais.

---

## Fase 5 - Perfil, Progressao e Retencao

### Objetivo

Transformar progresso, conquistas e perfil em motivacao real para continuar jogando.

### Entregaveis

- conquistas resetam junto com progresso quando solicitado;
- estatisticas sempre derivadas de resultados reais;
- pagina de conquistas completa;
- ranking entre amigos;
- historico de casos resolvidos;
- missoes diarias ou semanais;
- recompensas por poucas dicas, precisao e sequencia.

### Criterios de aceite

- estatisticas batem com o banco;
- badges nao aparecem quando progresso foi resetado;
- amigos mostram avatares e conquistas reais;
- perfil nao usa fallback com dados incorretos.

---

## Fase 6 - Onboarding

### Objetivo

Ensinar o jogador sem interromper a experiencia.

### Entregaveis

- primeiro caso guiado;
- dicas contextuais curtas;
- explicacao de `Sim`, `Nao`, `Parcialmente` e `Desconhecido`;
- tela "como jogar" sem rolagem desnecessaria;
- exemplo de teoria final;
- feedback claro quando a pergunta e ambigua.

### Criterios de aceite

- novo jogador entende como perguntar;
- novo jogador entende como resolver;
- tutorial nao exige conhecimento previo;
- telas nao parecem manual tecnico.

---

## Fase 7 - Publicacao Mobile

### Objetivo

Preparar o app para Play Store com fluxo confiavel de conta, permissoes e build Android.

### Entregaveis

- pacote Android assinado;
- icones finais;
- splash final;
- politica de privacidade conectada;
- permissoes de camera e galeria revisadas;
- exclusao de conta funcional;
- testes em dispositivo real;
- checklist Play Console.

### Criterios de aceite

- login e cadastro funcionam no app instalado;
- camera/galeria funcionam;
- exclusao de conta permite novo cadastro;
- Vercel e Render estao apontando para versoes estaveis;
- pacote pronto para envio.

---

## Ordem de Execucao Recomendada

1. Fechar Fase 1 para todos os casos existentes.
2. Reescrever ou ajustar casos problematicos usando Fase 2.
3. Criar o primeiro caso premium dificil como padrao editorial.
4. Implementar editor interno minimo para novos casos.
5. Consolidar progresso, conquistas e salas.
6. Polir onboarding e publicacao mobile.

---

## Definicao de Pronto

Uma entrega so esta pronta quando:

- tem teste automatizado quando envolver logica;
- passa no build frontend;
- passa no build/test backend;
- nao introduz dados ficticios em tela real;
- nao expõe spoiler no frontend;
- funciona em mobile;
- foi enviada para o GitHub.
