/**
 * Handler da Vercel Serverless.
 * Busca por termo no path é tratada aqui (não depende do Express).
 */
import app, { getTripsRaw, toData, filterTripsByTerm } from '../app.js';

const SEARCH_PATH = /^\/(?:api\/)?trips\/search\/([^/?#]+)/i;

export default async function handler(req, res) {
  let path = (req.url || req.originalUrl || '').split('?')[0];
  if (path.startsWith('http')) try { path = new URL(path).pathname; } catch (_) {}
  const match = path.match(SEARCH_PATH);
  if (req.method === 'GET' && match) {
    const term = decodeURIComponent(match[1] || '').trim();
    if (term) {
      try {
        const raw = await getTripsRaw(true);
        const data = filterTripsByTerm(toData(raw), term);
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(200).end(JSON.stringify({ success: true, data, meta: { total: data.length, query: term } }));
        return;
      } catch (err) {
        console.error('[API] search by term:', err.message);
        res.status(500).end(JSON.stringify({ success: false, error: err.message || 'Falha na busca' }));
        return;
      }
    }
  }
  if (typeof req.url === 'string' && req.url.startsWith('/api')) {
    req.url = req.url.replace(/^\/api/, '') || '/';
  }
  app(req, res);
}
