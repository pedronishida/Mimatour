/**
 * App Express da API Mimatour.
 * Usado tanto localmente (index.js) quanto na Vercel (api/index.js).
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { scrapeMimatourTrips } from './scraper/mimatourScraper.js';

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

// Na Vercel o path chega como /api/trips/...; o Express precisa ver /trips/...
app.use((req, res, next) => {
  if (typeof req.url === 'string' && req.url.startsWith('/api')) {
    req.url = req.url.replace(/^\/api/, '') || '/';
  }
  next();
});

function toApiTrip(raw) {
  const duracao =
    raw.duration_days != null ? `${raw.duration_days} dia${raw.duration_days !== 1 ? 's' : ''}` : null;
  return {
    id: raw.id,
    titulo: raw.title || 'Pacote',
    destino: raw.destination || '',
    descricao: raw.description || '',
    data_saida: raw.departure_date || '',
    data_retorno: raw.return_date || '',
    duracao: duracao || '',
    preco: raw.price ?? 0,
    parcelas: null,
    disponibilidade: raw.availability === true ? 'Disponível' : raw.availability === false ? 'Esgotado' : 'Consultar',
    categoria: 'Pacote',
    imagem_url: raw.image_url || '',
    url_origem: raw.source_url || '',
  };
}

/** Lista de viagens para Vercel (serverless não roda Playwright). FluxiChat usa essa lista. */
const MOCK_RAW = [
  { id: 'mimatour-mock-1', title: 'Serra Gaúcha - Gramado e Canela', destination: 'Gramado, RS', description: 'Roteiro 4 dias com parques, vinícolas e chocolate.', departure_date: '2025-03-01', return_date: '2025-03-04', duration_days: 4, price: 1899, availability: true, image_url: '', source_url: 'https://mimatourviagens.suareservaonline.com.br/pacote/serra-gaucha' },
  { id: 'mimatour-mock-2', title: 'Bonito - MS', destination: 'Bonito, MS', description: 'Flutuação, cachoeiras e grutas.', departure_date: '2025-04-10', return_date: '2025-04-15', duration_days: 6, price: 3290, availability: true, image_url: '', source_url: 'https://mimatourviagens.suareservaonline.com.br/pacote/bonito' },
  { id: 'mimatour-mock-3', title: 'Fernando de Noronha', destination: 'Fernando de Noronha, PE', description: 'Praias e mergulho. Incluso passeios.', departure_date: '2025-06-01', return_date: '2025-06-05', duration_days: 5, price: 4590, availability: true, image_url: '', source_url: 'https://mimatourviagens.suareservaonline.com.br/pacote/noronha' },
  { id: 'mimatour-mock-4', title: 'Ilhabela - Feriado', destination: 'Ilhabela, SP', description: 'Praias, trilhas e passeio de escuna.', departure_date: '2025-02-15', return_date: '2025-02-18', duration_days: 4, price: 1290, availability: true, image_url: '', source_url: 'https://mimatourviagens.suareservaonline.com.br/pacote/ilhabela' },
  { id: 'mimatour-mock-5', title: 'Capitólio - Cânions', destination: 'Capitólio, MG', description: 'Lago de Furnas, cachoeiras e cânions.', departure_date: '2025-03-14', return_date: '2025-03-16', duration_days: 3, price: 890, availability: true, image_url: '', source_url: 'https://mimatourviagens.suareservaonline.com.br/pacote/capitolio' },
  { id: 'mimatour-mock-6', title: 'Foz do Iguaçu - Tríplice Fronteira', destination: 'Foz do Iguaçu, PR', description: 'Cataratas, Itaipu, Paraguai e Argentina.', departure_date: '2025-05-20', return_date: '2025-05-24', duration_days: 5, price: 2190, availability: true, image_url: '', source_url: 'https://mimatourviagens.suareservaonline.com.br/pacote/foz' },
  { id: 'mimatour-mock-7', title: 'Copacabana - Carnaval', destination: 'Rio de Janeiro, RJ', description: 'Feriado de Carnaval na orla de Copacabana.', departure_date: '2025-02-15', return_date: '2025-02-18', duration_days: 4, price: 1590, availability: true, image_url: '', source_url: 'https://mimatourviagens.suareservaonline.com.br/pacote/copacabana' },
  { id: 'mimatour-mock-8', title: 'Guarujá - Praias', destination: 'Guarujá, SP', description: 'Praias, aquário e passeios.', departure_date: '2025-02-08', return_date: '2025-02-10', duration_days: 3, price: 690, availability: true, image_url: '', source_url: 'https://mimatourviagens.suareservaonline.com.br/pacote/guaruja' },
  { id: 'mimatour-mock-9', title: 'Festa da Uva - Jundiaí', destination: 'Jundiaí, SP', description: 'Festa da Uva 2026, 8 de fevereiro.', departure_date: '2026-02-08', return_date: '2026-02-08', duration_days: 1, price: 159, availability: true, image_url: '', source_url: 'https://mimatourviagens.suareservaonline.com.br/pacote/festa-uva' },
  { id: 'mimatour-mock-10', title: 'Campos do Jordão - Inverno', destination: 'Campos do Jordão, SP', description: 'Clima europeu, chocolate e fondue.', departure_date: '2025-07-10', return_date: '2025-07-12', duration_days: 3, price: 1190, availability: true, image_url: '', source_url: 'https://mimatourviagens.suareservaonline.com.br/pacote/campos-jordao' },
  { id: 'mimatour-mock-11', title: 'Caldas Novas - Águas Quentes', destination: 'Caldas Novas, GO', description: 'Parques aquáticos e águas termais.', departure_date: '2025-04-18', return_date: '2025-04-21', duration_days: 4, price: 1490, availability: true, image_url: '', source_url: 'https://mimatourviagens.suareservaonline.com.br/pacote/caldas-novas' },
  { id: 'mimatour-mock-12', title: 'Beto Carrero World', destination: 'Penha, SC', description: 'Parque temático + praia.', departure_date: '2025-01-15', return_date: '2025-01-17', duration_days: 3, price: 990, availability: true, image_url: '', source_url: 'https://mimatourviagens.suareservaonline.com.br/pacote/beto-carrero' },
  { id: 'mimatour-mock-13', title: 'Maragogi - Galés', destination: 'Maragogi, AL', description: 'Piscinas naturais e praias de Alagoas.', departure_date: '2025-08-05', return_date: '2025-08-09', duration_days: 5, price: 2490, availability: true, image_url: '', source_url: 'https://mimatourviagens.suareservaonline.com.br/pacote/maragogi' },
  { id: 'mimatour-mock-14', title: 'Ouro Preto - Histórico', destination: 'Ouro Preto, MG', description: 'Cidade histórica, igrejas e Minas Gerais.', departure_date: '2025-06-12', return_date: '2025-06-14', duration_days: 3, price: 790, availability: true, image_url: '', source_url: 'https://mimatourviagens.suareservaonline.com.br/pacote/ouro-preto' },
  { id: 'mimatour-mock-15', title: 'Jericoacoara - Ceará', destination: 'Jericoacoara, CE', description: 'Dunas, lagoa e pôr do sol.', departure_date: '2025-09-20', return_date: '2025-09-25', duration_days: 6, price: 3190, availability: true, image_url: '', source_url: 'https://mimatourviagens.suareservaonline.com.br/pacote/jericoacoara' },
];

