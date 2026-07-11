"use client";

import styles from "./RocketWorkshop.module.css";

export type WorkshopStage =
  | "hidden"
  | "personGather"
  | "awaken"
  | "reach"
  | "catch"
  | "turn"
  | "bendStart"
  | "bendDeep"
  | "engine"
  | "body"
  | "details"
  | "welding"
  | "standUp"
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

const STAR_COUNT = 360;

function precise(value: number) {
  return Math.round(value * 1000) / 1000;
}

function target([x, y]: Coordinate, tone: StarTone, opacity = 1, scale = 1): StarTarget {
  return {
    x: precise(x),
    y: precise(y),
    tone,
    opacity: precise(opacity),
    scale: precise(scale),
  };
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
  reach: {
    head: { cx: 235, cy: 311, rx: 29, ry: 30 },
    shoulders: [[190, 361], [268, 370]],
    hips: [[204, 486], [250, 491]],
    leftArm: [[190, 373], [162, 430], [176, 483]],
    rightArm: [[268, 382], [320, 340], [370, 278]],
    leftLeg: [[204, 486], [196, 558], [174, 638]],
    rightLeg: [[250, 491], [264, 559], [288, 638]],
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
  turn: {
    head: { cx: 221, cy: 327, rx: 28, ry: 30 },
    shoulders: [[177, 374], [253, 379]],
    hips: [[192, 493], [240, 496]],
    leftArm: [[177, 386], [156, 442], [171, 491]],
    rightArm: [[253, 391], [306, 374], [358, 350]],
    leftLeg: [[192, 493], [182, 561], [155, 638]],
    rightLeg: [[240, 496], [254, 562], [283, 638]],
  },
  bendStart: {
    head: { cx: 235, cy: 367, rx: 28, ry: 29 },
    shoulders: [[178, 410], [251, 433]],
    hips: [[174, 518], [226, 522]],
    leftArm: [[178, 422], [153, 469], [159, 514]],
    rightArm: [[251, 445], [299, 427], [342, 402]],
    leftLeg: [[174, 518], [151, 571], [124, 638]],
    rightLeg: [[226, 522], [250, 576], [290, 638]],
  },
  bendDeep: {
    head: { cx: 281, cy: 430, rx: 27, ry: 29 },
    shoulders: [[202, 462], [274, 494]],
    hips: [[166, 550], [222, 554]],
    leftArm: [[202, 474], [164, 505], [158, 548]],
    rightArm: [[274, 506], [316, 476], [350, 438]],
    leftLeg: [[166, 550], [132, 589], [106, 647]],
    rightLeg: [[222, 554], [254, 594], [296, 644]],
  },
  welding: {
    head: { cx: 277, cy: 446, rx: 27, ry: 28 },
    shoulders: [[198, 476], [270, 507]],
    hips: [[164, 561], [221, 565]],
    leftArm: [[198, 488], [173, 527], [166, 558]],
    rightArm: [[270, 519], [307, 493], [338, 500]],
    leftLeg: [[164, 561], [128, 598], [104, 649]],
    rightLeg: [[221, 565], [254, 603], [296, 645]],
  },
  standUp: {
    head: { cx: 205, cy: 397, rx: 27, ry: 29 },
    shoulders: [[158, 441], [232, 453]],
    hips: [[151, 545], [205, 548]],
    leftArm: [[158, 453], [133, 500], [145, 542]],
    rightArm: [[232, 465], [266, 449], [298, 459]],
    leftLeg: [[151, 545], [132, 594], [105, 648]],
    rightLeg: [[205, 548], [227, 597], [258, 648]],
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

function rocketEnginePoints() {
  return [
    ...polylinePoints([[316, 544], [322, 594], [378, 594], [384, 544]], 8, "amber"),
    ...ellipsePoints(350, 548, 42, 18, 18, "cyan", 0.94, 0.9),
    ...linePoints([350, 502], [350, 566], 12, "violet", 0.84, 0.8),
  ];
}

function rocketBodyPoints() {
  return [
    ...quadraticPoints([350, 132], [292, 190], [282, 342], 27, "cyan"),
    ...linePoints([282, 342], [282, 510], 22, "white"),
    ...linePoints([282, 510], [350, 566], 18, "violet"),
    ...quadraticPoints([350, 132], [408, 190], [418, 342], 27, "cyan"),
    ...linePoints([418, 342], [418, 510], 22, "white"),
    ...linePoints([418, 510], [350, 566], 18, "violet"),
    ...polylinePoints([[282, 396], [232, 448], [222, 558], [282, 510]], 10, "cyan"),
    ...polylinePoints([[418, 396], [468, 448], [478, 558], [418, 510]], 10, "cyan"),
    ...rocketEnginePoints(),
  ];
}

function rocketDetailPoints() {
  return [
    ...ellipsePoints(350, 302, 43, 43, 26, "cyan", 1, 1.08),
    ...ellipsePoints(350, 302, 24, 24, 16, "white", 0.94, 0.86),
    ...linePoints([290, 382], [410, 382], 17, "amber", 0.96, 1.08),
    ...linePoints([296, 420], [404, 420], 15, "violet", 0.9),
    ...ellipsePoints(350, 474, 24, 24, 16, "amber", 0.95, 0.9),
    ...linePoints([326, 474], [374, 474], 9, "amber", 0.92, 0.86),
    ...linePoints([350, 450], [350, 498], 9, "amber", 0.92, 0.86),
  ];
}

function rocketCorePoints(includeDetails: boolean) {
  return includeDetails
    ? [...rocketBodyPoints(), ...rocketDetailPoints()]
    : rocketBodyPoints();
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

function buildReachFormation() {
  return normalizeFormation([
    ...articulatedPerson(PERSON_POSES.reach),
    ...coreStar(432, 218, 1),
    ...quadraticPoints([470, 180], [458, 198], [438, 214], 34, "amber", 0.7, 0.82),
    ...ellipsePoints(226, 650, 158, 22, 36, "violet", 0.48, 0.68),
  ], 20);
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

function buildTurnFormation() {
  return normalizeFormation([
    ...articulatedPerson(PERSON_POSES.turn),
    ...coreStar(360, 350, 0.98),
    ...quadraticPoints([402, 244], [410, 292], [365, 344], 48, "amber", 0.86, 0.9),
    ...ellipsePoints(220, 650, 160, 22, 36, "violet", 0.44, 0.66),
  ], 27);
}

function buildBendStartFormation() {
  return normalizeFormation([
    ...articulatedPerson(PERSON_POSES.bendStart),
    ...coreStar(366, 382, 0.96),
    ...quadraticPoints([358, 350], [378, 360], [370, 380], 34, "amber", 0.82, 0.86),
    ...ellipsePoints(220, 650, 166, 23, 40, "violet", 0.42, 0.66),
  ], 31);
}

function buildBendDeepFormation() {
  return normalizeFormation([
    ...articulatedPerson(PERSON_POSES.bendDeep),
    ...coreStar(332, 425, 0.98),
    ...quadraticPoints([366, 382], [354, 402], [336, 422], 36, "amber", 0.86, 0.9),
    ...ellipsePoints(230, 650, 174, 24, 42, "violet", 0.4, 0.66),
  ], 35);
}

function buildEngineFormation() {
  const engine = resampleTargets(shiftTargets(rocketEnginePoints(), 90), 82);
  return normalizeFormation([
    ...resampleTargets(articulatedPerson(PERSON_POSES.welding), 128),
    ...engine,
    ...quadraticPoints([320, 500], [386, 538], [440, 548], 42, "amber", 0.9, 0.92),
    ...weldingSparks(338, 500, 26),
  ], 39);
}

function buildBodyFormation() {
  const rocket = resampleTargets(shiftTargets(rocketBodyPoints(), 90), 142);
  return normalizeFormation([
    ...resampleTargets(articulatedPerson(PERSON_POSES.welding), 126),
    ...rocket,
    ...quadraticPoints([320, 500], [378, 390], [440, 222], 44, "amber", 0.92, 0.94),
    ...weldingSparks(338, 500, 30),
  ], 42);
}

function buildDetailsFormation() {
  const rocket = resampleTargets(shiftTargets(rocketCorePoints(true), 90), 164);
  return normalizeFormation([
    ...resampleTargets(articulatedPerson(PERSON_POSES.welding), 124),
    ...rocket,
    ...quadraticPoints([320, 500], [382, 454], [440, 382], 32, "amber", 0.94, 0.96),
    ...weldingSparks(338, 500, 34),
  ], 45);
}

function buildWeldingFormation() {
  const rocket = resampleTargets(shiftTargets(rocketCorePoints(true), 90), 170);
  return normalizeFormation([
    ...resampleTargets(articulatedPerson(PERSON_POSES.welding), 122),
    ...rocket,
    ...weldingSparks(338, 500, 40),
    ...quadraticPoints([320, 500], [372, 468], [440, 382], 24, "amber", 0.92, 0.92),
  ], 37);
}

function buildStandUpFormation() {
  const rocket = resampleTargets(shiftTargets(rocketCorePoints(true), 90), 172);
  return normalizeFormation([
    ...resampleTargets(articulatedPerson(PERSON_POSES.standUp), 120),
    ...rocket,
    ...coreStar(440, 474, 0.98),
    ...ellipsePoints(440, 646, 148, 20, 34, "cyan", 0.54, 0.76),
  ], 41);
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
const reachFormation = alignFormation(awakenFormation, buildReachFormation());
const catchFormation = alignFormation(reachFormation, buildCatchFormation());
const turnFormation = alignFormation(catchFormation, buildTurnFormation());
const bendStartFormation = alignFormation(turnFormation, buildBendStartFormation());
const bendDeepFormation = alignFormation(bendStartFormation, buildBendDeepFormation());
const engineFormation = alignFormation(bendDeepFormation, buildEngineFormation());
const bodyFormation = alignFormation(engineFormation, buildBodyFormation());
const detailsFormation = alignFormation(bodyFormation, buildDetailsFormation());
const weldingFormation = alignFormation(detailsFormation, buildWeldingFormation());
const standUpFormation = alignFormation(weldingFormation, buildStandUpFormation());
const readyFormation = alignFormation(standUpFormation, buildReadyFormation());
const dissolveFormation = alignFormation(readyFormation, buildDissolveFormation());
const ignitionFormation = alignFormation(dissolveFormation, buildIgnitionFormation());
const launchingFormation = alignFormation(ignitionFormation, buildIgnitionFormation());

const FORMATIONS: Record<WorkshopStage, StarTarget[]> = {
  hidden: scatterFormation,
  personGather: personGatherFormation,
  awaken: awakenFormation,
  reach: reachFormation,
  catch: catchFormation,
  turn: turnFormation,
  bendStart: bendStartFormation,
  bendDeep: bendDeepFormation,
  engine: engineFormation,
  body: bodyFormation,
  details: detailsFormation,
  welding: weldingFormation,
  standUp: standUpFormation,
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
