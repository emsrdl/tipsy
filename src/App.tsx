/**
 * @file src/App.tsx
 * @description Root application component with router and layout.
 *
 * Defines the three-screen flow:
 *   / → SetupScreen
 *   /cash → CashInputScreen
 *   /results → ResultsScreen
 *
 * @see src/layouts/AppLayout/AppLayout.tsx for the shell
 */

import { Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout/AppLayout'
import { SetupScreen } from '@/screens/SetupScreen/SetupScreen'
import { CashInputScreen } from '@/screens/CashInputScreen/CashInputScreen'
import { ResultsScreen } from '@/screens/ResultsScreen/ResultsScreen'

/**
 * Root app with route definitions.
 *
 * @returns Router outlet inside AppLayout
 */
export function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/"        element={<SetupScreen />} />
        <Route path="/cash"    element={<CashInputScreen />} />
        <Route path="/results" element={<ResultsScreen />} />
        <Route path="*"        element={<SetupScreen />} />
      </Routes>
    </AppLayout>
  )
}
