# Controle de Faturamento Contábil

Sistema interno para controle mensal de faturamento, categorias fiscais e informações financeiras de empresas atendidas pelo escritório.

O projeto está em desenvolvimento e utiliza como base uma modelagem voltada à rastreabilidade dos dados, preservação de histórico e integração com Supabase.

## Objetivo

Centralizar em um único sistema:

- cadastro das empresas;
- identificação de matriz e filiais;
- cadastro de responsáveis;
- cadastro de usuários internos do financeiro;
- categorias de faturamento;
- campos configuráveis por categoria;
- competências mensais;
- lançamentos mensais por campo;
- percentuais de imposto;
- resumo financeiro mensal;
- total provisório e oficial mensal;
- total provisório e oficial anual.

## Escopo atual do MVP

### Usuários

Os usuários são exclusivamente internos do setor financeiro.

A autenticação será realizada pelo Supabase Auth.

A tabela pública `USUARIOS` mantém os dados complementares do usuário:

- nome;
- e-mail;
- cargo;
- situação ativo/inativo;
- autorização para reabrir competência finalizada;
- último login.

O identificador do usuário é o mesmo UUID utilizado pelo Supabase Auth:

```text
auth.users.id
       ↓
public.USUARIOS.id
```

No MVP, `cargo` será informativo. A permissão `REABRIR_COMPETENCIA_FINALIZADA` será representada explicitamente pelo campo booleano `pode_reabrir_competencia_finalizada`, com padrão `false`.

Usuários inativos não poderão executar novas operações. Entretanto, um usuário histórico não precisará continuar ativo para que uma competência seja conferida, finalizada ou reaberta; ele precisará apenas continuar existindo no cadastro.

### Empresas

Cada CNPJ é representado individualmente.

O cadastro contém:

- razão social;
- nome fantasia;
- CNPJ;
- inscrição estadual;
- telefone;
- responsável;
- situação ativo/inativo;
- tipo de estabelecimento.

Tipos de estabelecimento:

```text
MATRIZ
FILIAL
```

Uma filial referencia sua matriz através de `matriz_id`.

```text
EMPRESA MATRIZ
      │
      ├── FILIAL
      └── FILIAL
```

### Responsáveis

Os responsáveis são armazenados separadamente das empresas.

Um responsável pode estar vinculado a uma ou várias empresas.

Informações previstas:

- nome;
- cargo;
- e-mail;
- telefone;
- situação ativo/inativo.

Toda empresa ativa deverá possuir um responsável ativo. Se um responsável estiver vinculado a uma ou mais empresas ativas, ele somente poderá ser inativado mediante substituição por outro responsável ativo.

A troca deverá ocorrer em uma única transação: todas as empresas ativas serão transferidas para o novo responsável e, somente então, o responsável anterior será inativado. Se qualquer etapa falhar, nenhuma alteração será confirmada.

Uma empresa inativa poderá permanecer vinculada a um responsável inativo para preservar seu cadastro, mas deverá receber um responsável ativo antes de ser reativada.

### Categorias de faturamento

As categorias são globais.

Uma categoria pode ser utilizada por várias empresas e uma empresa pode utilizar várias categorias.

A relação é feita por:

```text
EMPRESA_CATEGORIAS
```

### Campos das categorias

Cada categoria deve possuir entre um e dois campos ativos.

Exemplo:

```text
Categoria: COMERCIO

Campo 1: Vendas sem ST
Campo 2: Vendas com ST
```

O limite e a unicidade de ordem são avaliados somente entre campos ativos. Campos inativos não contam nesse cálculo.

Um campo inativo poderá receber correções cadastrais mesmo permanecendo inativo. O nome e a ordem usados anteriormente permanecerão preservados na fotografia imutável de cada competência, sem mudar a interpretação dos lançamentos históricos.

Ao reativá-lo, o sistema deverá validar novamente o limite de dois campos ativos e a unicidade da ordem dentro da categoria.

### Desativação de cadastros

Empresa, categoria global, vínculo empresa-categoria e campo não poderão ser desativados enquanto participarem de uma competência ainda não finalizada.

Essa trava abrange:

- responsável vinculado a empresa ativa;
- empresa;
- categoria global;
- vínculo entre empresa e categoria;
- campo da categoria.

