/**
 * @file src/main.tsx
 * @description React application entry point.
 *
 * Provider order (outermost first):
 *   BrowserRouter → ThemeProvider → AuthProvider → TipSessionProvider → App
 *
 * i18n is initialized via the side-effectful import of '@/lib/i18n'.
 *
 * @see src/context/ThemeContext.tsx
 * @see src/context/AuthContext.tsx
 * @see src/context/TipSessionContext.tsx
 * @see src/lib/i18n.ts
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@/context/ThemeContext'
import { AuthProvider } from '@/context/AuthContext'
import { TipSessionProvider } from '@/context/TipSessionContext'
import { App } from './App'
import '@/lib/i18n'
import '@/styles/globals.css'

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root not found')

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <TipSessionProvider>
            <App />
          </TipSessionProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
)
