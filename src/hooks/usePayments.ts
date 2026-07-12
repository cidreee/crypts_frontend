// src/hooks/usePayments.ts

import { useCallback, useEffect, useState } from "react";
import { apiService } from "../services/apiService";
import type { Payment } from "../types/payment";
import { getApiErrorMessage } from "../utils/apiError";

export function usePayments(clientId: number, initialCryptId?: number) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedCryptId, setSelectedCryptId] = useState<number | undefined>(
    initialCryptId
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadPayments = useCallback(
    async (cryptId?: number) => {
      if (!clientId || Number.isNaN(clientId)) return;

      try {
        setLoading(true);
        setError("");

        const data = await apiService.payments.getHistory(
          clientId,
          cryptId
        );

        setPayments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading payments:", err);
        setError(
          getApiErrorMessage(err, "No se pudo cargar el historial de pagos.")
        );
        setPayments([]);
      } finally {
        setLoading(false);
      }
    },
    [clientId]
  );

  useEffect(() => {
    setSelectedCryptId(initialCryptId);
    loadPayments(initialCryptId);
  }, [initialCryptId, loadPayments]);

  const handleCryptFilterChange = useCallback(
    async (cryptId?: number) => {
      setSelectedCryptId(cryptId);
      await loadPayments(cryptId);
    },
    [loadPayments]
  );

  return {
    payments,
    selectedCryptId,
    loading,
    error,
    loadPayments,
    handleCryptFilterChange,
  };
}
