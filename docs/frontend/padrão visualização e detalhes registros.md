# Padrão de páginas de detalhes e visualização de registros

Criar um padrão visual consistente para páginas utilizadas para consultar informações já cadastradas.

Esse padrão deve ser utilizado para registros como:

- empresas;
- usuários;
- categorias;
- faturamentos;
- cancelamentos;
- outros cadastros futuros.

A página de detalhes NÃO deve ser simplesmente o formulário de edição com todos os campos `disabled`.

A visualização deve ser construída especificamente para leitura.

---

# 1. Objetivo da página

A página de detalhes deve permitir que o usuário:

1. identifique rapidamente qual registro está visualizando;
2. veja seu status;
3. consulte os principais dados sem precisar interpretar um formulário;
4. identifique informações de auditoria quando relevantes;
5. execute somente as ações permitidas para aquele registro;
6. retorne facilmente à listagem anterior.

---

# 2. Estrutura geral

Utilizar este padrão:

```text
← Voltar para faturamentos

Faturamento
Empresa ABC Ltda. · Competência 08/2026

                                      [Ativo]   [Cancelar]

┌─────────────────────────────────────────────────────────────┐
│ Informações do lançamento                                  │
│                                                             │
│ Empresa                        Categoria                    │
│ Empresa ABC Ltda.              Prestação de serviços       │
│                                                             │
│ Competência                    Valor                        │
│ 08/2026                        R$ 15.800,00                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Informações do registro                                    │
│                                                             │
│ Criado em                      Criado por                   │
│ 10/08/2026 08:35               João Silva                   │
└─────────────────────────────────────────────────────────────┘
```

Dividir a página em:

1. navegação de retorno;
2. cabeçalho do registro;
3. ações;
4. informações principais;
5. informações complementares;
6. histórico ou auditoria, quando existente.

---

# 3. Navegação de retorno

No topo da página utilizar:

```text
← Voltar para faturamentos
```

ou:

```text
← Voltar para empresas
```

Não utilizar somente:

```text
← Voltar
```

quando for simples indicar o destino.

Preferencialmente retornar à listagem preservando os filtros e a paginação anteriores quando a arquitetura do sistema permitir.

Exemplo:

```text
/faturamentos?empresa=12&competencia=2026-08&page=2
```

Usuário abre um lançamento e depois retorna para essa mesma consulta.

---

# 4. Cabeçalho do registro

O cabeçalho deve responder imediatamente:

- o que é esse registro?
- qual registro estou vendo?
- qual seu estado atual?

Exemplo de empresa:

```text
Empresa

Metalúrgica ABC Ltda.
12.345.678/0001-90

                              [Ativa] [Editar]
```

Exemplo de faturamento:

```text
Faturamento

Empresa ABC Ltda. · 08/2026

                         [Ativo] [Cancelar lançamento]
```

Não mostrar apenas:

```text
Detalhes
```

como título da página.

O título deve fornecer contexto.

---

# 5. Hierarquia visual

Utilizar três níveis:

## Tipo do registro

Exemplo:

```text
Faturamento
```

## Identificação principal

Exemplo:

```text
Empresa ABC Ltda.
```

## Informação secundária

Exemplo:

```text
Competência 08/2026
```

ou:

```text
CNPJ 12.345.678/0001-90
```

Não colocar todas essas informações com o mesmo peso visual.

---

# 6. Cards de informações

Organizar informações relacionadas em blocos brancos sobre o fundo `#EEEEEE`.

Exemplo:

```text
┌────────────────────────────────────────────────────────────┐
│ Dados da empresa                                           │
│                                                            │
│ CNPJ                        Razão Social                    │
│ 12.345.678/0001-90          Empresa ABC Ltda.              │
│                                                            │
│ Nome Fantasia               Situação                       │
│ ABC Industrial              Ativa                          │
└────────────────────────────────────────────────────────────┘
```

Utilizar cards ou containers semelhantes aos padrões já existentes.

Evitar:

