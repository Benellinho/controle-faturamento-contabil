# Modelo de Banco — MVP Controle de Faturamento

## Visão geral

Este documento consolida o modelo atual do MVP para o sistema interno de controle de faturamento do escritório.

A estrutura está dividida em duas camadas:

1. **cadastros base**;
2. **controle mensal de faturamento e resumo financeiro**.

### Escopo atual

O MVP contempla:

- autenticação de usuários internos;
- cadastro de usuários do setor financeiro;
- cadastro de responsáveis;
- cadastro de empresas;
- identificação de matriz e filial;
- cadastro de categorias globais de faturamento;
- definição das categorias habilitadas para cada empresa;
- definição de um ou dois campos ativos de lançamento por categoria;
- criação de competências mensais;
- lançamento mensal dos valores de cada campo da categoria;
- informação do percentual de imposto por campo;
- registro do resumo financeiro mensal;
- identificação explícita de competência sem movimento;
- preservação do histórico por operações de cancelamento ou substituição;
- cálculo do acumulado mensal;
- cálculo do acumulado anual.

### Decisões principais

- O sistema será de uso exclusivamente interno.
- A autenticação será feita pelo Supabase Auth.
- Todos os usuários serão internos do setor financeiro.
- O faturamento será sempre mensal.
- As categorias serão globais.
- Cada empresa poderá ter apenas algumas categorias habilitadas.
- Cada categoria deverá possuir entre um e dois campos ativos configurados.
- Cada campo poderá possuir apenas um lançamento `ATIVO` por competência.
- Os percentuais de imposto serão armazenados em `NUMERIC`, evitando perda de precisão.
- Os valores monetários serão armazenados com `NUMERIC(14,2)`.
- Os lançamentos nunca poderão ser editados ou excluídos fisicamente.
- Um lançamento poderá ser cancelado sem substituto ou cancelado e substituído.
- Toda operação deverá registrar tipo, motivo, responsável e data/hora em tabela própria.
- Quando houver substituição, cancelamento e criação do substituto deverão ocorrer de forma atômica.
- A atividade do usuário será exigida na operação atual, não para autores históricos.
- A permissão de reabertura excepcional será um campo booleano explícito em `USUARIOS`.
- Cada competência terá uma fotografia imutável de seus campos aplicáveis.
- `sem_movimento` significará ausência de faturamento e não dispensará o resumo financeiro.
- Cada alteração do resumo financeiro gerará uma versão histórica imutável.
- Os totais mensal e anual não serão armazenados fisicamente.
- `total_provisorio` será calculado com lançamentos `ATIVO` de competências `ABERTA`, `REABERTA`, `EM_CONFERENCIA` ou `FINALIZADA`.
- `total_oficial` será calculado somente com lançamentos `ATIVO` de competências `FINALIZADA`.
- Nenhuma consulta ou relatório deverá apresentar um total genérico sem identificar se ele é provisório ou oficial.

---

# USUARIOS

Todos os usuários serão internos do setor financeiro.

| Chave | Campo | Tipo |
|---|---|---|
| PK / FK | id | UUID |
| NN | nome | Texto Limitado(150) |
| UK | email | Texto Limitado(255) |
| NN | cargo | Texto Limitado(50) |
| NN | ativo | true or false |
| NN | pode_reabrir_competencia_finalizada | true or false, padrão `false` |
|  | ultimo_login_at | Data com hora NULL |
| NN | created_at | Data com hora |
| NN | updated_at | Data com hora |

### Relacionamento

`USUARIOS.id → auth.users.id`

### Regras

- `USUARIOS.id` referencia diretamente `auth.users.id`.
- Usuários inativos não poderão executar novas operações no sistema.
- A atividade do usuário será validada no momento de cada criação, alteração, cancelamento, substituição, marcação ou transição de status.
- Referências históricas não exigirão que o usuário continue ativo. O criador de um lançamento, resumo ou registro histórico precisará continuar existindo, mas poderá estar inativo.
- O Supabase Auth será responsável por autenticação, senha, recuperação de senha e sessão.
- O campo `cargo` será apenas informativo no MVP e não concederá autorização automaticamente.
- A permissão `REABRIR_COMPETENCIA_FINALIZADA` será representada por `pode_reabrir_competencia_finalizada = true`.
- Somente um usuário ativo com essa permissão poderá executar `FINALIZADA → REABERTA`.
- Usuários com histórico não deverão ser excluídos fisicamente.
- O campo `email` será mantido na tabela pública por conveniência administrativa.
- Caso o e-mail seja alterado no Supabase Auth, o valor deverá ser sincronizado.

---

# RESPONSAVEIS

Representa a pessoa responsável ou contato principal de uma ou mais empresas.

| Chave | Campo | Tipo |
|---|---|---|
| PK | id | Serial Number |
| NN | nome | Texto Limitado(150) |
|  | cargo | Texto Limitado(100) |
|  | email | Texto Limitado(255) NULL |
|  | telefone | Texto Limitado(20) NULL |
| NN | ativo | true or false |
| NN | created_at | Data com hora |
| NN | updated_at | Data com hora |

### Regras

- Um responsável poderá estar vinculado a uma ou várias empresas.
- Responsáveis utilizados não deverão ser excluídos fisicamente.
- Quando deixarem de ser utilizados, deverão ser desativados.
- Um responsável não poderá ser desativado enquanto estiver vinculado a qualquer empresa ativa.
- Para desativá-lo, todas as empresas ativas vinculadas deverão receber outro responsável ativo na mesma transação.

---

# EMPRESAS

Cada CNPJ será representado por um registro independente.

Matriz e filial também serão registros independentes relacionados por `matriz_id`.

| Chave | Campo | Tipo |
|---|---|---|
| PK | id | Serial Number |
| NN | razao_social | Texto Limitado(200) |
|  | nome_fantasia | Texto Limitado(150) |
| UK | cnpj | VARCHAR(14) |
|  | inscricao_estadual | Texto Limitado(20) NULL |
| NN | telefone | Texto Limitado(20) |
| NN | tipo_estabelecimento | Texto Limitado(10) |
| FK | matriz_id | Chave externa NULL |
| FK / NN | responsavel_id | Chave externa |
| NN | ativa | true or false |
| NN | created_at | Data com hora |
| NN | updated_at | Data com hora |

### tipo_estabelecimento

| Valor |
|---|
| `MATRIZ` |
| `FILIAL` |

### Relacionamentos

`EMPRESAS.matriz_id → EMPRESAS.id`

`EMPRESAS.responsavel_id → RESPONSAVEIS.id`

### Regras

- O CNPJ deve possuir 14 caracteres numéricos.
- O CNPJ deve ser único.
- `inscricao_estadual` poderá ser `NULL`.
- Toda empresa deverá possuir um responsável.
- Toda empresa ativa deverá possuir um responsável ativo.
- A ativação de uma empresa ou a alteração de `responsavel_id` deverá validar que o novo responsável está ativo.
- Empresas com histórico não deverão ser excluídas fisicamente.
- Empresas que deixarem de ser utilizadas deverão ser desativadas.
- Uma empresa não poderá ser desativada enquanto possuir competência com status `ABERTA`, `REABERTA` ou `EM_CONFERENCIA`.

### Matriz

Quando:

`tipo_estabelecimento = MATRIZ`

deverá existir:

`matriz_id = NULL`

### Filial

Quando:

`tipo_estabelecimento = FILIAL`

deverá existir:

`matriz_id != NULL`

Além disso:

- uma filial não poderá apontar para ela mesma;
- `matriz_id` deverá apontar para uma empresa do tipo `MATRIZ`;
- cada filial terá apenas uma matriz;
- uma matriz poderá possuir várias filiais;
- matriz e filial possuem CNPJ próprio;
- matriz e filial poderão possuir responsáveis diferentes;
- matriz e filial poderão possuir categorias diferentes.

