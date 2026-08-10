# Padrão de tabelas, listagens e filtros

O sistema utiliza:

- React + Vite;
- Bootstrap 5;
- CSS próprio para identidade visual;
- paleta:
  - `#222831`
  - `#393E46`
  - `#00ADB5`
  - `#EEEEEE`

Todas as telas de listagem devem seguir um padrão visual e funcional consistente.

Não adicionar bibliotecas como:

- DataTables;
- AG Grid;
- Material Table;
- TanStack Table;

a menos que exista posteriormente uma necessidade concreta que justifique a dependência.

Para o MVP, utilizar React + Bootstrap.

---

# 1. Estrutura padrão de uma página de listagem

Seguir preferencialmente esta organização:

```text
Empresas                                      [+ Nova empresa]

Gerencie as empresas cadastradas.

┌──────────────────────────────────────────────────────────────┐
│ Filtros                                                      │
│                                                              │
│ [ Buscar por CNPJ ou nome... ] [ Situação ▼ ] [Limpar]      │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ CNPJ        Razão Social              Situação      Ações    │
├──────────────────────────────────────────────────────────────┤
│ ...         ...                       Ativa          ...      │
│ ...         ...                       Inativa        ...      │
└──────────────────────────────────────────────────────────────┘

Mostrando 1–20 de 46                    < 1  2  3 >
```

Separar conceitualmente:

1. cabeçalho da página;
2. filtros;
3. tabela;
4. paginação.

Não misturar filtros dentro do cabeçalho da própria tabela.

---

# 2. Container da tabela

A tabela deve ficar dentro de uma superfície branca sobre o fundo `#EEEEEE`.

Pode utilizar:

```text
card
```

ou container visual equivalente já existente no projeto.

Evitar sombras fortes.

Utilizar borda discreta ou sombra muito leve apenas para separar o conteúdo do fundo.

A tabela deve parecer uma ferramenta administrativa e não uma planilha decorativa.

---

# 3. Bootstrap

Utilizar preferencialmente:

```jsx
<table className="table table-hover align-middle mb-0">
```

A tabela deve possuir:

- cabeçalho facilmente distinguível;
- linhas com hover discreto;
- alinhamento vertical central;
- espaçamento confortável;
- sem excesso de bordas internas.

Evitar:

```text
table-bordered
```

como padrão global caso deixe a tabela visualmente pesada.

Preferir separação horizontal discreta entre registros.

---

# 4. Cabeçalho

O cabeçalho deve possuir contraste suficiente.

Utilizar visual compatível com:

```text
#222831
#393E46
```

mas não transformar toda a tabela em dark mode.

Exemplo:

```text
┌──────────────┬─────────────────────────┬───────────┬───────────┐
│ CNPJ         │ Razão Social            │ Situação  │ Ações     │
├──────────────┼─────────────────────────┼───────────┼───────────┤
```

Utilizar títulos curtos e claros.

Evitar nomes de propriedade do backend como:

```text
empresa_id
created_at
categoria_id
```

quando existir uma descrição natural para o usuário.

Exibir:

```text
Empresa
Criado em
Categoria
```

---

# 5. Conteúdo das células

Cada tipo de informação deve seguir formatação própria.

## CNPJ

Exibir:

```text
12.345.678/0001-90
```

mesmo que internamente esteja armazenado sem formatação.

## Valores monetários

Exibir sempre no padrão brasileiro:

```text
R$ 15.480,20
```

Utilizar:

```js
Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
})
```

ou helper central equivalente.

Não implementar formatação monetária diferente em cada página.

## Datas

Exibir ao usuário preferencialmente:

```text
10/08/2026
```

Datas com hora, quando relevantes:

```text
10/08/2026 14:32
```

Não mostrar diretamente:

```text
2026-08-10T17:32:18.000Z
```

## Competência

Exibir:

```text
08/2026
```

e não a representação técnica utilizada no banco.

---

# 6. Status

