# Deploy da Mimatour API na Vercel – Passo a passo

## Retornar TODAS as viagens reais na Vercel

Na Vercel o Playwright não roda. Para **GET /trips** retornar **todas as viagens reais** do site:

1. Faça deploy do **mesmo repositório** na **Railway** (ou Render): [railway.app](https://railway.app) → New Project → Deploy from GitHub → escolha **Mimatour**. A Railway usa o Dockerfile e roda o scraper.
2. Depois do deploy, copie a URL pública (ex.: `https://mimatour-production-xxxx.up.railway.app`).
3. Na **Vercel**: projeto **mimatour** → **Settings** → **Environment Variables** → adicione:
   - **Name:** `SCRAPER_URL`
   - **Value:** a URL da Railway (ex.: `https://mimatour-production-xxxx.up.railway.app`)
4. Faça **Redeploy** do projeto na Vercel (Deployments → ⋮ → Redeploy).

A partir daí, **https://mimatour.vercel.app/trips** passa a buscar as viagens na URL configurada e retorna **todas** as viagens reais. O FluxiChat continua usando só a URL da Vercel.

Se **SCRAPER_URL** não estiver definida, a Vercel retorna 15 viagens de exemplo (mock).

---

## Passo a passo (Vercel)

### 1. Conta e CLI

1. Crie uma conta em [vercel.com](https://vercel.com) (ou faça login).
2. Instale a CLI (opcional, para deploy pelo terminal):
   ```bash
   npm i -g vercel
   ```
3. Ou use só o **dashboard** no site (deploy pelo GitHub).

---

### 2. Projeto no GitHub (recomendado)

1. Crie um repositório no GitHub (ex.: `mimatour-api`).
2. No seu PC, na pasta do projeto:
   ```bash
   cd mimatour-api
   git init
   git add .
   git commit -m "API Mimatour pronta para Vercel"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/mimatour-api.git
   git push -u origin main
   ```

---

### 3. Deploy pela Vercel (pelo site)

1. Acesse [vercel.com/new](https://vercel.com/new).
2. Clique em **Import Git Repository** e escolha o repositório **mimatour-api** (ou **Add New** e conecte o GitHub se ainda não estiver conectado).
3. **Project Name:** deixe `mimatour-api` ou altere se quiser.
4. **Root Directory:** deixe em branco (raiz do repo).
5. **Framework Preset:** None.
6. **Build and Output Settings:**
   - Build Command: deixe em branco ou `npm run build` (o projeto não exige build para a API em JS).
   - Output Directory: deixe em branco.
7. **Environment Variables (opcional):** para retornar **todas as viagens reais**, depois do deploy adicione `SCRAPER_URL` com a URL de um backend que rode o scraper (veja início deste arquivo).
8. Clique em **Deploy**.

---

### 4. Deploy pela CLI (alternativa)

1. Na pasta do projeto:
   ```bash
   cd mimatour-api
   vercel
   ```
2. Siga as perguntas:
   - **Set up and deploy?** Yes
   - **Which scope?** sua conta
   - **Link to existing project?** No
   - **Project name:** mimatour-api (ou outro)
   - **Directory:** ./ (Enter)
3. Para deploy em produção:
   ```bash
   vercel --prod
   ```

---

### 5. URL da API

Após o deploy, a Vercel mostra uma URL, por exemplo:

- **Preview:** `https://mimatour-api-xxx.vercel.app`
- **Produção:** `https://mimatour-api.vercel.app` (se tiver domínio custom ou o nome do projeto)

Endpoints:

| Endpoint        | URL exemplo |
|-----------------|-------------|
| Health          | `https://SEU_PROJETO.vercel.app/health` |
| Viagens (todas) | `https://SEU_PROJETO.vercel.app/trips` (reais se SCRAPER_URL estiver definida) |
| Busca           | `https://SEU_PROJETO.vercel.app/trips/search?q=gramado` |
| Webhook         | `POST https://SEU_PROJETO.vercel.app/webhook/in` |

Use essa **URL base** no FluxiChat em “External Request”.

---

### 6. Conferir se está no ar

- Abra no navegador: `https://SEU_PROJETO.vercel.app/health`  
  Deve retornar algo como: `{"success":true,"service":"mimatour-api","status":"ok",...}`

- Depois: `https://SEU_PROJETO.vercel.app/trips`  
  Deve retornar `success: true` e `data` com as viagens (reais se `SCRAPER_URL` estiver configurada).

---

## Resumo

| Onde   | Como fazer |
|--------|------------|
| **Vercel** | Conectar repo no [vercel.com/new](https://vercel.com/new) ou usar `vercel` / `vercel --prod`. |
| **URL no FluxiChat** | Usar `https://SEU_PROJETO.vercel.app/trips`. |
| **TODAS as viagens reais** | Deploy do mesmo repo na Railway, copiar a URL e definir **SCRAPER_URL** na Vercel (Settings → Environment Variables) e redeployar. |