São consideradas ainda não finalizadas as competências `ABERTA`, `REABERTA` ou `EM_CONFERENCIA`. A desativação somente será permitida depois que todas as competências dependentes estiverem `FINALIZADA`.

Essa dependência não se aplica a usuários citados apenas em registros históricos. Eles poderão ser inativados, mas não excluídos, e deixarão de poder realizar novas operações imediatamente.

Independentemente do estado das competências, um responsável não poderá ser inativado enquanto alguma empresa ativa continuar vinculada a ele. Para inativá-lo, todas essas empresas deverão receber outro responsável ativo na mesma transação.

Se a desativação for rejeitada, o sistema deverá informar as competências pendentes, com empresa, mês, ano e status. A validação deverá existir no banco ou backend e também bloquear alterações diretas do campo ativo/inativo.

### Competências

Cada competência representa:

```text
EMPRESA + ANO + MES
```

Existe somente uma competência por empresa em cada mês.

Restrição:

```text
UNIQUE (empresa_id, ano, mes)
```

Ao criar a competência, o sistema registrará em `COMPETENCIA_CAMPOS_APLICAVEIS` uma fotografia dos vínculos, categorias, campos, nomes e ordens aplicáveis naquele momento. Essa fotografia será imutável. Alterações cadastrais posteriores valerão apenas para novas competências e não criarão obrigações retroativas nas competências abertas.

A competência também permite indicar explicitamente um mês sem movimento.

Isso diferencia:

```text
empresa realmente sem movimento
```

de:

```text
competência ainda não preenchida
```

Toda competência possui um status:

```text
ABERTA
EM_CONFERENCIA
REABERTA
FINALIZADA
```

Enquanto estiver `ABERTA` ou `REABERTA`, o preenchimento poderá ser gradual. Isso permite lançar uma categoria ou preencher parte do resumo financeiro e continuar depois. Cada lançamento salvo, porém, deverá estar completo e válido; não serão mantidos lançamentos incompletos no banco.

Em `ABERTA` ou `REABERTA`, a ausência parcial é permitida. Em `EM_CONFERENCIA` ou `FINALIZADA`, a ausência de lançamentos somente será permitida quando `sem_movimento = true`.

Quando `sem_movimento = false`, concluir o preenchimento altera a competência para `EM_CONFERENCIA` somente se todos os campos da fotografia possuírem lançamento e todos os campos do resumo financeiro estiverem preenchidos. Quando `sem_movimento = true`, não poderá existir nenhum lançamento ativo, mas o resumo financeiro completo continuará obrigatório. Se houver alguma pendência, a competência permanecerá no status atual.

Nesse modelo, `sem_movimento` significa ausência de faturamento, não ausência de informações financeiras. Mesmo sem faturamento, despesas, estoque, pró-labore e caixa deverão ser informados.

Fluxo permitido:

```text
ABERTA → EM_CONFERENCIA
EM_CONFERENCIA → REABERTA
REABERTA → EM_CONFERENCIA
EM_CONFERENCIA → FINALIZADA
FINALIZADA → REABERTA (excepcional)
```

Enquanto estiver `EM_CONFERENCIA`, toda a competência ficará congelada. Será permitido somente consultar, finalizar ou reabrir.

Nesse status, não será permitido:

- criar, cancelar ou substituir lançamentos;
- alterar o resumo financeiro;
- marcar ou desmarcar `sem_movimento`;
- alterar empresa, mês ou ano;
- modificar ou excluir a fotografia de categorias, vínculos e campos da competência.

Alterações permitidas nos cadastros mestres não modificarão uma competência existente e valerão somente para competências futuras.

Qualquer correção exige primeiro a transição para `REABERTA`. Depois das alterações, a competência deverá retornar para `EM_CONFERENCIA` antes da finalização.

Se um erro for descoberto depois da finalização, será permitida a transição excepcional `FINALIZADA → REABERTA`. Ela exigirá usuário ativo com `pode_reabrir_competencia_finalizada = true`, justificativa obrigatória e registro imutável no histórico.

Antes da reabertura, a empresa e o usuário que realiza a operação deverão estar ativos, e a fotografia histórica deverá permanecer íntegra. Usuários criadores, categorias, vínculos e campos históricos precisam continuar existindo, mas não precisam continuar ativos.

Toda mudança de status será registrada em `HISTORICO_COMPETENCIAS`, preservando status anterior, status novo, responsável, justificativa e data/hora. Finalizações anteriores nunca serão apagadas.

