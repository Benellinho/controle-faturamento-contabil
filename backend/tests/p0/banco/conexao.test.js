import assert from 'node:assert/strict'
import { test } from 'node:test'
import { executeQuery, getConfiguredSupabase } from './helpers.js'

test('conecta ao Supabase configurado usando a service role do backend', async () => {
  const client = getConfiguredSupabase()
  const { data } = await executeQuery(
    client.from('empresas').select('id').limit(1),
    'Nao foi possivel consultar o Supabase configurado',
  )

  assert.ok(Array.isArray(data), 'A consulta de conexao deve retornar uma lista.')
})