Estados devem utilizar badges Bootstrap.

Exemplo:

```text
Ativa
Cancelado
```

Não depender exclusivamente da cor para transmitir o estado.

Sempre mostrar o texto.

Exemplo:

```jsx
<span className="badge ...">
  Ativa
</span>
```

Criar uma padronização central para os principais estados.

Evitar definir manualmente classes de status diferentes em cada tabela.

Para faturamentos, deve ser fácil distinguir visualmente:

```text
Ativo
Cancelado
```

sem transformar registros cancelados em elementos invisíveis.

---

# 7. Registros cancelados

Um faturamento cancelado deve continuar aparecendo quando fizer parte do resultado do filtro.

Não apagar visualmente a linha.

Pode utilizar aparência discretamente reduzida, por exemplo:

```text
texto secundário
badge "Cancelado"
```

mas os dados precisam continuar legíveis.

Exemplo:

```text
08/2026 | Empresa ABC | Serviços | R$ 15.000,00 | Cancelado
```

Não utilizar `display:none`, exclusão da lista local ou qualquer mecanismo que simule remoção definitiva.

---

# 8. Coluna de ações

A última coluna deve ser:

```text
Ações
```

Alinhar preferencialmente à direita.

Evitar uma grande quantidade de botões coloridos dentro da tabela.

Para poucas ações:

```text
[Visualizar] [Editar]
```

Quando existirem várias ações, preferir menu:

```text
[ ⋮ ]
```

Exemplo:

```text
Visualizar
Editar
──────────
Desativar
```

Ações perigosas devem ficar visualmente separadas.

Nunca colocar ícone sem tooltip ou contexto quando seu significado não for óbvio.

---

# 9. Ações por domínio

## Empresas

Pode existir:

```text
Visualizar
Editar
```

e outras operações somente se estiverem definidas no backend.

## Usuários

Pode existir:

```text
Editar
Ativar/Desativar
```

conforme o modelo implementado.

## Categorias

Pode existir:

```text
Editar
```

e demais ações apenas se permitidas pelo domínio.

## Faturamentos

Não oferecer:

```text
Editar
Excluir
```

Para faturamentos utilizar apenas operações permitidas, como:

```text
Visualizar
Cancelar
```

O frontend deve respeitar a regra de imutabilidade dos lançamentos.

---

# 10. Área de filtros

Filtros devem ficar acima da tabela dentro de container próprio.

Exemplo:

```text
┌─────────────────────────────────────────────────────────────┐
│ Buscar                                                      │
│ [ Empresa, CNPJ...                     ]                    │
│                                                             │
│ Competência       Categoria           Status                │
│ [ 08/2026 ]       [ Todas ▼ ]         [ Todos ▼ ]           │
│                                                             │
│                                             [Limpar filtros]│
└─────────────────────────────────────────────────────────────┘
```

Não criar um formulário visualmente pesado.

Utilizar grid Bootstrap e manter os filtros compactos.

---

# 11. Busca textual

Quando uma página possuir pesquisa, utilizar campo com indicação clara do que pode ser pesquisado.

Bom:

```text
[ Buscar por razão social ou CNPJ... ]
```

Evitar:

```text
[ Pesquisar... ]
```

quando for possível informar ao usuário o que está sendo pesquisado.

Não criar uma busca global falsa que aparentemente pesquisa qualquer campo quando a API só suporta alguns.

---

# 12. Aplicação dos filtros

Para selects, competência e filtros simples, preferir aplicar automaticamente quando o valor mudar.

Exemplo:

```text
Status
[ Ativos ▼ ]
```

Ao escolher:

```text
Cancelados
```

a listagem deve ser atualizada.

Não exigir botão "Filtrar" apenas para um select simples se isso não trouxer benefício.

Para campos de texto, NÃO fazer requisição a cada tecla imediatamente.

Utilizar debounce, por exemplo aproximadamente:

```text
300–500 ms
```

