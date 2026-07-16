"use client";

import { useState } from "react";
import { CalendarCheck, Loader2, MapPin, XCircle } from "lucide-react";
import { toast } from "sonner";
import { LocalizedDate } from "@/components/LocalizedDate";
import { useThemeAndLocale } from "@/components/ThemeAndLocaleProvider";
import {
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  GlassCard,
  PageHeader,
  PageShell,
} from "@/components/ui";

type RegistrationItem = {
  id: string;
  status: string;
  createdAt: string;
  event: {
    id: string;
    title: string;
    summary: string | null;
    location: string | null;
    eventDate: string;
    endDate: string | null;
  };
};

function statusTone(status: string) {
  if (status === "APPROVED") return "success" as const;
  if (status === "PENDING") return "warning" as const;
  if (status === "REJECTED") return "danger" as const;
  return "neutral" as const;
}

export function MyEventRegistrationsClient({
  initialItems,
}: {
  initialItems: RegistrationItem[];
}) {
  const { t } = useThemeAndLocale();
  const [items, setItems] = useState(initialItems);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  async function cancel(item: RegistrationItem) {
    setCancellingId(item.id);
    try {
      const response = await fetch(`/api/events/${item.event.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(t("me.events.cancelFailed"));
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, status: "CANCELLED" } : entry,
        ),
      );
      toast.success(t("me.events.cancelled"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("me.events.cancelFailed"),
      );
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <PageShell size="narrow">
      <PageHeader
        eyebrow={t("me.events.eyebrow")}
        eyebrowIcon={CalendarCheck}
        title={t("me.events.title")}
        description={t("me.events.description")}
        action={
          <ButtonLink href="/me" variant="secondary">
            {t("me.events.back")}
          </ButtonLink>
        }
      />

      <div className="mt-6 space-y-4">
        {items.length === 0 ? (
          <GlassCard className="p-6">
            <EmptyState
              icon={CalendarCheck}
              title={t("me.events.emptyTitle")}
              description={t("me.events.emptyDescription")}
              action={
                <ButtonLink href="/events" variant="primary">
                  {t("me.events.browse")}
                </ButtonLink>
              }
            />
          </GlassCard>
        ) : (
          items.map((item) => {
            const active = item.status === "APPROVED" || item.status === "PENDING";
            const future = new Date(item.event.eventDate).getTime() > Date.now();
            return (
              <GlassCard key={item.id} className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={statusTone(item.status)}>
                        {t(`me.events.status.${item.status}`)}
                      </Badge>
                      <span className="text-xs text-brand-fg/45">
                        {t("me.events.registeredAt")} {" "}
                        <LocalizedDate value={item.createdAt} style="date" />
                      </span>
                    </div>
                    <h2 className="mt-3 font-heading text-lg font-semibold text-brand-fg">
                      {item.event.title}
                    </h2>
                    {item.event.summary ? (
                      <p className="mt-2 text-sm leading-6 text-brand-fg/60">
                        {item.event.summary}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-brand-fg/55">
                      <span className="inline-flex items-center gap-2">
                        <CalendarCheck size={15} className="text-brand" />
                        <LocalizedDate value={item.event.eventDate} style="event" />
                      </span>
                      {item.event.location ? (
                        <span className="inline-flex items-center gap-2">
                          <MapPin size={15} className="text-brand" />
                          {item.event.location}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <ButtonLink href={`/events/${item.event.id}`} variant="secondary" size="sm">
                      {t("me.events.details")}
                    </ButtonLink>
                    {active && future ? (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => cancel(item)}
                        disabled={cancellingId === item.id}
                      >
                        {cancellingId === item.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <XCircle size={14} />
                        )}
                        {t("me.events.cancel")}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </GlassCard>
            );
          })
        )}
      </div>
    </PageShell>
  );
}
