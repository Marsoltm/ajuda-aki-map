create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "usuario_ve_proprios_papeis" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create table public.anuncios (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('oferece', 'procura')),
  titulo text not null,
  categoria text not null,
  pessoa text not null default '',
  nota numeric not null default 5,
  valor numeric not null default 0,
  unidade text not null default '',
  descricao text not null default '',
  foto_url text,
  lat double precision not null,
  lng double precision not null,
  created_at timestamptz not null default now()
);
grant select on public.anuncios to anon;
grant select, insert, update, delete on public.anuncios to authenticated;
grant all on public.anuncios to service_role;
alter table public.anuncios enable row level security;
create policy "todos_veem_anuncios" on public.anuncios for select to anon, authenticated using (true);
create policy "admin_insere_anuncios" on public.anuncios for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "admin_edita_anuncios" on public.anuncios for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin_apaga_anuncios" on public.anuncios for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

insert into public.anuncios (tipo, titulo, categoria, pessoa, nota, valor, unidade, descricao, lat, lng) values
('procura', 'Parede da sala para pintar', 'Pintura', 'Marina S.', 4.8, 320, 'pelo serviço', 'Parede descascando, cerca de 12 m². Tinta já comprada.', -23.5565, -46.6621),
('procura', 'Bainha em 3 calças jeans', 'Costura', 'Rafael T.', 4.9, 25, 'por peça', 'Bainha simples, posso levar até você ou receber em casa.', -23.5648, -46.6534),
('oferece', 'Encanador — conserto de vazamentos', 'Encanamento', 'Seu Jorge', 5, 90, 'a visita', 'Atendo no mesmo dia. Vazamentos, torneiras e caixas d''água.', -23.5586, -46.6598),
('oferece', 'Corte de grama e poda', 'Jardinagem', 'Bia Jardins', 4.7, 70, 'por quintal', 'Levo minhas ferramentas e retiro os resíduos.', -23.5662, -46.6579),
('oferece', 'Pintora residencial', 'Pintura', 'Cláudia M.', 4.6, 45, 'por m²', 'Pintura interna e externa, orçamento sem compromisso.', -23.5536, -46.6503),
('oferece', 'Costureira — ajustes em geral', 'Costura', 'Dona Neide', 5, 20, 'por ajuste', 'Bainhas, zíperes e ajustes de cintura.', -23.5629, -46.6495);