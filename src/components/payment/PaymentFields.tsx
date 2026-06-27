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
      <div className="form-group">
        <label htmlFor={amountId}>{amountLabel}</label>

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

        {showAmountHelper && (
          <div className="amount-helper-container">
            <span className="form-hint">
              {helperLabel}: <strong>{formatCurrency(maxAmount)}</strong>
            </span>

            {shortcutLabel && onAmountShortcut && (
              <button
                type="button"
                className="btn-link-action"
                onClick={onAmountShortcut}
                disabled={disabled}
              >
                {shortcutLabel}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor={paymentDateId}>Fecha de pago</label>
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
        <label htmlFor={paymentMethodIdId}>Método de pago</label>
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
