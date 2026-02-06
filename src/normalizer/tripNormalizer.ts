/**
 * Normalização de dados brutos (site ou API interna) para o modelo Trip.
 * Garante formato consistente para consumo pela API e pela IA (FluxiChat).
 */

import type { RawTripData, Trip } from '../types/trip.js';
import { generateTripId } from '../utils/id.js';

function safeNumber(value: number | string | undefined): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  const n = Number(String(value).replace(/\D/g, ''));
  return Number.isNaN(n) ? 0 : n;
}

function safeString(value: unknown, fallback: string): string {
  if (value === undefined || value === null) return fallback;
  const s = String(value).trim();
  return s || fallback;
}

/**
 * Converte um item bruto em Trip com id estável e campos padronizados.
 */
export function normalizeTrip(raw: RawTripData, index: number): Trip {
  const urlOrigem = raw.url_origem || raw.rawId || `item-${index}`;
  const id = generateTripId(urlOrigem);

  return {
    id,
    titulo: safeString(raw.titulo, 'Viagem'),
    destino: safeString(raw.destino, ''),
    descricao: safeString(raw.descricao, ''),
    data_saida: safeString(raw.data_saida, ''),
    data_retorno: safeString(raw.data_retorno, ''),
    duracao: safeString(raw.duracao, ''),
    preco: safeNumber(raw.preco),
    parcelas: raw.parcelas ? safeString(raw.parcelas, '') : null,
    disponibilidade: safeString(raw.disponibilidade, 'Consultar'),
    categoria: safeString(raw.categoria, 'Pacote'),
    imagem_url: raw.imagem_url && raw.imagem_url.startsWith('http') ? raw.imagem_url : '',
    url_origem: urlOrigem,
  };
}

/**
 * Normaliza uma lista de dados brutos para Trip[].
 */
export function normalizeTrips(rawList: RawTripData[]): Trip[] {
  return rawList.map((raw, i) => normalizeTrip(raw, i)).filter((t) => t.titulo && t.url_origem);
}
