# Relatório Técnico para Orçamento

## 1. Resumo executivo

O repositório contém um MVP de controle mensal de faturamento para um escritório contábil. O trabalho existente se concentra em duas frentes relativamente avançadas, mas ainda desconectadas:

- um modelo PostgreSQL/Supabase com regras de integridade, RLS, histórico, imutabilidade, fluxo de competências, substituição atômica de lançamentos e views de totais;
- uma interface React responsiva e navegável, construída sobre dados estáticos de demonstração.

O backend Fastify possui somente a infraestrutura inicial e a rota pública `GET /health`. Não existem middleware de autenticação, endpoints de negócio, validação de requisições, camada de serviços ou testes automatizados. O frontend não realiza login, não consome a API e não persiste dados. Os formulários apenas simulam espera e exibem mensagens de validação; as listagens importam arrays de `frontend/src/mocks` diretamente.

Por isso, **não foi identificado nenhum módulo de negócio completo de ponta a ponta em condição de produção**. O banco fornece uma base significativa, e várias telas reduzem o esforço visual restante, mas cadastro, consulta e fluxos críticos ainda não operam sobre dados reais.

### Resultado consolidado

| Indicador | Horas |
|---|---:|
| Esforço equivalente para desenvolver todo o escopo identificado desde o início | **550 h** |
| Esforço já materializado estimado por equivalência técnica | **147 h** |
| Esforço restante para concluir o escopo identificado | **403 h** |

As horas são estimativas técnicas de implementação, integração, tratamento de erros, testes e ajustes. Não incluem preço por hora, margem comercial, contingência geral, sustentação recorrente nem funcionalidades ainda não confirmadas, como integração com ERP, notas fiscais, exportação, múltiplos escritórios ou permissões por perfil.

### Premissas da estimativa

1. O produto continua sendo um sistema interno de um único escritório, conforme `README.md` e `docs/modelo-banco.md`.
2. A regra atual de **um único lançamento ativo por empresa/competência** é mantida. Essa premissa precisa ser validada, pois conflita com uma leitura possível de múltiplas categorias, faturamentos e estornos no mesmo mês.
3. Supabase Auth continua responsável por credenciais e sessão; o backend Fastify concentra gravações e operações críticas.
4. O frontend atual será aproveitado, mas receberá roteamento real, autenticação, camada de serviços, estados assíncronos e integração.
5. Testes de cada componente estão incluídos na respectiva estimativa. A estimativa transversal de qualidade cobre apenas infraestrutura de testes, jornadas ponta a ponta e regressões compartilhadas, evitando dupla contagem.
6. Não há margem de risco escondida nas 550 h/403 h. Mudanças nas decisões listadas em “Pontos que precisam de definição” devem ser estimadas à parte.

### Evidências principais

- `frontend/src/App.jsx` troca páginas por estado local, sem roteador ou URLs navegáveis.
- `frontend/src/mocks/listData.js` e `frontend/src/mocks/formOptions.js` alimentam diretamente telas e formulários.
- Os formulários de empresa, usuário, categoria e faturamento apenas aguardam `setTimeout` e exibem sucesso de demonstração.
- `backend/src/server.js` expõe somente `GET /health`.
- `supabase/migrations` contém o modelo e as regras centrais do domínio.
- `supabase/seed.sql` está vazio.
- Não existem arquivos de teste no repositório.
- `npm run check` foi executado nesta análise: lint do frontend e checagem sintática do backend passaram. Não foi executado `npm run build`.

---

## 2. Arquitetura atual

### 2.1 Tecnologias e dependências

| Camada | Tecnologias encontradas | Situação |
|---|---|---|
| Frontend | React 19, React DOM, Vite 8, Bootstrap 5, CSS próprio, Supabase JS | Interface de demonstração; cliente Supabase criado, mas não utilizado |
| Backend | Node.js, Fastify 5, `@fastify/cors`, Supabase JS, módulos ES | Esqueleto com logger, CORS e `/health`; sem API de negócio |
| Banco | PostgreSQL 17 via Supabase, migrations SQL, views, funções PL/pgSQL, triggers, RLS | Parte mais madura; aplicação completa das migrations não está comprovada no estado versionado |
| Autenticação | Supabase Auth | Configurada no ambiente e no banco; sem tela de login, sessão ou proteção de rotas |
| Monorepo | npm workspaces | Frontend e backend organizados como workspaces |
| Desenvolvimento local | Supabase CLI, Docker exigido pelo Supabase local | Configuração existente; seed vazio |
| Acesso temporário | `cloudflared` e host `*.trycloudflare.com` permitido pelo Vite | Apoio de desenvolvimento; não constitui implantação de produção |

O README estabelece Node.js 22 como requisito, mas o `package.json` não declara `engines`, o que permite instalações em versões incompatíveis sem aviso antecipado.

### 2.2 Estrutura do frontend

O frontend é uma SPA React sem biblioteca de roteamento e sem gerenciador global de estado. `App.jsx` mantém `{ page, recordId, returnPage }` em `useState` e seleciona componentes em um mapa. Consequências:

- atualizar o navegador retorna ao dashboard;
- URL, botão voltar/avançar, favoritos e links diretos não representam a tela atual;
- filtros não são preservados ao navegar;
- não há guardas de autenticação ou autorização.

Há boa base de componentes reutilizáveis para layout, tabelas, formulários, detalhes, confirmação, badges e formatação. O CSS possui breakpoints para desktop/mobile, navegação lateral responsiva, estados vazios e preferência de redução de movimento. A paleta selecionada é persistida em `localStorage`.

As páginas implementadas visualmente são:

- dashboard;
- controle de faturamento;
- empresas: lista, cadastro e detalhe;
- usuários: lista, cadastro e detalhe;
- categorias: lista, cadastro e detalhe em modal;
- faturamentos: lista, cadastro e detalhe;
- histórico de cancelamentos.

Não há telas de competências, detalhe da competência, fluxo de conferência, sem movimento, correção por substituição, edição/desativação efetiva, login ou recuperação de senha.

### 2.3 Estrutura do backend

O backend possui três arquivos funcionais:

- `src/config/env.js`: valida somente a porta e lê URL/chaves;
- `src/lib/supabase.js`: cria o cliente administrativo com `service_role` quando configurado;
- `src/server.js`: registra CORS, logger e `GET /health` e escuta apenas em `127.0.0.1`.

Ainda faltam, entre outros:

- autenticação Bearer e validação de usuário ativo;
- schemas de parâmetros, query e body;
- rotas, controladores, serviços e repositórios;
- mapeamento de erros SQLSTATE para HTTP;
- paginação, filtros e ordenação;
- documentação de API;
- testes unitários e de integração;
- configuração adequada do host para contêiner/produção;
- limitação de requisições, headers de segurança e política de logs sensíveis.

### 2.4 Banco de dados e autenticação

As migrations criam seis tabelas públicas, três enums, três views e diversas funções/triggers. O desenho esperado é:

```text
Supabase Auth (auth.users)
        │ 1:1
        ▼
public.usuarios

public.empresas 1 ─── N public.competencias
                            │
                            ├── 1:N public.historico_competencias
                            └── 1:N public.lancamentos_faturamento
                                          │
                                          ├── N:1 categorias_faturamento
                                          └── auto-relação de substituição
```

Usuários autenticados e ativos recebem leitura via RLS. Escritas são esperadas pelo backend com `service_role`; transição de competência, sem movimento e correção usam RPCs `security definer`. O contrato documentado determina que o backend derive o usuário do token e nunca aceite `p_usuario_id` do cliente.

### 2.5 Relação entre as camadas

Arquitetura pretendida:

```text
React ── login ──> Supabase Auth
React ── Bearer token ──> Fastify ── service_role/RPC ──> PostgreSQL
React ── leitura autorizada, se adotada ──> Supabase Data API + RLS
```

Arquitetura efetivamente conectada hoje:

```text
React ──> arrays mock em memória

Fastify ──> /health

Migrations SQL ──> modelo versionado, sem consumo pela aplicação
```

Há uma decisão arquitetural pendente: as policies permitem leitura direta do frontend, mas a documentação também descreve consultas pelo backend. É necessário padronizar uma estratégia para evitar contratos, filtros e tratamento de erros duplicados.

### 2.6 Ambientes e infraestrutura

Existem exemplos de variáveis para frontend e backend e configuração local do Supabase. Não foram encontrados:

- arquivos de implantação do frontend/backend;
- Dockerfile das aplicações;
- pipeline de CI/CD;
- ambiente de homologação;
- configuração de domínio/HTTPS;
- política de backups, restauração ou retenção;
- observabilidade/alertas;
- gestão de segredos de produção;
- seed para bootstrap do primeiro administrador ou dados de teste.

---

## 3. Mapa de módulos

