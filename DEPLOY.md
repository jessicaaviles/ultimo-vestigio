# Guia de Deploy - Jogo de Investigação

Este documento detalha o processo de deploy do backend no **Railway** e do frontend no **Netlify** ou **Vercel**, incluindo comandos, variáveis de ambiente necessárias e validação.

---

## 1. Deploy do Backend (Railway)

### Pasta a ser publicada
- **Pasta:** `/backend`

### Comandos
- **Comando de Build:** `npm install && npm run build` (o script executa `prisma generate` para gerar o cliente para PostgreSQL e `tsc` para compilar o TypeScript).
- **Comando de Start:** `npm run db:migrate && npm run start` (roda as migrações no banco de dados em produção e depois inicia a aplicação com `node dist/index.js`).

### Variáveis de Ambiente no Railway
Cadastre as seguintes variáveis no painel do seu serviço no Railway:

| Variável | Descrição | Exemplo / Origem |
| :--- | :--- | :--- |
| `DATABASE_URL` | String de conexão com o banco de dados PostgreSQL. | Gerado automaticamente pelo Railway ao adicionar um serviço do PostgreSQL no projeto. |
| `PORT` | Porta na qual o servidor Express irá escutar. | Inserido automaticamente pelo Railway. |
| `FRONTEND_URL` | URL completa do frontend publicado. | `https://seu-app.netlify.app` |
| `GEMINI_API_KEY` | Chave de acesso à API do Gemini. | `AIzaSy...` |
| `OPENAI_API_KEY` | Chave de acesso à API do OpenAI. | `sk-proj-...` |
| `OPENAI_IMAGE_MODEL` | Modelo de imagem da OpenAI. | `gpt-image-1` |
| `GEMINI_IMAGE_MODEL` | Modelo de imagem da Gemini. | `gemini-2.5-flash-image` |
| `SOLUTION_ENCRYPTION_KEY` | Chave secreta de criptografia para a solução do caso. | Qualquer string secreta longa e segura. |

---

## 2. Deploy do Frontend (Netlify ou Vercel)

### Deploy no Netlify
- **Base directory:** `frontend`
- **Build command:** `npm run build`
- **Publish directory:** `dist` (relativo à pasta `frontend`)

### Deploy na Vercel
- **Root directory:** `frontend`
- **Build command:** `npm run build` (ou deixar padrão detectado)
- **Output directory:** `dist` (ou deixar padrão detectado)
> [!NOTE]
> O arquivo `frontend/vercel.json` já está configurado no projeto para fazer os rewrites necessários do React Router SPA (evitando erro 404 ao atualizar rotas internas como `/lobby` ou `/room`).

### Variáveis de Ambiente (Netlify e Vercel)
Cadastre as seguintes variáveis no painel de configurações do seu projeto (Vercel ou Netlify):

| Variável | Descrição | Exemplo |
| :--- | :--- | :--- |
| `VITE_API_URL` | URL base das rotas HTTP da API do backend. **Deve terminar com `/api`**. | `https://seu-backend.up.railway.app/api` |
| `VITE_SOCKET_URL` | URL base do servidor Socket.IO (domínio do backend **sem** o sufixo `/api`). | `https://seu-backend.up.railway.app` |

---

## 3. Validação e Testes em Produção

### Como testar a rota `/health`
Para verificar se o backend está ativo e respondendo corretamente a chamadas HTTP:
1. Abra um terminal ou ferramenta de requisição (como Postman ou navegador).
2. Acesse a URL: `https://seu-backend.up.railway.app/health`
3. O retorno deve ser um JSON com status `200 OK`:
   ```json
   { "status": "ok" }
   ```

### Como validar que o Socket.IO está conectado
Para conferir se o Socket.IO está operando corretamente e trocando pacotes em tempo real:
1. Abra o frontend do jogo no navegador.
2. Pressione `F12` (ou clique com o botão direito e selecione "Inspecionar") para abrir o Console do Desenvolvedor.
3. Vá para a aba **Rede (Network)** e filtre por **WS** (WebSockets).
4. Recarregue a página. Você deverá ver uma conexão ativa do tipo `websocket` (geralmente com o nome de requisição iniciando em `socket.io/?EIO=4&transport=websocket...`).
5. A conexão não deve ficar em loop ou com status `failed`, mostrando frames/mensagens de conexão estabelecida.
