'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  MapPin, Building2, UsersRound, GraduationCap,
  ChevronDown, ChevronUp, ArrowLeft,
} from 'lucide-react';
import {
  PageShell,
  GlassCard,
  PageHeader,
  ButtonLink,
  EmptyState,
  ErrorState,
  Skeleton,
  SkeletonText,
} from '@/components/ui';
import { formatGraduationClass } from '@/lib/identity-fields';
import { useThemeAndLocale } from '@/components/ThemeAndLocaleProvider';

function StatGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-line bg-surface/30 p-5 shadow-sm">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton variant="text" className="mt-4 h-3 w-20" />
          <Skeleton variant="text" className="mt-3 h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

function MapPanelSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface/30 shadow-sm backdrop-blur-md">
      <Skeleton className="h-[360px] w-full rounded-none md:h-96" />
      <div className="flex min-h-[44px] items-center gap-2 border-t border-line bg-surface/40 px-4 py-3">
        <Skeleton variant="circle" className="h-4 w-4 shrink-0" />
        <Skeleton variant="text" className="h-3 w-full max-w-72" />
      </div>
    </div>
  );
}

function CityRankingSkeleton() {
  return (
    <div className="mt-8">
      <Skeleton variant="text" className="h-6 w-24" />
      <Skeleton variant="text" className="mt-2 h-4 w-48" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-line bg-surface/30 p-4">
            <div className="flex min-h-[44px] items-center gap-3">
              <Skeleton variant="text" className="h-4 w-5 shrink-0" />
              <SkeletonText lines={2} className="min-w-0 flex-1" />
              <Skeleton variant="text" className="h-6 w-14 shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UniversityMapSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-6" role="status" aria-label={label}>
      <StatGridSkeleton />
      <MapPanelSkeleton />
      <CityRankingSkeleton />
    </div>
  );
}

const CityMapRenderer = dynamic(() => import('@/components/CityMapRenderer'), {
  ssr: false,
  loading: () => <MapPanelSkeleton />,
});

type CityStats = {
  city: string;
  count: number;
  lat: number;
  lng: number;
  universities: string[];
  majors: string[];
  classes: string[];
  members: Array<{
    name: string;
    university: string;
    major: string;
    graduationClass: string;
  }>;
};

type StatsData = {
  totalCities: number;
  totalAlumni: number;
  totalUniversities: number;
  totalMajors: number;
  cities: CityStats[];
  uncounted: number;
};

