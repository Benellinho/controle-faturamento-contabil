# Progresso 03 — Mapa de implementação do protótipo P0

**Planejado em:** 21/08/2026  
**Objetivo:** implementar e validar o fluxo mínimo de lançamentos e substituições  
**Referências:** `docs/modelo-p0.md`, `docs/Banco/modelo-p0.md` e `docs/Endpoints/modelo-endpoints-p0.md`

## 1. Resultado esperado

Entregar um protótipo integrado no qual seja possível:

1. listar lançamentos;
2. filtrar por empresa, categoria, data e status;
3. criar um lançamento `ATIVO`;
4. consultar todos os dados do lançamento;
5. substituir um lançamento ativo, com motivo obrigatório;
6. preservar o registro original como `SUBSTITUIDO`;
7. navegar entre o lançamento anterior e o substituto direto.

O P0 estará concluído quando esse fluxo funcionar de ponta a ponta entre frontend, API Fastify e banco Supabase local.

## 2. Limite do protótipo

### Incluído

- empresas, com nome e CNPJ, e categorias previamente cadastradas;
- listagem e filtros básicos;
- criação e consulta de lançamentos;
- substituição transacional;
- status `ATIVO` e `SUBSTITUIDO`;
- navegação simples pelo histórico da cadeia;
- estados de carregamento, vazio, sucesso e erro.

### Fora do P0

- login, usuários e permissões;
- dashboard e indicadores;
- cadastro de empresas e categorias pela interface;
- competências, conferência, fechamento e reabertura;
- estoque inicial e final;
- tipo de lançamento;
- cancelamento sem substituição;
- edição e exclusão;
- paginação, busca avançada, anexos e importações.

Esses itens podem continuar visualmente no repositório durante a transição, mas não devem bloquear nem ampliar a implementação do protótipo.

## 3. Estado atual identificado

### Já disponível

- frontend React/Vite com layout, tema e componentes reutilizáveis;
- telas mock de listagem, formulário e detalhes de faturamentos;
- formatadores de moeda e data;
- estrutura modular do backend para empresas, categorias e lançamentos;
- cliente administrativo do Supabase no backend;
- migration `20260821000000_recriar_schema_public_p0.sql` com as tabelas do P0;
- contrato de endpoints e regras do P0 documentados.

### Lacunas para fechar

- os arquivos dos módulos P0 do backend ainda são esqueletos;
- as rotas P0 ainda não são registradas em `backend/src/server.js`;
- o frontend ainda consome arrays em `frontend/src/mocks`;
- formulário e detalhes ainda exibem campos do MVP antigo;
- a interface usa `CANCELADO`, enquanto o P0 define `SUBSTITUIDO`;
- não existe ainda a tela/fluxo funcional de substituição;
- falta confirmar o seed P0 e a aplicação limpa da migration;
- faltam testes do contrato e do fluxo integrado.

## 4. Ordem de implementação

As etapas devem ser executadas na ordem abaixo. Cada etapa só avança depois de cumprir sua validação mínima.

### Etapa 1 — Congelar o contrato do P0

Objetivo: evitar que regras do MVP antigo entrem na implementação do protótipo.

Passos:

1. adotar `docs/modelo-p0.md` como fonte funcional do P0;
2. adotar `docs/Banco/modelo-p0.md` como contrato do banco;
3. adotar `docs/Endpoints/modelo-endpoints-p0.md` como contrato HTTP;
4. usar apenas os status `ATIVO` e `SUBSTITUIDO`;
5. confirmar que não existirão rotas `PUT`, `PATCH` ou `DELETE` para lançamentos;
6. registrar qualquer mudança de regra primeiro nos três documentos de referência.

Validação da etapa:

- banco, API e frontend usam os mesmos nomes de campos e status;
- nenhum campo de competência, estoque ou cancelamento aparece no contrato P0.

### Etapa 2 — Preparar o banco P0 e os dados de demonstração

Objetivo: obter uma base local reproduzível para desenvolver a API.

Arquivos principais:

```text
supabase/migrations/20260821000000_recriar_schema_public_p0.sql
supabase/seed.sql
```

Passos:

1. revisar a migration destrutiva e confirmar que ela será usada somente no ambiente local do protótipo;
2. ajustar `supabase/seed.sql` ao novo schema P0;
3. inserir pelo menos três empresas, com CNPJs válidos e distintos, e categorias pertencentes a empresas diferentes;
4. manter a tabela de lançamentos inicialmente vazia, pois seus dados serão criados pelo fluxo da aplicação;
5. recriar o banco local e conferir tabelas, chaves estrangeiras, índices e dados;
6. documentar que migrations anteriores do MVP são substituídas pelo schema P0 no ambiente recriado.

