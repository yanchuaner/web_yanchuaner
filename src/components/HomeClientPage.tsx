"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  CalendarDays,
  Lock,
  MessageSquareText,
  Network,
  Newspaper,
  RadioTower,
  Rocket,
  UserRoundSearch,
} from "lucide-react";
import {
  ButtonLink,
  ChannelTV,
  RevealSection,
  SectionIntro,
} from "@/components/ui";
import AlumniSignalField from "@/components/AlumniSignalField";
import CelestialEntrance from "@/components/CelestialEntrance";
import CelestialSphere from "@/components/CelestialSphere";
import CosmicBackground from "@/components/CosmicBackground";
import MessageOrbit from "@/components/MessageOrbit";
import { useThemeAndLocale } from "@/components/ThemeAndLocaleProvider";

interface HomeClientPageProps {
  isLoggedIn: boolean;
  canViewPrivate: boolean;
  dashboardStats: {
    alumniCount: number;
    cityCount: number;
    storyCount: number;
  };
  latestUpdates: React.ReactNode;
}

const HOME_PATHS = [
  {
    href: "/alumni/radar",
    icon: UserRoundSearch,
    titleKey: "home.pathAlumniTitle",
    descriptionKey: "home.pathAlumniDescription",
  },
  {
    href: "/alumni/stories",
    icon: BookOpenText,
    titleKey: "home.pathStoriesTitle",
    descriptionKey: "home.pathStoriesDescription",
  },
  {
    href: "/ecosystem",
    icon: Network,
    titleKey: "home.pathEcosystemTitle",
    descriptionKey: "home.pathEcosystemDescription",
  },
] as const;

