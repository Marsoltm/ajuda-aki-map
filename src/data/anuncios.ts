export type Tipo = "oferece" | "procura";

export type Anuncio = {
  id: string;
  tipo: Tipo;
  titulo: string;
  categoria: string;
  pessoa: string;
  nota: number;
  valor: number;
  unidade: string;
  descricao: string;
  foto_url: string | null;
  /** localização real */
  lat: number;
  lng: number;
};

export const CATEGORIAS = [
  "Todos",
  "Pintura",
  "Costura",
  "Encanamento",
  "Jardinagem",
  "Elétrica",
  "Limpeza",
] as const;
