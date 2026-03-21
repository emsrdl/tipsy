/**
 * @file src/screens/SettingsScreen/SettingsScreen.tsx
 * @description Settings screen — profiles, theme, language, smart split, data management.
 *
 * @example
 * // Rendered via React Router at route "/settings"
 */

import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
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
    resetProfileStats,
    switchProfile,
    enterGuestMode,
  } = useProfiles()
  const { theme, accentColor, colorMode, setTheme, setAccentColor, toggleColorMode } = useTheme()
  const { locale, setLocale } = useLocale()
  const { shifts, clearHistory } = useShifts()
  const { exportJson, importJson, exportCsv, exportPdf, isProcessing: isExporting } = useImportExport()
  const { showToast } = useToast()

  const [threshold, setThreshold] = useLocalStorage<number>(SMART_SPLIT_THRESHOLD_KEY, DEFAULT_FAIRNESS_THRESHOLD)

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

  const fileInputRef = useRef<HTMLInputElement>(null)

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
    showToast('Profil gespeichert', 'success')
  }

  function handleDeleteConfirm(id: string) {
    deleteProfile(id)
    setDeletingId(null)
    showToast('Profil gelöscht', 'info')
  }

  function handleCreateProfile() {
    if (!newName.trim()) return
    createProfile(newName.trim(), newRole, true)
    setNewName('')
    setNewRole('service')
    setIsCreating(false)
    showToast('Profil erstellt', 'success')
  }

  function handleResetStats(id: string) {
    resetProfileStats(id)
    showToast('Statistiken zurückgesetzt', 'info')
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result
      if (typeof text !== 'string') return
      const result = importJson(text)
      showToast(`${result.added} Schichten importiert`, result.errors.length ? 'warning' : 'success')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleClearHistory() {
    clearHistory()
    setShowClearConfirm(false)
    showToast('Verlauf gelöscht', 'info')
  }

  const fmtLocale = locale === 'en' ? 'en-US' : 'de-DE'

  return (
    <div className="flex flex-col min-h-full pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-text-primary">{t('nav.settings')}</h1>
      </div>

      <div className="px-4 space-y-6">

        {/* ── Profiles ── */}
        <section>
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 px-1">
            Profile
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
                ) : deletingId === profile.id ? (
                  /* Delete confirmation */
                  <div className="p-4 space-y-3">
                    <p className="text-sm text-text-primary">
                      Profil <span className="font-semibold">{profile.name}</span> wirklich löschen?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 min-h-10 text-sm text-status-error border-status-error/30"
                        onClick={() => handleDeleteConfirm(profile.id)}
                      >
                        <Icon name="trash" size={14} />
                        {t('common:actions.delete')}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setDeletingId(null)}
                        className="flex-1 min-h-10 text-sm"
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
                        {profile.stats.totalShifts} Schichten ·{' '}
                        {formatEurFromCents(profile.stats.totalTipsInCents, fmtLocale)} gesamt
                      </p>
                    </button>

                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleResetStats(profile.id)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-text-secondary hover:bg-surface-overlay transition-colors"
                        title={t('common:actions.resetStats')}
                      >
                        <Icon name="refresh-cw" size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(profile.id)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-text-secondary hover:bg-surface-overlay transition-colors"
                      >
                        <Icon name="edit-2" size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setDeletingId(profile.id); setEditingId(null) }}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-status-error/70 hover:bg-status-error/10 transition-colors"
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
                    placeholder="Name"
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
                      Erstellen
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
            Darstellung
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
                <p className="text-sm font-medium text-text-primary mb-3">Akzentfarbe</p>
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
            Sprache
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
            <div className="px-4 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">{t('common:smartSplit.threshold')}</p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Ausgleichszahlungen ab {formatEurFromCents(threshold, fmtLocale)}
                  </p>
                </div>
                <span className="text-sm font-bold font-mono text-accent">
                  {formatEurFromCents(threshold, fmtLocale)}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[200, 500, 1000, 2000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setThreshold(val)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-xs font-medium transition-colors border',
                      threshold === val
                        ? 'bg-accent text-accent-foreground border-accent'
                        : 'bg-surface-overlay text-text-secondary border-border hover:border-accent/50'
                    )}
                  >
                    {formatEurFromCents(val, 'de-DE')}
                  </button>
                ))}
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
              <span className="text-sm text-text-secondary">Gespeicherte Schichten</span>
              <span className="text-sm font-bold font-mono text-text-primary">{shifts.length}</span>
            </div>

            {/* Export row */}
            <div className="p-3 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-11 text-xs gap-1.5"
                isLoading={isExporting}
                onClick={() => { exportJson(); showToast('Backup exportiert', 'success') }}
              >
                <Icon name="download" size={14} />
                {t('common:actions.exportJson')}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 text-xs gap-1.5"
                isLoading={isExporting}
                onClick={handleImportClick}
              >
                <Icon name="upload" size={14} />
                {t('common:actions.importJson')}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 text-xs gap-1.5"
                isLoading={isExporting}
                onClick={() => { exportCsv(); showToast('CSV exportiert', 'success') }}
              >
                <Icon name="file-text" size={14} />
                {t('common:actions.exportCsv')}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 text-xs gap-1.5"
                isLoading={isExporting}
                onClick={() => { exportPdf(); showToast('PDF exportiert', 'success') }}
              >
                <Icon name="file-text" size={14} />
                {t('common:actions.exportPdf')}
              </Button>
            </div>

            {/* Clear history */}
            {shifts.length > 0 && (
              <div className="p-3">
                {!showClearConfirm ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full min-h-11 text-sm text-status-error gap-2"
                    onClick={() => setShowClearConfirm(true)}
                  >
                    <Icon name="trash" size={14} />
                    Verlauf löschen
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-text-primary text-center">
                      Alle {shifts.length} Schichten wirklich löschen?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 min-h-10 text-sm text-status-error border-status-error/30"
                        onClick={handleClearHistory}
                      >
                        <Icon name="trash" size={14} />
                        Löschen
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowClearConfirm(false)}
                        className="flex-1 min-h-10 text-sm"
                      >
                        {t('common:actions.cancel')}
                      </Button>
                    </div>
                  </div>
                )}
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
              <span className="text-sm text-text-secondary">App</span>
              <span className="text-sm text-text-primary">Tipsy</span>
            </div>
          </div>
        </section>

      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
