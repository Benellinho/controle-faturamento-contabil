# Modelo de Banco — MVP Controle de Faturamento

## Visão geral

Este documento consolida as decisões atuais do MVP para o sistema interno de controle de faturamento do escritório.

### Decisões principais

- O sistema será de uso exclusivamente interno do escritório.
- A autenticação será feita pelo Supabase Auth.
- Todos os usuários cadastrados no sistema serão usuários internos.
- O faturamento será sempre mensal.
- Uma competência poderá possuir vários lançamentos na mesma categoria e no mesmo mês.
- As categorias de faturamento serão globais e poderão ser usadas por todas as empresas.
- Os lançamentos nunca poderão ser editados ou excluídos fisicamente.
- Toda correção será feita obrigatoriamente por cancelamento + substituição.
- Cancelamento e criação do substituto deverão ocorrer de forma atômica: ou os dois acontecem ou nenhum acontece.
- O valor de todo lançamento deverá ser positivo.
- O efeito no total será definido por `tipo_lancamento`: `FATURAMENTO` ou `DEVOLUCAO_ESTORNO`.
- Competências poderão ser marcadas como `sem_movimento`.
- O fluxo de status da competência será fixo e não poderá pular etapas.

---

# EMPRESAS

| Chave | Campo | Tipo |
|---|---|---|
| PK | id | Serial Number |
| NN | razao_social | Texto Limitado(200) |
|  | nome_fantasia | Texto Limitado(150) |
| UK | cnpj | VARCHAR(14) |
| NN | ativa | true or false |
| NN | created_at | Data com hora |
| NN | updated_at | Data com hora |

### Regras

- O CNPJ deve ser armazenado como texto com 14 caracteres, somente números.
- O CNPJ deve ser único.
- Uma empresa inativa não poderá receber novos lançamentos.
- A desativação da empresa não poderá remover dados históricos.
- Empresas com histórico não deverão ser excluídas fisicamente.
- O faturamento será sempre mensal, portanto não haverá mais `modo_lancamento`.

---

# USUARIOS

| Chave | Campo | Tipo |
|---|---|---|
| PK / FK | id | UUID |
| NN | nome | Texto Limitado(150) |
| UK | email | Texto Limitado(255) |
| NN | cargo | Texto Limitado(50) |
| NN | ativo | true or false |
|  | ultimo_login_at | Data com hora NULL |
| NN | created_at | Data com hora |
| NN | updated_at | Data com hora |

### Relacionamento

`USUARIOS.id → auth.users.id`

### Regras

- Todos os usuários serão internos do escritório.
- `USUARIOS.id` referencia diretamente `auth.users.id`.
- Usuários inativos não poderão acessar o sistema.
- O campo `cargo` será mantido para permitir implementação futura de controles de acesso por função.
- No MVP, todos os usuários internos poderão acessar as empresas cadastradas, salvo se forem criadas regras específicas posteriormente.
- Usuários com histórico não deverão ser excluídos fisicamente.
- O Supabase Auth será responsável por autenticação, senha, recuperação de senha e sessão.
- O campo `email` é mantido na tabela pública por conveniência administrativa; se o e-mail for alterado no Auth, deverá ser sincronizado.

---

# CATEGORIAS_FATURAMENTO

As categorias serão globais e compartilhadas entre todas as empresas.

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

- As categorias não pertencem a uma empresa específica.
- Qualquer empresa poderá utilizar qualquer categoria ativa.
- Somente categorias ativas poderão ser utilizadas em novos lançamentos.
- Categorias já utilizadas em lançamentos não deverão ser excluídas fisicamente.
- Para preservar o histórico, uma categoria já utilizada não deverá ter seu significado alterado.
- Se uma categoria deixar de ser utilizada, deverá ser desativada.
- Caso uma classificação nova seja necessária, deverá ser criada uma nova categoria.
- A relação física é `CATEGORIA 1 → N LANCAMENTOS`.
- Uma categoria poderá possuir vários lançamentos ativos na mesma competência.

