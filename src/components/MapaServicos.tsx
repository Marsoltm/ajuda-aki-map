import { useEffect, useRef } from "react";
import type { Anuncio } from "@/data/anuncios";

type Coord = { lat: number; lng: number };

type Props = {
  centro: Coord;
  anuncios: Anuncio[];
  selecionadoId: string | null;
  onSelecionar: (id: string) => void;
};

declare global {
  interface Window {
    google?: any;
    __ajudaAkiMapReady?: () => void;
  }
}

let carregando: Promise<void> | null = null;

function carregarMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps) return Promise.resolve();
  if (carregando) return carregando;

  carregando = new Promise<void>((resolve, reject) => {
    const key = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"];
    const channel = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"];

    window.__ajudaAkiMapReady = () => resolve();
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__ajudaAkiMapReady&channel=${channel}`;
    s.async = true;
    s.onerror = () => reject(new Error("Falha ao carregar o mapa"));
    document.head.appendChild(s);
  });
  return carregando;
}

const ESTILO_MAPA = [
  { elementType: "geometry", stylers: [{ color: "#f6f2ea" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6b6157" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f6f2ea" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#f0e7d8" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#cfe3e0" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#e8eede" }] },
];

function ponto(cor: string, ativo: boolean) {
  return {
    path: 0, // google.maps.SymbolPath.CIRCLE
    scale: ativo ? 13 : 9,
    fillColor: cor,
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: ativo ? 4 : 3,
  };
}

export function MapaServicos({ centro, anuncios, selecionadoId, onSelecionar }: Props) {
  const div = useRef<HTMLDivElement | null>(null);
  const mapa = useRef<any>(null);
  const marcadores = useRef<Record<string, any>>({});

  useEffect(() => {
    let cancelado = false;
    carregarMaps()
      .then(() => {
        if (cancelado || !div.current || !window.google) return;
        mapa.current = new window.google.maps.Map(div.current, {
          center: centro,
          zoom: 15,
          disableDefaultUI: true,
          gestureHandling: "greedy",
          styles: ESTILO_MAPA,
        });

        new window.google.maps.Marker({
          position: centro,
          map: mapa.current,
          icon: {
            path: 0,
            scale: 8,
            fillColor: "#2b6cb0",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 4,
          },
          zIndex: 1,
          title: "Você está aqui",
        });
      })
      .catch(() => undefined);
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapa.current || !window.google) return;
    const atuais = marcadores.current;
    const ids = new Set(anuncios.map((a) => a.id));

    Object.keys(atuais).forEach((id) => {
      if (!ids.has(id)) {
        atuais[id].setMap(null);
        delete atuais[id];
      }
    });

    anuncios.forEach((a) => {
      const cor = a.tipo === "oferece" ? "#e2661a" : "#1f8a70";
      const ativo = a.id === selecionadoId;
      if (!atuais[a.id]) {
        const m = new window.google.maps.Marker({
          position: { lat: centro.lat + a.dLat, lng: centro.lng + a.dLng },
          map: mapa.current,
          icon: ponto(cor, ativo),
          zIndex: 5,
        });
        m.addListener("click", () => onSelecionar(a.id));
        atuais[a.id] = m;
      } else {
        atuais[a.id].setIcon(ponto(cor, ativo));
      }
    });
  }, [anuncios, selecionadoId, centro, onSelecionar]);

  useEffect(() => {
    if (!mapa.current || !selecionadoId) return;
    const a = anuncios.find((x) => x.id === selecionadoId);
    if (a) mapa.current.panTo({ lat: centro.lat + a.dLat, lng: centro.lng + a.dLng });
  }, [selecionadoId, anuncios, centro]);

  return <div ref={div} className="absolute inset-0" aria-label="Mapa de serviços por perto" />;
}
