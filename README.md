# Controle de Faturamento Contábil

Sistema interno para controle mensal de faturamento de empresas atendidas por um escritório contábil.

O projeto está em fase inicial de desenvolvimento e tem como objetivo centralizar o registro, a conferência e o histórico dos faturamentos utilizados pelo escritório no processo de apuração mensal.

## Objetivo do MVP

O MVP deverá permitir:

- cadastrar empresas;
- cadastrar usuários internos;
- cadastrar categorias globais de faturamento;
- criar competências mensais por empresa;
- registrar o lançamento mensal de faturamento com estoques inicial e final;
- registrar devoluções e estornos;
- controlar competências em fluxo de conferência;
- preservar o histórico de alterações;
- impedir edição e exclusão direta de lançamentos;
- corrigir lançamentos somente por cancelamento e substituição;
- identificar competências sem movimento;
- consultar faturamento mensal e acumulado.

## Fluxo da competência

```text
ABERTA
   ↓
EM_CONFERENCIA
   ├──────────────→ FINALIZADA
   │
   ↓
REABERTA
   ↓
EM_CONFERENCIA
```

Transições permitidas:

- `ABERTA → EM_CONFERENCIA`
- `EM_CONFERENCIA → REABERTA`
- `REABERTA → EM_CONFERENCIA`
- `EM_CONFERENCIA → FINALIZADA`

Uma competência `FINALIZADA` fica somente para consulta no MVP.

## Lançamentos

Tipos de lançamento:

- `FATURAMENTO`
- `DEVOLUCAO_ESTORNO`

Todos os valores são armazenados como positivos.

Nos cálculos:

```text
FATURAMENTO
→ soma

DEVOLUCAO_ESTORNO
→ subtrai
```

Cada competência mensal pode possuir somente um lançamento ativo. Correções preservam os registros cancelados e criam um único substituto ativo.

Todo lançamento registra também os valores não negativos de estoque inicial e estoque final do mês.

## Imutabilidade e correções

Um lançamento não pode ser editado nem excluído fisicamente depois de criado.

Quando houver erro:

1. o lançamento original é cancelado;
2. o motivo da correção é registrado;
3. um novo lançamento é criado;
4. o novo lançamento referencia o anterior através de `substitui_lancamento_id`.

Cancelamento e substituição devem ocorrer como uma operação atômica:

```text
ou ambos são concluídos
ou nenhuma alteração é persistida
```

A cadeia de substituição deve permanecer linear e sem ramificações.

## Categorias de faturamento

As categorias são globais e podem ser utilizadas por todas as empresas.

Categorias já utilizadas não devem ser excluídas ou ter seu significado alterado.

Quando deixarem de ser utilizadas, devem ser desativadas.

## Sem movimento

Uma competência pode ser marcada como `sem_movimento` quando não existir faturamento no mês.

Uma competência marcada como sem movimento não pode possuir lançamentos ativos.

## Stack

### Banco e autenticação

- Supabase
- PostgreSQL
- Supabase Auth
- Row Level Security (RLS)

### Frontend / Backend

- React 19;
- Vite 8;
- Fastify 5;
- Node.js 22;
- cliente JavaScript do Supabase.

## Segurança

O sistema será de uso exclusivamente interno.

Regras principais:

- somente usuários autenticados podem acessar os dados;
- usuários inativos não podem operar o sistema;
- tabelas expostas pelo Supabase devem utilizar RLS;
- a chave `service_role` nunca deve ser enviada ao frontend;
- operações críticas devem ser protegidas no backend ou em funções PostgreSQL/RPC;
- lançamentos não podem ser excluídos;
- histórico de competências não pode ser editado ou excluído;
- alterações de status devem respeitar o fluxo definido.

## Documentação

A especificação inicial do banco e das regras de negócio está em `docs/modelo-banco.md`. A implementação foi dividida nas seguintes etapas:

```text
docs/
├── 01-criacao-tabelas-supabase.md
├── 02-integridade-e-imutabilidade.md
├── 03-fluxo-das-competencias.md
├── 04-cancelamento-e-substituicao.md
├── 05-auth-e-controle-de-acesso.md
├── 06-calculo-dos-totais.md
└── 07-integracao-do-backend.md
```

A documentação deve ser atualizada sempre que uma decisão estrutural ou regra de negócio do MVP for alterada.

## Estrutura do projeto

```text
controle-faturamento-contabil/
├── backend/
│   └── src/
├── frontend/
│   ├── public/
│   └── src/
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   └── seed.sql
├── docs/
│   ├── modelo-banco.md
│   └── documentação por etapa
├── .gitignore
├── .env.example
├── package.json
└── README.md
```

As alterações estruturais do banco são versionadas em `supabase/migrations/` e devem ser aplicadas sempre na ordem dos identificadores.

## Variáveis de ambiente

Credenciais reais nunca devem ser versionadas.

Cada aplicação possui seu próprio `.env.example`:

```env
# frontend/.env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=

# backend/.env
PORT=3000
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

O arquivo `.env` real deve permanecer no `.gitignore`.

## Status do projeto

🚧 MVP em desenvolvimento.

Estado atual:

- regras principais definidas;
- modelo inicial de banco definido;
- autenticação configurada com Supabase Auth;
- frontend React/Vite configurado;
- backend Fastify configurado;
- ambiente local do Supabase configurado;
- migrations do modelo de negócio implementadas;
- endpoints de negócio do backend ainda não implementados.

## Convenções iniciais

### Branch principal

```text
master
```

### Branches de desenvolvimento

Sugestão:

```text
feat/nome-da-funcionalidade
fix/nome-da-correcao
docs/nome-da-alteracao
refactor/nome-da-refatoracao
```

### Commits

Preferir mensagens curtas e objetivas.

Exemplos:

```text
chore: initialize repository
docs: add database model
feat: add company registration
fix: prevent invalid competence transition
```

## Uso

Requisitos locais:

- Node.js 22;
- Docker Desktop para executar o Supabase local.

Instale as dependências na raiz:

```bash
npm install
```

Copie `frontend/.env.example` e `backend/.env.example` para arquivos `.env` nos respectivos diretórios. Depois, execute cada serviço em um terminal:

```bash
npm run supabase:start
npm run dev:backend
npm run dev:frontend
```

O frontend fica disponível em `http://localhost:5173`, a API em `http://localhost:3000` e o Supabase Studio em `http://localhost:54323`.

Projeto de uso interno. O cadastro público de usuários está desabilitado; usuários devem ser provisionados de forma administrativa.

Não versionar:

- senhas;
- tokens;
- chaves privadas;
- credenciais do Supabase;
- dados reais de clientes;
- backups do banco;
- arquivos `.env`.
