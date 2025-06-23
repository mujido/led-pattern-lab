import { useState, useEffect, useCallback } from 'react';

interface DataLoaderState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useDataLoader<T>(
  loader: () => Promise<T>,
  dependencies: any[] = []
): DataLoaderState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<DataLoaderState<T>>({
    data: null,
    loading: true,
    error: null
  });

  const loadData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await loader();
      setState({ data, loading: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState({ data: null, loading: false, error: errorMessage });
    }
  }, [loader]);

  const refetch = useCallback(async () => {
    await loadData();
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, dependencies);

  return { ...state, refetch };
}