- sombras fortes;
- bordas excessivas;
- um card para cada campo;
- grandes caixas coloridas.

Agrupar informações semanticamente.

---

# 7. Padrão Label + Valor

Informações devem utilizar:

```text
LABEL
Valor
```

Exemplo:

```text
CNPJ
12.345.678/0001-90
```

Não:

```text
CNPJ: 12.345.678/0001-90
```

para todos os campos indiscriminadamente.

O padrão label acima do valor melhora a leitura quando existem vários campos.

Visualmente:

- label menor;
- label com cor secundária;
- valor com maior contraste;
- valor normal ou medium;
- espaçamento claro entre campos.

---

# 8. Grid

Utilizar Bootstrap Grid.

Exemplo:

```jsx
<div className="row g-4">

  <div className="col-md-6">
    ...
  </div>

  <div className="col-md-6">
    ...
  </div>

</div>
```

Campos pequenos podem dividir linha.

Campos maiores podem ocupar toda a largura.

No mobile:

```text
Empresa
Empresa ABC Ltda.

Categoria
Prestação de serviços

Competência
08/2026

Valor
R$ 15.800,00
```

---

# 9. Não utilizar inputs para visualização

Evitar:

```jsx
<input
  value="Empresa ABC Ltda."
  disabled
/>
```

ou:

```jsx
<select disabled>
```

A página é de leitura, não um formulário.

Mostrar valores como texto.

Usar inputs somente quando o usuário estiver realmente editando alguma informação.

---

# 10. Valores inexistentes

Nunca mostrar ao usuário:

```text
null
undefined
""
```

Quando um campo opcional não possuir valor, utilizar padrão consistente:

```text
—
```

Exemplo:

```text
Nome Fantasia
—
```

Não usar:

```text
Não informado
```

em todas as células, pois gera poluição visual.

Pode utilizar `—` para ausência simples de informação.

---

# 11. Formatação

Continuar utilizando os mesmos helpers definidos para as tabelas.

## CNPJ

```text
12.345.678/0001-90
```

## Dinheiro

```text
R$ 15.800,00
```

## Data

```text
10/08/2026
```

## Data e hora

```text
10/08/2026 08:35
```

## Competência

```text
08/2026
```

Não duplicar lógica de formatação dentro das páginas.

---

# 12. Status

Mostrar status no cabeçalho e, quando necessário, dentro da seção correspondente.

Exemplo:

```text
[Ativo]
```

ou:

```text
[Cancelado]
```

Utilizar o mesmo componente `StatusBadge` utilizado nas tabelas.

Não criar estilos diferentes para o mesmo status dependendo da tela.

---

# 13. Página de detalhes da empresa

Exemplo:

```text
← Voltar para empresas

Empresa

Metalúrgica ABC Ltda.
12.345.678/0001-90

                                      [Ativa] [Editar]

┌─────────────────────────────────────────────────────────────┐
│ Dados da empresa                                            │
│                                                             │
│ CNPJ                         Razão Social                    │
│ 12.345.678/0001-90           Metalúrgica ABC Ltda.          │
│                                                             │
│ Nome Fantasia                Situação                       │
│ ABC Industrial               Ativa                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Informações do cadastro                                     │
│                                                             │
│ Criado em                    Atualizado em                  │
│ 15/05/2026 14:32             02/08/2026 09:15              │
└─────────────────────────────────────────────────────────────┘
```

Utilizar apenas campos existentes no modelo.

Não inventar dados empresariais para preencher a página.

---

# 14. Página de detalhes do usuário

Exemplo:

```text
← Voltar para usuários

Usuário

João da Silva
joao@escritorio.com.br

                                      [Ativo] [Editar]

┌─────────────────────────────────────────────────────────────┐
│ Dados do usuário                                            │
│                                                             │
│ Nome                         E-mail                          │
│ João da Silva                joao@escritorio.com.br         │
│                                                             │
│ Situação                                                    │
│ Ativo                                                       │
└─────────────────────────────────────────────────────────────┘
```

Nunca mostrar:

