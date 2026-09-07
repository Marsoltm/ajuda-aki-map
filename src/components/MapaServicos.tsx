import { useEffect, useRef, useState } from "react";
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
    s.onerror = () => {
      carregando = null;
      reject(new Error("Falha ao carregar o mapa"));
    };
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
  const voce = useRef<any>(null);
  const marcadores = useRef<Record<string, any>>({});
  const [status, setStatus] = useState<"carregando" | "pronto" | "erro">("carregando");

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
          clickableIcons: false,
          styles: ESTILO_MAPA,
        });

        voce.current = new window.google.maps.Marker({
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

        mapa.current.addListener("click", () => onSelecionarRef.current(""));
        setStatus("pronto");
      })
      .catch(() => {
        if (!cancelado) setStatus("erro");
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // permite limpar a seleção tocando no mapa, sem recriar o listener
  const onSelecionarRef = useRef(onSelecionar);
  onSelecionarRef.current = onSelecionar;

  // seu marcador acompanha o GPS quando ele chega
  useEffect(() => {
    if (!mapa.current || !voce.current) return;
    voce.current.setPosition(centro);
    mapa.current.panTo(centro);
  }, [centro]);

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
      const pos = { lat: a.lat, lng: a.lng };
      if (!atuais[a.id]) {
        const m = new window.google.maps.Marker({
          position: pos,
          map: mapa.current,
          icon: ponto(cor, ativo),
          zIndex: 5,
          title: a.titulo,
        });
        m.addListener("click", () => onSelecionarRef.current(a.id));
        atuais[a.id] = m;
      } else {
        atuais[a.id].setPosition(pos);
        atuais[a.id].setIcon(ponto(cor, ativo));
      }
    });
  }, [anuncios, selecionadoId, centro]);

  // enquadra todas as bolinhas quando a lista muda e nada está selecionado
  useEffect(() => {
    if (!mapa.current || !window.google || selecionadoId || anuncios.length === 0) return;
    const b = new window.google.maps.LatLngBounds();
    b.extend(centro);
    anuncios.forEach((a) => b.extend({ lat: a.lat, lng: a.lng }));
    mapa.current.fitBounds(b, { top: 200, bottom: 140, left: 32, right: 32 });
  }, [anuncios, centro, selecionadoId, status]);

  useEffect(() => {
    if (!mapa.current || !selecionadoId) return;
    const a = anuncios.find((x) => x.id === selecionadoId);
    if (a) mapa.current.panTo({ lat: a.lat, lng: a.lng });
  }, [selecionadoId, anuncios, centro]);

  return (
    <div className="absolute inset-0">
      <div ref={div} className="absolute inset-0" aria-label="Mapa de serviços por perto" />
      {status === "carregando" && (
        <div className="absolute inset-0 grid place-items-center bg-background">
          <p className="animate-pulse text-sm text-muted-foreground">Carregando o mapa…</p>
        </div>
      )}
      {status === "erro" && (
        <div className="absolute inset-0 grid place-items-center bg-background p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar o mapa agora. Verifique sua conexão e tente de novo.
          </p>
        </div>
      )}
    </div>
  );
}
