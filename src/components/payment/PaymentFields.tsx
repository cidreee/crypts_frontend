import type { ChangeEvent } from "react";
import { PAYMENT_METHODS } from "../../constants/paymentMethods";
import { getTodayLocalDate } from "../../utils/date";
import { formatCurrency } from "../../utils/currency";

type PaymentFieldsProps = {
  amount: string;
  paymentMethodId: string;
  paymentDate: string;
  disabled?: boolean;
  maxAmount?: number | null;
  amountLabel: string;
  helperLabel?: string;
  shortcutLabel?: string;
  idPrefix?: string;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onAmountShortcut?: () => void;
};

function RequiredMark() {
  return (
    <span className="required-mark" title="Obligatorio">
      *
    </span>
  );
}

function PaymentFields({
  amount,
  paymentMethodId,
  paymentDate,
  disabled = false,
  maxAmount,
  amountLabel,
  helperLabel,
  shortcutLabel,
  idPrefix = "payment",
  onChange,
  onAmountShortcut,
}: PaymentFieldsProps) {
  const amountId = `${idPrefix}-amount`;
  const paymentDateId = `${idPrefix}-payment-date`;
  const paymentMethodIdId = `${idPrefix}-payment-method`;
  const showAmountHelper = maxAmount != null && maxAmount > 0;

  return (
    <>
      {showAmountHelper && (
        <div className="payment-amount-summary">
          <div>
            <span>{helperLabel}</span>
            <strong>{formatCurrency(maxAmount)}</strong>
          </div>

          {shortcutLabel && onAmountShortcut && (
            <button
              type="button"
              className="btn-amount-fill"
              onClick={onAmountShortcut}
              disabled={disabled}
            >
              {shortcutLabel}
            </button>
          )}
        </div>
      )}

      <div className="form-group">
        <label htmlFor={amountId}>
          {amountLabel} <RequiredMark />
        </label>

        <div className="currency-input-wrapper">
          <span className="currency-symbol">$</span>
          <input
            type="number"
            id={amountId}
            name="amount"
            value={amount}
            onChange={onChange}
            min="0.01"
            max={maxAmount ?? undefined}
            step="0.01"
            disabled={disabled}
            required
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor={paymentDateId}>
          Fecha de pago <RequiredMark />
        </label>
        <input
          type="date"
          id={paymentDateId}
          name="paymentDate"
          value={paymentDate}
          onChange={onChange}
          max={getTodayLocalDate()}
          disabled={disabled}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor={paymentMethodIdId}>
          Metodo de pago <RequiredMark />
        </label>
        <select
          id={paymentMethodIdId}
          name="paymentMethodId"
          value={paymentMethodId}
          onChange={onChange}
          disabled={disabled}
          required
        >
          {PAYMENT_METHODS.map((paymentMethod) => (
            <option key={paymentMethod.id} value={paymentMethod.id}>
              {paymentMethod.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

export default PaymentFields;
