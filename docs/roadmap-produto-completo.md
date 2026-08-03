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

### Status

Em andamento.

Primeira entrega concluida:

- criada matriz de verdade inicial para casos faceis e medios;
- matriz gera fatos e regras estaticas usadas pelo Mestre;
- casos mapeados agora exigem entidades, fatos confirmados, fatos negados e exemplos;
- testes automatizados cobrem a estrutura da matriz e perguntas por caso.

Segunda entrega concluida:

- migrados casos dificeis `A Heranca de Vidro`, `O Sino das Tres Batidas` e `A Fita Sem Rosto` para a matriz;
- testes desses casos agora usam a matriz oficial em vez de contexto duplicado;
- corrigida expectativa editorial da pergunta "A tempestade matou Isadora?" para resposta negativa;
- reforcada separacao entre pistas falsas, fatos negados e fatos confirmados.

Terceira entrega concluida:

- esclarecimentos passaram a explicar o fato central da resposta em vez de texto generico;
- contestacoes passaram a usar copy mais direta para respostas corrigidas ou mantidas;
- removida duplicacao visual de prefixos no chat do jogo;
- testes cobrem esclarecimento positivo, negativo, parcial e contestacao corrigida.

Quarta entrega concluida:

- criada trava anti-spoiler para perguntas amplas de solucao;
- perguntas como "Quem foi o culpado?" pedem investigacao de um fato especifico antes de formular solucao;
- perguntas especificas, como "Lucia tinha motivo?", continuam sendo respondidas normalmente;
- testes garantem que a trava nao bloqueia investigacao contextualizada.

Quinta entrega concluida:

- todos os casos estruturados passaram a ter ao menos um fato parcial para conexoes limitadas;
- pistas falsas e suspeitos secundarios agora respondem "Parcialmente" quando ha relacao, mas sem prova conclusiva;
- perguntas sobre casos faceis, medios e dificeis foram cobertas por teste automatizado com respostas parciais;
- o Mestre ficou menos binario em perguntas investigativas sem entregar a solucao completa.

Sexta entrega concluida:

- o Mestre passou a receber a fase real da sala ao responder perguntas;
- perguntas amplas de solucao agora recebem orientacoes diferentes em investigacao, formulacao, revelacao e caso concluido;
- contestacoes tambem usam a fase atual da sala para revisar respostas;
- testes garantem que a trava anti-spoiler por fase nao bloqueia perguntas especificas.

Setima entrega concluida:

- a avaliacao do relatorio final ganhou travas locais por campo;
- campos vazios ou curtos demais nao podem receber nota alta mesmo se o modelo for permissivo;
- acertos de responsavel ou evento central sao limitados quando o mecanismo esta fraco;
- testes cobrem o calculo ponderado e a penalizacao por respostas incompletas.

Oitava entrega concluida:

- criada trava editorial para retratos de suspeitos;
- todo caminho `/suspects/*.png` citado no seed ou no seletor de teoria precisa existir em `frontend/public`;
- o teste reduz o risco de personagens aparecerem sem avatar no resumo, votacao ou relatorio final;
- a validacao prepara a Fase 2 de padronizacao editorial dos casos.

Nona entrega concluida:

- criada trava editorial para casos com lista formal de suspeitos;
- suspeitos precisam aparecer no enunciado e ter funcao/contexto suficiente;
- corrigido o enunciado de `A Heranca de Vidro` para apresentar Cecilia, Renato e Marta junto de Augusto;
- o teste reduz o risco de nomes surgirem apenas na resolucao ou na tela de votacao.

Decima entrega concluida:

- criada validacao editorial das pistas cadastradas no seed de fase 3;
- casos simples ficam protegidos com 3 pistas e casos complexos com 5 pistas;
- pistas duplicadas, curtas demais ou que entregam a solucao diretamente passam a falhar nos testes;
- a regra ajuda a manter investigacao justa sem excesso de dicas.

Decima primeira entrega concluida:

- o formulario de relatorio final voltou a usar os 4 campos oficiais da resolucao;
- `como` e `por que` agora sao campos separados no frontend e no envio ao backend;
- removida a duplicacao tecnica que enviava `why` com o mesmo texto de `how`;
- teste automatizado protege o formulario contra voltar a esconder o quarto campo.

Decima segunda entrega concluida:

- o backend passou a rejeitar relatorios finais incompletos antes de gravar a teoria;
- os 4 campos oficiais (`what_happened`, `who`, `how`, `why`) sao obrigatorios tambem no submit via socket;
- a mensagem de erro orienta preencher todos os campos do relatorio final;
- testes unitarios cobrem a validacao dos 4 campos obrigatorios.

Decima terceira entrega concluida:

- o encerramento do caso agora fecha votacoes abertas da sala junto com a mudanca para `COMPLETED`;
- a sala concluida tambem limpa o turno atual para evitar continuidade indevida;
- teste automatizado protege o fluxo de finalizacao contra votacoes presas apos a resolucao;
- a regra reforca que caso resolvido nao deve continuar parecendo sala ativa.

Decima quarta entrega concluida:

- a tela de jogo passou a tratar `COMPLETED` como fim de jogo tambem no render da conclusao;
- o resultado final nao depende mais apenas do status legado `GAME_OVER`;
- a limpeza local de sala e a exibicao de recompensas usam a mesma nocao de jogo encerrado;
- teste automatizado protege a tela final para `COMPLETED` e `GAME_OVER`.

Decima quinta entrega concluida:

- o estado da sala passou a enviar `game_result`, avaliacoes finais e solucao somente quando o caso ja esta encerrado;
- a tela final consegue reconstruir resultado real apos reload, usando jogadores e avatares da sala;
- a pagina de feedback deixou de usar numeros ficticios de progresso, pistas e teorias;
- testes automatizados protegem a ausencia de mocks na conclusao e a hidratacao do resultado salvo.

Decima sexta entrega concluida:

- a pagina de amigos deixou de criar rede, convites e conquistas em `localStorage`;
- adicionar amigo agora prepara/copia convite, sem inventar status, nivel, XP ou badges;
- a tela permanece vazia ate existir uma fonte real de amigos sincronizados;
- teste automatizado impede a volta de amigos/conquistas ficticios no runtime.

Decima setima entrega concluida:

- mapa, inventario e quadro imersivo foram travados para Blackwell, evitando conteudo da mansao em outros casos;
- o quadro de investigacao deixou de exibir cards fixos com spoilers da solucao;
- evidencias do quadro agora aparecem apenas quando a pista correspondente foi desbloqueada;
- inventario deixou de mostrar datas ficticias de coleta;
- testes automatizados protegem as telas imersivas contra vazamento de mocks e spoilers.

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
