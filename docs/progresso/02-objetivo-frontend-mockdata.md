# Progresso 02 — Objetivo do frontend com mock data

**Planejado para:** 10/08/2026  
**Foco:** construir e validar a interface do MVP sem depender do backend real

## Objetivo principal

Substituir a tela padrão do Vite por uma interface funcional do Controle de Faturamento Contábil, utilizando dados simulados que respeitem as regras já implementadas no Supabase.

Ao final da etapa deverá ser possível navegar pelo fluxo principal, visualizar empresas e competências, registrar o lançamento mensal, conferir estoques, simular mudanças de status e testar a correção por substituição sem gravar dados reais.

## Estratégia de implementação

O frontend deverá consumir uma camada de serviço mock, e não importar os arrays de dados diretamente dentro dos componentes.

Estrutura sugerida:

```text
frontend/src/
├── components/
├── layouts/
├── mocks/
│   ├── usuarios.js
│   ├── empresas.js
│   ├── categorias.js
│   ├── competencias.js
│   └── lancamentos.js
├── pages/
├── services/
│   └── mockApi.js
├── utils/
└── App.jsx
```

Essa separação permitirá trocar `mockApi.js` pela API Fastify posteriormente, preservando a maior parte das telas e componentes.

## Dados simulados necessários

### Usuário

- identificador UUID;
- nome;
- e-mail;
- cargo;
- situação ativa.

### Empresas

Incluir exemplos de:

- empresa ativa com competência aberta;
- empresa ativa em conferência;
- empresa com competência reaberta;
- empresa com competência finalizada;
- empresa com competência sem movimento;
- empresa inativa apenas para consulta histórica.

### Categorias

- pelo menos três categorias ativas;
- uma categoria inativa utilizada somente no histórico.

### Competências

Representar todos os estados:

- `ABERTA`;
- `EM_CONFERENCIA`;
- `REABERTA`;
- `FINALIZADA`;
- aberta e marcada como `sem_movimento`.

### Lançamentos

Cada competência poderá possuir no máximo um lançamento `ATIVO`, contendo:

- categoria;
- tipo de lançamento;
- data de referência pertencente ao mês;
- valor positivo;
- estoque inicial maior ou igual a zero;
- estoque final maior ou igual a zero;
- observação;
- usuário criador;
- status.

Também deverá existir uma cadeia mock de correção:

```text
lançamento original CANCELADO
        ↓
lançamento substituto ATIVO
```

## Telas da etapa

### 1. Estrutura principal

- cabeçalho com nome do sistema e usuário atual;
- navegação lateral ou superior;
- área de conteúdo responsiva;
- indicação clara do ambiente de demonstração/mock.

### 2. Dashboard

Exibir:

- total de empresas ativas;
- competências abertas;
- competências em conferência;
- competências finalizadas;
- competências sem movimento;
- faturamento líquido do mês;
- resumo dos estoques inicial e final do lançamento selecionado;
- lista das competências que exigem atenção.

### 3. Lista de empresas

- busca por razão social, nome fantasia ou CNPJ;
- filtro por ativa/inativa;
- acesso às competências da empresa;
- estado vazio quando nenhum resultado for encontrado.

### 4. Competências da empresa

- listagem por ano e mês;
- badge de status;
- indicação de sem movimento;
- valor líquido;
- estoques inicial e final;
- ação para abrir os detalhes.

### 5. Detalhe da competência

- dados da empresa e do período;
- status atual e ações permitidas;
- lançamento mensal ativo, quando existir;
- estoque inicial e estoque final;
- totais calculados;
- histórico de mudanças de status;
- histórico da cadeia de substituição;
- estado específico para competência sem movimento.

### 6. Formulário do lançamento mensal

Campos:

- categoria;
- tipo;
- data de referência;
- valor;
- estoque inicial;
- estoque final;
- observação.

Validações no frontend:

- valor obrigatório e maior que zero;
- estoques obrigatórios e não negativos;
- data dentro do mês da competência;
- categoria ativa;
- bloqueio quando já existir lançamento ativo;
- bloqueio em `EM_CONFERENCIA` ou `FINALIZADA`.

### 7. Correção por substituição

O modal ou formulário deverá:

- mostrar o lançamento original sem permitir edição;
- exigir motivo do cancelamento;
- solicitar todos os dados do novo lançamento;
- exigir novamente os estoques inicial e final;
- simular cancelamento e criação do substituto em uma única ação;
- manter o original visível no histórico.

### 8. Fluxo da competência

Simular somente as transições válidas:

```text
ABERTA → EM_CONFERENCIA
EM_CONFERENCIA → REABERTA
EM_CONFERENCIA → FINALIZADA
REABERTA → EM_CONFERENCIA
```

A reabertura deve exigir justificativa. O início da conferência deve exigir lançamento ativo ou marcação de sem movimento.

## Comportamento do mock service

`mockApi.js` deverá:

- retornar `Promise` para manter uma interface semelhante à API real;
- simular pequeno tempo de resposta;
- oferecer cenários de sucesso, vazio e erro;
- clonar os dados retornados para evitar mutações acidentais;
- centralizar as alterações simuladas;
- aplicar as mesmas validações essenciais do banco;
- nunca acessar a `service_role` ou dados reais do Supabase.

## Estado da aplicação

Para esta primeira versão, o estado pode ficar em memória usando React Context e `useReducer`, ou em um módulo controlado pelo mock service. Persistência em `localStorage` é opcional e só deve ser adicionada se ajudar na demonstração.

A estrutura escolhida deve permitir recarregar os dados iniciais facilmente.

## Experiência visual

- interface limpa e adequada a um escritório contábil;
- valores monetários formatados em `pt-BR`;
- datas e competências formatadas em português;
- status com cores consistentes;
- tabelas legíveis em desktop;
- adaptação funcional para telas menores;
- mensagens claras de sucesso, erro, bloqueio e estado vazio;
- confirmação antes das ações de transição e substituição.

## Fora do escopo desta etapa

- autenticação real;
- chamadas reais ao Fastify;
- gravação no Supabase;
- administração real de usuários;
- upload de documentos;
- deploy;
- testes ponta a ponta contra o banco remoto.

## Ordem de execução sugerida

1. remover os componentes e estilos padrão do Vite;
2. definir tokens visuais, layout e componentes básicos;
3. criar os mocks e o `mockApi.js`;
4. implementar navegação e dashboard;
5. implementar empresas e competências;
6. implementar detalhe e formulário do lançamento mensal;
7. implementar sem movimento e transições de status;
8. implementar cancelamento e substituição;
9. revisar responsividade, estados vazios e mensagens;
10. executar lint e validar manualmente todos os fluxos.

## Critérios de conclusão

- não restar conteúdo visual padrão do Vite;
- todas as telas principais navegáveis;
- mock data separado dos componentes;
- somente um lançamento ativo por competência;
- estoques exibidos e validados;
- transições inválidas bloqueadas;
- correção preservando o lançamento cancelado;
- competências sem movimento representadas corretamente;
- valores e datas formatados em `pt-BR`;
- lint aprovado;
- nenhuma chamada real ao Supabase para dados de negócio.

## Resultado esperado para o próximo encerramento

Uma demonstração navegável do fluxo completo do MVP, pronta para validação visual e funcional antes da criação dos endpoints reais do backend.
