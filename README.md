# Controle de Faturamento Contábil

Sistema interno para controle mensal de faturamento de empresas atendidas por um escritório contábil.

O projeto está em fase inicial de desenvolvimento e tem como objetivo centralizar o registro, a conferência e o histórico dos faturamentos utilizados pelo escritório no processo de apuração mensal.

## Objetivo do MVP

O MVP deverá permitir:

- cadastrar empresas;
- cadastrar usuários internos;
- cadastrar categorias globais de faturamento;
- criar competências mensais por empresa;
- registrar lançamentos de faturamento;
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

Uma mesma categoria pode possuir vários lançamentos na mesma competência.

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

## Stack prevista

### Banco e autenticação

- Supabase
- PostgreSQL
- Supabase Auth
- Row Level Security (RLS)

### Frontend / Backend

A stack da aplicação será definida durante a implementação inicial.

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

A especificação inicial do banco e das regras de negócio deve ser mantida em:

```text
docs/modelo-banco.md
```

A documentação deve ser atualizada sempre que uma decisão estrutural ou regra de negócio do MVP for alterada.

## Estrutura inicial sugerida

```text
controle-faturamento-contabil/
├── docs/
│   └── modelo-banco.md
├── .gitignore
├── .env.example
└── README.md
```

A estrutura de frontend, backend e migrations será adicionada quando a implementação começar.

## Variáveis de ambiente

Credenciais reais nunca devem ser versionadas.

Um arquivo `.env.example` poderá documentar as variáveis necessárias futuramente, por exemplo:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

O arquivo `.env` real deve permanecer no `.gitignore`.

## Status do projeto

🚧 MVP em desenvolvimento.

Estado atual:

- regras principais definidas;
- modelo inicial de banco definido;
- autenticação prevista com Supabase Auth;
- implementação ainda não iniciada.

## Convenções iniciais

### Branch principal

```text
main
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

Projeto de uso interno.

Não versionar:

- senhas;
- tokens;
- chaves privadas;
- credenciais do Supabase;
- dados reais de clientes;
- backups do banco;
- arquivos `.env`.

