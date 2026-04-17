export const isDevEnvironment = process.env.NODE_ENV !== 'production';

/**
 * Keep production logs quiet while preserving rich diagnostics during development.
 */
export function logClientError(context: string, error: unknown): void {
  if (!isDevEnvironment) {
    return;
  }

  console.error(`[${context}]`, error);
}
