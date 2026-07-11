"use client";

import styles from "./RocketWorkshop.module.css";

export type WorkshopStage =
  | "hidden"
  | "personGather"
  | "awaken"
  | "catch"
  | "trace"
  | "welding"
  | "ready"
  | "dissolve"
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
type PersonPose = {
  head: { cx: number; cy: number; rx: number; ry: number };
  shoulders: [Coordinate, Coordinate];
  hips: [Coordinate, Coordinate];
  leftArm: Coordinate[];
  rightArm: Coordinate[];
  leftLeg: Coordinate[];
  rightLeg: Coordinate[];
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
  opacity = 1,
  scale = 1,
) {
  return Array.from({ length: count }, (_, index) => {
    const t = index / Math.max(1, count - 1);
    const inverse = 1 - t;
    return target([
      inverse * inverse * start[0] + 2 * inverse * t * control[0] + t * t * end[0],
      inverse * inverse * start[1] + 2 * inverse * t * control[1] + t * t * end[1],
    ], tone, opacity, scale);
  });
}

function articulatedPerson(pose: PersonPose, opacity = 1) {
  const [leftShoulder, rightShoulder] = pose.shoulders;
  const [leftHip, rightHip] = pose.hips;
  return [
    ...ellipsePoints(
      pose.head.cx,
      pose.head.cy,
      pose.head.rx,
      pose.head.ry,
      24,
      "cyan",
      opacity,
      1.08,
    ),
    ...polylinePoints(
      [leftShoulder, leftHip, rightHip, rightShoulder, leftShoulder],
      10,
      "white",
      opacity,
    ),
    ...polylinePoints(pose.leftArm, 9, "white", opacity),
    ...polylinePoints(pose.rightArm, 9, "white", opacity),
    ...polylinePoints(pose.leftLeg, 9, "white", opacity),
    ...polylinePoints(pose.rightLeg, 9, "white", opacity),
    ...linePoints(
      [leftShoulder[0] + 10, leftShoulder[1] + 12],
      [leftHip[0] + 8, leftHip[1] - 10],
      9,
      "violet",
      opacity * 0.72,
      0.82,
    ),
  ];
}

const PERSON_POSES = {
  gathered: {
    head: { cx: 220, cy: 316, rx: 28, ry: 30 },
    shoulders: [[178, 364], [255, 364]],
    hips: [[192, 486], [240, 486]],
    leftArm: [[178, 376], [150, 430], [171, 480]],
    rightArm: [[255, 376], [284, 430], [269, 482]],
    leftLeg: [[192, 486], [188, 556], [164, 638]],
    rightLeg: [[240, 486], [252, 557], [278, 638]],
  },
  awaken: {
    head: { cx: 230, cy: 306, rx: 29, ry: 30 },
    shoulders: [[184, 358], [263, 366]],
    hips: [[198, 484], [244, 489]],
    leftArm: [[184, 370], [157, 428], [174, 480]],
    rightArm: [[263, 378], [312, 347], [349, 292]],
    leftLeg: [[198, 484], [191, 557], [168, 638]],
    rightLeg: [[244, 489], [259, 558], [283, 638]],
  },
  catch: {
    head: { cx: 239, cy: 318, rx: 29, ry: 30 },
    shoulders: [[195, 364], [272, 375]],
    hips: [[211, 488], [257, 493]],
    leftArm: [[195, 376], [166, 432], [178, 485]],
    rightArm: [[272, 386], [327, 326], [397, 249]],
    leftLeg: [[211, 488], [202, 558], [180, 638]],
    rightLeg: [[257, 493], [270, 560], [292, 638]],
  },
  trace: {
    head: { cx: 158, cy: 393, rx: 27, ry: 29 },
    shoulders: [[124, 438], [202, 436]],
    hips: [[143, 548], [205, 544]],
    leftArm: [[124, 449], [106, 500], [126, 548]],
    rightArm: [[202, 447], [255, 422], [307, 395]],
    leftLeg: [[143, 548], [128, 598], [111, 648]],
    rightLeg: [[205, 544], [221, 596], [246, 648]],
  },
  welding: {
    head: { cx: 158, cy: 464, rx: 27, ry: 28 },
    shoulders: [[128, 505], [207, 510]],
    hips: [[151, 581], [216, 576]],
    leftArm: [[128, 516], [190, 533], [268, 508]],
    rightArm: [[207, 521], [257, 487], [320, 500]],
    leftLeg: [[151, 581], [112, 608], [102, 649]],
    rightLeg: [[216, 576], [247, 610], [288, 645]],
  },
  inspect: {
    head: { cx: 140, cy: 363, rx: 27, ry: 29 },
    shoulders: [[105, 409], [181, 407]],
    hips: [[121, 529], [168, 529]],
    leftArm: [[105, 420], [84, 474], [104, 520]],
    rightArm: [[181, 420], [226, 398], [273, 421]],
    leftLeg: [[121, 529], [116, 588], [98, 650]],
    rightLeg: [[168, 529], [184, 590], [207, 650]],
  },
} satisfies Record<string, PersonPose>;

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