/** Na Vercel: se SCRAPER_URL estiver definida, busca TODAS as viagens reais nessa URL. */
async function fetchTripsFromScraperUrl() {
  let base = (process.env.SCRAPER_URL || '').trim().replace(/\/$/, '');
  if (!base) return null;
  if (!/^https?:\/\//i.test(base)) base = `https://${base}`;
  try {
    const url = `${base}/trips`;
    const res = await fetch(url, { signal: AbortSignal.timeout(55000) });
    const json = await res.json();
    if (res.ok && json?.data && Array.isArray(json.data) && json.data.length > 0) return json.data;
    if (!res.ok) console.warn('[API] SCRAPER_URL respondeu', res.status, url);
  } catch (e) {
    console.warn('[API] SCRAPER_URL falhou:', e.message);
  }
  return null;
}

/** Retorna viagens: na Vercel tenta SCRAPER_URL; senão scraper local ou mock. */
export async function getTripsRaw(headless = true) {
  if (process.env.VERCEL) {
    const fromScraper = await fetchTripsFromScraperUrl();
    if (fromScraper) return fromScraper;
    return MOCK_RAW;
  }
  try {
    return await scrapeMimatourTrips({ headless });
  } catch (err) {
    console.warn('[API] Scraper falhou, usando dados mock:', err.message);
    return MOCK_RAW;
  }
}

/** Normaliza para formato da API: aceita tanto raw (title) quanto já normalizado (titulo). */
export function toData(rawTrips) {
  if (!rawTrips.length) return [];
  const first = rawTrips[0];
  if (first.titulo != null) return rawTrips;
  return rawTrips.map(toApiTrip);
}

/** Garante que a query string seja lida (Vercel/serverless às vezes não preenche req.query). */
function getQuery(req) {
  if (req.query && Object.keys(req.query).length > 0) return req.query;
  try {
    const u = req.url || req.originalUrl || '';
    const i = u.indexOf('?');
    if (i === -1) return {};
    const params = new URLSearchParams(u.slice(i));
    return Object.fromEntries(params.entries());
  } catch (_) {
    return {};
  }
}

/** Termo de busca: só pela URL, ex. /trips?q=ilhabela */
function getSearchTerm(req) {
  const query = getQuery(req);
  return (query.q || '').trim();
}

/** Extrai número (apenas dígitos). Preço só pela URL: preco_min=100&preco_max=500 */
function parseNum(val) {
  if (val == null || val === '') return null;
  const s = String(val).replace(/\D/g, '');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function getPriceFilters(req) {
  const query = getQuery(req);
  const min = parseNum(query.preco_min) ?? null;
  const max = parseNum(query.preco_max) ?? null;
  return { min, max };
}

export function filterTripsByTerm(trips, term) {
  if (!term) return trips;
  const t = term.toLowerCase();
  return trips.filter(
    (x) =>
      (x.titulo && x.titulo.toLowerCase().includes(t)) ||
      (x.destino && x.destino.toLowerCase().includes(t)) ||
      (x.descricao && x.descricao.toLowerCase().includes(t))
  );
}

function filterTripsByPrice(trips, { min, max }) {
  if (min == null && max == null) return trips;
  return trips.filter((x) => {
    const p = x.preco != null ? Number(x.preco) : NaN;
    if (!Number.isFinite(p)) return false;
    if (min != null && p < min) return false;
    if (max != null && p > max) return false;
    return true;
  });
}

app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'mimatour-api',
    status: 'ok',
    scraper: process.env.VERCEL ? 'vercel' : 'playwright',
    /** Na Vercel: true = variável SCRAPER_URL está definida (pode buscar viagens reais). */
    scraper_url_configured: !!process.env.SCRAPER_URL,
    timestamp: new Date().toISOString(),
  });
});

