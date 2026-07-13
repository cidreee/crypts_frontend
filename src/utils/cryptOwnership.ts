import type { Crypt } from "../types/crypt";
import type { CryptOwnershipTransfer } from "../types/cryptOwnershipTransfer";
import { getBackendDateTime } from "./date";

export function getCryptCurrentClientId(crypt: Crypt) {
  return crypt.clientId ?? crypt.client?.id ?? null;
}

export function getCryptBeneficiaryId(crypt: Crypt) {
  return crypt.beneficiaryId ?? crypt.beneficiary?.id ?? null;
}

export function getCryptOwnershipTransfers(crypt: Crypt) {
  return crypt.cryptOwnershipTransfers ?? [];
}

export function getTransferId(transfer: CryptOwnershipTransfer) {
  return transfer.id ?? 0;
}

export function getTransferFromClientId(transfer: CryptOwnershipTransfer) {
  return transfer.fromClientId ?? null;
}

export function getTransferToClientId(transfer: CryptOwnershipTransfer) {
  return transfer.toClientId ?? null;
}

export function getTransferDebtAmount(transfer: CryptOwnershipTransfer) {
  return transfer.transferredDebtAmount ?? null;
}

export function getTransferDate(transfer: CryptOwnershipTransfer) {
  return transfer.transeferredAt ?? null;
}

export function getTransferReason(transfer: CryptOwnershipTransfer) {
  return transfer.reason ?? null;
}

export function getLatestIncomingTransferForClient(
  crypt: Crypt,
  clientId?: number | null
) {
  if (!clientId) return null;

  const incomingTransfers = getCryptOwnershipTransfers(crypt).filter(
    (transfer) => getTransferToClientId(transfer) === clientId
  );

  if (incomingTransfers.length === 0) return null;

  return [...incomingTransfers].sort((firstTransfer, secondTransfer) => {
    const firstTime = getBackendDateTime(getTransferDate(firstTransfer)) ?? 0;
    const secondTime = getBackendDateTime(getTransferDate(secondTransfer)) ?? 0;

    if (firstTime !== secondTime) return secondTime - firstTime;

    return getTransferId(secondTransfer) - getTransferId(firstTransfer);
  })[0];
}

export function getLatestOutgoingTransferForClient(
  crypt: Crypt,
  clientId?: number | null
) {
  if (!clientId) return null;

  const outgoingTransfers = getCryptOwnershipTransfers(crypt).filter(
    (transfer) => getTransferFromClientId(transfer) === clientId
  );

  if (outgoingTransfers.length === 0) return null;

  return [...outgoingTransfers].sort((firstTransfer, secondTransfer) => {
    const firstTime = getBackendDateTime(getTransferDate(firstTransfer)) ?? 0;
    const secondTime = getBackendDateTime(getTransferDate(secondTransfer)) ?? 0;

    if (firstTime !== secondTime) return secondTime - firstTime;

    return getTransferId(secondTransfer) - getTransferId(firstTransfer);
  })[0];
}

export function getLatestIncomingTransfer(crypt: Crypt) {
  return getLatestIncomingTransferForClient(
    crypt,
    getCryptCurrentClientId(crypt)
  );
}

export function getInheritedDebtAmount(crypt: Crypt) {
  const incomingTransfer = getLatestIncomingTransfer(crypt);

  return incomingTransfer ? getTransferDebtAmount(incomingTransfer) : null;
}

export function hasInheritedDebt(crypt: Crypt) {
  return getInheritedDebtAmount(crypt) !== null;
}

export function getEffectiveCryptTotalAmount(crypt: Crypt) {
  return (
    getInheritedDebtAmount(crypt) ?? crypt.balance?.totalAmount ?? crypt.cost
  );
}

export function getEffectiveCryptBalanceDue(crypt: Crypt) {
  const inheritedDebtAmount = getInheritedDebtAmount(crypt);
  const rawBalanceDue = crypt.balance?.balanceDue;

  if (inheritedDebtAmount !== null) {
    return Math.min(
      Math.max(rawBalanceDue ?? inheritedDebtAmount, 0),
      inheritedDebtAmount
    );
  }

  return rawBalanceDue ?? crypt.cost;
}

export function getEffectiveCryptTotalPaid(crypt: Crypt) {
  const inheritedDebtAmount = getInheritedDebtAmount(crypt);

  if (inheritedDebtAmount !== null) {
    return Math.max(
      getEffectiveCryptTotalAmount(crypt) - getEffectiveCryptBalanceDue(crypt),
      0
    );
  }

  return crypt.balance?.totalPaid ?? 0;
}
