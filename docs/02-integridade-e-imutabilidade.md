# Integridade e imutabilidade — Etapa 02

## Objetivo

Esta etapa acrescenta ao banco as regras que não cabem apenas em `CHECK` e chaves estrangeiras. A implementação está na migration:

```text
supabase/migrations/20260810020000_integridade_e_imutabilidade.sql
```

Ela também acrescenta os campos mensais `estoque_inicial` e `estoque_final` à tabela de lançamentos.

## Regras implementadas

### Competências

- somente empresas ativas podem receber novas competências;
- toda competência nasce como `ABERTA`;
- uma competência nova não pode receber metadados de conferência, finalização ou sem movimento;
- empresa, ano, mês, identificador e data de criação tornam-se imutáveis.

### Lançamentos

- a data de referência deve pertencer ao ano e mês da competência;
- estoque inicial e estoque final são obrigatórios e não podem ser negativos;
- somente um lançamento pode permanecer `ATIVO` em cada competência;
- somente competências `ABERTA` ou `REABERTA` aceitam lançamentos e correções;
- empresa, categoria e usuário responsável precisam estar ativos;
- novos lançamentos sempre nascem como `ATIVO`;
- competência, categoria, usuário criador, tipo, data, valor, estoques, observação, vínculo de substituição e data de criação não podem ser editados;
- um lançamento cancelado não pode voltar a ser ativo nem receber nova alteração;
- lançamentos não podem ser excluídos fisicamente.

Ao inserir um lançamento em uma competência que estava marcada como sem movimento, os campos `sem_movimento`, `sem_movimento_em` e `sem_movimento_por` são limpos automaticamente.

### Histórico e categorias

- registros do histórico não podem ser atualizados nem excluídos;
- categorias que já foram utilizadas não podem ser excluídas;
- nome e descrição de uma categoria utilizada ficam protegidos, preservando seu significado histórico;
- a categoria ainda pode ser desativada.

## Triggers criados

| Trigger | Tabela | Responsabilidade |
|---|---|---|
| `competencias_validar_insercao` | `competencias` | Valida o estado inicial e a empresa |
| `competencias_proteger_dados_base` | `competencias` | Protege empresa e período |
| `lancamentos_validar_insercao_ou_cancelamento` | `lancamentos_faturamento` | Valida inclusão, cancelamento e imutabilidade |
| `lancamentos_bloquear_exclusao` | `lancamentos_faturamento` | Impede `DELETE` |
| `historico_bloquear_alteracao` | `historico_competencias` | Impede `UPDATE` e `DELETE` |
| `categorias_proteger_utilizadas` | `categorias_faturamento` | Preserva categorias com histórico |

O índice único parcial `lancamentos_um_ativo_por_competencia_idx` aplica a unicidade somente aos registros `ATIVO`. Assim, cancelados permanecem no histórico sem permitir dois lançamentos mensais vigentes.

As funções de trigger não são executáveis pela Data API. Elas são chamadas somente pelo PostgreSQL durante as operações nas tabelas.

## Testes recomendados

Execute os testes em uma transação e finalize com `rollback`:

1. criar uma competência para empresa inativa e confirmar a rejeição;
2. inserir lançamento com data fora do mês da competência;
3. tentar alterar o valor de um lançamento existente;
4. tentar excluir um lançamento;
5. tentar alterar o nome de uma categoria já utilizada;
6. inserir um lançamento em competência sem movimento e confirmar a limpeza automática da marcação;
7. tentar criar um segundo lançamento ativo para a mesma competência;
8. tentar informar estoque negativo;
9. tentar editar os estoques de um lançamento existente.

## Banco com dados anteriores

Os campos de estoque são adicionados como obrigatórios, sem valores artificiais. Se já existirem lançamentos no banco antes desta migration, ela será interrompida para que os estoques históricos sejam definidos conscientemente antes da aplicação. Não deve ser usado `0` como preenchimento automático sem confirmação do dado real.

## Próxima etapa

A etapa 03 controla as transições de status, a marcação de sem movimento e a geração do histórico.
