# Modelo de Banco — P0

## 1. Objetivo

Este documento define somente o banco necessário para o P0 de lançamentos e substituições.

O modelo deve permitir:

- consultar empresas e categorias previamente cadastradas;
- criar e listar lançamentos;
- preservar lançamentos anteriores;
- corrigir um lançamento por substituição;
- navegar entre o lançamento anterior e seu substituto direto.

Não fazem parte deste modelo autenticação, usuários, competências, cancelamentos, anexos, filiais, fechamento mensal ou auditoria avançada.

## 2. Relacionamentos

```text
EMPRESAS
   │
   ├──< CATEGORIAS
   │
   └──< LANCAMENTOS
             │
             └── substitui outro LANCAMENTO
```

Uma empresa possui várias categorias e vários lançamentos. Uma categoria pertence a uma única empresa. Um lançamento substituto aponta para o lançamento imediatamente anterior por meio de `substitui_lancamento_id`.

## 3. Tabelas

### 3.1 `empresas`

| Campo | Tipo | Regra |
|---|---|---|
| `id` | `BIGSERIAL` | Chave primária |
| `nome` | `VARCHAR(150)` | Obrigatório |
| `cnpj` | `CHAR(14)` | Obrigatório, único e armazenado somente com dígitos |

### 3.2 `categorias`

| Campo | Tipo | Regra |
|---|---|---|
| `id` | `BIGSERIAL` | Chave primária |
| `empresa_id` | `BIGINT` | Empresa proprietária, obrigatório |
| `nome` | `VARCHAR(100)` | Obrigatório |

### 3.3 `lancamentos`

| Campo | Tipo | Regra |
|---|---|---|
| `id` | `BIGSERIAL` | Chave primária |
| `empresa_id` | `BIGINT` | Empresa do lançamento, obrigatório |
| `categoria_id` | `BIGINT` | Categoria do lançamento, obrigatório |
| `data_referencia` | `DATE` | Obrigatório |
| `valor` | `NUMERIC(14,2)` | Obrigatório e maior que zero |
| `observacao` | `TEXT` | Opcional |
| `status` | `VARCHAR(20)` | `ATIVO` ou `SUBSTITUIDO` |
| `substitui_lancamento_id` | `BIGINT` | Lançamento anterior, quando houver |
| `motivo_substituicao` | `TEXT` | Obrigatório somente em uma substituição |
| `criado_em` | `TIMESTAMP` | Preenchido automaticamente |
| `substituido_em` | `TIMESTAMP` | Preenchido no registro antigo ao substituí-lo |

## 4. SQL de criação

```sql
CREATE TABLE empresas (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cnpj CHAR(14) NOT NULL UNIQUE,
    CONSTRAINT empresas_cnpj_formato_check
        CHECK (cnpj ~ '^[0-9]{14}$')
);

CREATE TABLE categorias (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresas(id),
    nome VARCHAR(100) NOT NULL
);

CREATE TABLE lancamentos (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresas(id),
    categoria_id BIGINT NOT NULL REFERENCES categorias(id),
    data_referencia DATE NOT NULL,
    valor NUMERIC(14,2) NOT NULL CHECK (valor > 0),
    observacao TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVO'
        CHECK (status IN ('ATIVO', 'SUBSTITUIDO')),
    substitui_lancamento_id BIGINT REFERENCES lancamentos(id),
    motivo_substituicao TEXT,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    substituido_em TIMESTAMP
);

CREATE INDEX idx_categorias_empresa_id
    ON categorias (empresa_id);

CREATE INDEX idx_lancamentos_empresa_id
    ON lancamentos (empresa_id);

CREATE INDEX idx_lancamentos_categoria_id
    ON lancamentos (categoria_id);

CREATE INDEX idx_lancamentos_data_referencia
    ON lancamentos (data_referencia);

CREATE INDEX idx_lancamentos_status
    ON lancamentos (status);

CREATE INDEX idx_lancamentos_substitui_id
    ON lancamentos (substitui_lancamento_id);
```

