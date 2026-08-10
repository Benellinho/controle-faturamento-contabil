# Auth e controle de acesso — Etapa 05

## Objetivo

Sincronizar o Supabase Auth com `public.usuarios` e liberar somente as operações necessárias para cada papel. A migration está em:

```text
supabase/migrations/20260810020300_auth_e_controle_de_acesso.sql
```

## Provisionamento de usuários

O cadastro público permanece desabilitado em `supabase/config.toml`. Usuários internos devem ser criados pelo Dashboard ou por uma operação administrativa protegida.

Ao inserir ou atualizar um registro em `auth.users`, o trigger `auth_usuarios_sincronizar_perfil` cria ou sincroniza o perfil público. Os metadados opcionais esperados são:

```json
{
  "nome": "Nome do usuário",
  "cargo": "ANALISTA"
}
```

Quando os metadados não forem informados, o e-mail é usado como nome inicial e o cargo recebe `USUARIO`. Usuários já existentes são sincronizados ao aplicar a migration.

## Usuário interno ativo

A função `usuario_atual_ativo()` confirma que:

```text
auth.uid() = public.usuarios.id
e public.usuarios.ativo = true
```

Ela é `SECURITY DEFINER`, possui `search_path` fixo e expõe apenas um resultado booleano.

## Políticas RLS

Usuários do papel `authenticated` recebem somente leitura nas seis tabelas do MVP, condicionada a `usuario_atual_ativo()`:

- `empresas`;
- `usuarios`;
- `categorias_faturamento`;
- `competencias`;
- `historico_competencias`;
- `lancamentos_faturamento`.

O papel `anon` permanece sem acesso. Usuários autenticados não recebem `INSERT`, `UPDATE` ou `DELETE`.

## Permissões do backend

A `service_role` continua responsável pelas operações do backend, mas perde acesso direto a alterações críticas:

- não pode atualizar diretamente competências;
- não pode atualizar ou excluir lançamentos;
- não pode inserir, atualizar ou excluir histórico.

Essas operações são feitas pelas funções transacionais das etapas 03 e 04, executadas como `SECURITY DEFINER`. Dessa forma, mesmo um erro no repositório do backend não contorna o fluxo ou a atomicidade.

## Regra importante para o backend

O `p_usuario_id` das funções nunca deve ser aceito do corpo da requisição. O backend deve obtê-lo do access token validado pelo Supabase Auth.

## Testes recomendados

- consultar uma tabela sem token;
- consultar com usuário autenticado e ativo;
- desativar o perfil e repetir a consulta;
- tentar escrita usando a chave pública `anon`;
- criar usuário administrativo e confirmar o perfil público;
- tentar atualizar diretamente uma competência usando a `service_role`;
- executar a mesma alteração pela função controlada.

## Próxima etapa

A etapa 06 cria views de leitura para totais mensais, por categoria e acumulados.
