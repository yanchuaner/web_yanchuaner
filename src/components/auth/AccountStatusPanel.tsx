"use client";

import {
  Ban,
  CheckCircle2,
  Clock3,
  MailWarning,
  ShieldX,
} from "lucide-react";
import { Button, ButtonLink, GlassCard } from "@/components/ui";
import type { WebAccountState } from "@/lib/web-account-state";
import { useThemeAndLocale } from "@/components/ThemeAndLocaleProvider";

type BlockedAccountState = Exclude<WebAccountState, "ACTIVE">;

type AccountSummary = {
  name?: string | null;
  graduationClass?: string | null;
  className?: string | null;
};

const STATUS_CONTENT = {
  EMAIL_NOT_VERIFIED: {
    icon: MailWarning,
    eyebrow: "auth.status.emailNotVerifiedEyebrow",
    title: "auth.status.emailNotVerifiedTitle",
    description: "auth.status.emailNotVerifiedDescription",
  },
  REVIEW_PENDING: {
    icon: Clock3,
    eyebrow: "auth.status.pendingEyebrow",
    title: "auth.status.pendingTitle",
    description: "auth.status.pendingDescription",
  },
  REVIEW_REJECTED: {
    icon: ShieldX,
    eyebrow: "auth.status.pendingEyebrow",
    title: "auth.status.rejectedTitle",
    description: "auth.status.rejectedDescription",
  },
  ACCOUNT_DISABLED: {
    icon: Ban,
    eyebrow: "auth.status.disabledEyebrow",
    title: "auth.status.disabledTitle",
    description: "auth.status.disabledDescription",
  },
} satisfies Record<BlockedAccountState, {
  icon: typeof Clock3;
  eyebrow: string;
  title: string;
  description: string;
}>;

function identityLine(account: AccountSummary | undefined, locale: "zh" | "en") {
  return [
    account?.name,
    account?.graduationClass
      ? locale === "zh"
        ? `${account.graduationClass}届`
        : `Cohort ${account.graduationClass}`
      : null,
    account?.className
      ? locale === "zh"
        ? `${account.className}班`
        : `Class ${account.className}`
      : null,
  ].filter(Boolean).join(" · ");
}

export function AccountStatusPanel({
  state,
  account,
  onSwitchAccount,
}: {
  state: BlockedAccountState;
  account?: AccountSummary;
  onSwitchAccount?: () => void;
}) {
  const { locale, t } = useThemeAndLocale();
  const content = STATUS_CONTENT[state];
  const Icon = content.icon;
  const identity = identityLine(account, locale);
  const pending = state === "REVIEW_PENDING";

  return (
    <GlassCard className="w-full p-7 sm:p-8">
      <div className="flex flex-col items-center text-center">
        <div className="relative grid h-16 w-16 place-items-center rounded-full border border-brand/25 bg-brand/10 text-brand">
          {pending ? (
            <CheckCircle2
              size={20}
              className="absolute -right-1 -top-1 rounded-full bg-surface text-accent"
              aria-hidden="true"
            />
          ) : null}
          <Icon size={30} strokeWidth={1.7} aria-hidden="true" />
        </div>

        <p className="mt-5 text-xs font-semibold text-brand">{t(content.eyebrow)}</p>
        <h1 className="mt-2 font-heading text-2xl font-bold text-brand-fg sm:text-3xl">
          {t(content.title)}
        </h1>
        <p className="mt-3 max-w-md text-sm leading-7 text-brand-fg/65">
          {t(content.description)}
        </p>

        {identity ? (
          <p className="mt-5 text-sm font-medium text-brand-fg/80">{identity}</p>
        ) : null}

        {pending ? (
          <div className="mt-6 flex w-full max-w-sm items-center justify-center gap-3 text-xs text-brand-fg/55">
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
            {t("auth.status.pendingProgress")}
          </div>
        ) : null}

        <div className="mt-7 grid w-full gap-3 sm:grid-cols-2">
          {state === "EMAIL_NOT_VERIFIED" ? (
            <ButtonLink href="/verify-email" variant="primary" className="w-full">
              {t("auth.status.verifyEmail")}
            </ButtonLink>
          ) : (
            <ButtonLink href="/" variant="primary" className="w-full">
              {t("auth.status.home")}
            </ButtonLink>
          )}
          <ButtonLink href="/contact" variant="secondary" className="w-full">
            {t("auth.status.contactAdmin")}
          </ButtonLink>
        </div>

        {onSwitchAccount ? (
          <Button
            type="button"
            variant="ghost"
            className="mt-3 w-full"
            onClick={onSwitchAccount}
          >
            {t("auth.status.switchAccount")}
          </Button>
        ) : null}
      </div>
    </GlassCard>
  );
}
