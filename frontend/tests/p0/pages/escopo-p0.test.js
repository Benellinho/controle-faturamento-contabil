import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { describe, test } from 'node:test'
import { p0Navigation } from '../../../src/components/layout/p0Navigation.js'

async function readSource(relativePath) {
  return readFile(new URL(`../../../src/${relativePath}`, import.meta.url), 'utf8')
}

describe('escopo demonstravel do P0', () => {
  test('menu principal oferece lancamentos e controle anual', () => {
    assert.deepEqual(p0Navigation, [
      { id: 'faturamentos', label: 'Lançamentos', icon: 'billing' },
      { id: 'novo-faturamento', label: 'Novos lançamentos', icon: 'add' },
      { id: 'controle-anual', label: 'Controle anual', icon: 'control' },
    ])
  })

  test('listagem destaca o acesso ao formulario de novo lancamento', async () => {
    const source = await readSource('pages/Faturamentos/FaturamentosPage.jsx')

    assert.match(source, /action=\{<button[^>]+onClick=\{\(\) => onNavigate\('novo-faturamento', null, \{ empresaId: filters\.empresa_id \}\)\}/)
    assert.match(source, />Lançar categorias <Icon name="arrow"/)
  })

  test('CNPJ formatado aparece nas selecoes, listagem e detalhes', async () => {
    const formSource = await readSource('pages/Faturamentos/components/FaturamentoForm.jsx')
    const listSource = await readSource('pages/Faturamentos/FaturamentosPage.jsx')
    const detailSource = await readSource('pages/Faturamentos/FaturamentoDetails.jsx')

    assert.match(formSource, /formatCnpj\(empresa\.cnpj\)/)
    assert.match(listSource, /formatCnpj\(empresa\.cnpj\)/)
    assert.match(listSource, /formatCnpj\(item\.empresa\.cnpj\)/)
    assert.match(detailSource, /formatCnpj\(lancamento\.empresa\.cnpj\)/)
  })

  test('aplicacao registra as paginas do fluxo de lancamentos e controle', async () => {
    const source = await readSource('App.jsx')

    assert.doesNotMatch(source, /pages\/(Dashboard|Categorias|Empresas|Historico|Usuarios)/)
    assert.doesNotMatch(source, /dashboard:|empresas:|usuarios:|categorias:|historico:/)
    assert.match(source, /faturamentos: FaturamentosPage/)
    assert.match(source, /'controle-anual': ControleFaturamentoPage/)
    assert.match(source, /'novo-faturamento': NovoFaturamento/)
    assert.match(source, /'substituir-faturamento': SubstituirFaturamento/)
  })

  test('menu nao simula usuario, logout ou telas futuras', async () => {
    const source = await readSource('components/layout/Sidebar.jsx')

    assert.doesNotMatch(source, /Mariana Barros|logout-button|Histórico de cancelamentos/)
    assert.match(source, /Empresas e categorias são pré-cadastradas/)
    assert.match(source, /aria-current=/)
  })

  test('modal de confirmacao controla foco, Tab e Escape', async () => {
    const source = await readSource('components/common/ConfirmModal.jsx')

    assert.match(source, /cancelButtonRef\.current\?\.focus\(\)/)
    assert.match(source, /event\.key === 'Escape'/)
    assert.match(source, /event\.key !== 'Tab'/)
    assert.match(source, /previouslyFocused\?\.focus\?\.\(\)/)
  })

  test('aplicacao possui fallback para erro inesperado de renderizacao', async () => {
    const source = await readSource('main.jsx')

    assert.match(source, /<AppErrorBoundary>/)
    assert.match(source, /<App \/>/)
  })
})
