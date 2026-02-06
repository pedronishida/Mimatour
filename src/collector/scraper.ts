/**
 * Coleta de dados do site Mimatour.
 *
 * Modos (por prioridade):
 * 1. USE_MOCK_DATA=true → retorna dados de exemplo (evita Cloudflare durante o dev).
 * 2. FIXTURE_HTML_PATH definido e arquivo existe → lê HTML do arquivo (ajuste de seletores).
 * 3. Tentar endpoints internos (JSON), se existirem.
 * 4. Playwright: abrir o site com navegador real (contorna Cloudflare).
 * 5. Fallback: buscar HTML via HTTP/axios (pode ser bloqueado por Cloudflare).
 *
 * Os seletores CSS são genéricos; ajuste após inspecionar o site (DevTools).
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import { collectorClient, fetchWithRetry } from './client.js';
import { fetchHtmlWithPlaywright } from './playwrightFetch.js';
import { MATOUR_BASE_URL, USE_MOCK_DATA, FIXTURE_HTML_PATH, FIXTURE_HTML_FULL_LIST, USE_BROWSER } from '../config/env.js';
import { logger } from '../utils/logger.js';
import type { RawTripData } from '../types/trip.js';
import { MOCK_TRIPS } from './mockData.js';

/** Seletores do site Mimatour (mimatourviagens.suareservaonline.com.br) */
const SELECTORS = {
  /** Container de cada card de pacote */
  tripCard: '.package-item',
  /** Título: div.nome_pacote h4 */
  title: '.nome_pacote h4',
  /** Link para a página do pacote */
  link: 'a[href*="/pacote/"]',
  /** Preço: div.class_valor (ex.: "R$159,00") */
  price: '.class_valor',
  /** Data saída/volta: primeiro .pacote-date.border-top */
  date: '.pacote-date.border-top',
  /** Imagem do pacote */
  image: 'img.img-fluid.principal, img.principal',
  /** Categoria (ex.: "Pacote turístico") */
  category: 'small .fa-map-marker',
};

/**
 * Tenta obter listagem via endpoint interno (JSON).
 * Muitos portais expõem algo como /api/pacotes ou /api/viagens.
 */
export async function tryFetchTripsFromApi(): Promise<RawTripData[] | null> {
  const endpoints = ['/api/pacotes', '/api/viagens', '/api/trips', '/api/produtos'];
  for (const path of endpoints) {
    try {
      const { data } = await fetchWithRetry(() =>
        collectorClient.get<unknown>(path, { timeout: 10000 })
      );
      if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)) {
        const items = (data as { items: RawTripData[] }).items;
        logger.info('Listagem obtida via API interna', { path, count: items.length });
        return items;
      }
      if (Array.isArray(data)) {
        logger.info('Listagem obtida via API interna', { path, count: (data as RawTripData[]).length });
        return data as RawTripData[];
      }
    } catch {
      // Endpoint não existe ou falhou; tenta próximo
      continue;
    }
  }
  return null;
}

