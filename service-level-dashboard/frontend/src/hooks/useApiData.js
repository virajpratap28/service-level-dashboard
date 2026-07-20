import { useCallback, useEffect, useState } from "react";

/**
 * useApiData
 * ----------
 * Generic data-fetching hook used by every dashboard page. Re-fetches
 * whenever `filters` changes and exposes { data, loading, error, refetch }.
 */
export function useApiData(fetchFn, filters) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cleanParams = (obj) =>
    Object.fromEntries(Object.entries(obj || {}).filter(([, v]) => v !== undefined && v !== ""));

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchFn(cleanParams(filters))
      .then((res) => setData(res))
      .catch((err) => {
        setError(err?.response?.data?.detail || "Failed to load data.");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
}
