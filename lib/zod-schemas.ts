import { z } from 'zod';

export const ApiErrorSchema = z.object({
  message: z.string().optional(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
});

export const ApiSuccessMessageSchema = z.object({
  message: z.string().optional(),
});

export function parseApiErrorMessage(input: unknown, fallback: string): string {
  const parsed = ApiErrorSchema.safeParse(input);
  if (!parsed.success) return fallback;

  const { message, errors } = parsed.data;
  if (message) return message;

  const firstErrorKey = errors ? Object.keys(errors)[0] : undefined;
  const firstErrorMessage = firstErrorKey && errors?.[firstErrorKey]?.[0];
  return firstErrorMessage || fallback;
}