### Lançamentos por categoria

Os lançamentos são feitos por campo da categoria.

Cada campo pode possuir somente um lançamento `ATIVO` por competência.

Cada lançamento guarda `competencia_campo_aplicavel_id`, apontando para o vínculo, a categoria e o campo preservados na fotografia da competência.

Além dessas relações, a criação de um lançamento exige explicitamente:

- empresa da competência ativa;
- categoria global ativa;
- vínculo entre empresa e categoria ativo;
- campo da categoria ativo;
- usuário criador ativo;
- competência com status `ABERTA` ou `REABERTA`.

Essas validações são travas obrigatórias do banco ou backend e não dependem somente do frontend. Se qualquer condição falhar, nenhum lançamento será criado.

Exemplo:

```text
Agosto/2026
Categoria: COMERCIO

Vendas sem ST
Valor: R$ 30.000,00
Imposto: 7,25%

Vendas com ST
Valor: R$ 20.000,00
Imposto: 4,50%
```

O percentual de imposto é armazenado como `NUMERIC`, evitando problemas de precisão de ponto flutuante.

O valor `0` é válido e representa um total informado como zero. Ele não equivale a ausência de preenchimento.

Em `ABERTA` ou `REABERTA`, lançamentos ainda poderão estar ausentes durante o preenchimento. Em `EM_CONFERENCIA` ou `FINALIZADA`, cada campo da fotografia deverá possuir lançamento ativo, mesmo que o valor seja `0`, salvo quando `sem_movimento = true`.

### Imutabilidade dos lançamentos

Um lançamento nunca é editado depois de criado.

Campos de negócio como:

- competência;
- campo da categoria;
- valor;
- percentual de imposto;
- usuário criador;

são imutáveis.

Quando houver erro, o lançamento poderá ser cancelado ou substituído. O registro antigo continuará armazenado.

```text
LANÇAMENTO ATIVO
       ├── CANCELAMENTO → CANCELADO
       └── SUBSTITUIÇÃO → ORIGINAL CANCELADO + NOVO ATIVO
```

### Cancelamento e substituição

As informações da operação ficam em `OPERACOES_LANCAMENTO`, contendo lançamento original, tipo da operação, eventual substituto, motivo, usuário responsável e data/hora.

No `CANCELAMENTO`, o original passa de `ATIVO` para `CANCELADO` e não existe substituto. No `SUBSTITUICAO`, o original é cancelado e o novo lançamento nasce `ATIVO` na mesma transação.

A substituição exige o identificador do lançamento original, o novo valor, o novo percentual de imposto, o motivo da correção e o usuário responsável. O lançamento original precisa estar `ATIVO`, e o substituto será criado obrigatoriamente como `ATIVO` na mesma operação que cancela o original.

O substituto não poderá alterar o enquadramento do lançamento original. A operação copiará obrigatoriamente:

- a mesma competência, garantindo a mesma empresa, o mesmo mês e o mesmo ano;
- o mesmo vínculo entre empresa e categoria;
- a mesma categoria;
- o mesmo campo da categoria.

Para corrigir um valor em outro mês, categoria ou campo, não será utilizada a substituição desse lançamento. A substituição serve apenas para corrigir os valores do mesmo lançamento lógico, preservando seu contexto original.

No momento da substituição, serão exigidos empresa e usuário responsável ativos, além de competência `ABERTA` ou `REABERTA`. A categoria, o vínculo e o campo originais precisarão continuar existindo, mas poderão estar inativos. Essa exceção reutiliza exclusivamente o mesmo item da fotografia e não libera o campo inativo para lançamentos comuns.

A cadeia deve ser linear e não pode possuir ramificações.

A operação deve ser atômica:

```text
OU
cancelamento ou substituição e respectivo histórico são concluídos

OU
nenhuma alteração é persistida
```

No PostgreSQL/Supabase, essa operação deverá ser executada através de transação segura, preferencialmente por função PostgreSQL/RPC ou backend.

### Resumo financeiro

Cada competência pode possuir um único resumo financeiro.

Campos previstos:

- valor do DAS;
- caixa inicial;
- caixa final;
- despesas;
- estoque inicial;
- estoque final;
- pró-labore;
- divisão de lucros.

Os campos são inicialmente opcionais para permitir preenchimento gradual.

Regras de sinal:

