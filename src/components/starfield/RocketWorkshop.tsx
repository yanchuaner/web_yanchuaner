"use client";

import { useMemo } from "react";
import styles from "./RocketWorkshop.module.css";

export type WorkshopStage =
  | "hidden"
  | "crew"
  | "assembly"
  | "ready"
  | "ignition"
  | "launching"
  | "departed";

type RocketWorkshopProps = {
  stage: WorkshopStage;
  assetSrc?: string;
};

const SPARKS = Array.from({ length: 18 }, (_, index) => ({
  angle: index * 47 + 12,
  distance: 24 + (index % 5) * 9,
  delay: (index % 7) * 70,
}));

function CrewMember({ className, mirrored = false }: { className: string; mirrored?: boolean }) {
  return (
    <g className={`${styles.crewMember} ${className}`} data-mirrored={mirrored || undefined}>
      <circle className={styles.crewHead} cx="0" cy="-64" r="14" />
      <path className={styles.crewBody} d="M 0 -48 L 0 8 M 0 -27 L -29 -2 M 0 -27 L 29 -6 M 0 8 L -22 49 M 0 8 L 24 49" />
      <path className={styles.crewPack} d="M -15 -42 Q -30 -33 -26 -9 L -9 -12" />
      <circle className={styles.crewLight} cx="5" cy="-67" r="3.5" />
      <g className={styles.toolArm}>
        <path d="M 27 -7 L 51 -28" />
        <path className={styles.tool} d="M 47 -34 L 60 -21 M 54 -40 L 66 -28" />
      </g>
    </g>
  );
}

