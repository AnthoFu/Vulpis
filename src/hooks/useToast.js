import { useState } from 'react';

export default function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  return { toast, showToast };
}
