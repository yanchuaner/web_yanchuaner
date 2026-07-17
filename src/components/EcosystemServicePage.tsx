"use client";

import {
  Bot,
  Braces,
  ExternalLink,
  Gauge,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { useThemeAndLocale } from "@/components/ThemeAndLocaleProvider";
import { Badge, ButtonLink, GlassCard, PageHeader, PageShell } from "@/components/ui";

type ServiceKind = "ai" | "api";

const SERVICE_META = {
  ai: { icon: Bot, accentIcon: Gauge },
  api: { icon: Braces, accentIcon: KeyRound },
} as const;

export default function EcosystemServicePage(props: {
  kind: ServiceKind;
  href: string;
}) {
  const { t } = useThemeAndLocale();
  const meta = SERVICE_META[props.kind];
  const AccentIcon = meta.accentIcon;
  const prefix = `services.${props.kind}`;

  return (
    <PageShell size="narrow">
      <PageHeader
        eyebrow={t(`${prefix}.eyebrow`)}
        eyebrowIcon={meta.icon}
        title={t(`${prefix}.title`)}
        description={t(`${prefix}.description`)}
      />

      <GlassCard className="mt-6 p-5 sm:p-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-main">{t(`${prefix}.panelTitle`)}</h2>
              <Badge tone="success">{t("services.preview")}</Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-main/65">
              {t(`${prefix}.panelDescription`)}
            </p>
          </div>
          <ButtonLink
            href={props.href}
            target="_blank"
            rel="noopener noreferrer"
            variant="primary"
            icon={ExternalLink}
            className="shrink-0"
          >
            {t(`${prefix}.action`)}
          </ButtonLink>
        </div>

        <div className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
          <div className="flex items-start gap-3 text-sm leading-6 text-main/70">
            <AccentIcon size={18} className="mt-1 shrink-0 text-brand" aria-hidden="true" />
            <span>{t(`${prefix}.capability`)}</span>
          </div>
          <div className="flex items-start gap-3 text-sm leading-6 text-main/70">
            <ShieldCheck size={18} className="mt-1 shrink-0 text-success" aria-hidden="true" />
            <span>{t(`${prefix}.boundary`)}</span>
          </div>
        </div>
      </GlassCard>
    </PageShell>
  );
}
