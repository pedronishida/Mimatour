/**
 * Modelo de dados normalizado para consumo pela API e por IA.
 * Campos alinhados ao objetivo de uso em FluxiChat/Fluxitech.
 */

export interface Trip {
  id: string;
  titulo: string;
  destino: string;
  descricao: string;
  data_saida: string;
  data_retorno: string;
  duracao: string;
  preco: number;
  parcelas: string | null;
  disponibilidade: string;
  categoria: string;
  imagem_url: string;
  url_origem: string;
}

/** Filtros para listagem de viagens */
export interface TripFilters {
  destino?: string;
  data?: string;
  preco_min?: number;
  preco_max?: number;
  categoria?: string;
}

/** Dados brutos extraídos do site (antes da normalização) */
export interface RawTripData {
  titulo?: string;
  destino?: string;
  descricao?: string;
  data_saida?: string;
  data_retorno?: string;
  duracao?: string;
  preco?: number | string;
  parcelas?: string | null;
  disponibilidade?: string;
  categoria?: string;
  imagem_url?: string;
  url_origem?: string;
  /** Identificador interno do card/item na página */
  rawId?: string;
}
