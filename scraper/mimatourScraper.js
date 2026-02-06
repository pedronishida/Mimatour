/**
 * Scraper Mimatour - Playwright (Chromium)
 * Acessa o site da Mimatour, renderiza a página (Cloudflare ok) e extrai dados reais das viagens.
 * Base para integração com FluxiChat.
 */

import { chromium } from 'playwright';

const BASE_URL = 'https://mimatourviagens.suareservaonline.com.br/';
/** Página com TODOS os pacotes (todos os meses, todos os destinos) */
const LISTAGEM_ALL_URL = `${BASE_URL}44022?mes=all&destino=`;
const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Gera id único a partir do link ou índice.
 */
function generateId(sourceUrl, index) {
  if (sourceUrl) {
    const match = sourceUrl.match(/\/([^/]+)\/44022/);
    if (match) return `mimatour-${match[1]}`;
  }
  return `mimatour-${index}`;
}

/**
 * Extrai valor numérico do preço (ex: "R$159,00" -> 159)
 */
function parsePrice(text) {
  if (!text) return null;
  const cleaned = String(text).replace(/[^\d,]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Extrai data do texto "Saída 07 de fev > sáb" ou "Volta 08 de fev > dom"
 */
function parseDateText(text) {
  if (!text || typeof text !== 'string') return null;
  return text.trim() || null;
}

/**
 * Extrai duração em dias entre saída e volta (se ambos existirem).
 */
function calcDurationDays(departureText, returnText) {
  if (!departureText || !returnText) return null;
  // Formato: "07 de fev" e "08 de fev" -> 1 dia
  const depMatch = departureText.match(/(\d{1,2})\s+de\s+(\w+)/);
  const retMatch = returnText.match(/(\d{1,2})\s+de\s+(\w+)/);
  if (!depMatch || !retMatch) return null;
  const depDay = parseInt(depMatch[1], 10);
  const retDay = parseInt(retMatch[1], 10);
  if (isNaN(depDay) || isNaN(retDay)) return null;
  let diff = retDay - depDay;
  if (diff < 0) diff += 30; // mês diferente
  return diff + 1;
}

/**
 * Extrai destinação a partir do título (ex: "ILHABELA FEVEREIRO 2026" -> "Ilhabela")
 */
function extractDestination(title) {
  if (!title) return null;
  // Remove emojis e sufixos comuns
  const cleaned = String(title)
    .replace(/▶️|▶/g, '')
    .replace(/\s*(FEVEREIRO|JANEIRO|MARÇO|ABRIL|MAIO|JUNHO|JULHO|AGOSTO|SETEMBRO|OUTUBRO|NOVEMBRO|DEZEMBRO)\s*\d{4}/gi, '')
    .replace(/\s*-\s*\d{1,2}\s+DE\s+\w+/gi, '')
    .replace(/\s*feriado\s+(\w+)?/gi, '')
    .trim();
  return cleaned || null;
}

/**
 * Extrai os cards da página atual (função reutilizada).
 */
function extractTripsFromPage() {
  const items = [];
  const cards = document.querySelectorAll('.package-item');
  cards.forEach((card, index) => {
    const linkEl = card.querySelector('a[href*="/pacote/"]');
    const sourceUrl = linkEl ? linkEl.getAttribute('href') : null;
    const titleEl = card.querySelector('.nome_pacote h4');
    const title = titleEl ? titleEl.textContent.trim() : null;
    const badgeEl = card.querySelector('.blog-date small');
    const badgeText = badgeEl ? badgeEl.textContent.trim().toUpperCase() : '';
    const availability = !badgeText.includes('ESGOTADO');
    const imgEl = card.querySelector('img.img-fluid.principal') || card.querySelector('img');
    const imageUrl = imgEl ? imgEl.getAttribute('src') : null;
    let priceEl = card.querySelector('.class_valor');
    let priceText = priceEl ? priceEl.textContent.trim() : null;
    if (!priceText) {
      const priceContainer = card.querySelector('.border-top.mt-3.pt-4 h4, .border-top.mt-2.pt-4 h4');
      if (priceContainer) {
        const valorDiv = priceContainer.querySelector('.class_valor');
        priceText = valorDiv ? valorDiv.textContent.trim() : null;
      }
    }
    const dateContainers = card.querySelectorAll('.pacote-date');
    let departureDate = null;
    let returnDate = null;
    const descriptionParts = [];
    for (const dc of dateContainers) {
      const dateText = dc.textContent || '';
      if (dateText.includes('Saída') && dateText.includes('Volta')) {
        const saidaMatch = dateText.match(/Saída\s+([^V]+?)(?=Volta|$)/s);
        const voltaMatch = dateText.match(/Volta\s+([^\n]+?)(?=\s*$|Com\s|Seguro|Taxa|kit|Passeio)/s);
        if (saidaMatch) departureDate = saidaMatch[1].trim();
        if (voltaMatch) returnDate = voltaMatch[1].trim();
        break;
      }
    }
    const descSpans = card.querySelectorAll('.pacote-date.mt-1.pt-1 span[style*="vertical-align: sub"]');
    descSpans.forEach((span) => {
      const txt = span.textContent.trim();
      if (txt && !txt.includes('Saída') && !txt.includes('Volta')) descriptionParts.push(txt);
    });
    items.push({
      sourceUrl,
      title,
      availability,
      imageUrl,
      priceText,
      departureDate,
      returnDate,
      description: descriptionParts.length > 0 ? descriptionParts.join('; ') : null,
      index,
    });
  });
  return items;
}

/**
 * Executa o scraping no site Mimatour com Playwright.
 * Acessa a página de listagem completa (mes=all&destino=) com todas as viagens.
 * @param {Object} options
 * @param {boolean} options.headless - false para ver o browser
 * @returns {Promise<Array>} Lista de viagens
 */
export async function scrapeMimatourTrips(options = {}) {
  const { headless = false } = options;
  let browser = null;

  try {
    console.log('[Scraper] Abrindo Chromium com Playwright...');
    browser = await chromium.launch({
      headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Primeiro a homepage para passar Cloudflare/cookies, depois a listagem completa
    console.log('[Scraper] Navegando para homepage...');
    await page.goto(BASE_URL, { waitUntil: 'load', timeout: DEFAULT_TIMEOUT_MS });
    await page.waitForSelector('.package-item', { timeout: 15000 }).catch(() => {});

    console.log('[Scraper] Navegando para listagem completa (mes=all):', LISTAGEM_ALL_URL);
    await page.goto(LISTAGEM_ALL_URL, { waitUntil: 'load', timeout: 45000 });
    await page.waitForSelector('.package-item', { timeout: 20000 });

    // Scroll para carregar lazy-load (mais pacotes podem aparecer ao rolar)
    await page.evaluate(async () => {
      for (let s = 0; s < 8; s++) {
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise((r) => setTimeout(r, 500));
      }
      window.scrollTo(0, 0);
    });

    const allRaw = await page.evaluate(extractTripsFromPage);
    console.log(`[Scraper] Extraídos ${allRaw.length} pacotes.`);

    // Normalizar para o modelo de dados da API
    const normalized = allRaw.map((raw, i) => {
      const price = parsePrice(raw.priceText);
      const durationDays = calcDurationDays(raw.departureDate, raw.returnDate);

      return {
        id: generateId(raw.sourceUrl, i),
        title: raw.title || `Pacote ${i + 1}`,
        destination: extractDestination(raw.title),
        description: raw.description || null,
        departure_date: parseDateText(raw.departureDate),
        return_date: parseDateText(raw.returnDate),
        duration_days: durationDays,
        price: price,
        availability: raw.availability,
        image_url: raw.imageUrl && raw.imageUrl.startsWith('http') ? raw.imageUrl : null,
        source_url: raw.sourceUrl,
      };
    });

    return normalized;
  } catch (err) {
    console.error('[Scraper] Erro:', err.message);
    throw err;
  } finally {
    if (browser) {
      await browser.close().catch((e) => console.warn('[Scraper] Erro ao fechar browser:', e.message));
      console.log('[Scraper] Browser fechado.');
    }
  }
}
