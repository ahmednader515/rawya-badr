import Link from "next/link";
import { getHomepageSettings } from "@/lib/db";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import { getContactCopy } from "@/lib/site-pages-content";

function normalizeWhatsappHref(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value) || /^wa\.me\//i.test(value)) {
    return value.startsWith("http") ? value : `https://${value}`;
  }
  const digits = value.replace(/[^\d+]/g, "");
  if (!digits) return null;
  const phone = digits.startsWith("+") ? digits.slice(1) : digits;
  return phone ? `https://wa.me/${phone}` : null;
}

export default async function ContactPage() {
  const [locale, t, settings] = await Promise.all([
    getLocaleFromCookie(),
    getServerTranslator(),
    getHomepageSettings().catch(() => null),
  ]);
  const platformName =
    pickLocalizedText(locale, settings?.platformName, settings?.platformNameEn) ||
    pickLocalizedText(locale, settings?.footerTitle, settings?.footerTitleEn) ||
    t("footer.defaultTitle", "Learning Platform");
  const copy = getContactCopy(locale, platformName);

  const whatsappHref =
    normalizeWhatsappHref(settings?.whatsappUrl) ||
    normalizeWhatsappHref(settings?.teamWhatsappUrl) ||
    normalizeWhatsappHref(settings?.addBalanceWhatsappNumber);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8">
        <Link href="/" className="text-sm font-medium text-[var(--color-primary)] hover:underline">
          ← {t("common.home", "Home")}
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-4xl">
          {copy.title}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-[var(--color-muted)]">{copy.intro}</p>
        <p className="mt-2 text-xs text-[var(--color-muted)]">{copy.updatedLabel}</p>
      </div>

      <div className="space-y-8 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[var(--color-foreground)]">{copy.howToTitle}</h2>
          <p className="text-sm leading-relaxed text-[var(--color-muted)] sm:text-base">{copy.howToBody}</p>

          {whatsappHref ? (
            <div className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
              <p className="text-sm font-medium text-[var(--color-foreground)]">{copy.whatsappLabel}</p>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-hover)]"
              >
                {copy.whatsappCta}
              </a>
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-[var(--color-muted)] sm:text-base">{copy.noChannel}</p>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[var(--color-foreground)]">{copy.otherTitle}</h2>
          <ul className="flex flex-col gap-2 text-sm sm:text-base">
            <li>
              <Link href="/privacy-policy" className="text-[var(--color-primary)] hover:underline">
                {copy.privacy}
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-[var(--color-primary)] hover:underline">
                {copy.terms}
              </Link>
            </li>
            <li>
              <Link href="/refund-policy" className="text-[var(--color-primary)] hover:underline">
                {copy.refund}
              </Link>
            </li>
            <li>
              <Link href="/courses" className="text-[var(--color-primary)] hover:underline">
                {copy.courses}
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
