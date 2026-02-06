/**
 * Controllers da API de viagens.
 * Orquestram coleta, normalização e filtros; retornam JSON padronizado.
 */

import type { Request, Response } from 'express';
import { collectTrips } from '../collector/scraper.js';
import { MOCK_TRIPS } from '../collector/mockData.js';
import { normalizeTrips } from '../normalizer/tripNormalizer.js';
import type { Trip, TripFilters } from '../types/trip.js';
import { generateTripId } from '../utils/id.js';
import { logger } from '../utils/logger.js';
import { USE_MOCK_DATA } from '../config/env.js';

/** Cache em memória (substituível por Redis no futuro) */
let cachedTrips: Trip[] | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

function isCacheValid(): boolean {
  return cachedTrips !== null && Date.now() - cacheTime < CACHE_TTL_MS;
}

async function getTrips(): Promise<Trip[]> {
  if (isCacheValid() && cachedTrips) return cachedTrips;
  try {
    const raw = await collectTrips();
    cachedTrips = normalizeTrips(raw);
    cacheTime = Date.now();
    return cachedTrips;
  } catch (err) {
    logger.error('Falha ao coletar viagens (ex.: site com Cloudflare)', err);
    if (cachedTrips && cachedTrips.length > 0) return cachedTrips;
    // Fallback: retorna mock para não quebrar a API quando o site está inacessível (403, etc.)
    logger.info('Usando dados mock como fallback');
    cachedTrips = normalizeTrips(MOCK_TRIPS);
    cacheTime = Date.now();
    return cachedTrips;
  }
}

function applyFilters(trips: Trip[], filters: TripFilters): Trip[] {
  let result = trips;
  if (filters.destino) {
    const d = filters.destino.toLowerCase();
    result = result.filter((t) => t.destino.toLowerCase().includes(d) || t.titulo.toLowerCase().includes(d));
  }
  if (filters.data) {
    result = result.filter(
      (t) => t.data_saida.includes(filters.data!) || t.data_retorno.includes(filters.data!)
    );
  }
  if (filters.preco_min != null) {
    result = result.filter((t) => t.preco >= filters.preco_min!);
  }
  if (filters.preco_max != null) {
    result = result.filter((t) => t.preco <= filters.preco_max!);
  }
  if (filters.categoria) {
    const c = filters.categoria.toLowerCase();
    result = result.filter((t) => t.categoria.toLowerCase().includes(c));
  }
  return result;
}

/** GET /trips - Lista viagens com filtros opcionais */
export async function listTrips(req: Request, res: Response): Promise<void> {
  try {
    const trips = await getTrips();
    const filters: TripFilters = {
      destino: req.query.destino as string | undefined,
      data: req.query.data as string | undefined,
      preco_min: req.query.preco_min != null ? Number(req.query.preco_min) : undefined,
      preco_max: req.query.preco_max != null ? Number(req.query.preco_max) : undefined,
      categoria: req.query.categoria as string | undefined,
    };
    const filtered = applyFilters(trips, filters);
    res.json({
      success: true,
      data: filtered,
      meta: { total: filtered.length },
    });
  } catch (err) {
    logger.error('listTrips error', err);
    res.status(500).json({
      success: false,
      error: 'Falha ao listar viagens',
      message: err instanceof Error ? err.message : 'Erro desconhecido',
    });
  }
}

/** GET /trips/search?q= - Busca textual por nome ou destino */
export async function searchTrips(req: Request, res: Response): Promise<void> {
  try {
    const q = (req.query.q as string)?.trim();
    if (!q) {
      res.status(400).json({ success: false, error: 'Parâmetro "q" é obrigatório' });
      return;
    }
    const trips = await getTrips();
    const term = q.toLowerCase();
    const found = trips.filter(
      (t) =>
        t.titulo.toLowerCase().includes(term) ||
        t.destino.toLowerCase().includes(term) ||
        t.descricao.toLowerCase().includes(term)
    );
    res.json({
      success: true,
      data: found,
      meta: { total: found.length, query: q },
    });
  } catch (err) {
    logger.error('searchTrips error', err);
    res.status(500).json({
      success: false,
      error: 'Falha na busca',
      message: err instanceof Error ? err.message : 'Erro desconhecido',
    });
  }
}

/** GET /trips/:id - Detalhes de uma viagem (id pode ser nosso id ou url_origem) */
export async function getTripById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    const trips = await getTrips();
    let trip = trips.find((t) => t.id === id);
    if (!trip && id.length > 20) {
      const byUrl = trips.find((t) => t.url_origem === id || t.url_origem.endsWith(id));
      if (byUrl) trip = byUrl;
    }
    if (!trip) {
      const generatedId = generateTripId(id);
      trip = trips.find((t) => t.id === generatedId);
    }
    if (!trip) {
      res.status(404).json({ success: false, error: 'Viagem não encontrada', id });
      return;
    }
    res.json({ success: true, data: trip });
  } catch (err) {
    logger.error('getTripById error', err);
    res.status(500).json({
      success: false,
      error: 'Falha ao obter viagem',
      message: err instanceof Error ? err.message : 'Erro desconhecido',
    });
  }
}

/** GET /health - Status da API (indica se está em modo mock) */
export function health(_req: Request, res: Response): void {
  res.json({
    success: true,
    service: 'mimatour-api',
    status: 'ok',
    mock: USE_MOCK_DATA,
    timestamp: new Date().toISOString(),
  });
}
