import { getServerTranslator } from "@/lib/i18n/server";

export default async function MobileBlockedPage() {
  const t = await getServerTranslator();

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-8 py-10 shadow-[var(--shadow-card)]">
        <p className="text-4xl" aria-hidden>
          📱
        </p>
        <h1 className="mt-4 text-2xl font-bold text-[var(--color-foreground)]">
          {t("mobileBlocked.title")}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-muted)]">
          {t("mobileBlocked.message")}
        </p>
      </div>
    </div>
  );
}
