-- =========================================================
-- ETAPA 06: VIEWS PARA CALCULO DOS TOTAIS
-- =========================================================

create view public.vw_totais_categoria_competencia
with (security_invoker = true)
as
select
  c.id as competencia_id,
  c.empresa_id,
  c.ano,
  c.mes,
  cf.id as categoria_id,
  cf.nome as categoria_nome,
  max(l.estoque_inicial) filter (
    where l.status = 'ATIVO'::public.status_lancamento
  ) as estoque_inicial,
  max(l.estoque_final) filter (
    where l.status = 'ATIVO'::public.status_lancamento
  ) as estoque_final,
  coalesce(sum(l.valor) filter (
    where l.status = 'ATIVO'::public.status_lancamento
      and l.tipo_lancamento = 'FATURAMENTO'::public.tipo_lancamento
  ), 0::numeric) as total_faturamento,
  coalesce(sum(l.valor) filter (
    where l.status = 'ATIVO'::public.status_lancamento
      and l.tipo_lancamento = 'DEVOLUCAO_ESTORNO'::public.tipo_lancamento
  ), 0::numeric) as total_devolucoes_estornos,
  coalesce(sum(
    case
      when l.status <> 'ATIVO'::public.status_lancamento then 0::numeric
      when l.tipo_lancamento = 'FATURAMENTO'::public.tipo_lancamento then l.valor
      else -l.valor
    end
  ), 0::numeric) as total_liquido
from public.competencias c
join public.lancamentos_faturamento l
  on l.competencia_id = c.id
join public.categorias_faturamento cf
  on cf.id = l.categoria_id
group by c.id, c.empresa_id, c.ano, c.mes, cf.id, cf.nome;

create view public.vw_totais_competencia
with (security_invoker = true)
as
select
  c.id as competencia_id,
  c.empresa_id,
  c.ano,
  c.mes,
  c.status,
  c.sem_movimento,
  max(l.estoque_inicial) filter (
    where l.status = 'ATIVO'::public.status_lancamento
  ) as estoque_inicial,
  max(l.estoque_final) filter (
    where l.status = 'ATIVO'::public.status_lancamento
  ) as estoque_final,
  coalesce(sum(l.valor) filter (
    where l.status = 'ATIVO'::public.status_lancamento
      and l.tipo_lancamento = 'FATURAMENTO'::public.tipo_lancamento
  ), 0::numeric) as total_faturamento,
  coalesce(sum(l.valor) filter (
    where l.status = 'ATIVO'::public.status_lancamento
      and l.tipo_lancamento = 'DEVOLUCAO_ESTORNO'::public.tipo_lancamento
  ), 0::numeric) as total_devolucoes_estornos,
  coalesce(sum(
    case
      when l.status <> 'ATIVO'::public.status_lancamento then 0::numeric
      when l.tipo_lancamento = 'FATURAMENTO'::public.tipo_lancamento then l.valor
      else -l.valor
    end
  ), 0::numeric) as total_liquido
from public.competencias c
left join public.lancamentos_faturamento l
  on l.competencia_id = c.id
group by c.id, c.empresa_id, c.ano, c.mes, c.status, c.sem_movimento;

create view public.vw_faturamento_acumulado
with (security_invoker = true)
as
select
  tc.*,
  sum(tc.total_liquido) over (
    partition by tc.empresa_id
    order by tc.ano, tc.mes
    rows between unbounded preceding and current row
  ) as total_acumulado
from public.vw_totais_competencia tc;

revoke all
  on table public.vw_totais_categoria_competencia,
           public.vw_totais_competencia,
           public.vw_faturamento_acumulado
  from public, anon;

grant select
  on table public.vw_totais_categoria_competencia,
           public.vw_totais_competencia,
           public.vw_faturamento_acumulado
  to authenticated, service_role;

comment on view public.vw_totais_categoria_competencia is
  'Totais líquidos dos lançamentos ativos por categoria e competência.';

comment on view public.vw_totais_competencia is
  'Totais líquidos dos lançamentos ativos por competência, incluindo competências zeradas.';

comment on view public.vw_faturamento_acumulado is
  'Totais mensais e acumulados por empresa em ordem cronológica.';