## 5. Dados iniciais para demonstração

Os dados reais da demonstração devem substituir os exemplos abaixo.

```sql
INSERT INTO empresas (nome, cnpj)
VALUES
    ('EMPRESA EXEMPLO ALFA LTDA', '99999999000191'),
    ('EMPRESA EXEMPLO BETA LTDA', '88888888000191'),
    ('EMPRESA EXEMPLO GAMA LTDA', '77777777000191');

INSERT INTO categorias (empresa_id, nome)
VALUES
    (1, 'Vendas'),
    (2, 'Vendas'),
    (3, 'Vendas'),
    (3, 'Anexo III'),
    (3, 'Anexo IV');
```

## 6. Regras mantidas pela API no P0

Para evitar complexidade desnecessária, as seguintes regras serão validadas pelo backend:

- a categoria informada deve existir e pertencer à empresa selecionada;
- o CNPJ deve conter exatamente 14 dígitos e não pode se repetir entre empresas;
- o processo controlado de pré-cadastro deve validar os dígitos verificadores antes da inserção;
- um lançamento comum sempre nasce como `ATIVO`;
- campos de controle de substituição não são aceitos na criação comum;
- um lançamento existente não pode ter seus dados de negócio editados ou ser excluído;
- somente um lançamento `ATIVO` pode ser substituído;
- a empresa não pode ser alterada durante a substituição;
- o motivo da substituição deve conter texto válido;
- a criação do substituto e a mudança de status do original acontecem na mesma transação.

Triggers, RLS, chaves compostas e bloqueios avançados ficam fora do P0.

## 7. Estado de um lançamento comum

Ao criar um lançamento fora do fluxo de substituição:

```text
status = ATIVO
substitui_lancamento_id = NULL
motivo_substituicao = NULL
substituido_em = NULL
```

## 8. Transação de substituição

Fluxo mínimo esperado no backend ou em uma função transacional:

```text
BEGIN

1. Buscar o lançamento original.
2. Validar que ele existe e está ATIVO.
3. Validar categoria, data, valor e motivo.
4. Criar o novo lançamento ATIVO apontando para o original.
5. Atualizar o original para SUBSTITUIDO somente se ainda estiver ATIVO.
6. Confirmar que a atualização afetou exatamente um registro.
7. COMMIT.

Se qualquer etapa falhar: ROLLBACK.
```

Depois da operação:

```text
Lançamento original
status = SUBSTITUIDO
substituido_em = momento da substituição

Novo lançamento
status = ATIVO
substitui_lancamento_id = ID do original
motivo_substituicao = motivo informado
```

## 9. Consultas úteis

Localizar o lançamento anterior:

```sql
SELECT *
FROM lancamentos
WHERE id = :substitui_lancamento_id;
```

Localizar o substituto direto:

```sql
SELECT *
FROM lancamentos
WHERE substitui_lancamento_id = :lancamento_id
ORDER BY criado_em DESC
LIMIT 1;
```

Listar lançamentos com nomes legíveis:

```sql
SELECT
    l.id,
    l.data_referencia,
    e.id AS empresa_id,
    e.nome AS empresa_nome,
    e.cnpj AS empresa_cnpj,
    c.id AS categoria_id,
    c.nome AS categoria_nome,
    l.valor,
    l.status,
    l.criado_em
FROM lancamentos l
JOIN empresas e ON e.id = l.empresa_id
JOIN categorias c ON c.id = l.categoria_id
ORDER BY l.data_referencia DESC, l.id DESC;
```

## 10. Fora do escopo do banco P0

- autenticação e usuários;
- permissões e RLS;
- cadastro pelas telas;
- edição ou exclusão de lançamentos;
- cancelamento;
- competências e fechamento mensal;
- prevenção automática de duplicidades;
- auditoria detalhada;
- histórico em tabela separada;
- linha do tempo completa;
- garantias avançadas de concorrência.
