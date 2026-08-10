# Padrão dos formulários do sistema

O sistema deve manter um padrão visual e funcional consistente para todos os formulários.

Tecnologias já definidas:

- React + Vite
- Bootstrap 5
- CSS próprio para identidade visual
- paleta principal:
  - `#222831`
  - `#393E46`
  - `#00ADB5`
  - `#EEEEEE`

Não adicionar novas bibliotecas de formulários ou UI sem necessidade.

---

# 1. Princípios gerais

Todos os formulários devem:

- possuir labels visíveis;
- indicar claramente campos obrigatórios;
- apresentar mensagens de validação próximas ao campo;
- preservar os valores preenchidos quando ocorrer erro;
- impedir múltiplos envios enquanto uma operação estiver sendo processada;
- possuir feedback visual de carregamento;
- exibir mensagem clara quando a operação for concluída;
- evitar campos desnecessários;
- utilizar os mesmos padrões de botão, espaçamento e validação em todo o sistema.

Não utilizar apenas placeholder como identificação do campo.

Exemplo:

```text
CNPJ *
[ 00.000.000/0000-00 ]

Razão Social *
[ Empresa Exemplo Ltda. ]
```

---

# 2. Layout dos formulários

Utilizar Bootstrap Grid.

Em desktop, utilizar duas colunas quando os campos tiverem relação ou forem curtos.

Exemplo:

```text
┌────────────────────────────┬────────────────────────────┐
│ CNPJ                       │ Situação                   │
│ [_______________________]  │ [ Ativa              ▼ ]  │
├────────────────────────────┴────────────────────────────┤
│ Razão Social                                            │
│ [____________________________________________________]  │
└─────────────────────────────────────────────────────────┘
```

Campos de texto maiores podem utilizar toda a largura.

Em dispositivos móveis, os campos devem ficar automaticamente em uma coluna.

Não criar formulários excessivamente largos.

Para páginas completas, limitar a largura útil do formulário para facilitar a leitura.

---

# 3. Ações dos formulários

O padrão principal deve ser:

```text
[ Cancelar ]       [ Salvar ]
```

O botão principal utiliza a cor `#00ADB5`.

O botão Cancelar deve ser secundário e visualmente menos destacado.

Durante o envio:

```text
[ Cancelar ]       [ Salvando... ]
```

O botão de salvar deve ficar desabilitado enquanto a requisição estiver em andamento.

Não permitir múltiplos submits.

---

# 4. Validação

A validação deve acontecer em dois níveis:

1. validação no frontend para melhorar a experiência;
2. validação obrigatória no backend para garantir as regras do sistema.

Nunca considerar uma validação do frontend como proteção suficiente.

Utilizar os estados visuais do Bootstrap:

```text
is-invalid
invalid-feedback
```

Exemplo:

```text
CNPJ *
[ 123 ]   ← borda de erro

Informe um CNPJ válido.
```

As mensagens devem explicar o problema diretamente.

Evitar mensagens genéricas como:

```text
Campo inválido.
```

Quando for possível informar:

```text
Informe um CNPJ com 14 dígitos.
```

---

# 5. Formatação não é armazenamento

Máscaras devem existir apenas para facilitar a digitação.

Exemplo:

```text
CNPJ exibido:
12.345.678/0001-90

valor enviado ao backend:
12345678000190
```

O mesmo princípio deve ser utilizado para valores monetários.

A interface pode exibir:

```text
R$ 1.250,50
```

mas o valor tratado internamente deve permanecer numérico.

Nunca salvar strings formatadas como representação principal de valores monetários.

---

# 6. Formulário de usuário

Cadastro e edição de usuários são operações relativamente simples e podem ser realizados em modal Bootstrap.

Exemplo:

```text
┌──────────────────────────────────────────┐
│ Novo usuário                         X   │
├──────────────────────────────────────────┤
│ Nome *                                   │
│ [____________________________________]   │
│                                          │
│ E-mail *                                 │
│ [____________________________________]   │
│                                          │
│ Senha *                                  │
│ [____________________________________]   │
│                                          │
├──────────────────────────────────────────┤
│                [Cancelar] [Criar usuário]│
└──────────────────────────────────────────┘
```

Campos inicialmente necessários:

- nome;
- e-mail;
- senha no cadastro;
- situação, caso o modelo de usuários possua ativo/inativo.

Não criar:

- vínculo do usuário com empresa;
- tipo CLIENTE/ESCRITORIO;
- permissões personalizadas;
- estrutura de roles complexa.

O sistema é de uso interno do escritório.

## Edição de usuário

Na edição:

- nome e e-mail podem ser alterados conforme permitido pelo backend;
- não apresentar a senha atual;
- alteração de senha deve ser tratada separadamente se necessária.

Não preencher campos de senha com valores fictícios.

