/**
 * Cliente HTTP para coleta com timeout, reintentos e logs.
 * Usado tanto para tentar endpoints internos quanto para buscar HTML.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { MATOUR_BASE_URL, COLLECTOR_TIMEOUT_MS, COLLECTOR_MAX_RETRIES } from '../config/env.js';
import { logger } from '../utils/logger.js';

function createClient(): AxiosInstance {
  const client = axios.create({
    baseURL: MATOUR_BASE_URL,
    timeout: COLLECTOR_TIMEOUT_MS,
    headers: {
      'User-Agent': 'MimatourAPI/1.0 (Integração FluxiChat; coleta ética)',
      'Accept': 'text/html,application/json,application/xhtml+xml',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    },
    maxRedirects: 5,
    validateStatus: (status) => status >= 200 && status < 400,
  });

  client.interceptors.request.use((config) => {
    logger.debug('Requisição de coleta', { url: config.url, method: config.method });
    return config;
  });

  client.interceptors.response.use(
    (response) => {
      logger.debug('Resposta recebida', { url: response.config.url, status: response.status });
      return response;
    },
    (error: AxiosError) => {
      logger.error('Erro na requisição', error, {
        url: error.config?.url,
        code: error.code,
        status: error.response?.status,
      });
      return Promise.reject(error);
    }
  );

  return client;
}

/**
 * Executa uma requisição com reintentos em caso de falha temporária.
 */
export async function fetchWithRetry<T>(
  request: () => Promise<{ data: T; status: number }>,
  retries = COLLECTOR_MAX_RETRIES
): Promise<{ data: T; status: number }> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await request();
      return result;
    } catch (err) {
      lastError = err;
      const isRetryable =
        axios.isAxiosError(err) &&
        (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT' || (err.response?.status ?? 0) >= 500);
      if (attempt < retries && isRetryable) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        logger.warn(`Tentativa ${attempt}/${retries} falhou; nova tentativa em ${delay}ms`, { url: (err as AxiosError).config?.url });
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw lastError;
      }
    }
  }
  throw lastError;
}

export const collectorClient = createClient();