app.get('/trips', async (req, res) => {
  try {
    const query = getQuery(req);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const headless = query.headless !== 'false';
    const rawTrips = await getTripsRaw(headless);
    let data = toData(rawTrips);
    const searchTerm = getSearchTerm(req);
    if (searchTerm) data = filterTripsByTerm(data, searchTerm);
    const priceFilters = getPriceFilters(req);
    data = filterTripsByPrice(data, priceFilters);
    const meta = { total: data.length };
    if (searchTerm) meta.query = searchTerm;
    if (priceFilters.min != null) meta.preco_min = priceFilters.min;
    if (priceFilters.max != null) meta.preco_max = priceFilters.max;
    if (process.env.VERCEL && query.debug === '1') {
      meta.source = data.length && data[0].id?.startsWith('mimatour-mock') ? 'mock' : 'scraper';
    }
    if (searchTerm) res.setHeader('X-Filtro-Q', searchTerm);
    res.json({ success: true, data, meta });
  } catch (err) {
    console.error('[API] Erro ao buscar viagens:', err.message);
    res.status(500).json({ success: false, error: err.message || 'Falha ao buscar viagens' });
  }
});

app.get('/trips/search', async (req, res) => {
  try {
    const query = getQuery(req);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const q = getSearchTerm(req);
    const rawTrips = await getTripsRaw(query.headless !== 'false');
    let data = toData(rawTrips);
    if (q) data = filterTripsByTerm(data, q);
    data = filterTripsByPrice(data, getPriceFilters(req));
    const meta = { total: data.length };
    if (q) meta.query = q;
    const priceFilters = getPriceFilters(req);
    if (priceFilters.min != null) meta.preco_min = priceFilters.min;
    if (priceFilters.max != null) meta.preco_max = priceFilters.max;
    res.json({ success: true, data, meta });
  } catch (err) {
    console.error('[API] Erro na busca:', err.message);
    res.status(500).json({ success: false, error: err.message || 'Falha na busca' });
  }
});

/** Filtro no PATH: /trips/search/ilhabela (não depende de query string). */
const searchByTermHandler = async (req, res) => {
  try {
    const term = (req.params.term || '').trim();
    if (!term) return res.redirect(302, '/trips');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const rawTrips = await getTripsRaw(true);
    let data = filterTripsByTerm(toData(rawTrips), term);
    data = filterTripsByPrice(data, getPriceFilters(req));
    res.json({ success: true, data, meta: { total: data.length, query: term } });
  } catch (err) {
    console.error('[API] Erro /trips/search/:term:', err.message);
    res.status(500).json({ success: false, error: err.message || 'Falha na busca' });
  }
};
app.get('/trips/search/:term', searchByTermHandler);
app.get('/api/trips/search/:term', searchByTermHandler);
// Vercel às vezes envia path em req.url como /api/trips/search/term; regex cobre qualquer formato
app.get(/^\/(?:api\/)?trips\/search\/([^/]+)\/?$/i, (req, res) => {
  req.params = { term: req.params[0] };
  return searchByTermHandler(req, res);
});

app.get('/trips/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rawTrips = await getTripsRaw(req.query.headless !== 'false');
    const all = toData(rawTrips);
    const trip = all.find((t) => t.id === id);
    if (!trip) return res.status(404).json({ success: false, error: 'Viagem não encontrada', id });
    res.json({ success: true, data: trip });
  } catch (err) {
    console.error('[API] Erro ao buscar viagem:', err.message);
    res.status(500).json({ success: false, error: err.message || 'Falha ao buscar viagem' });
  }
});

app.post('/webhook/in', (req, res) => {
  console.log('[Webhook IN] Payload:', JSON.stringify(req.body, null, 2));
  res.status(200).json({ success: true, received: true });
});

export default app;
