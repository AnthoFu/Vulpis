import { useState } from 'react';

export interface UseToastReturn {
  toast: string | null;
  showToast: (message: string) => void;
}

export default function useToast(): UseToastReturn {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string): void => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  return { toast, showToast };
}
