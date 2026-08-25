# Valores negativos no caixa

## Objetivo

Permitir saldos devedores nos campos de caixa inicial e caixa final dos lançamentos.

## Alterações para avaliação

- os campos de caixa inicial e final aceitam valores negativos no formulário;
- a API aceita valores negativos dentro do limite de `NUMERIC(14,2)`;
- as restrições de sinal do banco foram removidas somente para os campos de caixa;
- a função de criação em lote continua exigindo os dois valores, mas não rejeita valores negativos;
- estoque inicial e final continuam obrigatórios e iguais ou maiores que zero;
- foram adicionados testes para caixa negativo no frontend e nos endpoints de criação comum e em lote.

## Validação

Não foi executado `npm run build` e nenhum commit foi criado, conforme orientação do projeto.
