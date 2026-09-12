import { getHomepageSettings } from "@/lib/db";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import { SiteInfoPage } from "@/components/SiteInfoPage";
import { getPrivacyPolicyCopy } from "@/lib/site-pages-content";

export default async function PrivacyPolicyPage() {
  const [locale, t, settings] = await Promise.all([
    getLocaleFromCookie(),
    getServerTranslator(),
    getHomepageSettings().catch(() => null),
  ]);
  const platformName =
    pickLocalizedText(locale, settings?.platformName, settings?.platformNameEn) ||
    pickLocalizedText(locale, settings?.footerTitle, settings?.footerTitleEn) ||
    t("footer.defaultTitle", "Learning Platform");
  const copy = getPrivacyPolicyCopy(locale, platformName);

  return (
    <SiteInfoPage
      title={copy.title}
      intro={copy.intro}
      updatedLabel={copy.updatedLabel}
      sections={copy.sections}
      backLabel={t("common.home", "Home")}
    />
  );
}