---

# CATEGORIAS_FATURAMENTO

As categorias serão globais e compartilhadas entre as empresas.

| Chave | Campo | Tipo |
|---|---|---|
| PK | id | Serial Number |
| NN | nome | Texto Limitado(120) |
|  | descricao | Texto |
| NN | ativa | true or false |
| NN | created_at | Data com hora |
| NN | updated_at | Data com hora |

### Restrição

`UNIQUE (nome)`

### Regras

- As categorias não pertencem diretamente a uma empresa.
- Uma categoria poderá ser utilizada por várias empresas.
- Uma empresa poderá possuir várias categorias.
- Categorias inativas não poderão ser vinculadas a novas empresas.
- Categorias utilizadas não deverão ser excluídas fisicamente.
- Quando deixarem de ser usadas, deverão ser desativadas.
- Uma categoria não poderá ser desativada enquanto participar, por vínculo ou lançamento, de competência ainda não finalizada.

---

# EMPRESA_CATEGORIAS

Define quais categorias estão habilitadas para cada empresa.

| Chave | Campo | Tipo |
|---|---|---|
| PK | id | Serial Number |
| FK / NN | empresa_id | Chave externa |
| FK / NN | categoria_id | Chave externa |
| NN | ativa | true or false |
| NN | created_at | Data com hora |
| NN | updated_at | Data com hora |

### Relacionamentos

`EMPRESA_CATEGORIAS.empresa_id → EMPRESAS.id`

`EMPRESA_CATEGORIAS.categoria_id → CATEGORIAS_FATURAMENTO.id`

### Restrição

`UNIQUE (empresa_id, categoria_id)`

### Regras

- Uma empresa poderá possuir várias categorias.
- Uma categoria poderá ser utilizada por várias empresas.
- A mesma categoria não poderá ser vinculada duas vezes à mesma empresa.
- Somente empresas ativas poderão receber novos vínculos.
- Somente categorias ativas poderão receber novos vínculos.
- O vínculo deverá ser desativado em vez de excluído quando já possuir histórico.
- Um vínculo empresa-categoria não poderá ser desativado enquanto for aplicável ou estiver referenciado em competência ainda não finalizada.

---

# CATEGORIA_CAMPOS

Define os campos de lançamento pertencentes a cada categoria.

Cada categoria deverá possuir **entre um e dois campos ativos**.

| Chave | Campo | Tipo |
|---|---|---|
| PK | id | Serial Number |
| FK / NN | categoria_id | Chave externa |
| NN | nome | Texto Limitado(120) |
| NN | ordem | Número Inteiro |
| NN | ativo | true or false |
| NN | created_at | Data com hora |
| NN | updated_at | Data com hora |

### Relacionamento

`CATEGORIA_CAMPOS.categoria_id → CATEGORIAS_FATURAMENTO.id`

### Restrições

`UNIQUE (categoria_id, ordem) WHERE ativo = true`

`ordem IN (1, 2)`

### Regras

- Uma categoria deverá possuir no mínimo um e no máximo dois campos ativos.
- A validação de quantidade e a unicidade de `ordem` considerarão somente os campos ativos; campos inativos não contarão para esse limite.
- Os campos serão identificados por `ordem = 1` e `ordem = 2`.
- O nome será definido no cadastro da categoria.
- Um campo inativo poderá receber correções cadastrais mesmo permanecendo inativo.
- Nome e ordem usados por competências existentes serão preservados na fotografia imutável da competência. Assim, uma correção cadastral não mudará a interpretação dos lançamentos históricos.
- Se um campo inativo for reativado, deverão ser validados novamente o limite de dois campos ativos e a unicidade de `ordem` entre os campos ativos da categoria.
- Um campo inativo não poderá receber novos lançamentos.
- Campos utilizados historicamente não deverão ser excluídos fisicamente.
- Um campo não poderá ser desativado enquanto for aplicável ou possuir lançamento em competência ainda não finalizada.

### Exemplo

Categoria:

`COMERCIO`

| Ordem | Nome |
|---:|---|
| 1 | Vendas sem ST |
| 2 | Vendas com ST |

Uma categoria também poderá possuir somente:

| Ordem | Nome |
|---:|---|
| 1 | Faturamento do mês |

---

# COMPETENCIAS

Representa uma empresa em determinado mês e ano.

| Chave | Campo | Tipo |
|---|---|---|
| PK | id | Serial Number |
| FK / NN | empresa_id | Chave externa |
| NN | ano | Número Inteiro |
| NN | mes | Número Inteiro |
| NN | status | Texto Limitado(30) |
| NN | sem_movimento | true or false |
|  | sem_movimento_em | Data com hora NULL |
| FK | sem_movimento_por | UUID NULL |
| NN | created_at | Data com hora |
| NN | updated_at | Data com hora |

### Relacionamentos

`COMPETENCIAS.empresa_id → EMPRESAS.id`

`COMPETENCIAS.sem_movimento_por → USUARIOS.id`

### Restrição

`UNIQUE (empresa_id, ano, mes)`

### status_competencia

| Valor |
|---|
| `ABERTA` |
| `EM_CONFERENCIA` |
| `REABERTA` |
| `FINALIZADA` |

### Regras

- Cada empresa poderá possuir apenas uma competência para cada mês e ano.
- `mes` deverá estar entre `1` e `12`.
- Uma empresa inativa não deverá receber novas competências.
- Os dados de categorias e resumo financeiro serão vinculados à competência.
- A criação da competência deverá gerar uma fotografia imutável das categorias, vínculos e campos aplicáveis naquele momento.
- Toda competência deverá ser criada com `status = ABERTA`.
- Enquanto estiver `ABERTA`, o preenchimento poderá ocorrer gradualmente.
- Preenchimento parcial significa que nem todos os campos aplicáveis precisam ter sido lançados ainda; não significa permitir lançamentos incompletos no banco.
- Cada lançamento salvo deverá estar individualmente completo e válido.
- A conclusão do preenchimento corresponde à transição `ABERTA → EM_CONFERENCIA`.
- Uma competência somente poderá entrar em `EM_CONFERENCIA` depois de passar por todas as validações de conclusão.
- Uma competência `EM_CONFERENCIA` poderá ser finalizada ou reaberta para correção.
- Uma competência `REABERTA` deverá retornar para `EM_CONFERENCIA` antes de ser finalizada.
- Uma competência `FINALIZADA` será somente para consulta enquanto permanecer nesse status. Uma correção posterior exigirá reabertura excepcional e auditada.

### Bloqueio durante a conferência

Uma competência com `status = EM_CONFERENCIA` ficará congelada para alterações de dados e configurações que afetem sua apuração.

Em `EM_CONFERENCIA`, será permitido somente:

- consultar a competência, seus lançamentos, operações e resumo financeiro;
- alterar o status para `REABERTA`, quando houver correção necessária;
- alterar o status para `FINALIZADA`, quando a conferência estiver aprovada.

Em `EM_CONFERENCIA`, será explicitamente proibido:

- criar lançamento;
- cancelar lançamento;
- substituir lançamento;
- alterar ou excluir lançamento;
- criar ou alterar o resumo financeiro;
- marcar ou desmarcar `sem_movimento`;
- alterar `sem_movimento_em` ou `sem_movimento_por`;
- alterar empresa, ano ou mês da competência;
- alterar ou excluir qualquer item de `COMPETENCIA_CAMPOS_APLICAVEIS`;
- alterar os nomes ou ordens preservados na fotografia da competência;
- realizar qualquer outra alteração que modifique a completude, os valores ou os cálculos conferidos.