export default function UniversityMapPage() {
  const { t, locale } = useThemeAndLocale();
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCity, setExpandedCity] = useState<string | null>(null);

  const fetchStats = useCallback(() => {
    setLoading(true);
    setError(null);
    setData(null);
    fetch('/api/alumni/city-stats')
      .then((res) => {
        if (res.status === 401) throw new Error('auth');
        if (!res.ok) throw new Error('load');
        return res.json();
      })
      .then((d) => {
        setData(d);
        setExpandedCity(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const toggleCity = (city: string) => {
    setExpandedCity((prev) => (prev === city ? null : city));
  };

  const statCards = data
    ? [
        { icon: MapPin, label: t('map.stats.cities'), value: data.totalCities },
        { icon: UsersRound, label: t('map.stats.alumni'), value: data.totalAlumni },
        { icon: Building2, label: t('map.stats.universities'), value: data.totalUniversities },
        { icon: GraduationCap, label: t('map.stats.majors'), value: data.totalMajors },
      ]
    : [];

  return (
    <PageShell size="wide">
      <GlassCard className="p-6 md:p-8">
        <PageHeader
          eyebrow="UNIVERSITY MAP"
          eyebrowIcon={MapPin}
          title={t('map.title')}
          description={t('map.description')}
          action={
            <ButtonLink href="/" variant="secondary" icon={ArrowLeft} size="sm">
              {t('common.backHome')}
            </ButtonLink>
          }
        />

        <div className="mt-8">
          {/* Loading state */}
          {loading && <UniversityMapSkeleton label={t('map.loading')} />}

          {/* Error state */}
          {error && !loading && (
            <ErrorState
              title={t('map.errorTitle')}
              description={t(error === 'auth' ? 'map.authRequired' : 'map.loadFailed')}
              onRetry={error === 'auth' ? undefined : fetchStats}
              homeHref="/"
              homeLabel={t(error === 'auth' ? 'map.verifyAction' : 'common.backHome')}
            />
          )}

          {/* Empty state */}
          {data && data.cities.length === 0 && !loading && (
            <EmptyState
              icon={MapPin}
              title={t('map.emptyTitle')}
              description={t('map.emptyDescription')}
            />
          )}

          {/* Data loaded */}
          {data && data.cities.length > 0 && (
            <>
              {/* Stats grid */}
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {statCards.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-card border border-line bg-surface/30 p-5 shadow-sm backdrop-blur-md">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 shadow-sm border border-brand/20">
                      <Icon size={20} className="text-brand" />
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-wide text-brand-fg/50">{label}</p>
                    <p className="font-heading mt-1 text-2xl font-bold text-main">{value}</p>
                  </div>
                ))}
              </div>

              {/* Map */}
              <div className="mt-6 overflow-hidden rounded-2xl border border-line shadow-sm bg-surface/30 backdrop-blur-md">
                <CityMapRenderer cities={data.cities} />
                <div className="flex min-h-[44px] items-center gap-2 border-t border-line bg-surface/40 px-4 py-3">
                  <MapPin size={14} className="shrink-0 text-brand" />
                  <p className="min-w-0 text-xs leading-5 text-brand-fg/50">
                    {t('map.cityCount').replace('{count}', String(data.cities.length))}
                  </p>
                </div>
              </div>

              {/* City ranking */}
              <div className="mt-8">
                <h2 className="font-heading text-lg font-semibold text-main">{t('map.rankingTitle')}</h2>
                <p className="mt-1 text-sm text-main/60">{t('map.rankingDescription')}</p>

                <div className="mt-4 max-h-[600px] overflow-y-auto space-y-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {data.cities.map((city, index) => (
                    <div key={city.city} className="overflow-hidden rounded-xl border border-brand/10">
                      <button
                        type="button"
                        onClick={() => toggleCity(city.city)}
                        className="flex min-h-[44px] w-full items-center gap-3 bg-surface/50 px-4 py-3.5 text-left transition hover:bg-surface-muted md:gap-4 md:px-5"
                      >
                        <span className="w-5 shrink-0 text-center text-sm font-bold text-brand/60">
                          {index + 1}
                        </span>
                        <span className="font-heading min-w-0 flex-1 truncate text-sm font-semibold text-main md:text-base">
                          {city.city}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-brand/20 bg-brand/5 px-2.5 py-0.5 text-xs font-medium text-brand shrink-0">
                          <UsersRound size={12} />
                          {city.count}
                        </span>
                        {expandedCity === city.city ? (
                          <ChevronUp size={16} className="shrink-0 text-main/60" />
                        ) : (
                          <ChevronDown size={16} className="shrink-0 text-main/60" />
                        )}
                      </button>

                      {expandedCity === city.city && (
                        <div className="border-t border-brand/5 bg-surface/30 px-3 py-3 md:px-5 md:py-4">
                          {city.members.length > 0 ? (
                            <>
                              {/* 移动端卡片布局 */}
                              <div className="space-y-2 md:hidden">
                                {city.members.map((member) => (
                                  <div
                                    key={`${member.name}-${member.graduationClass}-${member.university}-${member.major}`}
                                    className="rounded-xl border border-brand/10 bg-surface/60 p-3 text-xs space-y-1.5"
                                  >
                                    <div className="flex justify-between items-center">
                                      <span className="font-semibold text-sm text-main">{member.name}</span>
                                      <span className="text-main/60 font-semibold">{member.graduationClass ? (locale === 'zh' ? formatGraduationClass(member.graduationClass) : `${member.graduationClass.replace(/\D/g, '')} Cohort`) : t('common.notAvailable')}</span>
                                    </div>
                                    <div className="text-main/60 flex justify-between gap-2 flex-wrap">
                                      <span>{t('map.university')}: {member.university || t('common.notAvailable')}</span>
                                      <span>{t('map.major')}: {member.major || t('common.notAvailable')}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* 桌面端表格布局 */}
                              <div className="hidden md:block overflow-hidden rounded-xl border border-brand/10 bg-surface/70">
                                <div className="grid grid-cols-[1.05fr_1.25fr_1fr_0.9fr] gap-3 border-b border-brand/10 bg-brand/5 px-4 py-3 text-xs font-medium text-main/60">
                                  <span>{t('map.name')}</span>
                                  <span>{t('map.university')}</span>
                                  <span>{t('map.major')}</span>
                                  <span>{t('map.cohort')}</span>
                                </div>
                                <div className="divide-y divide-brand/5">
                                  {city.members.map((member) => (
                                    <div
                                      key={`${member.name}-${member.graduationClass}-${member.university}-${member.major}`}
                                      className="grid grid-cols-[1.05fr_1.25fr_1fr_0.9fr] gap-3 px-4 py-3 text-sm text-main/60"
                                    >
                                      <span className="font-medium text-main">{member.name}</span>
                                      <span>{member.university || t('common.notAvailable')}</span>
                                      <span>{member.major || t('common.notAvailable')}</span>
                                      <span>{member.graduationClass ? (locale === 'zh' ? formatGraduationClass(member.graduationClass) : `${member.graduationClass.replace(/\D/g, '')} Cohort`) : t('common.notAvailable')}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="rounded-xl border border-dashed border-brand/10 bg-surface/70 px-4 py-4 text-sm text-main/60">
                              {t('map.noDetails')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {data.uncounted > 0 && (
                  <p className="mt-3 text-xs text-main/60">
                    {t('map.uncounted').replace('{count}', String(data.uncounted))}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

      </GlassCard>
    </PageShell>
  );
}
