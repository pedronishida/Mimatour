/**
 * Configuração carregada de variáveis de ambiente.
 * Nenhum dado sensível hardcoded; uso de dotenv.
 */

import dotenv from 'dotenv';

dotenv.config();

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) throw new Error(`Variável de ambiente obrigatória: ${key}`);
  return value;
};

const getEnvNumber = (key: string, defaultValue: number): number => {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return defaultValue;
  const n = Number(raw);
  if (Number.isNaN(n)) return defaultValue;
  return n;
};

/** URL base do site Mimatour (ex: https://mimatourviagens.suareservaonline.com.br) */
export const MATOUR_BASE_URL = process.env.MATOUR_BASE_URL ?? 'https://mimatourviagens.suareservaonline.com.br';

/** Porta do servidor HTTP */
export const PORT = getEnvNumber('PORT', 3000);

/** Timeout em ms para requisições de coleta */
export const COLLECTOR_TIMEOUT_MS = getEnvNumber('COLLECTOR_TIMEOUT_MS', 15000);

/** Número máximo de tentativas na coleta */
export const COLLECTOR_MAX_RETRIES = getEnvNumber('COLLECTOR_MAX_RETRIES', 3);

/**
 * Modo mock: retorna dados de exemplo sem acessar o site.
 * Use enquanto Cloudflare bloqueia ou para desenvolver a integração (ex: FluxiChat).
 */
export const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true' || process.env.USE_MOCK_DATA === '1';

/**
 * Caminho para um arquivo HTML salvo da listagem do site (página inicial).
 */
export const FIXTURE_HTML_PATH = process.env.FIXTURE_HTML_PATH?.trim() || '';

/**
 * Caminho para o HTML da página "Ver Todos" (listagem completa, ~29 pacotes).
 * Se definido e o arquivo existir, as viagens são mescladas ao FIXTURE_HTML_PATH (sem duplicar).
 */
export const FIXTURE_HTML_FULL_LIST = process.env.FIXTURE_HTML_FULL_LIST?.trim() || '';

/**
 * Usar Playwright (navegador real) para abrir o site e contornar Cloudflare.
 * Padrão: true. Defina false para pular o browser e tentar só axios.
 */
export const USE_BROWSER =
  process.env.USE_BROWSER !== 'false' &&
  process.env.USE_BROWSER !== '0' &&
  process.env.USE_PUPPETEER !== 'false' &&
  process.env.USE_PUPPETEER !== '0';
