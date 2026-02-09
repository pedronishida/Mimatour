/**
 * Handler da Vercel Serverless.
 * Busca por termo no path é tratada aqui (não depende do Express).
 */
import app, { getTripsRaw, toData, filterTripsByTerm } from '../app.js';

const SEARCH_PATH = /^\/(?:api\/)?trips\/search\/([^/?#]+)/i;

function getPathFromRequest(req) {
  const raw = req.url || req.originalUrl || '';
  let path = raw.split('?')[0];
  if (path.startsWith('http')) try { path = new URL(path).pathname; } catch (_) {}
  let pathFromQuery = req.query && req.query.path;
  if (typeof pathFromQuery !== 'string' && raw.includes('?')) {
    try {
      const qs = raw.slice(raw.indexOf('?') + 1);
      pathFromQuery = new URLSearchParams(qs).get('path');
    } catch (_) {}
  }
  if (typeof pathFromQuery === 'string') path = '/' + pathFromQuery.replace(/^\//, '');
  return { path, pathFromQuery };
}

export default async function handler(req, res) {
  const { path, pathFromQuery } = getPathFromRequest(req);
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
  const raw = req.url || req.originalUrl || '';
  const qs = raw.includes('?') ? raw.slice(raw.indexOf('?')) : '';
  if (typeof pathFromQuery === 'string') {
    req.url = path + qs;
  } else if (typeof req.url === 'string' && req.url.startsWith('/api')) {
    req.url = (req.url.replace(/^\/api/, '') || '/') + qs;
  }
  app(req, res);
}
