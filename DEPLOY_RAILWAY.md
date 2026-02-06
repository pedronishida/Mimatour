# Deploy na Railway – dados reais (Playwright)

Na **Vercel** o Playwright não roda, então a API devolve só 2 viagens mock.  
Na **Railway** a API roda em servidor com Node + Chromium e o **/trips** retorna **todas as viagens reais** do site Mimatour.

---

## Passo a passo (Railway)

### 1. Conta

1. Acesse [railway.app](https://railway.app) e faça login (GitHub).
2. Clique em **Start a New Project**.

### 2. Deploy a partir do GitHub

1. Escolha **Deploy from GitHub repo**.
2. Se pedir, autorize o Railway a acessar seus repositórios.
3. Selecione o repositório **pedronishida/Mimatour** (ou o nome que você deu).
4. O Railway detecta o **Dockerfile** e faz o build com Node + Playwright.
5. Clique em **Deploy**. O primeiro build pode levar 3–5 minutos (instala Chromium).

### 3. URL pública

1. No projeto, abra o **service** (o deploy).
2. Vá em **Settings** → **Networking** → **Generate Domain** (ou **Public Networking**).
3. A Railway gera uma URL, por exemplo: `https://mimatour-production-xxxx.up.railway.app`.

### 4. Variável PORT (se precisar)

A Railway define `PORT` automaticamente. O `index.js` já usa `process.env.PORT || 3000`, então não é obrigatório configurar nada.

### 5. Usar no FluxiChat

No FluxiChat, em **External Request**:

- **Método:** GET  
- **URL:** `https://SUA-URL-RAILWAY.up.railway.app/trips`  

Substitua pela URL que a Railway mostrou no passo 3.

---

## Resumo

| Onde     | /trips                          |
|----------|----------------------------------|
| Vercel   | 2 viagens mock (sem navegador)  |
| Railway  | Todas as viagens reais do site  |

Depois do deploy na Railway, use a **URL da Railway** no FluxiChat em vez da URL da Vercel para ter dados reais.
