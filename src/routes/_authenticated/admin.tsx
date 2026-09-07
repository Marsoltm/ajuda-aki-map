import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIAS, type Anuncio, type Tipo } from "@/data/anuncios";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel de anúncios — Ajuda Aki" },
      {
        name: "description",
        content: "Cadastre, edite e apague os anúncios de serviço que aparecem no mapa do Ajuda Aki.",
      },
      { property: "og:title", content: "Painel de anúncios — Ajuda Aki" },
      {
        property: "og:description",
        content: "Cadastre, edite e apague os anúncios de serviço que aparecem no mapa do Ajuda Aki.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Admin,
});

type Form = {
  id: string | null;
  tipo: Tipo;
  titulo: string;
  categoria: string;
  pessoa: string;
  nota: string;
  valor: string;
  unidade: string;
  descricao: string;
  foto_url: string | null;
  lat: string;
  lng: string;
};

const VAZIO: Form = {
  id: null,
  tipo: "oferece",
  titulo: "",
  categoria: "Pintura",
  pessoa: "",
  nota: "5",
  valor: "0",
  unidade: "pelo serviço",
  descricao: "",
  foto_url: null,
  lat: "",
  lng: "",
};

const OPCOES = CATEGORIAS.filter((c) => c !== "Todos");

function Admin() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<Form>(VAZIO);
  const [erro, setErro] = useState<string | null>(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  const { data: ehAdmin, isLoading: verificando } = useQuery({
    queryKey: ["ehAdmin"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("reivindicar_admin");
      if (error) throw error;
      return Boolean(data);
    },
  });

  const { data: anuncios = [], isLoading } = useQuery({
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

  useEffect(() => {
    if (form.id === null && !form.lat && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((p) =>
        setForm((f) =>
          f.id === null && !f.lat
            ? { ...f, lat: p.coords.latitude.toFixed(6), lng: p.coords.longitude.toFixed(6) }
            : f,
        ),
      );
    }
  }, [form.id, form.lat]);

  const salvar = useMutation({
    mutationFn: async (f: Form) => {
      const registro = {
        tipo: f.tipo,
        titulo: f.titulo.trim(),
        categoria: f.categoria,
        pessoa: f.pessoa.trim(),
        nota: Math.min(5, Math.max(0, Number(f.nota) || 0)),
        valor: Math.max(0, Number(f.valor) || 0),
        unidade: f.unidade.trim(),
        descricao: f.descricao.trim(),
        foto_url: f.foto_url,
        lat: Number(f.lat),
        lng: Number(f.lng),
      };
      if (f.id) {
        const { error } = await supabase.from("anuncios").update(registro).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("anuncios").insert(registro);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setForm(VAZIO);
      setErro(null);
      qc.invalidateQueries({ queryKey: ["anuncios"] });
    },
    onError: (e: Error) => setErro(e.message),
  });

  const apagar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("anuncios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["anuncios"] }),
  });

  async function subirFoto(arquivo: File) {
    setErro(null);
    setEnviandoFoto(true);
    const ext = arquivo.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const caminho = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("anuncios").upload(caminho, arquivo, {
      contentType: arquivo.type || "image/jpeg",
    });
    if (error) {
      setErro("Não foi possível enviar a foto.");
      setEnviandoFoto(false);
      return;
    }
    const { data } = await supabase.storage
      .from("anuncios")
      .createSignedUrl(caminho, 60 * 60 * 24 * 3650);
    setForm((f) => ({ ...f, foto_url: data?.signedUrl ?? null }));
    setEnviandoFoto(false);
  }

  async function sair() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const valido = useMemo(
    () => form.titulo.trim().length > 2 && form.lat !== "" && form.lng !== "",
    [form],
  );

  if (verificando) {
    return <p className="p-6 text-sm text-muted-foreground">Carregando painel...</p>;
  }

  if (!ehAdmin) {
    return (
      <main className="min-h-dvh bg-background p-6 font-body">
        <div className="mx-auto max-w-sm space-y-4 rounded-2xl bg-card p-5 shadow-float">
          <h1 className="font-display text-lg text-foreground">Acesso restrito</h1>
          <p className="text-sm text-muted-foreground">
            Esta conta não tem permissão para gerenciar os anúncios.
          </p>
          <button onClick={sair} className="w-full rounded-2xl bg-muted py-3 text-sm font-semibold">
            Sair
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-background px-4 py-6 font-body">
      <div className="mx-auto w-full max-w-lg space-y-5">
        <header className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-float">
          <div className="min-w-0">
            <h1 className="font-display text-base text-foreground">Painel de anúncios</h1>
            <p className="text-xs text-muted-foreground">{anuncios.length} no mapa</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Link to="/" className="rounded-xl bg-muted px-3 py-2 text-xs font-semibold">
              Mapa
            </Link>
            <button onClick={sair} className="rounded-xl bg-muted px-3 py-2 text-xs font-semibold">
              Sair
            </button>
          </div>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (valido) salvar.mutate(form);
          }}
          className="space-y-3 rounded-2xl bg-card p-4 shadow-float"
        >
          <h2 className="font-display text-sm text-foreground">
            {form.id ? "Editar anúncio" : "Novo anúncio"}
          </h2>

          <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            {(["oferece", "procura"] as Tipo[]).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setForm((f) => ({ ...f, tipo: t }))}
                className={`rounded-lg px-2 py-2 text-xs font-semibold ${
                  form.tipo === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {t === "oferece" ? "Oferecendo" : "Procurando"}
              </button>
            ))}
          </div>

          <Campo label="Título">
            <input
              value={form.titulo}
              maxLength={120}
              onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              className={inputCls}
              placeholder="Ex.: Parede da sala para pintar"
            />
          </Campo>

          <div className="grid grid-cols-2 gap-3">
            <Campo label="Categoria">
              <select
                value={form.categoria}
                onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                className={inputCls}
              >
                {OPCOES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Pessoa">
              <input
                value={form.pessoa}
                maxLength={80}
                onChange={(e) => setForm((f) => ({ ...f, pessoa: e.target.value }))}
                className={inputCls}
                placeholder="Nome"
              />
            </Campo>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Campo label="Valor (R$)">
              <input
                type="number"
                min={0}
                value={form.valor}
                onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
                className={inputCls}
              />
            </Campo>
            <Campo label="Unidade">
              <input
                value={form.unidade}
                maxLength={40}
                onChange={(e) => setForm((f) => ({ ...f, unidade: e.target.value }))}
                className={inputCls}
                placeholder="por m²"
              />
            </Campo>
            <Campo label="Nota">
              <input
                type="number"
                step="0.1"
                min={0}
                max={5}
                value={form.nota}
                onChange={(e) => setForm((f) => ({ ...f, nota: e.target.value }))}
                className={inputCls}
              />
            </Campo>
          </div>

          <Campo label="Descrição">
            <textarea
              value={form.descricao}
              maxLength={600}
              rows={3}
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              className={inputCls}
              placeholder="Detalhes do serviço"
            />
          </Campo>

          <div className="grid grid-cols-2 gap-3">
            <Campo label="Latitude">
              <input
                value={form.lat}
                onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
                className={inputCls}
              />
            </Campo>
            <Campo label="Longitude">
              <input
                value={form.lng}
                onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
                className={inputCls}
              />
            </Campo>
          </div>
          <button
            type="button"
            onClick={() =>
              navigator.geolocation?.getCurrentPosition(
                (p) =>
                  setForm((f) => ({
                    ...f,
                    lat: p.coords.latitude.toFixed(6),
                    lng: p.coords.longitude.toFixed(6),
                  })),
                () => setErro("Não consegui pegar sua localização."),
              )
            }
            className="w-full rounded-xl bg-muted py-2 text-xs font-semibold text-foreground"
          >
            Usar minha localização atual
          </button>

          <Campo label="Foto do serviço">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const arquivo = e.target.files?.[0];
                if (arquivo) subirFoto(arquivo);
              }}
              className="mt-1 w-full text-xs text-muted-foreground"
            />
          </Campo>
          {enviandoFoto && <p className="text-xs text-muted-foreground">Enviando foto...</p>}
          {form.foto_url && (
            <img
              src={form.foto_url}
              alt="Foto escolhida para o anúncio"
              className="h-28 w-full rounded-xl object-cover"
            />
          )}

          {erro && <p className="text-xs font-semibold text-destructive">{erro}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!valido || salvar.isPending}
              className="flex-1 rounded-2xl bg-primary py-3 font-display text-sm text-primary-foreground disabled:opacity-50"
            >
              {salvar.isPending ? "Salvando..." : form.id ? "Salvar alterações" : "Cadastrar anúncio"}
            </button>
            {form.id && (
              <button
                type="button"
                onClick={() => setForm(VAZIO)}
                className="rounded-2xl bg-muted px-4 text-sm font-semibold"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <section className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando anúncios...</p>}
          {anuncios.map((a) => (
            <article
              key={a.id}
              className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft"
            >
              <span
                className={`size-2.5 shrink-0 rounded-full ${
                  a.tipo === "oferece" ? "bg-primary" : "bg-accent"
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{a.titulo}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {a.categoria} · R$ {Number(a.valor).toLocaleString("pt-BR")} {a.unidade}
                </p>
              </div>
              <button
                onClick={() =>
                  setForm({
                    id: a.id,
                    tipo: a.tipo,
                    titulo: a.titulo,
                    categoria: a.categoria,
                    pessoa: a.pessoa,
                    nota: String(a.nota),
                    valor: String(a.valor),
                    unidade: a.unidade,
                    descricao: a.descricao,
                    foto_url: a.foto_url,
                    lat: String(a.lat),
                    lng: String(a.lng),
                  })
                }
                className="rounded-xl bg-muted px-3 py-2 text-xs font-semibold"
              >
                Editar
              </button>
              <button
                onClick={() => apagar.mutate(a.id)}
                className="rounded-xl bg-muted px-3 py-2 text-xs font-semibold text-destructive"
              >
                Apagar
              </button>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

const inputCls =
  "mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground";

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-muted-foreground">
      {label}
      {children}
    </label>
  );
}
