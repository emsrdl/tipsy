/**
 * @file src/components/molecules/Card/Card.tsx
 * @description Card molecule — thin wrapper re-exporting shadcn Card parts.
 *
 * Provides consistent padding defaults for the app.
 * Use this instead of the shadcn Card directly.
 *
 * @example
 * <Card>
 *   <CardHeader><CardTitle>Gesamt</CardTitle></CardHeader>
 *   <CardContent>€ 120,00</CardContent>
 * </Card>
 */

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
