import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './variables.css'
import './index.css'
import App from './App.tsx'
import { LanguageProvider } from './context/LanguageContext'

gsap.registerPlugin(ScrollTrigger);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
)
