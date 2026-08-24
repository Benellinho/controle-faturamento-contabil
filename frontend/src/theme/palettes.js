export const paletteStorageKey = 'controle-faturamento-palette-v2'

export const palettes = [
  {
    id: 'exata',
    label: 'Exata',
    colors: ['#8F0000', '#000000', '#946703', '#F7F7F7'],
    distribution: [25, 25, 25, 25],
  },
  {
    id: 'sage',
    label: 'Sálvia',
    colors: ['#798777', '#bdd2b6', '#f8ede3'],
  },
  {
    id: 'ocean',
    label: 'Oceano',
    colors: ['#222831', '#00adb5', '#eeeeee'],
  },
  {
    id: 'plum',
    label: 'Ameixa',
    colors: ['#33283f', '#8b5e9f', '#f5f0f7'],
  },
  {
    id: 'terracotta',
    label: 'Terracota',
    colors: ['#4a3030', '#b45f45', '#fbf3ec'],
  },
]

export const defaultPalette = 'exata'

export function getStoredPalette() {
  try {
    const storedPalette = window.localStorage.getItem(paletteStorageKey)
    return palettes.some(({ id }) => id === storedPalette) ? storedPalette : defaultPalette
  } catch {
    return defaultPalette
  }
}

export function applyPalette(paletteId) {
  const selectedPalette = palettes.some(({ id }) => id === paletteId) ? paletteId : defaultPalette

  document.documentElement.dataset.theme = selectedPalette

  try {
    window.localStorage.setItem(paletteStorageKey, selectedPalette)
  } catch {
    // A troca ainda funciona quando o armazenamento do navegador está indisponível.
  }

  return selectedPalette
}
