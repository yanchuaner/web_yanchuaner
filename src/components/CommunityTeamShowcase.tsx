'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Code2, Users } from 'lucide-react';
import { cn } from '@/components/ui/cn';

type TechnicalBuilder = {
  name: string;
  contribution: string;
};

type OperationsMember = {
  name: string;
  roles: string[];
};

type OperationsCohort = {
  cohort: string;
  members: OperationsMember[];
};

const technicalBuilders: TechnicalBuilder[] = [
  { name: '詹勇弟', contribution: '协助开发与资源支持' },
  { name: '黄湘林', contribution: '核心设计与开发运维' },
  { name: '王俊', contribution: '功能完善与问题反馈' },
];

const operationsCohorts: OperationsCohort[] = [
  {
    cohort: '2025 届',
    members: [
      { name: '黄湘林', roles: ['指挥中枢'] },
      { name: '左佳维', roles: ['指挥中枢'] },
      { name: '赖盈燕', roles: ['综合运营部'] },
      { name: '朱国震', roles: ['综合运营部'] },
      { name: '吴桐', roles: ['内容创作部'] },
      { name: '杨菁', roles: ['内容创作部'] },
      { name: '张正朋', roles: ['联络对接部'] },
      { name: '张一鸣', roles: ['联络对接部'] },
    ],
  },
  {
    cohort: '2026 届',
    members: [
      { name: '郑依棠', roles: ['核心负责人', '内容创作部'] },
      { name: '刘晓婷', roles: ['综合运营部'] },
      { name: '梁小莲', roles: ['综合运营部'] },
      { name: '王疆皓', roles: ['内容创作部'] },
      { name: '朱妍', roles: ['联络对接部'] },
      { name: '王裕宁', roles: ['联络对接部'] },
    ],
  },
];

function OperationsRow({ cohort, members }: OperationsCohort) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const cohortId = `operations-${cohort.replace(/\s+/g, '-')}`;

  const updateScrollState = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    setCanScrollLeft(scroller.scrollLeft > 4);
    setCanScrollRight(
      scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 4,
    );
  }, []);

  useEffect(() => {
    updateScrollState();
    window.addEventListener('resize', updateScrollState);
    return () => window.removeEventListener('resize', updateScrollState);
  }, [updateScrollState]);

  const scroll = (direction: -1 | 1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollBy({
      left: direction * Math.max(240, scroller.clientWidth * 0.8),
      behavior: 'smooth',
    });
  };

  return (
    <section aria-labelledby={cohortId}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3
          id={cohortId}
          className="font-heading text-base font-semibold text-brand-fg"
        >
          {cohort}
        </h3>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => scroll(-1)}
            disabled={!canScrollLeft}
            aria-label={`向左浏览${cohort}运营团队`}
            title="向左浏览"
            className="inline-flex h-10 w-10 items-center justify-center rounded-btn border border-line bg-surface text-brand transition hover:border-brand/30 hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            disabled={!canScrollRight}
            aria-label={`向右浏览${cohort}运营团队`}
            title="向右浏览"
            className="inline-flex h-10 w-10 items-center justify-center rounded-btn border border-line bg-surface text-brand transition hover:border-brand/30 hover:bg-brand/10 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        onScroll={updateScrollState}
        tabIndex={0}
        aria-label={`${cohort}燕中校友汇成员，可横向滚动`}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 pr-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        {members.map((member) => (
          <article
            key={member.name}
            className="flex min-h-36 w-56 shrink-0 snap-start flex-col justify-between rounded-card border border-line bg-surface/60 p-4 shadow-sm"
          >
            <div>
              <p className="text-xs font-medium text-brand">燕中校友汇</p>
              <h4 className="font-heading mt-2 text-lg font-semibold text-brand-fg">
                {member.name}
              </h4>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {member.roles.map((role) => (
                <span
                  key={role}
                  className="rounded-full border border-brand/15 bg-brand/10 px-2.5 py-1 text-xs text-brand-fg/80"
                >
                  {role}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function CommunityTeamShowcase({ className }: { className?: string }) {
  return (
    <section id="builders" className={cn('border-y border-line py-10 md:py-12', className)}>
      <div className="flex items-start gap-3">
        <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-brand/10 text-brand">
          <Code2 size={22} aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-brand">技术共建</p>
          <h2 className="font-heading mt-1 text-2xl font-bold text-brand-fg md:text-3xl">
            共同设计与维护数字母港
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-fg/65">
            三位 2025 届校友共同参与产品设计、开发完善和长期运行维护。
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {technicalBuilders.map((builder) => (
          <article
            key={builder.name}
            className="flex min-h-44 flex-col justify-between rounded-card border border-line bg-surface/60 p-5 shadow-sm"
          >
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-card bg-brand/10 text-brand">
              <Code2 size={20} aria-hidden="true" />
            </div>
            <div className="mt-5">
              <h3 className="font-heading text-xl font-semibold text-brand-fg">
                {builder.name}
              </h3>
              <p className="mt-1 text-xs font-medium text-brand">2025 届 · 技术共建者</p>
              <p className="mt-3 text-sm leading-6 text-brand-fg/70">
                {builder.contribution}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-10 flex items-start gap-3">
        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-card bg-accent/10 text-accent">
          <Users size={20} aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-accent">运营维护</p>
          <h2 className="font-heading mt-1 text-xl font-bold text-brand-fg md:text-2xl">
            燕中校友汇运营团队
          </h2>
          <p className="mt-2 text-sm leading-6 text-brand-fg/65">
            由 2025 届与 2026 届成员共同承担内容、运营和联络工作。
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-7">
        {operationsCohorts.map((cohort) => (
          <OperationsRow key={cohort.cohort} {...cohort} />
        ))}
      </div>
    </section>
  );
}