Alterações nos cadastros mestres de categoria, vínculo ou campo não modificarão a competência, pois sua fotografia é imutável. Essas alterações continuarão sujeitas às demais travas de desativação e somente afetarão competências futuras.

Se qualquer correção for necessária, o fluxo obrigatório será:

```text
EM_CONFERENCIA
       ↓
REABERTA
       ↓
REALIZA CORREÇÕES
       ↓
EM_CONFERENCIA
```

Não será permitido corrigir os dados e reabrir posteriormente. A transição para `REABERTA` deverá ocorrer antes de qualquer alteração.

Essas travas deverão ser aplicadas no banco ou backend, inclusive para operações realizadas fora da interface principal.

### Regra de ausência por status

```text
ABERTA ou REABERTA
→ ausência parcial permitida

EM_CONFERENCIA ou FINALIZADA
→ ausência permitida somente quando sem_movimento = true
```

Enquanto a competência estiver `ABERTA` ou `REABERTA`, poderão faltar temporariamente lançamentos dos campos registrados em sua fotografia e campos do resumo financeiro.

Quando estiver `EM_CONFERENCIA` ou `FINALIZADA`:

- se `sem_movimento = false`, todos os campos registrados na fotografia da competência deverão possuir lançamento `ATIVO` e todos os campos do resumo financeiro deverão estar preenchidos;
- se `sem_movimento = true`, a ausência de lançamentos será permitida, não poderá existir nenhum lançamento `ATIVO` e todos os campos do resumo financeiro ainda deverão estar preenchidos;
- não será permitido manter uma competência parcialmente preenchida nesses status.

Essa regra deverá ser validada tanto na entrada em `EM_CONFERENCIA` quanto em qualquer operação que possa alterar a completude da competência.

### Fluxo de status

As únicas transições permitidas serão:

```text
ABERTA → EM_CONFERENCIA
EM_CONFERENCIA → REABERTA
REABERTA → EM_CONFERENCIA
EM_CONFERENCIA → FINALIZADA
FINALIZADA → REABERTA (excepcional)
```

Não será permitido pular etapas, incluindo:

```text
ABERTA → FINALIZADA
REABERTA → FINALIZADA
FINALIZADA → ABERTA
FINALIZADA → EM_CONFERENCIA
```

### Reabertura excepcional após finalização

A transição `FINALIZADA → REABERTA` será permitida somente para corrigir erro descoberto depois da finalização.

Essa operação exigirá obrigatoriamente:

- usuário autenticado e ativo;
- `USUARIOS.pode_reabrir_competencia_finalizada = true`, representando a permissão `REABRIR_COMPETENCIA_FINALIZADA`;
- justificativa detalhada e não vazia;
- registro do status anterior e do novo status;
- registro do usuário responsável;
- registro da data e hora;
- execução por operação controlada no backend ou função PostgreSQL/RPC.

Antes da reabertura, o sistema deverá validar que:

- a empresa está ativa;
- o usuário que realiza a reabertura está ativo e possui a permissão exigida;
- a fotografia de categorias, vínculos e campos da competência permanece íntegra;
- os relacionamentos históricos continuam íntegros;
- não existe outra operação de mudança de status concorrente.

Usuários criadores históricos, categorias, vínculos e campos registrados na fotografia não precisarão continuar ativos. Eles precisarão continuar existindo e não poderão ter sido excluídos fisicamente.

Depois da transição para `REABERTA`, aplicam-se novamente todas as regras desse status:

- correções poderão ser realizadas;
- ausência parcial será temporariamente permitida;
- a competência deverá retornar para `EM_CONFERENCIA`;
- uma nova conferência será obrigatória;
- somente depois da nova conferência poderá ocorrer outra finalização.

A reabertura não apagará nem substituirá o registro da finalização anterior. Cada ciclo ficará preservado no histórico.

### Validações para concluir o preenchimento

Antes da transição `ABERTA → EM_CONFERENCIA` ou `REABERTA → EM_CONFERENCIA`, o sistema deverá validar explicitamente que:

- a empresa da competência está ativa;
- a competência possui ano e mês válidos;
- o usuário que solicita a transição está autenticado e ativo;
- se `sem_movimento = false`, cada campo registrado na fotografia da competência possui lançamento `ATIVO`;
- todo lançamento ativo possui competência, item da fotografia, valor, percentual de imposto, usuário criador, status e data de criação;
- o usuário criador de cada lançamento histórico continua existindo, sem exigência de permanecer ativo;
- todo lançamento referencia um campo da fotografia pertencente à própria competência;
- o resumo financeiro existe e todos os seus campos estão preenchidos: `valor_das`, `caixa_inicial`, `caixa_final`, `despesas`, `estoque_inicial`, `estoque_final`, `prolabore` e `divisao_lucros`;
- não existe inconsistência entre `sem_movimento` e os lançamentos ativos.

Quando `sem_movimento = true`, será dispensada somente a existência de lançamentos de faturamento. O resumo financeiro completo continuará obrigatório, e não poderá existir lançamento `ATIVO`.

Se qualquer validação falhar, a transição deverá ser rejeitada integralmente, a competência deverá permanecer no status atual e o sistema deverá informar as pendências encontradas.

### Sem movimento

Quando:

`sem_movimento = true`

deverá existir:

- nenhum lançamento `ATIVO` para a competência;
- `sem_movimento_em != NULL`;
- `sem_movimento_por != NULL`.

Quando:

`sem_movimento = false`

deverá existir:

- `sem_movimento_em = NULL`;
- `sem_movimento_por = NULL`.

Se uma competência marcada como sem movimento receber posteriormente um lançamento válido:

- `sem_movimento` deverá voltar para `false`;
- `sem_movimento_em` deverá voltar para `NULL`;
- `sem_movimento_por` deverá voltar para `NULL`.

Marcar, desmarcar ou alterar os dados de `sem_movimento` será permitido somente quando a competência estiver `ABERTA` ou `REABERTA`. Em `EM_CONFERENCIA` ou `FINALIZADA`, esses campos serão imutáveis.

A finalidade de `sem_movimento` é indicar **ausência de movimento de faturamento**, e não ausência de toda informação financeira. Ela diferencia:

- empresa sem faturamento no mês;
- competência ainda não preenchida.

Mesmo sem faturamento, a empresa poderá possuir despesas, estoque, pró-labore e saldos de caixa. Por isso, o resumo financeiro continuará obrigatório para entrar em `EM_CONFERENCIA` e para permanecer `FINALIZADA`.

---

# COMPETENCIA_CAMPOS_APLICAVEIS

Registra a fotografia imutável das categorias e dos campos aplicáveis quando a competência é criada.

| Chave | Campo | Tipo |
|---|---|---|
| PK | id | Serial Number |
| FK / NN | competencia_id | Chave externa |
| FK / NN | empresa_categoria_id | Chave externa |
| FK / NN | categoria_campo_id | Chave externa |
| NN | categoria_nome_snapshot | Texto Limitado(120) |
| NN | campo_nome_snapshot | Texto Limitado(120) |
| NN | campo_ordem_snapshot | Número Inteiro |
| NN | created_at | Data com hora |

### Relacionamentos

`COMPETENCIA_CAMPOS_APLICAVEIS.competencia_id → COMPETENCIAS.id`

`COMPETENCIA_CAMPOS_APLICAVEIS.empresa_categoria_id → EMPRESA_CATEGORIAS.id`

`COMPETENCIA_CAMPOS_APLICAVEIS.categoria_campo_id → CATEGORIA_CAMPOS.id`

### Restrição

`UNIQUE (competencia_id, categoria_campo_id)`

### Regras

