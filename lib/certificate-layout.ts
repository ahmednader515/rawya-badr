export const CERTIFICATE_POSITION_DEFAULTS = {
  nameTop: 48,
  nameLeft: 50,
  dateTop: 56,
  dateLeft: 50,
  courseCodeTop: 62,
  courseCodeLeft: 50,
  courseNameTop: 68,
  courseNameLeft: 50,
  certTypeTop: 74,
  certTypeLeft: 50,
  creditPointsTop: 80,
  creditPointsLeft: 50,
  creditTypeTop: 86,
  creditTypeLeft: 50,
} as const;

export type CertificateTemplate = {
  certificateBackgroundUrl?: string | null;
  certificateNameTop?: number | null;
  certificateNameLeft?: number | null;
  certificateDateTop?: number | null;
  certificateDateLeft?: number | null;
  certificateCourseCodeTop?: number | null;
  certificateCourseCodeLeft?: number | null;
  certificateCourseNameTop?: number | null;
  certificateCourseNameLeft?: number | null;
  certificateCertTypeTop?: number | null;
  certificateCertTypeLeft?: number | null;
  certificateCreditPointsTop?: number | null;
  certificateCreditPointsLeft?: number | null;
  certificateCreditTypeTop?: number | null;
  certificateCreditTypeLeft?: number | null;
};

export function parseCertificatePosition(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(0, Math.round(n * 10) / 10));
}

export function certificatePositionsFromTemplate(template: CertificateTemplate) {
  const d = CERTIFICATE_POSITION_DEFAULTS;
  return {
    nameTop: parseCertificatePosition(template.certificateNameTop, d.nameTop),
    nameLeft: parseCertificatePosition(template.certificateNameLeft, d.nameLeft),
    dateTop: parseCertificatePosition(template.certificateDateTop, d.dateTop),
    dateLeft: parseCertificatePosition(template.certificateDateLeft, d.dateLeft),
    courseCodeTop: parseCertificatePosition(template.certificateCourseCodeTop, d.courseCodeTop),
    courseCodeLeft: parseCertificatePosition(template.certificateCourseCodeLeft, d.courseCodeLeft),
    courseNameTop: parseCertificatePosition(template.certificateCourseNameTop, d.courseNameTop),
    courseNameLeft: parseCertificatePosition(template.certificateCourseNameLeft, d.courseNameLeft),
    certTypeTop: parseCertificatePosition(template.certificateCertTypeTop, d.certTypeTop),
    certTypeLeft: parseCertificatePosition(template.certificateCertTypeLeft, d.certTypeLeft),
    creditPointsTop: parseCertificatePosition(
      template.certificateCreditPointsTop,
      d.creditPointsTop,
    ),
    creditPointsLeft: parseCertificatePosition(
      template.certificateCreditPointsLeft,
      d.creditPointsLeft,
    ),
    creditTypeTop: parseCertificatePosition(template.certificateCreditTypeTop, d.creditTypeTop),
    creditTypeLeft: parseCertificatePosition(template.certificateCreditTypeLeft, d.creditTypeLeft),
  };
}
