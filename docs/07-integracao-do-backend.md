# Integração do backend — Etapa 07

## Objetivo

Definir como a API Fastify deve autenticar o usuário e consumir tabelas, funções e views do Supabase sem expor a `service_role`.

Esta etapa não possui migration: ela documenta o contrato de integração criado pelas etapas anteriores.

## Fluxo de autenticação

```text
Frontend
  │ login com Supabase Auth
  │ recebe access token
  ▼
Backend Fastify
  │ valida o token com Supabase Auth
  │ obtém o usuário autenticado
  │ confirma public.usuarios.ativo
  ▼
Supabase/PostgreSQL
```

O frontend envia:

```http
Authorization: Bearer <access_token>
```

O backend deve validar o token com `supabase.auth.getUser(token)`. Nunca deve apenas decodificar o JWT e confiar no conteúdo sem validação.

## Clientes Supabase

### Frontend

Usa somente:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

A chave anônima é pública e depende das políticas RLS.

### Backend

Usa somente no ambiente protegido:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

A `SUPABASE_SERVICE_ROLE_KEY` nunca deve aparecer em respostas, logs, bundles do frontend ou mensagens de erro.

## Identidade do responsável

Após validar o token, o backend utiliza `user.id` como responsável. Parâmetros como `p_usuario_id` nunca devem vir do corpo, query string ou parâmetro de rota.

Exemplo conceitual:

```js
const { data, error } = await supabase.rpc('transicionar_competencia', {
  p_competencia_id: competenciaId,
  p_status_novo: statusNovo,
  p_usuario_id: request.user.id,
  p_justificativa: justificativa,
})
```

## Mapeamento recomendado de operações

| Operação da API | Recurso no Supabase |
|---|---|
| Listar empresas | `empresas` |
| Criar empresa | `empresas` |
| Listar categorias | `categorias_faturamento` |
| Criar/desativar categoria | `categorias_faturamento` |
| Criar competência | `competencias` |
| Marcar sem movimento | RPC `marcar_sem_movimento` |
| Alterar status | RPC `transicionar_competencia` |
| Criar lançamento mensal com estoques | `lancamentos_faturamento` |
| Corrigir lançamento | RPC `cancelar_e_substituir_lancamento` |
| Consultar histórico | `historico_competencias` |
| Total por categoria | `vw_totais_categoria_competencia` |
| Total mensal | `vw_totais_competencia` |
| Total acumulado | `vw_faturamento_acumulado` |

Não devem existir endpoints de exclusão de lançamentos ou histórico.

Na criação e na correção do lançamento, o backend deve exigir `estoque_inicial` e `estoque_final`, ambos maiores ou iguais a zero. Uma resposta de conflito do índice mensal deve ser convertida em uma mensagem indicando que a competência já possui lançamento ativo.

## Tratamento de erros

O backend deve converter erros conhecidos do PostgreSQL para respostas consistentes:

| SQLSTATE | Significado usual | HTTP sugerido |
|---|---|---:|
| `23503` | Referência inexistente | `409` |
| `23505` | Registro duplicado | `409` |
| `23514` | Regra de negócio/check | `422` |
| `42501` | Usuário sem permissão ou inativo | `403` |
| `55000` | Operação inválida no estado atual | `409` |
| `P0002` | Registro não encontrado | `404` |

Mensagens internas e detalhes de credenciais não devem ser enviados ao cliente.

## Transações e concorrência

O backend não deve reproduzir em várias chamadas a lógica das RPCs. Uma chamada à função PostgreSQL corresponde a uma única transação. Isso é especialmente obrigatório para:

- transição com criação de histórico;
- cancelamento com criação do substituto.

## Checklist antes de expor endpoints

- middleware de autenticação registrado no Fastify;
- rota `/health` mantida pública e sem segredos;
- todas as demais rotas protegidas;
- usuário ativo verificado;
- validação dos corpos e parâmetros;
- `p_usuario_id` derivado do token;
- erros PostgreSQL convertidos para HTTP;
- logs sem tokens ou chaves;
- testes de integração contra o Supabase local;
- CORS restrito à URL do frontend.

## Estado atual

O cliente administrativo do Supabase e a rota `/health` já existem no backend. Os endpoints de negócio e o middleware de autenticação devem ser implementados na etapa de API, seguindo este contrato.
