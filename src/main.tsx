import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import 'flag-icons/css/flag-icons.min.css'
import { i18nReady } from './i18n'

// Wait for i18n + HttpBackend to finish fetching all preloaded namespaces
// before mounting. i18nReady is the Promise returned by i18next.init(),
// which resolves only after all namespace JSON files have been fetched.
// The 'initialized' event fires too early when HttpBackend is used.
i18nReady.then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <React.Suspense fallback={null}>
        <App />
      </React.Suspense>
    </React.StrictMode>
  )
})
