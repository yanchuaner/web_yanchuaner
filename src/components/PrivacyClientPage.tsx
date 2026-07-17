"use client";

import {
  BadgeInfo,
  BookOpenCheck,
  Database,
  FileCheck2,
  IdCard,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRoundCheck,
  type LucideIcon,
} from "lucide-react";
import { useThemeAndLocale } from "@/components/ThemeAndLocaleProvider";
import { ButtonLink, PageShell, RevealSection, SectionIntro } from "@/components/ui";

type PolicySection = {
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
};

const POLICY_SECTIONS: PolicySection[] = [
  { icon: BadgeInfo, titleKey: "privacy.sections.identityTitle", descriptionKey: "privacy.sections.identityDescription" },
  { icon: Database, titleKey: "privacy.sections.dataTitle", descriptionKey: "privacy.sections.dataDescription" },
  { icon: LockKeyhole, titleKey: "privacy.sections.accessTitle", descriptionKey: "privacy.sections.accessDescription" },
  { icon: IdCard, titleKey: "privacy.sections.cardTitle", descriptionKey: "privacy.sections.cardDescription" },
  { icon: BookOpenCheck, titleKey: "privacy.sections.contentTitle", descriptionKey: "privacy.sections.contentDescription" },
  { icon: UserRoundCheck, titleKey: "privacy.sections.rightsTitle", descriptionKey: "privacy.sections.rightsDescription" },
];

export default function PrivacyClientPage() {
  const { t } = useThemeAndLocale();

  return (
    <PageShell className="pb-20">
      <header className="border-b border-line py-8 md:py-14">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase text-brand">
          <ShieldCheck size={16} aria-hidden="true" />
          {t("privacy.eyebrow")}
        </p>
        <h1 className="mt-4 max-w-4xl break-words font-heading text-3xl font-extrabold leading-tight text-main sm:text-4xl md:text-5xl">
          {t("privacy.title")}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-main/70">
          {t("privacy.description")}
        </p>
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-main/50">
          <FileCheck2 size={16} className="text-brand" aria-hidden="true" />
          {t("privacy.updated")}
        </p>
      </header>

      <RevealSection className="py-12 md:py-16">
        <section aria-labelledby="privacy-scope-title">
          <SectionIntro
            eyebrow={t("privacy.scopeEyebrow")}
            icon={ShieldCheck}
            title={t("privacy.scopeTitle")}
            titleId="privacy-scope-title"
            description={t("privacy.scopeDescription")}
          />
          <div className="mt-8 grid border-y border-line md:grid-cols-2">
            {POLICY_SECTIONS.map(({ icon: Icon, titleKey, descriptionKey }) => (
              <article key={titleKey} className="flex gap-4 border-b border-line py-6 md:px-6 md:[&:nth-child(odd)]:border-r md:[&:nth-last-child(-n+2)]:border-b-0 md:[&:nth-child(odd)]:pl-0">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-btn bg-brand/10 text-brand">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-heading text-base font-semibold text-main">{t(titleKey)}</h2>
                  <p className="mt-2 text-sm leading-7 text-main/60">{t(descriptionKey)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </RevealSection>

      <RevealSection>
        <section className="flex flex-col items-start justify-between gap-6 border-t border-line pt-10 md:flex-row md:items-center" aria-labelledby="privacy-contact-title">
          <div className="max-w-3xl">
            <h2 id="privacy-contact-title" className="font-heading text-2xl font-bold text-main">{t("privacy.contactTitle")}</h2>
            <p className="mt-3 text-sm leading-7 text-main/65 md:text-base">{t("privacy.contactDescription")}</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <ButtonLink href="/contact" variant="primary" icon={Mail}>{t("privacy.contactAction")}</ButtonLink>
            <ButtonLink href="/" variant="secondary">{t("privacy.homeAction")}</ButtonLink>
          </div>
        </section>
      </RevealSection>
    </PageShell>
  );
}
