import { useCallback, useRef, useState } from 'react';
import type { ToastVariant } from '@components/ui';

export interface ToastMessage {
  key: number;
  variant: ToastVariant;
  title: string;
  description?: string;
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const nextKeyRef = useRef(0);

  const showToast = useCallback((variant: ToastVariant, title: string, description?: string) => {
    nextKeyRef.current += 1;
    setToast({ key: nextKeyRef.current, variant, title, description });
    setIsOpen(true);
  }, []);

  const dismissToast = useCallback(() => {
    setIsOpen(false);
  }, []);

  return { toast, isOpen, showToast, dismissToast };
};