| Módulo | Responsabilidade | Estado geral |
|---|---|---|
| Acesso e usuários | Login, sessão, usuário ativo, provisionamento e administração interna | PARCIALMENTE_IMPLEMENTADO |
| Empresas | Cadastro, consulta, edição e ativação/inativação | PARCIALMENTE_IMPLEMENTADO |
| Categorias | Cadastro global, consulta, desativação e proteção histórica | PARCIALMENTE_IMPLEMENTADO |
| Competências | Criação mensal, consulta, sem movimento, conferência, reabertura, finalização e histórico | PARCIALMENTE_IMPLEMENTADO, restrito hoje ao banco |
| Faturamentos | Lançamento mensal, consulta, imutabilidade, cancelamento e substituição | PARCIALMENTE_IMPLEMENTADO |
| Consultas e dashboard | Totais mensais/acumulados, estoques, indicadores e pendências | PARCIALMENTE_IMPLEMENTADO |
| Funcionalidades transversais | Layout, navegação, camada de dados, estados globais, segurança e qualidade | PARCIALMENTE_IMPLEMENTADO |
| Infraestrutura e implantação | Ambientes, migrations, backups, deploy e observabilidade | PARCIALMENTE_IMPLEMENTADO |

Status é avaliado de ponta a ponta. Uma tabela, migration ou tela isolada não torna o componente implementado.

---

## 4. Módulo: Acesso e usuários

### 4.1 Componente: Autenticação, sessão e controle de acesso

#### Objetivo

Permitir acesso somente a usuários internos autenticados e ativos, preservar a sessão e identificar com segurança o responsável por cada operação.

#### Escopo

- login e logout;
- recuperação/troca de senha conforme definição;
- restauração e expiração de sessão;
- rotas protegidas no frontend;
- middleware Bearer no Fastify;
- validação do token com Supabase Auth;
- verificação de `public.usuarios.ativo`;
- propagação segura do usuário autenticado;
- respostas 401/403 e tratamento de sessão expirada.

#### Estado atual

**Status: PARCIALMENTE_IMPLEMENTADO.** Supabase Auth está habilitado, cadastro público está desabilitado, há sincronização `auth.users → public.usuarios`, RLS para usuário ativo e clientes Supabase nas duas aplicações. Não há login, logout funcional, sessão, middleware, guardas ou recuperação de senha. O usuário exibido na sidebar é fixo.

#### Atividades técnicas

| Atividade | Esforço total | Esforço restante |
|---|---:|---:|
| Frontend: login, sessão, guards, logout e expiração | 8 h | 8 h |
| Backend: middleware, validação do token e contexto do usuário | 8 h | 8 h |
| Supabase/Auth e banco: configuração, sync e RLS | 6 h | 2 h |
| Segurança, mensagens e tratamento de erros | 4 h | 3 h |
| Testes de autenticação e acesso | 4 h | 4 h |
| **Total** | **30 h** | **25 h** |

#### Regras

- somente usuários autenticados e ativos acessam dados;
- `p_usuario_id` deve vir do token validado, nunca do payload;
- `service_role` não pode chegar ao navegador, respostas ou logs;
- signup público permanece desabilitado.

#### Dependências

**Depende de:** Supabase Auth, tabela `usuarios`, variáveis de ambiente.

**É pré-requisito para:** todos os endpoints e fluxos reais de negócio.

#### Complexidade

**ALTA.** Envolve identidade, sessão, segurança, duas aplicações e RLS; falhas comprometem todo o sistema.

#### Observações

O projeto ainda precisa definir convite versus senha temporária e o fluxo de recuperação. MFA não está previsto no estado atual.

### 4.2 Componente: Administração de usuários internos

#### Objetivo

Listar, visualizar, criar, editar e ativar/inativar usuários internos de forma coerente com Supabase Auth e o perfil público.

#### Escopo

- listagem, busca e filtro por situação;
- detalhe do usuário e último acesso;
- criação administrativa no Auth e perfil público;
- edição de nome, e-mail e cargo;
- ativação/inativação;
- tratamento de e-mail duplicado e falhas parciais;
- definição de senha inicial/convite;
- auditoria mínima da ação administrativa.

#### Estado atual

**Status: PARCIALMENTE_IMPLEMENTADO.** Existem tabela, FK para Auth, trigger de sincronização e telas mock de lista/cadastro/detalhe. Não há edição, persistência, endpoint administrativo, atualização de último login ou ação de ativar/inativar. A criação real exige API administrativa segura.

#### Atividades técnicas

| Atividade | Esforço total | Esforço restante |
|---|---:|---:|
| Frontend: lista, formulário, detalhe, edição e status | 10 h | 5 h |
| Backend: provisionamento Auth, consultas e alterações | 10 h | 10 h |
| Auth/banco: sincronização e consistência | 6 h | 3 h |
| Regras, validações e erros de operação parcial | 3 h | 3 h |
| Testes | 5 h | 5 h |
| **Total** | **34 h** | **26 h** |

#### Regras

- usuários são internos e possuem correspondência 1:1 com `auth.users`;
- usuário inativo não pode operar;
- e-mail é único;
- cargo não representa perfil de permissão no MVP atual;
- usuários referenciados por histórico não devem ser excluídos fisicamente.

#### Dependências

**Depende de:** autenticação e sessão.

**É pré-requisito para:** autoria de competências, lançamentos, cancelamentos e transições.

#### Complexidade

**ALTA.** Criação e alteração atravessam Supabase Auth e tabela pública e exigem evitar inconsistência entre as duas fontes.

#### Observações

`ultimo_login_at` existe, mas nenhum código o atualiza. O formulário aceita senha sem validar os oito caracteres configurados no Supabase local.

---

## 5. Módulo: Empresas

### 5.1 Componente: Listagem, busca e detalhe de empresas

#### Objetivo

Permitir localizar empresas por razão social, nome fantasia ou CNPJ e consultar seu estado cadastral.

#### Escopo

- consulta paginada;
- busca pelos campos suportados;
- filtro ativa/inativa;
- detalhe e estado vazio/erro/loading;
- formatação de CNPJ;
- navegação para competências da empresa.

#### Estado atual

**Status: PARCIALMENTE_IMPLEMENTADO.** Lista, busca client-side, filtro, detalhe e responsividade existem sobre mock. O banco possui a tabela e índices implícitos da PK/unique, mas não há endpoint, paginação, estados assíncronos nem acesso às competências a partir do detalhe.

#### Atividades técnicas

| Atividade | Esforço total | Esforço restante |
|---|---:|---:|
| Frontend | 8 h | 3 h |
| Backend e consultas/filtros | 5 h | 5 h |
| Banco | 1 h | 0 h |
| Testes e ajustes | 4 h | 3 h |
| **Total** | **18 h** | **11 h** |

#### Regras

- CNPJ é único e armazenado com 14 dígitos;
- empresas inativas permanecem consultáveis para preservar histórico.

#### Dependências

**Depende de:** autenticação, camada de API e tabela `empresas`.

**É pré-requisito para:** competências, faturamentos e consultas acumuladas.

#### Complexidade

**MÉDIA.** A interface é simples, mas busca, paginação, CNPJ e integração real precisam ser consistentes.

#### Observações

A busca atual normaliza de forma diferente texto e números e é adequada somente ao pequeno mock. Em produção, deve ocorrer no servidor.

### 5.2 Componente: Cadastro, edição e situação da empresa

#### Objetivo

Criar e manter os dados mínimos da empresa sem remover seu histórico.

#### Escopo

- cadastro e edição de CNPJ, razão social e nome fantasia;
- ativação/inativação;
- validação de duplicidade e formato;
- bloqueio de novos lançamentos para empresa inativa;
- mensagens, confirmação e concorrência de atualização.

#### Estado atual

**Status: PARCIALMENTE_IMPLEMENTADO.** Há formulário mock com máscara e validações básicas; tabela, `UNIQUE` e trigger de `updated_at` existem. Não há POST/PATCH, edição visual ou comando explícito de inativação. O banco bloqueia novos lançamentos/competências para empresa inativa, mas não bloqueia exclusão de empresa sem histórico por uma regra de domínio específica.

#### Atividades técnicas

| Atividade | Esforço total | Esforço restante |
|---|---:|---:|
| Frontend: cadastro, edição e ações de situação | 8 h | 4 h |
| Backend: endpoints e tratamento de conflito | 7 h | 7 h |
| Banco e integridade | 3 h | 1 h |
| Regras/validações | 2 h | 2 h |
| Testes | 4 h | 3 h |
| **Total** | **24 h** | **17 h** |

#### Regras

- empresa inativa não recebe competência nem lançamento novo;
- dados históricos permanecem;
- CNPJ não se repete.

#### Dependências

**Depende de:** autenticação e API.