ou aplicar busca ao pressionar Enter.

Preferir debounce caso a experiência já esteja implementada de forma simples e clara.

---

# 13. Botão limpar filtros

Quando algum filtro estiver ativo, disponibilizar:

```text
Limpar filtros
```

Ao limpar:

- restaurar valores padrão;
- voltar para a primeira página;
- executar novamente a consulta.

Não utilizar um botão de reset visual que não atualize os dados.

---

# 14. Filtros devem refletir a API

Antes de criar cada filtro:

1. verificar se o endpoint suporta aquele filtro;
2. verificar o nome do parâmetro;
3. verificar o formato esperado;
4. só então implementar o controle visual.

Não filtrar milhares de registros no frontend caso a API já possa executar a consulta.

Exemplo conceitual:

```text
GET /faturamentos?empresa_id=12&competencia=2026-08&status=ATIVO
```

Utilizar exatamente o contrato existente da API.

Não inventar query parameters.

---

# 15. Server-side vs client-side

Para pequenas listas auxiliares, filtragem local pode ser aceitável.

Porém as listagens principais devem ser preparadas para filtros e paginação pelo backend.

Principalmente:

```text
Faturamentos
Histórico de cancelamentos
```

O frontend deve enviar:

```text
filtros
página
limite
ordenação
```

quando esses recursos estiverem disponíveis na API.

Não carregar todos os faturamentos existentes para depois aplicar `.filter()` no navegador como arquitetura definitiva.

---

# 16. Filtros da tabela de empresas

Utilizar apenas filtros realmente úteis.

Sugestão:

```text
Busca:
- razão social;
- nome fantasia, caso exista;
- CNPJ.

Situação:
- Todas;
- Ativas;
- Inativas.
```

Não adicionar filtros sem utilidade operacional.

Exemplo:

```text
ID interno
Data de criação
```

não precisam ser filtros apenas porque existem no banco.

---

# 17. Tabela de empresas

Possível estrutura:

```text
┌──────────────────┬────────────────────────────┬───────────┬────────┐
│ CNPJ             │ Razão Social               │ Situação  │ Ações  │
├──────────────────┼────────────────────────────┼───────────┼────────┤
│ 12.345...        │ Empresa ABC Ltda.          │ Ativa     │ ⋮      │
└──────────────────┴────────────────────────────┴───────────┴────────┘
```

Se Nome Fantasia fizer parte do modelo e for operacionalmente útil:

```text
CNPJ
Razão Social
Nome Fantasia
Situação
Ações
```

Não adicionar colunas apenas porque estão disponíveis na resposta da API.

---

# 18. Tabela de usuários

Possível estrutura:

```text
┌─────────────────────────┬────────────────────────────┬──────────┬────────┐
│ Nome                    │ E-mail                     │ Situação │ Ações  │
├─────────────────────────┼────────────────────────────┼──────────┼────────┤
│ João Silva              │ joao@empresa.com           │ Ativo    │ ⋮      │
└─────────────────────────┴────────────────────────────┴──────────┴────────┘
```

Filtros sugeridos:

```text
Busca por nome ou e-mail
Situação
```

Não criar filtro por empresa, pois usuários são internos do escritório e não estão vinculados às empresas clientes.

---

# 19. Tabela de categorias

Como categorias tendem a ser poucas, manter a interface simples.

Exemplo:

```text
┌──────────────────────────────────────┬────────┐
│ Categoria                            │ Ações  │
├──────────────────────────────────────┼────────┤
│ Venda de mercadorias                 │ ⋮      │
│ Prestação de serviços                │ ⋮      │
└──────────────────────────────────────┴────────┘
```

Uma simples pesquisa por nome pode ser suficiente.

Não criar paginação, múltiplos filtros e controles complexos se o volume real não justificar.

---

# 20. Tabela de faturamentos

Esta é a principal listagem operacional do sistema.

Dar prioridade às informações que permitem identificar imediatamente o lançamento.

