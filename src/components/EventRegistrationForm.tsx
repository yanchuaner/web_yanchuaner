"use client";

import { useState } from "react";
import { Send, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button, ButtonLink, FormStatus } from "@/components/ui";
import { useThemeAndLocale } from "@/components/ThemeAndLocaleProvider";

export default function EventRegistrationForm({
  eventId,
  registrationCount,
  maxAttendees,
  initialRegistrationStatus,
}: {
  eventId: string;
  registrationCount: number;
  maxAttendees: number | null;
  initialRegistrationStatus: string | null;
}) {
  const { t } = useThemeAndLocale();
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState(initialRegistrationStatus);
  const [cancelling, setCancelling] = useState(false);
  const [formError, setFormError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: contact.trim(), message: message.trim() }),
      });
      await res.json();
      if (!res.ok) {
        setFormError(t("eventRegistration.failed"));
        return;
      }
      setRegistrationStatus("APPROVED");
    } catch {
      setFormError(t("eventRegistration.networkError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    setFormError("");
    try {
      const response = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      if (!response.ok) {
        setFormError(t("eventRegistration.cancelFailed"));
        return;
      }
      setRegistrationStatus("CANCELLED");
    } catch {
      setFormError(t("eventRegistration.networkError"));
    } finally {
      setCancelling(false);
    }
  };

  if (registrationStatus === "APPROVED" || registrationStatus === "PENDING") {
    return (
      <div className="mt-8 rounded-2xl border border-success/20 bg-success/10 px-5 py-6 text-center">
        <CheckCircle2 size={36} className="mx-auto text-success" />
        <p className="mt-3 text-lg font-semibold text-success">{t("eventRegistration.successTitle")}</p>
        <p className="mt-1 text-sm leading-6 text-success">
          {t("eventRegistration.successDescription")}
        </p>
        {formError ? <p className="mt-3 text-sm text-danger">{formError}</p> : null}
        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/me/events" variant="secondary">
            {t("eventRegistration.myEvents")}
          </ButtonLink>
          <Button type="button" variant="danger" onClick={handleCancel} disabled={cancelling}>
            {cancelling ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
            {t(cancelling ? "eventRegistration.cancelling" : "eventRegistration.cancel")}
          </Button>
        </div>
      </div>
    );
  }

  const isFull = maxAttendees != null && registrationCount >= maxAttendees;

  return (
    <div className="mt-8 rounded-2xl border border-brand/10 bg-surface-muted p-6">
      <h3 className="font-heading text-lg font-semibold text-main">{t("eventRegistration.title")}</h3>
      {registrationStatus === "CANCELLED" ? (
        <FormStatus
          tone="success"
          title={t("eventRegistration.cancelledTitle")}
          description={t("eventRegistration.cancelledDescription")}
          className="mt-4"
        />
      ) : null}
      {registrationStatus === "REJECTED" ? (
        <FormStatus
          tone="danger"
          title={t("eventRegistration.rejectedTitle")}
          description={t("eventRegistration.rejectedDescription")}
          className="mt-4"
        />
      ) : null}
      {isFull ? (
        <FormStatus
          tone="warning"
          title={t("eventRegistration.fullTitle")}
          description={t("eventRegistration.fullDescription")}
          className="mt-4"
        />
      ) : registrationStatus !== "REJECTED" ? (
        <form className="mt-4 space-y-4" onSubmit={handleRegister}>
          <label className="block text-sm font-medium text-brand-fg">
            {t("eventRegistration.contact")}
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={t("eventRegistration.contactPlaceholder")}
              className="input mt-1 w-full"
              disabled={submitting}
            />
          </label>
          <label className="block text-sm font-medium text-brand-fg">
            {t("eventRegistration.message")}
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("eventRegistration.messagePlaceholder")}
              className="input mt-1 w-full resize-y"
              disabled={submitting}
            />
          </label>
          {formError && (
            <FormStatus tone="danger" title={t("eventRegistration.errorTitle")} description={formError} />
          )}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {submitting ? t("eventRegistration.submitting") : t("eventRegistration.submit")}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
