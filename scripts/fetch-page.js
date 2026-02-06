/**
 * Rode no seu PC para abrir o site da Mimatour com Puppeteer e salvar o HTML.
 * Salva: fixtures/mimatour-page.html (inicial) e fixtures/mimatour-ver-todos.html (listagem completa).
 *
 * Uso: npm run build   (uma vez)
 *      npm run fetch-page
 */

import { writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import { fetchHtmlWithPlaywright } from '../dist/collector/playwrightFetch.js';
import { MATOUR_BASE_URL } from '../dist/config/env.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const outFile = join(projectRoot, 'fixtures', 'mimatour-page.html');
const outFileVerTodos = join(projectRoot, 'fixtures', 'mimatour-ver-todos.html');

async function main() {
  console.log('Abrindo site com Playwright:', MATOUR_BASE_URL);
  const html = await fetchHtmlWithPlaywright(MATOUR_BASE_URL);
  await writeFile(outFile, html, 'utf-8');
  console.log('HTML salvo em:', outFile);

  const $ = cheerio.load(html);
  const verTodosHref = $('a[href*="categories_data"]').first().attr('href');
  if (verTodosHref) {
    const verTodosUrl = verTodosHref.startsWith('http') ? verTodosHref : new URL(verTodosHref, MATOUR_BASE_URL).href;
    console.log('Abrindo listagem completa (Ver Todos):', verTodosUrl);
    const htmlFull = await fetchHtmlWithPlaywright(verTodosUrl);
    await writeFile(outFileVerTodos, htmlFull, 'utf-8');
    console.log('HTML salvo em:', outFileVerTodos);
    console.log('No .env use: FIXTURE_HTML_FULL_LIST=fixtures/mimatour-ver-todos.html');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
