import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { executeQuery, getConfiguredSupabase } from './helpers.js'

const tables = [
  {
    name: 'empresas',
    columns: ['id', 'nome', 'cnpj'],
  },
  {
    name: 'categorias',
    columns: ['id', 'empresa_id', 'nome'],
  },
  {
    name: 'lancamentos',
    columns: [
      'id',
      'empresa_id',
      'categoria_id',
      'tipo_lancamento',
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
  },
]

describe('estrutura das tabelas do P0', () => {
  for (const table of tables) {
    test(`${table.name} existe e expoe as colunas combinadas`, async () => {
      const client = getConfiguredSupabase()
      const { data } = await executeQuery(
        client.from(table.name).select(table.columns.join(',')).limit(1),
        `Tabela ou colunas invalidas em ${table.name}`,
      )

      assert.ok(Array.isArray(data))

      if (data.length === 1) {
        assert.deepEqual(
          Object.keys(data[0]).sort(),
          [...table.columns].sort(),
          `As colunas retornadas por ${table.name} diferem do contrato.`,
        )
      }
    })
  }
})
