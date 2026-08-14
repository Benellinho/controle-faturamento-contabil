import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import './styles/variables.css'
import './styles/global.css'
import App from './App.jsx'
import { getStoredPalette } from './theme/palettes'

document.documentElement.dataset.theme = getStoredPalette()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