**É pré-requisito para:** cadastro de competência e lançamento.

#### Complexidade

**MÉDIA.** CRUD pequeno, com impacto relevante de inativação nos demais módulos.

#### Observações

A validação atual verifica somente quantidade de dígitos, não os dígitos verificadores do CNPJ. Essa exigência precisa ser definida.

---

## 6. Módulo: Categorias de faturamento

### 6.1 Componente: Listagem e detalhe de categorias

#### Objetivo

Consultar as classificações globais disponíveis e seu estado.

#### Escopo

- busca por nome;
- filtro de situação, caso confirmado;
- detalhe com descrição e datas;
- paginação, loading, erro e vazio.

#### Estado atual

**Status: PARCIALMENTE_IMPLEMENTADO.** Lista, busca e detalhe em modal existem com mock. Banco e RLS de leitura existem. Não há endpoint, paginação, filtro ativa/inativa ou estados assíncronos.

#### Atividades técnicas

| Atividade | Esforço total | Esforço restante |
|---|---:|---:|
| Frontend | 6 h | 2 h |
| Backend e filtros | 4 h | 4 h |
| Banco | 1 h | 0 h |
| Testes | 3 h | 2 h |
| **Total** | **14 h** | **8 h** |

#### Regras

- categorias são globais, não pertencem a uma empresa;
- categorias inativas continuam visíveis no histórico.

#### Dependências

**Depende de:** autenticação e API.

**É pré-requisito para:** lançamento e correção de faturamento.

#### Complexidade

**BAIXA.** Consulta simples com pouca regra própria.

#### Observações

O mock de formulários oferece somente categorias ativas; detalhes históricos usam a lista completa, comportamento coerente com o domínio.

### 6.2 Componente: Cadastro, alteração permitida e desativação

#### Objetivo

Criar categorias e encerrar seu uso sem alterar a classificação histórica de lançamentos existentes.

#### Escopo

- cadastro de nome e descrição;
- edição enquanto ainda não utilizada;
- ativação/inativação;
- detecção de nome duplicado;
- bloqueio de alteração de significado quando utilizada;
- mensagens de domínio e confirmação.

#### Estado atual

**Status: PARCIALMENTE_IMPLEMENTADO.** Formulário mock e estrutura do banco existem. Trigger protege nome/descrição e exclusão de categoria utilizada. Não há endpoint, edição, desativação efetiva ou mensagem específica para a trava histórica.

#### Atividades técnicas

| Atividade | Esforço total | Esforço restante |
|---|---:|---:|
| Frontend | 7 h | 4 h |
| Backend | 6 h | 6 h |
| Banco e proteção histórica | 4 h | 1 h |
| Regras/validações | 2 h | 1 h |
| Testes | 3 h | 3 h |
| **Total** | **22 h** | **15 h** |

#### Regras

- apenas categoria ativa pode classificar lançamento novo;
- categoria utilizada não pode ser excluída nem ter nome/descrição alterados;
- desativação preserva consultas antigas;
- nome é único.

#### Dependências

**Depende de:** autenticação e API.

**É pré-requisito para:** faturamentos.

#### Complexidade

**MÉDIA.** O cadastro é simples, mas a mutabilidade depende do uso histórico.

#### Observações

A regra permite alterar o campo `ativa` de categoria utilizada, o que viabiliza a desativação sem modificar seu significado.

---

## 7. Módulo: Competências

### 7.1 Componente: Criação, listagem e detalhe da competência

#### Objetivo

Representar o mês de apuração de cada empresa e fornecer o contexto para lançamentos, totais e conferência.

#### Escopo

- criar competência por empresa/ano/mês;
- listar por empresa e período;
- exibir status, sem movimento, totais e estoques;
- detalhe com lançamento ativo e histórico;
- impedir duplicidade e uso de empresa inativa;
- definir criação manual ou automática das competências.

#### Estado atual

**Status: PARCIALMENTE_IMPLEMENTADO.** A tabela, uniqueness, checks, FKs e validação de criação existem no banco. O formulário de faturamento possui quatro competências mock apenas como opções. Não existem página, API, fluxo de criação, listagem ou detalhe da competência.

#### Atividades técnicas

| Atividade | Esforço total | Esforço restante |
|---|---:|---:|
| Frontend: lista, criação e detalhe | 12 h | 12 h |
| Backend: endpoints, filtros e composição do detalhe | 8 h | 8 h |
| Banco e consultas | 6 h | 1 h |
| Regras/validações | 3 h | 1 h |
| Testes | 5 h | 4 h |
| **Total** | **34 h** | **26 h** |

#### Regras

- combinação empresa/ano/mês é única;
- mês fica entre 1 e 12;
- competência nasce `ABERTA`, sem metadados de fluxo;
- empresa deve existir e estar ativa;
- empresa, período e dados de criação são imutáveis.

#### Dependências

**Depende de:** empresas, usuários, autenticação e API.

**É pré-requisito para:** lançamento, sem movimento, conferência e relatórios.

#### Complexidade

**ALTA.** O detalhe agrega várias entidades, estados, totais e ações condicionais.

#### Observações

A documentação do frontend previa essas telas, mas elas não foram implementadas. A forma de geração mensal é uma decisão de escopo ainda aberta.

### 7.2 Componente: Marcação de competência sem movimento

#### Objetivo

Registrar formalmente que uma competência não teve faturamento e permitir que ela siga para conferência.

#### Escopo

- ação de marcar/desmarcar;
- confirmação e autoria;
- bloqueio quando há lançamento ativo;
- limpeza automática ao inserir lançamento antes da conferência;
- representação visual e histórico operacional adequado.

#### Estado atual

**Status: PARCIALMENTE_IMPLEMENTADO.** RPC `marcar_sem_movimento`, checks e interação automática com inserção de lançamento estão implementados no banco. Não existem endpoint, botão, confirmação, estado visual ou teste automatizado.

#### Atividades técnicas

| Atividade | Esforço total | Esforço restante |
|---|---:|---:|
| Frontend | 4 h | 4 h |
| Backend/RPC | 4 h | 4 h |
| Banco | 4 h | 1 h |
| Regras e erros | 2 h | 1 h |
| Testes | 2 h | 2 h |
| **Total** | **16 h** | **12 h** |

#### Regras

- somente `ABERTA` ou `REABERTA` permite alteração;
- sem movimento e lançamento ativo são mutuamente exclusivos;
- autoria e data são obrigatórias quando marcado;
- inserir lançamento limpa a marcação dentro da transação.

#### Dependências

**Depende de:** competência, usuário autenticado e API.

**É pré-requisito para:** iniciar conferência em mês sem lançamento.

#### Complexidade

**MÉDIA.** Interface pequena, mas com estado concorrente e efeitos no fluxo.

#### Observações

Não existe histórico próprio da marcação/desmarcação; apenas o estado atual e autor/data quando marcado são persistidos.

### 7.3 Componente: Fluxo de conferência e histórico de status

#### Objetivo

Conduzir a competência por abertura, conferência, eventual reabertura e finalização com rastreabilidade.

#### Escopo

- ações condicionadas ao estado;
- iniciar conferência;
- reabrir com justificativa;
- retornar à conferência;
- finalizar;
- gravar e consultar histórico;
- confirmações, mensagens e concorrência.

#### Estado atual

**Status: PARCIALMENTE_IMPLEMENTADO.** RPC `transicionar_competencia`, triggers de proteção e histórico imutável existem. Não há endpoint nem telas para o status, ações, justificativa ou timeline. O `HistoricoPage` atual mostra cancelamentos de lançamentos, não `historico_competencias`.

#### Atividades técnicas

| Atividade | Esforço total | Esforço restante |
|---|---:|---:|
| Frontend: ações, confirmações e timeline | 10 h | 10 h |
| Backend: endpoints e RPC | 7 h | 7 h |
| Banco: fluxo, histórico e concorrência | 9 h | 2 h |
| Regras/validações | 5 h | 2 h |
| Testes | 5 h | 5 h |
| **Total** | **36 h** | **26 h** |

#### Regras

- transições permitidas: `ABERTA → EM_CONFERENCIA`, `EM_CONFERENCIA → REABERTA`, `REABERTA → EM_CONFERENCIA`, `EM_CONFERENCIA → FINALIZADA`;
- iniciar conferência exige lançamento ativo ou sem movimento;
- reabertura exige justificativa;
- `FINALIZADA` é somente leitura no MVP;
- toda transição cria histórico atômico e imutável.

#### Dependências

**Depende de:** competência, lançamento/sem movimento e identidade do usuário.

**É pré-requisito para:** fechamento mensal e confiabilidade dos relatórios.

#### Complexidade

**MUITO_ALTA.** É uma máquina de estados com autorização, auditoria, concorrência e impacto direto sobre gravações financeiras.

