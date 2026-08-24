import { pathToFileURL } from 'node:url'
import { env } from '../src/config/env.js'
import { isSupabaseConfigured, supabase } from '../src/lib/supabase.js'

const confirmationArgument = 'APAGAR_LANCAMENTOS'

export function hasCleanupConfirmation(args) {
  return args.includes(confirmationArgument)
}

function printHelp() {
  console.log(`
Limpa somente os registros da tabela public.lancamentos.

Simular e conferir o destino:
  npm run limpar:lancamentos

Confirmar a exclusão:
  npm run limpar:lancamentos -- ${confirmationArgument}

Empresas e categorias são preservadas. A sequência numérica dos IDs não é reiniciada.
`)
}

async function countLancamentos() {
  const { count, error } = await supabase
    .from('lancamentos')
    .select('id', { count: 'exact', head: true })

  if (error) throw new Error(`Não foi possível contar os lançamentos: ${error.message}`)
  return count ?? 0
}

async function deleteLancamentos() {
  const { count, error } = await supabase
    .from('lancamentos')
    .delete({ count: 'exact' })
    .gte('id', 1)

  if (error) throw new Error(`Não foi possível excluir os lançamentos: ${error.message}`)
  return count ?? 0
}

export async function main(args = process.argv.slice(2)) {
  if (args.includes('ajuda') || args.includes('help')) {
    printHelp()
    return
  }

  if (!isSupabaseConfigured) {
    throw new Error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em backend/.env.')
  }

  const project = new URL(env.supabaseUrl).hostname
  const total = await countLancamentos()

  console.log(`Supabase: ${project}`)
  console.log(`Lançamentos encontrados: ${total}`)

  if (!hasCleanupConfirmation(args)) {
    console.log('Simulação concluída. Nenhum registro foi excluído.')
    console.log(`Para confirmar: npm run limpar:lancamentos -- ${confirmationArgument}`)
    return
  }

  if (total === 0) {
    console.log('Não há lançamentos para excluir.')
    return
  }

  const deleted = await deleteLancamentos()
  const remaining = await countLancamentos()

  if (remaining !== 0) {
    throw new Error(`A limpeza ficou incompleta: ${remaining} lançamento(s) ainda existem.`)
  }

  console.log(`Limpeza concluída: ${deleted} lançamento(s) excluído(s).`)
  console.log('Empresas e categorias foram preservadas.')
}

const isDirectExecution = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href

if (isDirectExecution) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
