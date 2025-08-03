// src/utils/useAsync.ts
import { useState, useEffect } from 'react';

export interface AsyncState<T> {
  data: T | null;  // side effect result
  loading: boolean;
  error: string | null;
}

// custom hook to handle side effects
// side effect function returns a Promise which resolves to type T
export function useAsync<T>(
  fn: () => Promise<T>,  
  deps: any[] = []  // optional dependency array for useEffect
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;  // flag to track if component is still mounted

    setLoading(true);
    setError(null);

    // executing the side effect function
    fn()
      .then((result) => { // storing the result of the side effect in data
        if (mounted) {
          setData(result);
        }
      })
      .catch((err: any) => {
        if (mounted) {
          setError(err.message || 'An unexpected error occurred');
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    // cleanup function to set mounted to false to avoid state updates after unmount
    return () => {
      mounted = false;
    };
  }, deps);

  // returning the state of the side effect
  return { data, loading, error };
}
