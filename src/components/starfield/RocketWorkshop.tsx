"use client";

import styles from "./RocketWorkshop.module.css";

export type WorkshopStage =
  | "hidden"
  | "crew"
  | "assembly"
  | "ready"
  | "ignition"
  | "launching"
  | "departed";

type Coordinate = [number, number];
type StarTone = "white" | "cyan" | "amber" | "violet";
type StarTarget = {
  x: number;
  y: number;
  opacity: number;
  scale: number;
  tone: StarTone;
};

const STAR_COUNT = 340;

function target([x, y]: Coordinate, tone: StarTone, opacity = 1, scale = 1): StarTarget {
  return { x, y, tone, opacity, scale };
}

function linePoints(
  start: Coordinate,
  end: Coordinate,
  count: number,
  tone: StarTone = "white",
  opacity = 1,
  scale = 1,
) {
  return Array.from({ length: count }, (_, index) => {
    const progress = count === 1 ? 0 : index / (count - 1);
    return target([
      start[0] + (end[0] - start[0]) * progress,
      start[1] + (end[1] - start[1]) * progress,
    ], tone, opacity, scale);
  });
}

function polylinePoints(
  nodes: Coordinate[],
  pointsPerSegment: number,
  tone: StarTone = "white",
  opacity = 1,
  scale = 1,
) {
  return nodes.flatMap((node, index) => {
    const next = nodes[index + 1];
    return next ? linePoints(node, next, pointsPerSegment, tone, opacity, scale) : [];
  });
}

function ellipsePoints(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  count: number,
  tone: StarTone = "white",
  opacity = 1,
  scale = 1,
  startAngle = -Math.PI / 2,
  sweep = Math.PI * 2,
) {
  return Array.from({ length: count }, (_, index) => {
    const angle = startAngle + (sweep * index) / Math.max(1, count - 1);
    return target([cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry], tone, opacity, scale);
  });
}

function quadraticPoints(
  start: Coordinate,
  control: Coordinate,
  end: Coordinate,
  count: number,
  tone: StarTone = "white",
) {
  return Array.from({ length: count }, (_, index) => {
    const t = index / Math.max(1, count - 1);
    const inverse = 1 - t;
    return target([
      inverse * inverse * start[0] + 2 * inverse * t * control[0] + t * t * end[0],
      inverse * inverse * start[1] + 2 * inverse * t * control[1] + t * t * end[1],
    ], tone);
  });
}

function personPoints(
  cx: number,
  baseline: number,
  scale: number,
  facing: -1 | 1,
  working: boolean,
) {
  const point = (x: number, y: number): Coordinate => [cx + x * scale, baseline + y * scale];
  const shoulder = point(0, -105);
  const innerHand = working ? point(63 * facing, -88) : point(34 * facing, -48);
  const outerHand = working ? point(-32 * facing, -72) : point(-38 * facing, -42);

  return [
    ...ellipsePoints(cx, baseline - 142 * scale, 19 * scale, 20 * scale, 14, "cyan", 1, 1.12),
    ...linePoints(point(0, -120), point(0, -48), 8, "white"),
    ...polylinePoints([shoulder, point(28 * facing, -96), innerHand], 6, "white"),
    ...polylinePoints([shoulder, point(-24 * facing, -90), outerHand], 6, "white"),
    ...linePoints(point(0, -48), point(-27, 0), 7, "white"),
    ...linePoints(point(0, -48), point(28, 0), 7, "white"),
    ...linePoints(point(-13, -112), point(-24, -72), 5, "violet", 0.72, 0.82),
  ];
}

function rocketCorePoints(includeDetails: boolean) {
  const points: StarTarget[] = [
    ...quadraticPoints([350, 132], [292, 190], [282, 342], 27, "cyan"),
    ...linePoints([282, 342], [282, 510], 22, "white"),
    ...linePoints([282, 510], [350, 566], 18, "violet"),
    ...quadraticPoints([350, 132], [408, 190], [418, 342], 27, "cyan"),
    ...linePoints([418, 342], [418, 510], 22, "white"),
    ...linePoints([418, 510], [350, 566], 18, "violet"),
    ...polylinePoints([[282, 396], [232, 448], [222, 558], [282, 510]], 10, "cyan"),
    ...polylinePoints([[418, 396], [468, 448], [478, 558], [418, 510]], 10, "cyan"),
    ...polylinePoints([[316, 544], [322, 594], [378, 594], [384, 544]], 8, "amber"),
  ];

  if (includeDetails) {
    points.push(
      ...ellipsePoints(350, 302, 43, 43, 26, "cyan", 1, 1.08),
      ...ellipsePoints(350, 302, 24, 24, 16, "white", 0.94, 0.86),
      ...linePoints([290, 382], [410, 382], 17, "amber", 0.96, 1.08),
      ...linePoints([296, 420], [404, 420], 15, "violet", 0.9),
      ...ellipsePoints(350, 474, 24, 24, 16, "amber", 0.95, 0.9),
      ...linePoints([326, 474], [374, 474], 9, "amber", 0.92, 0.86),
      ...linePoints([350, 450], [350, 498], 9, "amber", 0.92, 0.86),
    );
  }

  return points;
}

function ambientPoints(count: number, salt: number) {
  return Array.from({ length: count }, (_, index) => {
    const x = 72 + ((index * 89 + salt * 43) % 556);
    const y = 92 + ((index * 137 + salt * 61) % 570);
    const opacity = 0.1 + ((index * 17 + salt) % 15) / 100;
    const tone: StarTone = index % 9 === 0 ? "amber" : index % 4 === 0 ? "cyan" : "white";
    return target([x, y], tone, opacity, 0.56 + (index % 4) * 0.08);
  });
}

