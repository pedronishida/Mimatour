# Deploy da Mimatour API na Vercel – Passo a passo

## Aviso importante

Na **Vercel** o **Playwright não roda** (ambiente serverless não tem navegador). Por isso:

- **GET /trips** na Vercel sempre retorna **dados mock** (2 viagens de exemplo).
- **GET /health**, **GET /trips/search**, **GET /trips/:id** e **POST /webhook/in** funcionam normalmente.
- Para ter **dados reais** do site Mimatour em produção, use **Railway** ou **Render** (servidor com Node + Playwright).

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
7. **Environment Variables (opcional):** não é obrigatório para rodar; se tiver `.env` local, pode adicionar variáveis no painel da Vercel depois (Settings → Environment Variables).
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
| Viagens (mock)  | `https://SEU_PROJETO.vercel.app/trips` |
| Busca           | `https://SEU_PROJETO.vercel.app/trips/search?q=gramado` |
| Webhook         | `POST https://SEU_PROJETO.vercel.app/webhook/in` |

Use essa **URL base** no FluxiChat em “External Request”.

---

### 6. Conferir se está no ar

- Abra no navegador: `https://SEU_PROJETO.vercel.app/health`  
  Deve retornar algo como: `{"success":true,"service":"mimatour-api","status":"ok",...}`

- Depois: `https://SEU_PROJETO.vercel.app/trips`  
  Deve retornar `success: true` e `data` com 2 viagens (mock).

---

## Resumo

| Onde   | Como fazer |
|--------|------------|
| **Vercel** | Conectar repo no [vercel.com/new](https://vercel.com/new) ou usar `vercel` / `vercel --prod` na pasta do projeto. |
| **URL no FluxiChat** | Colocar `https://SEU_PROJETO.vercel.app` e o path (ex.: `/trips`). |
| **Dados reais** | Fazer deploy em **Railway** ou **Render** (não Vercel) para o Playwright rodar e buscar as viagens reais do site. |

Se quiser, no próximo passo dá para descrever o deploy na Railway ou no Render para ter scraping real em produção.