#### Observações

Os metadados `conferencia_iniciada_*` guardam somente o início mais recente, enquanto o histórico preserva todas as transições. A finalidade exata desses campos deve ser mantida clara na API.

---

## 8. Módulo: Faturamentos

### 8.1 Componente: Criação do lançamento mensal

#### Objetivo

Registrar o lançamento consolidado da competência, com categoria, tipo, data, valor e estoques, após revisão explícita.

#### Escopo

- seleção de empresa, competência elegível e categoria ativa;
- tipo faturamento ou devolução/estorno;
- valor positivo, estoques não negativos e data dentro do mês;
- observação;
- revisão e confirmação de registro imutável;
- persistência e resposta de conflito;
- autoria pelo token.

#### Estado atual

**Status: PARCIALMENTE_IMPLEMENTADO.** O frontend possui formulário, máscara monetária, validações e modal de revisão sobre opções mock. Banco possui tabela, checks, FKs, triggers de estado/imutabilidade e índice de lançamento ativo único. Não há POST real, carregamento das opções, conversão contratual de valores, erros da API ou atualização das telas após salvar.

#### Atividades técnicas

| Atividade | Esforço total | Esforço restante |
|---|---:|---:|
| Frontend | 13 h | 5 h |
| Backend | 8 h | 8 h |
| Banco | 7 h | 1 h |
| Regras/validações e contrato monetário | 5 h | 3 h |
| Testes | 7 h | 7 h |
| **Total** | **40 h** | **24 h** |

#### Regras

- somente uma competência `ABERTA` ou `REABERTA` aceita lançamento;
- empresa, categoria e usuário devem estar ativos;
- data pertence ao ano/mês da competência;
- `valor > 0`; estoques `>= 0`;
- lançamento nasce `ATIVO` e seus dados de origem são imutáveis;
- no máximo um lançamento ativo por competência.

#### Dependências

**Depende de:** empresas, categorias, competências, autenticação e API.

**É pré-requisito para:** conferência, totais, dashboard e correção.

#### Complexidade

**MUITO_ALTA.** É o registro financeiro central, com imutabilidade, estado, múltiplas referências e risco de erro de valor.

#### Observações

`MoneyInput` mantém centavos inteiros, enquanto mocks e banco usam unidades monetárias decimais. O contrato deve converter explicitamente antes da API; sem isso, há risco de valor 100 vezes maior.

### 8.2 Componente: Listagem, filtros e detalhe do lançamento

#### Objetivo

Consultar registros ativos e cancelados com contexto de empresa, categoria, competência, valores, estoques e autoria.

#### Escopo

- filtros por empresa, competência, categoria e status;
- paginação/ordenação;
- detalhe completo;
- relação entre original e substituto;
- estados de loading, erro, vazio e não encontrado;
- consulta histórica de nomes mesmo quando cadastros estiverem inativos.

#### Estado atual

**Status: PARCIALMENTE_IMPLEMENTADO.** Listagem, filtros client-side, detalhe e links da cadeia existem com mock. Não há endpoint, joins/DTOs, paginação, carregamento ou tratamento de falha real.

#### Atividades técnicas

| Atividade | Esforço total | Esforço restante |
|---|---:|---:|
| Frontend | 10 h | 4 h |
| Backend | 6 h | 6 h |
| Banco/consultas | 3 h | 1 h |
| Testes | 5 h | 4 h |
| **Total** | **24 h** | **15 h** |

#### Regras

- cancelados permanecem visíveis e não entram nos totais;
- lançamento não possui edição;
- detalhe deve preservar autoria e relação da correção.

#### Dependências

**Depende de:** autenticação, API e cadastros relacionados.

**É pré-requisito para:** correção e histórico operacional.

#### Complexidade

**MÉDIA.** A leitura é direta, mas precisa compor entidades, histórico e filtros em escala.

#### Observações

O limite padrão da Data API local é 1.000 linhas. A listagem precisa de paginação antes de uso prolongado.

### 8.3 Componente: Cancelamento e substituição atômica

#### Objetivo

Corrigir um lançamento sem editar ou apagar o original, criando um único substituto ativo na mesma transação.

#### Escopo

- ação disponível somente em estado permitido;
- visualização imutável do original;
- motivo obrigatório;
- formulário completo do substituto;
- chamada única à RPC;
- atualização da cadeia e mensagens;
- proteção contra concorrência e repetição.

#### Estado atual

**Status: PARCIALMENTE_IMPLEMENTADO.** A RPC `cancelar_e_substituir_lancamento` e o constraint trigger diferido implementam a operação e a cadeia no banco. O detalhe mock representa uma correção já ocorrida, mas não existe botão, formulário/modal, endpoint ou integração para executá-la.

#### Atividades técnicas

| Atividade | Esforço total | Esforço restante |
|---|---:|---:|
| Frontend | 12 h | 12 h |
| Backend/RPC | 8 h | 8 h |
| Banco e concorrência | 10 h | 2 h |
| Regras/validações | 3 h | 1 h |
| Testes | 5 h | 5 h |
| **Total** | **38 h** | **28 h** |

#### Regras

- não existe cancelamento isolado;
- motivo é obrigatório;
- original deve estar ativo e a competência `ABERTA`/`REABERTA`;
- original e substituto pertencem à mesma competência;
- cada original tem no máximo um substituto direto;
- a cadeia é linear, sem ramificações;
- falha em qualquer etapa provoca rollback.

#### Dependências

**Depende de:** lançamento, competência reaberta/aberta, categoria e usuário ativo.

**É pré-requisito para:** histórico confiável e correção operacional.

#### Complexidade

**MUITO_ALTA.** Operação financeira imutável, concorrente e transacional, com alto impacto de erro.

#### Observações

O banco já usa locks e constraint diferida, o que reduz bastante o esforço restante, mas precisa de testes reais de concorrência e rollback.

### 8.4 Componente: Histórico de cancelamentos

#### Objetivo

Consultar correções, motivo, responsável, data e lançamento substituto.

#### Escopo

- consulta por empresa e competência;
- composição original/substituto;
- acesso ao detalhe;
- paginação e estados assíncronos.

#### Estado atual

**Status: PARCIALMENTE_IMPLEMENTADO.** Página e filtros mock existem. Não há endpoint nem view específica; a consulta deverá relacionar lançamento cancelado ao registro cujo `substitui_lancamento_id` aponta para ele.

#### Atividades técnicas

| Atividade | Esforço total | Esforço restante |
|---|---:|---:|
| Frontend | 7 h | 3 h |
| Backend | 5 h | 5 h |
| Banco/consulta | 2 h | 1 h |
| Testes | 4 h | 3 h |
| **Total** | **18 h** | **12 h** |

#### Regras

- histórico não apaga o original;
- somente registros cancelados com substituto entram nessa consulta;
- responsável e motivo devem ser exibidos.

#### Dependências

**Depende de:** cancelamento/substituição e consulta de lançamentos.

#### Complexidade

**MÉDIA.** Consulta histórica composta, sem escrita própria.

#### Observações

Não confundir esta página com o histórico de transições de competência; são trilhas distintas.

---

## 9. Módulo: Consultas gerenciais e dashboard

### 9.1 Componente: Controle de faturamento, totais e estoques

#### Objetivo

Apresentar por empresa e período os lançamentos, faturamento líquido/acumulado e estoques inicial/final.

#### Escopo

- seleção obrigatória da empresa;
- intervalo de competências;
- totais líquidos e acumulados;
- estoques do período;
- lançamentos ativos/cancelados;
- detalhamento por competência/categoria quando aplicável;
- consultas performáticas e consistentes com o banco.

#### Estado atual

**Status: PARCIALMENTE_IMPLEMENTADO.** A página calcula os dados mock no navegador. O banco oferece `vw_totais_categoria_competencia`, `vw_totais_competencia` e `vw_faturamento_acumulado`. Não há endpoint, integração, paginação ou definição final da semântica do intervalo.

#### Atividades técnicas

| Atividade | Esforço total | Esforço restante |
|---|---:|---:|
| Frontend | 11 h | 4 h |
| Backend e consultas | 7 h | 7 h |
| Banco/views | 6 h | 1 h |
| Regras de cálculo | 2 h | 1 h |
| Testes de valores e períodos | 4 h | 4 h |
| **Total** | **30 h** | **17 h** |

#### Regras

- somente lançamentos ativos participam dos totais;
- faturamento soma e devolução/estorno subtrai;
- acumulado é calculado cronologicamente por empresa;
- cancelados continuam consultáveis sem alterar o total;
- totais não são persistidos.

#### Dependências

**Depende de:** competências, lançamentos, views e API.

**É pré-requisito para:** acompanhamento gerencial e parte dos indicadores do dashboard.

#### Complexidade