---

# COMPETENCIAS

Representa o mês de apuração de uma empresa.

| Chave | Campo | Tipo |
|---|---|---|
| PK | id | Serial Number |
| FK | empresa_id | Chave externa |
| NN | ano | Número Inteiro |
| NN | mes | Número Inteiro |
| NN | status | Texto Limitado(30) |
| NN | sem_movimento | true or false |
|  | sem_movimento_em | Data com hora NULL |
| FK | sem_movimento_por | UUID NULL |
|  | conferencia_iniciada_em | Data com hora NULL |
| FK | conferencia_iniciada_por | UUID NULL |
|  | finalizada_em | Data com hora NULL |
| FK | finalizada_por | UUID NULL |
| NN | created_at | Data com hora |
| NN | updated_at | Data com hora |

### Restrição

`UNIQUE (empresa_id, ano, mes)`

### status_competencia

- `ABERTA`
- `EM_CONFERENCIA`
- `REABERTA`
- `FINALIZADA`

### ABERTA

- Usuários do escritório podem registrar lançamentos.
- Uma mesma categoria poderá possuir vários lançamentos no mês.
- Lançamentos já criados não podem ser editados.
- Se houver erro, o lançamento deverá ser cancelado e obrigatoriamente substituído.
- A competência poderá ser marcada como `sem_movimento` quando não existir faturamento no mês.
- Para seguir para conferência, a competência deve possuir ao menos um lançamento ativo ou estar explicitamente marcada como `sem_movimento = true`.

### EM_CONFERENCIA

- Os lançamentos do mês foram concluídos.
- A competência está em revisão/conferência.
- Novos lançamentos, cancelamentos e substituições ficam bloqueados.
- A competência poderá:
  - ser finalizada, se estiver correta;
  - ser reaberta, se houver necessidade de correção.

### REABERTA

- A conferência identificou necessidade de correção.
- A entrada em `REABERTA` exige justificativa.
- Lançamentos incorretos poderão ser cancelados e obrigatoriamente substituídos.
- Novos lançamentos necessários à correção poderão ser criados.
- Após as correções, a competência deverá voltar obrigatoriamente para `EM_CONFERENCIA`.

### FINALIZADA

- O escritório concluiu a conferência/apuração.
- Nenhum lançamento poderá ser criado.
- Nenhum lançamento poderá ser cancelado.
- Nenhum lançamento poderá ser substituído.
- A competência ficará somente para consulta.
- Uma competência `FINALIZADA` não poderá ser reaberta no MVP.

### Regras de sem movimento

Quando `sem_movimento = true`:

- não deverá existir lançamento `ATIVO` na competência;
- `sem_movimento_em` deverá ser obrigatório;
- `sem_movimento_por` deverá ser obrigatório.

Quando `sem_movimento = false`:

- `sem_movimento_em` deverá ser `NULL`;
- `sem_movimento_por` deverá ser `NULL`.

Se a competência marcada como sem movimento receber um lançamento antes da conferência:

- `sem_movimento` deverá voltar para `false`;
- `sem_movimento_em` deverá voltar para `NULL`;
- `sem_movimento_por` deverá voltar para `NULL`.

### Regras gerais

- Cada empresa poderá possuir apenas uma competência para cada combinação de ano e mês.
- `mes` deve estar entre `1` e `12`.
- A `data_referencia` de todo lançamento deve pertencer ao ano e mês da competência.
- O faturamento da competência será calculado dinamicamente a partir dos lançamentos `ATIVO`.
- Totais não deverão ser armazenados na tabela `COMPETENCIAS`.

---

# FLUXO FIXO DAS COMPETENCIAS

As únicas transições permitidas são:

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
   ├──────────────→ FINALIZADA
   │
   ↓
REABERTA
   ↓