- `valor_das`, `despesas`, `estoque_inicial`, `estoque_final`, `prolabore` e `divisao_lucros` aceitam somente zero ou valores positivos;
- `caixa_inicial` e `caixa_final` podem ser negativos, iguais a zero ou positivos, permitindo representar saldo devedor ou caixa descoberto;
- despesas e outras saídas são informadas como montantes positivos; sua natureza determina o efeito no cálculo;
- um campo ainda não preenchido utiliza `NULL`, enquanto um valor efetivamente zerado utiliza `0`.

Na conclusão da competência, nenhum campo do resumo poderá permanecer `NULL`.

Cada criação ou alteração do resumo registrará o usuário ativo responsável e gerará uma versão imutável em `HISTORICO_RESUMO_FINANCEIRO`. Dessa forma, será possível reconstruir todas as versões, inclusive as etapas de preenchimento parcial.

### Total mensal

O total do mês não é armazenado fisicamente e deve ser apresentado de duas formas:

- `total_provisorio_mes`: soma os lançamentos `ATIVO` de competências `ABERTA`, `REABERTA`, `EM_CONFERENCIA` ou `FINALIZADA`;
- `total_oficial_mes`: soma os lançamentos `ATIVO` somente quando a competência estiver `FINALIZADA`.

O total provisório poderá mudar enquanto o preenchimento ou a conferência estiver em andamento e não deverá ser apresentado como valor oficial. Antes da finalização, a ausência de total oficial não equivale a zero.

Quando a competência existir, estiver `FINALIZADA` e não possuir lançamentos por estar sem movimento, o total oficial será `0`, usando uma regra equivalente a `COALESCE(SUM(valor), 0)`. Para competência inexistente ou ainda não finalizada, o total oficial continuará ausente (`NULL`).

Se uma competência finalizada for reaberta, ela sairá do total oficial e permanecerá apenas no provisório até ser finalizada novamente.

Os campos de uma categoria são considerados, no modelo atual, parcelas independentes do faturamento.

### Total anual

O total anual também não é armazenado fisicamente:

- `total_provisorio_ano`: considera lançamentos `ATIVO` das competências da empresa em `ABERTA`, `REABERTA`, `EM_CONFERENCIA` ou `FINALIZADA`;
- `total_oficial_ano`: considera lançamentos `ATIVO` somente das competências `FINALIZADA`.

As consultas e os relatórios deverão identificar explicitamente qual dos dois totais está sendo exibido. Essa separação impede que competências parcialmente preenchidas sejam tratadas como faturamento oficial e evita inconsistências quando um lançamento histórico for cancelado ou substituído.

### Cálculo de imposto

O valor calculado do imposto não é persistido inicialmente.

São armazenados:

```text
valor
percentual_imposto
```

O cálculo é:

```text
valor_imposto =
valor * percentual_imposto / 100
```

Os cálculos devem permanecer em tipos decimais `NUMERIC`.

## Modelo de dados

Tabelas previstas no MVP:

```text
USUARIOS
RESPONSAVEIS
EMPRESAS
CATEGORIAS_FATURAMENTO
EMPRESA_CATEGORIAS
CATEGORIA_CAMPOS
COMPETENCIAS
COMPETENCIA_CAMPOS_APLICAVEIS
HISTORICO_COMPETENCIAS
LANCAMENTOS_CATEGORIA
OPERACOES_LANCAMENTO
RESUMO_FINANCEIRO
HISTORICO_RESUMO_FINANCEIRO
```

Além da estrutura de autenticação gerenciada pelo Supabase:

```text
auth.users
```

Relacionamentos principais:

```text
auth.users
    │
    └── USUARIOS

RESPONSAVEIS
    │
    └── EMPRESAS
            │
            ├── MATRIZ / FILIAIS
            │
            ├── EMPRESA_CATEGORIAS
            │       │
            │       └── CATEGORIAS_FATURAMENTO
            │                    │
            │                    └── CATEGORIA_CAMPOS
            │
            └── COMPETENCIAS
                    │
                    ├── COMPETENCIA_CAMPOS_APLICAVEIS
                    │       │
                    │       ├── EMPRESA_CATEGORIAS
                    │       └── CATEGORIA_CAMPOS
                    │
                    ├── HISTORICO_COMPETENCIAS
                    ├── LANCAMENTOS_CATEGORIA
                    │       ├── COMPETENCIA_CAMPOS_APLICAVEIS
                    │       └── OPERACOES_LANCAMENTO
                    │
                    └── RESUMO_FINANCEIRO
                            │
                            └── HISTORICO_RESUMO_FINANCEIRO
```

