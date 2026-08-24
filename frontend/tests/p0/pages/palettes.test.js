import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { defaultPalette, palettes, paletteStorageKey } from '../../../src/theme/palettes.js'

test('Exata é a paleta padrão e preserva as quatro cores definidas', () => {
  const exata = palettes.find(({ id }) => id === 'exata')

  assert.equal(defaultPalette, 'exata')
  assert.equal(paletteStorageKey, 'controle-faturamento-palette-v2')
  assert.deepEqual(exata, {
    id: 'exata',
    label: 'Exata',
    colors: ['#8F0000', '#000000', '#946703', '#F7F7F7'],
    distribution: [25, 25, 25, 25],
  })
})

test('Exata distribui as cores conforme suas funções visuais', () => {
  const variables = readFileSync(new URL('../../../src/styles/variables.css', import.meta.url), 'utf8')

  assert.match(variables, /--color-background: #f7f7f7;/)
  assert.match(variables, /--color-dark: #000000;/)
  assert.match(variables, /--color-primary: #8f0000;/)
  assert.match(variables, /--color-accent: #946703;/)
  assert.match(variables, /--color-border: rgba\(0, 0, 0, \.14\);/)
})

test('Exata usa sidebar preta com conteúdo claro e acentos dourados', () => {
  const styles = readFileSync(new URL('../../../src/styles/global.css', import.meta.url), 'utf8')

  assert.match(styles, /\[data-theme="exata"\] \.app-sidebar \{\s+background: var\(--color-dark\);\s+color: var\(--color-background\);/)
  assert.match(styles, /\[data-theme="exata"\] \.sidebar-link\.active svg \{\s+color: var\(--color-accent\);/)
  assert.match(styles, /\[data-theme="exata"\] \.required-mark \{\s+color: var\(--color-accent\);/)
})
