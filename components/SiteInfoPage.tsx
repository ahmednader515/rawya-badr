import Link from "next/link";

export type SiteInfoSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export function SiteInfoPage({
  title,
  intro,
  sections,
  updatedLabel,
  backHref = "/",
  backLabel,
}: {
  title: string;
  intro?: string;
  sections: SiteInfoSection[];
  updatedLabel?: string;
  backHref?: string;
  backLabel: string;
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8">
        <Link
          href={backHref}
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          ← {backLabel}
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-4xl">
          {title}
        </h1>
        {intro ? (
          <p className="mt-3 text-base leading-relaxed text-[var(--color-muted)]">{intro}</p>
        ) : null}
        {updatedLabel ? (
          <p className="mt-2 text-xs text-[var(--color-muted)]">{updatedLabel}</p>
        ) : null}
      </div>

      <div className="space-y-8 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8">
        {sections.map((section) => (
          <section key={section.heading} className="space-y-3">
            <h2 className="text-xl font-semibold text-[var(--color-foreground)]">
              {section.heading}
            </h2>
            {section.paragraphs.map((p, i) => (
              <p
                key={`${section.heading}-${i}`}
                className="text-sm leading-relaxed text-[var(--color-muted)] sm:text-base"
              >
                {p}
              </p>
            ))}
            {section.bullets && section.bullets.length > 0 ? (
              <ul className="list-disc space-y-2 ps-5 text-sm leading-relaxed text-[var(--color-muted)] sm:text-base">
                {section.bullets.map((item, i) => (
                  <li key={`${section.heading}-b-${i}`}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </main>
  );
}
