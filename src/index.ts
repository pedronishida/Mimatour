/**
 * Entrada da API Mimatour.
 * Servidor Express com rotas de viagens e health check.
 */

import express from 'express';
import tripsRouter from './routes/trips.js';
import { errorHandler } from './middleware/errorHandler.js';
import { PORT } from './config/env.js';
import { logger } from './utils/logger.js';

const app = express();

app.use(express.json());
app.use((_req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Monta rotas em / (ou use app.use('/api', tripsRouter) para prefixo /api)
app.use('/', tripsRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`API Mimatour rodando em http://localhost:${PORT}`, {
    health: `http://localhost:${PORT}/health`,
    trips: `http://localhost:${PORT}/trips`,
  });
});
