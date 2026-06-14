// src/hooks/useCrypts.ts

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

      const safeCrypts = Array.isArray(data)
        ? data.filter((crypt): crypt is Crypt => crypt !== null && crypt !== undefined)
        : [];

      setCrypts(safeCrypts);
    } catch (err) {
      console.error("Error loading crypts:", err);
      setError(getApiErrorMessage(err, "No se pudieron cargar las criptas."));
      setCrypts([]);
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