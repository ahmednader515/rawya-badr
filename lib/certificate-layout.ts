export const CERTIFICATE_POSITION_DEFAULTS = {
  nameTop: 48,
  nameLeft: 50,
  dateTop: 56,
  dateLeft: 50,
} as const;

export type CertificateTemplate = {
  certificateBackgroundUrl?: string | null;
  certificateNameTop?: number | null;
  certificateNameLeft?: number | null;
  certificateDateTop?: number | null;
  certificateDateLeft?: number | null;
};

export function parseCertificatePosition(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(0, Math.round(n * 10) / 10));
}

export function certificatePositionsFromTemplate(template: CertificateTemplate) {
  return {
    nameTop: parseCertificatePosition(
      template.certificateNameTop,
      CERTIFICATE_POSITION_DEFAULTS.nameTop,
    ),
    nameLeft: parseCertificatePosition(
      template.certificateNameLeft,
      CERTIFICATE_POSITION_DEFAULTS.nameLeft,
    ),
    dateTop: parseCertificatePosition(
      template.certificateDateTop,
      CERTIFICATE_POSITION_DEFAULTS.dateTop,
    ),
    dateLeft: parseCertificatePosition(
      template.certificateDateLeft,
      CERTIFICATE_POSITION_DEFAULTS.dateLeft,
    ),
  };
}