- senha;
- hash de senha;
- tokens;
- dados internos de autenticação;
- informações sensíveis desnecessárias.

---

# 15. Página de detalhes da categoria

Categorias são simples e não precisam de páginas visualmente grandes.

Exemplo:

```text
← Voltar para categorias

Categoria

Prestação de serviços

                                      [Editar]

┌─────────────────────────────────────────────────────────────┐
│ Informações                                                 │
│                                                             │
│ Nome                                                        │
│ Prestação de serviços                                      │
└─────────────────────────────────────────────────────────────┘
```

Se o cadastro for pequeno demais para justificar uma rota própria, é aceitável utilizar modal de visualização.

Não criar uma página enorme para dois campos.

---

# 16. Página de detalhes do faturamento

Essa é uma das páginas mais importantes.

Criar rota própria:

```text
/faturamentos/:id
```

Estrutura recomendada:

```text
← Voltar para faturamentos

Faturamento

Empresa ABC Ltda.
Competência 08/2026

                             [Ativo] [Cancelar lançamento]

┌─────────────────────────────────────────────────────────────┐
│ Dados do lançamento                                         │
│                                                             │
│ Empresa                       Categoria                     │
│ Empresa ABC Ltda.             Prestação de serviços        │
│                                                             │
│ Competência                   Valor                         │
│ 08/2026                       R$ 15.800,00                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Registro                                                    │
│                                                             │
│ Lançado em                    Lançado por                   │
│ 10/08/2026 08:35              João Silva                   │
└─────────────────────────────────────────────────────────────┘
```

Adicionar outros campos somente se existirem no modelo real.

---

# 17. Valor do faturamento

Como o valor é uma das informações mais importantes do registro, pode receber um pouco mais de destaque.

Exemplo:

```text
Valor do lançamento

R$ 15.800,00
```

Não utilizar fonte exageradamente grande como dashboard.

A página continua sendo uma página documental/de consulta.

---

# 18. Imutabilidade

Para faturamentos confirmados NÃO apresentar:

```text
Editar
```

Não disponibilizar rota:

```text
/faturamentos/:id/editar
```

A página de detalhes deve reforçar visualmente que o registro é histórico e imutável.

Pode haver informação discreta:

```text
Este lançamento não pode ser alterado após a confirmação.
```

Não repetir alertas grandes em todas as páginas se não houver necessidade.

---

# 19. Faturamento cancelado

Quando um faturamento estiver cancelado, a página precisa deixar isso imediatamente evidente.

Exemplo:

```text
Faturamento

Empresa ABC Ltda.
Competência 08/2026

                                      [Cancelado]
```

Além das informações originais:

```text
┌─────────────────────────────────────────────────────────────┐
│ Cancelamento                                                │
│                                                             │
│ Cancelado em                  Cancelado por                 │
│ 12/08/2026 10:45              Maria Souza                  │
│                                                             │
│ Motivo                                                      │
│ Lançamento realizado com valor incorreto.                  │
└─────────────────────────────────────────────────────────────┘
```

O lançamento original deve continuar completamente visível.

Não substituir seus dados pelos dados do cancelamento.

---

# 20. Histórico de cancelamento

As informações de cancelamento devem possuir seção separada dos dados originais.

Exemplo:

```text
Dados do lançamento
────────────────────────

dados originais


Cancelamento
────────────────────────

Cancelado em
12/08/2026 10:45

Cancelado por
Maria Souza

Motivo
Valor lançado incorretamente.
```

Isso deixa claro o que pertence ao fato original e o que pertence ao evento posterior.

---

# 21. Auditoria

Quando existirem campos como:

```text
created_at
created_by
updated_at
cancelled_at
cancelled_by
```

não mostrar os nomes técnicos.

Traduzir para:

```text
Criado em
Criado por
Atualizado em
Cancelado em
Cancelado por
```

Só mostrar informações de auditoria que tenham utilidade real para o usuário interno.

Não expor IDs técnicos sem motivo operacional.

---

# 22. IDs internos