Validação da etapa:

- `supabase db reset` termina sem erro;
- empresas, com seus CNPJs, categorias e lançamentos do seed podem ser consultados;
- empresas e categorias ficam disponíveis para a criação dos primeiros lançamentos;
- `anon` e `authenticated` não acessam diretamente as tabelas.

### Etapa 3 — Implementar a leitura no backend

Objetivo: disponibilizar as consultas necessárias antes das operações de escrita.

Arquivos principais:

```text
backend/src/modules/p0/empresas/*
backend/src/modules/p0/categorias/*
backend/src/modules/p0/lancamentos/*
backend/src/server.js
```

Passos:

1. implementar `GET /api/empresas`, retornando nome e CNPJ e ordenando por nome;
2. implementar `GET /api/empresas/:empresaId/categorias`;
3. retornar `404` quando a empresa não existir;
4. implementar `GET /api/lancamentos` com filtros opcionais de empresa, categoria, data e status;
5. ordenar a listagem por data e ID decrescentes;
6. implementar `GET /api/lancamentos/:id`;
7. consultar no detalhe o lançamento anterior e o substituto direto;
8. separar responsabilidade entre rota, schema, controller, service e repository;
9. registrar todas as rotas P0 em `backend/src/server.js` com prefixo `/api`;
10. padronizar os erros no formato `{ erro: { codigo, mensagem } }`.

Validação da etapa:

- todas as quatro consultas respondem conforme o contrato;
- filtros isolados e combinados retornam o resultado esperado;
- consulta sem resultado retorna lista vazia;
- ID inexistente retorna `404`;
- parâmetros inválidos retornam `400`.

### Etapa 4 — Implementar a criação de lançamento

Objetivo: criar registros imutáveis e válidos.

Passos:

1. implementar `POST /api/lancamentos`;
2. validar empresa, categoria, data e valor obrigatórios;
3. validar valor maior que zero;
4. validar que a categoria pertence à empresa;
5. rejeitar campos de controle enviados pelo cliente;
6. criar todo lançamento comum com status `ATIVO`;
7. manter campos de substituição nulos;
8. retornar o registro criado com HTTP `201`;
9. garantir que a API não ofereça edição nem exclusão.

Validação da etapa:

- criação válida persiste um registro `ATIVO`;
- categoria de outra empresa é rejeitada;
- valor zero ou negativo é rejeitado;
- payload incompleto ou com campos reservados é rejeitado;
- falhas não criam registros parciais.

### Etapa 5 — Implementar a substituição transacional

Objetivo: corrigir dados sem editar ou excluir o original.

Passos:

1. implementar `POST /api/lancamentos/:id/substituir`;
2. buscar o original e exigir status `ATIVO`;
3. manter obrigatoriamente a empresa do registro original;
4. validar a nova categoria, data, valor e motivo;
5. iniciar uma transação no PostgreSQL;
6. criar o substituto `ATIVO` apontando para o original;
7. alterar o original para `SUBSTITUIDO` apenas se ele ainda estiver `ATIVO`;
8. confirmar que exatamente um original foi atualizado;
9. desfazer integralmente a operação em qualquer falha;
10. retornar os IDs do original e do novo lançamento com HTTP `201`;
11. retornar `409` ao tentar substituir um registro já substituído.

Decisão técnica obrigatória:

> A substituição não deve ser feita com duas chamadas independentes do cliente Supabase. Usar função PostgreSQL/RPC ou outra operação de backend que garanta uma única transação.

Validação da etapa:

- o original permanece armazenado e sem alteração nos dados de negócio;
- apenas seu status e `substituido_em` mudam;
- o novo registro nasce `ATIVO` e aponta para o anterior;
- motivo vazio é rejeitado;
- uma falha provocada confirma o rollback;
- uma cadeia com três lançamentos permanece linear.

### Etapa 6 — Criar a camada de API do frontend

Objetivo: retirar o acesso direto aos mocks das telas P0.

Estrutura sugerida:

```text
frontend/src/services/
├── api.js
├── empresasApi.js
└── lancamentosApi.js
```

Passos:

