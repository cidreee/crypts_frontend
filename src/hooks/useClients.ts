import { useEffect, useState } from "react";
import { apiService } from "../services/apiService";
import type { Client } from "../types/client";

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const clearMessages = () => {
    setError("");
    setSuccessMessage("");
  };

  const loadClients = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiService.clients.getClientsBalance();
      setClients(data);
    } catch (err) {
      console.error("Error loading clients:", err);
      setError("No se pudieron cargar los clientes.");
    } finally {
      setLoading(false);
    }
  };

  const createClient = async (client: Client): Promise<boolean> => {
    try {
      setSaving(true);
      clearMessages();

      await apiService.clients.create(client);
      setSuccessMessage("Cliente registrado correctamente.");

      await loadClients();
      return true;
    } catch (err) {
      console.error("Error creating client:", err);
      setError("No se pudo registrar el cliente.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateClient = async (id: number, client: Client): Promise<boolean> => {
    try {
      setSaving(true);
      clearMessages();

      await apiService.clients.update(id, client);
      setSuccessMessage("Cliente actualizado correctamente.");

      await loadClients();
      return true;
    } catch (err) {
      console.error("Error updating client:", err);
      setError("No se pudo actualizar el cliente.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  return {
    clients,
    loading,
    saving,
    error,
    successMessage,
    loadClients,
    createClient,
    updateClient,
    clearMessages,
  };
}