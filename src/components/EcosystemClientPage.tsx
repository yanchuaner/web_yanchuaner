"use client";

import {
  Archive,
  Bot,
  BookOpenText,
  Braces,
  CakeSlice,
  CalendarHeart,
  CircleCheck,
  Cpu,
  ExternalLink,
  GraduationCap,
  HeartHandshake,
  Landmark,
  LockKeyhole,
  Mail,
  MapPinned,
  MessagesSquare,
  Network,
  Orbit,
  ShieldCheck,
  UsersRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import CelestialSphere from "@/components/CelestialSphere";
import { useThemeAndLocale } from "@/components/ThemeAndLocaleProvider";
import { ButtonLink, PageShell, RevealSection, SectionIntro } from "@/components/ui";

type ContentItem = {
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
};

type ExtensionNode = ContentItem & {
  domainKey: string;
  statusKey: string;
};

const NETWORK_NODES: ContentItem[] = [
  { icon: Landmark, titleKey: "ecosystem.nodes.schoolTitle", descriptionKey: "ecosystem.nodes.schoolDescription" },
  { icon: UsersRound, titleKey: "ecosystem.nodes.alumniTitle", descriptionKey: "ecosystem.nodes.alumniDescription" },
  { icon: Archive, titleKey: "ecosystem.nodes.memoryTitle", descriptionKey: "ecosystem.nodes.memoryDescription" },
  { icon: HeartHandshake, titleKey: "ecosystem.nodes.governanceTitle", descriptionKey: "ecosystem.nodes.governanceDescription" },
];

const CAPABILITIES: ContentItem[] = [
  { icon: MapPinned, titleKey: "ecosystem.capabilities.mapTitle", descriptionKey: "ecosystem.capabilities.mapDescription" },
  { icon: BookOpenText, titleKey: "ecosystem.capabilities.contentTitle", descriptionKey: "ecosystem.capabilities.contentDescription" },
  { icon: CalendarHeart, titleKey: "ecosystem.capabilities.eventsTitle", descriptionKey: "ecosystem.capabilities.eventsDescription" },
  { icon: GraduationCap, titleKey: "ecosystem.capabilities.supportTitle", descriptionKey: "ecosystem.capabilities.supportDescription" },
  { icon: Wrench, titleKey: "ecosystem.capabilities.correctionTitle", descriptionKey: "ecosystem.capabilities.correctionDescription" },
  { icon: Network, titleKey: "ecosystem.capabilities.buildTitle", descriptionKey: "ecosystem.capabilities.buildDescription" },
];

const ACCESS_LEVELS: ContentItem[] = [
  { icon: Orbit, titleKey: "ecosystem.access.publicTitle", descriptionKey: "ecosystem.access.publicDescription" },
  { icon: LockKeyhole, titleKey: "ecosystem.access.verifiedTitle", descriptionKey: "ecosystem.access.verifiedDescription" },
  { icon: ShieldCheck, titleKey: "ecosystem.access.stewardsTitle", descriptionKey: "ecosystem.access.stewardsDescription" },
];

const EXTENSION_NODES: ExtensionNode[] = [
  { icon: Bot, titleKey: "ecosystem.extensions.aiTitle", domainKey: "ecosystem.extensions.aiDomain", descriptionKey: "ecosystem.extensions.aiDescription", statusKey: "ecosystem.extensions.planned" },
  { icon: Cpu, titleKey: "ecosystem.extensions.techTitle", domainKey: "ecosystem.extensions.techDomain", descriptionKey: "ecosystem.extensions.techDescription", statusKey: "ecosystem.extensions.prefixPending" },
  { icon: MessagesSquare, titleKey: "ecosystem.extensions.forumTitle", domainKey: "ecosystem.extensions.forumDomain", descriptionKey: "ecosystem.extensions.forumDescription", statusKey: "ecosystem.extensions.prefixPending" },
  { icon: Braces, titleKey: "ecosystem.extensions.apiTitle", domainKey: "ecosystem.extensions.apiDomain", descriptionKey: "ecosystem.extensions.apiDescription", statusKey: "ecosystem.extensions.planned" },
  { icon: CakeSlice, titleKey: "ecosystem.extensions.birthdayTitle", domainKey: "ecosystem.extensions.birthdayDomain", descriptionKey: "ecosystem.extensions.birthdayDescription", statusKey: "ecosystem.extensions.planned" },
];

function ItemGrid({ items, columns = "four" }: { items: ContentItem[]; columns?: "three" | "four" }) {
  const { t } = useThemeAndLocale();
  return (
    <div className={`grid border-y border-line ${columns === "three" ? "md:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
      {items.map(({ icon: Icon, titleKey, descriptionKey }) => (
        <article key={titleKey} className="min-w-0 px-1 py-6 sm:px-5 sm:[&:not(:nth-child(2n+1))]:border-l sm:[&:nth-child(n+3)]:border-t sm:[&:nth-child(n+3)]:border-line lg:border-t-0 lg:[&:not(:first-child)]:border-l lg:[&:not(:first-child)]:border-line">
          <Icon size={22} className="text-brand" aria-hidden="true" />
          <h3 className="mt-4 font-heading text-base font-semibold text-main">{t(titleKey)}</h3>
          <p className="mt-2 text-sm leading-6 text-main/60">{t(descriptionKey)}</p>
        </article>
      ))}
    </div>
  );
}

export default function EcosystemClientPage() {
  const { t } = useThemeAndLocale();

  return (
    <PageShell className="pb-20 pt-8 md:pt-12">
      <header className="grid items-center gap-4 border-b border-line pb-6 lg:min-h-[min(680px,calc(100vh-7rem))] lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8 lg:pb-12">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase text-brand">
            <Network size={15} aria-hidden="true" />
            {t("ecosystem.heroEyebrow")}
          </p>
          <h1 className="mt-4 font-heading text-4xl font-extrabold leading-tight text-main md:text-6xl">
            {t("ecosystem.title")}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-main/70 md:text-lg">
            {t("ecosystem.description")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/register" variant="primary">{t("ecosystem.joinAction")}</ButtonLink>
            <ButtonLink href="/" variant="secondary">{t("ecosystem.homeAction")}</ButtonLink>
          </div>
        </div>
        <div className="mx-auto flex w-36 justify-center sm:w-auto lg:mx-0 lg:justify-end">
          <CelestialSphere size={340} interactive variant="ambient" />
        </div>
      </header>

      <RevealSection className="py-10 md:py-20">
        <section aria-labelledby="ecosystem-network-title">
          <SectionIntro
            eyebrow={t("ecosystem.networkEyebrow")}
            icon={Orbit}
            title={t("ecosystem.networkTitle")}
            titleId="ecosystem-network-title"
            description={t("ecosystem.networkDescription")}
          />
          <ItemGrid items={NETWORK_NODES} />
        </section>
      </RevealSection>

      <RevealSection className="pb-16 md:pb-20">
        <section aria-labelledby="ecosystem-capabilities-title">
          <SectionIntro
            eyebrow={t("ecosystem.capabilitiesEyebrow")}
            icon={Wrench}
            title={t("ecosystem.capabilitiesTitle")}
            titleId="ecosystem-capabilities-title"
            description={t("ecosystem.capabilitiesDescription")}
          />
          <div className="mt-8 grid gap-x-8 gap-y-0 border-y border-line md:grid-cols-2">
            {CAPABILITIES.map(({ icon: Icon, titleKey, descriptionKey }) => (
              <article key={titleKey} className="flex gap-4 border-b border-line py-6 last:border-b-0 md:[&:nth-last-child(-n+2)]:border-b-0">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-btn bg-brand/10 text-brand">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-heading text-base font-semibold text-main">{t(titleKey)}</h3>
                  <p className="mt-2 text-sm leading-6 text-main/60">{t(descriptionKey)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </RevealSection>

      <RevealSection className="pb-16 md:pb-20">
        <section aria-labelledby="ecosystem-access-title">
          <SectionIntro
            eyebrow={t("ecosystem.accessEyebrow")}
            icon={ShieldCheck}
            title={t("ecosystem.accessTitle")}
            titleId="ecosystem-access-title"
            description={t("ecosystem.accessDescription")}
          />
          <ItemGrid items={ACCESS_LEVELS} columns="three" />
        </section>
      </RevealSection>

      <RevealSection className="pb-16 md:pb-20">
        <section className="grid gap-10 border-y border-line py-10 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:py-12" aria-labelledby="ecosystem-governance-title">
          <SectionIntro
            eyebrow={t("ecosystem.governanceEyebrow")}
            icon={HeartHandshake}
            title={t("ecosystem.governanceTitle")}
            titleId="ecosystem-governance-title"
            description={t("ecosystem.governanceDescription")}
          />
          <ul className="space-y-5">
            {["nonprofit", "privacy", "accuracy", "participation"].map((key) => (
              <li key={key} className="flex gap-3 text-sm leading-7 text-main/65">
                <CircleCheck size={19} className="mt-1 shrink-0 text-success" aria-hidden="true" />
                <span><strong className="font-semibold text-main">{t(`ecosystem.governance.${key}Title`)}</strong> {t(`ecosystem.governance.${key}Description`)}</span>
              </li>
            ))}
          </ul>
        </section>
      </RevealSection>

      <RevealSection className="pb-16 md:pb-20">
        <section aria-labelledby="ecosystem-extensions-title">
          <SectionIntro
            eyebrow={t("ecosystem.extensionsEyebrow")}
            icon={Network}
            title={t("ecosystem.extensionsTitle")}
            titleId="ecosystem-extensions-title"
            description={t("ecosystem.extensionsDescription")}
          />
          <div className="grid border-y border-line md:grid-cols-2">
            {EXTENSION_NODES.map(({ icon: Icon, titleKey, domainKey, descriptionKey, statusKey }) => (
              <article key={titleKey} className="min-w-0 border-b border-line px-1 py-6 sm:px-5 md:[&:nth-child(odd)]:border-r md:[&:nth-last-child(-n+2)]:border-b-0 md:last:border-b-0">
                <div className="flex items-start justify-between gap-4">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-btn bg-brand/10 text-brand">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="rounded-full border border-line px-2.5 py-1 text-xs font-medium text-main/55">
                    {t(statusKey)}
                  </span>
                </div>
                <h3 className="mt-4 font-heading text-base font-semibold text-main">{t(titleKey)}</h3>
                <p className="mt-1 font-mono text-xs text-brand">{t(domainKey)}</p>
                <p className="mt-3 text-sm leading-6 text-main/60">{t(descriptionKey)}</p>
              </article>
            ))}
          </div>
          <p className="mt-4 text-sm leading-7 text-main/55">{t("ecosystem.extensionsNote")}</p>
        </section>
      </RevealSection>

      <RevealSection>
        <section className="grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_auto]" aria-labelledby="ecosystem-next-title">
          <div>
            <p className="text-xs font-semibold uppercase text-brand">{t("ecosystem.nextEyebrow")}</p>
            <h2 id="ecosystem-next-title" className="mt-2 font-heading text-2xl font-bold text-main md:text-3xl">{t("ecosystem.nextTitle")}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-main/65 md:text-base">{t("ecosystem.nextDescription")}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
            <a href="https://github.com/yanchuaner/web_yanchuaner" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-btn border border-brand/40 bg-surface px-5 py-2.5 text-sm font-semibold text-brand transition-all hover:-translate-y-0.5 hover:bg-brand/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand">
              <ExternalLink size={16} aria-hidden="true" />
              {t("ecosystem.sourceAction")}
            </a>
            <ButtonLink href="/contact" variant="ghost" icon={Mail}>{t("ecosystem.contactAction")}</ButtonLink>
          </div>
        </section>
      </RevealSection>
    </PageShell>
  );
}
