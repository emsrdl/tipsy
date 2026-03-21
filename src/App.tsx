/**
 * @file src/App.tsx
 * @description Root application component with 3-tab navigation.
 *
 * Tab 1: "Berechnen" — 3-step calculation flow (Setup → Cash → Results)
 * Tab 2: "Verlauf"   — History with graphs and shift list
 * Tab 3: "Einstellungen" — Profile management and settings
 *
 * @see src/layouts/AppLayout/AppLayout.tsx for the shell
 */

import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout/AppLayout'
import { SetupScreen } from '@/screens/SetupScreen/SetupScreen'
import { CashInputScreen } from '@/screens/CashInputScreen/CashInputScreen'
import { ResultsScreen } from '@/screens/ResultsScreen/ResultsScreen'
import { HistoryScreen } from '@/screens/HistoryScreen/HistoryScreen'
import { SettingsScreen } from '@/screens/SettingsScreen/SettingsScreen'

/**
 * Root app with 3-tab route definitions.
 *
 * @returns Router outlet inside AppLayout
 */
export function App() {
  return (
    <AppLayout>
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/calculate" replace />} />

        {/* Calculate tab — stepper flow */}
        <Route path="/calculate"         element={<SetupScreen />} />
        <Route path="/calculate/cash"    element={<CashInputScreen />} />
        <Route path="/calculate/results" element={<ResultsScreen />} />

        {/* History tab */}
        <Route path="/history"    element={<HistoryScreen />} />

        {/* Settings tab */}
        <Route path="/settings"   element={<SettingsScreen />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/calculate" replace />} />
      </Routes>
    </AppLayout>
  )
}
