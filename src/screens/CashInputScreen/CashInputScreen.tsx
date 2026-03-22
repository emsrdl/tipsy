/**
 * @file src/screens/CashInputScreen/CashInputScreen.tsx
 * @description Cash input screen — touch-first denomination entry.
 *
 * Step 2 of 3. DenominationGrid with running total and reset button.
 *
 * @example
 * // Rendered via React Router at route "/calculate/cash"
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '@/layouts/ScreenContainer/ScreenContainer';
import { DenominationGrid } from '@/components/organisms/DenominationGrid/DenominationGrid';
import { Button } from '@/components/atoms/Button/Button';
import { Alert } from '@/components/molecules/Alert/Alert';
import { Icon } from '@/components/atoms/Icon/Icon';
import { useTipCalculator } from '@/hooks/useTipCalculator';
import { useToast } from '@/context/ToastContext';
import { DENOMINATIONS } from '@/config/currency';

/**
 * Cash input screen — step 2 of 3.
 */
export function CashInputScreen() {
  const { t } = useTranslation(['common', 'screens', 'errors']);
  const navigate = useNavigate();
  const { totalInCents, calculate, setDenominationQuantity } = useTipCalculator();
  const { showToast } = useToast();

  const hasTotal = totalInCents > 0;

  function handleCalculate() {
    calculate();
    void navigate('/calculate/results');
  }

  function handleReset() {
    DENOMINATIONS.forEach((d) => setDenominationQuantity(d.id, 0));
    showToast(t('common:toast.cashReset'), 'info');
  }

  return (
    <ScreenContainer
      title={t('screens:cashInput.title')}
      subtitle={t('screens:cashInput.subtitle')}
      step={2}
      totalSteps={3}
    >
      {/* Reset button — top right */}
      <div className="mb-2 flex justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={handleReset}
          className="min-h-10 gap-1.5 text-sm text-text-secondary"
        >
          <Icon name="refresh-cw" size={14} />
          {t('screens:cashInput.resetCash')}
        </Button>
      </div>

      <DenominationGrid />

      {!hasTotal && (
        <Alert status="warning" message={t('errors:validation.zeroTotal')} className="mt-4" />
      )}

      {/* Navigation */}
      <div className="mt-8 space-y-3">
        <Button
          type="button"
          disabled={!hasTotal}
          onClick={handleCalculate}
          className="min-h-14 w-full text-base font-semibold"
        >
          {t('common:actions.calculate')}
          <Icon name="chevron-right" size={18} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => void navigate('/calculate')}
          className="min-h-12 w-full"
        >
          <Icon name="chevron-left" size={16} />
          {t('common:actions.back')}
        </Button>
      </div>
    </ScreenContainer>
  );
}
