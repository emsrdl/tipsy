/**
 * @file src/components/molecules/ImportDialog/ImportDialog.tsx
 * @description Import dialog — file picker for JSON backup import.
 *
 * @example
 * <ImportDialog
 *   isOpen={importOpen}
 *   onClose={() => setImportOpen(false)}
 *   onImport={(file) => handleImport(file)}
 * />
 */

import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/atoms/Button/Button'
import { Icon } from '@/components/atoms/Icon/Icon'

export interface ImportDialogProps {
  isOpen: boolean
  onClose: () => void
  onImport: (file: File) => void
  isProcessing?: boolean
}

/**
 * Modal import dialog with file picker.
 */
export function ImportDialog({
  isOpen,
  onClose,
  onImport,
  isProcessing = false,
}: ImportDialogProps) {
  const { t } = useTranslation(['common'])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
  }

  function handleImport() {
    if (!selectedFile) return
    onImport(selectedFile)
    setSelectedFile(null)
    onClose()
  }

  function handleClose() {
    setSelectedFile(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('common:actions.import')}</DialogTitle>
        </DialogHeader>

        <div className="py-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed border-border hover:border-accent/50 hover:bg-surface-overlay transition-colors"
          >
            <Icon name="upload" size={24} className="text-text-secondary" />
            {selectedFile ? (
              <span className="text-sm font-medium text-text-primary">{selectedFile.name}</span>
            ) : (
              <span className="text-sm text-text-secondary">{t('common:actions.importJson')}</span>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
            aria-hidden="true"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            className="min-h-11 px-4"
          >
            {t('common:actions.cancel')}
          </Button>
          <Button
            type="button"
            disabled={!selectedFile}
            isLoading={isProcessing}
            onClick={handleImport}
            className="flex-1 min-h-11"
          >
            {t('common:actions.import')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
