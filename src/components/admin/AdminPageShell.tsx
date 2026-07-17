"use client";

import { useAdminLocalize } from "./AdminLocalizedText";

/**
 * Shared admin page frame. It localizes the legacy page title contract while
 * server pages continue to pass serializable data and server-rendered children.
 */
export function AdminPageShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const localize = useAdminLocalize();
  const localizedTitle = localize(title) || title;
  const localizedDescription = localize(description);

  return (
    <div className="min-w-0 max-w-full">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-bold text-brand-fg">{localizedTitle}</h1>
          {localizedDescription ? (
            <p className="mt-1 text-sm text-brand-fg/60">{localizedDescription}</p>
          ) : null}
        </div>
        {actions ? <div className="flex max-w-full flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
