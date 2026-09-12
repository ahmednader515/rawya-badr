import Link from "next/link";
import { getServerTranslator } from "@/lib/i18n/server";

export async function Footer({
  footerTitle,
  footerTagline,
  footerCopyright,
}: {
  footerTitle?: string;
  footerTagline?: string;
  footerCopyright?: string;
}) {
  const t = await getServerTranslator();
  const defaultTitle = t("footer.defaultTitle", "منصتي التعليمية");
  const defaultTagline = t("footer.defaultTagline", "تعلم بأسلوب حديث ومنهجية واضحة");
  const defaultCopyright = t("footer.defaultCopyright", "منصتي التعليمية. جميع الحقوق محفوظة.");
  const year = new Date().getFullYear();
  const copyrightText = footerCopyright?.trim() || defaultCopyright;

  const links = [
    { href: "/", label: t("common.home", "Home") },
    { href: "/courses", label: t("common.courses", "Courses") },
    { href: "/privacy-policy", label: t("footer.privacyPolicy", "Privacy Policy") },
    { href: "/terms", label: t("footer.terms", "Terms and Conditions") },
    { href: "/refund-policy", label: t("footer.refundPolicy", "Refund Policy") },
    { href: "/contact", label: t("footer.contact", "Contact") },
  ];

  return (
    <footer className="footer-black border-t border-neutral-800 bg-black mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-white">
              {footerTitle?.trim() || defaultTitle}
            </p>
            <p className="mt-1 text-sm text-neutral-400">
              {footerTagline?.trim() || defaultTagline}
            </p>
          </div>
          <nav
            aria-label={t("footer.linksLabel", "Footer links")}
            className="flex max-w-xl flex-wrap gap-x-6 gap-y-3"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-neutral-400 transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-8 border-t border-neutral-800 pt-8 text-center text-sm text-neutral-500">
          © {year} {copyrightText}
        </p>
      </div>
    </footer>
  );
}