function resampleTargets(points: StarTarget[], count: number) {
  if (points.length <= count) return points;
  return Array.from({ length: count }, (_, index) =>
    points[Math.floor((index * points.length) / count)],
  );
}

function shiftTargets(points: StarTarget[], dx: number, dy = 0) {
  return points.map((point) => ({ ...point, x: point.x + dx, y: point.y + dy }));
}

function withOpacity(points: StarTarget[], opacity: number) {
  return points.map((point) => ({ ...point, opacity: point.opacity * opacity }));
}

function coreStar(cx: number, cy: number, intensity = 1) {
  return [
    ...ellipsePoints(cx, cy, 24, 24, 18, "amber", intensity, 1.2),
    ...ellipsePoints(cx, cy, 10, 10, 10, "white", intensity, 1.24),
    target([cx, cy], "white", intensity, 1.7),
  ];
}

function weldingSparks(cx: number, cy: number, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const angle = ((index * 137.508 + 17) * Math.PI) / 180;
    const radius = 12 + (index % 7) * 8;
    return target([
      cx + Math.cos(angle) * radius,
      cy + Math.sin(angle) * radius,
    ], index % 5 === 0 ? "white" : "amber", 1, 1.1 + (index % 3) * 0.12);
  });
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
  if (points.length >= STAR_COUNT) return resampleTargets(points, STAR_COUNT);
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

function buildPersonGatherFormation() {
  return normalizeFormation([
    ...articulatedPerson(PERSON_POSES.gathered),
    ...coreStar(486, 164, 0.9),
    ...ellipsePoints(222, 650, 154, 22, 42, "violet", 0.56, 0.72),
    ...ellipsePoints(354, 356, 292, 246, 48, "cyan", 0.2, 0.58, Math.PI * 1.08, Math.PI * 0.84),
  ], 11);
}

function buildAwakenFormation() {
  return normalizeFormation([
    ...articulatedPerson(PERSON_POSES.awaken),
    ...coreStar(466, 188),
    ...quadraticPoints([250, 300], [348, 236], [446, 192], 34, "cyan", 0.32, 0.62),
    ...ellipsePoints(222, 650, 154, 22, 38, "violet", 0.5, 0.7),
  ], 17);
}

function buildCatchFormation() {
  return normalizeFormation([
    ...articulatedPerson(PERSON_POSES.catch),
    ...coreStar(402, 244, 1),
    ...quadraticPoints([476, 178], [454, 214], [410, 238], 38, "amber", 0.74, 0.84),
    ...ellipsePoints(402, 244, 62, 62, 42, "cyan", 0.28, 0.66),
    ...ellipsePoints(226, 650, 158, 22, 36, "violet", 0.46, 0.68),
  ], 23);
}

