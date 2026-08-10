# Fluxo das competências — Etapa 03

## Objetivo

Centralizar no PostgreSQL o fluxo de uma competência e impedir alterações diretas de status. A migration desta etapa é:

```text
supabase/migrations/20260810020100_fluxo_das_competencias.sql
```

## Transições permitidas

```text
ABERTA → EM_CONFERENCIA
EM_CONFERENCIA → REABERTA
EM_CONFERENCIA → FINALIZADA
REABERTA → EM_CONFERENCIA
```

Qualquer outra transição gera erro. Uma competência `FINALIZADA` permanece somente para consulta.

## Função `transicionar_competencia`

Assinatura:

```sql
public.transicionar_competencia(
  p_competencia_id bigint,
  p_status_novo public.status_competencia,
  p_usuario_id uuid,
  p_justificativa text default null
)
```

A função:

- bloqueia a competência durante a operação para evitar transições concorrentes;
- exige usuário interno ativo;
- valida o movimento de origem e destino;
- exige lançamento ativo ou marcação de sem movimento antes da conferência;
- exige justificativa em `EM_CONFERENCIA → REABERTA`;
- preenche os responsáveis e horários de conferência/finalização;
- cria o registro em `historico_competencias` na mesma transação.

Exemplo executado pelo backend:

```sql
select public.transicionar_competencia(
  10,
  'EM_CONFERENCIA',
  '00000000-0000-0000-0000-000000000000',
  null
);
```

## Função `marcar_sem_movimento`

Assinatura:

```sql
public.marcar_sem_movimento(
  p_competencia_id bigint,
  p_usuario_id uuid,
  p_sem_movimento boolean
)
```

Somente competências `ABERTA` ou `REABERTA` podem ser marcadas ou desmarcadas. A marcação é rejeitada quando existe lançamento ativo.

## Proteção contra escrita direta

Os triggers `competencias_proteger_fluxo` e `historico_proteger_insercao` impedem:

- mudar diretamente o status ou os metadados do fluxo;
- criar manualmente registros de histórico;
- contornar a justificativa obrigatória da reabertura.

As funções controladas são executáveis apenas pela `service_role`. O frontend não recebe acesso para alterar o fluxo diretamente.

## Testes recomendados

- tentar `ABERTA → FINALIZADA`;
- iniciar conferência sem lançamento e sem marcação de sem movimento;
- reabrir sem justificativa;
- alterar `competencias.status` com um `UPDATE` direto;
- executar uma transição válida e conferir o registro no histórico;
- repetir duas reaberturas e confirmar a preservação de toda a sequência.

## Próxima etapa

A etapa 04 implementa o cancelamento e a substituição de lançamentos como uma única operação atômica.
