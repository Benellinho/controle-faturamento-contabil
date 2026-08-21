export const categoriaResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'nome'],
  properties: {
    id: { type: 'integer', minimum: 1 },
    nome: { type: 'string' },
  },
}

export const listarCategoriasSchema = {
  params: {
    type: 'object',
    additionalProperties: false,
    required: ['empresaId'],
    properties: {
      empresaId: {
        type: 'integer',
        minimum: 1,
        maximum: Number.MAX_SAFE_INTEGER,
      },
    },
  },
  response: {
    200: {
      type: 'array',
      items: categoriaResponseSchema,
    },
  },
}
