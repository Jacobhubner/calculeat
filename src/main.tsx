import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import './index.css'
import 'flag-icons/css/flag-icons.min.css'
import i18n from './i18n'
import { useThemeStore, applyTheme } from './stores/themeStore'

// Följ systemet i realtid när användaren valt 'system' — annars ändras temat
// först vid nästa omladdning om man byter läge i OS:et.
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (useThemeStore.getState().preference === 'system') applyTheme('system')
})

i18n.on('initialized', () => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </React.StrictMode>
  )
})
