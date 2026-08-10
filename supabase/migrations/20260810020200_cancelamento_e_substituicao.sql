-- =========================================================
-- ETAPA 04: CANCELAMENTO E SUBSTITUICAO ATOMICA
-- =========================================================

create or replace function public.validar_cadeia_substituicao()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_original public.lancamentos_faturamento%rowtype;
begin
  if new.status = 'CANCELADO'::public.status_lancamento
    and not exists (
      select 1
      from public.lancamentos_faturamento substituto
      where substituto.substitui_lancamento_id = new.id
    ) then
    raise exception 'Todo lançamento cancelado deve possuir exatamente um substituto.'
      using errcode = '23514';
  end if;

  if new.substitui_lancamento_id is not null then
    select l.*
      into v_original
    from public.lancamentos_faturamento l
    where l.id = new.substitui_lancamento_id;

    if not found then
      raise exception 'Lançamento substituído não encontrado.'
        using errcode = '23503';
    end if;

    if v_original.status <> 'CANCELADO'::public.status_lancamento then
      raise exception 'O lançamento substituído deve estar cancelado.'
        using errcode = '23514';
    end if;

    if v_original.competencia_id <> new.competencia_id then
      raise exception 'Original e substituto devem pertencer à mesma competência.'
        using errcode = '23514';
    end if;
  end if;

  return null;
end;
$$;

create constraint trigger lancamentos_validar_cadeia_substituicao
after insert or update on public.lancamentos_faturamento
deferrable initially deferred
for each row
execute function public.validar_cadeia_substituicao();

create or replace function public.cancelar_e_substituir_lancamento(
  p_lancamento_id bigint,
  p_usuario_id uuid,
  p_motivo text,
  p_categoria_id bigint,
  p_tipo_lancamento public.tipo_lancamento,
  p_data_referencia date,
  p_valor numeric,
  p_estoque_inicial numeric,
  p_estoque_final numeric,
  p_observacao text default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_original public.lancamentos_faturamento%rowtype;
  v_status_competencia public.status_competencia;
  v_empresa_ativa boolean;
  v_novo_id bigint;
begin
  if nullif(btrim(p_motivo), '') is null then
    raise exception 'O motivo do cancelamento é obrigatório.'
      using errcode = '23514';
  end if;

  if p_valor is null or p_valor <= 0 then
    raise exception 'O valor do lançamento substituto deve ser positivo.'
      using errcode = '23514';
  end if;

  if p_estoque_inicial is null or p_estoque_inicial < 0
    or p_estoque_final is null or p_estoque_final < 0 then
    raise exception 'Os valores de estoque inicial e final devem ser não negativos.'
      using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.usuarios u
    where u.id = p_usuario_id
      and u.ativo
  ) then
    raise exception 'Usuário não encontrado ou inativo.'
      using errcode = '42501';
  end if;

  select l.*
    into v_original
  from public.lancamentos_faturamento l
  where l.id = p_lancamento_id
  for update;

  if not found then
    raise exception 'Lançamento original não encontrado.'
      using errcode = 'P0002';
  end if;

  select c.status, e.ativa
    into v_status_competencia, v_empresa_ativa
  from public.competencias c
  join public.empresas e on e.id = c.empresa_id
  where c.id = v_original.competencia_id
  for update of c;

  if v_original.status <> 'ATIVO'::public.status_lancamento then
    raise exception 'Somente um lançamento ativo pode ser substituído.'
      using errcode = '55000';
  end if;

  if v_status_competencia not in (
    'ABERTA'::public.status_competencia,
    'REABERTA'::public.status_competencia
  ) then
    raise exception 'A competência não permite correções.'
      using errcode = '55000';
  end if;

  if not v_empresa_ativa then
    raise exception 'A empresa está inativa.'
      using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.categorias_faturamento cf
    where cf.id = p_categoria_id
      and cf.ativa
  ) then
    raise exception 'A categoria informada não existe ou está inativa.'
      using errcode = '23514';
  end if;

  update public.lancamentos_faturamento
  set status = 'CANCELADO'::public.status_lancamento,
      cancelado_por_usuario_id = p_usuario_id,
      cancelado_em = now(),
      motivo_cancelamento = btrim(p_motivo)
  where id = p_lancamento_id;

  insert into public.lancamentos_faturamento (
    competencia_id,
    categoria_id,
    criado_por_usuario_id,
    tipo_lancamento,
    data_referencia,
    valor,
    estoque_inicial,
    estoque_final,
    observacao,
    substitui_lancamento_id
  ) values (
    v_original.competencia_id,
    p_categoria_id,
    p_usuario_id,
    p_tipo_lancamento,
    p_data_referencia,
    p_valor,
    p_estoque_inicial,
    p_estoque_final,
    nullif(btrim(p_observacao), ''),
    p_lancamento_id
  )
  returning id into v_novo_id;

  return v_novo_id;
end;
$$;

revoke execute
  on function public.validar_cadeia_substituicao()
  from public, anon, authenticated, service_role;

revoke all
  on function public.cancelar_e_substituir_lancamento(
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
  from public, anon, authenticated;

grant execute
  on function public.cancelar_e_substituir_lancamento(
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
