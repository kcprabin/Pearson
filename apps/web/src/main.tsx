import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import "./App.css"
import { Authprovider } from "../Contexts/Authprovider.tsx"

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Authprovider>
      <App />
    </Authprovider>
  </StrictMode>,
)