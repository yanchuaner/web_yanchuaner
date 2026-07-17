"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Feather, Send, CheckCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/apiClient";
import { PageShell, GlassCard, PageHeader, Button, ButtonLink, FormStatus } from "@/components/ui";
import { useThemeAndLocale } from "@/components/ThemeAndLocaleProvider";

export default function UserStorySubmitPage() {
  const { user, isLoading } = useAuth();
  const { t } = useThemeAndLocale();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [storyDate, setStoryDate] = useState("");

  const isAllowed = user && (user.role === 'ADMIN' || (user.role === 'ALUMNI' && user.status === 'VERIFIED'));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    if (!title.trim() || !body.trim()) {
      const message = t("me.submit.required");
      setFormError(message);
      toast.error(message);
      return;
    }

    setSubmitting(true);

    const tags = tagsInput
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title: title.trim(),
      body: body.trim(),
      author: author.trim() || undefined,
      tags,
      date: storyDate || undefined,
    };

    const { data, error } = await api.post<{ story: any }>("/api/stories", payload);

    setSubmitting(false);

    if (data?.story) {
      setSubmitted(true);
      setTitle("");
      setBody("");
      setAuthor("");
      setTagsInput("");
      setStoryDate("");
      toast.success(t("me.submit.successToast"));
    } else {
      const message = error || t("me.submit.failed");
      setFormError(message);
      toast.error(message);
    }
  }

  if (isLoading) {
    return (
      <PageShell size="narrow">
        <div className="flex items-center justify-center py-20 text-brand-fg/60">{t("common.loading")}</div>
      </PageShell>
    );
  }

  return (
    <PageShell size="narrow" className="pb-28 md:pb-32">
      <ButtonLink
        href="/me"
        variant="secondary"
        size="sm"
        className="mb-6"
      >
        <ArrowLeft size={14} />
        {t("me.submit.back")}
      </ButtonLink>

      <PageHeader
        eyebrow={t("me.submit.eyebrow")}
        eyebrowIcon={Feather}
        title={t("me.submit.title")}
        description={t("me.submit.description")}
      />

      <div className="mt-6">
        {!isAllowed ? (
          <div className="rounded-card border border-info/20 bg-info/5 backdrop-blur-xl p-7 text-center space-y-4">
            <FormStatus
              tone="info"
              title={t("me.submit.restrictedTitle")}
              description={`${t("me.submit.restrictedPrefix")} ${user?.status ? t(`me.status.${user.status.toLowerCase()}`) : t("me.status.unknown")}`}
            />
            <div className="pt-2">
              <ButtonLink href="/me" variant="primary" className="w-full sm:w-auto">
                {t("me.submit.statusAction")}
              </ButtonLink>
            </div>
          </div>
        ) : submitted ? (
          <div className="rounded-card border border-success/20 bg-success/5 backdrop-blur-xl p-8 text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success shadow-inner">
              <CheckCircle size={28} />
            </div>
            <h2 className="text-xl font-bold text-success">{t("me.submit.successTitle")}</h2>
            <p className="text-sm leading-6 text-brand-fg/70 max-w-md mx-auto">
              {t("me.submit.successDescription")}
            </p>
            <div className="pt-4 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                onClick={() => {
                  setSubmitted(false);
                  setFormError("");
                }}
                variant="primary"
                className="w-full sm:w-auto"
              >
                {t("me.submit.again")}
              </Button>
              <ButtonLink href="/me/posts" variant="secondary" className="w-full sm:w-auto">
                {t("me.submit.viewPosts")}
              </ButtonLink>
            </div>
          </div>
        ) : (
              <GlassCard className="p-7">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <div>
                  <label htmlFor="story-title" className="mb-1.5 block text-sm font-medium text-brand-fg">
                    {t("me.submit.titleLabel")}
                  </label>
                  <input
                    id="story-title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (formError) setFormError("");
                    }}
                    maxLength={120}
                    placeholder={t("me.submit.titlePlaceholder")}
                    className="input w-full text-sm"
                    disabled={submitting}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="story-author" className="mb-1.5 block text-sm font-medium text-brand-fg">
                      {t("me.submit.authorLabel")}
                    </label>
                    <input
                      id="story-author"
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      maxLength={50}
                      placeholder={user?.name || user?.username || t("me.submit.anonymous")}
                      className="input w-full text-sm"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label htmlFor="story-date" className="mb-1.5 block text-sm font-medium text-brand-fg">
                      {t("me.submit.dateLabel")}
                    </label>
                    <input
                      id="story-date"
                      type="date"
                      value={storyDate}
                      onChange={(e) => setStoryDate(e.target.value)}
                      className="input w-full text-sm"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="story-tags" className="mb-1.5 block text-sm font-medium text-brand-fg">
                    {t("me.submit.tagsLabel")}
                  </label>
                  <input
                    id="story-tags"
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder={t("me.submit.tagsPlaceholder")}
                    className="input w-full text-sm"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label htmlFor="story-body" className="mb-1.5 block text-sm font-medium text-brand-fg">
                    {t("me.submit.bodyLabel")}
                  </label>
                  <textarea
                    id="story-body"
                    required
                    rows={12}
                    value={body}
                    onChange={(e) => {
                      setBody(e.target.value);
                      if (formError) setFormError("");
                    }}
                    maxLength={20000}
                    placeholder={t("me.submit.bodyPlaceholder")}
                    className="input w-full text-sm resize-y min-h-[240px]"
                    disabled={submitting}
                  />
                </div>
              </div>

              {formError ? (
                <FormStatus tone="danger" title={t("me.submit.errorTitle")} description={formError} />
              ) : null}

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 cursor-pointer touch-manipulation"
                >
                  <Send size={15} />
                  {submitting ? t("me.submit.submitting") : t("me.submit.submitAction")}
                </Button>
              </div>
            </form>
          </GlassCard>
        )}
      </div>
    </PageShell>
  );
}
