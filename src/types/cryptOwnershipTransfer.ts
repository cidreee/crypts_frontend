export interface CryptOwnershipTransfer {
    id?: number;
    cryptId: number;
    fromClientId: number;
    toClientId: number;
    tranferredAmount?: number;
    transferredAt?: string;
    reason?: string;

}