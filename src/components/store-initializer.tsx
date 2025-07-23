'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';

export function StoreInitializer() {
  const { init } = useAppStore();

  useEffect(() => {
    init();
  }, [init]);

  return null;
}