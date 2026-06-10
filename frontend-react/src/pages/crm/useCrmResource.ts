import { useEffect, useState } from 'react';

export function useCrmResource<T>(loader: () => Promise<T>, fallback: T) {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load(): Promise<void> {
      setLoading(true);
      setError(null);
      try {
        const result = await loader();
        if (active) setData(result);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Không tải được dữ liệu CRM');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [loader]);

  return { data, loading, error };
}