...
```

Formalmente:

```text
ABERTA → EM_CONFERENCIA

EM_CONFERENCIA → REABERTA
EM_CONFERENCIA → FINALIZADA

REABERTA → EM_CONFERENCIA
```

### Transições proibidas

Exemplos que deverão ser bloqueados:

```text
ABERTA → FINALIZADA
ABERTA → REABERTA

REABERTA → FINALIZADA
REABERTA → ABERTA

FINALIZADA → ABERTA
FINALIZADA → EM_CONFERENCIA
FINALIZADA → REABERTA
```

- O fluxo não poderá pular etapas.
- Toda mudança de status deverá ocorrer por uma operação controlada no backend/banco.
- Alterar diretamente o campo `status` fora dessa regra deverá ser bloqueado pela aplicação e, preferencialmente, por função/trigger no banco.

---

# HISTORICO_COMPETENCIAS

| Chave | Campo | Tipo |
|---|---|---|
| PK | id | Serial Number |
| FK | competencia_id | Chave externa |
| FK | usuario_id | UUID |
| NN | status_anterior | Texto Limitado(30) |
| NN | status_novo | Texto Limitado(30) |
|  | justificativa | Texto |
| NN | created_at | Data com hora |

### Regras

- Toda mudança de status da competência deverá gerar um registro.
- `usuario_id` deverá identificar quem realizou a transição.
- `created_at` deverá registrar quando a transição ocorreu.
- A mudança `EM_CONFERENCIA → REABERTA` exige justificativa obrigatória.
- Os demais movimentos poderão ter justificativa opcional.
- Os registros do histórico não poderão ser editados.
- Os registros do histórico não poderão ser excluídos.
- Uma competência poderá ser reaberta várias vezes sem perda do histórico.
- O histórico deverá seguir obrigatoriamente as mesmas transições válidas definidas em `COMPETENCIAS`.

---

# LANCAMENTOS_FATURAMENTO

| Chave | Campo | Tipo |
|---|---|---|
| PK | id | Serial Number |
| FK | competencia_id | Chave externa |
| FK | categoria_id | Chave externa |
| FK | criado_por_usuario_id | UUID |
| NN | tipo_lancamento | Texto Limitado(30) |
| NN | data_referencia | Data |
| NN | valor | Número Decimal(14,2) |
|  | observacao | Texto |
| NN | status | Texto Limitado(15) |
| FK | cancelado_por_usuario_id | UUID NULL |
|  | cancelado_em | Data com hora NULL |
|  | motivo_cancelamento | Texto NULL |
| FK / UK | substitui_lancamento_id | Chave externa NULL |
| NN | created_at | Data com hora |

### tipo_lancamento

- `FATURAMENTO`
- `DEVOLUCAO_ESTORNO`

### status_lancamento

- `ATIVO`
- `CANCELADO`

### FATURAMENTO

- O `valor` deve ser positivo.
- Quando `ATIVO`, o valor será somado aos totais.

### DEVOLUCAO_ESTORNO

- O `valor` também deve ser informado como positivo.
- Quando `ATIVO`, o sistema deverá subtrair esse valor dos totais.

Exemplo:

```text
FATURAMENTO          R$ 10.000,00
DEVOLUCAO_ESTORNO    R$  1.500,00