export function RocketWorkshop({ stage, assetSrc }: RocketWorkshopProps) {
  const sparks = useMemo(() => SPARKS, []);

  return (
    <div className={styles.frame} data-stage={stage} aria-hidden="true">
      <svg className={styles.workshop} viewBox="0 0 700 800" role="presentation">
        <defs>
          <linearGradient id="rocket-shell" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="rgb(var(--brand-fg-rgb))" />
            <stop offset="0.52" stopColor="rgb(var(--brand-rgb))" />
            <stop offset="1" stopColor="rgb(var(--space-cyan-rgb))" />
          </linearGradient>
          <linearGradient id="rocket-fin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgb(var(--space-cyan-rgb))" />
            <stop offset="1" stopColor="rgb(var(--brand-rgb))" />
          </linearGradient>
          <radialGradient id="rocket-window">
            <stop offset="0" stopColor="rgb(var(--brand-fg-rgb))" />
            <stop offset="0.45" stopColor="rgb(var(--space-cyan-rgb))" />
            <stop offset="1" stopColor="rgb(var(--surface-muted-rgb))" />
          </radialGradient>
          <linearGradient id="rocket-flame" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgb(var(--brand-fg-rgb))" />
            <stop offset="0.35" stopColor="rgb(var(--space-cyan-rgb))" />
            <stop offset="0.72" stopColor="rgb(var(--space-amber-rgb))" />
            <stop offset="1" stopColor="rgb(var(--space-orange-rgb) / 0)" />
          </linearGradient>
        </defs>

        <g className={styles.blueprintGrid}>
          {[160, 220, 280, 340, 400, 460, 520, 580].map((x) => <path key={`v-${x}`} d={`M ${x} 108 V 676`} />)}
          {[150, 210, 270, 330, 390, 450, 510, 570, 630].map((y) => <path key={`h-${y}`} d={`M 118 ${y} H 582`} />)}
          <circle cx="350" cy="370" r="176" />
          <circle cx="350" cy="370" r="118" />
        </g>

        <g className={styles.energyRings}>
          <ellipse cx="350" cy="656" rx="196" ry="34" />
          <ellipse cx="350" cy="656" rx="132" ry="22" />
          <ellipse cx="350" cy="656" rx="72" ry="12" />
        </g>

        <g className={styles.scaffold}>
          <path d="M 183 644 V 238 M 517 644 V 238 M 164 644 H 536" />
          <path d="M 183 286 H 260 M 440 286 H 517 M 183 404 H 258 M 442 404 H 517 M 183 520 H 250 M 450 520 H 517" />
          <path d="M 183 260 L 222 286 L 183 312 M 517 260 L 478 286 L 517 312 M 183 378 L 222 404 L 183 430 M 517 378 L 478 404 L 517 430" />
        </g>

        <g className={styles.crewGroup}>
          <CrewMember className={styles.crewOne} />
          <CrewMember className={styles.crewTwo} mirrored />
          <CrewMember className={styles.crewThree} />
          <CrewMember className={styles.crewFour} mirrored />
        </g>

        <g className={styles.blueprintRocket}>
          <path d="M 350 142 C 302 194 286 261 286 354 V 520 L 350 566 L 414 520 V 354 C 414 261 398 194 350 142 Z" />
          <path d="M 286 413 C 242 448 226 510 234 571 L 286 524 M 414 413 C 458 448 474 510 466 571 L 414 524" />
          <circle cx="350" cy="304" r="44" />
          <path d="M 306 383 H 394 M 318 548 L 318 588 M 350 566 L 350 604 M 382 548 L 382 588" />
        </g>

        <g className={styles.rocketFlight}>
          <g className={styles.rocketBody}>
            <path className={`${styles.rocketPart} ${styles.nose}`} d="M 350 142 C 315 180 298 222 290 272 H 410 C 402 222 385 180 350 142 Z" />
            <path className={`${styles.rocketPart} ${styles.shell}`} d="M 290 272 H 410 C 414 298 414 324 414 354 V 520 L 350 566 L 286 520 V 354 C 286 324 286 298 290 272 Z" />
            <path className={`${styles.rocketPart} ${styles.leftFin}`} d="M 286 413 C 242 448 226 510 234 571 L 286 524 Z" />
            <path className={`${styles.rocketPart} ${styles.rightFin}`} d="M 414 413 C 458 448 474 510 466 571 L 414 524 Z" />
            <path className={`${styles.rocketPart} ${styles.band}`} d="M 287 381 Q 350 397 413 381 V 421 Q 350 437 287 421 Z" />
            <circle className={`${styles.rocketPart} ${styles.window}`} cx="350" cy="304" r="43" />
            <circle className={`${styles.rocketPart} ${styles.windowRim}`} cx="350" cy="304" r="51" />
            <path className={`${styles.rocketPart} ${styles.nozzle}`} d="M 316 544 H 384 L 374 588 H 326 Z" />
            <path className={`${styles.rocketPart} ${styles.brandSlot}`} d="M 330 454 H 370 V 494 H 330 Z" />
            {assetSrc ? (
              <image
                className={styles.realAsset}
                href={assetSrc}
                x="224"
                y="128"
                width="252"
                height="468"
                preserveAspectRatio="xMidYMid meet"
              />
            ) : null}
          </g>

          <g className={styles.flameGroup}>
            <path className={styles.outerFlame} d="M 326 578 Q 350 702 374 578 Z" />
            <path className={styles.innerFlame} d="M 338 578 Q 350 660 362 578 Z" />
          </g>

          <g className={styles.exhaustCloud}>
            <circle cx="350" cy="650" r="34" />
            <circle cx="303" cy="662" r="28" />
            <circle cx="397" cy="662" r="28" />
            <circle cx="260" cy="676" r="20" />
            <circle cx="440" cy="676" r="20" />
          </g>
        </g>

        <g className={styles.weldingSparks}>
          {sparks.map((spark, index) => (
            <circle
              key={index}
              cx="350"
              cy="414"
              r={index % 4 === 0 ? 4 : 2.4}
              style={{
                "--spark-angle": `${spark.angle}deg`,
                "--spark-distance": `${spark.distance}px`,
                "--spark-delay": `${spark.delay}ms`,
              } as React.CSSProperties}
            />
          ))}
        </g>

        <g className={styles.launchPad}>
          <path d="M 238 646 H 462 L 492 678 H 208 Z" />
          <path d="M 276 646 L 300 612 H 400 L 424 646" />
          <circle cx="236" cy="662" r="5" />
          <circle cx="464" cy="662" r="5" />
        </g>
      </svg>
    </div>
  );
}
