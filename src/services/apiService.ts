// src/services/apiService.ts

import axiosClient from "../api/axiosClient";
import type {
  Client,
  ClientPayload,
  UpdateClientPayload,
} from "../types/client";
import type { Crypt, CryptPayload } from "../types/crypt";
import type { Payment, PaymentPayload } from "../types/payment";
import type { ApiResponse } from "../types/apiResponse";
import type { CryptRemain } from "../types/cryptRemain";

function unwrapApiResponse<T>(apiResponse: ApiResponse<T>): T {
  if (!apiResponse.success) {
    throw new Error(apiResponse.message || "Ocurrió un error en la solicitud.");
  }

  if (apiResponse.data === null || apiResponse.data === undefined) {
    throw new Error(apiResponse.message || "La respuesta no contiene datos.");
  }

  return apiResponse.data;
}

function unwrapVoidApiResponse(apiResponse: ApiResponse<unknown>): void {
  if (!apiResponse.success) {
    throw new Error(apiResponse.message || "Ocurrió un error en la solicitud.");
  }
}

export const apiService = {
  // CLIENTS
  clients: {
    getClientsBalance: async (): Promise<Client[]> => {
      const response = await axiosClient.get<ApiResponse<Client[]>>(
        "/Client/balance"
      );

      return unwrapApiResponse(response.data);
    },

    getClientBalanceById: async (id: number): Promise<Client> => {
      const response = await axiosClient.get<ApiResponse<Client>>(
        `/Client/${id}/balance`
      );

      return unwrapApiResponse(response.data);
    },

    create: async (client: ClientPayload): Promise<Client> => {
      const response = await axiosClient.post<ApiResponse<Client>>(
        "/Client",
        client
      );

      return unwrapApiResponse(response.data);
    },

    deactivate: async (id: number): Promise<Client> => {
      const response = await axiosClient.put<ApiResponse<Client>>(
        `/Client/deactivate/${id}`,
      );

      return unwrapApiResponse(response.data);
    },

    update: async (
      id: number,
      client: UpdateClientPayload
    ): Promise<void> => {
      const response = await axiosClient.put<ApiResponse<unknown>>(
        `/Client/${id}`,
        client
      );

      unwrapVoidApiResponse(response.data);
    },
  },

  // CRYPTS
  crypts: {
    getAll: async (): Promise<Crypt[]> => {
      const response = await axiosClient.get<ApiResponse<Crypt[]>>("/Crypt");

      return unwrapApiResponse(response.data);
    },

    getById: async (id: number): Promise<Crypt> => {
      const response = await axiosClient.get<ApiResponse<Crypt>>(
        `/Crypt/${id}`
      );

      return unwrapApiResponse(response.data);
    },

    create: async (crypt: CryptPayload): Promise<Crypt> => {
      const response = await axiosClient.post<ApiResponse<Crypt>>(
        "/Crypt",
        crypt
      );

      return unwrapApiResponse(response.data);
    },

    update: async (id: number, crypt: CryptPayload): Promise<void> => {
      const response = await axiosClient.put<ApiResponse<unknown>>(
        `/Crypt/${id}`,
        crypt
      );

      unwrapVoidApiResponse(response.data);
    },

    assignOwner: async (cryptId: number, clientId: number): Promise<Crypt> => {
      const response = await axiosClient.put<ApiResponse<Crypt>>(
        `/Crypt/${cryptId}/assign`,
        null,
        {
          params: { clientId },
        }
      );

      return unwrapApiResponse(response.data);
    },

    cancelPurchase: async (cryptId: number): Promise<Crypt> => {
      const response = await axiosClient.put<ApiResponse<Crypt>>(
        `/Crypt/${cryptId}/cancel-purchase`
      );

      return unwrapApiResponse(response.data);
    },
  },

  // CRYPT REMAINS
  cryptRemains: {
    getAll: async (): Promise<CryptRemain[]> => {
      const response = await axiosClient.get<ApiResponse<CryptRemain[]>>(
        "/CryptRemain"
      );

      return unwrapApiResponse(response.data);
    },

    getByCryptId: async (cryptId: number): Promise<CryptRemain[]> => {
      const response = await axiosClient.get<ApiResponse<CryptRemain[]>>(
        `/CryptRemain/by-cryptId/${cryptId}`
      );

      return unwrapApiResponse(response.data);
    },

    create: async (cryptRemain: CryptRemain): Promise<CryptRemain> => {
      const response = await axiosClient.post<ApiResponse<CryptRemain>>(
        "/CryptRemain",
        cryptRemain
      );

      return unwrapApiResponse(response.data);
    },
  },

  // PAYMENTS
  payments: {
    getHistory: async (
      clientId?: number,
      cryptId?: number
    ): Promise<Payment[]> => {
      const response = await axiosClient.get<ApiResponse<Payment[]>>(
        `/Payment/history`,
        {
          params: {
            clientId,
            cryptId,
          },
        }
      );

      return unwrapApiResponse(response.data);
    },

    create: async (payment: PaymentPayload): Promise<Payment> => {
      const response = await axiosClient.post<ApiResponse<Payment>>(
        "/Payment",
        payment
      );

      return unwrapApiResponse(response.data);
    },

    update: async (id: number, payment: PaymentPayload): Promise<void> => {
      const response = await axiosClient.put<ApiResponse<unknown>>(
        `/Payment/${id}`,
        payment
      );

      unwrapVoidApiResponse(response.data);
    },
  },
};
