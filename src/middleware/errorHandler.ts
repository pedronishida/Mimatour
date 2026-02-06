/**
 * Middleware global de erros para respostas JSON padronizadas.
 */

import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error('Erro não tratado', err);
  const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(status).json({
    success: false,
    error: 'Erro interno',
    message: err instanceof Error ? err.message : 'Erro desconhecido',
  });
}