**ALTA.** Cálculos financeiros, períodos, cancelamentos e estoques exigem precisão e testes de borda.

#### Observações

A página mock calcula “acumulado até a competência final”, independentemente da competência inicial. Essa semântica precisa ser confirmada.

### 9.2 Componente: Dashboard e competências que exigem atenção

#### Objetivo

Dar visão rápida de empresas ativas, competências por estado, movimentação do mês e pendências operacionais.

#### Escopo

- indicadores definidos na documentação;
- período de referência;
- lista de competências que exigem ação;
- navegação para detalhe/lançamento;
- loading, erro, vazio e atualização.

#### Estado atual

**Status: PARCIALMENTE_IMPLEMENTADO.** Layout e cards existem, mas valores são `—` e a seção de atenção é um placeholder. Não há consulta ou definição implementada de prioridade.

#### Atividades técnicas

| Atividade | Esforço total | Esforço restante |
|---|---:|---:|
| Frontend | 9 h | 7 h |
| Backend/agregações | 6 h | 6 h |
| Banco/consultas | 4 h | 2 h |
| Regras dos indicadores | 2 h | 2 h |
| Testes | 3 h | 3 h |
| **Total** | **24 h** | **20 h** |

#### Regras

- indicadores devem respeitar usuário ativo e dados reais;
- competências “que exigem atenção” precisam de critério funcional explícito;
- valores financeiros seguem as mesmas views/regras do controle.

#### Dependências

**Depende de:** empresas, competências, faturamentos, API e regras de período.

#### Complexidade

**MÉDIA.** Visualmente simples, mas agrega diversas consultas e uma regra de priorização ainda indefinida.

#### Observações

A documentação previa mais indicadores que os três cards atuais, incluindo finalizadas, sem movimento, líquido do mês e estoques.

---

## 10. Funcionalidades transversais

### 10.1 Componente: Layout, navegação, responsividade e acessibilidade

#### Objetivo

Fornecer uma experiência consistente e navegável em desktop e mobile.

#### Escopo

- shell, sidebar e cabeçalho móvel;
- rotas reais e links profundos;
- preservação de retorno e filtros;
- componentes compartilhados;
- responsividade de formulários/tabelas;
- acessibilidade de menu, modal, foco e teclado;
- paleta persistida.

#### Estado atual

**Status: PARCIALMENTE_IMPLEMENTADO.** Base visual, componentes, sidebar móvel, tabelas responsivas, estados vazios e paletas existem. Falta roteamento real, preservação de URL/filtros, foco completo em modais, identidade real do usuário e validação de acessibilidade em jornadas.

#### Atividades técnicas

| Atividade | Esforço total | Esforço restante |
|---|---:|---:|
| Layout e componentes reutilizáveis | 18 h | 5 h |
| Roteamento, deep links e navegação | 5 h | 5 h |
| Responsividade e acessibilidade | 4 h | 2 h |
| Testes e ajustes visuais | 3 h | 2 h |
| **Total** | **30 h** | **14 h** |

#### Regras

- estado visual não pode substituir autorização;
- telas de detalhe devem manter retorno coerente;
- informações essenciais permanecem acessíveis em telas pequenas.

#### Dependências

**Depende de:** arquitetura do frontend e autenticação.

**É pré-requisito para:** todas as telas.

#### Complexidade

**MÉDIA.** Há boa base pronta, mas roteamento e acessibilidade atravessam toda a aplicação.

#### Observações

O modal atual não implementa foco inicial, contenção de foco ou restauração explícita após fechar; isso deve ser tratado no componente compartilhado.

### 10.2 Componente: Camada de dados, integração da API e estados globais

#### Objetivo

Substituir mocks por contratos reais sem duplicar lógica de autenticação, erros e carregamento em cada tela.

#### Escopo

- cliente HTTP com URL de ambiente e Bearer token;
- serviços por domínio;
- schemas/DTOs compartilhados por contrato;
- cache/revalidação após mutações;
- loading, erro, retry e notificações;
- paginação, ordenação, debounce e query string;
- tratamento global de 401/403 e indisponibilidade.

#### Estado atual

**Status: PARCIALMENTE_IMPLEMENTADO.** Existem `VITE_API_URL` e clientes Supabase, mas não são consumidos. As páginas importam mocks diretamente, contrariando a própria estratégia documentada de `mockApi.js`. Não há cliente HTTP, serviços, cache ou estados globais.

#### Atividades técnicas

| Atividade | Esforço total | Esforço restante |
|---|---:|---:|
| Serviços e gerenciamento de consultas | 10 h | 10 h |
| Cliente HTTP, token e contratos | 6 h | 5 h |
| Loading, erros, retry e notificações | 8 h | 8 h |
| Paginação, filtros e query string | 4 h | 4 h |
| Testes da camada | 4 h | 4 h |
| **Total** | **32 h** | **31 h** |

#### Regras

- nenhuma operação crítica utiliza `service_role` no frontend;
- erros internos de SQL/credenciais não são exibidos;
- mutações invalidam dados derivados;
- filtros de produção são executados no servidor.

#### Dependências

**Depende de:** autenticação e contratos do backend.

**É pré-requisito para:** substituir todos os mocks.

#### Complexidade

**ALTA.** É uma dependência horizontal de todas as telas e concentra consistência de estado e erro.

#### Observações

A estratégia de leitura direta via Supabase versus leitura via Fastify deve ser decidida antes desta implementação.

### 10.3 Componente: Qualidade automatizada e documentação operacional

#### Objetivo

Evitar regressões nos fluxos financeiros e permitir operação/manutenção confiável.

#### Escopo

- configuração dos runners de teste;
- jornadas E2E críticas;
- regressão de migrations, RLS e RPCs compartilhadas;
- fixtures/seed de teste;
- documentação de API e execução operacional;
- integração dos checks ao CI.

#### Estado atual

**Status: PARCIALMENTE_IMPLEMENTADO.** ESLint, `node --check` e documentação de domínio são bons pontos de partida. Não existem testes, runner, cobertura, OpenAPI, seed de teste ou CI. A aplicação completa das migrations não está confirmada por teste reproduzível no repositório.

#### Atividades técnicas

| Atividade | Esforço total | Esforço restante |
|---|---:|---:|
| Infraestrutura de testes | 6 h | 5 h |
| Jornadas ponta a ponta | 10 h | 10 h |
| Regressão compartilhada de banco/RLS | 5 h | 5 h |
| Documentação técnica e operacional | 3 h | 2 h |
| **Total** | **24 h** | **22 h** |

#### Regras

- testes específicos de cada componente permanecem orçados no próprio componente;
- este item cobre somente infraestrutura e jornadas transversais;
- fluxos imutáveis e transacionais exigem testes de rollback e concorrência.

#### Dependências

**Depende de:** contratos estáveis, ambiente local reproduzível e seed.

**É pré-requisito para:** deploy seguro e evolução posterior.

#### Complexidade

**ALTA.** A criticidade vem da combinação de RLS, RPCs, estado e valores financeiros.

#### Observações

O check estático executado na análise passou, mas não valida comportamento, migrations ou integração.

---

## 11. Banco de dados

### 11.1 Tabelas e campos principais

| Tabela | Campos principais | Relacionamentos e integridade |
|---|---|---|
| `empresas` | `id`, `razao_social`, `nome_fantasia`, `cnpj`, `ativa`, timestamps | CNPJ único e com 14 dígitos; pai de competências |
| `usuarios` | `id`, `nome`, `email`, `cargo`, `ativo`, `ultimo_login_at`, timestamps | PK/FK 1:1 para `auth.users`; e-mail único |
| `categorias_faturamento` | `id`, `nome`, `descricao`, `ativa`, timestamps | Nome único; referenciada por lançamentos; significado protegido após uso |
| `competencias` | empresa, ano, mês, status, sem movimento, autores/datas de conferência/finalização, timestamps | Unique empresa/ano/mês; mês 1–12; metadados coerentes; dados base imutáveis |
| `historico_competencias` | competência, usuário, status anterior/novo, justificativa, data | Histórico imutável; reabertura justificada; status diferentes |
| `lancamentos_faturamento` | competência, categoria, criador, tipo, data, valor, estoques, observação, status, cancelamento, substituição, data | Valor positivo; estoques não negativos; data no mês; auto-FK; dados imutáveis; sem delete |

### 11.2 Enums e estados

- `status_competencia`: `ABERTA`, `EM_CONFERENCIA`, `REABERTA`, `FINALIZADA`;
- `status_lancamento`: `ATIVO`, `CANCELADO`;
- `tipo_lancamento`: `FATURAMENTO`, `DEVOLUCAO_ESTORNO`.

### 11.3 Relacionamentos

