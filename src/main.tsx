import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './variables.css'
import './index.css'
import { router } from '@/app/router'
import { LanguageProvider } from '@/context/LanguageContext'

gsap.registerPlugin(ScrollTrigger);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <RouterProvider router={router} />
    </LanguageProvider>
  </StrictMode>,
)
