# Cancelamento e substituição — Etapa 04

## Objetivo

Garantir que uma correção nunca deixe um lançamento cancelado sem substituto. A implementação está em:

```text
supabase/migrations/20260810020200_cancelamento_e_substituicao.sql
```

## Operação atômica

A função `cancelar_e_substituir_lancamento` executa, na mesma transação:

1. bloqueio do lançamento e da competência;
2. validação do usuário, empresa, categoria, competência, novo valor e estoques;
3. cancelamento do lançamento original;
4. criação do substituto ativo;
5. vínculo do substituto pelo campo `substitui_lancamento_id`;
6. validação diferida da cadeia.

Se qualquer validação falhar, o PostgreSQL desfaz toda a operação.

## Assinatura da função

```sql
public.cancelar_e_substituir_lancamento(
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
) returns bigint
```

O retorno é o identificador do novo lançamento.

Exemplo:

```sql
select public.cancelar_e_substituir_lancamento(
  p_lancamento_id := 100,
  p_usuario_id := '00000000-0000-0000-0000-000000000000',
  p_motivo := 'Valor informado incorretamente',
  p_categoria_id := 3,
  p_tipo_lancamento := 'FATURAMENTO',
  p_data_referencia := date '2026-08-01',
  p_valor := 9500.00,
  p_estoque_inicial := 12000.00,
  p_estoque_final := 8500.00,
  p_observacao := 'Documento corrigido'
);
```

## Constraint diferida

O trigger `lancamentos_validar_cadeia_substituicao` é `DEFERRABLE INITIALLY DEFERRED`. A validação ocorre no fechamento da transação, quando cancelamento e substituto já devem existir juntos.

Ele garante:

- todo lançamento cancelado possui um substituto;
- o registro referenciado pelo substituto está cancelado;
- original e substituto pertencem à mesma competência.

O índice único mensal permite a operação porque o original é alterado para `CANCELADO` antes da criação do substituto `ATIVO`. Ao final da transação existe exatamente um lançamento ativo na competência.

A restrição `UNIQUE (substitui_lancamento_id)` criada na etapa 01 impede ramificações. Como o vínculo é imutável e aponta para um registro já existente, a cadeia permanece linear e sem ciclos.

## Concorrência

O `FOR UPDATE` impede que duas requisições corrijam simultaneamente o mesmo lançamento. A primeira operação válida conclui; a segunda encontra o registro já cancelado e é rejeitada.

## Testes recomendados

- cancelar sem motivo;
- substituir um lançamento já cancelado;
- usar data fora da competência;
- usar categoria inativa;
- informar estoque inicial ou final negativo;
- tentar um `UPDATE` isolado para `CANCELADO` e confirmar falha no `COMMIT`;
- executar a função e verificar que o original fica cancelado e o novo registro fica ativo;
- corrigir novamente o substituto e conferir a cadeia linear.

## Próxima etapa

A etapa 05 conecta os perfis internos ao Supabase Auth e cria as políticas de leitura.
