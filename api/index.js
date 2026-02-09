/**
 * Handler da Vercel Serverless.
 * Rewrite envia /trips/... para /api/trips/...; removemos o prefixo /api para o Express ver /trips/...
 */
import app from '../app.js';

export default function handler(req, res) {
  if (typeof req.url === 'string' && req.url.startsWith('/api')) {
    req.url = req.url.replace(/^\/api/, '') || '/';
  }
  app(req, res);
}
