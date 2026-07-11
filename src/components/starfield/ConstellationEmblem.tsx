"use client";

import { useMemo } from "react";
import styles from "./ConstellationEmblem.module.css";

export type ConstellationStage =
  | "hidden"
  | "gather"
  | "connect"
  | "glow"
  | "reveal"
  | "complete";

type Point = {
  x: number;
  y: number;
  fromX: number;
  fromY: number;
  delay: number;
  accent: boolean;
};

type Coordinate = [number, number];

function precise(value: number) {
  return Math.round(value * 1000) / 1000;
}

function circlePoints(cx: number, cy: number, radius: number, count: number) {
  return Array.from({ length: count }, (_, index): Coordinate => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    return [
      precise(cx + Math.cos(angle) * radius),
      precise(cy + Math.sin(angle) * radius),
    ];
  });
}

function segmentPoints(start: Coordinate, end: Coordinate, count: number) {
  return Array.from({ length: count }, (_, index): Coordinate => {
    const progress = count === 1 ? 0 : index / (count - 1);
    return [
      precise(start[0] + (end[0] - start[0]) * progress),
      precise(start[1] + (end[1] - start[1]) * progress),
    ];
  });
}

function polylinePoints(nodes: Coordinate[], pointsPerSegment: number) {
  return nodes.flatMap((node, index) => {
    const next = nodes[index + 1];
    return next ? segmentPoints(node, next, pointsPerSegment) : [];
  });
}

function buildTargetGroups() {
  const outer = [
    ...circlePoints(640, 640, 616, 52),
    ...circlePoints(640, 640, 582, 47),
  ];
  const inner = [
    ...circlePoints(640, 640, 446, 44),
    ...circlePoints(640, 640, 270, 40),
    [108, 598] as Coordinate,
    [1172, 598] as Coordinate,
  ];
  const orbitSegments: Array<[Coordinate, Coordinate]> = [
    [[295, 346], [650, 346]],
    [[796, 214], [932, 555]],
    [[1084, 646], [804, 873]],
    [[758, 1070], [466, 862]],
    [[252, 870], [374, 536]],
  ];
  const orbit = orbitSegments.flatMap(([start, end]) => segmentPoints(start, end, 14));

  const glyphLines: Coordinate[][] = [
    [[456, 492], [548, 492], [548, 434], [584, 434]],
    [[696, 434], [732, 434], [732, 492], [824, 492]],
    [[430, 598], [486, 598]],
    [[448, 658], [486, 658]],
    [[482, 578], [482, 680]],
    [[794, 578], [794, 680]],
    [[794, 598], [850, 598]],
    [[794, 658], [832, 658]],
    [[574, 566], [706, 566], [706, 708], [574, 708], [574, 566]],
    [[456, 780], [548, 780], [548, 842]],
    [[640, 780], [640, 842]],
    [[824, 780], [732, 780], [732, 842]],
  ];
  const glyph = glyphLines.flatMap((line) => polylinePoints(line, 5));
  return [
    { points: outer, baseDelay: 0 },
    { points: inner, baseDelay: 260 },
    { points: orbit, baseDelay: 540 },
    { points: glyph, baseDelay: 820 },
  ];
}

function buildFlightPoints(): Point[] {
  let globalIndex = 0;
  return buildTargetGroups().flatMap((group) =>
    group.points.map(([x, y], groupIndex) => {
      const index = globalIndex++;
      const lane = (index % 12) - 5.5;
      const depth = Math.floor(index / 12);
      return {
        x,
        y,
        fromX: precise(lane * 17 + Math.sin(index * 0.9) * 28),
        fromY: 520 + depth * 9,
        delay: group.baseDelay + (groupIndex % 14) * 24,
        accent: index % 30 === 0,
      };
    }),
  );
}

export function ConstellationEmblem({ stage }: { stage: ConstellationStage }) {
  const points = useMemo(buildFlightPoints, []);

  return (
    <div className={styles.frame} data-stage={stage} aria-hidden="true">
      <svg className={styles.emblem} viewBox="0 0 1280 1280">
        <g className={styles.traces}>
          <circle className={styles.outerTrace} cx="640" cy="640" r="616" pathLength="1" />
          <circle className={styles.outerTrace} cx="640" cy="640" r="582" pathLength="1" />
          <circle className={styles.innerTrace} cx="640" cy="640" r="446" pathLength="1" />
          <circle className={styles.innerTrace} cx="640" cy="640" r="270" pathLength="1" />

          <path className={styles.orbitTrace} d="M 295 346 H 650" pathLength="1" />
          <path className={styles.orbitTrace} d="M 796 214 L 932 555" pathLength="1" />
          <path className={styles.orbitTrace} d="M 1084 646 L 804 873" pathLength="1" />
          <path className={styles.orbitTrace} d="M 758 1070 L 466 862" pathLength="1" />
          <path className={styles.orbitTrace} d="M 252 870 L 374 536" pathLength="1" />

          <path className={styles.glyphTrace} d="M 456 492 H 548 V 434 H 584" pathLength="1" />
          <path className={styles.glyphTrace} d="M 696 434 H 732 V 492 H 824" pathLength="1" />
          <path className={styles.glyphTrace} d="M 430 598 H 486 M 448 658 H 486 M 482 578 V 680" pathLength="1" />
          <path className={styles.glyphTrace} d="M 794 578 V 680 M 794 598 H 850 M 794 658 H 832" pathLength="1" />
          <rect className={styles.glyphTrace} x="574" y="566" width="132" height="142" rx="24" pathLength="1" />
          <path className={styles.glyphTrace} d="M 456 780 H 548 V 842 M 640 780 V 842 M 824 780 H 732 V 842" pathLength="1" />
        </g>

        <g className={styles.drones}>
          {points.map((point, index) => (
            <circle
              key={`${point.x}-${point.y}-${index}`}
              className={point.accent ? styles.accentDrone : styles.drone}
              cx={point.x}
              cy={point.y}
              r={point.accent ? 7 : 4.8}
              style={{
                "--from-x": `${point.fromX}px`,
                "--from-y": `${point.fromY}px`,
                "--drone-delay": `${point.delay}ms`,
              } as React.CSSProperties}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
