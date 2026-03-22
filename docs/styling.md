# Styling

UI follows **Google Material Design 3** principles, implemented via Tailwind CSS and CSS custom properties.

## Surfaces & Elevation

Use elevation to communicate hierarchy. Higher elevation = more prominent.

```
bg-surface          — page background
bg-surface-raised   — cards, sections (shadow-elevation-1)
bg-surface-overlay  — inputs, chips, secondary areas
```

Cards always: `rounded-xl bg-surface-raised shadow-elevation-1`

## Colors

All colors are CSS custom properties in `src/styles/globals.css`. **Never hardcode hex values.**

| Token | Usage |
|---|---|
| `text-text-primary` | Main content |
| `text-text-secondary` | Labels, hints, secondary info |
| `text-accent` | Interactive highlights, active states |
| `bg-accent` | Primary buttons, active indicators |
| `text-status-error/success/warning` | Semantic feedback |
| `border-border` | Dividers, input borders |

Themes switch via `data-theme="tipsy|katzentempel"` + `data-mode="light|dark"` on `<html>`.
Accent colors injected dynamically by ThemeContext.

## Typography

- Body: `text-sm` (14px), content: `text-base` (16px)
- Labels/hints: `text-xs` (12px)
- Headings: `font-semibold` or `font-bold` — no decorative fonts
- Monospace (amounts, codes): `font-mono`

## Spacing

4px base grid. Standard patterns:

- List item padding: `px-4 py-3`
- Card inner padding: `p-4`
- Gap between related items: `gap-2` or `gap-3`
- Section spacing: `space-y-4` or `space-y-6`
- Between major sections: `mt-8`

## Touch Targets (Material minimum: 48dp)

- All interactive elements: `min-h-10` (40px) minimum
- Primary action buttons: `min-h-14` (56px)
- Secondary/nav buttons: `min-h-12` (48px)
- Icon-only buttons: `h-8 w-8` minimum with sufficient padding

## Interactive States

Every interactive element must have visible state changes:

```
transition-colors           — smooth color transitions
hover:bg-surface-overlay    — hover on list items
focus:border-accent focus:outline-none  — focus on inputs
active/pressed: handled by browser defaults
```

## Border Radius

`rounded-md` = 12px, set globally in `tailwind.config.ts`.

- Cards/sections: `rounded-xl`
- Buttons: `rounded-md` (default via Button atom)
- Inputs: `rounded-lg`
- Avatars/chips: `rounded-full`

## Buttons

Always use the `Button` atom. Variants:

| Variant | Usage |
|---|---|
| `default` | Primary action (filled, accent) |
| `outline` | Secondary action |
| `ghost` | Tertiary / destructive-light / navigation |

Full-width primary: `className="min-h-14 w-full text-base font-semibold"`
Ghost secondary: `className="min-h-12 w-full"`

## Icons

Always use the `Icon` component (Lucide set). Pair with text labels for clarity.

```tsx
<Icon name="refresh-cw" size={14} />   // inline with text
<Icon name="chevron-right" size={18} /> // navigation
<Icon name="save" size={18} />          // primary action
```

## Feedback

- Mutations always show a toast via `useToast()` — never silent
- Destructive actions require a `ConfirmDialog`
- Form validation errors use the `Alert` molecule (`status="warning|error"`)
