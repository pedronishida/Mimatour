# Mimatour API

API REST para coleta e consulta de viagens do site [Mimatour](https://mimatourviagens.suareservaonline.com.br/), para consumo pela IA conversacional na plataforma FluxiChat (Fluxitech).

## Versão Playwright (JavaScript) – Recomendada

API em **JavaScript puro** com **Playwright** para contornar Cloudflare. Arquitetura simples:

- `index.js` – servidor Express
- `scraper/mimatourScraper.js` – coleta com Playwright (Chromium)

### Como rodar (Playwright)

```bash
cd mimatour-api
npm install
npx playwright install chromium   # instala browser (se necessário)
npm start
```

- **Health:** http://localhost:3000/health  
- **Viagens:** http://localhost:3000/trips  
- **Webhook:** POST http://localhost:3000/webhook/in  

Para ver o browser durante o scraping: `GET /trips?headless=false`

### Rotas REST

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/health` | Status da API |
| GET | `/trips` | Executa scraper e retorna viagens |
| GET | `/trips/:id` | Busca viagem por id (404 se não existir) |
| POST | `/webhook/in` | Recebe webhooks (ex: FluxiChat), loga payload, retorna 200 |

### Modelo da viagem (JSON)

Cada viagem retorna: `id`, `title`, `destination`, `description`, `departure_date`, `return_date`, `duration_days`, `price`, `availability`, `image_url`, `source_url`. Campos ausentes retornam `null`.

---

## Cloudflare e coleta com Puppeteer (versão TypeScript)

O site está atrás de **Cloudflare**; HTTP direto (axios) retorna 403. A API usa **Puppeteer** por padrão (Chrome headless) para abrir a página e extrair o HTML com Cheerio — a coleta é do site de verdade.

| Modo | Uso |
|------|-----|
| **Mock** | `USE_MOCK_DATA=true` no `.env` → a API retorna viagens de exemplo. Ideal para desenvolver a integração com o FluxiChat sem acessar o site. |
| **Fixture** | Salve a página de listagem do site no navegador (Ctrl+S ou “Salvar como”) em `fixtures/mimatour-listagem.html` e defina `FIXTURE_HTML_PATH=fixtures/mimatour-listagem.html`. A API lê o HTML desse arquivo e extrai as viagens — assim você ajusta os seletores no código sem bater no Cloudflare. |
| **Puppeteer (padrão)** | Chrome headless acessa a URL. Requer `npm install` (baixa Chromium). Desativar: `USE_PUPPETEER=false`. |
| **Axios** | Se Puppeteer falhar, tenta HTTP (pode dar 403). |

---

## Estratégia Técnica de Coleta

### Análise do site

O site da Mimatour utiliza o domínio **suareservaonline.com.br** (subdomínio `mimatourviagens`). Esse tipo de portal costuma:

1. **Carregar listagens via JavaScript** – páginas podem ser SPA ou SSR, com dados vindos de:
   - Endpoints internos (ex.: `/api/pacotes`, `/api/viagens`) em JSON, ou
   - HTML renderizado no servidor com cards de viagens.

2. **Estratégia implementada (híbrida)**  
   - **Mock** (opcional) e **Fixture** (opcional).  
   - Tentativa de endpoints internos (se existirem).  
   - **Puppeteer:** abertura da URL em Chrome headless → HTML → **Cheerio** para extrair viagens (contorna Cloudflare).  
   - **Fallback:** axios (HTTP direto; pode dar 403).

3. **Resiliência**
   - Timeout configurável.
   - Reintentos em caso de falha temporária (timeout, 5xx).
   - Logs em todas as etapas.
   - Cache em memória (5 min) para reduzir carga no site; preparado para Redis no futuro.

### Por que Node.js + TypeScript

- Alinhamento com o ecossistema da Fluxitech e possível integração com outros serviços Node.
- Cheerio e Axios são maduros para coleta e parsing.
- TypeScript garante contratos claros (modelo `Trip`, filtros) e facilita evolução (ex.: banco de dados).

---

## Estrutura do Projeto

```
mimatour-api/
├── src/
│   ├── config/       # Variáveis de ambiente
│   ├── collector/    # Cliente HTTP + scraper (coleta)
│   ├── normalizer/   # Raw → Trip
│   ├── controllers/ # Lógica dos endpoints
│   ├── routes/      # Rotas Express
│   ├── middleware/  # Tratamento de erros
│   ├── types/       # Trip, RawTripData, filtros
│   ├── utils/       # Logger, geração de ID
│   └── index.ts     # Entrada do servidor
├── env.example      # Exemplo de variáveis (copiar para .env)
├── package.json
├── tsconfig.json
└── README.md
```

---

## Como rodar localmente

### Pré-requisitos

- Node.js 18+

### Passos

1. **Instalar dependências**

   ```bash
   cd mimatour-api
   npm install
   ```

2. **Variáveis de ambiente**  
   Copie `env.example` para `.env` e ajuste se necessário:

   ```env
   MATOUR_BASE_URL=https://mimatourviagens.suareservaonline.com.br
   PORT=3000
   COLLECTOR_TIMEOUT_MS=15000
   COLLECTOR_MAX_RETRIES=3
   # Enquanto Cloudflare bloquear: USE_MOCK_DATA=true
   # Para usar HTML salvo: FIXTURE_HTML_PATH=fixtures/mimatour-listagem.html
   ```

3. **Desenvolvimento (com reload)**

   ```bash
   npm run dev
   ```

4. **Produção**

   ```bash
   npm run build
   npm start
   ```

5. **Salvar o HTML do site no seu PC (para ajustar seletores)**  
   Roda o Puppeteer aí no localhost, abre o site e grava o HTML em `fixtures/mimatour-page.html`. Depois dá para abrir esse arquivo ou a IA analisar e corrigir os seletores.

   ```bash
   npm run build
   npm run fetch-page
   ```
   O arquivo aparece em `fixtures/mimatour-page.html`.

A API estará em `http://localhost:3000` (ou na `PORT` definida).

---

## Endpoints

| Método | Endpoint           | Descrição |
|--------|--------------------|-----------|
| GET    | `/health`          | Status da API |
| GET    | `/trips`          | Lista viagens (com filtros opcionais) |
| GET    | `/trips/search?q=`| Busca por nome ou destino |
| GET    | `/trips/:id`      | Detalhes de uma viagem |

### Exemplos de uso

- **Health:**  
  `GET http://localhost:3000/health`

- **Listar com filtros:**  
  `GET http://localhost:3000/trips?destino=gramado&preco_max=5000`

- **Busca textual:**  
  `GET http://localhost:3000/trips/search?q=serra`

- **Detalhe:**  
  `GET http://localhost:3000/trips/{id}`  
  (o `id` é o identificador estável gerado pela API ou a URL de origem)

### Exemplos de resposta JSON

**GET /health**

```json
{
  "success": true,
  "service": "mimatour-api",
  "status": "ok",
  "timestamp": "2025-02-05T12:00:00.000Z"
}
```

**GET /trips**

```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4e5f6g7h8",
      "titulo": "Serra Gaúcha - 4 dias",
      "destino": "Gramado e Canela",
      "descricao": "Roteiro com parques e vinícolas.",
      "data_saida": "2025-03-01",
      "data_retorno": "2025-03-04",
      "duracao": "4 dias",
      "preco": 1899,
      "parcelas": "6x de R$ 316,50",
      "disponibilidade": "Consultar",
      "categoria": "Pacote",
      "imagem_url": "https://...",
      "url_origem": "https://mimatourviagens.suareservaonline.com.br/pacote/..."
    }
  ],
  "meta": { "total": 1 }
}
```

**GET /trips/:id**

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4e5f6g7h8",
    "titulo": "Serra Gaúcha - 4 dias",
    "destino": "Gramado e Canela",
    "descricao": "Roteiro com parques e vinícolas.",
    "data_saida": "2025-03-01",
    "data_retorno": "2025-03-04",
    "duracao": "4 dias",
    "preco": 1899,
    "parcelas": "6x de R$ 316,50",
    "disponibilidade": "Consultar",
    "categoria": "Pacote",
    "imagem_url": "https://...",
    "url_origem": "https://..."
  }
}
```

**Erro (ex.: 404)**

```json
{
  "success": false,
  "error": "Viagem não encontrada",
  "id": "xxx"
}
```

---

## Modelo de dados (Trip)

| Campo           | Tipo    | Descrição |
|----------------|--------|-----------|
| id             | string | Identificador estável (hash da URL de origem) |
| titulo         | string | Nome da viagem |
| destino        | string | Destino principal |
| descricao      | string | Texto descritivo |
| data_saida     | string | Data de saída |
| data_retorno   | string | Data de retorno |
| duracao        | string | Ex.: "4 dias" |
| preco          | number | Valor numérico |
| parcelas       | string \| null | Ex.: "6x de R$ 316,50" |
| disponibilidade| string | Ex.: "Consultar" |
| categoria      | string | Ex.: "Pacote" |
| imagem_url     | string | URL da imagem |
| url_origem    | string | Link no site Mimatour |

---

## Ajuste fino após inspecionar o site

1. Abra o site no Chrome/Edge, F12 → **Network**.
2. Recarregue a página e verifique se aparecem requisições para JSON (ex.: `pacotes`, `viagens`, `api`). Se existir, anote o URL e o formato; podemos priorizá-lo no `collector`.
3. Em **Elements**, inspecione os blocos que representam cada viagem (card/item). Ajuste em `src/collector/scraper.ts`:
   - `SELECTORS.tripCard` para o container de cada viagem.
   - Os seletores de título, link, preço, data e imagem dentro de `parseTripCard()`.

Assim a coleta fica alinhada à estrutura real do site.

---

## Próximos passos (escalabilidade)

- **Banco de dados:** persistir `Trip` e opcionalmente páginas de detalhe; `id` já está estável.
- **Cache:** trocar cache em memória por Redis usando variáveis (ex.: `CACHE_ENABLED`, `REDIS_URL`).
- **Rate limiting:** se o site passar a exigir, limitar requisições por IP ou por chave.
- **Detalhe por URL:** usar `fetchTripDetailPage` para enriquecer `GET /trips/:id` com dados da página de detalhe e parser específico.

---

## Licença e uso

Código para uso da empresa Mimatour e integração FluxiChat. Coleta feita de forma ética (identificação no User-Agent, cache, sem sobrecarga).
