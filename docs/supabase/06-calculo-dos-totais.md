# Cálculo dos totais — Etapa 06

## Objetivo

Fornecer consultas padronizadas sem armazenar valores derivados. A migration desta etapa é:

```text
supabase/migrations/20260810020400_calculo_dos_totais.sql
```

## Regra de cálculo

Somente lançamentos `ATIVO` participam dos totais:

```text
FATURAMENTO         → + valor
DEVOLUCAO_ESTORNO   → - valor
CANCELADO           → 0
```

Os totais são calculados durante a consulta. Nenhuma coluna de total é adicionada às tabelas.

Como existe somente um lançamento ativo por competência, o total mensal corresponde ao efeito contábil desse único registro. Lançamentos cancelados da cadeia de correção permanecem excluídos do cálculo.

## Views criadas

### `vw_totais_categoria_competencia`

Agrupa os lançamentos por competência e categoria. Retorna:

- total de faturamentos;
- total de devoluções e estornos;
- total líquido;
- estoque inicial e estoque final do lançamento ativo.

Categorias sem nenhum lançamento não aparecem nessa view.

### `vw_totais_competencia`

Agrupa todos os lançamentos da competência e também retorna competências zeradas ou sem movimento. Inclui status, indicação de sem movimento e os estoques do lançamento ativo. Competências sem movimento retornam estoques nulos.

### `vw_faturamento_acumulado`

Parte do total mensal e utiliza uma função de janela para calcular o acumulado cronológico por empresa.

Exemplo de filtro anual:

```sql
select *
from public.vw_faturamento_acumulado
where empresa_id = 1
  and ano = 2026
order by mes;
```

O campo `total_acumulado` considera todas as competências anteriores da empresa, inclusive anos anteriores. Para um acumulado restrito a outro intervalo, o backend deve somar `total_liquido` após aplicar o filtro desejado.

## Segurança

As três views utilizam `security_invoker = true`. Portanto, respeitam as políticas RLS das tabelas de origem:

- usuário autenticado e ativo pode consultar;
- `service_role` pode consultar pelo backend;
- `anon` não possui acesso.

## Testes recomendados

1. criar o lançamento mensal com valor e estoques;
2. conferir o total líquido da competência;
3. corrigir o lançamento por cancelamento e substituição;
4. confirmar que o cancelado não participa do total;
5. confirmar que somente o substituto ativo participa das views;
6. consultar uma competência sem movimento e confirmar total zero;
7. conferir o acumulado em meses consecutivos.

## Próxima etapa

A etapa 07 descreve o contrato seguro entre o backend Fastify e as funções/views do Supabase.
