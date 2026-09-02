import { Cairo } from "next/font/google";
import { certificatePositionsFromTemplate } from "@/lib/certificate-layout";
import type { HomepageSetting } from "@/lib/types";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

type Props = {
  studentName: string;
  issuedAt: Date;
  template: HomepageSetting;
};

function formatCertificateDate(date: Date): string {
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function CertificateView({ studentName, issuedAt, template }: Props) {
  const dateStr = formatCertificateDate(issuedAt);
  const positions = certificatePositionsFromTemplate(template);

  const hasBackground = Boolean(template.certificateBackgroundUrl?.trim());
  const bgStyle = hasBackground
    ? {
        backgroundImage: `url(${template.certificateBackgroundUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        background: "linear-gradient(135deg, #1e3a5f22 0%, #1e3a5f08 50%, #fff 100%)",
      };

  return (
    <div
      id="certificate-print-area"
      className={`${cairo.className} relative mx-auto aspect-[1.414/1] w-full max-w-3xl overflow-hidden rounded-lg border border-[var(--color-border)] shadow-lg print:border-0 print:shadow-none`}
      style={bgStyle}
    >
      {!hasBackground ? <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px]" /> : null}
      <div className="relative h-full w-full">
        <p
          className="absolute max-w-[85%] -translate-x-1/2 -translate-y-1/2 text-center text-3xl font-bold leading-tight text-[#1a1a1a] sm:text-4xl [text-shadow:0_1px_3px_rgba(255,255,255,0.9)]"
          style={{ top: `${positions.nameTop}%`, left: `${positions.nameLeft}%` }}
        >
          {studentName}
        </p>
        <p
          className="absolute max-w-[85%] -translate-x-1/2 -translate-y-1/2 text-center text-lg text-[#333] sm:text-xl [text-shadow:0_1px_3px_rgba(255,255,255,0.9)]"
          style={{ top: `${positions.dateTop}%`, left: `${positions.dateLeft}%` }}
          lang="en"
        >
          {dateStr}
        </p>
      </div>
    </div>
  );
}
