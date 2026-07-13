export interface CryptOwnershipTransfer {
  id?: number;
  cryptId: number;
  fromClientId: number;
  toClientId: number;
  transferredDebtAmount?: number | null;
  transeferredAt?: string | null;
  reason?: string | null;
}