- A fotografia será criada na mesma transação que cria a competência.
- Serão copiados todos os vínculos empresa-categoria ativos e seus campos ativos naquele momento.
- Os registros da fotografia nunca poderão ser editados nem excluídos.
- Ativar, desativar, adicionar, renomear ou reordenar campos depois disso não alterará competências já existentes.
- Mudanças cadastrais serão aplicadas somente às competências criadas posteriormente.
- Uma competência reaberta reutilizará exatamente a fotografia criada originalmente.
- Os nomes e a ordem copiados preservarão a interpretação histórica mesmo que o cadastro mestre seja corrigido depois.
- A existência da fotografia não torna um campo inativo disponível para novos lançamentos comuns. O uso de campo inativo será permitido exclusivamente na substituição controlada de um lançamento histórico que já referencie esse mesmo item da fotografia.

---

# HISTORICO_COMPETENCIAS

Registra de forma imutável todas as mudanças de status das competências, incluindo finalizações e reaberturas excepcionais.

| Chave | Campo | Tipo |
|---|---|---|
| PK | id | Serial Number |
| FK / NN | competencia_id | Chave externa |
| NN | status_anterior | Texto Limitado(30) |
| NN | status_novo | Texto Limitado(30) |
| FK / NN | realizada_por_usuario_id | UUID |
|  | justificativa | Texto NULL |
| NN | created_at | Data com hora |

### Relacionamentos

`HISTORICO_COMPETENCIAS.competencia_id → COMPETENCIAS.id`

`HISTORICO_COMPETENCIAS.realizada_por_usuario_id → USUARIOS.id`

### Regras

- toda mudança de status deverá criar exatamente um registro;
- os status anterior e novo deverão corresponder à transição realmente executada;
- `status_anterior` deverá ser diferente de `status_novo`;
- a justificativa será obrigatória para `EM_CONFERENCIA → REABERTA` e `FINALIZADA → REABERTA`;
- a justificativa não poderá ser vazia ou composta somente por espaços quando obrigatória;
- registros do histórico não poderão ser alterados ou excluídos;
- mudança de status e criação do histórico deverão ocorrer na mesma transação;
- falha ao registrar o histórico deverá cancelar a mudança de status;
- a reabertura de competência finalizada deverá registrar também que a permissão especial foi validada pela operação controlada.

---

# LANCAMENTOS_CATEGORIA

Armazena os valores mensais informados para cada campo de categoria.

Cada linha representa um campo específico dentro de uma competência.

| Chave | Campo | Tipo |
|---|---|---|
| PK | id | Serial Number |
| FK / NN | competencia_id | Chave externa |
| FK / NN | competencia_campo_aplicavel_id | Chave externa |
| NN | valor | Número Decimal(14,2) |
| NN | percentual_imposto | NUMERIC(7,4) |
| FK / NN | criado_por_usuario_id | UUID |
| NN | status | Texto Limitado(15) |
| NN | created_at | Data com hora |

### Relacionamentos

`LANCAMENTOS_CATEGORIA.competencia_id → COMPETENCIAS.id`

`LANCAMENTOS_CATEGORIA.competencia_campo_aplicavel_id → COMPETENCIA_CAMPOS_APLICAVEIS.id`

`LANCAMENTOS_CATEGORIA.criado_por_usuario_id → USUARIOS.id`

### status_lancamento

| Valor |
|---|
| `ATIVO` |
| `CANCELADO` |

### Regra de quantidade

Cada campo poderá possuir somente um lançamento `ATIVO` por competência.

Todo lançamento deverá guardar `competencia_campo_aplicavel_id`, identificando exatamente o vínculo, a categoria, o campo, o nome e a ordem preservados na fotografia da competência.

No momento da criação do lançamento, deverá ser validado que:

- a empresa da competência está ativa;
- a categoria global está ativa;
- o usuário indicado por `criado_por_usuario_id` está ativo;
- a competência está com status `ABERTA` ou `REABERTA`;
- o item da fotografia pertence à mesma competência;
- para um lançamento comum, a categoria, o vínculo empresa-categoria e o campo de origem do item permanecem ativos.

Essas condições são travas obrigatórias. A criação deverá ser rejeitada integralmente se qualquer uma delas não for atendida. As validações deverão existir no banco ou no backend e não poderão depender apenas do frontend.

A restrição deverá ser implementada conceitualmente como:

```sql
UNIQUE (competencia_campo_aplicavel_id)
WHERE status = 'ATIVO'
```

Poderão existir vários registros físicos para o mesmo campo somente quando fizerem parte da cadeia histórica de substituições.

### Exemplo

| ID | Competência | Campo | Valor | Status |
|---:|---|---|---:|---|
| 100 | 08/2026 | Vendas sem ST | R$ 30.000 | CANCELADO |
| 104 | 08/2026 | Vendas sem ST | R$ 28.500 | ATIVO |

---

# REGRA DE IMUTABILIDADE DOS LANCAMENTOS

Um lançamento nunca poderá ser editado depois de criado.

Os seguintes campos são imutáveis:

| Campo |
|---|
| competencia_id |
| competencia_campo_aplicavel_id |
| valor |
| percentual_imposto |
| criado_por_usuario_id |
| created_at |

A única alteração permitida no registro existente será sua passagem:

`ATIVO → CANCELADO`

O tipo da operação, o motivo, o usuário responsável, a data/hora e o eventual substituto serão registrados em `OPERACOES_LANCAMENTO`.

Nenhuma correção poderá sobrescrever os dados originais.

---

# OPERACOES_LANCAMENTO

Registra o histórico de cancelamentos e substituições sem misturar os dados da operação com os valores originais do lançamento.

| Chave | Campo | Tipo |
|---|---|---|
| PK | id | Serial Number |
| FK / UK / NN | lancamento_original_id | Chave externa |
| NN | tipo_operacao | Texto Limitado(20) |
| FK / UK | lancamento_substituto_id | Chave externa NULL |
| NN | motivo | Texto |
| FK / NN | realizada_por_usuario_id | UUID |
| NN | created_at | Data com hora |

### Relacionamentos

`OPERACOES_LANCAMENTO.lancamento_original_id → LANCAMENTOS_CATEGORIA.id`

`OPERACOES_LANCAMENTO.lancamento_substituto_id → LANCAMENTOS_CATEGORIA.id`

`OPERACOES_LANCAMENTO.realizada_por_usuario_id → USUARIOS.id`

### tipo_operacao

| Valor | Resultado |
|---|---|
| `CANCELAMENTO` | cancela o lançamento sem criar substituto |
| `SUBSTITUICAO` | cancela o original e cria um substituto ativo |

### Coerência dos campos

Quando `tipo_operacao = CANCELAMENTO`:

```text
lancamento_substituto_id = NULL
```

Quando `tipo_operacao = SUBSTITUICAO`:

```text
lancamento_substituto_id != NULL
```

O motivo e o usuário responsável serão obrigatórios nos dois tipos de operação.

---

# REGRA DE CANCELAMENTO

O cancelamento isolado será permitido para retirar um lançamento incorreto sem criar outro imediatamente.

Dados obrigatórios:

- `lancamento_original_id`;
- `motivo` não vazio;
- `realizada_por_usuario_id` apontando para usuário ativo.

Regras:

- o lançamento original deverá existir e estar `ATIVO` no início da operação;
- a competência deverá estar `ABERTA` ou `REABERTA`;
- o original deverá passar de `ATIVO` para `CANCELADO`;
- deverá ser criado exatamente um registro em `OPERACOES_LANCAMENTO` com `tipo_operacao = CANCELAMENTO`;
- `lancamento_substituto_id` deverá permanecer `NULL`;
- o lançamento cancelado nunca poderá voltar para `ATIVO`;
- um lançamento já cancelado não poderá receber nova operação diretamente;
- o cancelamento poderá deixar o campo temporariamente sem lançamento ativo somente em competência `ABERTA` ou `REABERTA`;
- a competência não poderá entrar em `EM_CONFERENCIA` enquanto continuar incompleta, salvo quando `sem_movimento = true` e não existir nenhum lançamento ativo.

