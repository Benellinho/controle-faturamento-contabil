-- =========================================================
-- ETAPA 03: FLUXO DAS COMPETENCIAS
-- =========================================================

create or replace function public.proteger_fluxo_competencia()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (
    new.status is distinct from old.status
    or new.sem_movimento is distinct from old.sem_movimento
    or new.sem_movimento_em is distinct from old.sem_movimento_em
    or new.sem_movimento_por is distinct from old.sem_movimento_por
    or new.conferencia_iniciada_em is distinct from old.conferencia_iniciada_em
    or new.conferencia_iniciada_por is distinct from old.conferencia_iniciada_por
    or new.finalizada_em is distinct from old.finalizada_em
    or new.finalizada_por is distinct from old.finalizada_por
  ) and coalesce(
    current_setting('app.permitir_alteracao_competencia', true),
    ''
  ) <> 'true' then
    raise exception 'O fluxo da competência só pode ser alterado pelas funções controladas.'
      using errcode = '55000';
  end if;

  return new;
end;
$$;

create or replace function public.proteger_insercao_historico()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(
    current_setting('app.permitir_insercao_historico', true),
    ''
  ) <> 'true' then
    raise exception 'O histórico só pode ser criado por uma transição controlada.'
      using errcode = '55000';
  end if;

  return new;
end;
$$;

create or replace function public.marcar_sem_movimento(
  p_competencia_id bigint,
  p_usuario_id uuid,
  p_sem_movimento boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.status_competencia;
  v_config_anterior text;
begin
  if not exists (
    select 1
    from public.usuarios u
    where u.id = p_usuario_id
      and u.ativo
  ) then
    raise exception 'Usuário não encontrado ou inativo.'
      using errcode = '42501';
  end if;

  select c.status
    into v_status
  from public.competencias c
  where c.id = p_competencia_id
  for update;

  if not found then
    raise exception 'Competência não encontrada.'
      using errcode = 'P0002';
  end if;

  if v_status not in (
    'ABERTA'::public.status_competencia,
    'REABERTA'::public.status_competencia
  ) then
    raise exception 'A competência não permite alterar a indicação de sem movimento.'
      using errcode = '55000';
  end if;

  if p_sem_movimento and exists (
    select 1
    from public.lancamentos_faturamento l
    where l.competencia_id = p_competencia_id
      and l.status = 'ATIVO'::public.status_lancamento
  ) then
    raise exception 'Uma competência com lançamentos ativos não pode ser marcada sem movimento.'
      using errcode = '23514';
  end if;

  v_config_anterior := current_setting(
    'app.permitir_alteracao_competencia',
    true
  );

  perform set_config('app.permitir_alteracao_competencia', 'true', true);

  update public.competencias
  set sem_movimento = p_sem_movimento,
      sem_movimento_em = case when p_sem_movimento then now() else null end,
      sem_movimento_por = case when p_sem_movimento then p_usuario_id else null end
  where id = p_competencia_id;

  perform set_config(
    'app.permitir_alteracao_competencia',
    coalesce(v_config_anterior, ''),
    true
  );
end;
$$;

create or replace function public.transicionar_competencia(
  p_competencia_id bigint,
  p_status_novo public.status_competencia,
  p_usuario_id uuid,
  p_justificativa text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_competencia public.competencias%rowtype;
  v_config_competencia text;
  v_config_historico text;
begin
  if not exists (
    select 1
    from public.usuarios u
    where u.id = p_usuario_id
      and u.ativo
  ) then
    raise exception 'Usuário não encontrado ou inativo.'
      using errcode = '42501';
  end if;

  select c.*
    into v_competencia
  from public.competencias c
  where c.id = p_competencia_id
  for update;

  if not found then
    raise exception 'Competência não encontrada.'
      using errcode = 'P0002';
  end if;

  if not (
    (v_competencia.status = 'ABERTA' and p_status_novo = 'EM_CONFERENCIA')
    or (v_competencia.status = 'EM_CONFERENCIA' and p_status_novo = 'REABERTA')
    or (v_competencia.status = 'EM_CONFERENCIA' and p_status_novo = 'FINALIZADA')
    or (v_competencia.status = 'REABERTA' and p_status_novo = 'EM_CONFERENCIA')
  ) then
    raise exception 'Transição de status inválida: % -> %.',
      v_competencia.status,
      p_status_novo
      using errcode = '23514';
  end if;

  if p_status_novo = 'EM_CONFERENCIA' then
    if not v_competencia.sem_movimento and not exists (
      select 1
      from public.lancamentos_faturamento l
      where l.competencia_id = p_competencia_id
        and l.status = 'ATIVO'::public.status_lancamento
    ) then
      raise exception 'A competência precisa ter lançamento ativo ou estar sem movimento.'
        using errcode = '23514';
    end if;
  end if;

  if p_status_novo = 'REABERTA'
    and nullif(btrim(p_justificativa), '') is null then
    raise exception 'A reabertura exige uma justificativa.'
      using errcode = '23514';
  end if;

  v_config_competencia := current_setting(
    'app.permitir_alteracao_competencia',
    true
  );
  v_config_historico := current_setting(
    'app.permitir_insercao_historico',
    true
  );

  perform set_config('app.permitir_alteracao_competencia', 'true', true);

  update public.competencias
  set status = p_status_novo,
      conferencia_iniciada_em = case
        when p_status_novo = 'EM_CONFERENCIA' then now()
        else conferencia_iniciada_em
      end,
      conferencia_iniciada_por = case
        when p_status_novo = 'EM_CONFERENCIA' then p_usuario_id
        else conferencia_iniciada_por
      end,
      finalizada_em = case
        when p_status_novo = 'FINALIZADA' then now()
        else finalizada_em
      end,
      finalizada_por = case
        when p_status_novo = 'FINALIZADA' then p_usuario_id
        else finalizada_por
      end
  where id = p_competencia_id;

  perform set_config('app.permitir_insercao_historico', 'true', true);

  insert into public.historico_competencias (
    competencia_id,
    usuario_id,
    status_anterior,
    status_novo,
    justificativa
  ) values (
    p_competencia_id,
    p_usuario_id,
    v_competencia.status,
    p_status_novo,
    nullif(btrim(p_justificativa), '')
  );

  perform set_config(
    'app.permitir_insercao_historico',
    coalesce(v_config_historico, ''),
    true
  );
  perform set_config(
    'app.permitir_alteracao_competencia',
    coalesce(v_config_competencia, ''),
    true
  );
end;
$$;

create trigger competencias_proteger_fluxo
before update on public.competencias
for each row
execute function public.proteger_fluxo_competencia();

create trigger historico_proteger_insercao
before insert on public.historico_competencias
for each row
execute function public.proteger_insercao_historico();

revoke execute
  on function public.proteger_fluxo_competencia(),
              public.proteger_insercao_historico()
  from public, anon, authenticated, service_role;

revoke all
  on function public.marcar_sem_movimento(bigint, uuid, boolean),
              public.transicionar_competencia(
                bigint,
                public.status_competencia,
                uuid,
                text
              )
  from public, anon, authenticated;

grant execute
  on function public.marcar_sem_movimento(bigint, uuid, boolean),
              public.transicionar_competencia(
                bigint,
                public.status_competencia,
                uuid,
                text
              )
  to service_role;
