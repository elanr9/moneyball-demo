import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ModeProvider } from './context/ModeContext'
import { PlayerDataProvider } from './context/PlayerDataContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ModeProvider>
        <PlayerDataProvider>
          <App />
        </PlayerDataProvider>
      </ModeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
