/**
 * Logger simples para coleta e API.
 * Preparado para futura integração com sistema de logs (ex: Pino, Winston).
 */

const prefix = '[mimatour-api]';

export const logger = {
  info(message: string, meta?: Record<string, unknown>): void {
    console.log(prefix, message, meta ?? '');
  },
  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(prefix, message, meta ?? '');
  },
  error(message: string, error?: unknown, meta?: Record<string, unknown>): void {
    console.error(prefix, message, error ?? '', meta ?? '');
  },
  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(prefix, message, meta ?? '');
    }
  },
};
