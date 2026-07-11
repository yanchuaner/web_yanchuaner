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

type BlockedAccountState = Exclude<WebAccountState, "ACTIVE">;

type AccountSummary = {
  name?: string | null;
  graduationClass?: string | null;
  className?: string | null;
};

const STATUS_CONTENT = {
  EMAIL_NOT_VERIFIED: {
    icon: MailWarning,
    eyebrow: "第一步尚未完成",
    title: "请先验证邮箱",
    description: "验证邮件中的链接用于确认邮箱归属。完成后，身份资料才会进入管理员审核流程。",
  },
  REVIEW_PENDING: {
    icon: Clock3,
    eyebrow: "邮箱已验证",
    title: "身份资料审核中",
    description: "你的申请已经进入管理员审核队列。审核通过后，即可登录并使用校友空间。",
  },
  REVIEW_REJECTED: {
    icon: ShieldX,
    eyebrow: "邮箱已验证",
    title: "身份资料需要核对",
    description: "本次身份审核暂未通过。请联系管理员核对姓名、届别和班级等申请资料。",
  },
  ACCOUNT_DISABLED: {
    icon: Ban,
    eyebrow: "账号状态异常",
    title: "账号当前不可用",
    description: "该账号已被停用，暂时无法登录。如需恢复使用，请联系管理员处理。",
  },
} satisfies Record<BlockedAccountState, {
  icon: typeof Clock3;
  eyebrow: string;
  title: string;
  description: string;
}>;

function identityLine(account?: AccountSummary) {
  return [
    account?.name,
    account?.graduationClass ? `${account.graduationClass}届` : null,
    account?.className ? `${account.className}班` : null,
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
  const content = STATUS_CONTENT[state];
  const Icon = content.icon;
  const identity = identityLine(account);
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

        <p className="mt-5 text-xs font-semibold text-brand">{content.eyebrow}</p>
        <h1 className="mt-2 font-heading text-2xl font-bold text-brand-fg sm:text-3xl">
          {content.title}
        </h1>
        <p className="mt-3 max-w-md text-sm leading-7 text-brand-fg/65">
          {content.description}
        </p>

        {identity ? (
          <p className="mt-5 text-sm font-medium text-brand-fg/80">{identity}</p>
        ) : null}

        {pending ? (
          <div className="mt-6 flex w-full max-w-sm items-center justify-center gap-3 text-xs text-brand-fg/55">
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
            当前进度：等待管理员审核
          </div>
        ) : null}

        <div className="mt-7 grid w-full gap-3 sm:grid-cols-2">
          {state === "EMAIL_NOT_VERIFIED" ? (
            <ButtonLink href="/verify-email" variant="primary" className="w-full">
              验证或重发邮件
            </ButtonLink>
          ) : (
            <ButtonLink href="/" variant="primary" className="w-full">
              返回首页
            </ButtonLink>
          )}
          <ButtonLink href="/contact" variant="secondary" className="w-full">
            联系管理员
          </ButtonLink>
        </div>

        {onSwitchAccount ? (
          <Button
            type="button"
            variant="ghost"
            className="mt-3 w-full"
            onClick={onSwitchAccount}
          >
            使用其他账号
          </Button>
        ) : null}
      </div>
    </GlassCard>
  );
}
