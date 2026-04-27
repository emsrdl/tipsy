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

import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/atoms/Button/Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'default';
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
  const { t } = useTranslation('common');

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {message && <DialogDescription>{message}</DialogDescription>}
        </DialogHeader>
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onCancel} className="min-h-12 flex-1">
            {cancelLabel ?? t('actions.cancel')}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className={
              variant === 'danger'
                ? 'hover:bg-status-error/90 min-h-12 flex-1 border-0 bg-status-error text-white'
                : 'min-h-12 flex-1'
            }
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
