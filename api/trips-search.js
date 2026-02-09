/**
 * Rota dedicada: GET /api/trips-search?term=ilhabela
 * Chamada pelo rewrite /trips/search/:term -> /api/trips-search?term=:term
 */
import { getTripsRaw, toData, filterTripsByTerm } from '../app.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).setHeader('Content-Type', 'application/json').end(JSON.stringify({ success: false, error: 'Method not allowed' }));
    return;
  }
  let term = (req.query && req.query.term) || '';
  if (typeof term !== 'string') term = '';
  term = term.trim();
  if (!term) {
    res.status(400).setHeader('Content-Type', 'application/json').end(JSON.stringify({ success: false, error: 'Parâmetro "term" é obrigatório' }));
    return;
  }
  try {
    const raw = await getTripsRaw(true);
    const data = filterTripsByTerm(toData(raw), term);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).end(JSON.stringify({ success: true, data, meta: { total: data.length, query: term } }));
  } catch (err) {
    console.error('[API] trips-search:', err.message);
    res.status(500).setHeader('Content-Type', 'application/json').end(JSON.stringify({ success: false, error: err.message || 'Falha na busca' }));
  }
}
