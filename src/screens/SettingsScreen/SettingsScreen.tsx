/**
 * @file src/screens/SettingsScreen/SettingsScreen.tsx
 * @description Settings screen — profiles, theme, language, smart split, data management.
 *
 * @example
 * // Rendered via React Router at route "/settings"
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog/ConfirmDialog'
import { ExportDialog } from '@/components/molecules/ExportDialog/ExportDialog'
import { ImportDialog } from '@/components/molecules/ImportDialog/ImportDialog'
import { useProfiles } from '@/hooks/useProfiles'
import { useTheme } from '@/hooks/useTheme'
import { useLocale } from '@/hooks/useLocale'
import { useShifts } from '@/hooks/useShifts'
import { useImportExport } from '@/hooks/useImportExport'
import { useToast } from '@/context/ToastContext'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { Icon } from '@/components/atoms/Icon/Icon'
import { Button } from '@/components/atoms/Button/Button'
import { Badge } from '@/components/atoms/Badge/Badge'
import { THEMES, THEME_IDS } from '@/config/themes'
import { SMART_SPLIT_THRESHOLD_KEY, DEFAULT_FAIRNESS_THRESHOLD } from '@/config/smartSplit'
import { formatEurFromCents } from '@/config/currency'
import { cn } from '@/lib/utils'
import type { ProfileRole } from '@/types/profile'
import type { ThemeId } from '@/types/theme'

/**
 * Settings screen — manage profiles, appearance, data.
 */