---

# 7. Formulário de empresa

Cadastro e edição de empresa também podem utilizar modal, desde que o número de campos permaneça pequeno.

Exemplo:

```text
Nova empresa

CNPJ *
[________________________]

Razão Social *
[____________________________________________]

Nome Fantasia
[____________________________________________]

Situação
[ Ativa ▼ ]

                         [Cancelar] [Salvar]
```

Utilizar somente campos existentes no modelo de dados real.

Não adicionar campos apenas porque seriam comuns em sistemas empresariais.

Por exemplo, não inventar:

- endereço;
- telefone;
- contador responsável;
- regime tributário;
- inscrição estadual;
- estabelecimento/filial;

se esses campos não fizerem parte do MVP atual.

O frontend deve refletir o banco e as regras já definidas, e não aumentar o escopo do sistema.

---

# 8. Categorias de faturamento

O cadastro de categoria deve ser ainda mais simples.

Preferencialmente utilizar modal.

Exemplo:

```text
Nova categoria

Nome *
[________________________________________]

Descrição
[________________________________________]

                         [Cancelar] [Salvar]
```

Se o banco possuir apenas o nome, não adicionar descrição.

A interface deve trabalhar exclusivamente com os campos efetivamente existentes no modelo.

---

# 9. Lançamento de faturamento

O lançamento de faturamento é uma operação central do sistema e NÃO deve ser tratado como um pequeno modal genérico.

Criar página própria:

```text
/faturamentos/novo
```

Estrutura:

```text
Novo lançamento

Registre um faturamento para uma empresa.

┌───────────────────────────────────────────────────────┐
│ Empresa *                                             │
│ [ Selecione uma empresa                         ▼ ]   │
│                                                       │
│ Categoria *                                           │
│ [ Selecione uma categoria                       ▼ ]   │
│                                                       │
│ Competência *                    Valor *               │
│ [ MM/AAAA ]                      [ R$ 0,00 ]           │
│                                                       │
│ Data do documento                Número do documento   │
│ [ dd/mm/aaaa ]                   [_________________]   │
│                                                       │
│ Observação                                            │
│ [_________________________________________________]   │
│                                                       │
│                          [Cancelar] [Revisar lançamento]│
└───────────────────────────────────────────────────────┘
```

IMPORTANTE:

Os campos acima são uma referência de organização.

O Codex deve utilizar somente os campos que efetivamente existirem no modelo de `FATURAMENTOS` definido no backend.

Não criar automaticamente `dataDocumento`, `numeroDocumento`, `observacao` ou outros campos caso eles não existam no domínio atual.

---

# 10. Seleção da empresa

Empresa deve ser selecionada através de `<select>` ou componente equivalente simples.

Não permitir digitação livre de empresa.

Exemplo:

```text
Empresa *
[ Metalúrgica ABC Ltda.                     ▼ ]
```

O valor submetido deve ser o identificador da empresa, e não seu nome.

Exemplo conceitual:

```js
{
  empresa_id: 14
}
```

e não:

```js
{
  empresa: "Metalúrgica ABC Ltda."
}
```

---

# 11. Categoria

A mesma regra vale para categoria.

Mostrar o nome ao usuário:

```text
Prestação de serviços
```

mas trabalhar internamente com o identificador:

```js
categoria_id
```

Categorias disponíveis devem respeitar as regras definidas pelo backend.

---

# 12. Competência

Quando o lançamento for mensal, a competência deve ser apresentada de forma clara:

```text
Competência
[ 08/2026 ]
```

O formato de transporte para a API deve respeitar o contrato já implementado pelo backend.

Não assumir que a string visual `08/2026` deve ser armazenada dessa forma no banco.

Separar:

- apresentação;
- estado interno;
- formato enviado à API.

---

# 13. Valores monetários

O campo de faturamento deve possuir tratamento específico.

Exibição:

```text
R$ 12.500,75
```

O estado e o valor enviado para o backend não devem depender dessa string formatada.

Não utilizar `parseFloat()` diretamente sobre:

```text
"12.500,75"
```

pois isso produz comportamento incorreto.

Normalizar o valor antes do envio.

O backend continua sendo responsável pela validação definitiva.

Não utilizar ponto flutuante JavaScript para executar cálculos financeiros complexos.

---

# 14. Confirmação do lançamento

Como os lançamentos possuem regra de imutabilidade após criação, o fluxo de criação deve deixar isso claro.

Ao invés de salvar imediatamente, o botão principal do formulário pode ser:

```text
[ Revisar lançamento ]
```

Após clicar, mostrar um resumo antes da confirmação final:

```text
Confirmar lançamento

Empresa
Metalúrgica ABC Ltda.

Competência
08/2026

Categoria
Prestação de serviços

Valor
R$ 15.800,00

────────────────────────────

Após confirmado, este lançamento não poderá ser editado.
Caso esteja incorreto, deverá ser cancelado conforme as regras
do sistema.

                 [Voltar] [Confirmar lançamento]
```

A confirmação pode utilizar um modal Bootstrap.

Somente após `Confirmar lançamento` enviar o POST para a API.

Esse fluxo deve existir principalmente porque lançamentos não são editáveis posteriormente.

---

# 15. Imutabilidade do faturamento

Depois de criado, um faturamento não deve possuir botão:

```text
Editar
```

Não criar:

```text
/faturamentos/:id/editar
```

O lançamento deve possuir apenas operações permitidas pelas regras de negócio, como:

- visualizar;
- cancelar, quando aplicável.

A interface deve reforçar a regra do backend e não oferecer caminhos para alterações proibidas.

---

# 16. Cancelamento

Cancelamento não equivale a exclusão.

Não utilizar:

```text
Excluir lançamento
```

Utilizar:

```text
Cancelar lançamento
```

O cancelamento deve exigir confirmação.

Se o domínio exigir motivo:

```text
Cancelar lançamento

Motivo do cancelamento *
[____________________________________________]

Este lançamento continuará registrado no histórico.

                     [Voltar] [Cancelar lançamento]
```

Utilizar estilo de perigo para a ação final.

O frontend nunca deve simplesmente remover o registro da interface como se ele nunca tivesse existido.

Após cancelar, atualizar a listagem para refletir o novo estado.

---

# 17. Tratamento de erros da API

O formulário deve diferenciar erros previsíveis.

Exemplos:

```text
400
Dados inválidos.

409
Já existe um registro incompatível com esta operação.

500
Não foi possível concluir a operação.
```

Se o backend retornar mensagem de domínio segura e apropriada para o usuário, ela pode ser apresentada.

Não exibir:

- stack trace;
- SQL;
- nomes internos de tabelas;
- detalhes técnicos de exceções.

---

# 18. Estado de carregamento

Enquanto dados necessários estiverem sendo buscados, como empresas e categorias:

```text
Carregando dados...
```

O formulário não deve aparecer parcialmente funcional.

Se ocorrer erro:

```text
Não foi possível carregar os dados necessários.

[Tentar novamente]
```

---

# 19. Estados vazios

Se não existirem empresas:

```text
Nenhuma empresa cadastrada.

Cadastre uma empresa antes de registrar um faturamento.

[Cadastrar empresa]
```

Se não existirem categorias:

```text
Nenhuma categoria de faturamento cadastrada.

Cadastre uma categoria antes de registrar um faturamento.

[Cadastrar categoria]
```

Não apresentar um `<select>` vazio sem explicar por que o lançamento não pode continuar.

---

# 20. Organização do código

Não criar toda a lógica dentro das páginas.

Uma organização aceitável:

```text
src/
├── components/
│   ├── forms/
│   │   ├── FormActions.jsx
│   │   ├── FormError.jsx
│   │   └── MoneyInput.jsx
│   │
│   └── common/
│       └── ConfirmModal.jsx
│
├── pages/
│   ├── Usuarios/
│   │   └── components/
│   │       └── UsuarioForm.jsx
│   │
│   ├── Empresas/
│   │   └── components/
│   │       └── EmpresaForm.jsx
│   │
│   ├── Categorias/
│   │   └── components/
│   │       └── CategoriaForm.jsx
│   │
│   └── Faturamentos/
│       ├── NovoFaturamento.jsx
│       └── components/
│           ├── FaturamentoForm.jsx
│           └── ConfirmarFaturamentoModal.jsx
```

Essa estrutura é apenas uma referência.

Se a estrutura existente do projeto já tiver padrão equivalente, preservar o padrão existente ao invés de reorganizar arquivos sem necessidade.

---

# 21. Evitar abstração excessiva

Não criar algo como:

```text
UniversalForm
DynamicForm
GenericCrudForm
FormBuilder
```

apenas para evitar algumas linhas repetidas.

Usuário, empresa, categoria e faturamento possuem regras diferentes.

Compartilhar apenas comportamentos genuinamente reutilizáveis.

Exemplos adequados:

- `MoneyInput`;
- `ConfirmModal`;
- `FormActions`;
- feedback de erro;
- loading.

---

# 22. Regra principal de implementação

Antes de implementar qualquer formulário:

1. verificar o modelo correspondente no backend;
2. verificar a rota/API existente;
3. identificar campos obrigatórios;
4. identificar validações;
5. identificar formato esperado pelo endpoint;
6. somente então construir o frontend.

Não inventar campos, endpoints ou regras para completar a interface.

Se frontend e backend divergirem, considerar o domínio/backend existente como referência e sinalizar a divergência antes de criar uma solução paralela.