1. definir `VITE_API_URL` no exemplo de ambiente do frontend;
2. criar um cliente HTTP central com tratamento de JSON e erros;
3. implementar funções para os seis endpoints do P0;
4. converter filtros em query string sem enviar valores vazios;
5. normalizar a mensagem de erro retornada pela API;
6. impedir que componentes importem diretamente `frontend/src/mocks` para o fluxo P0;
7. manter os mocks somente como referência visual temporária até a integração terminar.

Validação da etapa:

- cada função da camada de serviço chama a rota correta;
- erro HTTP não é tratado como sucesso;
- telas não precisam conhecer URL, headers ou formato bruto do erro.

### Etapa 7 — Ajustar a navegação e a listagem do frontend

Objetivo: transformar a listagem mock na entrada principal do protótipo.

Arquivos principais:

```text
frontend/src/App.jsx
frontend/src/pages/Faturamentos/FaturamentosPage.jsx
frontend/src/components/table/*
```

Passos:

1. definir a listagem de lançamentos como fluxo principal do P0;
2. carregar empresas e lançamentos pela API;
3. carregar categorias conforme a empresa selecionada;
4. implementar filtros por empresa, categoria, data e status;
5. limpar a categoria quando a empresa mudar;
6. aplicar os filtros pela API;
7. substituir o status visual `CANCELADO` por `SUBSTITUIDO`;
8. remover da tabela os campos de competência e estoque;
9. manter data, empresa com CNPJ, categoria, valor, status e ação de visualizar;
10. incluir estados de carregamento, vazio e falha com opção de tentar novamente;
11. manter formatação `pt-BR` sem alterar o valor numérico enviado à API.

Validação da etapa:

- a listagem funciona sem importar os arrays mock;
- todos os filtros refletem os resultados da API;
- linhas `SUBSTITUIDO` têm identificação visual consistente;
- clicar em uma linha abre o ID correto.

### Etapa 8 — Ajustar o formulário de novo lançamento

Objetivo: criar lançamentos reais seguindo somente o contrato P0.

Arquivos principais:

```text
frontend/src/pages/Faturamentos/NovoFaturamento.jsx
frontend/src/pages/Faturamentos/components/FaturamentoForm.jsx
```

Passos:

1. manter apenas empresa identificada por nome e CNPJ, categoria, data, valor e observação;
2. remover competência, tipo e estoques do formulário P0;
3. carregar empresas pela API;
4. carregar categorias depois da seleção da empresa;
5. bloquear categoria enquanto não houver empresa;
6. validar obrigatoriedade, data e valor positivo no cliente;
7. enviar o payload para `POST /api/lancamentos`;
8. desabilitar o envio enquanto a requisição estiver em andamento;
9. mostrar mensagens de validação e falha da API;
10. redirecionar para o detalhe do registro criado após sucesso.

Validação da etapa:

- o formulário não envia campos fora do contrato;
- duplo clique não cria dois registros;
- o lançamento criado aparece na consulta e na listagem;
- cancelar retorna à listagem sem gravar dados.

### Etapa 9 — Implementar detalhe e substituição no frontend

Objetivo: completar o fluxo principal e o histórico navegável.

Arquivos principais:

```text
frontend/src/pages/Faturamentos/FaturamentoDetails.jsx
frontend/src/pages/Faturamentos/SubstituirFaturamento.jsx
frontend/src/pages/Faturamentos/components/FaturamentoForm.jsx
frontend/src/App.jsx
```

Passos:

1. buscar o detalhe por ID na API;
2. exibir empresa com CNPJ, categoria, data, valor, observação, status e datas de controle;
3. não apresentar ações de editar ou excluir;
4. mostrar `Substituir lançamento` somente quando o status for `ATIVO`;
5. criar a rota/tela interna de substituição;
6. manter empresa somente para leitura;
7. preencher categoria, data, valor e observação com os dados atuais;
8. exigir motivo de substituição;
9. pedir confirmação antes do envio definitivo;
10. chamar o endpoint transacional;
11. abrir o novo lançamento depois do sucesso;
12. exibir `Ver lançamento anterior` quando houver anterior;
13. exibir `Ver próximo lançamento` quando houver substituto direto;
14. tratar `404` e `409` com mensagens específicas.

Validação da etapa:

- um `SUBSTITUIDO` não oferece nova substituição;
- anterior e próximo abrem os IDs corretos;
- atualizar a página mantém os dados persistidos;
- o motivo aparece no histórico conforme o contrato.

### Etapa 10 — Simplificar a experiência para demonstração

Objetivo: impedir que telas fora do escopo confundam a validação do P0.

