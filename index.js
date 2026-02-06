/**
 * Servidor local - sobe a API na porta PORT.
 * Na Vercel, o entry é api/index.js (vercel.json).
 */
import app from './app.js';

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`[API] Mimatour rodando em http://localhost:${PORT}`);
  console.log(`[API] Health: http://localhost:${PORT}/health`);
  console.log(`[API] Trips:  http://localhost:${PORT}/trips`);
  console.log(`[API] Webhook: POST http://localhost:${PORT}/webhook/in`);
});
