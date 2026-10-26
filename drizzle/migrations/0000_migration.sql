create type public.app_role as enum ('admin','user');
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade not null, role app_role not null, unique(user_id, role));
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.user_roles where user_id=_user_id and role=_role) $$;

create or replace function public.handle_first_admin() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role='admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_admin after insert on auth.users for each row execute function public.handle_first_admin();

create table public.site_settings (id int primary key default 1, data jsonb not null default '{}'::jsonb, updated_at timestamptz default now(), constraint single check (id=1));
create table public.cards (id uuid primary key default gen_random_uuid(), title text not null default '', body text not null default '', icon text not null default 'Sparkles', category text not null default 'General', sort int not null default 0, visible boolean not null default true, created_at timestamptz default now());
create table public.links (id uuid primary key default gen_random_uuid(), title text not null default '', url text not null default '', icon text not null default 'auto', sort int not null default 0, visible boolean not null default true, created_at timestamptz default now());
create table public.projects (id uuid primary key default gen_random_uuid(), title text not null default '', description text not null default '', image_url text, tags text[] not null default '{}', live_url text, repo_url text, sort int not null default 0, visible boolean not null default true, created_at timestamptz default now());
create table public.gallery (id uuid primary key default gen_random_uuid(), image_url text not null, caption text not null default '', category text not null default 'General', sort int not null default 0, visible boolean not null default true, created_at timestamptz default now());
create table public.tracks (id uuid primary key default gen_random_uuid(), title text not null default '', artist text not null default '', audio_url text not null, cover_url text, sort int not null default 0, visible boolean not null default true, created_at timestamptz default now());
create table public.timeline (id uuid primary key default gen_random_uuid(), date_label text not null default '', title text not null default '', body text not null default '', sort int not null default 0, visible boolean not null default true, created_at timestamptz default now());
create table public.guestbook (id uuid primary key default gen_random_uuid(), name text not null, message text not null, visible boolean not null default false, created_at timestamptz default now());
create table public.page_views (id uuid primary key default gen_random_uuid(), path text not null default '/', referrer text, created_at timestamptz default now());

do $$ declare t text; begin
  foreach t in array array['site_settings','cards','links','projects','gallery','tracks','timeline','guestbook','page_views'] loop
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "admin all" on public.%I for all to authenticated using (public.has_role(auth.uid(),''admin'')) with check (public.has_role(auth.uid(),''admin''))', t);
  end loop;
  foreach t in array array['cards','links','projects','gallery','tracks','timeline','guestbook'] loop
    execute format('create policy "public read visible" on public.%I for select to anon, authenticated using (visible)', t);
  end loop;
end $$;
create policy "public read settings" on public.site_settings for select to anon, authenticated using (true);
grant insert on public.guestbook, public.page_views to anon;
create policy "anyone sign guestbook" on public.guestbook for insert to anon, authenticated with check (visible = false and length(name) between 1 and 60 and length(message) between 1 and 500);
create policy "anyone log view" on public.page_views for insert to anon, authenticated with check (length(path) < 200);

insert into public.site_settings(id, data) values (1, '{
 "profile":{"name":"Nova Reyes","handle":"@nova","avatar":"","banner":"","status":"coding","statusMessage":"Shipping something weird","location":"Dhaka, Bangladesh","timezone":"Asia/Dhaka","verified":true,"tags":["Founder","Developer","Artist"],"bio":"I build small, strange, beautiful things for the internet. Currently obsessed with shaders, synths and slow mornings.","quotes":["Make it work, make it right, make it beautiful.","The night sky is the original dark mode.","Curiosity is a full-time job."]},
 "theme":{"background":"particles","bgImage":"","bgVideo":"","accent":"#7dd3fc","glow":true,"glass":0.08,"blur":24,"font":"space"},
 "sections":[{"key":"about","label":"About","enabled":true},{"key":"links","label":"Links","enabled":true},{"key":"projects","label":"Projects","enabled":true},{"key":"gallery","label":"Gallery","enabled":true},{"key":"timeline","label":"Timeline","enabled":true},{"key":"guestbook","label":"Guestbook","enabled":true}],
 "player":{"enabled":true}
}'::jsonb);
insert into public.cards(title, body, icon, category, sort) values
('Goal','Ship one tiny project every month.','Target','Goals',0),
('Achievement','Open-source library with 3k stars.','Trophy','Achievements',1),
('Favorite things','Rainy nights, lo-fi, mechanical keyboards.','Heart','Favorites',2),
('Fun fact','Learned to code by modding games.','Lightbulb','Fun Facts',3);
insert into public.links(title,url,sort) values ('GitHub','https://github.com',0),('Discord','https://discord.com',1),('Spotify','https://open.spotify.com',2),('X','https://x.com',3);
insert into public.projects(title,description,tags,live_url,repo_url,sort) values
('Aurora Shader Lab','Realtime playground for GLSL experiments in the browser.','{WebGL,TypeScript}','https://example.com','https://github.com',0),
('Pocket Synth','Tiny browser synthesizer with a step sequencer.','{Audio,React}','https://example.com','https://github.com',1);
insert into public.timeline(date_label,title,body,sort) values ('2026','Started Nova Studio','Went independent.',0),('2023','First big release','Launched my first open-source tool.',1);