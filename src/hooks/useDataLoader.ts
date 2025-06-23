import { useState, useEffect, useCallback } from 'react';

interface DataLoaderState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseDataLoaderOptions {
  refreshOnFocus?: boolean;
}

export function useDataLoader<T>(
  loader: () => Promise<T>,
  dependencies: any[] = [],
  options: UseDataLoaderOptions = {}
): DataLoaderState<T> & { refetch: () => Promise<void> } {
  const { refreshOnFocus = false } = options;
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

  // Add focus-based refresh
  useEffect(() => {
    if (!refreshOnFocus) return;

    const handleFocus = () => {
      console.log('🔄 Window focused, refreshing data...');
      refetch();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshOnFocus, refetch]);

  return { ...state, refetch };
}