- uma empresa possui muitas competências;
- cada empresa possui no máximo uma competência por ano/mês;
- uma competência possui muitos eventos de histórico;
- uma competência pode possuir vários registros físicos de lançamento, porém no máximo um ativo;
- uma categoria classifica muitos lançamentos ao longo do tempo;
- um lançamento pode substituir exatamente um anterior, e um anterior só pode ser substituído diretamente uma vez;
- usuários são autores de criação, transição, sem movimento, finalização e cancelamento.

Todas as FKs usam `ON DELETE RESTRICT`, preservando registros referenciados.

### 11.4 Índices

Índices explícitos encontrados:

- competências por `empresa_id`;
- histórico por `competencia_id` e `usuario_id`;
- lançamentos por competência, categoria, criador e data de referência;
- índice único parcial `lancamentos_um_ativo_por_competencia_idx`;
- índices únicos implícitos de PK, CNPJ, e-mail, nome de categoria, empresa/ano/mês e `substitui_lancamento_id`.

Possíveis ajustes a validar com volume real:

- empresas por razão social/nome fantasia e busca de CNPJ;
- consultas compostas de competências por empresa/ano/mês/status;
- lançamentos por status e joins de histórico;
- estratégia `ILIKE`/unaccent ou full text para buscas.

### 11.5 Views e cálculos

- `vw_totais_categoria_competencia`: valores ativos por categoria e competência;
- `vw_totais_competencia`: total bruto, devoluções/estornos, líquido e estoques por competência, inclusive zeradas;
- `vw_faturamento_acumulado`: janela acumulada cronológica por empresa.

As views são `security_invoker`, portanto dependem das policies das tabelas base. Totais não são armazenados.

### 11.6 Funções, triggers e operações complexas

O banco implementa:

- atualização automática de `updated_at`;
- validação da criação e imutabilidade da competência;
- imutabilidade e bloqueio de exclusão do lançamento;
- proteção de categoria utilizada;
- bloqueio de alteração/exclusão do histórico;
- RPC de sem movimento;
- RPC de transição com histórico atômico;
- RPC de cancelamento/substituição atômica;
- constraint trigger diferido para validar a cadeia;
- sincronização de usuário do Auth;
- função RLS de usuário atual ativo.

### 11.7 Auditoria, histórico e exclusão lógica

- competências possuem histórico explícito de transições;
- lançamentos cancelados permanecem armazenados com autor/data/motivo e cadeia de substituição;
- empresas, usuários e categorias usam flag ativo/inativo;
- não há trilha genérica de auditoria para alterações em empresas, usuários e categorias;
- não há registro histórico de marcação/desmarcação de sem movimento;
- não há política implementada de retenção, arquivamento ou anonimização.

### 11.8 Lacunas e alertas do banco

1. `supabase/seed.sql` está vazio, impedindo bootstrap reproduzível e testes completos.
2. O documento de progresso registra que a aplicação final das migrations 20260810020200–20400 precisava ser confirmada; não há evidência automatizada posterior no repositório.
3. A migration que revoga `public.rls_auto_enable()` depende de função fornecida pelo ambiente Supabase, o que deve ser validado em todos os ambientes.
4. O modelo não valida dígitos verificadores de CNPJ.
5. O banco não garante continuidade entre `estoque_final` de um mês e `estoque_inicial` do seguinte; isso só deve ser adicionado se for regra real.
6. Um único lançamento ativo torna impossível registrar simultaneamente, na mesma competência, faturamento em uma categoria e devolução/estorno em outra. Essa é a maior decisão funcional pendente.

---

## 12. Infraestrutura e implantação

### 12.1 Componente: Ambientes, migrations, seed, segurança e backups

#### Objetivo

Tornar desenvolvimento, homologação e produção reproduzíveis e recuperáveis.

#### Escopo

- separar configurações de desenvolvimento, homologação e produção;
- gerir segredos fora do repositório;
- aplicar e validar migrations na ordem versionada;
- criar seed/fixtures sem dados reais;
- provisionar o primeiro administrador;
- definir backup, restauração, retenção e teste de recuperação.

#### Estado atual

**Status: PARCIALMENTE_IMPLEMENTADO.** Há `.env.example`, npm workspaces, Supabase CLI, configuração local e migrations. Faltam homologação/produção documentadas, seed, bootstrap do primeiro administrador, backup/restauração, gestão de segredos e validação automatizada das migrations.

#### Atividades técnicas

| Atividade | Esforço total | Esforço restante |
|---|---:|---:|
| Configuração de ambientes | 6 h | 3 h |
| Migrations, seed e bootstrap | 7 h | 4 h |
| Segurança, backup e restauração | 7 h | 6 h |
| Documentação operacional | 4 h | 3 h |
| Validação dos ambientes | 4 h | 4 h |
| **Total** | **28 h** | **20 h** |

#### Regras

- credenciais reais, tokens e backups não são versionados;
- migrations aplicadas não devem ser reescritas silenciosamente;
- seed de desenvolvimento/teste não contém dados reais de clientes;
- backup só é considerado operacional depois de uma restauração testada.

#### Dependências

**Depende de:** decisão de hospedagem e políticas operacionais.

**É pré-requisito para:** testes integrados, homologação e produção.

#### Complexidade

**ALTA.** Dados financeiros e Auth exigem segurança e recuperação verificável.

#### Observações

O backend escuta em `127.0.0.1`, adequado ao uso local, mas normalmente precisa de host configurável/`0.0.0.0` em contêiner ou plataforma de hospedagem.

### 12.2 Componente: Deploy, CI/CD, domínio e observabilidade

#### Objetivo

Publicar, monitorar e atualizar o sistema com rollback e rastreabilidade.

#### Escopo

- empacotar e publicar frontend e backend;
- configurar pipeline com checks, testes e migrations controladas;
- configurar DNS, HTTPS e segredos;
- centralizar logs e alertas;
- executar smoke tests e suportar rollback;
- documentar operação e resposta a incidentes.

#### Estado atual

**Status: NÃO_IMPLEMENTADO.** Não há artefatos de deploy, CI/CD, domínio, HTTPS, monitoramento, alertas, retenção de logs ou smoke tests. O logger padrão do Fastify existe apenas em runtime.

#### Atividades técnicas

| Atividade | Esforço total | Esforço restante |
|---|---:|---:|
| Hospedagem de frontend e backend | 10 h | 10 h |
| Pipeline CI/CD | 8 h | 8 h |
| Domínio, HTTPS e segredos | 6 h | 6 h |
| Logs, monitoramento e recuperação | 6 h | 6 h |
| Smoke test e rollback | 4 h | 4 h |
| **Total** | **34 h** | **34 h** |

#### Regras

- `service_role` permanece somente no ambiente protegido do backend;
- migrations de produção exigem ordem, log e procedimento de falha;
- logs não registram tokens, senhas ou chaves;
- publicação só avança após checks e smoke tests definidos.

#### Dependências

**Depende de:** testes, ambientes e escolha dos provedores.

**É pré-requisito para:** entrada em produção.

#### Complexidade

**ALTA.** Integra aplicação, banco, Auth, DNS, segredos e operação contínua.

#### Observações

O túnel Cloudflare autorizado no Vite é um recurso de acesso temporário ao desenvolvimento e não substitui arquitetura de produção, HTTPS, autenticação e monitoramento.

### 12.3 Custos externos potenciais

Sem atribuir preços, podem gerar custo recorrente:

- projeto Supabase hospedado: banco, Auth, API, logs, backups e eventual armazenamento;
- hospedagem do backend Node/Fastify;
- hospedagem/CDN do frontend;
- domínio e DNS;
- SMTP transacional para convite, recuperação de senha e notificações do Auth;
- monitoramento, alertas e retenção de logs;
- armazenamento adicional de backups;
- minutos/recursos de CI/CD;
- Cloudflare, caso seja escolhido para túnel, DNS, proxy ou proteção em produção.

O repositório não define provedores de produção nem permite calcular esses custos.

Separação operacional:

| Natureza | Itens |
|---|---|
| Desenvolvimento | scripts locais, configuração dos projetos, testes, pipeline e documentação |
| Configuração inicial | criação dos ambientes, segredos, domínio/DNS, HTTPS, migrations, primeiro administrador, monitoramento e backup inicial |
| Recorrente | Supabase, hospedagens, domínio, SMTP, logs/alertas, backups e recursos de CI/CD conforme uso |

---

## 13. Regras de negócio consolidadas

