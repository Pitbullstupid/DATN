import { useState, useCallback, useEffect, useRef } from "react";

/**
 * Generic data-fetching hook cho admin API.
 * @param {() => Promise} fetchFn   — hàm gọi API (sẽ được wrap trong useCallback)
 * @param {Array}         deps      — dependencies để re-fetch khi thay đổi
 */
export function useAdminData(fetchFn, deps = []) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const reloadTimerRef        = useRef(null);
  const fetchFnRef            = useRef(fetchFn);
  const depsKey               = JSON.stringify(deps);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFnRef.current();
      setData(res.data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFnRef.current = fetchFn;
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [depsKey, load]);

  useEffect(() => {
    const handleNewNotification = () => {
      window.clearTimeout(reloadTimerRef.current);
      reloadTimerRef.current = window.setTimeout(load, 300);
    };

    window.addEventListener("new-notification", handleNewNotification);

    return () => {
      window.removeEventListener("new-notification", handleNewNotification);
      window.clearTimeout(reloadTimerRef.current);
    };
  }, [load]);

  return { data, loading, error, reload: load };
}
