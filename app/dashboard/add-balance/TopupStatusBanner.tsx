"use client";

type TopupStatusBannerProps = {
  status: TopupStatus;
  labels: {
    successTitle: string;
    successBody: string;
    failedTitle: string;
    failedBody: string;
    pendingTitle: string;
    pendingBody: string;
  };
};

export type TopupStatus = "success" | "failed" | "pending";

const STATUS_STYLES = {
  success: {
    box: "border-2 border-emerald-500 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/50",
    title: "text-lg font-bold text-emerald-950 dark:text-emerald-50",
    body: "mt-2 text-base leading-relaxed font-medium text-emerald-900 dark:text-emerald-100",
  },
  failed: {
    box: "border-2 border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-950/50",
    title: "text-lg font-bold text-red-950 dark:text-red-50",
    body: "mt-2 text-base leading-relaxed font-medium text-red-900 dark:text-red-100",
  },
  pending: {
    box: "border-2 border-amber-500 bg-amber-50 dark:border-amber-500 dark:bg-amber-950/50",
    title: "text-lg font-bold text-amber-950 dark:text-amber-50",
    body: "mt-2 text-base leading-relaxed font-medium text-amber-900 dark:text-amber-100",
  },
} as const;

export function TopupStatusBanner({ status, labels }: TopupStatusBannerProps) {
  const content =
    status === "success"
      ? { title: labels.successTitle, body: labels.successBody, styles: STATUS_STYLES.success }
      : status === "failed"
        ? { title: labels.failedTitle, body: labels.failedBody, styles: STATUS_STYLES.failed }
        : { title: labels.pendingTitle, body: labels.pendingBody, styles: STATUS_STYLES.pending };

  return (
    <div className={`mt-6 rounded-[var(--radius-btn)] p-5 ${content.styles.box}`} role="status">
      <p className={content.styles.title}>{content.title}</p>
      <p className={content.styles.body}>{content.body}</p>
    </div>
  );
}
