/**
 * Dados de exemplo para uso quando USE_MOCK_DATA=true.
 * Permite desenvolver e testar a API (incl. integração FluxiChat) sem acessar
 * o site (evitando bloqueio Cloudflare).
 */

import type { RawTripData } from '../types/trip.js';

const BASE = 'https://mimatourviagens.suareservaonline.com.br';

export const MOCK_TRIPS: RawTripData[] = [
  {
    titulo: 'Serra Gaúcha - Gramado e Canela',
    destino: 'Gramado, RS',
    descricao: 'Roteiro 4 dias com parques, vinícolas e chocolate.',
    data_saida: '2025-03-01',
    data_retorno: '2025-03-04',
    duracao: '4 dias',
    preco: 1899,
    parcelas: '6x de R$ 316,50',
    disponibilidade: 'Vagas limitadas',
    categoria: 'Pacote',
    imagem_url: `${BASE}/img/serra-gaucha.jpg`,
    url_origem: `${BASE}/pacote/serra-gaucha-gramado`,
    rawId: `${BASE}/pacote/serra-gaucha-gramado`,
  },
  {
    titulo: 'Bonito - Mato Grosso do Sul',
    destino: 'Bonito, MS',
    descricao: 'Flutuação, cachoeiras e grutas.',
    data_saida: '2025-04-10',
    data_retorno: '2025-04-15',
    duracao: '6 dias',
    preco: 3290,
    parcelas: '10x de R$ 329,00',
    disponibilidade: 'Consultar',
    categoria: 'Pacote',
    imagem_url: `${BASE}/img/bonito.jpg`,
    url_origem: `${BASE}/pacote/bonito-ms`,
    rawId: `${BASE}/pacote/bonito-ms`,
  },
  {
    titulo: 'Fernando de Noronha',
    destino: 'Fernando de Noronha, PE',
    descricao: 'Praias e mergulho.',
    data_saida: '2025-06-01',
    data_retorno: '2025-06-05',
    duracao: '5 dias',
    preco: 4590,
    parcelas: null,
    disponibilidade: 'Consultar',
    categoria: 'Pacote',
    imagem_url: `${BASE}/img/noronha.jpg`,
    url_origem: `${BASE}/pacote/fernando-de-noronha`,
    rawId: `${BASE}/pacote/fernando-de-noronha`,
  },
];
