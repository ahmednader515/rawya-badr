export const FAWATERAK_MIN_AMOUNT = 1;
export const FAWATERAK_MAX_AMOUNT = 200_000;

export const FAWATERAK_DEPOSIT_KIND = {
  BALANCE_TOPUP: "BALANCE_TOPUP",
} as const;

export type FawaterakDepositKindValue =
  (typeof FAWATERAK_DEPOSIT_KIND)[keyof typeof FAWATERAK_DEPOSIT_KIND];
