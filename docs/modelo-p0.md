# P0 — Protótipo Mínimo de Lançamentos e Substituições

## 1. Objetivo

O P0 valida o núcleo do sistema de controle de faturamento:

> Cadastrar um lançamento, consultá-lo e corrigir eventuais erros por substituição, sem apagar ou editar o registro original.

O protótipo deve comprovar a imutabilidade dos dados de negócio e a navegação entre um lançamento original e seus substitutos. Ele não representa o MVP completo e deve ser rápido de implementar.

## 2. Premissas da demonstração

- um lançamento representa um valor de faturamento/receita;
- a referência é mensal e o usuário informa somente mês e ano;
- o sistema inicia no mês atual e persiste a competência como o primeiro dia do mês;
- duplicidades não serão identificadas automaticamente;
- empresas, com nome e CNPJ, e categorias serão previamente inseridas no banco;
- a listagem exibirá registros `ATIVO` e `SUBSTITUIDO`;
- o P0 será usado somente para validar criação, consulta, substituição e histórico;
- regras e arquitetura poderão ser revistas depois da validação com o cliente.

## 3. Escopo

O P0 terá somente:

- empresas e categorias previamente cadastradas;
- criação transacional de lançamentos para todas as categorias da empresa;
- listagem e filtros básicos;
- visualização de detalhes;
- substituição com motivo obrigatório;
- navegação entre lançamento anterior e próximo;
- status `ATIVO` e `SUBSTITUIDO`.

## 4. Fora do escopo

Não implementar no P0:

- login, usuários, cargos ou permissões;
- telas de cadastro de empresas e categorias;
- edição ou exclusão de lançamentos;
- cancelamento;
- competências, fechamento, conferência ou reabertura mensal;
- dashboard, gráficos, acumulados, limites ou alertas;
- anexos, importações ou integrações;
- filiais, documentos ou auditoria de usuários;
- paginação e busca avançadas.

Essas funcionalidades poderão ser avaliadas no MVP.

## 5. Fluxo principal

```text
Abrir listagem
      ↓
Criar lote de lançamentos
      ↓
Selecionar empresa e carregar todas as categorias
      ↓
Informar data comum, valor, percentual de imposto e observação por categoria
      ↓
Salvar como ATIVO
      ↓
Abrir lançamento
      ↓
Solicitar substituição
      ↓
Corrigir dados e informar motivo
      ↓
Confirmar
      ↓
Original vira SUBSTITUIDO
      ↓
Novo registro nasce ATIVO
      ↓
Histórico permanece navegável
```

## 6. Regras de negócio

### 6.1 Imutabilidade

Depois de criado, um lançamento não pode ter seus dados de negócio editados diretamente e não pode ser excluído.

No P0, essa regra será garantida pelo backend, sem endpoints de edição ou exclusão. Triggers e permissões especiais no banco não são necessárias nesta etapa.

### 6.2 Empresa e categoria

Cada categoria pertence a uma empresa. Ao selecionar uma empresa, o formulário deve mostrar todas as suas categorias. A confirmação deve gravar todas em uma única transação ou não gravar nenhuma.

Cada empresa possui CNPJ obrigatório, único e com dígitos verificadores válidos. O banco e a API armazenam o CNPJ somente com os 14 dígitos, enquanto o frontend o apresenta no formato `00.000.000/0000-00`.

O frontend melhora a experiência, mas a API também deve impedir o uso de uma categoria pertencente a outra empresa. A validação da API é suficiente para o P0.

### 6.3 Status

Existem somente dois status:

- `ATIVO`: lançamento atualmente válido;
- `SUBSTITUIDO`: lançamento que deixou de ser válido porque foi substituído.

Um lançamento `SUBSTITUIDO` não pode ser substituído novamente. A correção deve partir do último lançamento `ATIVO` da cadeia.

### 6.4 Substituição

Uma substituição deve:

- partir de um lançamento existente e `ATIVO`;
- manter a mesma empresa;
- permitir alterar categoria, data, valor, percentual de imposto e observação;
- exigir motivo em texto livre;
- criar um novo lançamento `ATIVO`;
- marcar o original como `SUBSTITUIDO`;
- ligar o novo registro ao anterior;
- acontecer integralmente dentro de uma transação.

Se qualquer etapa falhar, nenhuma alteração parcial pode permanecer.

## 7. Dados do lançamento

### Novo lançamento

Campos do formulário:

- empresa — obrigatória, identificada por nome e CNPJ;
- mês de referência — obrigatório, iniciado no mês atual e persistido como o primeiro dia do mês;
- todas as categorias da empresa — obrigatórias e exibidas juntas;
- valor por categoria — obrigatório e igual ou maior que zero;
- percentual de imposto por categoria — obrigatório, entre `0` e `100`, com até duas casas decimais;
- observação por categoria — opcional.

O valor do imposto não é armazenado. Ele é calculado por `valor * percentual_imposto / 100`.

Todo lançamento comum nasce com:

```text
status = ATIVO
lançamento anterior = nenhum
motivo da substituição = nenhum
data da substituição = nenhuma
```

### Formulário de substituição

O formulário reutiliza os dados do lançamento original:

- empresa apenas para consulta;
- categoria editável;
- mês de referência editável, sempre persistido com dia `01`;
- valor editável;
- percentual de imposto editável;
- observação editável;
- motivo da substituição obrigatório.