---

# REGRA DE SUBSTITUICAO

A substituição cancela um lançamento e cria seu sucessor na mesma operação.

Para solicitar a substituição, deverão ser informados:

- `lancamento_original_id`;
- `novo_valor`;
- `novo_percentual_imposto`;
- `motivo` não vazio;
- `realizada_por_usuario_id` apontando para usuário ativo.

O substituto receberá obrigatoriamente:

| Campo | Valor obrigatório |
|---|---|
| `competencia_id` | mesmo valor do original |
| `competencia_campo_aplicavel_id` | mesmo valor do original |
| `valor` | `novo_valor` |
| `percentual_imposto` | `novo_percentual_imposto` |
| `criado_por_usuario_id` | usuário responsável pela operação |
| `status` | `ATIVO` |
| `created_at` | data e hora da operação |

Regras:

- o original deverá existir e estar `ATIVO` no início da operação;
- a competência deverá estar `ABERTA` ou `REABERTA`;
- o original deverá passar para `CANCELADO`;
- o substituto deverá nascer `ATIVO`;
- original e substituto não poderão possuir o mesmo identificador;
- o mesmo `competencia_id` força mesma empresa, mesmo mês e mesmo ano;
- o mesmo `competencia_campo_aplicavel_id` força o mesmo vínculo, categoria, campo, nome histórico e ordem histórica;
- a substituição nunca poderá transferir um lançamento para outro mês, categoria ou campo;
- a empresa e o usuário responsável pela operação deverão estar ativos;
- a categoria, o vínculo e o campo históricos precisarão continuar existindo, mas poderão estar inativos;
- a permissão para reutilizar um campo inativo será exclusiva da operação controlada de substituição e não permitirá lançamentos comuns nesse campo;
- `novo_valor >= 0`;
- `novo_percentual_imposto BETWEEN 0 AND 100`;
- deverá ser criado exatamente um registro em `OPERACOES_LANCAMENTO` com `tipo_operacao = SUBSTITUICAO` e o identificador do novo lançamento;
- cada lançamento original poderá possuir somente uma operação direta;
- cada lançamento substituto poderá aparecer como substituto somente uma vez;
- a cadeia de substituições deverá ser linear e sem ramificações.

### Cadeia válida

```text
100 CANCELADO
      ↓ operação SUBSTITUICAO
104 CANCELADO
      ↓ operação SUBSTITUICAO
110 ATIVO
```

---

# OPERACOES ATOMICAS

Cancelamento e substituição deverão ser executados por função PostgreSQL/RPC transacional ou por backend que garanta uma única transação de banco.

No cancelamento:

```text
OU
o lançamento é cancelado e a operação é registrada

OU
nenhuma alteração é persistida
```

Na substituição:

```text
OU
o original é cancelado, o substituto é criado e a operação é registrada

OU
nenhuma alteração é persistida
```

O lançamento original deverá ser bloqueado durante a transação para impedir operações concorrentes.

---

# REGRAS DE VALOR E PERCENTUAL

### Valor

O valor deverá respeitar:

```text
valor >= 0
```

O valor `0` é válido e representa um total efetivamente informado como zero. Ele não significa ausência de preenchimento nem competência sem movimento.

Em `ABERTA` ou `REABERTA`, a ausência parcial de lançamentos será válida durante o preenchimento, independentemente de `sem_movimento`, sem permitir que um lançamento individual seja salvo incompleto.

Em `EM_CONFERENCIA` ou `FINALIZADA`, quando `sem_movimento = false`, cada campo da fotografia da competência deverá possuir um lançamento `ATIVO`, ainda que seu valor seja `0`.

Somente em `EM_CONFERENCIA` ou `FINALIZADA` a ausência total de lançamentos exigirá `sem_movimento = true`. Nesse caso, não deverá existir lançamento `ATIVO` para a competência.

### Percentual de imposto

O percentual será armazenado como:

```text
NUMERIC(7,4)
```

Isso permite representar valores como:

```text
4
4.5
7.25
12.3456
100
```

sem utilizar ponto flutuante.

A validação deverá ser:

```text
percentual_imposto >= 0
percentual_imposto <= 100
```

O objetivo é evitar problemas de arredondamento na representação do percentual.

---

# REGRAS DE SINAL DOS CAMPOS NUMERICOS

Os campos monetários serão informados de acordo com sua natureza de negócio. Valores que representam montantes, despesas, estoques, tributos ou distribuições deverão ser armazenados como números não negativos. O sinal não deverá ser usado para alterar o significado do campo.

## Campos que aceitam zero ou valor positivo

Os seguintes campos deverão respeitar `valor >= 0`:

| Tabela | Campo | Regra |
|---|---|---|
| `LANCAMENTOS_CATEGORIA` | `valor` | zero ou positivo |
| `RESUMO_FINANCEIRO` | `valor_das` | zero ou positivo |
| `RESUMO_FINANCEIRO` | `despesas` | zero ou positivo |
| `RESUMO_FINANCEIRO` | `estoque_inicial` | zero ou positivo |
| `RESUMO_FINANCEIRO` | `estoque_final` | zero ou positivo |
| `RESUMO_FINANCEIRO` | `prolabore` | zero ou positivo |
| `RESUMO_FINANCEIRO` | `divisao_lucros` | zero ou positivo |

Regras conceituais:

- despesas deverão ser informadas como valor positivo; o sistema entenderá sua natureza como saída;
- pró-labore deverá ser informado como valor positivo;
- divisão de lucros deverá ser informada como valor positivo;
- prejuízo não deverá ser registrado como `divisao_lucros` negativa;
- ausência de valor durante o preenchimento parcial será representada por `NULL`, não por número negativo;
- ao concluir a competência, esses campos não poderão permanecer `NULL`, mas poderão possuir valor `0`.

## Campos que podem ser negativos

Somente os campos abaixo poderão receber valores menores que zero:

| Tabela | Campo | Regra |
|---|---|---|
| `RESUMO_FINANCEIRO` | `caixa_inicial` | negativo, zero ou positivo |
| `RESUMO_FINANCEIRO` | `caixa_final` | negativo, zero ou positivo |

Valores negativos nesses campos representarão saldo devedor, caixa descoberto ou posição financeira negativa. Eles não deverão ser rejeitados pelas restrições do banco.

## Percentual de imposto

O campo `LANCAMENTOS_CATEGORIA.percentual_imposto` não poderá ser negativo e deverá permanecer no intervalo:

```text
0 <= percentual_imposto <= 100
```

## Travas explícitas

O banco deverá possuir restrições equivalentes a:

```sql
check (valor >= 0)
check (percentual_imposto between 0 and 100)
check (valor_das >= 0)
check (despesas >= 0)
check (estoque_inicial >= 0)
check (estoque_final >= 0)
check (prolabore >= 0)
check (divisao_lucros >= 0)
```

Como os campos do resumo podem ser `NULL` durante o preenchimento parcial, essas restrições aceitarão `NULL` até a conclusão. A operação de conclusão será responsável por exigir que todos estejam preenchidos.

Não será criada restrição de sinal para `caixa_inicial` e `caixa_final`.

---

# RESUMO_FINANCEIRO

Armazena as informações financeiras gerais da competência.

Existe no máximo um resumo financeiro por competência.