export function SettingsScreen() {
  const { t } = useTranslation(['common', 'screens'])
  const {
    profiles,
    activeProfile,
    isGuestMode,
    createProfile,
    updateProfile,
    deleteProfile,
    switchProfile,
    enterGuestMode,
  } = useProfiles()
  const { theme, accentColor, colorMode, setTheme, setAccentColor, toggleColorMode } = useTheme()
  const { locale, setLocale } = useLocale()
  const { shifts, deleteShift, clearHistory } = useShifts()
  const { exportJson, importJson, exportCsv, exportPdf, isProcessing: isExporting } = useImportExport()
  const { showToast } = useToast()

  const [threshold, setThreshold] = useLocalStorage<number>(SMART_SPLIT_THRESHOLD_KEY, DEFAULT_FAIRNESS_THRESHOLD)
  const [thresholdInput, setThresholdInput] = useState((threshold / 100).toFixed(2))

  // Profile editing state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState<ProfileRole>('service')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // New profile creation
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState<ProfileRole>('service')

  // Clear history confirmation
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  function handleStartEdit(id: string) {
    const profile = profiles.find((p) => p.id === id)
    if (!profile) return
    setEditingId(id)
    setEditName(profile.name)
    setEditRole(profile.role)
    setDeletingId(null)
  }

  function handleSaveEdit() {
    if (!editingId || !editName.trim()) return
    updateProfile(editingId, { name: editName.trim(), role: editRole })
    setEditingId(null)
    showToast(t('common:toast.profileSaved'), 'success')
  }

  function handleDeleteConfirm(id: string) {
    // Delete all shifts belonging to this profile first
    const profileShifts = shifts.filter((s) => s.profileId === id)
    profileShifts.forEach((s) => deleteShift(s.id))
    deleteProfile(id)
    setDeletingId(null)
    if (profileShifts.length > 0) {
      showToast(
        t('common:toast.profileDeletedWithShifts_other', { count: profileShifts.length }),
        'info'
      )
    } else {
      showToast(t('common:toast.profileDeleted'), 'info')
    }
  }

  function handleCreateProfile() {
    if (!newName.trim()) return
    createProfile(newName.trim(), newRole, true)
    setNewName('')
    setNewRole('service')
    setIsCreating(false)
    showToast(t('common:toast.profileCreated'), 'success')
  }

  function getProfileStats(profileId: string) {
    const ps = shifts.filter((s) => s.profileId === profileId)
    const totalTips = ps.reduce((acc, sh) => {
      const myShare = sh.distribution.personShares.find(
        (p) => p.id === `profile-emp-${profileId}`
      )
      return acc + (myShare?.actualShareInCents ?? sh.totalTipsInCents)
    }, 0)
    return { totalShifts: ps.length, totalTipsInCents: totalTips }
  }

  function handleThresholdInputChange(value: string) {
    setThresholdInput(value)
    const parsed = parseFloat(value.replace(',', '.'))
    if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 50) {
      setThreshold(Math.round(parsed * 100))
    }
  }

  function handleThresholdInputBlur() {
    const parsed = parseFloat(thresholdInput.replace(',', '.'))
    if (isNaN(parsed) || parsed < 0.5) {
      setThresholdInput((DEFAULT_FAIRNESS_THRESHOLD / 100).toFixed(2))
      setThreshold(DEFAULT_FAIRNESS_THRESHOLD)
    } else {
      const clamped = Math.min(Math.max(parsed, 0.5), 50)
      setThresholdInput(clamped.toFixed(2))
      setThreshold(Math.round(clamped * 100))
    }
  }

  function handleFileImport(file: File) {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result
      if (typeof text !== 'string') return
      const result = importJson(text)
      if (result.errors.length > 0) {
        showToast(t('common:toast.importFailed'), 'error')
      } else if (result.skipped > 0) {
        showToast(t('common:toast.importPartial', { added: result.added, skipped: result.skipped }), 'success')
      } else {
        showToast(t('common:toast.importSuccess', { added: result.added }), 'success')
      }
    }
    reader.readAsText(file)
  }

  function handleClearHistory() {
    clearHistory()
    setShowClearConfirm(false)
    showToast(t('common:toast.historyCleared'), 'info')
  }

  const fmtLocale = locale === 'en' ? 'en-US' : 'de-DE'

  // Compute shift count for profile being deleted
  const deletingProfileShiftCount = deletingId
    ? shifts.filter((s) => s.profileId === deletingId).length
    : 0

  return (
    <div className="flex flex-col min-h-full pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-text-primary">{t('common:nav.settings')}</h1>
      </div>

      <div className="px-4 space-y-6">

        {/* ── Profiles ── */}
        <section>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 px-1">
            {t('screens:settings.sectionProfiles')}
          </h2>

          <div className="bg-surface-raised rounded-xl shadow-elevation-1 overflow-hidden divide-y divide-border">
            {profiles.map((profile) => (
              <div key={profile.id}>
                {editingId === profile.id ? (
                  /* Edit mode */
                  <div className="p-4 space-y-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                      className="w-full h-10 px-3 rounded-lg bg-surface-overlay text-sm text-text-primary border border-border focus:outline-none focus:border-accent"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditRole('service')}
                        className={cn(
                          'flex-1 py-2 rounded-lg text-xs font-medium transition-colors',
                          editRole === 'service'
                            ? 'bg-accent text-accent-foreground'
                            : 'bg-surface-overlay text-text-secondary'
                        )}
                      >
                        {t('common:profile.role.service')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditRole('kitchen')}
                        className={cn(
                          'flex-1 py-2 rounded-lg text-xs font-medium transition-colors',
                          editRole === 'kitchen'
                            ? 'bg-accent text-accent-foreground'
                            : 'bg-surface-overlay text-text-secondary'
                        )}
                      >
                        {t('common:profile.role.kitchen')}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" onClick={handleSaveEdit} className="flex-1 min-h-10 text-sm">
                        <Icon name="check" size={14} />
                        {t('common:actions.save')}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                        className="min-h-10 px-4 text-sm"
                      >
                        {t('common:actions.cancel')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Normal row */
                  <div className="flex items-center gap-3 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => switchProfile(profile.id)}
                      className={cn(
                        'h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                        activeProfile?.id === profile.id && !isGuestMode
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-surface-overlay text-text-secondary'
                      )}
                    >
                      {profile.name.charAt(0).toUpperCase()}
                    </button>

                    <button
                      type="button"
                      onClick={() => switchProfile(profile.id)}
                      className="flex-1 text-left min-w-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary truncate">
                          {profile.name}
                        </span>
                        <Badge variant={profile.role === 'kitchen' ? 'kitchen' : 'service'}>
                          {profile.role === 'kitchen'
                            ? t('common:profile.role.kitchen')
                            : t('common:profile.role.service')}
                        </Badge>
                        {activeProfile?.id === profile.id && !isGuestMode && (
                          <Icon name="check" size={14} className="text-accent flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {(() => { const s = getProfileStats(profile.id); return `${s.totalShifts} ${t('screens:shifts.title').toLowerCase()} · ${formatEurFromCents(s.totalTipsInCents, fmtLocale)}` })()}
                      </p>
                    </button>

                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(profile.id)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-text-secondary hover:bg-surface-overlay transition-colors"
                        title={t('common:actions.editProfile')}
                      >
                        <Icon name="edit-2" size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setDeletingId(profile.id); setEditingId(null) }}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-status-error/70 hover:bg-status-error/10 transition-colors"
                        title={t('common:actions.deleteProfile')}
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Guest mode row */}
            <button
              type="button"
              onClick={isGuestMode ? undefined : enterGuestMode}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-overlay transition-colors',
                isGuestMode && 'bg-accent-subtle'
              )}
            >
              <div className="h-9 w-9 rounded-full bg-surface-overlay flex items-center justify-center flex-shrink-0">
                <Icon name="user" size={16} className="text-text-secondary" />
              </div>
              <span className="flex-1 text-sm font-medium text-text-primary text-left">
                {t('common:actions.guestMode')}
              </span>
              {isGuestMode && <Icon name="check" size={14} className="text-accent" />}
            </button>

            {/* Create new profile */}
            <div className="p-3">
              {!isCreating ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full min-h-10 text-sm gap-2"
                  onClick={() => setIsCreating(true)}
                >
                  <Icon name="plus" size={14} />
                  {t('common:actions.createProfile')}
                </Button>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateProfile()}
                    placeholder={t('screens:profile.namePlaceholder')}
                    className="w-full h-10 px-3 rounded-lg bg-surface-overlay text-sm text-text-primary border border-border focus:outline-none focus:border-accent"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewRole('service')}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-xs font-medium transition-colors',
                        newRole === 'service'
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-surface-overlay text-text-secondary'
                      )}
                    >
                      {t('common:profile.role.service')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewRole('kitchen')}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-xs font-medium transition-colors',
                        newRole === 'kitchen'
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-surface-overlay text-text-secondary'
                      )}
                    >
                      {t('common:profile.role.kitchen')}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" onClick={handleCreateProfile} className="flex-1 min-h-10 text-sm">
                      <Icon name="check" size={14} />
                      {t('common:actions.save')}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => { setIsCreating(false); setNewName('') }}
                      className="min-h-10 px-4 text-sm"
                    >
                      {t('common:actions.cancel')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Appearance ── */}
        <section>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 px-1">
            {t('screens:settings.sectionAppearance')}
          </h2>

          <div className="bg-surface-raised rounded-xl shadow-elevation-1 overflow-hidden divide-y divide-border">
            {/* Dark mode toggle */}
            <button
              type="button"
              onClick={toggleColorMode}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-surface-overlay transition-colors"
            >
              <div className="h-9 w-9 rounded-full bg-surface-overlay flex items-center justify-center flex-shrink-0">
                <Icon name={colorMode === 'dark' ? 'moon' : 'sun'} size={18} className="text-text-secondary" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-text-primary">{t('common:theme.switchMode')}</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {colorMode === 'dark' ? t('common:theme.dark') : t('common:theme.light')}
                </p>
              </div>
              <Icon
                name={colorMode === 'dark' ? 'toggle-right' : 'toggle-left'}
                size={28}
                className={colorMode === 'dark' ? 'text-accent' : 'text-text-secondary'}
              />
            </button>

            {/* Theme selector */}
            <div className="px-4 py-4">
              <p className="text-sm font-medium text-text-primary mb-3">{t('common:theme.switchTheme')}</p>
              <div className="flex gap-2">
                {THEME_IDS.map((id) => {
                  const themeObj = THEMES[id]!
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTheme(id as ThemeId)}
                      className={cn(
                        'flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all border',
                        theme.id === id
                          ? 'bg-accent text-accent-foreground border-accent'
                          : 'bg-surface-overlay text-text-secondary border-border hover:border-accent/50'
                      )}
                    >
                      {t(themeObj.labelKey as Parameters<typeof t>[0])}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Accent color picker (Tipsy only) */}
            {theme.hasAccentPicker && (
              <div className="px-4 py-4">
                <p className="text-sm font-medium text-text-primary mb-3">{t('screens:settings.accentColor')}</p>
                <div className="flex gap-2 flex-wrap">
                  {theme.accentColors.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setAccentColor(color.id)}
                      className={cn(
                        'h-9 w-9 rounded-full transition-all border-2',
                        accentColor.id === color.id
                          ? 'border-text-primary scale-110'
                          : 'border-transparent hover:scale-105'
                      )}
                      style={{ backgroundColor: color.hex }}
                      title={t(color.labelKey as Parameters<typeof t>[0])}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Language ── */}
        <section>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 px-1">
            {t('common:language.switch')}
          </h2>

          <div className="bg-surface-raised rounded-xl shadow-elevation-1 overflow-hidden">
            <div className="px-4 py-4">
              <div className="flex gap-2">
                {(['de', 'en'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLocale(lang)}
                    className={cn(
                      'flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all border',
                      locale === lang
                        ? 'bg-accent text-accent-foreground border-accent'
                        : 'bg-surface-overlay text-text-secondary border-border hover:border-accent/50'
                    )}
                  >
                    {t(`common:language.${lang}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Smart Split ── */}
        <section>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 px-1">
            Smart Split
          </h2>

          <div className="bg-surface-raised rounded-xl shadow-elevation-1 overflow-hidden">
            <div className="px-4 py-4 space-y-2">
              <p className="text-sm font-medium text-text-primary">{t('common:smartSplit.thresholdDefault')}</p>
              <p className="text-xs text-text-secondary">
                {t('screens:settings.smartSplitDesc')}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0.50"
                  max="50"
                  step="0.50"
                  value={thresholdInput}
                  onChange={(e) => handleThresholdInputChange(e.target.value)}
                  onBlur={handleThresholdInputBlur}
                  className="w-24 h-10 px-3 rounded-lg bg-surface-overlay text-sm font-mono text-text-primary border border-border focus:outline-none focus:border-accent text-center"
                />
                <span className="text-sm text-text-secondary">€</span>
                <span className="text-xs text-text-secondary ml-2">
                  ({t('common:smartSplit.threshold')}: {formatEurFromCents(threshold, fmtLocale)})
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Data Management ── */}
        <section>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 px-1">
            Daten
          </h2>

          <div className="bg-surface-raised rounded-xl shadow-elevation-1 overflow-hidden divide-y divide-border">
            {/* Stats summary */}
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-text-secondary">{t('common:history.shiftsCount_other', { count: shifts.length })}</span>
              <span className="text-sm font-bold font-mono text-text-primary">{shifts.length}</span>
            </div>

            {/* Export row */}
            <div className="p-3 flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 min-h-11 text-xs gap-1.5"
                onClick={() => setExportOpen(true)}
              >
                <Icon name="download" size={14} />
                {t('common:actions.export')}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 min-h-11 text-xs gap-1.5"
                onClick={() => setImportOpen(true)}
              >
                <Icon name="upload" size={14} />
                {t('common:actions.import')}
              </Button>
            </div>

            {/* Clear history */}
            {shifts.length > 0 && (
              <div className="p-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full min-h-11 text-sm text-status-error gap-2"
                  onClick={() => setShowClearConfirm(true)}
                >
                  <Icon name="trash" size={14} />
                  {t('common:history.clearAll')}
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* ── About ── */}
        <section>
          <div className="bg-surface-raised rounded-xl shadow-elevation-1 overflow-hidden divide-y divide-border">
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-text-secondary">Version</span>
              <span className="text-sm font-mono text-text-primary">1.0.0</span>
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-text-secondary">{t('common:app.name')}</span>
              <span className="text-sm text-text-primary">{t('common:app.tagline')}</span>
            </div>
          </div>
        </section>

      </div>

      {/* Confirm: delete profile */}
      {deletingId && (
        <ConfirmDialog
          isOpen={deletingId !== null}
          title={
            deletingProfileShiftCount > 0
              ? t('common:profile.deleteWithShifts_other', { count: deletingProfileShiftCount })
              : `${t('common:actions.deleteProfile')}?`
          }
          {...(deletingProfileShiftCount > 0
            ? { message: t('common:profile.deleteWithShiftsInfo_other', { count: deletingProfileShiftCount }) }
            : {})}
          confirmLabel={t('common:actions.delete')}
          onConfirm={() => handleDeleteConfirm(deletingId)}
          onCancel={() => setDeletingId(null)}
          variant="danger"
        />
      )}

      {/* Confirm: clear history */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        title={t('common:history.clearAll')}
        message={t('common:history.clearConfirm')}
        confirmLabel={t('common:actions.delete')}
        onConfirm={handleClearHistory}
        onCancel={() => setShowClearConfirm(false)}
        variant="danger"
      />

      {/* Export dialog */}
      <ExportDialog
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        context="all"
        onExportCsv={() => { exportCsv(); showToast(t('common:toast.csvDownloaded'), 'success') }}
        onExportPdf={() => { exportPdf(); showToast(t('common:toast.pdfOpened'), 'success') }}
        onExportJson={() => { exportJson(); showToast(t('common:toast.backupDownloaded'), 'success') }}
        isProcessing={isExporting}
      />

      {/* Import dialog */}
      <ImportDialog
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleFileImport}
        isProcessing={isExporting}
      />
    </div>
  )
}
