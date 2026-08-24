import { categoriaResponseSchema } from '../categorias/categorias.schema.js'
import { empresaResponseSchema } from '../empresas/empresas.schema.js'

const safeIdSchema = {
  type: 'integer',
  minimum: 1,
  maximum: Number.MAX_SAFE_INTEGER,
}

const nullableIdSchema = {
  anyOf: [safeIdSchema, { type: 'null' }],
}

const nullableStringSchema = {
  anyOf: [{ type: 'string' }, { type: 'null' }],
}

const monetaryValueSchema = {
  type: 'number',
  exclusiveMinimum: 0,
  maximum: 999999999999.99,
  multipleOf: 0.01,
}

const balanceValueSchema = {
  type: 'number',
  minimum: 0,
  maximum: 999999999999.99,
  multipleOf: 0.01,
}

const nullableBalanceValueSchema = {
  anyOf: [balanceValueSchema, { type: 'null' }],
}

const taxPercentageSchema = {
  type: 'number',
  minimum: 0,
  maximum: 100,
  multipleOf: 0.01,
}

const referenceDateSchema = {
  type: 'string',
  format: 'date',
  pattern: '^\\d{4}-\\d{2}-01$',
}

const lancamentoListItemSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'id',
    'data_referencia',
    'empresa',
    'categoria',
    'valor',
    'percentual_imposto',
    'estoque_inicial',
    'estoque_final',
    'caixa_inicial',
    'caixa_final',
    'status',
    'criado_em',
  ],
  properties: {
    id: safeIdSchema,
    data_referencia: referenceDateSchema,
    empresa: empresaResponseSchema,
    categoria: categoriaResponseSchema,
    valor: monetaryValueSchema,
    percentual_imposto: taxPercentageSchema,
    estoque_inicial: nullableBalanceValueSchema,
    estoque_final: nullableBalanceValueSchema,
    caixa_inicial: nullableBalanceValueSchema,
    caixa_final: nullableBalanceValueSchema,
    status: { type: 'string', enum: ['ATIVO', 'SUBSTITUIDO'] },
    criado_em: { type: 'string' },
  },
}

const lancamentoCreationResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'id',
    'empresa_id',
    'categoria_id',
    'data_referencia',
    'valor',
    'percentual_imposto',
    'estoque_inicial',
    'estoque_final',
    'caixa_inicial',
    'caixa_final',
    'observacao',
    'status',
    'substitui_lancamento_id',
    'motivo_substituicao',
    'criado_em',
    'substituido_em',
  ],
  properties: {
    id: safeIdSchema,
    empresa_id: safeIdSchema,
    categoria_id: safeIdSchema,
    data_referencia: referenceDateSchema,
    valor: monetaryValueSchema,
    percentual_imposto: taxPercentageSchema,
    estoque_inicial: balanceValueSchema,
    estoque_final: balanceValueSchema,
    caixa_inicial: balanceValueSchema,
    caixa_final: balanceValueSchema,
    observacao: nullableStringSchema,
    status: { type: 'string', const: 'ATIVO' },
    substitui_lancamento_id: { type: 'null' },
    motivo_substituicao: { type: 'null' },
    criado_em: { type: 'string' },
    substituido_em: { type: 'null' },
  },
}

const lancamentoReplacementResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'mensagem',
    'lancamento_original_id',
    'novo_lancamento_id',
  ],
  properties: {
    mensagem: { type: 'string' },
    lancamento_original_id: safeIdSchema,
    novo_lancamento_id: safeIdSchema,
  },
}

const lancamentoDetailSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    ...lancamentoListItemSchema.required,
    'observacao',
    'substitui_lancamento_id',
    'motivo_substituicao',
    'lancamento_anterior_id',
    'lancamento_substituto_id',
    'substituido_em',
  ],
  properties: {
    ...lancamentoListItemSchema.properties,
    observacao: nullableStringSchema,
    substitui_lancamento_id: nullableIdSchema,
    motivo_substituicao: nullableStringSchema,
    lancamento_anterior_id: nullableIdSchema,
    lancamento_substituto_id: nullableIdSchema,
    substituido_em: nullableStringSchema,
  },
}

export const listarLancamentosSchema = {
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: {
      empresa_id: safeIdSchema,
      categoria_id: safeIdSchema,
      data: { type: 'string', format: 'date' },
      ano: { type: 'integer', minimum: 2000, maximum: 9999 },
      status: { type: 'string', enum: ['ATIVO', 'SUBSTITUIDO'] },
    },
  },
  response: {
    200: {
      type: 'array',
      items: lancamentoListItemSchema,
    },
  },
}

export const obterLancamentoSchema = {
  params: {
    type: 'object',
    additionalProperties: false,
    required: ['id'],
    properties: {
      id: safeIdSchema,
    },
  },
  response: {
    200: lancamentoDetailSchema,
  },
}

export const criarLancamentoSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['empresa_id', 'categoria_id', 'data_referencia', 'valor', 'percentual_imposto', 'estoque_inicial', 'estoque_final', 'caixa_inicial', 'caixa_final'],
    properties: {
      empresa_id: safeIdSchema,
      categoria_id: safeIdSchema,
      data_referencia: referenceDateSchema,
      valor: monetaryValueSchema,
      percentual_imposto: taxPercentageSchema,
      estoque_inicial: balanceValueSchema,
      estoque_final: balanceValueSchema,
      caixa_inicial: balanceValueSchema,
      caixa_final: balanceValueSchema,
      observacao: nullableStringSchema,
    },
  },
  response: {
    201: lancamentoCreationResponseSchema,
  },
}

export const criarLancamentosLoteSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['empresa_id', 'data_referencia', 'estoque_inicial', 'estoque_final', 'caixa_inicial', 'caixa_final', 'itens'],
    properties: {
      empresa_id: safeIdSchema,
      data_referencia: referenceDateSchema,
      estoque_inicial: balanceValueSchema,
      estoque_final: balanceValueSchema,
      caixa_inicial: balanceValueSchema,
      caixa_final: balanceValueSchema,
      itens: {
        type: 'array',
        minItems: 1,
        maxItems: 100,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['categoria_id', 'valor', 'percentual_imposto'],
          properties: {
            categoria_id: safeIdSchema,
            valor: monetaryValueSchema,
            percentual_imposto: taxPercentageSchema,
            observacao: nullableStringSchema,
          },
        },
      },
    },
  },
  response: {
    201: {
      type: 'object',
      additionalProperties: false,
      required: ['mensagem', 'total', 'lancamentos'],
      properties: {
        mensagem: { type: 'string' },
        total: { type: 'integer', minimum: 1 },
        lancamentos: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['id', 'categoria_id'],
            properties: {
              id: safeIdSchema,
              categoria_id: safeIdSchema,
            },
          },
        },
      },
    },
  },
}

export const substituirLancamentoSchema = {
  params: {
    type: 'object',
    additionalProperties: false,
    required: ['id'],
    properties: {
      id: safeIdSchema,
    },
  },
  body: {
    type: 'object',
    additionalProperties: false,
    required: [
      'categoria_id',
      'data_referencia',
      'valor',
      'percentual_imposto',
      'motivo_substituicao',
    ],
    properties: {
      categoria_id: safeIdSchema,
      data_referencia: referenceDateSchema,
      valor: monetaryValueSchema,
      percentual_imposto: taxPercentageSchema,
      observacao: nullableStringSchema,
      motivo_substituicao: { type: 'string', minLength: 1 },
    },
  },
  response: {
    201: lancamentoReplacementResponseSchema,
  },
}
