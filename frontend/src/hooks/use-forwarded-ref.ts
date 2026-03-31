'use client';

import { useCallback, useRef, type Ref, type MutableRefObject } from 'react';

export function useForwardedRef<T>(forwardedRef: Ref<T> | undefined): (instance: T | null) => void {
  const innerRef = useRef<T | null>(null);
  return useCallback(
    (node: T | null) => {
      innerRef.current = node;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        (forwardedRef as MutableRefObject<T | null>).current = node;
      }
    },
    [forwardedRef]
  );
}