## Stack prevista

### Banco e autenticação

- Supabase
- PostgreSQL
- Supabase Auth
- Row Level Security (RLS)

### Aplicação

A estrutura da aplicação será adicionada conforme o desenvolvimento do MVP.

## Segurança

As tabelas expostas pelo Supabase deverão utilizar Row Level Security.

Regra conceitual inicial:

```text
usuário autenticado
+
registro existente em public.USUARIOS
+
USUARIOS.ativo = true
→ acesso permitido
```

Regras importantes:

- usuários não autenticados não acessam dados internos;
- usuários inativos não podem operar o sistema;
- uma empresa ativa sempre deve estar vinculada a um responsável ativo;
- a inativação de um responsável exige a transferência atômica de todas as empresas ativas vinculadas para outro responsável ativo;
- a chave `service_role` nunca deve ser enviada ao frontend;
- regras críticas não devem depender somente do frontend;
- lançamentos comuns exigem empresa, categoria, vínculo, campo e usuário criador ativos, além de item correspondente na fotografia da competência;
- empresa, categoria, vínculo ou campo não podem ser desativados enquanto participarem de competência não finalizada;
- referências a usuários históricos exigem apenas que o cadastro continue existindo; somente o autor da operação atual precisa estar ativo;
- lançamentos somente podem ser criados em competências `ABERTA` ou `REABERTA`;
- competências `ABERTA` ou `REABERTA` podem possuir ausência parcial;
- competências `EM_CONFERENCIA` ou `FINALIZADA` somente podem ficar sem lançamentos quando `sem_movimento = true`, mas o resumo financeiro continua obrigatório;
- competências `EM_CONFERENCIA` ficam congeladas para alterações; qualquer correção exige reabertura anterior;
- mudanças de status devem respeitar o fluxo definido e não podem pular etapas;
- reabertura de competência finalizada exige usuário ativo com `pode_reabrir_competencia_finalizada = true`, justificativa e histórico imutável;
- somente `caixa_inicial` e `caixa_final` podem receber valores negativos;
- faturamento, imposto, DAS, despesas, estoques, pró-labore e divisão de lucros não podem ser negativos;
- lançamentos não podem ser excluídos fisicamente;
- cancelamentos e substituições devem ser registrados em `OPERACOES_LANCAMENTO`;
- operações críticas devem utilizar transações.

## Documentação

A especificação detalhada do banco deve ser mantida dentro da pasta:

```text
docs/
```

Estrutura sugerida:
<!-- ainda vai ser colocada -->
```text
docs/
└── modelo-banco.md
```

O modelo de banco deve ser atualizado sempre que uma regra estrutural ou de negócio for alterada.

## Estrutura inicial do repositório

```text
controle-faturamento-contabil/
├── docs/
│   └── modelo-negocio.md
├── .env.example
├── .gitignore
└── README.md
```

A estrutura de frontend, backend e migrations será adicionada durante a implementação.

## Variáveis de ambiente

Credenciais reais nunca devem ser versionadas.

Exemplo inicial:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

O arquivo real `.env` deve permanecer ignorado pelo Git.

Nunca versionar:

- senhas;
- tokens;
- chaves privadas;
- `service_role`;
- dados reais de clientes;
- backups do banco;
- arquivos `.env`.

## Convenções de branch

Branch principal:

```text
main
```

Branches de desenvolvimento:

```text
feat/nome-da-funcionalidade
fix/nome-da-correcao
docs/nome-da-alteracao
refactor/nome-da-refatoracao
```

Exemplos:

```text
feat/company-registration
feat/category-management
feat/monthly-competence
feat/revenue-entry
```

## Convenções de commit

Exemplos:

```text
chore: initialize repository
docs: update database model
feat: add company registration
feat: add category fields
feat: add monthly competence
fix: prevent duplicate active field entry
refactor: simplify revenue calculation
```

## Status

🚧 **MVP em desenvolvimento**

Estado atual:

- modelagem inicial definida;
- autenticação planejada com Supabase Auth;
- regras principais de integridade definidas;
- desenvolvimento da aplicação em andamento.

## Uso

Projeto destinado a uso interno.