Total líquido        R$  8.500,00
```

### ATIVO

- O lançamento é válido.
- Participa do cálculo da competência.
- Participa do faturamento acumulado.
- Participa do total da categoria.

### CANCELADO

- O registro permanece armazenado.
- Não participa de nenhum total.
- Deve possuir usuário responsável pelo cancelamento.
- Deve possuir data/hora do cancelamento.
- Deve possuir motivo de cancelamento.
- Deve obrigatoriamente possuir um lançamento substituto.

---

# QUANTIDADE DE LANCAMENTOS POR CATEGORIA

Uma mesma categoria poderá possuir vários lançamentos ativos na mesma competência, inclusive na mesma data.

Portanto, NÃO deverá existir:

```text
UNIQUE (
  competencia_id,
  categoria_id,
  data_referencia
)
```

Exemplo válido:

| Data | Categoria | Tipo | Valor | Status |
|---|---|---|---:|---|
| 01/08/2026 | Comércio | FATURAMENTO | R$ 10.000,00 | ATIVO |
| 01/08/2026 | Comércio | FATURAMENTO | R$ 7.500,00 | ATIVO |
| 01/08/2026 | Comércio | DEVOLUCAO_ESTORNO | R$ 500,00 | ATIVO |

Total líquido da categoria:

`10.000 + 7.500 - 500 = R$ 17.000,00`

---

# REGRA DE IMUTABILIDADE DOS LANCAMENTOS

Um lançamento nunca poderá ser editado depois de criado.

Campos imutáveis:

| Campo |
|---|
| competencia_id |
| categoria_id |
| criado_por_usuario_id |
| tipo_lancamento |
| data_referencia |
| valor |
| observacao |
| created_at |

A única alteração permitida no registro existente é sua passagem de `ATIVO` para `CANCELADO`, preenchendo os campos de cancelamento.

Nenhuma correção poderá sobrescrever:

- competência;
- categoria;
- tipo;
- data;
- valor;
- observação.

---

# REGRA DE VALOR

Todo lançamento deverá possuir:

```text
valor > 0
```

Não serão utilizados valores negativos.

O sinal contábil será determinado por `tipo_lancamento`:

```text
FATURAMENTO
→ soma

DEVOLUCAO_ESTORNO
→ subtrai
```

Isso deverá ser aplicado em todos os cálculos e relatórios.

---

# REGRA DE CANCELAMENTO

No MVP, não haverá cancelamento isolado.

Todo cancelamento representa uma correção e deverá obrigatoriamente gerar um lançamento substituto.

Fluxo obrigatório:

```text
LANÇAMENTO ATIVO
      ↓
cancelar com justificativa
      +
criar substituto
      ↓
LANÇAMENTO CANCELADO
      +
NOVO LANÇAMENTO ATIVO
```

### Travas de consistência

Quando:

```text
status = ATIVO
```

deverá ser obrigatório:

```text
cancelado_por_usuario_id = NULL
cancelado_em = NULL
motivo_cancelamento = NULL
```

Quando:

```text
status = CANCELADO
```

deverá ser obrigatório:

```text
cancelado_por_usuario_id != NULL
cancelado_em != NULL
motivo_cancelamento != NULL
```

Além disso:

- um lançamento cancelado deverá possuir exatamente um substituto;
- um lançamento nunca poderá voltar de `CANCELADO` para `ATIVO`;
- registros cancelados nunca deverão ser excluídos fisicamente.

---

# REGRA DE SUBSTITUICAO

O novo lançamento deverá registrar:

```text
substitui_lancamento_id = id do lançamento cancelado
```

Exemplo:

| ID | Tipo | Valor | Status | Substitui |
|---|---|---:|---|---|
| 100 | FATURAMENTO | R$ 10.000 | CANCELADO | — |
| 101 | FATURAMENTO | R$ 9.500 | ATIVO | 100 |

### Regras

- Um lançamento nunca poderá substituir a si próprio.
- Um lançamento somente poderá substituir um registro `CANCELADO`.
- O novo lançamento deverá pertencer à mesma competência do lançamento anterior.
- O lançamento substituto deverá ser criado inicialmente como `ATIVO`.
- O lançamento original deverá ser cancelado no mesmo processo que cria o substituto.
- `motivo_cancelamento` será a justificativa da correção.
- `substitui_lancamento_id` deverá ser único quando não for `NULL`.
- Um lançamento poderá ser substituído diretamente apenas uma vez.
- A cadeia não poderá possuir ramificações.

### Cadeia válida

```text
100 CANCELADO
      ↓