| Chave | Campo | Tipo |
|---|---|---|
| PK | id | Serial Number |
| FK / UK / NN | competencia_id | Chave externa |
|  | valor_das | Número Decimal(14,2) NULL |
|  | caixa_inicial | Número Decimal(14,2) NULL |
|  | caixa_final | Número Decimal(14,2) NULL |
|  | despesas | Número Decimal(14,2) NULL |
|  | estoque_inicial | Número Decimal(14,2) NULL |
|  | estoque_final | Número Decimal(14,2) NULL |
|  | prolabore | Número Decimal(14,2) NULL |
|  | divisao_lucros | Número Decimal(14,2) NULL |
| FK / NN | criado_por_usuario_id | UUID |
| FK / NN | atualizado_por_usuario_id | UUID |
| NN | created_at | Data com hora |
| NN | updated_at | Data com hora |

### Relacionamentos

`RESUMO_FINANCEIRO.competencia_id → COMPETENCIAS.id`

`RESUMO_FINANCEIRO.criado_por_usuario_id → USUARIOS.id`

`RESUMO_FINANCEIRO.atualizado_por_usuario_id → USUARIOS.id`

### Restrição

`UNIQUE (competencia_id)`

### Regras

- Cada competência poderá possuir apenas um resumo financeiro.
- Os campos financeiros poderão ser `NULL` inicialmente.
- Isso permitirá preenchimento parcial durante o MVP.
- Enquanto a competência estiver `ABERTA` ou `REABERTA`, os campos poderão ser preenchidos gradualmente.
- Para concluir o preenchimento e entrar em `EM_CONFERENCIA`, todos os campos do resumo deverão estar preenchidos: `valor_das`, `caixa_inicial`, `caixa_final`, `despesas`, `estoque_inicial`, `estoque_final`, `prolabore` e `divisao_lucros`.
- A conclusão deverá ser bloqueada quando qualquer um desses campos estiver `NULL`.
- O resumo financeiro somente poderá ser criado ou alterado quando a competência estiver `ABERTA` ou `REABERTA`.
- O usuário que cria ou altera o resumo deverá estar ativo no momento da operação.
- `atualizado_por_usuario_id` identificará o autor da versão atual.
- Cada criação ou alteração deverá gerar uma versão imutável em `HISTORICO_RESUMO_FINANCEIRO` na mesma transação.
- Em `EM_CONFERENCIA` ou `FINALIZADA`, o resumo financeiro será imutável.
- Os valores serão armazenados em `NUMERIC(14,2)`.
- `caixa_inicial` e `caixa_final` poderão ser negativos, representando saldo devedor ou descoberto.
- `valor_das`, `despesas`, `estoque_inicial`, `estoque_final`, `prolabore` e `divisao_lucros` deverão ser maiores ou iguais a zero.
- Os campos não representam lançamentos individuais.
- O resumo representa a situação financeira consolidada do mês.

---

# HISTORICO_RESUMO_FINANCEIRO

Preserva uma fotografia imutável do resumo financeiro após sua criação e depois de cada alteração.

| Chave | Campo | Tipo |
|---|---|---|
| PK | id | Serial Number |
| FK / NN | resumo_financeiro_id | Chave externa |
| FK / NN | competencia_id | Chave externa |
| NN | versao | Número Inteiro |
|  | valor_das | Número Decimal(14,2) NULL |
|  | caixa_inicial | Número Decimal(14,2) NULL |
|  | caixa_final | Número Decimal(14,2) NULL |
|  | despesas | Número Decimal(14,2) NULL |
|  | estoque_inicial | Número Decimal(14,2) NULL |
|  | estoque_final | Número Decimal(14,2) NULL |
|  | prolabore | Número Decimal(14,2) NULL |
|  | divisao_lucros | Número Decimal(14,2) NULL |
| FK / NN | registrada_por_usuario_id | UUID |
| NN | created_at | Data com hora |

### Relacionamentos

`HISTORICO_RESUMO_FINANCEIRO.resumo_financeiro_id → RESUMO_FINANCEIRO.id`

`HISTORICO_RESUMO_FINANCEIRO.competencia_id → COMPETENCIAS.id`

`HISTORICO_RESUMO_FINANCEIRO.registrada_por_usuario_id → USUARIOS.id`

### Restrições

- `UNIQUE (resumo_financeiro_id, versao)`;
- `versao >= 1`;
- registros de histórico não poderão ser editados nem excluídos.

### Regras

- A primeira gravação do resumo criará a versão `1`.
- Cada alteração criará a próxima versão com todos os valores resultantes, inclusive os ainda `NULL` durante o preenchimento parcial.
- A atualização do resumo e a criação de sua versão histórica ocorrerão na mesma transação.
- `registrada_por_usuario_id` deverá apontar para o usuário ativo que realizou a operação naquele momento.
- Usuários de versões históricas precisarão continuar existindo, mas não precisarão continuar ativos.

---

# TOTAL DO MES

Os totais do mês não serão armazenados fisicamente. Eles serão calculados a partir dos lançamentos `ATIVO` pertencentes à competência e sempre serão apresentados com uma classificação explícita.

## Total provisório

`total_provisorio_mes` representa o valor disponível durante o andamento do trabalho. Ele considera competências em qualquer um destes estados:

- `ABERTA`;
- `REABERTA`;
- `EM_CONFERENCIA`;
- `FINALIZADA`.

Conceitualmente:

```text
TOTAL_PROVISORIO_MES =
SUM(LANCAMENTOS_CATEGORIA.valor)
WHERE LANCAMENTOS_CATEGORIA.status = 'ATIVO'
  AND COMPETENCIAS.status IN (
      'ABERTA',
      'REABERTA',
      'EM_CONFERENCIA',
      'FINALIZADA'
  )
```

Como uma competência `ABERTA` ou `REABERTA` pode estar parcialmente preenchida, esse total poderá mudar e nunca deverá ser apresentado como valor oficial.

## Total oficial

`total_oficial_mes` considera somente competências `FINALIZADA`:

```sql
CASE
    WHEN COMPETENCIAS.status = 'FINALIZADA'
    THEN COALESCE(
        SUM(LANCAMENTOS_CATEGORIA.valor)
        FILTER (WHERE LANCAMENTOS_CATEGORIA.status = 'ATIVO'),
        0
    )
    ELSE NULL
END AS total_oficial_mes
```

O `COALESCE(..., 0)` será aplicado somente depois de confirmar que a competência existe e está `FINALIZADA`. Assim, uma competência finalizada sem movimento terá total oficial `0`, enquanto uma competência inexistente ou ainda não finalizada não terá total oficial e retornará `NULL`.

Se uma competência `FINALIZADA` for excepcionalmente reaberta, seus valores deixarão imediatamente o total oficial e continuarão apenas no total provisório. Eles voltarão ao total oficial somente após uma nova finalização.

### Observação importante

Neste momento, o modelo considera que os campos de uma categoria representam parcelas independentes do faturamento.

Portanto, seus valores são somados para formar o total da categoria e, posteriormente, o total do mês.

Exemplo:

```text
Categoria COMERCIO

Vendas sem ST = R$ 30.000
Vendas com ST = R$ 20.000

Total da categoria = R$ 50.000
```

Essa regra deverá ser reavaliada caso futuramente algum campo tenha natureza diferente e não deva compor diretamente o faturamento.

---

# TOTAL DO ANO

Os totais anuais também não serão armazenados fisicamente. Eles serão calculados a partir das competências da empresa no ano selecionado.

## Total provisório

`total_provisorio_ano` soma os lançamentos `ATIVO` das competências `ABERTA`, `REABERTA`, `EM_CONFERENCIA` e `FINALIZADA`:

