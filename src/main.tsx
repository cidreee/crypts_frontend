import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "./styles/global.css";
import "./styles/buttons.css";
import "./styles/forms.css";
import "./styles/tables.css";
import "./styles/modal.css";
import "./styles/clients.css";
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