101 CANCELADO
      ↓
105 ATIVO
```

### Cadeia proibida

```text
      ┌→ 101
100 ──┤
      └→ 102
```

A substituição deve formar uma cadeia linear.

---

# OPERACAO ATOMICA DE CANCELAMENTO + SUBSTITUICAO

Cancelamento e substituição deverão obrigatoriamente ocorrer como uma única operação atômica.

Não poderá existir um estado persistido em que:

```text
lançamento antigo = CANCELADO
e
lançamento substituto = não criado
```

A operação deverá seguir conceitualmente:

```text
BEGIN

1. validar competência;
2. validar lançamento original;
3. validar novo lançamento;
4. marcar original como CANCELADO;
5. registrar cancelado_por_usuario_id;
6. registrar cancelado_em;
7. registrar motivo_cancelamento;
8. criar novo lançamento ATIVO;
9. definir substitui_lancamento_id;
10. validar integridade da cadeia;

COMMIT
```

Se qualquer etapa falhar:

```text
ROLLBACK
```

Resultado:

```text
OU
cancelamento + substituição são concluídos

OU
nenhuma alteração é persistida
```

No Supabase/PostgreSQL, essa operação deverá ser implementada preferencialmente através de função PostgreSQL/RPC transacional ou por backend que garanta a mesma transação de banco.

---

# REGRAS POR STATUS DA COMPETENCIA

## ABERTA

Permitido:

- criar lançamento;
- cancelar + substituir lançamento;
- marcar/desmarcar `sem_movimento`;
- iniciar conferência.

Não permitido:

- finalizar diretamente.

## EM_CONFERENCIA

Permitido:

- consultar;
- reabrir com justificativa;
- finalizar.

Não permitido:

- criar lançamento;
- cancelar lançamento;
- substituir lançamento.

## REABERTA

Permitido:

- criar lançamento necessário à correção;
- cancelar + substituir lançamento;
- consultar;
- retornar para `EM_CONFERENCIA`.

Não permitido:

- finalizar diretamente.

## FINALIZADA

Permitido:

- somente consulta.

Não permitido:

- criar;
- cancelar;
- substituir;
- reabrir;
- alterar status.

---

# CALCULO DOS TOTAIS

Somente registros:

```text
status = ATIVO
```

participam dos cálculos.

### Efeito de cada tipo

```text
FATURAMENTO
→ + valor

DEVOLUCAO_ESTORNO
→ - valor
```

### Total da categoria

```text
SUM(FATURAMENTO ATIVO)
-
SUM(DEVOLUCAO_ESTORNO ATIVO)
```

### Total da competência

Soma líquida de todos os lançamentos ativos da competência.

### Faturamento acumulado

Soma líquida dos lançamentos ativos pertencentes ao intervalo considerado.

### Totais armazenados

Os totais não deverão ser persistidos inicialmente.

Serão calculados a partir dos lançamentos para evitar divergência entre:

```text
dados armazenados
e
totais calculados
```

---

# ENUMS / VALORES CONTROLADOS DO MVP

## status_competencia

| Valor |
|---|
| `ABERTA` |
| `EM_CONFERENCIA` |
| `REABERTA` |
| `FINALIZADA` |

## status_lancamento

| Valor |
|---|
| `ATIVO` |
| `CANCELADO` |

## tipo_lancamento

| Valor |
|---|
| `FATURAMENTO` |
| `DEVOLUCAO_ESTORNO` |

---

# SUPABASE AUTH

A autenticação será realizada pelo Supabase Auth.

Relacionamento principal:

```text
auth.users.id
       ↓
