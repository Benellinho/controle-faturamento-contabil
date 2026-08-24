import { useState } from 'react'
import { applyPalette, getStoredPalette, palettes } from '../../theme/palettes'
import Icon from '../common/Icon'

function PaletteSwitcher() {
  const [currentPalette, setCurrentPalette] = useState(getStoredPalette)
  const [isOpen, setIsOpen] = useState(false)
  const selectedPalette = palettes.find(({ id }) => id === currentPalette) ?? palettes[0]

  function handlePaletteChange(paletteId) {
    setCurrentPalette(applyPalette(paletteId))
    setIsOpen(false)
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      setIsOpen(false)
      event.currentTarget.querySelector('.palette-toggle')?.focus()
    }
  }

  return (
    <div className="palette-switcher" onKeyDown={handleKeyDown}>
      <button
        aria-controls="palette-options"
        aria-expanded={isOpen}
        className="palette-toggle"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <Icon name="palette" size={19} />
        <span className="palette-toggle-copy">
          <strong>Paleta de cores</strong>
          <small>{selectedPalette.label}</small>
        </span>
        <Icon className={`palette-chevron ${isOpen ? 'is-open' : ''}`} name="chevron" size={17} />
      </button>

      {isOpen && (
        <div aria-label="Escolha uma paleta de cores" className="palette-options" id="palette-options" role="radiogroup">
          {palettes.map((palette) => (
            <button
              aria-checked={currentPalette === palette.id}
              className={`palette-option ${currentPalette === palette.id ? 'active' : ''}`}
              key={palette.id}
              onClick={() => handlePaletteChange(palette.id)}
              role="radio"
              type="button"
            >
              <span className="palette-swatches" aria-hidden="true">
                {palette.colors.map((color, index) => (
                  <span
                    key={color}
                    style={{
                      backgroundColor: color,
                      flexGrow: palette.distribution?.[index] ?? 1,
                    }}
                  />
                ))}
              </span>
              <span>{palette.label}</span>
              {currentPalette === palette.id && <Icon className="palette-check" name="check" size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default PaletteSwitcher
