'use client';

import React from 'react';
import { cn } from './cn';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface ResponsiveTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function ResponsiveTabs({
  tabs,
  activeTab,
  onChange,
  className,
}: ResponsiveTabsProps) {
  return (
    <div className={cn("relative w-full border-b border-line", className)}>
      {/* Scrollable Container */}
      <div className="overflow-x-auto whitespace-nowrap scrollbar-none -webkit-overflow-scrolling-touch">
        <div className="inline-flex gap-2 pb-px min-w-full">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChange(tab.id)}
                className={cn(
                  "relative flex min-h-[44px] items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all duration-150 active:scale-[0.97] disabled:active:scale-100 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-muted",
                  isActive
                    ? "text-brand font-semibold"
                    : "text-brand-fg/60 hover:text-brand"
                )}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold transition-colors leading-none",
                      isActive
                        ? "bg-brand/20 text-brand"
                        : "bg-surface-muted text-brand-fg/40 group-hover:text-brand-fg/60"
                    )}
                  >
                    {tab.count}
                  </span>
                )}
                {/* Active Indicator Underline */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      {/* Edge shadow indications */}
      <div className="pointer-events-none absolute bottom-0 left-0 top-0 w-6 bg-gradient-to-r from-surface-muted to-transparent opacity-50" />
      <div className="pointer-events-none absolute bottom-0 right-0 top-0 w-6 bg-gradient-to-l from-surface-muted to-transparent opacity-50" />
    </div>
  );
}
