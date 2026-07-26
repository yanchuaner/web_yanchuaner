"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { useThemeAndLocale } from "@/components/ThemeAndLocaleProvider";
import { HOME_INTRO_REPLAY_EVENT, shouldShowHomeIntro } from "@/lib/home-intro";

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
  const [homeRevealed, setHomeRevealed] = useState(false);
  const [effectsActive, setEffectsActive] = useState(false);
  const [homeSphereImmediate, setHomeSphereImmediate] = useState(false);
  const [heroCopyVisible, setHeroCopyVisible] = useState(false);
  const restoreHeroFocusRef = useRef(false);

  useEffect(() => {
    if (shouldShowHomeIntro()) {
      setIntroVisible(true);
      setHomeRevealed(false);
      setHeroCopyVisible(false);
    } else {
      setHomeRevealed(true);
      setEffectsActive(true);
      setHomeSphereImmediate(true);
      setHeroCopyVisible(true);
    }

    const replayIntro = () => {
      window.scrollTo({ top: 0, behavior: "auto" });
      setEffectsActive(false);
      setHomeRevealed(false);
      setHomeSphereImmediate(false);
      setHeroCopyVisible(false);
      setIntroVisible(true);
    };
    window.addEventListener(HOME_INTRO_REPLAY_EVENT, replayIntro);
    return () => window.removeEventListener(HOME_INTRO_REPLAY_EVENT, replayIntro);
  }, []);

  const revealHome = useCallback((immediate = false) => {
    setHomeRevealed(true);
    setEffectsActive(true);
    setHomeSphereImmediate(true);
    if (immediate) setHeroCopyVisible(true);
  }, []);
  const completeIntro = useCallback(() => {
    restoreHeroFocusRef.current = true;
    setHomeRevealed(true);
    setHeroCopyVisible(true);
    setIntroVisible(false);
  }, []);

  useEffect(() => {
    if (introVisible || !restoreHeroFocusRef.current) return;
    restoreHeroFocusRef.current = false;
    const frame = requestAnimationFrame(() => {
      document.getElementById("home-hero-title")?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [introVisible]);

  return (
    <>
      {introVisible ? (
        <CelestialEntrance onReveal={revealHome} onComplete={completeIntro} />
      ) : null}

      <section
        id="top"
        className={`home-page relative min-h-screen overflow-hidden bg-narrative text-narrative-fg transition-opacity duration-1000 ${
          homeRevealed ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="home-hero-stage">
          {effectsActive ? (
            <>
              <CosmicBackground />
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

          <div className="home-hero-shell">
            <header className={`home-hero ${heroCopyVisible ? "animate-fade-in-up" : ""}`}>
              <div className="home-hero__copy">
                <p className="home-hero__eyebrow">
                  <Rocket size={17} aria-hidden="true" />
                  {t("nav.brand")}
                </p>
                <h1
                  id="home-hero-title"
                  tabIndex={-1}
                  className="home-hero__title whitespace-pre-line outline-none"
                >
                  {t("home.heroTitle")}
                </h1>
                <p className="home-hero__tagline">
                  {t("home.heroTagline")}
                </p>

                <div className="home-hero__actions">
                  {!isLoggedIn ? (
                    <ButtonLink href="/register" variant="narrative" icon={Rocket}>
                      {t("home.ctaJoin")}
                    </ButtonLink>
                  ) : null}
                  <ButtonLink
                    href="/alumni/radar"
                    variant={isLoggedIn ? "narrative" : "narrative-outline"}
                    icon={UserRoundSearch}
                  >
                    {t("home.ctaDirectory")}
                  </ButtonLink>
                </div>
              </div>

              <figure className="home-hero__globe">
                <div className="home-hero__orbit-label" aria-hidden="true">
                  <span />
                  {t("home.heroOrbitLabel")}
                </div>
                <div
                  data-home-sphere-target
                  className={`home-hero__sphere ${homeRevealed && effectsActive ? "home-hero__sphere--visible" : ""} ${homeSphereImmediate ? "home-hero__sphere--immediate" : ""}`}
                >
                  <CelestialSphere size={500} interactive active variant="hero" />
                </div>
                <figcaption className="home-hero__coordinate">{t("home.heroCoordinate")}</figcaption>
              </figure>
            </header>
          </div>
          <div className="home-hero__baseline" aria-hidden="true" />
        </div>

        <div className="home-sections">
          <div className="home-section home-section--paths">
            <section className="home-content-shell" aria-labelledby="home-paths-title">
              <SectionIntro
                eyebrow={t("home.pathsEyebrow")}
                icon={Network}
                title={t("home.pathsTitle")}
                titleId="home-paths-title"
                description={t("home.pathsDescription")}
                tone="narrative"
              />
              <div className="home-path-grid">
                {HOME_PATHS.map(({ href, icon: Icon, titleKey, descriptionKey }, index) => (
                  <Link
                    key={href}
                    href={href}
                    className="home-path-link group"
                  >
                    <span className="home-path-link__meta" aria-hidden="true">
                      <span>0{index + 1}</span>
                      <Icon size={22} />
                    </span>
                    <h3 className="home-path-link__title">{t(titleKey)}</h3>
                    <p className="home-path-link__description">{t(descriptionKey)}</p>
                    <span className="home-path-link__action">
                      {t("home.pathAction")}
                      <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {canViewPrivate ? (
            <RevealSection className="home-section home-section--quiet">
              <section className="home-content-shell home-updates-grid" aria-labelledby="home-updates-title">
                <div>
                  <SectionIntro
                    eyebrow={t("home.updatesEyebrow")}
                    icon={Newspaper}
                    title={t("home.sectionUpdates")}
                    titleId="home-updates-title"
                    description={t("home.updatesDescription")}
                    tone="narrative"
                  />
                </div>
                <div className="min-w-0">{latestUpdates}</div>
              </section>
            </RevealSection>
          ) : null}

          <RevealSection direction="scale" className="home-section home-section--signal">
            <section className="home-content-shell home-signal-grid" aria-labelledby="home-signal-title">
              <div>
                <SectionIntro
                  eyebrow={t("home.signalEyebrow")}
                  icon={RadioTower}
                  title={t("home.signalTitle")}
                  titleId="home-signal-title"
                  description={t("home.signalDescription")}
                  tone="narrative"
                />
                {canViewPrivate ? (
                  <dl className="home-signal-stats">
                    <div className="px-2 first:pl-0 lg:px-4">
                      <dd>{dashboardStats.alumniCount}+</dd>
                      <dt>{t("home.statAlumni")}</dt>
                    </div>
                    <div className="px-2 lg:px-4">
                      <dd>{dashboardStats.cityCount}</dd>
                      <dt>{t("home.statCities")}</dt>
                    </div>
                    <div className="px-2 lg:px-4">
                      <dd>{dashboardStats.storyCount}</dd>
                      <dt>{t("home.statStories")}</dt>
                    </div>
                  </dl>
                ) : null}
                <ButtonLink
                  href={canViewPrivate ? "/alumni/radar" : "/login?redirect=/alumni/radar"}
                  variant="narrative-outline"
                  className="mt-7"
                >
                  {canViewPrivate ? t("home.signalAction") : t("home.signalLoginAction")}
                </ButtonLink>
              </div>
              <div className="home-signal-visual">
                {effectsActive ? <AlumniSignalField active /> : <div className="h-[260px] sm:h-[320px]" />}
              </div>
            </section>
          </RevealSection>

          <RevealSection className="home-section">
            <section className="home-content-shell home-ecosystem-grid" aria-labelledby="home-ecosystem-title">
              <div>
                <SectionIntro
                  eyebrow={t("home.ecosystemEyebrow")}
                  icon={Network}
                  title={t("home.ecosystemTitle")}
                  titleId="home-ecosystem-title"
                  description={t("home.ecosystemDescription")}
                  tone="narrative"
                />
                <ul className="home-ecosystem-list">
                  <li><MessageSquareText size={18} aria-hidden="true" />{t("home.ecosystemPointContent")}</li>
                  <li><Lock size={18} aria-hidden="true" />{t("home.ecosystemPointPrivacy")}</li>
                  <li><CalendarDays size={18} aria-hidden="true" />{t("home.ecosystemPointParticipation")}</li>
                </ul>
                <ButtonLink href="/ecosystem" variant="narrative-outline" className="mt-7">
                  {t("home.ecosystemAction")}
                </ButtonLink>
              </div>
              <ChannelTV tone="narrative" />
            </section>
          </RevealSection>
        </div>
      </section>
    </>
  );
}
