import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { executeQuery, getConfiguredSupabase, isValidCnpj } from './helpers.js'

async function loadSeedData() {
  const client = getConfiguredSupabase()
  const [empresasResult, categoriasResult] = await Promise.all([
    executeQuery(
      client.from('empresas').select('id,nome,cnpj').order('id'),
      'Falha ao consultar empresas',
    ),
    executeQuery(
      client.from('categorias').select('id,empresa_id,nome').order('id'),
      'Falha ao consultar categorias',
    ),
  ])

  return {
    empresas: empresasResult.data,
    categorias: categoriasResult.data,
  }
}

describe('dados iniciais e relacionamentos do P0', () => {
  test('seed possui ao menos tres empresas com CNPJs validos e unicos', async () => {
    const { empresas } = await loadSeedData()

    assert.ok(empresas.length >= 3, 'O seed deve possuir pelo menos tres empresas.')

    const cnpjs = new Set()

    for (const empresa of empresas) {
      assert.ok(String(empresa.nome ?? '').trim(), `Empresa ${empresa.id} sem nome.`)
      assert.ok(isValidCnpj(empresa.cnpj), `Empresa ${empresa.id} possui CNPJ invalido.`)
      assert.ok(!cnpjs.has(empresa.cnpj), `CNPJ repetido: ${empresa.cnpj}.`)
      cnpjs.add(empresa.cnpj)
    }
  })

  test('categorias pertencem a empresas existentes e cobrem tres empresas', async () => {
    const { empresas, categorias } = await loadSeedData()
    const empresaIds = new Set(empresas.map((empresa) => String(empresa.id)))
    const empresasComCategoria = new Set()

    assert.ok(categorias.length >= 3, 'O seed deve possuir categorias de demonstracao.')

    for (const categoria of categorias) {
      assert.ok(
        empresaIds.has(String(categoria.empresa_id)),
        `Categoria ${categoria.id} referencia uma empresa inexistente.`,
      )
      assert.ok(String(categoria.nome ?? '').trim(), `Categoria ${categoria.id} sem nome.`)
      empresasComCategoria.add(String(categoria.empresa_id))
    }

    assert.ok(
      empresasComCategoria.size >= 3,
      'O seed deve distribuir categorias entre pelo menos tres empresas.',
    )
  })

})
