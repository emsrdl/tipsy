# Data Model

All types live in `src/types/`. Barrel export via `src/types/index.ts`.

## Employee

```typescript
// src/types/employee.ts
type EmployeeGroup = 'kitchen' | 'service';

interface Employee {
  id: string;
  name: string;
  hours: number;           // hours worked — used for proportional distribution
  group: EmployeeGroup;
  isProfileOwner?: boolean; // auto-added from active profile
}
```

Profile-owned employees get the id prefix `profile-emp-{profileId}`.

## Session

```typescript
// src/types/session.ts
interface DenominationQuantity {
  denominationId: string;  // references DENOMINATIONS in src/config/currency.ts
  quantity: number;        // count of this denomination (≥ 0)
}

interface TipSplit {
  kitchenPercent: number;  // 0–100, must sum to 100 with servicePercent
  servicePercent: number;
}

interface DistributionResult {
  employeeId: string;
  name: string;
  group: 'kitchen' | 'service';
  hours: number;
  amountInCents: number;  // calculated tip — integer cents
}

interface TipSession {
  employees: Employee[];
  split: TipSplit;
  denominations: DenominationQuantity[];
  results: DistributionResult[] | null;  // null until calculate() runs
}
```

Default split: `{ kitchenPercent: 40, servicePercent: 60 }`.

## Profile

```typescript
// src/types/profile.ts
type ProfileRole = 'kitchen' | 'service';

interface Profile {
  id: string;
  name: string;
  role: ProfileRole;
  createdAt: string;  // ISO 8601
  isActive: boolean;
  stats: {
    totalShifts: number;
    totalTipsInCents: number;
    hourlyRateAvgInCents: number;
  };
}
```

## Shift (saved history)

```typescript
// src/types/shift.ts
interface Shift {
  id: string;                    // unique — used for dedup on import
  profileId: string | null;      // null = guest session
  date: string;                  // ISO 8601
  kitchenPercent: number;
  employees: Employee[];
  totalTipsInCents: number;
  denominationInput: DenominationQuantity[];
  distribution: SmartDistributionResult;
  smartSplitting: boolean;
  differences: DifferenceLine[];
  savedAt: string;               // ISO 8601
}
```

## Smart Split Types

```typescript
interface PersonShare {
  id: string;
  name: string;
  role: 'kitchen' | 'service';
  hoursWorked: number;
  idealShareInCents: number;   // proportional target
  actualShareInCents: number;  // what they actually receive (denomination-constrained)
  deviationInCents: number;    // actual − ideal (positive = overpaid)
}

interface SmartDistributionResult {
  personShares: PersonShare[];
  remainingCents: number;      // cents that couldn't be distributed
  fairnessScore: number;       // 0–100 (100 = perfect)
  denominationsUsed: { denominationId: string; quantity: number }[];
}

interface DifferenceLine {
  fromPerson: { id: string; name: string };
  toPerson: { id: string; name: string };
  amountInCents: number;
  method: 'direct' | 'paypal' | 'transfer';
  reason: string;
}

interface SmartSplitInput {
  employees: Employee[];
  totalInCents: number;
  kitchenPercent: number;
  denominations: DenominationQuantity[];
  smartMode: boolean;
  fairnessThresholdInCents: number;
}

interface SmartSplitOutput {
  distribution: SmartDistributionResult;
  differences: DifferenceLine[];
  payoutPlans?: EmployeePayoutPlan[];  // denomination assignments per employee
  durationMs: number;
}
```

## Theme

```typescript
// src/types/theme.ts
type ThemeId = 'tipsy' | 'katzentempel';
type ColorMode = 'light' | 'dark';

interface AccentColor {
  id: string;
  labelKey: string;    // i18n key
  hex: string;
  hoverHex: string;
  subtleHex: string;
  subtleDarkHex: string;
}

interface Theme {
  id: ThemeId;
  labelKey: string;
  hasAccentPicker: boolean;   // true only for tipsy
  accentColors: AccentColor[];
  defaultAccentId: string;
}
```
