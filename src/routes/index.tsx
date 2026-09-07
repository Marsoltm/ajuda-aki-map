import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapaServicos } from "@/components/MapaServicos";
import { CATEGORIAS, type Anuncio, type Tipo } from "@/data/anuncios";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ajuda Aki — serviços perto de você no mapa" },
      {
        name: "description",
        content:
          "Veja no mapa quem oferece ou procura serviços perto de você, com fotos do trabalho e valor na hora.",
      },
      { property: "og:title", content: "Ajuda Aki — serviços perto de você no mapa" },
      {
        property: "og:description",
        content:
          "Veja no mapa quem oferece ou procura serviços perto de você, com fotos do trabalho e valor na hora.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const PADRAO = { lat: -23.5615, lng: -46.6559 };

/** distância em metros entre o usuário e um anúncio */
function distancia(centro: { lat: number; lng: number }, a: { lat: number; lng: number }) {
  const rad = Math.PI / 180;
  const lat1 = centro.lat * rad;
  const lat2 = a.lat * rad;
  const dLat = (a.lat - centro.lat) * rad;
  const dLng = (a.lng - centro.lng) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * 6371000 * Math.asin(Math.sqrt(h)));
}

function formatarDistancia(m: number) {
  return m < 1000 ? `${m} m de você` : `${(m / 1000).toFixed(1).replace(".", ",")} km de você`;
}

function Index() {
  const [centro, setCentro] = useState(PADRAO);
  const [modo, setModo] = useState<Tipo>("oferece");
  const [categoria, setCategoria] = useState<string>("Todos");
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [compartilhando, setCompartilhando] = useState(false);

  // GPS ao vivo: acompanha o usuário enquanto ele se move
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (p) => setCentro({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 10000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const { data: anuncios = [] } = useQuery({
    queryKey: ["anuncios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anuncios")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Anuncio[];
    },
  });

  const lista = useMemo(
    () =>
      anuncios.filter(
        (a) => a.tipo === modo && (categoria === "Todos" || a.categoria === categoria),
      ),
    [anuncios, modo, categoria],
  );

  const selecionado = lista.find((a) => a.id === selecionadoId) ?? null;

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-background font-body">
      <MapaServicos
        centro={centro}
        anuncios={lista}
        selecionadoId={selecionadoId}
        onSelecionar={(id) => setSelecionadoId(id || null)}
      />

      {/* topo */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 space-y-3 p-4">
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-float">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary font-display text-lg text-primary-foreground">
            A
          </span>
          <div className="min-w-0">
            <p className="font-display text-base leading-none text-foreground">Ajuda Aki</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {lista.length} {modo === "oferece" ? "prestadores" : "pedidos"} perto de você
            </p>
          </div>
          <Link
            to="/admin"
            className="ml-auto shrink-0 rounded-xl bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground"
          >
            Painel
          </Link>
        </div>

        <div className="pointer-events-auto grid grid-cols-2 gap-1 rounded-2xl bg-card p-1 shadow-float">
          {(["oferece", "procura"] as Tipo[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                setModo(t);
                setSelecionadoId(null);
              }}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                modo === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {t === "oferece" ? "Quero contratar" : "Quero trabalhar"}
            </button>
          ))}
        </div>

        <div className="pointer-events-auto -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
          {CATEGORIAS.map((c) => (
            <button
              key={c}
              onClick={() => {
                setCategoria(c);
                setSelecionadoId(null);
              }}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold shadow-soft transition-colors ${
                categoria === c
                  ? "bg-foreground text-background"
                  : "bg-card text-muted-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* legenda + card */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-4">
        {selecionado ? (
          <article className="animate-rise overflow-hidden rounded-3xl bg-card shadow-float">
            {selecionado.foto_url && (
              <div className="relative">
                <img
                  src={selecionado.foto_url}
                  alt={`Foto do serviço: ${selecionado.titulo}`}
                  loading="lazy"
                  className="h-40 w-full object-cover"
                />
              </div>
            )}
            <div className="relative space-y-3 p-4">
              <button
                onClick={() => setSelecionadoId(null)}
                aria-label="Fechar"
                className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-muted text-sm text-foreground"
              >
                ✕
              </button>
              <span
                className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                  selecionado.tipo === "oferece"
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent text-accent-foreground"
                }`}
              >
                {selecionado.tipo === "oferece" ? "Oferecendo" : "Procurando"}
              </span>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-lg leading-tight text-foreground">
                    {selecionado.titulo}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selecionado.pessoa} · ★ {Number(selecionado.nota).toFixed(1)} ·{" "}
                    {selecionado.categoria}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-accent">
                    {formatarDistancia(distancia(centro, selecionado))}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display text-xl text-primary">
                    R$ {Number(selecionado.valor).toLocaleString("pt-BR")}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{selecionado.unidade}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{selecionado.descricao}</p>
              <button className="w-full rounded-2xl bg-primary py-3 font-display text-base text-primary-foreground transition-transform active:scale-[0.98]">
                Conversar
              </button>
            </div>
          </article>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-card px-4 py-3 shadow-float">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <i className="size-2.5 rounded-full bg-primary" /> oferece
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="size-2.5 rounded-full bg-accent" /> procura
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {lista.length === 0 ? "Nada nessa categoria por perto" : "Toque numa bolinha"}
              </p>
            </div>
            <button
              onClick={() => setCompartilhando((v) => !v)}
              className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold shadow-float transition-colors ${
                compartilhando
                  ? "bg-accent text-accent-foreground"
                  : "bg-card text-foreground"
              }`}
            >
              {compartilhando
                ? "Sua localização está visível no mapa"
                : "Aparecer no mapa para outras pessoas"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
