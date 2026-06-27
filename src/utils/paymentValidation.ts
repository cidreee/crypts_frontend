import { isFutureDate } from "./date";
import { hasMoreThanTwoDecimals } from "./number";

export type PaymentFormValues = {
  amount: string;
  paymentMethodId: string;
  paymentDate: string;
};

type PaymentValidationOptions = {
  maxAmount?: number | null;
  amountRequiredMessage: string;
  invalidAmountMessage: string;
  positiveAmountMessage: string;
  decimalsMessage: string;
  maxAmountMessage: string;
  dateRequiredMessage: string;
  futureDateMessage: string;
  methodRequiredMessage: string;
};

export function validatePaymentValues(
  values: PaymentFormValues,
  options: PaymentValidationOptions
) {
  const amount = Number(values.amount);

  if (!values.amount.trim()) {
    return options.amountRequiredMessage;
  }

  if (Number.isNaN(amount)) {
    return options.invalidAmountMessage;
  }

  if (amount <= 0) {
    return options.positiveAmountMessage;
  }

  if (hasMoreThanTwoDecimals(values.amount)) {
    return options.decimalsMessage;
  }

  if (options.maxAmount != null && amount > options.maxAmount) {
    return options.maxAmountMessage;
  }

  if (!values.paymentDate) {
    return options.dateRequiredMessage;
  }

  if (isFutureDate(values.paymentDate)) {
    return options.futureDateMessage;
  }

  if (!values.paymentMethodId) {
    return options.methodRequiredMessage;
  }

  return "";
}