```text
TOTAL_PROVISORIO_ANO =
SUM(LANCAMENTOS_CATEGORIA.valor)
WHERE LANCAMENTOS_CATEGORIA.status = 'ATIVO'
  AND COMPETENCIAS.status IN (
      'ABERTA',
      'REABERTA',
      'EM_CONFERENCIA',
      'FINALIZADA'
  )
```

## Total oficial

`total_oficial_ano` soma somente os lançamentos `ATIVO` de competências `FINALIZADA`:

```text
TOTAL_OFICIAL_ANO =
SUM(LANCAMENTOS_CATEGORIA.valor)
WHERE LANCAMENTOS_CATEGORIA.status = 'ATIVO'
  AND COMPETENCIAS.status = 'FINALIZADA'
```

Ambos serão filtrados pelas competências da empresa e pelo ano desejado. O sistema não deverá misturar os dois valores nem chamar o total provisório de faturamento oficial.

Caso a consulta seja feita até determinado mês, o sistema poderá somar de janeiro até o mês selecionado.

---

# CALCULO DO IMPOSTO POR CAMPO

O valor calculado do imposto não será armazenado inicialmente.

Serão persistidos:

- `valor`;
- `percentual_imposto`.

O imposto será calculado:

```text
valor_imposto =
valor * percentual_imposto / 100
```

Como `valor` e `percentual_imposto` utilizam `NUMERIC`, o cálculo deverá permanecer em aritmética decimal no PostgreSQL.

### Exemplo

```text
valor = R$ 30.000,00
percentual_imposto = 7.25

valor_imposto = R$ 2.175,00
```

---

# TRAVA DE DESATIVACAO COM COMPETENCIAS PENDENTES

A desativação de cadastros não poderá invalidar retroativamente uma competência que ainda esteja em processamento.

Para essa regra, será considerada **competência ainda não finalizada** qualquer competência com status:

```text
ABERTA
REABERTA
EM_CONFERENCIA
```

Antes de desativar um cadastro, o banco ou backend deverá verificar se ele participa de alguma competência ainda não finalizada.

## Desativações bloqueadas

| Cadastro | A desativação será bloqueada quando |
|---|---|
| `RESPONSAVEIS` | o responsável estiver vinculado a qualquer empresa ativa e essas empresas não forem transferidas para outro responsável ativo na mesma transação |
| `EMPRESAS` | a empresa possuir qualquer competência ainda não finalizada |
| `CATEGORIAS_FATURAMENTO` | a categoria possuir vínculo aplicável ou lançamento em competência ainda não finalizada |
| `EMPRESA_CATEGORIAS` | o vínculo for aplicável ou estiver referenciado em competência ainda não finalizada |
| `CATEGORIA_CAMPOS` | o campo for aplicável ou possuir lançamento em competência ainda não finalizada |

Para empresas, categorias, vínculos e campos, a desativação somente poderá ocorrer depois que todas as competências dependentes estiverem `FINALIZADA`.

Um usuário poderá ser desativado mesmo que apareça como criador ou responsável em registros históricos de competência não finalizada. Esses registros exigirão apenas que o usuário continue existindo; após a desativação, ele não poderá executar nenhuma nova operação.

## Substituição obrigatória do responsável

Uma empresa ativa nunca poderá ficar vinculada a um responsável inativo.

Quando um responsável estiver vinculado a uma ou mais empresas ativas, sua desativação somente será permitida por uma operação transacional que:

1. informe outro responsável com `ativo = true`;
2. transfira para ele todas as empresas ativas vinculadas ao responsável anterior;
3. valide que nenhuma empresa ativa permaneceu com o responsável anterior;
4. desative o responsável anterior;
5. confirme todas as alterações de forma atômica.

Se qualquer etapa falhar, toda a operação deverá ser desfeita. Não será permitido desativar primeiro e substituir depois.

Empresas inativas poderão continuar vinculadas ao responsável inativo para preservar o cadastro existente, mas deverão receber um responsável ativo antes de serem reativadas.

## Resultado esperado

```text
existe competência dependente não finalizada
→ desativação rejeitada

todas as competências dependentes estão FINALIZADA
→ desativação permitida
```

A rejeição deverá informar quais competências impedem a desativação, incluindo empresa, mês, ano e status.

## Travas explícitas

- a validação deverá ocorrer na mesma transação da desativação;
- não será suficiente ocultar o botão no frontend;
- atualizações diretas que alterem `ativo` ou `ativa` de `true` para `false` também deverão ser bloqueadas;
- atualizações diretas não poderão deixar `EMPRESAS.ativa = true` apontando para `RESPONSAVEIS.ativo = false`;
- a regra deverá ser implementada por função/trigger PostgreSQL ou por operação transacional do backend;
- competências já `FINALIZADA` preservarão seu histórico mesmo após a desativação posterior dos cadastros;
- a desativação não poderá alterar lançamentos, operações ou resumos históricos.

Essa trava garante que os registros necessários permaneçam ativos durante todo o ciclo da competência, sem permitir que uma desativação posterior impeça sua conferência ou finalização.

---

# SUPABASE AUTH

A autenticação será realizada pelo Supabase Auth.

Relacionamento principal:

```text
auth.users.id
       ↓
public.USUARIOS.id
```

O Supabase Auth será responsável por:

- autenticação;
- senha;
- recuperação de senha;
- sessões;
- tokens JWT.

---

# ROW LEVEL SECURITY — RLS

As tabelas expostas pelo Supabase deverão possuir RLS habilitado.

Regra conceitual inicial:

```text
usuário autenticado
+
existe em public.USUARIOS
+
USUARIOS.ativo = true
→ acesso permitido
```

### Regras mínimas

- Usuários não autenticados não poderão acessar dados internos.
- Usuários com `ativo = false` não poderão operar o sistema.
- A chave `service_role` nunca deverá ser enviada ao frontend.
- Regras importantes de integridade não deverão depender somente do frontend.
- Futuramente, `cargo` poderá ser utilizado para controle mais detalhado de permissões.
- Operações de cancelamento e substituição deverão ser realizadas por função segura/backend.
- Competências em `EM_CONFERENCIA` deverão permanecer congeladas; toda correção exigirá reabertura anterior.

---

# RESTRICOES DE BANCO RECOMENDADAS

## USUARIOS

- `id` referencia `auth.users.id`;
- `email` único;
- `pode_reabrir_competencia_finalizada` obrigatório, com padrão `false`;
- exigir usuário ativo para qualquer nova operação;
- permitir a desativação sem invalidar referências históricas;
- bloquear exclusão física de usuário referenciado historicamente.

## EMPRESAS

- `cnpj` único;
- CNPJ com 14 caracteres numéricos;
- `responsavel_id` obrigatório;
- empresas ativas exigem responsável ativo;
- ativar uma empresa ou substituir `responsavel_id` exige validar o novo responsável ativo;
- `tipo_estabelecimento` apenas `MATRIZ` ou `FILIAL`;
- matriz com `matriz_id = NULL`;
- filial com `matriz_id != NULL`;
- filial não pode apontar para si mesma;
- `matriz_id` deve apontar para uma matriz;
- bloquear desativação quando existir competência não finalizada da empresa.

## RESPONSAVEIS

- bloquear a desativação de responsável vinculado a empresa ativa;
- permitir a desativação somente após transferir todas as empresas ativas para outro responsável ativo na mesma transação;
- impedir que alterações diretas deixem uma empresa ativa vinculada a responsável inativo.

## CATEGORIAS_FATURAMENTO

- `nome` único;
- bloquear desativação quando a categoria participar de competência não finalizada.

## EMPRESA_CATEGORIAS

- `UNIQUE (empresa_id, categoria_id)`;
- bloquear desativação quando o vínculo for aplicável ou estiver referenciado em competência não finalizada.

