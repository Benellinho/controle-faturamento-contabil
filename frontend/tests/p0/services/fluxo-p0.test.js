import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { extname } from 'node:path'
import { test } from 'node:test'

const faturamentosDirectory = new URL(
  '../../../src/pages/Faturamentos/',
  import.meta.url,
)

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map((entry) => {
    const entryUrl = new URL(
      entry.isDirectory() ? `${entry.name}/` : entry.name,
      directory,
    )
    return entry.isDirectory() ? sourceFiles(entryUrl) : [entryUrl]
  }))

  return files.flat().filter((file) => ['.js', '.jsx'].includes(extname(file.pathname)))
}

test('componentes do fluxo P0 nao importam dados de mocks', async () => {
  const violations = []

  for (const file of await sourceFiles(faturamentosDirectory)) {
    const source = await readFile(file, 'utf8')

    if (/from\s+['"][^'"]*mocks/.test(source)) {
      violations.push(file.pathname)
    }
  }

  assert.deepEqual(
    violations,
    [],
    `Imports de mocks encontrados no fluxo P0:\n${violations.join('\n')}`,
  )
})
