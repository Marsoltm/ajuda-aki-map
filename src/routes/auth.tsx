import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar no Ajuda Aki" },
      {
        name: "description",
        content: "Entre ou crie sua conta para gerenciar os anúncios de serviço do Ajuda Aki.",
      },
      { property: "og:title", content: "Entrar no Ajuda Aki" },
      {
        property: "og:description",
        content: "Entre ou crie sua conta para gerenciar os anúncios de serviço do Ajuda Aki.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/admin", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setAviso(null);
    if (!email.trim() || senha.length < 6) {
      setErro("Informe um e-mail válido e uma senha com pelo menos 6 caracteres.");
      return;
    }
    setCarregando(true);
    if (modo === "criar") {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: senha,
        options: { emailRedirectTo: window.location.origin + "/admin" },
      });
      if (error) setErro(error.message);
      else if (!data.session) setAviso("Conta criada! Confira seu e-mail para confirmar o acesso.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });
      if (error) setErro("E-mail ou senha incorretos.");
    }
    setCarregando(false);
  }

  async function entrarComGoogle() {
    setErro(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth",
    });
    if (result.error) {
      setErro("Não foi possível entrar com o Google.");
      return;
    }
  }

  return (
    <main className="min-h-dvh bg-background px-5 py-10 font-body">
      <div className="mx-auto w-full max-w-sm space-y-6">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary font-display text-lg text-primary-foreground">
            A
          </span>
          <div>
            <h1 className="font-display text-xl text-foreground">Ajuda Aki</h1>
            <p className="text-xs text-muted-foreground">Acesso ao painel de anúncios</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-card p-1 shadow-float">
          {(["entrar", "criar"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setModo(m);
                setErro(null);
                setAviso(null);
              }}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                modo === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {m === "entrar" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>

        <form onSubmit={enviar} className="space-y-3 rounded-2xl bg-card p-4 shadow-float">
          <label className="block text-xs font-semibold text-muted-foreground">
            E-mail
            <input
              type="email"
              value={email}
              maxLength={255}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
              placeholder="voce@email.com"
            />
          </label>
          <label className="block text-xs font-semibold text-muted-foreground">
            Senha
            <input
              type="password"
              value={senha}
              maxLength={72}
              onChange={(e) => setSenha(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
              placeholder="mínimo 6 caracteres"
            />
          </label>
          {erro && <p className="text-xs font-semibold text-destructive">{erro}</p>}
          {aviso && <p className="text-xs font-semibold text-accent">{aviso}</p>}
          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-2xl bg-primary py-3 font-display text-base text-primary-foreground disabled:opacity-60"
          >
            {carregando ? "Aguarde..." : modo === "entrar" ? "Entrar" : "Criar conta"}
          </button>
          <button
            type="button"
            onClick={entrarComGoogle}
            className="w-full rounded-2xl border border-border bg-background py-3 text-sm font-semibold text-foreground"
          >
            Continuar com o Google
          </button>
        </form>

        <Link to="/" className="block text-center text-xs font-semibold text-muted-foreground">
          Voltar ao mapa
        </Link>
      </div>
    </main>
  );
}
