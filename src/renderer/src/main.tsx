import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './lib/AuthContext'
import { installWebBridge } from './lib/webBridge'
import './index.css'
import './motion.css'

document.documentElement.dataset.motion = typeof window.anisav === 'undefined' ? 'rich' : 'lite'

installWebBridge()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>
)
