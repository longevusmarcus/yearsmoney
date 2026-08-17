import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { dictionary } from "@/i18n/dictionary";

type Section = { h: string; p: string[]; li: string[] };

/**
 * Renders Terms / Privacy from the dictionary, so both languages share one layout.
 * The trailing contact section carries the mail link, which is why it is handled
 * separately from the generic body sections.
 */
export function LegalDocument({ doc }: { doc: "terms" | "privacy" }) {
  const { t, lang } = useI18n();
  const content = dictionary[lang].legal[doc];
  const sections = content.sections as Section[];

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("legal.backHome")}
        </Link>

        <h1 className="mb-8 font-display text-3xl text-foreground">{content.title}</h1>

        <div className="prose prose-sm max-w-none space-y-6 text-muted-foreground">
          {sections.map((section, i) => (
            <section key={section.h}>
              <h2 className="mb-3 text-xl font-medium text-foreground">{section.h}</h2>
              {section.p.map((para) => (
                <p key={para}>{para}</p>
              ))}
              {section.li.length > 0 && (
                <ul className="list-disc space-y-2 pl-6">
                  {section.li.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {/* Last section is the contact block */}
              {i === sections.length - 1 && (
                <p>
                  {t("legal.contactAt")}{" "}
                  <a href="mailto:hello@years.money" className="text-primary hover:underline">
                    hello@years.money
                  </a>
                </p>
              )}
            </section>
          ))}

          <p className="border-t border-border pt-6 text-sm text-muted-foreground/70">
            {t("legal.lastUpdated")} {new Date().toLocaleDateString(t("common.locale"))}
          </p>
        </div>
      </div>
    </div>
  );
}

export default LegalDocument;
