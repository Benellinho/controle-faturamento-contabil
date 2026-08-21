import assert from 'node:assert/strict'
import { getConfiguredSupabase } from './helpers.js'

const confirmationFlag = '--confirmar-insercao'

// Dados exclusivamente sinteticos para desenvolvimento e demonstracao.
// Nao substituir por dados de clientes ou outras pessoas reais.
const empresas = [
  {
    nome: 'EMPRESA EXEMPLO ALFA LTDA',
    cnpj: '99999999000191',
  },
  {
    nome: 'EMPRESA EXEMPLO BETA LTDA',
    cnpj: '88888888000191',
  },
  {
    nome: 'EMPRESA EXEMPLO GAMA LTDA',
    cnpj: '77777777000191',
  },
]

const categorias = [
  { empresa_cnpj: '99999999000191', nome: 'Vendas' },
  { empresa_cnpj: '88888888000191', nome: 'Vendas' },
  { empresa_cnpj: '77777777000191', nome: 'Vendas' },
  { empresa_cnpj: '77777777000191', nome: 'Anexo III' },
  { empresa_cnpj: '77777777000191', nome: 'Anexo IV' },
]

function categoryKey(empresaCnpj, categoriaNome) {
  return `${empresaCnpj}:${categoriaNome}`
}

function publicPlan() {
  return {
    empresas,
    categorias,
  }
}

async function countRows(client, table) {
  const { count, error } = await client
    .from(table)
    .select('*', { count: 'exact', head: true })

  if (error) throw new Error(`Falha ao contar ${table}: ${error.message}`)
  return count ?? 0
}

async function insertRows(client, table, rows) {
  const { data, error } = await client.from(table).insert(rows).select('*')

  if (error) throw new Error(`Falha ao inserir em ${table}: ${error.message}`)
  return data
}

async function removeCreatedRows(client, created) {
  const operations = [
    ['categorias', created.categorias],
    ['empresas', created.empresas],
  ]

  for (const [table, ids] of operations) {
    if (!ids.length) continue

    const { error } = await client.from(table).delete().in('id', ids)

    if (error) {
      console.error(`Rollback incompleto em ${table}: ${error.message}`)
    }
  }
}

async function main() {
  if (!process.argv.includes(confirmationFlag)) {
    console.log('Plano de dados do P0. Nenhuma insercao foi executada.')
    console.log(JSON.stringify(publicPlan(), null, 2))
    console.log(`\nPara inserir no Supabase configurado, revise o plano e use ${confirmationFlag}.`)
    return
  }

  const client = getConfiguredSupabase()
  const created = {
    empresas: [],
    categorias: [],
  }

  try {
    const counts = await Promise.all(
      ['empresas', 'categorias'].map(async (table) => [
        table,
        await countRows(client, table),
      ]),
    )

    for (const [table, count] of counts) {
      assert.equal(
        count,
        0,
        `A tabela ${table} possui ${count} registro(s). A insercao foi cancelada para evitar duplicidade.`,
      )
    }

    const insertedEmpresas = await insertRows(
      client,
      'empresas',
      empresas,
    )
    created.empresas.push(...insertedEmpresas.map((empresa) => empresa.id))

    const empresaIdByCnpj = new Map(
      empresas.map((empresa) => [
        empresa.cnpj,
        insertedEmpresas.find((inserted) => inserted.cnpj === empresa.cnpj)?.id,
      ]),
    )

    for (const [cnpj, id] of empresaIdByCnpj) {
      assert.ok(id, `Nao foi possivel localizar a empresa de CNPJ ${cnpj}.`)
    }

    const categoryRows = categorias.map((categoria) => ({
      empresa_id: empresaIdByCnpj.get(categoria.empresa_cnpj),
      nome: categoria.nome,
    }))
    const insertedCategorias = await insertRows(client, 'categorias', categoryRows)
    created.categorias.push(...insertedCategorias.map((categoria) => categoria.id))

    const categoriaIdByKey = new Map(
      categorias.map((categoria) => [
        categoryKey(categoria.empresa_cnpj, categoria.nome),
        insertedCategorias.find((inserted) => (
          String(inserted.empresa_id) === String(empresaIdByCnpj.get(categoria.empresa_cnpj))
          && inserted.nome === categoria.nome
        ))?.id,
      ]),
    )

    for (const [key, id] of categoriaIdByKey) {
      assert.ok(id, `Nao foi possivel localizar a categoria inserida ${key}.`)
    }

    console.log('Empresas e categorias do P0 inseridas com sucesso.')
    console.log(`Empresas: ${created.empresas.length}`)
    console.log(`Categorias: ${created.categorias.length}`)
  } catch (error) {
    console.error(`Insercao cancelada: ${error.message}`)
    await removeCreatedRows(client, created)
    process.exitCode = 1
  }
}

await main()