Possível estrutura:

```text
┌────────────┬─────────────────────┬─────────────────┬──────────────┬──────────┬───────┐
│ Competência│ Empresa             │ Categoria       │ Valor        │ Status   │ Ações │
├────────────┼─────────────────────┼─────────────────┼──────────────┼──────────┼───────┤
│ 08/2026    │ Empresa ABC Ltda.   │ Serviços        │ R$ 15.000,00 │ Ativo    │ ⋮     │
│ 08/2026    │ Empresa XYZ Ltda.   │ Vendas          │ R$ 32.500,00 │ Cancelado│ ⋮     │
└────────────┴─────────────────────┴─────────────────┴──────────────┴──────────┴───────┘
```

A coluna `Valor` deve preferencialmente ter alinhamento à direita.

Datas, competência e status podem ter largura menor.

Empresa deve possuir espaço maior.

---

# 21. Filtros de faturamento

Os filtros mais importantes são:

```text
Empresa
Competência
Categoria
Status
```

Dependendo do modelo efetivamente implementado, pode existir também busca por algum identificador do lançamento.

Estrutura recomendada:

```text
Empresa              Competência          Categoria
[ Todas ▼ ]          [ 08/2026 ]          [ Todas ▼ ]

Status
[ Ativos ▼ ]

[Limpar filtros]
```

Não colocar todos os controles necessariamente na mesma linha.

Utilizar Bootstrap Grid para adaptação responsiva.

---

# 22. Competência no faturamento

Como faturamento é essencialmente mensal, competência deve ser um filtro de primeira classe.

Quando a tela for acessada, utilizar o comportamento definido pelo domínio/produto.

Se o sistema foi definido para iniciar mostrando a competência atual, usar esse comportamento.

Se a API foi definida para retornar todas as competências por padrão, não alterar essa regra silenciosamente.

O frontend não deve criar uma regra funcional nova sem respaldo no comportamento definido.

---

# 23. Filtro de empresa

Mostrar ao usuário:

```text
Todas as empresas
Empresa ABC Ltda.
Empresa XYZ Ltda.
```

Mas enviar:

```text
empresa_id
```

para a API.

Não utilizar o nome da empresa como identificador.

Se houver muitas empresas, não criar automaticamente um componente complexo.

Começar com `<select>` Bootstrap.

Somente migrar para busca/autocomplete se o volume realmente prejudicar a utilização.

---

# 24. Filtro de status do faturamento

Sugestão visual:

```text
Status
[ Ativos ▼ ]
```

Opções:

```text
Todos
Ativos
Cancelados
```

É aceitável iniciar em `Ativos` se essa for a regra funcional definida para a listagem operacional.

O histórico de cancelamentos pode possuir visão específica caso já faça parte do sistema.

Não duplicar lógica desnecessariamente entre páginas.

---

# 25. Totais associados aos filtros

Quando a listagem de faturamentos mostrar totais, o total deve corresponder exatamente ao conjunto filtrado definido pelo backend.

Exemplo:

```text
Competência: 08/2026
Empresa: Empresa ABC

Total do período
R$ 125.480,32
```

Não somar apenas os registros visíveis da página atual se o objetivo for apresentar o total completo do filtro.

Exemplo incorreto:

```text
Página possui 20 registros.
Existem 300 registros filtrados.
Frontend soma somente os 20 e apresenta como "Total".
```

O total geral deve vir do backend ou de endpoint/metadata apropriado.

Essa distinção é importante.

---

# 26. Paginação

Quando a API possuir paginação, utilizar paginação server-side.

Padrão:

```text
Mostrando 1–20 de 87

< Anterior    1  2  3  4  5    Próxima >
```

Não mostrar dezenas de números de página.

Utilizar janela limitada em torno da página atual.

Ao alterar qualquer filtro:

```text
page = 1
```

Sempre retornar à primeira página.

Não manter página 5 após aplicar um filtro que talvez possua somente uma página.