| Módulo | Regra | Onde identificada | Impacto e casos de borda |
|---|---|---|---|
| Empresas | CNPJ único, 14 dígitos; empresa inativa não recebe competência/lançamento | migration inicial e integridade | Duplicidade retorna conflito; validação fiscal completa não existe |
| Usuários | Apenas usuário interno ativo acessa/opera | migration de Auth/RLS e documentação | Inativação com sessão aberta deve resultar em 403; Auth e perfil precisam permanecer sincronizados |
| Categorias | Categoria é global e somente ativa entra em lançamento novo | modelo e triggers | Histórico pode referenciar categoria inativa |
| Categorias | Categoria utilizada não pode ser excluída nem ter nome/descrição alterados | `proteger_categoria_utilizada` | Desativação continua permitida; tentativa deve gerar mensagem de domínio |
| Competências | Uma competência por empresa/ano/mês; nasce aberta | constraints e `validar_nova_competencia` | Concorrência de criação deve virar 409 |
| Competências | Empresa/período/criação da competência são imutáveis | `proteger_dados_base_competencia` | Correção de período exigiria nova decisão/migração |
| Competências | Fluxo aceita somente quatro transições específicas | `transicionar_competencia` | Não há pulo de etapa; finalizada não reabre no MVP |
| Competências | Conferência exige lançamento ativo ou sem movimento | `transicionar_competencia` | Estado vazio sem marcação deve retornar 422 |
| Competências | Reabertura exige justificativa | RPC e check do histórico | Texto vazio após trim é inválido |
| Sem movimento | Não pode coexistir com lançamento ativo | RPC/check/trigger de lançamento | Inserir lançamento em aberta/reaberta limpa automaticamente a marcação |
| Histórico | Toda transição gera evento; histórico não pode ser editado/excluído | RPC e triggers | Reaberturas sucessivas devem manter toda a sequência |
| Lançamentos | Um único lançamento ativo por competência | índice único parcial e documentação | Decisão impede múltiplas categorias/tipos simultâneos no mês |
| Lançamentos | Valor positivo; estoques não negativos | checks e triggers | Zero é válido somente para estoques; frontend usa centavos internamente |
| Lançamentos | Data de referência pertence ao mês da competência | trigger e formulário | Considerar calendário e timezone somente na apresentação |
| Lançamentos | Faturamento soma; devolução/estorno subtrai | views e documentação | Todos os valores são armazenados positivos |
| Lançamentos | Campos de origem são imutáveis e delete físico é proibido | triggers | Correção só ocorre por cancelamento/substituição |
| Correção | Cancelamento isolado não existe; substituição é atômica | RPC e constraint diferida | Falha deve fazer rollback; original precisa estar ativo |
| Correção | Cadeia linear, mesmo período, sem ramificações | unique, FK e trigger | Repetição/concorrência deve ser testada |
| Segurança | Identidade operacional vem do token, não do request | contrato de integração do backend | Evita atribuição falsa de autoria |
| Totais | Somente ativos entram em totais; acumulado é cronológico; totais não persistem | três views | Cancelados não alteram valores; definição do intervalo precisa ser coerente |

### Comportamentos implícitos ou ambíguos

- Não está definido se o lançamento único é um valor consolidado de uma só categoria/tipo ou se o domínio precisa de vários itens mensais.
- Não está definido se estoque inicial deve ser igual ao estoque final da competência anterior.
- Não está definido se competências são abertas manualmente, em lote ou automaticamente.
- Não está definido quem pode administrar usuários e cadastros; hoje todos os usuários ativos têm o mesmo acesso conceitual.
- Não há regra versionada para alteração/exclusão de empresa ou usuário sem histórico, embora a documentação recomende preservar registros relacionados.
- Não há critério fechado para “competências que exigem atenção” no dashboard.

---

## 14. Pontos que precisam de definição

### 14.1 Granularidade do lançamento mensal

**Pergunta:** uma competência deve ter realmente apenas um lançamento consolidado, ou precisa comportar faturamento, devoluções/estornos e categorias diferentes no mesmo mês?

**Por que importa:** o índice único atual impede mais de um ativo, embora o modelo mantenha categoria, tipo e views de soma por categoria. Alterar isso afeta banco, RPCs, formulários, totais e correção.

**Impacto provável: ALTO.**

### 14.2 Geração de competências

**Pergunta:** competências serão criadas manualmente, automaticamente a cada mês, em lote para empresas ativas ou sob demanda no primeiro lançamento?

**Por que importa:** define telas, jobs, prevenção de duplicidade, tratamento de empresas recém-ativadas e volume operacional.

**Impacto provável: ALTO.**

### 14.3 Provisionamento e recuperação de usuários

**Pergunta:** o novo usuário recebe senha temporária informada pelo administrador, convite por e-mail ou link de definição de senha? Haverá recuperação de senha na aplicação?

**Por que importa:** altera API administrativa, SMTP, segurança, UX e testes.

**Impacto provável: ALTO.**

### 14.4 Permissões

**Pergunta:** todo usuário ativo poderá cadastrar, corrigir, reabrir e finalizar, ou haverá papéis como administrador, lançador e conferente?

**Por que importa:** hoje `cargo` é apenas informativo e RLS permite leitura ampla. RBAC exigiria modelo, policies, middleware e UI condicional.

**Impacto provável: ALTO.**

### 14.5 Manutenção dos cadastros

**Pergunta:** quais campos de empresa e usuário podem ser editados e quem pode ativar/inativar? Uma categoria ainda não utilizada pode ser excluída ou somente inativada?

**Por que importa:** a documentação menciona edição, mas as telas e o contrato de endpoints não estão completos.

**Impacto provável: MÉDIO.**

### 14.6 Validação de CNPJ

**Pergunta:** basta exigir 14 dígitos ou o sistema deve validar dígitos verificadores e rejeitar sequências inválidas?

**Por que importa:** altera validação compartilhada, mensagens e testes; o estado atual aceita qualquer sequência de 14 dígitos.

**Impacto provável: MÉDIO.**

### 14.7 Continuidade de estoque

**Pergunta:** o estoque inicial de um mês deve obrigatoriamente coincidir com o estoque final do mês anterior?

**Por que importa:** não existe essa regra no banco. Se obrigatória, afeta lançamento, reabertura, correção em cadeia e competências posteriores.

**Impacto provável: ALTO.**

### 14.8 Semântica do acumulado e períodos

**Pergunta:** ao filtrar início e fim, o acumulado deve começar no início selecionado ou representar todo o histórico até o fim?

**Por que importa:** a UI mock usa todo o histórico até o fim; usuários podem esperar acumulado apenas do intervalo.

**Impacto provável: MÉDIO.**

### 14.9 Indicadores e pendências do dashboard

**Pergunta:** qual competência é o período padrão e o que exatamente caracteriza “exige atenção”?

**Por que importa:** sem critérios não é possível fechar queries, ordenação ou alertas.

**Impacto provável: MÉDIO.**

### 14.10 Auditoria adicional

**Pergunta:** é necessário auditar alterações de empresas, usuários, categorias, sem movimento e tentativas de acesso, além dos históricos já existentes?

**Por que importa:** auditoria genérica adiciona tabelas, triggers/eventos, consultas e retenção.

**Impacto provável: ALTO.**

### 14.11 Volume, paginação e retenção

**Pergunta:** quantas empresas, usuários e anos de lançamentos são esperados, e por quanto tempo os dados permanecerão online?

**Por que importa:** define índices, limites, paginação, arquivamento e estratégia de backup.

**Impacto provável: MÉDIO.**

### 14.12 Produção, backup e disponibilidade

**Pergunta:** quais ambientes, provedor, frequência de backup, RPO/RTO e janela de manutenção são exigidos?

**Por que importa:** muda infraestrutura, automação, monitoramento e custos recorrentes.

**Impacto provável: ALTO.**

### 14.13 Exportações e integrações

**Pergunta:** serão exigidos Excel/PDF, importação em lote, notas fiscais ou integração com sistema contábil/ERP?

**Por que importa:** nada disso existe no modelo atual e **não está incluído nas 550 h**. Cada integração pode ampliar substancialmente o escopo.

**Impacto provável: ALTO.**

### 14.14 Estratégia de leitura

**Pergunta:** o frontend fará leituras diretamente no Supabase com RLS ou todas as operações passarão pelo Fastify?

**Por que importa:** define contratos, paginação, cache, segurança, logs e responsabilidade pelas consultas.

**Impacto provável: MÉDIO.**

---

## 15. Riscos

