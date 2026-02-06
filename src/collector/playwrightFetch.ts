/**
 * Abre o site com Playwright (navegador real) e retorna o HTML.
 * Forma mais simples: um browser, uma página, fechar.
 */

import { chromium } from 'playwright';
import { logger } from '../utils/logger.js';

const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Abre a URL no Chromium (Playwright) e devolve o HTML da página.
 */
export async function fetchHtmlWithPlaywright(
  url: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<string> {
  let browser = null;
  try {
    logger.info('Abrindo site com Playwright', { url });
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: timeoutMs,
    });

    const html = await page.content();
    logger.info('Página carregada via Playwright', { url, length: html.length });
    return html;
  } finally {
    if (browser) {
      await browser.close().catch((err: unknown) => logger.warn('Erro ao fechar browser', { err }));
    }
  }
}
