/**
 * @file src/components/molecules/ConfirmDialog/ConfirmDialog.tsx
 * @description Reusable confirmation dialog wrapping shadcn Dialog.
 *
 * @example
 * <ConfirmDialog
 *   isOpen={confirmOpen}
 *   title="Delete shift?"
 *   message="This cannot be undone."
 *   confirmLabel="Delete"
 *   onConfirm={handleDelete}
 *   onCancel={() => setConfirmOpen(false)}
 *   variant="danger"
 * />
 */

import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/atoms/Button/Button'

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message?: string
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'default'
}

/**
 * Modal confirmation dialog with cancel + confirm buttons.
 *
 * @param props - ConfirmDialogProps
 */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  variant = 'default',
}: ConfirmDialogProps) {
  const { t } = useTranslation('common')

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {message && (
            <DialogDescription>{message}</DialogDescription>
          )}
        </DialogHeader>
        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="flex-1 min-h-11"
          >
            {cancelLabel ?? t('actions.cancel')}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className={
              variant === 'danger'
                ? 'flex-1 min-h-11 bg-status-error hover:bg-status-error/90 text-white border-0'
                : 'flex-1 min-h-11'
            }
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