Passos:

1. reduzir a navegação principal aos lançamentos necessários para a demonstração;
2. ocultar ou marcar claramente como futura qualquer tela de dashboard, usuários, competências, empresas e categorias;
3. revisar textos que ainda mencionem estoque, cancelamento, conferência ou faturamento mensal;
4. preservar o padrão visual já existente;
5. conferir uso por teclado, foco de modal, labels e mensagens;
6. conferir a interface em desktop e tela estreita.

Validação da etapa:

- o avaliador consegue executar o cenário do P0 sem entrar em telas incompletas;
- textos e ações correspondem à regra de imutabilidade;
- não existe uma ação visual que a API não suporte.

### Etapa 11 — Testar o protótipo de ponta a ponta

Objetivo: comprovar o critério de aceite com evidências reproduzíveis.

#### Banco e API

- [ ] banco local recriado sem erro;
- [ ] seed aplicado;
- [ ] listar empresas;
- [ ] confirmar nome e CNPJ formatado nas seleções, listagem e detalhes;
- [ ] listar categorias de uma empresa;
- [ ] listar lançamentos sem filtros;
- [ ] combinar os quatro filtros;
- [ ] consultar detalhe existente e inexistente;
- [ ] criar lançamento válido;
- [ ] rejeitar campos obrigatórios ausentes;
- [ ] rejeitar categoria de outra empresa;
- [ ] rejeitar valor igual ou menor que zero;
- [ ] substituir lançamento ativo;
- [ ] exigir motivo;
- [ ] rejeitar nova substituição do original;
- [ ] comprovar rollback em falha;
- [ ] validar cadeia com três lançamentos.

#### Frontend

- [ ] carregar listagem e filtros pela API;
- [ ] exibir carregamento, vazio e erro;
- [ ] criar lançamento pelo formulário;
- [ ] abrir o detalhe após criar;
- [ ] substituir e abrir o novo registro;
- [ ] navegar para o anterior e retornar ao próximo;
- [ ] confirmar ausência de editar e excluir;
- [ ] validar valores e datas em `pt-BR`;
- [ ] validar responsividade e navegação por teclado.

#### Verificações do repositório

- [ ] executar `npm run lint:frontend`;
- [ ] executar `npm run check:backend`;
- [ ] executar `git diff --check`;
- [ ] confirmar que nenhum `.env`, token ou `service_role` foi versionado;
- [ ] não executar `npm run build` no frontend;
- [ ] não realizar commit direto;
- [ ] registrar o resultado da validação em um novo arquivo de progresso para avaliação.

## 5. Sequência resumida de dependências

```text
Contrato P0 congelado
        ↓
Banco e seed reproduzíveis
        ↓
Consultas da API
        ↓
Criação pela API
        ↓
Substituição transacional pela API
        ↓
Camada HTTP do frontend
        ↓
Listagem e filtros
        ↓
Novo lançamento
        ↓
Detalhe e substituição
        ↓
Revisão visual e teste ponta a ponta
```

## 6. Cenário final de demonstração

1. abrir a listagem;
2. filtrar lançamentos existentes;
3. criar um lançamento de `R$ 5.000,00`;
4. abrir o detalhe e confirmar o status `ATIVO`;
5. confirmar que não existem editar e excluir;
6. substituir o valor por `R$ 5.500,00` e informar o motivo;
7. abrir automaticamente o novo registro `ATIVO`;
8. acessar o anterior;
9. confirmar que o anterior continua com `R$ 5.000,00`, agora como `SUBSTITUIDO`;
10. visualizar o motivo e navegar novamente para o substituto de `R$ 5.500,00`.

## 7. Definição de pronto

O protótipo P0 estará pronto quando:

- o cenário final puder ser demonstrado sem manipulação manual do banco;
- os dados permanecerem após recarregar o frontend;
- a substituição for atômica e preservar o original;
- a interface consumir somente a API para o fluxo P0;
- banco, backend e frontend seguirem o mesmo contrato;
- lint, checagem de sintaxe e validações manuais estiverem aprovados;
- nenhum item fora do escopo for necessário para concluir a demonstração.

## 8. Próxima ação recomendada

Começar pela **Etapa 1** e pela **Etapa 2**, confirmando o contrato e tornando o banco local reproduzível. Em seguida, implementar primeiro as consultas do backend. Essa ordem permite integrar e validar o frontend em incrementos pequenos, sem depender de mocks durante o fechamento do P0.