| Risco | Nível | Evidência | Efeito possível em horas/prazo |
|---|---|---|---|
| Regra de lançamento único não atender ao uso real de categorias e estornos | ALTO | Índice único versus campos/totais por categoria e tipo | Pode exigir redesenho transversal de banco, API e telas |
| Backend e autenticação ainda ausentes | ALTO | Somente `/health`; sem middleware/rotas | Grande parte do esforço restante está no caminho crítico |
| Frontend acoplado diretamente a mocks | ALTO | Imports de arrays em cada página; sem service layer | Integração exigirá alterar todas as telas e estados |
| Unidade monetária inconsistente entre `MoneyInput`, mocks e banco | ALTO | Centavos no formulário; decimal em banco/mocks | Pode gravar valores 100x incorretos se o contrato não for explícito |
| Migrations sem suíte reproduzível e aplicação final não comprovada | ALTO | Seed vazio e registro de progresso pendente | Erros podem aparecer tardiamente em homologação |
| Ausência completa de testes comportamentais | ALTO | Nenhum arquivo de teste | Regressões em imutabilidade, RLS e cálculos podem aumentar retrabalho |
| Permissões por função não definidas | ALTO | `cargo` informativo; leitura ampla para ativos | Decisão tardia pode alterar banco, middleware e UI |
| Deploy, backup e observabilidade inexistentes | ALTO | Nenhum artefato ou política | Produção não pode ser considerada pronta ao terminar apenas as telas |
| Criação de usuário atravessa Auth e perfil público | MÉDIO | Trigger sync; nenhum endpoint admin | Falhas parciais, convite/senha e e-mail exigem desenho seguro |
| Falta de paginação/índices de busca | MÉDIO | Filtros client-side; Data API limitada a 1.000 | Queda de desempenho e retrabalho com crescimento da base |
| Auditoria incompleta para cadastros e sem movimento | MÉDIO | Histórico cobre status e correção, não todo o sistema | Pode frustrar requisito contábil descoberto tarde |
| Navegação sem URL | MÉDIO | Estado local em `App.jsx` | Sessões, links, retorno e suporte ao usuário ficam frágeis |
| Documentação de progresso parcialmente desatualizada | BAIXO | Registro anterior à UI atual | Pode gerar decisões baseadas em status antigo, mas é simples de corrigir |

---

## 16. Itens possivelmente esquecidos

Itens relevantes que ainda não estão cobertos de forma funcional completa:

- login, logout real, sessão expirada e recuperação de senha;
- bootstrap do primeiro administrador;
- confirmação e mensagens para ativar/inativar cadastros;
- edição de empresa e usuário;
- fluxo visual completo de competência;
- loading, retry e erro de API em todas as telas;
- atualização/invalidação das listas após mutações;
- paginação, ordenação e debounce server-side;
- preservação de filtros e URLs compartilháveis;
- mensagens seguras para SQLSTATE conhecidos;
- tratamento de registros alterados por outro usuário;
- conversão e arredondamento monetário explícitos;
- validação de timezone para datas e timestamps;
- foco e teclado nos modais;
- auditoria de alterações cadastrais, se exigida;
- logs sem tokens, senhas ou chaves;
- testes de concorrência e rollback das RPCs;
- testes de RLS com usuário ativo, inativo e anônimo;
- seed/fixtures de desenvolvimento e teste;
- documentação OpenAPI e procedimentos operacionais;
- CI/CD, homologação, smoke test, rollback, backup e restauração;
- alertas de indisponibilidade e retenção de logs;
- política de exportação/integração, explicitamente fora da estimativa até definição.

---

## 17. Resumo de horas por componente

| Módulo | Componente | Status | Complexidade | Horas do sistema | Horas restantes |
|---|---|---|---|---:|---:|
| Acesso e usuários | Autenticação, sessão e acesso | PARCIALMENTE_IMPLEMENTADO | ALTA | 30 | 25 |
| Acesso e usuários | Administração de usuários | PARCIALMENTE_IMPLEMENTADO | ALTA | 34 | 26 |
| Empresas | Listagem, busca e detalhe | PARCIALMENTE_IMPLEMENTADO | MÉDIA | 18 | 11 |
| Empresas | Cadastro, edição e situação | PARCIALMENTE_IMPLEMENTADO | MÉDIA | 24 | 17 |
| Categorias | Listagem e detalhe | PARCIALMENTE_IMPLEMENTADO | BAIXA | 14 | 8 |
| Categorias | Cadastro, alteração e desativação | PARCIALMENTE_IMPLEMENTADO | MÉDIA | 22 | 15 |
| Competências | Criação, listagem e detalhe | PARCIALMENTE_IMPLEMENTADO | ALTA | 34 | 26 |
| Competências | Sem movimento | PARCIALMENTE_IMPLEMENTADO | MÉDIA | 16 | 12 |
| Competências | Fluxo e histórico de status | PARCIALMENTE_IMPLEMENTADO | MUITO_ALTA | 36 | 26 |
| Faturamentos | Criação do lançamento | PARCIALMENTE_IMPLEMENTADO | MUITO_ALTA | 40 | 24 |
| Faturamentos | Listagem e detalhe | PARCIALMENTE_IMPLEMENTADO | MÉDIA | 24 | 15 |
| Faturamentos | Cancelamento e substituição | PARCIALMENTE_IMPLEMENTADO | MUITO_ALTA | 38 | 28 |
| Faturamentos | Histórico de cancelamentos | PARCIALMENTE_IMPLEMENTADO | MÉDIA | 18 | 12 |
| Consultas e dashboard | Controle, totais e estoques | PARCIALMENTE_IMPLEMENTADO | ALTA | 30 | 17 |
| Consultas e dashboard | Dashboard e pendências | PARCIALMENTE_IMPLEMENTADO | MÉDIA | 24 | 20 |
| Transversal | Layout, navegação e acessibilidade | PARCIALMENTE_IMPLEMENTADO | MÉDIA | 30 | 14 |
| Transversal | Camada de dados e estados globais | PARCIALMENTE_IMPLEMENTADO | ALTA | 32 | 31 |
| Transversal | Qualidade e documentação operacional | PARCIALMENTE_IMPLEMENTADO | ALTA | 24 | 22 |
| Infraestrutura | Ambientes, migrations e backups | PARCIALMENTE_IMPLEMENTADO | ALTA | 28 | 20 |
| Infraestrutura | Deploy, CI/CD e observabilidade | NÃO_IMPLEMENTADO | ALTA | 34 | 34 |
| **Total** |  |  |  | **550** | **403** |

---

## 18. Resumo de horas por módulo

| Módulo | Horas estimadas do sistema | Horas restantes |
|---|---:|---:|
| Acesso e usuários | 64 | 51 |
| Empresas | 42 | 28 |
| Categorias | 36 | 23 |
| Competências | 86 | 64 |
| Faturamentos | 120 | 79 |
| Consultas gerenciais e dashboard | 54 | 37 |
| Funcionalidades transversais | 86 | 67 |
| Infraestrutura e implantação | 62 | 54 |
| **Total** | **550** | **403** |

---

## 19. Esforço total do sistema

**Total estimado de horas do projeto desde o início: 550 horas.**

Esse total representa o esforço equivalente para entregar o escopo identificado em condição utilizável e implantável, incluindo as partes já existentes. Não é uma medição do tempo histórico efetivamente gasto pelos autores do repositório.

Distribuição aproximada do sistema completo:

- domínio de negócio — empresas, categorias, competências, faturamentos e consultas: 338 h;
- acesso e usuários: 64 h;
- funcionalidades transversais: 86 h;
- infraestrutura e implantação: 62 h.

Não há contingência percentual adicionada. Caso as decisões de alta relevância alterem o escopo, deve-se recalcular os componentes afetados.

---

## 20. Esforço restante

**Total estimado de esforço restante: 403 horas.**

O equivalente a aproximadamente 147 h já está materializado em modelo, migrations, documentação, estrutura visual, componentes e telas mock. Esse crédito não significa que as funcionalidades estejam prontas: o maior bloco restante é a transformação da demonstração em aplicação integrada, autenticada, testada e implantável.

Ordem técnica recomendada para reduzir risco:

1. fechar as decisões de lançamento único, competência, estoque, usuários e permissões;
2. validar todas as migrations em reset limpo e criar seed/testes de banco;
3. implementar autenticação e camada de API;
4. integrar cadastros básicos;
5. implementar competências e máquina de estados;
6. integrar lançamento e correção atômica;
7. integrar consultas/dashboard;
8. concluir testes E2E, segurança, homologação e deploy.

---

## 21. Conclusão

O projeto possui uma base de domínio acima do comum para um MVP inicial: as migrations já registram regras difíceis de acrescentar tardiamente, como imutabilidade, histórico e transações de correção. A interface também oferece um ponto de partida visual consistente e responsivo.

O orçamento, contudo, não deve tratar o sistema como quase concluído. Hoje ele é uma demonstração navegável apoiada por um banco bem especificado, mas sem o elo operacional entre usuário, API e persistência. Autenticação real, endpoints, competências, correção visual, estados assíncronos, testes e produção concentram a maior parte das 403 horas restantes.

A decisão mais importante antes de contratar a conclusão é confirmar se “um lançamento ativo por competência” representa corretamente o processo contábil. Com essa premissa confirmada e sem novas integrações ou relatórios exportáveis, **550 h de esforço total e 403 h restantes** constituem a base técnica deste orçamento.
