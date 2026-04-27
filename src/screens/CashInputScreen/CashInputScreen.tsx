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
import { usePreserveScroll, markFlowReset, getScrollRatio } from '@/hooks/usePreserveScroll';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '@/layouts/ScreenContainer/ScreenContainer';
import { DenominationGrid } from '@/components/organisms/DenominationGrid/DenominationGrid';
import { Button } from '@/components/atoms/Button/Button';
import { Alert } from '@/components/molecules/Alert/Alert';
import { Icon } from '@/components/atoms/Icon/Icon';
import { useTipCalculator } from '@/hooks/useTipCalculator';
import { useToast } from '@/context/ToastContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { DENOMINATIONS } from '@/config/currency';
import {
  DEFAULT_FAIRNESS_THRESHOLD,
  SMART_SPLIT_DEFAULT_THRESHOLD_KEY,
  SMART_SPLIT_MODE_KEY,
  SMART_SPLIT_THRESHOLD_KEY,
  SMART_SPLIT_ENABLED,
} from '@/config/smartSplit';

const STEP_ROUTES: Record<number, string> = {
  1: '/calculate',
  2: '/calculate/cash',
  3: '/calculate/results',
};

/**
 * Cash input screen — step 2 of 3.
 */
export function CashInputScreen() {
  const { t } = useTranslation(['common', 'screens', 'errors']);
  const navigate = useNavigate();
  usePreserveScroll();
  const { totalInCents, calculate, setDenominationQuantity, reset } = useTipCalculator();
  const { showToast } = useToast();
  const [defaultThreshold] = useLocalStorage<number>(
    SMART_SPLIT_DEFAULT_THRESHOLD_KEY,
    DEFAULT_FAIRNESS_THRESHOLD,
  );
  const [, setThreshold] = useLocalStorage<number>(SMART_SPLIT_THRESHOLD_KEY, DEFAULT_FAIRNESS_THRESHOLD);
  const [, setSmartMode] = useLocalStorage<boolean>(SMART_SPLIT_MODE_KEY, SMART_SPLIT_ENABLED);

  const hasTotal = totalInCents > 0;

  function handleStepClick(s: number) {
    if (s === 3) calculate();
    void navigate(STEP_ROUTES[s], { state: { scrollRatio: getScrollRatio(), isBack: s < 2 } });
  }

  function handleReset() {
    DENOMINATIONS.forEach((d) => setDenominationQuantity(d.id, 0));
    showToast(t('common:toast.cashReset'), 'info');
  }

  function handleResetAll() {
    markFlowReset();
    reset();
    setThreshold(defaultThreshold);
    setSmartMode(SMART_SPLIT_ENABLED);
    void navigate('/calculate');
  }

  return (
    <ScreenContainer
      title={t('screens:cashInput.title')}
      subtitle={t('screens:cashInput.subtitle')}
      step={2}
      totalSteps={3}
      maxReachableStep={hasTotal ? 3 : 2}
      onStepClick={handleStepClick}
      onReset={handleResetAll}
    >
      {/* Reset page — upper right */}
      <div className="mb-2 flex justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={handleReset}
          className="min-h-10 gap-1.5 text-sm text-text-secondary"
        >
          <Icon name="refresh-cw" size={14} />
          {t('screens:cashInput.resetPage')}
        </Button>
      </div>

      <DenominationGrid />

      {!hasTotal && (
        <Alert status="warning" message={t('errors:validation.zeroTotal')} className="mt-4" />
      )}

      {/* Navigation */}
      <div className="mt-8 flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleStepClick(1)}
          className="min-h-14 flex-1"
        >
          <Icon name="chevron-left" size={18} />
          {t('common:actions.back')}
        </Button>
        <Button
          type="button"
          disabled={!hasTotal}
          onClick={() => handleStepClick(3)}
          className="min-h-14 flex-[2] text-base font-semibold"
        >
          {t('common:actions.calculate')}
          <Icon name="chevron-right" size={18} />
        </Button>
      </div>
    </ScreenContainer>
  );
}
