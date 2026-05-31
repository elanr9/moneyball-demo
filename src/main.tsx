import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { UniverseProvider } from './context/UniverseContext'
import { RolesProvider } from './context/RolesContext'
import { SessionProvider } from './context/SessionContext'
import { WelcomeGate } from './components/onboarding/WelcomeGate'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <UniverseProvider>
          <RolesProvider>
            <WelcomeGate>
              <App />
            </WelcomeGate>
          </RolesProvider>
        </UniverseProvider>
      </SessionProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
