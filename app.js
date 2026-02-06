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

const MOCK_RAW = [
  { id: 'mimatour-mock-1', title: 'Serra Gaúcha - Gramado e Canela', destination: 'Gramado, RS', description: 'Roteiro 4 dias.', departure_date: '2025-03-01', return_date: '2025-03-04', duration_days: 4, price: 1899, availability: true, image_url: '', source_url: 'https://mimatourviagens.suareservaonline.com.br/pacote/serra-gaucha' },
  { id: 'mimatour-mock-2', title: 'Bonito - MS', destination: 'Bonito, MS', description: 'Flutuação e cachoeiras.', departure_date: '2025-04-10', return_date: '2025-04-15', duration_days: 6, price: 3290, availability: true, image_url: '', source_url: 'https://mimatourviagens.suareservaonline.com.br/pacote/bonito' },
];

async function getTripsRaw(headless = true) {
  if (process.env.VERCEL) return MOCK_RAW;
  try {
    return await scrapeMimatourTrips({ headless });
  } catch (err) {
    console.warn('[API] Scraper falhou, usando dados mock:', err.message);
    return MOCK_RAW;
  }
}

app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'mimatour-api',
    status: 'ok',
    scraper: process.env.VERCEL ? 'mock (Vercel)' : 'playwright',
    timestamp: new Date().toISOString(),
  });
});

app.get('/trips', async (req, res) => {
  try {
    const headless = req.query.headless !== 'false';
    const rawTrips = await getTripsRaw(headless);
    const data = rawTrips.map(toApiTrip);
    res.json({ success: true, data, meta: { total: data.length } });
  } catch (err) {
    console.error('[API] Erro ao buscar viagens:', err.message);
    res.status(500).json({ success: false, error: err.message || 'Falha ao buscar viagens' });
  }
});

app.get('/trips/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.status(400).json({ success: false, error: 'Parâmetro "q" é obrigatório' });
    const rawTrips = await getTripsRaw(req.query.headless !== 'false');
    const all = rawTrips.map(toApiTrip);
    const term = q.toLowerCase();
    const data = all.filter(
      (t) =>
        (t.titulo && t.titulo.toLowerCase().includes(term)) ||
        (t.destino && t.destino.toLowerCase().includes(term)) ||
        (t.descricao && t.descricao.toLowerCase().includes(term))
    );
    res.json({ success: true, data, meta: { total: data.length, query: q } });
  } catch (err) {
    console.error('[API] Erro na busca:', err.message);
    res.status(500).json({ success: false, error: err.message || 'Falha na busca' });
  }
});

app.get('/trips/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rawTrips = await getTripsRaw(req.query.headless !== 'false');
    const all = rawTrips.map(toApiTrip);
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