Evitar:

```text
ID
1847
```

como informação principal.

IDs internos podem existir na URL e internamente no sistema sem aparecer para o usuário.

Mostrar somente se houver uma necessidade operacional futura.

---

# 23. Ações no cabeçalho

Ações devem ficar preferencialmente no canto superior direito.

Exemplo para empresa:

```text
[Ativa] [Editar]
```

Exemplo para faturamento:

```text
[Ativo] [Cancelar lançamento]
```

Exemplo para cancelado:

```text
[Cancelado]
```

Não repetir ações no topo e no final da página sem necessidade.

---

# 24. Ação principal e perigosa

Ações comuns:

```text
Editar
```

podem utilizar botão primário ou secundário conforme o contexto.

Ações destrutivas/restritivas:

```text
Cancelar lançamento
Desativar
```

devem ter tratamento visual apropriado.

Não utilizar cor de perigo para simples navegação.

---

# 25. Modais a partir da página de detalhes

A página pode iniciar ações por modal.

Exemplo:

```text
Cancelar lançamento
        ↓
ConfirmCancelamentoModal
```

Não navegar para uma nova página apenas para solicitar um motivo curto de cancelamento.

Por outro lado, edições mais extensas podem navegar para formulário ou utilizar modal conforme o padrão já definido para aquele cadastro.

---

# 26. Loading

Ao acessar:

```text
/faturamentos/182
```

enquanto o registro estiver sendo carregado:

```text
Carregando faturamento...
```

ou skeleton simples se já existir padrão no sistema.

Não mostrar temporariamente:

```text
Empresa: undefined
Valor: R$ NaN
```

---

# 27. Registro não encontrado

Se a API retornar 404:

```text
Faturamento não encontrado.

O registro pode não existir ou não estar mais disponível.

[Voltar para faturamentos]
```

Para empresa:

```text
Empresa não encontrada.
```

Utilizar mensagem específica ao domínio.

---

# 28. Falha de carregamento

Diferenciar 404 de erro de API.

Exemplo:

```text
Não foi possível carregar o faturamento.

[Tentar novamente]
[Voltar para faturamentos]
```

Não apresentar "registro não encontrado" para um erro 500.

---

# 29. Relacionamentos

Quando um registro referencia outra entidade, mostrar informação humana.

Backend:

```js
{
  empresa_id: 12
}
```

Frontend:

```text
Empresa
Metalúrgica ABC Ltda.
```

Não:

```text
Empresa ID
12
```

Se fizer sentido, o nome pode ser clicável:

```text
Metalúrgica ABC Ltda. →
```

levando para:

```text
/empresas/12
```

Somente implementar links quando ajudarem na navegação.

---

# 30. Informações longas

Campos como observações ou motivo de cancelamento devem ocupar a largura total.

Exemplo:

```text
Observação

O lançamento refere-se ao faturamento complementar
do período de agosto de 2026.
```

Não colocar textos longos dentro de uma coluna estreita de 50%.

Preservar quebra natural de linha.

---

# 31. Organização semântica

Não organizar campos simplesmente na ordem em que aparecem no JSON.

Organizar por significado.

Exemplo de faturamento:

```text
Dados do lançamento
- empresa
- categoria
- competência
- valor

Informações complementares
- número de documento
- data do documento
- observação

Registro
- lançado por
- lançado em

Cancelamento
- cancelado por
- cancelado em
- motivo
```

Somente utilizar se esses campos realmente existirem.

---

# 32. Não criar um componente universal excessivo

Evitar:

```text
GenericDetailsPage
DynamicDetails
UniversalRecordViewer
```

recebendo grandes objetos de configuração.

Pode existir um componente pequeno para exibir pares label/valor.

Exemplo conceitual:

```jsx
<DetailItem
  label="CNPJ"
  value={formatCnpj(empresa.cnpj)}
/>
```

Ou um componente para seções:

```jsx
<DetailSection title="Dados da empresa">
  ...
</DetailSection>
```

Isso é reutilização adequada.

