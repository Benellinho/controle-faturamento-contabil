-- =========================================================
-- ETAPA 02: INTEGRIDADE E IMUTABILIDADE
-- =========================================================

alter table public.lancamentos_faturamento
  add column estoque_inicial numeric(14, 2) not null,
  add column estoque_final numeric(14, 2) not null,
  add constraint lancamentos_estoque_inicial_nao_negativo_check
    check (estoque_inicial >= 0),
  add constraint lancamentos_estoque_final_nao_negativo_check
    check (estoque_final >= 0);

-- Registros cancelados permanecem para auditoria, mas somente um lançamento
-- ativo pode representar a competência mensal.
create unique index lancamentos_um_ativo_por_competencia_idx
  on public.lancamentos_faturamento (competencia_id)
  where status = 'ATIVO'::public.status_lancamento;

create or replace function public.validar_nova_competencia()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status <> 'ABERTA'::public.status_competencia
    or new.sem_movimento
    or new.sem_movimento_em is not null
    or new.sem_movimento_por is not null
    or new.conferencia_iniciada_em is not null
    or new.conferencia_iniciada_por is not null
    or new.finalizada_em is not null
    or new.finalizada_por is not null then
    raise exception 'Uma competência deve ser criada aberta e sem metadados de fluxo.'
      using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.empresas e
    where e.id = new.empresa_id
      and e.ativa
  ) then
    raise exception 'A empresa informada não existe ou está inativa.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.proteger_dados_base_competencia()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
    or new.empresa_id is distinct from old.empresa_id
    or new.ano is distinct from old.ano
    or new.mes is distinct from old.mes
    or new.created_at is distinct from old.created_at then
    raise exception 'Empresa, período e dados de criação da competência são imutáveis.'
      using errcode = '55000';
  end if;

  return new;
end;
$$;

create or replace function public.validar_lancamento_faturamento()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ano integer;
  v_mes integer;
  v_status public.status_competencia;
  v_sem_movimento boolean;
  v_empresa_ativa boolean;
  v_config_anterior text;
begin
  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id
      or new.competencia_id is distinct from old.competencia_id
      or new.categoria_id is distinct from old.categoria_id
      or new.criado_por_usuario_id is distinct from old.criado_por_usuario_id
      or new.tipo_lancamento is distinct from old.tipo_lancamento
      or new.data_referencia is distinct from old.data_referencia
      or new.valor is distinct from old.valor
      or new.estoque_inicial is distinct from old.estoque_inicial
      or new.estoque_final is distinct from old.estoque_final
      or new.observacao is distinct from old.observacao
      or new.substitui_lancamento_id is distinct from old.substitui_lancamento_id
      or new.created_at is distinct from old.created_at then
      raise exception 'Os dados originais de um lançamento são imutáveis.'
        using errcode = '55000';
    end if;

    if old.status = 'CANCELADO'::public.status_lancamento then
      raise exception 'Um lançamento cancelado não pode ser alterado.'
        using errcode = '55000';
    end if;

    if new.status <> 'CANCELADO'::public.status_lancamento then
      raise exception 'A única alteração permitida é cancelar um lançamento ativo.'
        using errcode = '55000';
    end if;
  else
    if new.status <> 'ATIVO'::public.status_lancamento
      or new.cancelado_por_usuario_id is not null
      or new.cancelado_em is not null
      or new.motivo_cancelamento is not null then
      raise exception 'Um lançamento deve ser criado com status ATIVO.'
        using errcode = '23514';
    end if;
  end if;

  select c.ano, c.mes, c.status, c.sem_movimento, e.ativa
    into v_ano, v_mes, v_status, v_sem_movimento, v_empresa_ativa
  from public.competencias c
  join public.empresas e on e.id = c.empresa_id
  where c.id = new.competencia_id
  for update of c;

  if not found then
    raise exception 'Competência não encontrada.'
      using errcode = '23503';
  end if;

  if not v_empresa_ativa then
    raise exception 'Uma empresa inativa não pode receber lançamentos.'
      using errcode = '23514';
  end if;

  if v_status not in (
    'ABERTA'::public.status_competencia,
    'REABERTA'::public.status_competencia
  ) then
    raise exception 'A competência não permite alterações em lançamentos.'
      using errcode = '55000';
  end if;

  if extract(year from new.data_referencia)::integer <> v_ano
    or extract(month from new.data_referencia)::integer <> v_mes then
    raise exception 'A data de referência deve pertencer ao mês da competência.'
      using errcode = '23514';
  end if;

  if tg_op = 'INSERT' and not exists (
    select 1
    from public.categorias_faturamento cf
    where cf.id = new.categoria_id
      and cf.ativa
  ) then
    raise exception 'A categoria informada não existe ou está inativa.'
      using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.usuarios u
    where u.id = case
      when tg_op = 'INSERT' then new.criado_por_usuario_id
      else new.cancelado_por_usuario_id
    end
      and u.ativo
  ) then
    raise exception 'O usuário responsável não existe ou está inativo.'
      using errcode = '23514';
  end if;

  if tg_op = 'INSERT' and v_sem_movimento then
    v_config_anterior := current_setting(
      'app.permitir_alteracao_competencia',
      true
    );

    perform set_config(
      'app.permitir_alteracao_competencia',
      'true',
      true
    );

    update public.competencias
    set sem_movimento = false,
        sem_movimento_em = null,
        sem_movimento_por = null
    where id = new.competencia_id;

    perform set_config(
      'app.permitir_alteracao_competencia',
      coalesce(v_config_anterior, ''),
      true
    );
  end if;

  return new;
end;
$$;

create or replace function public.bloquear_alteracao_historico()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'O histórico de competências é imutável.'
    using errcode = '55000';
end;
$$;

create or replace function public.bloquear_exclusao_lancamento()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Lançamentos não podem ser excluídos fisicamente.'
    using errcode = '55000';
end;
$$;

create or replace function public.proteger_categoria_utilizada()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.lancamentos_faturamento l
    where l.categoria_id = old.id
  ) and (
    tg_op = 'DELETE'
    or new.nome is distinct from old.nome
    or new.descricao is distinct from old.descricao
  ) then
    raise exception 'Uma categoria utilizada não pode ser excluída nem ter seu significado alterado.'
      using errcode = '55000';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create trigger competencias_validar_insercao
before insert on public.competencias
for each row
execute function public.validar_nova_competencia();

create trigger competencias_proteger_dados_base
before update on public.competencias
for each row
execute function public.proteger_dados_base_competencia();

create trigger lancamentos_validar_insercao_ou_cancelamento
before insert or update on public.lancamentos_faturamento
for each row
execute function public.validar_lancamento_faturamento();

create trigger lancamentos_bloquear_exclusao
before delete on public.lancamentos_faturamento
for each row
execute function public.bloquear_exclusao_lancamento();

create trigger historico_bloquear_alteracao
before update or delete on public.historico_competencias
for each row
execute function public.bloquear_alteracao_historico();

create trigger categorias_proteger_utilizadas
before update or delete on public.categorias_faturamento
for each row
execute function public.proteger_categoria_utilizada();

revoke execute
  on function public.validar_nova_competencia(),
              public.proteger_dados_base_competencia(),
              public.validar_lancamento_faturamento(),
              public.bloquear_alteracao_historico(),
              public.bloquear_exclusao_lancamento(),
              public.proteger_categoria_utilizada()
  from public, anon, authenticated, service_role;
