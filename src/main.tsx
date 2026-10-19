import { createRoot } from 'react-dom/client'
import '@fontsource/cormorant-garamond/500.css'
import '@fontsource/cormorant-garamond/600.css'
import '@fontsource/cormorant-garamond/500-italic.css'
import '@fontsource-variable/inter'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/mrs-saint-delafield/400.css'
import './styles/tokens.css'
import './styles/global.css'
import './styles/stage.css'
import './styles/content.css'
import './styles/page.css'
import App from './App'

// StrictMode is intentionally omitted: drei's <Html> creates nested React roots whose
// dev-only double mount drops the first hotspot.
createRoot(document.getElementById('root')!).render(<App />)