---

# 27. Quantidade por página

Quando necessário, utilizar quantidade padrão razoável, por exemplo:

```text
20 registros
```

Se for criado seletor:

```text
20
50
100
```

não exagerar nas opções.

Para o MVP, sequer é obrigatório permitir que o usuário altere o limite.

Priorizar simplicidade.

---

# 28. Ordenação

Só implementar ordenação em colunas onde isso tenha utilidade real e suporte da API.

Exemplos úteis:

```text
Competência
Empresa
Valor
Data de criação
```

Se uma coluna for ordenável, indicar visualmente.

Exemplo:

```text
Valor ↕
```

ou ícone Bootstrap equivalente.

Não fazer parecer que todas as colunas são clicáveis.

Se a ordenação for server-side, enviar os parâmetros definidos pela API.

---

# 29. Estado de carregamento

Durante carregamento inicial, não apresentar tabela vazia como se não houvesse registros.

Utilizar estado explícito:

```text
Carregando registros...
```

Pode utilizar spinner Bootstrap discreto.

Durante mudança de filtro ou página, evitar destruir toda a estrutura visual da página.

Pode manter o container da tabela e exibir estado de carregamento dentro dele.

---

# 30. Estado vazio

Diferenciar dois casos.

## Nenhum registro cadastrado

Exemplo:

```text
Nenhuma empresa cadastrada.

Cadastre a primeira empresa para começar.

[+ Nova empresa]
```

## Nenhum resultado para os filtros

Exemplo:

```text
Nenhum faturamento encontrado com os filtros selecionados.

[Limpar filtros]
```

Esses estados são semanticamente diferentes.

Não mostrar botão "Cadastrar faturamento" como solução para uma busca que simplesmente não encontrou resultados.

---

# 31. Erro de carregamento

Se a requisição falhar:

```text
Não foi possível carregar os faturamentos.

[Tentar novamente]
```

Não substituir falha da API por:

```text
Nenhum registro encontrado.
```

Erro e resultado vazio são estados diferentes.

---

# 32. Responsividade

As tabelas devem funcionar em telas menores.

Utilizar:

```jsx
<div className="table-responsive">
```

Não tentar comprimir todas as colunas até ficarem ilegíveis.

Em telas pequenas, permitir scroll horizontal quando necessário.

Filtros devem quebrar para novas linhas usando grid Bootstrap.

Exemplo:

```text
Desktop:

[Empresa       ] [Competência] [Categoria] [Status]

Mobile:

[Empresa                     ]
[Competência                  ]
[Categoria                    ]
[Status                       ]
```

---

# 33. Não esconder informações essenciais no mobile

Responsividade não significa remover arbitrariamente dados importantes.

Antes de ocultar alguma coluna, considerar:

- ela é necessária para identificar o registro?
- é necessária para executar uma ação?
- o usuário perde contexto?

Para faturamentos, informações como:

```text
Empresa
Competência
Valor
Status
```

são importantes.

Se necessário, utilizar scroll horizontal em vez de esconder dados essenciais.

---

# 34. Preservação dos filtros

Durante navegação entre páginas da paginação, manter filtros selecionados.

Exemplo:

```text
empresa_id = 12
competencia = 2026-08
page = 1
```

Ao ir para página 2:

```text
empresa_id = 12
competencia = 2026-08
page = 2
```

Nunca perder os filtros apenas porque a página mudou.

---

# 35. Query string na URL

Para páginas de listagem mais importantes, especialmente faturamentos, preferir representar filtros relevantes na URL quando isso puder ser feito sem complexidade excessiva.

Exemplo:

```text
/faturamentos?empresa=12&competencia=2026-08&status=ATIVO&page=2
```

Benefícios:

- atualizar a página preserva a consulta;
- botão voltar funciona melhor;
- URL pode representar o estado da listagem.

Não é obrigatório para pequenos cadastros simples.

