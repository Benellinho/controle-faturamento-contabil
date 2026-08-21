# Modelo de Endpoints — P0

## 1. Objetivo

Esta especificação define somente os endpoints necessários para demonstrar o fluxo do P0:

```text
listar → criar → visualizar → substituir → consultar histórico
```

Não existem endpoints de login, cadastro de empresas ou categorias, edição, exclusão ou cancelamento.

## 2. Convenções

Base sugerida:

```text
/api
```

Formato de dados:

```text
Content-Type: application/json
```

Datas recebidas pela API:

```text
YYYY-MM-DD
```

Valores monetários são enviados como números com até duas casas decimais.

## 3. Resumo dos endpoints

| Método | Rota | Finalidade |
|---|---|---|
| `GET` | `/api/empresas` | Listar empresas disponíveis |
| `GET` | `/api/empresas/:empresaId/categorias` | Listar categorias da empresa |
| `GET` | `/api/lancamentos` | Listar e filtrar lançamentos |
| `GET` | `/api/lancamentos/:id` | Consultar um lançamento |
| `POST` | `/api/lancamentos` | Criar um lançamento |
| `POST` | `/api/lancamentos/:id/substituir` | Substituir um lançamento ativo |

Não implementar `PUT`, `PATCH` ou `DELETE` para lançamentos.

## 4. Formato mínimo de erro

```json
{
  "erro": {
    "codigo": "CODIGO_DO_ERRO",
    "mensagem": "Descrição legível do problema."
  }
}
```

Status utilizados:

| HTTP | Uso |
|---|---|
| `400` | Dados ausentes ou inválidos |
| `404` | Recurso não encontrado |
| `409` | Conflito de estado, como substituir um registro já substituído |
| `500` | Falha inesperada |

## 5. `GET /api/empresas`

Lista as empresas previamente cadastradas, com CNPJ, ordenadas por nome. O CNPJ é retornado com 14 dígitos; a máscara de apresentação é responsabilidade do frontend.

### Resposta `200`

```json
[
  {
    "id": 1,
    "nome": "EMPRESA EXEMPLO ALFA LTDA",
    "cnpj": "99999999000191"
  },
  {
    "id": 2,
    "nome": "EMPRESA EXEMPLO BETA LTDA",
    "cnpj": "88888888000191"
  }
]
```

## 6. `GET /api/empresas/:empresaId/categorias`

Lista somente as categorias pertencentes à empresa informada.

### Exemplo

```text
GET /api/empresas/1/categorias
```

### Resposta `200`

```json
[
  {
    "id": 1,
    "nome": "Vendas"
  },
  {
    "id": 2,
    "nome": "Serviços"
  }
]
```

Se a empresa não existir, retornar `404`.

## 7. `GET /api/lancamentos`

Lista os lançamentos ativos e substituídos. Sem filtros, retorna todos em ordem decrescente de data e identificador.

### Filtros opcionais

| Parâmetro | Formato | Comportamento |
|---|---|---|
| `empresa_id` | inteiro | Correspondência exata |
| `categoria_id` | inteiro | Correspondência exata |
| `data` | `YYYY-MM-DD` | Correspondência exata com `data_referencia` |
| `status` | `ATIVO` ou `SUBSTITUIDO` | Correspondência exata |

### Exemplo

```text
GET /api/lancamentos?empresa_id=1&status=ATIVO
```

### Resposta `200`

```json
[
  {
    "id": 16,
    "data_referencia": "2026-08-20",
    "empresa": {
      "id": 1,
      "nome": "EMPRESA EXEMPLO ALFA LTDA",
      "cnpj": "99999999000191"
    },
    "categoria": {
      "id": 2,
      "nome": "Serviços"
    },
    "valor": 5500.00,
    "status": "ATIVO",
    "criado_em": "2026-08-20T11:00:00"
  }
]
```

Uma consulta sem resultados retorna `200` com uma lista vazia.

Paginação não faz parte do P0.

## 8. `GET /api/lancamentos/:id`

Retorna os detalhes e os identificadores necessários para navegar no histórico.

### Resposta `200`

```json
{
  "id": 16,
  "empresa": {
    "id": 1,
    "nome": "EMPRESA EXEMPLO ALFA LTDA",
    "cnpj": "99999999000191"
  },
  "categoria": {
    "id": 2,
    "nome": "Serviços"
  },
  "data_referencia": "2026-08-20",
  "valor": 5500.00,
  "observacao": "Serviço referente ao contrato X",
  "status": "ATIVO",
  "substitui_lancamento_id": 15,
  "motivo_substituicao": "Valor informado incorretamente",
  "lancamento_anterior_id": 15,
  "lancamento_substituto_id": null,
  "criado_em": "2026-08-20T11:00:00",
  "substituido_em": null
}
```