export default function HomeClientPage({
  isLoggedIn,
  canViewPrivate,
  dashboardStats,
  latestUpdates,
}: HomeClientPageProps) {
  const { t } = useThemeAndLocale();
  const [introVisible, setIntroVisible] = useState(false);
  const [homeRevealed, setHomeRevealed] = useState(true);
  const [effectsActive, setEffectsActive] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("yz-intro-seen") === "1";
    } catch {
      // Storage can be unavailable in hardened privacy modes.
    }
    if (!seen) {
      setIntroVisible(true);
      setHomeRevealed(false);
    } else {
      setEffectsActive(true);
    }
  }, []);

  const revealHome = useCallback(() => {
    setHomeRevealed(true);
    setEffectsActive(true);
  }, []);
  const completeIntro = useCallback(() => {
    setHomeRevealed(true);
    setIntroVisible(false);
  }, []);

  return (
    <>
      {introVisible ? (
        <CelestialEntrance onReveal={revealHome} onComplete={completeIntro} />
      ) : null}

      <section
        id="top"
        className={`relative min-h-screen overflow-hidden bg-app transition-opacity duration-1000 ${
          homeRevealed ? "opacity-100" : "opacity-0"
        }`}
      >
        {effectsActive ? (
          <>
            <CosmicBackground />
            <MessageOrbit />
            <div className="home-atmo-layer" aria-hidden="true">
              <div className="home-breath-stars home-breath-stars-a" />
              <div className="home-breath-stars home-breath-stars-b" />
              <div className="home-breath-stars home-breath-stars-c" />
            </div>
            <div className="home-memory-whispers" aria-hidden="true">
              <span className="home-memory-whisper home-memory-whisper-a">{t("home.whisperClassmates")}</span>
              <span className="home-memory-whisper home-memory-whisper-b">{t("home.whisperYouth")}</span>
              <span className="home-memory-whisper home-memory-whisper-c">{t("home.whisperReturn")}</span>
            </div>
          </>
        ) : null}

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 py-10 md:gap-20 md:px-8 md:py-16">
          <header className="relative mt-4 flex flex-col items-center justify-between gap-6 animate-fade-in-up md:mt-8 md:flex-row md:gap-10">
            <div className="flex flex-1 flex-col items-center gap-5 text-center md:items-start md:text-left">
              <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-4 py-2 text-sm font-medium text-brand shadow-sm backdrop-blur-sm">
                <Rocket size={18} aria-hidden="true" />
                {t("nav.brand")}
              </p>
              <h1 className="whitespace-pre-line font-heritage text-3xl font-bold leading-tight text-main md:text-5xl lg:text-6xl">
                {t("home.heroTitle")}
              </h1>
              <p className="max-w-xl text-base leading-7 text-main/70 md:text-lg">
                {t("home.heroTagline")}
              </p>

              <div className="mt-2 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                {!isLoggedIn ? (
                  <ButtonLink href="/register" variant="primary">
                    {t("home.ctaJoin")}
                  </ButtonLink>
                ) : null}
                <ButtonLink href="/alumni/radar" variant={isLoggedIn ? "primary" : "secondary"}>
                  {t("home.ctaDirectory")}
                </ButtonLink>
              </div>

            </div>

            <div className={`flex w-48 shrink-0 items-center justify-center transition-opacity duration-700 md:w-[360px] ${homeRevealed && effectsActive ? "opacity-100" : "opacity-0"}`}>
              {effectsActive ? <CelestialSphere size={360} interactive variant="hero" /> : null}
            </div>
          </header>

          <RevealSection>
            <section aria-labelledby="home-paths-title">
              <SectionIntro
                eyebrow={t("home.pathsEyebrow")}
                icon={Network}
                title={t("home.pathsTitle")}
                titleId="home-paths-title"
                description={t("home.pathsDescription")}
              />
              <div className="mt-8 grid border-y border-line md:grid-cols-3">
                {HOME_PATHS.map(({ href, icon: Icon, titleKey, descriptionKey }) => (
                  <Link
                    key={href}
                    href={href}
                    className="group flex min-w-0 flex-col px-1 py-6 transition-colors hover:bg-brand/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand md:px-6 md:first:pl-0 md:last:pr-0 md:[&:not(:first-child)]:border-l md:[&:not(:first-child)]:border-line"
                  >
                    <Icon size={24} className="text-brand" aria-hidden="true" />
                    <h3 className="mt-4 font-heading text-lg font-semibold text-main">{t(titleKey)}</h3>
                    <p className="mt-2 flex-1 text-sm leading-6 text-main/60">{t(descriptionKey)}</p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand">
                      {t("home.pathAction")}
                      <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </RevealSection>

          {canViewPrivate ? (
            <RevealSection>
              <section className="grid gap-8 border-y border-line py-10 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-12 lg:py-12" aria-labelledby="home-updates-title">
                <div>
                  <SectionIntro
                    eyebrow={t("home.updatesEyebrow")}
                    icon={Newspaper}
                    title={t("home.sectionUpdates")}
                    titleId="home-updates-title"
                    description={t("home.updatesDescription")}
                  />
                </div>
                <div className="min-w-0">{latestUpdates}</div>
              </section>
            </RevealSection>
          ) : null}

          <RevealSection direction="scale">
            <section className="grid items-center gap-8 py-4 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:gap-12" aria-labelledby="home-signal-title">
              <div>
                <SectionIntro
                  eyebrow={t("home.signalEyebrow")}
                  icon={RadioTower}
                  title={t("home.signalTitle")}
                  titleId="home-signal-title"
                  description={t("home.signalDescription")}
                />
                {canViewPrivate ? (
                  <dl className="mt-7 grid grid-cols-3 divide-x divide-line border-y border-line py-4 text-center lg:text-left">
                    <div className="px-2 first:pl-0 lg:px-4">
                      <dd className="font-heritage text-2xl font-bold text-brand">{dashboardStats.alumniCount}+</dd>
                      <dt className="mt-1 text-xs font-semibold text-main/50">{t("home.statAlumni")}</dt>
                    </div>
                    <div className="px-2 lg:px-4">
                      <dd className="font-heritage text-2xl font-bold text-brand">{dashboardStats.cityCount}</dd>
                      <dt className="mt-1 text-xs font-semibold text-main/50">{t("home.statCities")}</dt>
                    </div>
                    <div className="px-2 lg:px-4">
                      <dd className="font-heritage text-2xl font-bold text-brand">{dashboardStats.storyCount}</dd>
                      <dt className="mt-1 text-xs font-semibold text-main/50">{t("home.statStories")}</dt>
                    </div>
                  </dl>
                ) : null}
                <ButtonLink
                  href={canViewPrivate ? "/alumni/radar" : "/login?redirect=/alumni/radar"}
                  variant="secondary"
                  className="mt-7"
                >
                  {canViewPrivate ? t("home.signalAction") : t("home.signalLoginAction")}
                </ButtonLink>
              </div>
              <div className="min-w-0 border-y border-line">
                {effectsActive ? <AlumniSignalField active /> : <div className="h-[260px] sm:h-[320px]" />}
              </div>
            </section>
          </RevealSection>

          <RevealSection>
            <section className="grid items-center gap-10 border-y border-line py-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:py-12" aria-labelledby="home-ecosystem-title">
              <div>
                <SectionIntro
                  eyebrow={t("home.ecosystemEyebrow")}
                  icon={Network}
                  title={t("home.ecosystemTitle")}
                  titleId="home-ecosystem-title"
                  description={t("home.ecosystemDescription")}
                />
                <ul className="mt-6 space-y-3 text-sm leading-6 text-main/65">
                  <li className="flex gap-3"><MessageSquareText size={18} className="mt-1 shrink-0 text-brand" aria-hidden="true" />{t("home.ecosystemPointContent")}</li>
                  <li className="flex gap-3"><Lock size={18} className="mt-1 shrink-0 text-brand" aria-hidden="true" />{t("home.ecosystemPointPrivacy")}</li>
                  <li className="flex gap-3"><CalendarDays size={18} className="mt-1 shrink-0 text-brand" aria-hidden="true" />{t("home.ecosystemPointParticipation")}</li>
                </ul>
                <ButtonLink href="/ecosystem" variant="secondary" className="mt-7">
                  {t("home.ecosystemAction")}
                </ButtonLink>
              </div>
              <ChannelTV />
            </section>
          </RevealSection>
        </div>
      </section>
    </>
  );
}
