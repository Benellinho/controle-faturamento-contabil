export const empresaResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'nome', 'cnpj'],
  properties: {
    id: { type: 'integer', minimum: 1 },
    nome: { type: 'string' },
    cnpj: { type: 'string', pattern: '^\\d{14}$' },
  },
}

export const listarEmpresasSchema = {
  response: {
    200: {
      type: 'array',
      items: empresaResponseSchema,
    },
  },
}