/** Converte texto "R$ 1.599,00" ou "R$159,00" em número */
function parsePriceBr(text: string): number {
  const t = text.replace(/\s/g, '').replace(/R\$/i, '').trim();
  if (!t) return 0;
  const semMilhar = t.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(semMilhar);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * Extrai dados de um card de viagem no HTML (Cheerio element).
 * Estrutura real do site: .package-item com .nome_pacote h4, .class_valor, .pacote-date, etc.
 */
function parseTripCard(
  $: cheerio.CheerioAPI,
  el: AnyNode,
  baseUrl: string
): RawTripData | null {
  const $el = $(el);
  const linkEl = $el.find(SELECTORS.link).first();
  const href = linkEl.attr('href');
  const urlOrigem = href ? (href.startsWith('http') ? href : new URL(href, baseUrl).href) : '';
  const titulo = $el.find(SELECTORS.title).first().text().trim();
  if (!urlOrigem && !titulo) return null;

  const priceText = $el.find(SELECTORS.price).first().text().trim();
  const preco = parsePriceBr(priceText);
  const img = $el.find(SELECTORS.image).first().attr('src');
  const imagem_url = img ? (img.startsWith('http') ? img : new URL(img, baseUrl).href) : '';
  const dateBlock = $el.find(SELECTORS.date).first().text().trim();
  const categoria =
    $el.find('small').has('i.fa-map-marker').first().text().trim() || 'Pacote turístico';

  return {
    titulo: titulo || 'Sem título',
    destino: titulo?.slice(0, 100) || '',
    descricao: dateBlock ? `Saída/Volta: ${dateBlock}` : '',
    data_saida: '',
    data_retorno: '',
    duracao: dateBlock,
    preco,
    parcelas: null,
    disponibilidade: 'Consultar',
    categoria,
    imagem_url,
    url_origem: urlOrigem || '',
    rawId: urlOrigem || titulo,
  };
}

/**
 * Parseia uma string HTML e extrai lista de viagens (reutilizado por fetch e por fixture).
 */
function parseHtmlToTrips(html: string, baseUrl: string): RawTripData[] {
  const $ = cheerio.load(html);
  const results: RawTripData[] = [];
  const seen = new Set<string>();

  const cards = $(SELECTORS.tripCard);
  if (cards.length === 0) {
    const links = $('a[href*="pacote"], a[href*="viagem"], a[href*="trip"], a[href*="detalhe"]');
    links.each((_, el) => {
      const $a = $(el);
      const href = $a.attr('href');
      if (!href || seen.has(href)) return;
      seen.add(href);
      const fullUrl = href.startsWith('http') ? href : new URL(href, baseUrl).href;
      const titulo = $a.text().trim() || $a.find('img').attr('alt') || 'Viagem';
      if (titulo.length < 2) return;
      results.push({
        titulo,
        destino: '',
        descricao: '',
        data_saida: '',
        data_retorno: '',
        duracao: '',
        preco: 0,
        parcelas: null,
        disponibilidade: 'Consultar',
        categoria: 'Pacote',
        imagem_url: $a.find('img').attr('src') ? new URL($a.find('img').attr('src')!, baseUrl).href : '',
        url_origem: fullUrl,
        rawId: fullUrl,
      });
    });
    return results;
  }

  cards.each((_, el) => {
    const parsed = parseTripCard($, el, baseUrl);
    if (parsed?.url_origem && !seen.has(parsed.url_origem)) {
      seen.add(parsed.url_origem);
      results.push(parsed);
    } else if (parsed?.titulo && !seen.has(parsed.titulo)) {
      seen.add(parsed.titulo);
      results.push(parsed);
    }
  });
  return results;
}

/** Extrai do HTML o link "Ver Todos" (listagem completa de pacotes). */
function extractVerTodosUrl(html: string, baseUrl: string): string | null {
  const $ = cheerio.load(html);
  const href = $('a[href*="categories_data"]').first().attr('href');
  if (!href) return null;
  return href.startsWith('http') ? href : new URL(href, baseUrl).href;
}

/** Junta duas listas de viagens sem duplicar (por url_origem). */
function mergeTrips(a: RawTripData[], b: RawTripData[]): RawTripData[] {
  const byUrl = new Map<string, RawTripData>();
  for (const t of a) if (t.url_origem) byUrl.set(t.url_origem, t);
  for (const t of b) if (t.url_origem && !byUrl.has(t.url_origem)) byUrl.set(t.url_origem, t);
  return Array.from(byUrl.values());
}

/**
 * Abre o site com Playwright e extrai viagens.
 * Também acessa a página "Ver Todos" e mescla os resultados.
 */
export async function fetchTripsWithBrowser(): Promise<RawTripData[]> {
  const url = MATOUR_BASE_URL;
  const html = await fetchHtmlWithPlaywright(url);
  let results = parseHtmlToTrips(html, url);
  const verTodosUrl = extractVerTodosUrl(html, url);
  if (verTodosUrl) {
    try {
      const htmlFull = await fetchHtmlWithPlaywright(verTodosUrl);
      const fullList = parseHtmlToTrips(htmlFull, url);
      results = mergeTrips(results, fullList);
      logger.info('Listagem completa obtida (Ver Todos)', { url: verTodosUrl, count: fullList.length });
    } catch (err) {
      logger.warn('Não foi possível carregar página Ver Todos', { verTodosUrl, err });
    }
  }
  logger.info('Listagem extraída via Playwright', { total: results.length });
  return results;
}

/**
 * Busca a página HTML principal via HTTP (axios).
 * Pode ser bloqueada por Cloudflare (403).
 */
export async function fetchTripsFromHtml(): Promise<RawTripData[]> {
  const url = MATOUR_BASE_URL;
  const { data: html } = await fetchWithRetry(() =>
    collectorClient.get<string>(url, { responseType: 'text' })
  );
  const results = parseHtmlToTrips(html, url);
  logger.info('Listagem extraída do HTML (axios)', { count: results.length, selectors: SELECTORS.tripCard });
  return results;
}

/**
 * Carrega HTML de arquivos local (fixture) e extrai viagens.
 * Se FIXTURE_HTML_FULL_LIST estiver definido, carrega também a página "Ver Todos" e mescla.
 */
export async function loadTripsFromFixture(): Promise<RawTripData[] | null> {
  if (!FIXTURE_HTML_PATH) return null;
  const path = resolve(process.cwd(), FIXTURE_HTML_PATH);
  try {
    const html = await readFile(path, 'utf-8');
    let results = parseHtmlToTrips(html, MATOUR_BASE_URL);
    if (FIXTURE_HTML_FULL_LIST) {
      const pathFull = resolve(process.cwd(), FIXTURE_HTML_FULL_LIST);
      try {
        const htmlFull = await readFile(pathFull, 'utf-8');
        const fullList = parseHtmlToTrips(htmlFull, MATOUR_BASE_URL);
        results = mergeTrips(results, fullList);
        logger.info('Fixture listagem completa carregada', { path: FIXTURE_HTML_FULL_LIST, count: fullList.length });
      } catch (e) {
        logger.warn('Fixture Ver Todos não encontrado', { path: FIXTURE_HTML_FULL_LIST });
      }
    }
    logger.info('Listagem carregada de fixture', { path: FIXTURE_HTML_PATH, total: results.length });
    return results;
  } catch (err) {
    logger.warn('Fixture não encontrado ou inválido', { path: FIXTURE_HTML_PATH, err });
    return null;
  }
}

/**
 * Coleta todas as viagens.
 * Ordem: mock → fixture → API interna → Puppeteer (navegador) → axios (HTTP).
 */
export async function collectTrips(): Promise<RawTripData[]> {
  if (USE_MOCK_DATA) {
    logger.info('Usando dados MOCK (USE_MOCK_DATA=true)');
    return MOCK_TRIPS;
  }

  const fromFixture = await loadTripsFromFixture();
  if (fromFixture && fromFixture.length > 0) return fromFixture;

  const fromApi = await tryFetchTripsFromApi();
  if (fromApi && fromApi.length > 0) return fromApi;

  if (USE_BROWSER) {
    try {
      return await fetchTripsWithBrowser();
    } catch (err) {
      logger.warn('Playwright falhou, tentando axios', { err });
    }
  }
  return fetchTripsFromHtml();
}

/**
 * Busca HTML de uma página de detalhe para enriquecer uma viagem.
 * Útil para GET /trips/:id quando o id corresponde a url_origem.
 */
export async function fetchTripDetailPage(url: string): Promise<string> {
  const fullUrl = url.startsWith('http') ? url : new URL(url, MATOUR_BASE_URL).href;
  const { data } = await fetchWithRetry(() =>
    collectorClient.get<string>(fullUrl, { responseType: 'text' })
  );
  return data;
}
