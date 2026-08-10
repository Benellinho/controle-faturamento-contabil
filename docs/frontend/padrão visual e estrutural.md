# Front-end — padrão visual e estrutural

O projeto utiliza React com Vite.

Utilize Bootstrap 5 como biblioteca principal de componentes e layout. Utilize CSS próprio apenas para identidade visual, sidebar, variáveis de tema e ajustes que não sejam adequadamente atendidos pelo Bootstrap.

Não adicionar outra biblioteca de UI como Material UI, Chakra UI, Tailwind ou similares.

## Paleta de cores

Utilizar como paleta principal:

- `#222831` — cor escura principal
- `#393E46` — cor escura secundária
- `#00ADB5` — cor de destaque e ação
- `#EEEEEE` — fundo claro principal

Criar as cores como variáveis CSS globais para evitar valores hexadecimais repetidos nos componentes.

Exemplo conceitual:

```css
:root {
  --color-dark: #222831;
  --color-dark-secondary: #393E46;
  --color-primary: #00ADB5;
  --color-background: #EEEEEE;
  --color-surface: #FFFFFF;
}
```

## Layout principal

O sistema deve possuir uma sidebar lateral permanente no desktop.

Estrutura:

```text
App
├── Sidebar
└── MainContent
    ├── PageHeader
    └── conteúdo da rota
```

A sidebar deve ter aproximadamente 250px de largura no desktop.

O conteúdo principal deve ocupar todo o espaço restante da tela.

Em telas menores, a sidebar deve poder ser recolhida/aberta, sem ocupar permanentemente a largura da tela.

## Sidebar

Utilizar:

- fundo `#222831`;
- textos claros;
- ícones junto aos itens de navegação;
- item ativo claramente destacado;
- `#00ADB5` como cor de destaque;
- `#393E46` como possível fundo do item ativo ou hover.

A sidebar inicialmente deve possuir as áreas compatíveis com o MVP:

- Dashboard
- Empresas
- Faturamentos
- Categorias
- Histórico de cancelamentos

Na parte inferior deve existir a área referente ao usuário autenticado e opção de sair.

Não adicionar módulos que não façam parte do MVP.

## Área principal

Utilizar fundo geral `#EEEEEE`.

Conteúdos, tabelas e formulários devem preferencialmente ficar dentro de superfícies brancas/cards.

O visual deve ser simples, administrativo e limpo.

Evitar:

- gradientes;
- sombras excessivas;
- bordas muito arredondadas;
- animações desnecessárias;
- excesso de cores;
- elementos decorativos sem função;
- dashboards excessivamente carregados.

## Bootstrap

Utilizar componentes e utilities do Bootstrap sempre que adequado para:

- grid;
- formulários;
- tabelas;
- botões;
- modais;
- dropdowns;
- badges;
- alerts;
- espaçamentos;
- responsividade.

Não recriar manualmente em CSS componentes já resolvidos adequadamente pelo Bootstrap.

CSS próprio deve ficar concentrado principalmente em:

- tema;
- sidebar;
- layout estrutural;
- estados específicos;
- pequenos ajustes visuais.

## Componentização

Não construir toda a interface dentro de um único componente.

Criar componentes reutilizáveis quando houver repetição ou responsabilidade própria.

Exemplos:

```text
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx
│   │   ├── AppLayout.jsx
│   │   └── PageHeader.jsx
│   │
│   └── common/
│       ├── ConfirmModal.jsx
│       ├── Loading.jsx
│       └── EmptyState.jsx
│
├── pages/
│   ├── Dashboard/
│   ├── Empresas/
│   ├── Faturamentos/
│   ├── Categorias/
│   └── Historico/
│
└── styles/
    ├── variables.css
    └── global.css
```

Não criar abstrações prematuras. Um componente deve ser extraído quando possuir responsabilidade própria ou for reutilizado.

## Padrão das páginas

As páginas administrativas devem seguir uma estrutura consistente.

Exemplo:

```text
Título da página                     [Ação principal]

Descrição curta opcional

┌──────────────────────────────────────────────────┐
│ filtros / busca                                  │
├──────────────────────────────────────────────────┤
│                                                  │
│ tabela ou conteúdo                               │
│                                                  │
└──────────────────────────────────────────────────┘
```

Exemplo para Empresas:

```text
Empresas                              [+ Nova empresa]

Gerencie as empresas cadastradas.

[ Buscar empresa... ]

┌──────────┬────────────────────────┬─────────┬──────────┐
│ CNPJ     │ Razão Social           │ Status  │ Ações    │
├──────────┼────────────────────────┼─────────┼──────────┤
│ ...      │ ...                    │ ...     │ ...      │
└──────────┴────────────────────────┴─────────┴──────────┘
```

## Consistência

Todas as telas devem utilizar o mesmo padrão de:

- títulos;
- espaçamentos;
- botões;
- tabelas;
- formulários;
- mensagens;
- modais;
- estados de carregamento;
- estados vazios;
- tratamento de erros.

Antes de criar um novo padrão visual, verificar se já existe componente ou estilo equivalente no projeto.

A prioridade é manter o front-end simples, consistente e fácil de manter.