function normalizeFormation(points: StarTarget[], salt: number) {
  if (points.length >= STAR_COUNT) {
    return Array.from({ length: STAR_COUNT }, (_, index) =>
      points[Math.floor((index * points.length) / STAR_COUNT)],
    );
  }
  return [...points, ...ambientPoints(STAR_COUNT - points.length, salt)];
}

function alignFormation(previous: StarTarget[], next: StarTarget[]) {
  const remaining = [...next];
  return previous.map((source) => {
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    remaining.forEach((candidate, index) => {
      const distance = (candidate.x - source.x) ** 2 + (candidate.y - source.y) ** 2;
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    return remaining.splice(closestIndex, 1)[0];
  });
}

function buildScatterFormation() {
  return Array.from({ length: STAR_COUNT }, (_, index) => {
    const angle = ((index * 137.508 + 29) * Math.PI) / 180;
    const radius = 190 + ((index * 53) % 310);
    return target([
      350 + Math.cos(angle) * radius,
      382 + Math.sin(angle) * radius,
    ], index % 13 === 0 ? "amber" : index % 5 === 0 ? "cyan" : "white", 0.08, 0.45);
  });
}

function buildCrewFormation() {
  const points = [
    ...personPoints(110, 620, 0.82, 1, false),
    ...personPoints(255, 630, 0.92, 1, false),
    ...personPoints(445, 630, 0.92, -1, false),
    ...personPoints(590, 620, 0.82, -1, false),
    ...ellipsePoints(350, 642, 282, 28, 48, "violet", 0.64, 0.72),
    ...ellipsePoints(350, 356, 286, 236, 44, "cyan", 0.34, 0.66, Math.PI * 1.08, Math.PI * 0.84),
  ];
  return normalizeFormation(points, 11);
}

function buildAssemblyFormation() {
  const points = [
    ...personPoints(92, 630, 0.72, 1, true),
    ...personPoints(214, 638, 0.78, 1, true),
    ...personPoints(486, 638, 0.78, -1, true),
    ...personPoints(608, 630, 0.72, -1, true),
    ...rocketCorePoints(false),
    ...ellipsePoints(350, 382, 112, 154, 34, "cyan", 0.42, 0.72),
    ...ellipsePoints(350, 418, 176, 206, 30, "violet", 0.26, 0.6),
    ...Array.from({ length: 22 }, (_, index) => {
      const angle = ((index * 67 + 14) * Math.PI) / 180;
      const radius = 18 + (index % 5) * 11;
      return target([
        350 + Math.cos(angle) * radius,
        410 + Math.sin(angle) * radius,
      ], "amber", 1, 1.15);
    }),
  ];
  return normalizeFormation(points, 23);
}

function buildReadyFormation() {
  const points = [
    ...rocketCorePoints(true),
    ...ellipsePoints(350, 644, 156, 24, 44, "cyan", 0.72, 0.86),
    ...ellipsePoints(350, 644, 224, 36, 52, "violet", 0.46, 0.72),
    ...ellipsePoints(350, 370, 238, 282, 54, "cyan", 0.22, 0.58),
  ];
  return normalizeFormation(points, 37);
}

function buildIgnitionFormation() {
  const flame = [
    ...polylinePoints([[326, 586], [336, 642], [350, 718]], 14, "amber", 1, 1.18),
    ...polylinePoints([[374, 586], [364, 642], [350, 718]], 14, "amber", 1, 1.18),
    ...polylinePoints([[340, 590], [346, 654], [350, 690]], 12, "white", 1, 1.08),
    ...polylinePoints([[360, 590], [354, 654], [350, 690]], 12, "cyan", 1, 1.08),
  ];
  const points = [
    ...rocketCorePoints(true),
    ...flame,
    ...ellipsePoints(350, 648, 112, 20, 34, "cyan", 0.86, 0.92),
    ...ellipsePoints(350, 652, 204, 38, 42, "violet", 0.5, 0.76),
  ];
  return normalizeFormation(points, 49);
}

const scatterFormation = buildScatterFormation();
const crewFormation = alignFormation(scatterFormation, buildCrewFormation());
const assemblyFormation = alignFormation(crewFormation, buildAssemblyFormation());
const readyFormation = alignFormation(assemblyFormation, buildReadyFormation());
const ignitionFormation = alignFormation(readyFormation, buildIgnitionFormation());
const launchingFormation = alignFormation(ignitionFormation, buildIgnitionFormation());

const FORMATIONS: Record<WorkshopStage, StarTarget[]> = {
  hidden: scatterFormation,
  crew: crewFormation,
  assembly: assemblyFormation,
  ready: readyFormation,
  ignition: ignitionFormation,
  launching: launchingFormation,
  departed: launchingFormation,
};

export function RocketWorkshop({ stage }: { stage: WorkshopStage }) {
  const formation = FORMATIONS[stage];

  return (
    <div className={styles.frame} data-stage={stage} aria-hidden="true">
      <svg className={styles.stage} viewBox="0 0 700 800" role="presentation">
        <g className={styles.formation}>
          {formation.map((star, index) => (
            <g
              key={index}
              className={styles.starPosition}
              style={{
                "--star-x": `${star.x}px`,
                "--star-y": `${star.y}px`,
                "--star-opacity": star.opacity,
                "--star-scale": star.scale,
                "--move-delay": `${(index % 17) * 7}ms`,
              } as React.CSSProperties}
            >
              <circle
                className={`${styles.star} ${styles[star.tone]}`}
                r={index % 19 === 0 ? 5.4 : index % 7 === 0 ? 4.2 : 3.2}
                style={{
                  "--twinkle-delay": `${-((index * 83) % 2100)}ms`,
                  "--twinkle-duration": `${1500 + (index % 9) * 170}ms`,
                } as React.CSSProperties}
              />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
