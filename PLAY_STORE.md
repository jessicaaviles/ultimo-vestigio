# Publicacao na Google Play - Ultimo Vestigio

## App
- Nome: Ultimo Vestigio
- Tipo: Jogo
- Preco: Gratuito
- Package name: `com.ultimovestigio.app`
- Politica de privacidade: `https://ultimo-vestigio.vercel.app/privacy`

## Android
O projeto Android fica em `frontend/android` e foi criado com Capacitor.

Antes de gerar o app bundle, configure as variaveis publicas usadas pelo build do Vite:

```bash
cd frontend
cp .env.android.example .env.production
```

Edite `.env.production` com a URL real do backend no Render:

```bash
VITE_API_URL=https://SEU-BACKEND-RENDER.onrender.com/api
VITE_SOCKET_URL=https://SEU-BACKEND-RENDER.onrender.com
```

## Comandos

Sincronizar web + Android:

```bash
cd frontend
npm run android:sync
```

Abrir no Android Studio:

```bash
cd frontend
npm run android:open
```

Gerar AAB release:

```bash
cd frontend
npm run android:bundle
```

O arquivo final fica em:

```text
frontend/android/app/build/outputs/bundle/release/app-release.aab
```

## Requisitos locais
- Java JDK instalado.
- Android Studio instalado.
- Android SDK instalado.
- Keystore de assinatura configurado no Android Studio ou Gradle.

## Play Console
1. Criar app no Play Console.
2. Escolher jogo, gratuito, idioma portugues Brasil.
3. Preencher ficha da loja.
4. Informar email de suporte.
5. Informar politica de privacidade.
6. Preencher Seguranca dos dados.
7. Preencher classificacao indicativa.
8. Subir o `.aab` em teste interno/fechado.
9. Se a conta for pessoal nova, manter pelo menos 12 testadores em teste fechado por 14 dias continuos antes de pedir acesso a producao.
