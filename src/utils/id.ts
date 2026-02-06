/**
 * Geração de IDs estáveis para viagens.
 * Baseado em url_origem ou conteúdo para manter consistência entre requisições.
 * Futuro: pode ser substituído por ID do banco de dados.
 */

import { createHash } from 'node:crypto';

export function generateTripId(urlOrSeed: string): string {
  const hash = createHash('sha256').update(urlOrSeed).digest('hex');
  return hash.slice(0, 16);
}
