export const PAYMENT_METHODS = [
  { id: 1, label: "Efectivo" },
  { id: 2, label: "Transferencia electrónica" },
  { id: 3, label: "Tarjeta de crédito" },
  { id: 4, label: "Tarjeta de débito" },
  { id: 5, label: "Cheque" },
  { id: 6, label: "Por definir" },
] as const;

const PAYMENT_METHOD_LABEL_BY_ID = new Map<number, string>(
  PAYMENT_METHODS.map((paymentMethod) => [
    paymentMethod.id,
    paymentMethod.label,
  ])
);

const PAYMENT_METHOD_LABEL_BY_NAME: Record<string, string> = {
  cash: "Efectivo",
  "electronic funds transfer": "Transferencia electrónica",
  "credit card": "Tarjeta de crédito",
  "debit card": "Tarjeta de débito",
  check: "Cheque",
  "to be defined": "Por definir",
};

export function getPaymentMethodLabel(
  paymentMethodId?: number | null,
  paymentMethodName?: string | null
) {
  if (paymentMethodId && PAYMENT_METHOD_LABEL_BY_ID.has(paymentMethodId)) {
    return PAYMENT_METHOD_LABEL_BY_ID.get(paymentMethodId) as string;
  }

  const normalizedName = paymentMethodName?.trim().toLowerCase();

  if (normalizedName && PAYMENT_METHOD_LABEL_BY_NAME[normalizedName]) {
    return PAYMENT_METHOD_LABEL_BY_NAME[normalizedName];
  }

  return paymentMethodName?.trim() || `Método ${paymentMethodId ?? ""}`.trim();
}
