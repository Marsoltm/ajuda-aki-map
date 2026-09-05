import parede from "@/assets/parede.jpg";
import calca from "@/assets/calca.jpg";
import encanamento from "@/assets/encanamento.jpg";
import jardim from "@/assets/jardim.jpg";

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
  foto: string;
  /** deslocamento em graus a partir da localizacao do usuario */
  dLat: number;
  dLng: number;
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

export const ANUNCIOS: Anuncio[] = [
  {
    id: "1",
    tipo: "procura",
    titulo: "Parede da sala para pintar",
    categoria: "Pintura",
    pessoa: "Marina S.",
    nota: 4.8,
    valor: 320,
    unidade: "pelo serviço",
    descricao: "Parede descascando, cerca de 12 m². Tinta já comprada.",
    foto: parede,
    dLat: 0.0042,
    dLng: 0.0031,
  },
  {
    id: "2",
    tipo: "procura",
    titulo: "Bainha em 3 calças jeans",
    categoria: "Costura",
    pessoa: "Rafael T.",
    nota: 4.9,
    valor: 25,
    unidade: "por peça",
    descricao: "Bainha simples, posso levar até você ou receber em casa.",
    foto: calca,
    dLat: -0.0035,
    dLng: 0.0018,
  },
  {
    id: "3",
    tipo: "oferece",
    titulo: "Encanador — conserto de vazamentos",
    categoria: "Encanamento",
    pessoa: "Seu Jorge",
    nota: 5,
    valor: 90,
    unidade: "a visita",
    descricao: "Atendo no mesmo dia. Vazamentos, torneiras e caixas d'água.",
    foto: encanamento,
    dLat: 0.0021,
    dLng: -0.0044,
  },
  {
    id: "4",
    tipo: "oferece",
    titulo: "Corte de grama e poda",
    categoria: "Jardinagem",
    pessoa: "Bia Jardins",
    nota: 4.7,
    valor: 70,
    unidade: "por quintal",
    descricao: "Levo minhas ferramentas e retiro os resíduos.",
    foto: jardim,
    dLat: -0.0052,
    dLng: -0.0026,
  },
  {
    id: "5",
    tipo: "oferece",
    titulo: "Pintora residencial",
    categoria: "Pintura",
    pessoa: "Cláudia M.",
    nota: 4.6,
    valor: 45,
    unidade: "por m²",
    descricao: "Pintura interna e externa, orçamento sem compromisso.",
    foto: parede,
    dLat: 0.006,
    dLng: -0.0012,
  },
  {
    id: "6",
    tipo: "oferece",
    titulo: "Costureira — ajustes em geral",
    categoria: "Costura",
    pessoa: "Dona Neide",
    nota: 5,
    valor: 20,
    unidade: "por ajuste",
    descricao: "Bainhas, zíperes e ajustes de cintura.",
    foto: calca,
    dLat: -0.0014,
    dLng: 0.0052,
  },
];