Não implementar uma camada complexa apenas para conseguir isso.

---

# 36. Componentização

Criar componentes compartilhados somente quando houver reutilização real.

Estrutura possível:

```text
components/
└── table/
    ├── TableLoading.jsx
    ├── TableEmpty.jsx
    ├── Pagination.jsx
    └── StatusBadge.jsx
```

Filtros específicos devem preferencialmente permanecer próximos da página correspondente.

Exemplo:

```text
pages/
└── Faturamentos/
    ├── FaturamentosPage.jsx
    └── components/
        ├── FaturamentosFilters.jsx
        └── FaturamentosTable.jsx
```

Não criar um:

```text
GenericTable
UniversalTable
DynamicFilterBuilder
```

capaz de receber dezenas de configurações apenas para evitar repetição.

Uma pequena repetição é preferível a uma abstração difícil de entender.

---

# 37. Separação entre tabela e dados

O componente visual da tabela não deve ser responsável por conhecer detalhes de requisição HTTP se isso tornar o código confuso.

Preferir fluxo conceitual:

```text
FaturamentosPage
      │
      ├── controla filtros
      ├── controla paginação
      ├── busca os dados
      │
      ├── FaturamentosFilters
      │
      └── FaturamentosTable
```

Exemplo conceitual:

```jsx
<FaturamentosFilters
  filters={filters}
  onChange={handleFilterChange}
  onClear={handleClearFilters}
/>

<FaturamentosTable
  items={faturamentos}
  loading={loading}
  onView={handleView}
  onCancel={handleCancel}
/>

<Pagination
  page={page}
  totalPages={totalPages}
  onChange={handlePageChange}
/>
```

Não é necessário seguir exatamente esses nomes.

Preservar o padrão existente do projeto caso já exista estrutura equivalente.

---

# 38. Evitar requisições desnecessárias

Não refazer requisições quando alterações de estado não modificarem a consulta.

Para busca textual com debounce:

- cancelar ou ignorar respostas antigas;
- evitar race conditions em que uma requisição antiga sobrescreve uma busca mais recente.

Exemplo:

```text
Usuário busca:

"emp"
"empresa"
"empresa abc"
```

Uma resposta atrasada da consulta `"emp"` não deve substituir o resultado mais recente de `"empresa abc"`.

Utilizar a estratégia compatível com a camada HTTP já existente no projeto.

---

# 39. Acessibilidade básica

Cabeçalhos devem utilizar:

```html
<th>
```

e não `<td>` estilizado.

Botões devem possuir descrição compreensível.

Ícones isolados devem possuir:

```text
aria-label
title
```

quando necessário.

Inputs de filtros devem possuir `<label>` associado.

Não depender exclusivamente de placeholders.

---

# 40. Regra visual geral

As tabelas devem priorizar densidade moderada.

Evitar tanto:

- linhas excessivamente altas;
- cards individuais para cada registro no desktop;

quanto:

- tabelas apertadas demais;
- fontes muito pequenas;
- dezenas de colunas simultâneas.

O objetivo é permitir leitura rápida de muitos registros.

---

# 41. Regra funcional geral

Antes de implementar qualquer listagem, verificar:

1. endpoint disponível;
2. estrutura da resposta;
3. filtros suportados;
4. paginação suportada;
5. ordenação suportada;
6. campos realmente necessários;
7. operações permitidas para cada registro.

Não inventar filtros ou comportamentos que o backend não suporte.

Se alguma necessidade visual revelar ausência importante na API, sinalizar a necessidade antes de implementar uma solução paralela exclusivamente no frontend.

---

# 42. Prioridade específica do MVP

Para este MVP, priorizar nesta ordem:

1. clareza da informação;
2. filtros úteis;
3. consistência;
4. paginação;
5. responsividade;
6. ordenação onde realmente necessária;
7. recursos avançados somente posteriormente.

Não transformar tabelas administrativas simples em componentes excessivamente sofisticados.