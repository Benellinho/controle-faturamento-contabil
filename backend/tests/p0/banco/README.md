# Testes de banco do P0

Estes testes de integração validam, sem escrever no banco:

- conexão do backend com o Supabase configurado;
- existência das tabelas `empresas`, `categorias` e `lancamentos`;
- colunas previstas no contrato, incluindo o CNPJ;
- ao menos três empresas com CNPJs válidos e únicos;
- categorias vinculadas a empresas existentes;
- tabela `lancamentos` disponível com as colunas previstas, sem exigir dados pré-cadastrados.

## Pré-requisitos

1. migrations e dados de demonstração aplicados no banco que será verificado;
2. `backend/.env` configurado com a URL e uma Secret key (`sb_secret_...`) ou a chave legada `service_role` desse Supabase.

Os testes aceitam Supabase local ou remoto. Por usarem a `service_role`, devem ser executados somente em um ambiente controlado e nunca no frontend.
Uma Publishable key (`sb_publishable_...`) ou chave `anon` não possui permissão suficiente para esta verificação.

## Comandos

Conferir apenas a sintaxe dos testes:

```powershell
npm run check:tests --workspace backend
```

Executar os testes de integração:

```powershell
npm run test:p0:banco --workspace backend
```

Os testes são somente leitura. Eles não criam, alteram nem removem registros, inclusive quando executados contra um Supabase remoto.

## Dados de demonstração

O `supabase/seed.sql` e o arquivo `inserir-dados-p0.js` contêm somente empresas fictícias, CNPJs sintéticos e categorias para desenvolvimento. Dados reais de clientes não devem ser adicionados ou versionados. Lançamentos não são pré-cadastrados; eles serão criados pelo fluxo da aplicação e por seus testes específicos.

Depois de iniciar o Supabase local, `npx supabase db reset` recria o banco e aplica automaticamente o `supabase/seed.sql`.

O teste `backend/tests/p0/local/fluxo-api-local.test.js` cobre a API real contra o Supabase local. Ele recusa execução contra host remoto, cria um lançamento temporário e o remove ao final.

Sem confirmação, o script apenas imprime o plano e não acessa o banco:

```powershell
node backend/tests/p0/banco/inserir-dados-p0.js
```

A execução real exige o parâmetro abaixo e somente prossegue quando as tabelas `empresas` e `categorias` estão vazias:

```powershell
node --env-file=backend/.env backend/tests/p0/banco/inserir-dados-p0.js --confirmar-insercao
```