function buildTraceFormation() {
  const rocket = resampleTargets(shiftTargets(rocketCorePoints(false), 90), 130);
  return normalizeFormation([
    ...resampleTargets(articulatedPerson(PERSON_POSES.trace), 128),
    ...rocket,
    ...quadraticPoints([306, 395], [370, 306], [440, 146], 42, "amber", 1, 1.02),
    ...quadraticPoints([307, 400], [382, 416], [530, 498], 30, "cyan", 0.7, 0.82),
    ...coreStar(307, 397, 0.94),
  ], 29);
}

function buildWeldingFormation() {
  const rocket = resampleTargets(shiftTargets(rocketCorePoints(true), 90), 154);
  return normalizeFormation([
    ...resampleTargets(articulatedPerson(PERSON_POSES.welding), 126),
    ...rocket,
    ...weldingSparks(338, 500, 40),
    ...quadraticPoints([320, 500], [372, 468], [440, 382], 24, "amber", 0.92, 0.92),
  ], 37);
}

function buildReadyFormation() {
  const rocket = resampleTargets(shiftTargets(rocketCorePoints(true), 90), 170);
  return normalizeFormation([
    ...resampleTargets(articulatedPerson(PERSON_POSES.inspect), 116),
    ...rocket,
    ...coreStar(440, 474, 1),
    ...ellipsePoints(440, 646, 152, 22, 38, "cyan", 0.68, 0.82),
    ...ellipsePoints(440, 646, 218, 34, 42, "violet", 0.38, 0.68),
  ], 43);
}

function buildDissolveFormation() {
  const ghost = withOpacity(resampleTargets(articulatedPerson(PERSON_POSES.inspect), 72), 0.3);
  const rocket = resampleTargets(shiftTargets(rocketCorePoints(true), 45), 178);
  return normalizeFormation([
    ...ghost,
    ...rocket,
    ...quadraticPoints([128, 386], [238, 420], [365, 540], 34, "cyan", 0.82, 0.9),
    ...quadraticPoints([116, 514], [228, 566], [350, 592], 34, "violet", 0.76, 0.86),
    ...quadraticPoints([190, 622], [288, 642], [350, 608], 34, "amber", 0.96, 1.02),
    ...coreStar(395, 474, 1),
  ], 49);
}

function buildIgnitionFormation() {
  const flame = [
    ...polylinePoints([[326, 586], [336, 642], [350, 718]], 14, "amber", 1, 1.18),
    ...polylinePoints([[374, 586], [364, 642], [350, 718]], 14, "amber", 1, 1.18),
    ...polylinePoints([[340, 590], [346, 654], [350, 690]], 12, "white", 1, 1.08),
    ...polylinePoints([[360, 590], [354, 654], [350, 690]], 12, "cyan", 1, 1.08),
  ];
  return normalizeFormation([
    ...resampleTargets(rocketCorePoints(true), 205),
    ...flame,
    ...ellipsePoints(350, 648, 112, 20, 34, "cyan", 0.86, 0.92),
    ...ellipsePoints(350, 652, 204, 38, 42, "violet", 0.5, 0.76),
  ], 57);
}

const scatterFormation = buildScatterFormation();
const personGatherFormation = alignFormation(scatterFormation, buildPersonGatherFormation());
const awakenFormation = alignFormation(personGatherFormation, buildAwakenFormation());
const catchFormation = alignFormation(awakenFormation, buildCatchFormation());
const traceFormation = alignFormation(catchFormation, buildTraceFormation());
const weldingFormation = alignFormation(traceFormation, buildWeldingFormation());
const readyFormation = alignFormation(weldingFormation, buildReadyFormation());
const dissolveFormation = alignFormation(readyFormation, buildDissolveFormation());
const ignitionFormation = alignFormation(dissolveFormation, buildIgnitionFormation());
const launchingFormation = alignFormation(ignitionFormation, buildIgnitionFormation());

const FORMATIONS: Record<WorkshopStage, StarTarget[]> = {
  hidden: scatterFormation,
  personGather: personGatherFormation,
  awaken: awakenFormation,
  catch: catchFormation,
  trace: traceFormation,
  welding: weldingFormation,
  ready: readyFormation,
  dissolve: dissolveFormation,
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