## 8. Telas

### 8.1 Listagem

Deve conter:

```text
LANÇAMENTOS

[ Empresa ▼ ] [ Categoria ▼ ] [ Data ] [ Status ▼ ] [ Buscar ]
[ Limpar filtros ]                         [ + Novo lançamento ]

Data       Empresa                            Categoria  Valor       Status
20/08/26   Empresa Exemplo Alfa — 99.999.999/0001-91  Vendas     5.500,00  ATIVO
15/08/26   Empresa Exemplo Gama — 77.777.777/0001-91  Anexo III  3.500,00  SUBSTITUIDO
```

Cada linha deve abrir a visualização do lançamento.

### 8.2 Novo lançamento

```text
NOVOS LANÇAMENTOS

Empresa *              [ Empresa Exemplo Alfa — 99.999.999/0001-91 ▼ ]
Mês de referência *    [ 08/2026 ]
Serviços               [ R$ 5.000,00 ] [ 7,25% ] [ observação ]
Anexo III              [ R$ 2.000,00 ] [ 6,00% ] [ observação ]

[ Cancelar ]           [ Salvar todos ]
```

### 8.3 Visualização

A tela deve mostrar todos os dados do lançamento e seu status.

Se estiver `ATIVO`, deve apresentar `Substituir lançamento`. Não devem existir opções de editar ou excluir.

Se estiver `SUBSTITUIDO`, deve mostrar o motivo e o botão `Ver próximo lançamento`.

Quando o lançamento substituir outro, deve mostrar `Ver lançamento anterior`.

### 8.4 Substituição

```text
SUBSTITUIR LANÇAMENTO

Empresa               Empresa Exemplo Alfa — 99.999.999/0001-91
Categoria             [ Serviços ▼ ]
Data                  [ 20/08/2026 ]
Valor                 [ R$ 5.500,00 ]
% de imposto          [ 7,25 ]
Observação            [________________]
Motivo *              [________________]

[ Cancelar ]          [ Confirmar substituição ]
```

Após o sucesso, o sistema deve abrir o novo lançamento.

## 9. Histórico

O relacionamento entre lançamentos deve permitir cadeias como:

```text
#10 → #15 → #21
```

Somente o último registro permanece `ATIVO`. Os anteriores ficam `SUBSTITUIDO`.

O P0 não precisa montar uma linha do tempo completa. Basta navegar entre:

- `Anterior`: registro imediatamente anterior;
- `Próximo`: substituto direto, que pode não ser o último ativo da cadeia.

## 10. Integridade da substituição

A operação deve seguir este fluxo mínimo:

```text
BEGIN

buscar e validar o original ATIVO
validar categoria, data, valor e motivo
criar o substituto ATIVO
atualizar o original somente se ainda estiver ATIVO
confirmar que exatamente um original foi atualizado

COMMIT
```

Se qualquer validação ou operação falhar:

```text
ROLLBACK
```

Bloqueios explícitos, índices exclusivos e outros mecanismos avançados de concorrência ficam para o MVP.

## 11. Referências técnicas

Os detalhes técnicos foram separados para evitar repetição neste documento:

- [Modelo de banco do P0](Banco/modelo-p0.md): tabelas, campos, SQL, índices, dados iniciais e transação;
- [Modelo de endpoints do P0](Endpoints/modelo-endpoints-p0.md): rotas, filtros, payloads, respostas, validações e erros.

## 12. Testes obrigatórios

- criar um lançamento válido e confirmar o status `ATIVO`;
- rejeitar criação sem empresa, categoria, data ou valor;
- confirmar que cada empresa possui CNPJ válido e único;
- rejeitar categoria pertencente a outra empresa;
- rejeitar valor igual ou menor que zero;
- substituir um lançamento normalmente;
- exigir motivo da substituição;
- rejeitar substituição de registro já substituído;
- confirmar que o original permanece armazenado e inalterado;
- testar uma cadeia com três lançamentos;
- confirmar rollback quando a substituição falhar.

## 13. Critério de aceite

O P0 estará concluído quando for possível demonstrar:

1. abrir a listagem;
2. criar um lançamento de R$ 5.000,00;
3. confirmar que não existe edição ou exclusão;
4. substituir o valor por R$ 5.500,00 com um motivo;
5. visualizar o novo lançamento `ATIVO`;
6. acessar o anterior e confirmar que continua com R$ 5.000,00;
7. confirmar que o anterior está `SUBSTITUIDO` e exibe o motivo da substituição;
8. navegar novamente para o próximo lançamento.

Se esse cenário funcionar, o objetivo principal do P0 foi atingido.

## 14. O que não deve atrasar o P0

Não gastar tempo nesta etapa com:

- arquitetura excessivamente genérica;
- design perfeito ou componentes altamente abstratos;
- triggers, RLS ou permissões especiais;
- restrições compostas entre empresa e categoria;
- prevenção automática de duplicidades;
- bloqueios avançados de concorrência;
- padronização completa dos erros;
- linha do tempo completa;
- suíte extensa de testes automatizados;
- otimizações prematuras.

## 15. Definição resumida

> O P0 permite selecionar empresas e categorias previamente cadastradas, criar e consultar lançamentos e corrigir erros exclusivamente por substituições rastreáveis, preservando os registros anteriores.
