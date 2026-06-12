import { isAxiosError } from "axios";

type ErrorResponse = {
  message?: string;
  title?: string;
  errors?: Record<string, string[]>;
};

export function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  if (!isAxiosError<ErrorResponse>(error)) {
    return fallbackMessage;
  }

  const data = error.response?.data;

  if (data?.message) {
    return data.message;
  }

  if (data?.title) {
    return data.title;
  }

  const firstValidationMessage = data?.errors
    ? Object.values(data.errors).flat()[0]
    : undefined;

  if (firstValidationMessage) {
    return firstValidationMessage;
  }

  if (error.code === "ERR_NETWORK") {
    return "No se pudo conectar con el backend local. Revisa que el API esté encendida.";
  }

  return fallbackMessage;
}
