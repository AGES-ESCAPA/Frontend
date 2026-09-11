import { useCallback, useState } from 'react';
import type { ToastVariant } from '@components/ui';

export interface ToastMessage {
  key: number;
  variant: ToastVariant;
  title: string;
  description?: string;
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((variant: ToastVariant, title: string, description?: string) => {
    setToast({ key: Date.now(), variant, title, description });
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  return { toast, showToast, dismissToast };
};
