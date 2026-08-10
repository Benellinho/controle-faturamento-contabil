-- =========================================================
-- ETAPA 05: SUPABASE AUTH E CONTROLE DE ACESSO
-- =========================================================

create or replace function public.sincronizar_usuario_auth()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is null then
    raise exception 'Usuários internos precisam possuir e-mail.'
      using errcode = '23502';
  end if;

  insert into public.usuarios (
    id,
    nome,
    email,
    cargo,
    ativo
  ) values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'nome'), ''),
      new.email
    ),
    new.email,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'cargo'), ''),
      'USUARIO'
    ),
    true
  )
  on conflict (id) do update
  set email = excluded.email,
      nome = coalesce(
        nullif(btrim(new.raw_user_meta_data ->> 'nome'), ''),
        public.usuarios.nome
      ),
      cargo = coalesce(
        nullif(btrim(new.raw_user_meta_data ->> 'cargo'), ''),
        public.usuarios.cargo
      );

  return new;
end;
$$;

insert into public.usuarios (
  id,
  nome,
  email,
  cargo,
  ativo
)
select
  au.id,
  coalesce(
    nullif(btrim(au.raw_user_meta_data ->> 'nome'), ''),
    au.email
  ),
  au.email,
  coalesce(
    nullif(btrim(au.raw_user_meta_data ->> 'cargo'), ''),
    'USUARIO'
  ),
  true
from auth.users au
where au.email is not null
on conflict (id) do update
set email = excluded.email;

create trigger auth_usuarios_sincronizar_perfil
after insert or update of email, raw_user_meta_data on auth.users
for each row
execute function public.sincronizar_usuario_auth();

create or replace function public.usuario_atual_ativo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.usuarios u
    where u.id = (select auth.uid())
      and u.ativo
  );
$$;

create policy empresas_leitura_usuario_ativo
on public.empresas
for select
to authenticated
using ((select public.usuario_atual_ativo()));

create policy usuarios_leitura_usuario_ativo
on public.usuarios
for select
to authenticated
using ((select public.usuario_atual_ativo()));

create policy categorias_leitura_usuario_ativo
on public.categorias_faturamento
for select
to authenticated
using ((select public.usuario_atual_ativo()));

create policy competencias_leitura_usuario_ativo
on public.competencias
for select
to authenticated
using ((select public.usuario_atual_ativo()));

create policy historico_leitura_usuario_ativo
on public.historico_competencias
for select
to authenticated
using ((select public.usuario_atual_ativo()));

create policy lancamentos_leitura_usuario_ativo
on public.lancamentos_faturamento
for select
to authenticated
using ((select public.usuario_atual_ativo()));

grant usage on schema public to authenticated;

grant select
  on table public.empresas,
           public.usuarios,
           public.categorias_faturamento,
           public.competencias,
           public.historico_competencias,
           public.lancamentos_faturamento
  to authenticated;

revoke insert, update, delete
  on table public.empresas,
           public.usuarios,
           public.categorias_faturamento,
           public.competencias,
           public.historico_competencias,
           public.lancamentos_faturamento
  from anon, authenticated;

-- Operações críticas do backend devem passar pelas funções transacionais.
revoke update
  on table public.competencias
  from service_role;

revoke update, delete
  on table public.lancamentos_faturamento
  from service_role;

revoke insert, update, delete
  on table public.historico_competencias
  from service_role;

revoke execute
  on function public.sincronizar_usuario_auth(),
              public.usuario_atual_ativo()
  from public, anon, service_role;

grant execute
  on function public.usuario_atual_ativo()
  to authenticated;

grant execute
  on function public.marcar_sem_movimento(bigint, uuid, boolean),
              public.transicionar_competencia(
                bigint,
                public.status_competencia,
                uuid,
                text
              ),
              public.cancelar_e_substituir_lancamento(
                bigint,
                uuid,
                text,
                bigint,
                public.tipo_lancamento,
                date,
                numeric,
                numeric,
                numeric,
                text
              )
  to service_role;
