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

const lancamentoListItemSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'id',
    'data_referencia',
    'empresa',
    'categoria',
    'valor',
    'status',
    'criado_em',
  ],
  properties: {
    id: safeIdSchema,
    data_referencia: { type: 'string', format: 'date' },
    empresa: empresaResponseSchema,
    categoria: categoriaResponseSchema,
    valor: monetaryValueSchema,
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
    data_referencia: { type: 'string', format: 'date' },
    valor: monetaryValueSchema,
    observacao: nullableStringSchema,
    status: { type: 'string', const: 'ATIVO' },
    substitui_lancamento_id: { type: 'null' },
    motivo_substituicao: { type: 'null' },
    criado_em: { type: 'string' },
    substituido_em: { type: 'null' },
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
    required: ['empresa_id', 'categoria_id', 'data_referencia', 'valor'],
    properties: {
      empresa_id: safeIdSchema,
      categoria_id: safeIdSchema,
      data_referencia: { type: 'string', format: 'date' },
      valor: monetaryValueSchema,
      observacao: nullableStringSchema,
    },
  },
  response: {
    201: lancamentoCreationResponseSchema,
  },
}
