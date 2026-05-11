import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Debounce a value by a given delay (ms).
 * Useful for search inputs to avoid excessive API calls.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Prevent double-submit on forms and actions.
 * Returns [isSubmitting, wrappedHandler] where the handler
 * automatically sets isSubmitting = true during execution
 * and resets it on completion (or error).
 */
export function useSubmitGuard() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const guard = useCallback(
    (handler: () => Promise<void>) => {
      return async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
          await handler();
        } finally {
          if (mountedRef.current) setIsSubmitting(false);
        }
      };
    },
    [isSubmitting]
  );

  return { isSubmitting, guard };
}

/**
 * Authenticated fetch wrapper that injects the Bearer token
 * and handles common error patterns.
 */
export async function apiFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string }> {
  const token = localStorage.getItem('@ERP:token');
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(url, { ...options, headers });

    if (res.status === 401) {
      localStorage.removeItem('@ERP:token');
      localStorage.removeItem('@ERP:user');
      window.location.href = '/login';
      return { success: false, message: 'Sessão expirada' };
    }

    if (res.status === 403) {
      return { success: false, message: 'Permissão insuficiente para esta ação.' };
    }

    const json = await res.json();
    return json;
  } catch (err: any) {
    return { success: false, message: err.message || 'Erro de rede' };
  }
}
