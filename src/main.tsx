import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import 'flag-icons/css/flag-icons.min.css'
import i18n from './i18n'

// Wait for i18n to finish loading all preloaded namespaces before mounting.
// Without this, components render before HttpBackend has fetched the JSON,
// causing Missing key warnings for namespaces like 'onboarding' and 'dashboard'.
i18n.on('initialized', () => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <React.Suspense fallback={null}>
        <App />
      </React.Suspense>
    </React.StrictMode>
  )
})
