import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { describe, test } from 'node:test'
import { navigationFromPath, pathForNavigation } from '../../../src/routing.js'

describe('rotas navegaveis do P0', () => {
  test('resolve a raiz e a listagem de lancamentos', () => {
    assert.deepEqual(navigationFromPath('/'), { page: 'faturamentos', recordId: null })
    assert.deepEqual(navigationFromPath('/lancamentos'), { page: 'faturamentos', recordId: null })
  })

  test('resolve a tela de novo lancamento', () => {
    assert.deepEqual(navigationFromPath('/lancamentos/novo'), { page: 'novo-faturamento', recordId: null })
  })

  test('resolve detalhe e substituicao com o ID da URL', () => {
    assert.deepEqual(navigationFromPath('/lancamentos/47'), { page: 'faturamento-detalhes', recordId: 47 })
    assert.deepEqual(navigationFromPath('/lancamentos/47/substituir'), { page: 'substituir-faturamento', recordId: 47 })
  })

  test('normaliza barra final e rejeita IDs invalidos', () => {
    assert.deepEqual(navigationFromPath('/lancamentos/novo/'), { page: 'novo-faturamento', recordId: null })
    assert.deepEqual(navigationFromPath('/lancamentos/0'), { page: 'faturamentos', recordId: null })
    assert.deepEqual(navigationFromPath('/rota-inexistente'), { page: 'faturamentos', recordId: null })
  })

  test('gera os caminhos canonicos de cada pagina', () => {
    assert.equal(pathForNavigation('faturamentos'), '/lancamentos')
    assert.equal(pathForNavigation('novo-faturamento'), '/lancamentos/novo')
    assert.equal(pathForNavigation('faturamento-detalhes', 47), '/lancamentos/47')
    assert.equal(pathForNavigation('substituir-faturamento', 47), '/lancamentos/47/substituir')
    assert.equal(pathForNavigation('faturamento-detalhes', null), null)
  })

  test('aplicacao sincroniza History API e navegacao do navegador', async () => {
    const source = await readFile(new URL('../../../src/App.jsx', import.meta.url), 'utf8')

    assert.match(source, /window\.history\.pushState/)
    assert.match(source, /window\.history\.replaceState/)
    assert.match(source, /window\.addEventListener\('popstate'/)
    assert.match(source, /empresaId: window\.history\.state\?\.empresaId/)
    assert.match(source, /options\.empresaId/)
  })
})
