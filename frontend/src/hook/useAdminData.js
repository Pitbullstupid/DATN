import { useState, useCallback, useEffect } from "react";

/**
 * Generic data-fetching hook cho admin API.
 * @param {() => Promise} fetchFn   — hàm gọi API (sẽ được wrap trong useCallback)
 * @param {Array}         deps      — dependencies để re-fetch khi thay đổi
 */
export function useAdminData(fetchFn, deps = []) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn();
      setData(res.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}