Regras dos campos de navegação:

- `lancamento_anterior_id`: lançamento imediatamente anterior;
- `lancamento_substituto_id`: próximo lançamento que substituiu o registro consultado;
- quando a relação não existir, o valor será `null`.

Se o lançamento não existir, retornar `404`.

## 9. `POST /api/lancamentos`

Cria um lançamento comum.

### Requisição

```json
{
  "empresa_id": 1,
  "categoria_id": 2,
  "data_referencia": "2026-08-20",
  "valor": 5000.00,
  "observacao": "Serviço referente ao contrato X"
}
```

### Validações

- `empresa_id`, `categoria_id`, `data_referencia` e `valor` são obrigatórios;
- empresa e categoria devem existir;
- a categoria deve pertencer à empresa;
- a data deve ser válida;
- o valor deve ser maior que zero;
- `observacao` é opcional.

O cliente não pode informar `status`, `substitui_lancamento_id`, `motivo_substituicao` ou `substituido_em`.

### Resposta `201`

```json
{
  "id": 15,
  "empresa_id": 1,
  "categoria_id": 2,
  "data_referencia": "2026-08-20",
  "valor": 5000.00,
  "observacao": "Serviço referente ao contrato X",
  "status": "ATIVO",
  "substitui_lancamento_id": null,
  "motivo_substituicao": null,
  "criado_em": "2026-08-20T10:30:00",
  "substituido_em": null
}
```

## 10. `POST /api/lancamentos/:id/substituir`

Substitui um lançamento `ATIVO` sem alterar ou excluir seus dados de negócio.

A empresa não é recebida no corpo. O backend reutiliza a empresa do lançamento original.

### Requisição

```json
{
  "categoria_id": 2,
  "data_referencia": "2026-08-20",
  "valor": 5500.00,
  "observacao": "Serviço referente ao contrato X",
  "motivo_substituicao": "Valor informado incorretamente"
}
```

### Validações

- o lançamento original deve existir;
- o lançamento original deve estar `ATIVO`;
- a categoria deve pertencer à empresa do original;
- a data deve ser válida;
- o valor deve ser maior que zero;
- o motivo deve conter texto após remover espaços das extremidades.

### Operação

A API deve executar em uma única transação:

1. criar o novo lançamento como `ATIVO`;
2. definir `substitui_lancamento_id` com o ID original;
3. armazenar o motivo no novo lançamento;
4. marcar o original como `SUBSTITUIDO` e preencher `substituido_em`;
5. confirmar que exatamente um original foi atualizado;
6. desfazer toda a operação se qualquer etapa falhar.

### Resposta `201`

```json
{
  "mensagem": "Lançamento substituído com sucesso.",
  "lancamento_original_id": 15,
  "novo_lancamento_id": 16
}
```

O frontend deve redirecionar para:

```text
/lancamentos/16
```

### Conflito `409`

```json
{
  "erro": {
    "codigo": "LANCAMENTO_NAO_ATIVO",
    "mensagem": "Somente um lançamento ativo pode ser substituído."
  }
}
```

## 11. Endpoints fora do P0

Não implementar:

```text
POST   /api/login
POST   /api/empresas
PUT    /api/empresas/:id
DELETE /api/empresas/:id
POST   /api/categorias
PUT    /api/categorias/:id
DELETE /api/categorias/:id
PUT    /api/lancamentos/:id
PATCH  /api/lancamentos/:id
DELETE /api/lancamentos/:id
POST   /api/lancamentos/:id/cancelar
```

Também ficam fora do P0 paginação, ordenação configurável, busca textual, autenticação, permissões, anexos e importações.

## 12. Checklist mínimo da API

- [ ] Listar empresas.
- [ ] Retornar nome e CNPJ em todas as representações de empresa.
- [ ] Listar categorias por empresa.
- [ ] Listar lançamentos com os quatro filtros.
- [ ] Consultar um lançamento e seus vizinhos no histórico.
- [ ] Criar um lançamento válido como `ATIVO`.
- [ ] Rejeitar categoria de outra empresa.
- [ ] Rejeitar valor igual ou menor que zero.
- [ ] Substituir um lançamento dentro de transação.
- [ ] Exigir motivo de substituição.
- [ ] Rejeitar substituição de lançamento já substituído.
- [ ] Confirmar rollback quando a substituição falhar.
