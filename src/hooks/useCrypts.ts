import { useCallback, useEffect, useState } from "react";
import { apiService } from "../services/apiService";
import type { Crypt } from "../types/crypt";
import { getApiErrorMessage } from "../utils/apiError";

export function useCrypts() {
  const [crypts, setCrypts] = useState<Crypt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadCrypts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiService.crypts.getAll();
      setCrypts(data);
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "No se pudieron cargar las criptas."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCrypts();
  }, [loadCrypts]);

  return {
    crypts,
    loading,
    error,
    loadCrypts,
  };
}
