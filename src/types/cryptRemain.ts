import type { Crypt } from "./crypt";

export interface CryptRemain {
  id?: number;
  cryptId: number;
  deceasedName?: string | null;
  isActive?: boolean | null;
  createdAt: string;
  deletedAt?: string | null;

  crypt?: Crypt;
}
