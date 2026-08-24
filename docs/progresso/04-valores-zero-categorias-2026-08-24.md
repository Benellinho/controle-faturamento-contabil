# Valores zero nas categorias

## Objetivo

Permitir que categorias sem faturamento no mês sejam registradas com valor igual a zero.

## Alterações para avaliação

- os campos de valor Normal e com RT passam a iniciar em `R$ 0,00`;
- o frontend aceita valores de categoria iguais a zero e continua rejeitando valores negativos;
- a API de criação comum e em lote aceita zero, mantendo o limite monetário e as duas casas decimais;
- a restrição do banco e a função de criação em lote passam a aceitar `valor >= 0`;
- a substituição mantém a regra existente de exigir valor maior que zero;
- testes foram atualizados para cobrir o novo valor inicial e a aceitação de zero.

## Validação

Não foi executado `npm run build` e nenhum commit foi criado, conforme orientação do projeto.
