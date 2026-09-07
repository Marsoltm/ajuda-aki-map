import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MapaServicos } from "@/components/MapaServicos";
import { ANUNCIOS, CATEGORIAS, type Tipo } from "@/data/anuncios";

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
function distancia(centro: { lat: number; lng: number }, a: { dLat: number; dLng: number }) {
  const rad = Math.PI / 180;
  const lat1 = centro.lat * rad;
  const lat2 = (centro.lat + a.dLat) * rad;
  const dLat = a.dLat * rad;
  const dLng = a.dLng * rad;
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

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setCentro({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => undefined,
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  const lista = useMemo(
    () =>
      ANUNCIOS.filter(
        (a) => a.tipo === modo && (categoria === "Todos" || a.categoria === categoria),
      ),
    [modo, categoria],
  );

  const selecionado = lista.find((a) => a.id === selecionadoId) ?? null;

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-background font-body">
      <MapaServicos
        centro={centro}
        anuncios={lista}
        selecionadoId={selecionadoId}
        onSelecionar={setSelecionadoId}
      />

      {/* topo */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 space-y-3 p-4">
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-float">
          <span className="grid size-9 place-items-center rounded-xl bg-primary font-display text-lg text-primary-foreground">
            A
          </span>
          <div className="min-w-0">
            <p className="font-display text-base leading-none text-foreground">Ajuda Aki</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {lista.length} {modo === "oferece" ? "prestadores" : "pedidos"} perto de você
            </p>
          </div>
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

      {/* legenda + privacidade */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-4">
        {selecionado ? (
          <article className="animate-rise overflow-hidden rounded-3xl bg-card shadow-float">
            <div className="relative">
              <img
                src={selecionado.foto}
                alt={`Foto do serviço: ${selecionado.titulo}`}
                loading="lazy"
                width={768}
                height={768}
                className="h-40 w-full object-cover"
              />
              <button
                onClick={() => setSelecionadoId(null)}
                aria-label="Fechar"
                className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-card/90 text-sm text-foreground"
              >
                ✕
              </button>
              <span
                className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                  selecionado.tipo === "oferece"
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent text-accent-foreground"
                }`}
              >
                {selecionado.tipo === "oferece" ? "Oferecendo" : "Procurando"}
              </span>
            </div>
            <div className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-lg leading-tight text-foreground">
                    {selecionado.titulo}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selecionado.pessoa} · ★ {selecionado.nota.toFixed(1)} ·{" "}
                    {selecionado.categoria}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display text-xl text-primary">
                    R$ {selecionado.valor.toLocaleString("pt-BR")}
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
              <p className="text-xs text-muted-foreground">Toque numa bolinha</p>
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