## CATEGORIA_CAMPOS

- `UNIQUE (categoria_id, ordem) WHERE ativo = true`;
- `ordem IN (1,2)`;
- entre um e dois campos ativos por categoria;
- campos inativos não contam no limite nem na unicidade dos campos ativos;
- campos inativos podem receber correções cadastrais sem alterar os lançamentos históricos;
- bloquear desativação quando o campo for aplicável ou estiver referenciado em competência não finalizada.

## COMPETENCIAS

- `UNIQUE (empresa_id, ano, mes)`;
- `mes BETWEEN 1 AND 12`;
- `status` limitado a `ABERTA`, `EM_CONFERENCIA`, `REABERTA` ou `FINALIZADA`;
- novas competências iniciam obrigatoriamente como `ABERTA`;
- transições de status limitadas ao fluxo definido;
- `FINALIZADA → REABERTA` permitida somente com empresa ativa, operador ativo e autorizado, justificativa obrigatória e fotografia histórica íntegra;
- toda mudança de status registrada atomicamente em `HISTORICO_COMPETENCIAS`;
- preenchimento parcial permitido somente em `ABERTA` ou `REABERTA`;
- campos obrigatórios determinados por fotografia imutável criada com a competência;
- bloquear qualquer alteração de dados da competência em `EM_CONFERENCIA`, exceto transição para `REABERTA` ou `FINALIZADA`;
- bloquear alterações na fotografia de campos da competência em qualquer status;
- em `EM_CONFERENCIA` ou `FINALIZADA`, ausência permitida somente quando `sem_movimento = true`;
- impedir entrada em `EM_CONFERENCIA` quando faltar lançamento de campo da fotografia e `sem_movimento = false`;
- exigir resumo financeiro completo mesmo quando `sem_movimento = true`;
- impedir conclusão quando a empresa estiver inativa;
- `sem_movimento = true` incompatível com existência de lançamento ativo.

## HISTORICO_COMPETENCIAS

- registrar todas as mudanças de status;
- status anterior diferente do novo;
- justificativa obrigatória nas transições para `REABERTA`;
- bloquear edição e exclusão física;
- mudança de status e histórico executados na mesma transação.

## LANCAMENTOS_CATEGORIA

- `valor >= 0`;
- `percentual_imposto BETWEEN 0 AND 100`;
- empresa da competência obrigatoriamente ativa na criação;
- categoria global obrigatoriamente ativa na criação comum;
- usuário criador obrigatoriamente ativo na criação;
- competência obrigatoriamente em `ABERTA` ou `REABERTA` na criação;
- `competencia_campo_aplicavel_id` deve pertencer à fotografia da competência;
- vínculo e campo de origem obrigatoriamente ativos na criação comum;
- ausência parcial de lançamento ativo permitida em competência `ABERTA` ou `REABERTA`;
- em `EM_CONFERENCIA` ou `FINALIZADA`, ausência de lançamento ativo permitida somente quando `sem_movimento = true`;
- apenas um lançamento `ATIVO` por `competencia_campo_aplicavel_id`;
- bloquear edição dos campos imutáveis;
- bloquear exclusão física;

## OPERACOES_LANCAMENTO

- `lancamento_original_id` único;
- `tipo_operacao` limitado a `CANCELAMENTO` ou `SUBSTITUICAO`;
- motivo obrigatório e não vazio;
- usuário responsável obrigatoriamente ativo;
- `CANCELAMENTO` exige `lancamento_substituto_id = NULL`;
- `SUBSTITUICAO` exige `lancamento_substituto_id != NULL`;
- original e substituto devem ser diferentes;
- `lancamento_substituto_id` único quando não for `NULL`;
- operação aceita somente original inicialmente `ATIVO`;
- substituto obrigatoriamente `ATIVO`;
- substituto com o mesmo `competencia_id`, garantindo a mesma empresa, mês e ano;
- substituto com o mesmo `competencia_campo_aplicavel_id`, garantindo o mesmo vínculo, categoria e campo históricos;
- substituição histórica pode reutilizar o item original da fotografia mesmo que categoria, vínculo ou campo estejam inativos;
- cancelamento ou substituição executados atomicamente com o registro da operação;
- bloquear edição e exclusão dos registros de operação.

## RESUMO_FINANCEIRO

- `UNIQUE (competencia_id)`;
- campos financeiros inicialmente opcionais durante o preenchimento;
- `valor_das >= 0`;
- `despesas >= 0`;
- `estoque_inicial >= 0`;
- `estoque_final >= 0`;
- `prolabore >= 0`;
- `divisao_lucros >= 0`;
- `caixa_inicial` e `caixa_final` podem ser negativos, iguais a zero ou positivos.
- criação e alteração permitidas somente em competência `ABERTA` ou `REABERTA`;
- exigir usuário ativo na criação e em cada alteração;
- registrar autor da versão atual e criar versão imutável em `HISTORICO_RESUMO_FINANCEIRO` a cada gravação;
- bloquear alterações em competência `EM_CONFERENCIA` ou `FINALIZADA`.

## COMPETENCIA_CAMPOS_APLICAVEIS

- `UNIQUE (competencia_id, categoria_campo_id)`;
- criada atomicamente com a competência;
- conteúdo imutável;
- preservar nome e ordem históricos da categoria e do campo;
- mudanças cadastrais posteriores não alteram competências existentes.

## HISTORICO_RESUMO_FINANCEIRO

- `UNIQUE (resumo_financeiro_id, versao)`;
- versão iniciada em `1` e incrementada a cada alteração;
- registrar todos os valores resultantes, usuário responsável e data/hora;
- bloquear edição e exclusão física.

Algumas dessas regras exigirão função, trigger PostgreSQL ou validação transacional no backend.

---

# TABELAS DO MVP

O banco será composto por:

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

Além de:

```text
auth.users
```

gerenciada pelo Supabase Auth.

---

# RELACIONAMENTOS PRINCIPAIS

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

A categoria de um lançamento é obtida por:

```text
LANCAMENTOS_CATEGORIA
        ↓
competencia_campo_aplicavel_id
        ↓
COMPETENCIA_CAMPOS_APLICAVEIS
        ↓
empresa_categoria_id / categoria_campo_id
```

O lançamento utiliza a fotografia imutável da competência, evitando que alterações posteriores nos cadastros mudem seu significado histórico.

---

# FLUXO GERAL DO MVP

```text
CADASTRA USUARIO
       ↓
CADASTRA RESPONSAVEL
       ↓
CADASTRA EMPRESA
       ↓
DEFINE MATRIZ / FILIAL
       ↓
VINCULA CATEGORIAS
       ↓
DEFINE 1 OU 2 CAMPOS
POR CATEGORIA
       ↓
CRIA COMPETENCIA
       ↓
SE NÃO HOUVER MOVIMENTO:
MARCA SEM MOVIMENTO
       ↓
OU
       ↓
LANCA UM VALOR
POR CAMPO / MÊS
       ↓
INFORMA %
DE IMPOSTO
       ↓
PREENCHE
RESUMO FINANCEIRO
       ↓
SISTEMA CALCULA
TOTAL PROVISORIO E
TOTAL OFICIAL DO MES
       ↓
SISTEMA CALCULA
TOTAL PROVISORIO E
TOTAL OFICIAL DO ANO
```

Quando houver erro em um lançamento:

```text
LANÇAMENTO ATIVO
       ├── CANCELAMENTO
       │       ↓
       │   CANCELADO SEM SUBSTITUTO
       │
       └── SUBSTITUIÇÃO
               ↓
          ORIGINAL CANCELADO
               +
          NOVO LANÇAMENTO ATIVO
```
    