A composição da página continua específica para cada domínio.

---

# 33. Componentes reutilizáveis sugeridos

Exemplo:

```text
components/
└── details/
    ├── DetailSection.jsx
    ├── DetailItem.jsx
    └── DetailPageHeader.jsx
```

E:

```text
pages/
├── Empresas/
│   └── EmpresaDetails.jsx
│
├── Usuarios/
│   └── UsuarioDetails.jsx
│
└── Faturamentos/
    └── FaturamentoDetails.jsx
```

Não é obrigatório seguir exatamente os nomes.

Preservar a estrutura existente do projeto quando equivalente.

---

# 34. DetailItem

Um componente simples pode receber:

```js
label
value
```

e opcionalmente:

```js
className
```

Exemplo:

```jsx
<DetailItem
  label="Razão Social"
  value={empresa.razao_social}
/>

<DetailItem
  label="CNPJ"
  value={formatCnpj(empresa.cnpj)}
/>
```

O componente deve apenas padronizar a apresentação.

Não colocar nele lógica de domínio, API ou transformação complexa.

---

# 35. DetailSection

Pode padronizar seções como:

```text
Dados da empresa
Informações do cadastro
Dados do lançamento
Cancelamento
```

Exemplo conceitual:

```jsx
<DetailSection title="Dados do lançamento">
  <div className="row g-4">
    ...
  </div>
</DetailSection>
```

---

# 36. Cabeçalho reutilizável

Um `DetailPageHeader` pode aceitar conceitualmente:

```js
backLabel
backTo
eyebrow
title
subtitle
status
actions
```

Exemplo:

```text
backLabel = "Voltar para faturamentos"
eyebrow = "Faturamento"
title = "Empresa ABC Ltda."
subtitle = "Competência 08/2026"
status = "ATIVO"
```

Evitar transformar o componente em responsável pelas regras das ações.

A página decide quais ações estão disponíveis.

---

# 37. Visualização rápida x página completa

Nem todo cadastro precisa necessariamente de página própria.

Utilizar página completa quando:

- existem várias informações;
- existe histórico;
- existem ações relevantes;
- o registro será consultado com frequência;
- é útil ter URL própria.

Utilizar modal de visualização quando:

- existem pouquíssimos campos;
- a consulta é rápida;
- não existe histórico;
- não existe necessidade real de URL própria.

Para o MVP:

```text
Empresa         → página de detalhes
Usuário         → modal ou página
Categoria       → modal
Faturamento     → página de detalhes
Cancelamento    → preferencialmente dentro do faturamento
```

---

# 38. Consistência visual com tabelas e formulários

As três experiências devem ter funções diferentes:

```text
LISTAGEM
Encontrar registros.

FORMULÁRIO
Criar ou alterar registros.

DETALHES
Consultar registros.
```

Não misturar os padrões.

Listagem:

```text
Empresa ABC | Ativa | ...
```

Formulário:

```text
Razão Social
[ Empresa ABC ]
```

Detalhes:

```text
Razão Social
Empresa ABC
```

O usuário deve perceber visualmente em qual modo está.

---

# 39. URLs

Preferir URLs previsíveis:

```text
/empresas
/empresas/:id

/usuarios
/usuarios/:id

/faturamentos
/faturamentos/:id
```

Rotas de edição somente quando permitidas:

```text
/empresas/:id/editar
```

Não criar:

```text
/faturamentos/:id/editar
```

devido à regra de imutabilidade.

---

# 40. Regra final

Antes de implementar uma página de detalhes:

1. consultar o modelo real do backend;
2. identificar os campos retornados pelo endpoint;
3. separar informações por significado;
4. definir a informação principal do cabeçalho;
5. identificar status;
6. identificar ações permitidas;
7. formatar os dados para leitura;
8. exibir histórico/auditoria quando pertinente.

Não simplesmente iterar:

```js
Object.entries(data)
```

e imprimir automaticamente todas as propriedades recebidas da API.

A página deve ser deliberadamente organizada para uso humano.