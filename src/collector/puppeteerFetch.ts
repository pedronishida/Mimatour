/**
 * Busca HTML usando Puppeteer (navegador real).
 * Usado para contornar Cloudflare: o site vê um Chrome real e libera o acesso.
 */

import puppeteer, { type Browser } from 'puppeteer';
import { logger } from '../utils/logger.js';

const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Abre a URL em um navegador headless e retorna o HTML da página após carregar.
 * Fecha o browser ao finalizar (sucesso ou erro).
 */
export async function fetchHtmlWithPuppeteer(
  url: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<string> {
  let browser: Browser | null = null;
  try {
    logger.info('Abrindo navegador (Puppeteer) para coletar página', { url });
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
      ],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: timeoutMs,
    });

    const html = await page.content();
    logger.info('Página carregada via Puppeteer', { url, length: html.length });
    return html;
  } finally {
    if (browser) {
      await browser.close().catch((err) => logger.warn('Erro ao fechar browser', { err }));
    }
  }
}
