import { isAxiosError } from 'axios';

interface ApiErrorPayload {
  message?: string;
}

export function getHttpErrorMessage(error: unknown, fallbackMessage: string): string {
  if (isAxiosError(error)) {
    const payload = error.response?.data as ApiErrorPayload | undefined;
    if (typeof payload?.message === 'string' && payload.message.trim().length > 0) {
      return payload.message;
    }
  }

  return fallbackMessage;
}