public.USUARIOS.id
```

A tabela `USUARIOS` armazenará os dados específicos do sistema.

O Supabase Auth será responsável por:

- autenticação;
- senha;
- recuperação de senha;
- sessões;
- tokens JWT.

---

# ROW LEVEL SECURITY — RLS

As tabelas expostas pelo Supabase deverão possuir RLS habilitado.

No MVP, todos os usuários são internos, mas o acesso não deverá depender apenas da interface.

Regra conceitual inicial:

```text
usuário autenticado
+
existe em public.USUARIOS
+
USUARIOS.ativo = true
→ acesso permitido conforme políticas do sistema
```

### Regras mínimas

- Usuário não autenticado não poderá acessar dados internos.
- Usuário autenticado mas com `ativo = false` não poderá operar no sistema.
- Alterações críticas não deverão depender somente de validações do frontend.
- Cancelamento/substituição deverá ser feito por função segura/backend.
- Mudanças de status da competência deverão ser controladas por função/backend.
- O histórico de competências não poderá permitir `UPDATE` ou `DELETE` pelos usuários comuns.
- Lançamentos não poderão permitir `DELETE`.
- Campos imutáveis dos lançamentos não deverão poder ser atualizados diretamente.

### Service Role

A chave `service_role` do Supabase:

- nunca deverá ser enviada ao frontend;
- deverá existir apenas em ambiente seguro de backend, caso seja necessária.

---

# RESTRICOES DE BANCO RECOMENDADAS

Além das FKs, deverão existir validações equivalentes a:

```text
EMPRESAS:
cnpj UNIQUE
cnpj com 14 caracteres

CATEGORIAS_FATURAMENTO:
nome UNIQUE

COMPETENCIAS:
UNIQUE (empresa_id, ano, mes)
mes BETWEEN 1 AND 12

LANCAMENTOS_FATURAMENTO:
valor > 0
substitui_lancamento_id UNIQUE quando não NULL
substitui_lancamento_id != id
```

Também deverão existir validações para:

- `data_referencia` pertencer à competência;
- campos de cancelamento serem coerentes com o status;
- lançamento substituto pertencer à mesma competência;
- lançamento substituído estar `CANCELADO`;
- evitar ciclos na cadeia de substituição;
- bloquear edição dos campos imutáveis;
- bloquear exclusão de lançamentos;
- bloquear exclusão do histórico de competências;
- respeitar o fluxo fixo de status da competência.

Algumas dessas regras exigirão função/trigger PostgreSQL ou validação transacional no backend, pois não podem ser expressas apenas com `CHECK`.

---

# TABELAS DO MVP

O banco inicial será composto por:

```text
EMPRESAS
USUARIOS
CATEGORIAS_FATURAMENTO
COMPETENCIAS
HISTORICO_COMPETENCIAS
LANCAMENTOS_FATURAMENTO
```

Relacionamentos principais:

```text
auth.users
    │
    └── USUARIOS

EMPRESAS
    │
    └── COMPETENCIAS
            │
            ├── HISTORICO_COMPETENCIAS
            │
            └── LANCAMENTOS_FATURAMENTO
                        │
                        └── CATEGORIAS_FATURAMENTO

LANCAMENTOS_FATURAMENTO
    │
    └── substitui_lancamento_id
            ↓
       LANCAMENTOS_FATURAMENTO
```

---

# FLUXO GERAL DO MVP

```text
CADASTRA EMPRESA
       ↓
CRIA COMPETENCIA MENSAL
       ↓
COMPETENCIA ABERTA
       ↓
REGISTRA FATURAMENTOS /
DEVOLUCOES / ESTORNOS
       ↓
INICIA CONFERENCIA
       ↓
EM_CONFERENCIA
       ↓
      CORRETO?
     ↙        ↘
   NÃO        SIM
    ↓          ↓
REABERTA   FINALIZADA
    ↓
CORRIGE POR
CANCELAMENTO
+
SUBSTITUICAO
ATOMICA
    ↓
EM_CONFERENCIA
```

Se o mês não possuir movimento:

```text
COMPETENCIA ABERTA
       ↓
MARCA SEM MOVIMENTO
       ↓
EM_CONFERENCIA
       ↓
FINALIZADA
```
