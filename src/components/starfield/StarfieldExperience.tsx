"use client";

import Link from "next/link";
import { ArrowLeft, FastForward, RotateCcw, Rocket } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { InteractiveStarfield } from "@/components/ui";
import {
  ConstellationEmblem,
  type ConstellationStage,
} from "./ConstellationEmblem";
import { RocketWorkshop, type WorkshopStage } from "./RocketWorkshop";
import styles from "./StarfieldExperience.module.css";

type FlightState =
  | "idle"
  | "personGather"
  | "personAwake"
  | "starReach"
  | "starCatch"
  | "personTurn"
  | "bendStart"
  | "bendDeep"
  | "rocketEngine"
  | "rocketBody"
  | "rocketDetails"
  | "welding"
  | "standUp"
  | "rocketReady"
  | "personDissolve"
  | "ignition"
  | "launching"
  | "constellationGather"
  | "constellationConnect"
  | "constellationGlow"
  | "reveal"
  | "complete";

const SPEED_LINES = [12, 21, 31, 43, 55, 67, 77, 88];
const LAUNCH_COUNT_KEY = "yc-starfield-launch-count";
const PERFORMANCE_TIMELINE = {
  personAwake: 5500,
  starReach: 8000,
  starCatch: 10000,
  personTurn: 14000,
  bendStart: 16000,
  bendDeep: 18000,
  rocketEngine: 23000,
  rocketBody: 25000,
  rocketDetails: 27500,
  welding: 29000,
  standUp: 31000,
  rocketReady: 33000,
  personDissolve: 35000,
  ignition: 39000,
  launching: 42000,
  constellationGather: 45000,
  constellationConnect: 47000,
  constellationGlow: 49000,
  reveal: 50000,
  complete: 52000,
} as const;

const NARRATIVE_LINES: Partial<Record<FlightState, string>> = {
  personGather: "最初，只是仰望。",
  starCatch: "后来，我们试着接住一束光。",
  bendDeep: "把遥远的想象，亲手变成方向。",
  standUp: "有些梦想，从来不是一个人的远方。",
  rocketReady: "有些梦想，从来不是一个人的远方。",
  personDissolve: "我们把自己，也写进了航程。",
  constellationGather: "散作群星，仍在同一片天空相逢。",
  constellationConnect: "散作群星，仍在同一片天空相逢。",
};

export function StarfieldExperience() {
  const [flightState, setFlightState] = useState<FlightState>("idle");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [launchCount, setLaunchCount] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const stored = Number.parseInt(window.localStorage.getItem(LAUNCH_COUNT_KEY) || "0", 10);
    const count = Number.isFinite(stored) && stored > 0 ? stored : 0;
    setLaunchCount(count);
    setCanSkip(count > 0);
  }, []);

  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
  }, []);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const launch = () => {
    if (flightState !== "idle") return;
    clearTimers();
    const nextLaunchCount = launchCount + 1;
    setLaunchCount(nextLaunchCount);
    window.localStorage.setItem(LAUNCH_COUNT_KEY, String(nextLaunchCount));

    if (reducedMotion) {
      setFlightState("reveal");
      timersRef.current.push(setTimeout(() => {
        setFlightState("complete");
        setCanSkip(true);
      }, 500));
      return;
    }

    setFlightState("personGather");
    timersRef.current.push(
      setTimeout(() => setFlightState("personAwake"), PERFORMANCE_TIMELINE.personAwake),
      setTimeout(() => setFlightState("starReach"), PERFORMANCE_TIMELINE.starReach),
      setTimeout(() => setFlightState("starCatch"), PERFORMANCE_TIMELINE.starCatch),
      setTimeout(() => setFlightState("personTurn"), PERFORMANCE_TIMELINE.personTurn),
      setTimeout(() => setFlightState("bendStart"), PERFORMANCE_TIMELINE.bendStart),
      setTimeout(() => setFlightState("bendDeep"), PERFORMANCE_TIMELINE.bendDeep),
      setTimeout(() => setFlightState("rocketEngine"), PERFORMANCE_TIMELINE.rocketEngine),
      setTimeout(() => setFlightState("rocketBody"), PERFORMANCE_TIMELINE.rocketBody),
      setTimeout(() => setFlightState("rocketDetails"), PERFORMANCE_TIMELINE.rocketDetails),
      setTimeout(() => setFlightState("welding"), PERFORMANCE_TIMELINE.welding),
      setTimeout(() => setFlightState("standUp"), PERFORMANCE_TIMELINE.standUp),
      setTimeout(() => setFlightState("rocketReady"), PERFORMANCE_TIMELINE.rocketReady),
      setTimeout(() => setFlightState("personDissolve"), PERFORMANCE_TIMELINE.personDissolve),
      setTimeout(() => setFlightState("ignition"), PERFORMANCE_TIMELINE.ignition),
      setTimeout(() => setFlightState("launching"), PERFORMANCE_TIMELINE.launching),
      setTimeout(() => setFlightState("constellationGather"), PERFORMANCE_TIMELINE.constellationGather),
      setTimeout(() => setFlightState("constellationConnect"), PERFORMANCE_TIMELINE.constellationConnect),
      setTimeout(() => setFlightState("constellationGlow"), PERFORMANCE_TIMELINE.constellationGlow),
      setTimeout(() => setFlightState("reveal"), PERFORMANCE_TIMELINE.reveal),
      setTimeout(() => {
        setFlightState("complete");
        setCanSkip(true);
      }, PERFORMANCE_TIMELINE.complete),
    );
  };

  const replay = () => {
    clearTimers();
    setFlightState("idle");
  };

  const skipSequence = () => {
    clearTimers();
    setFlightState("complete");
    setCanSkip(true);
  };

  const sequenceActive = flightState !== "idle";
  const messageVisible = flightState === "reveal" || flightState === "complete";
  const launchFinished =
    flightState === "constellationGather" ||
    flightState === "constellationConnect" ||
    flightState === "constellationGlow" ||
    messageVisible;
  const workshopStage: WorkshopStage =
    flightState === "personGather"
      ? "personGather"
      : flightState === "personAwake"
        ? "awaken"
        : flightState === "starReach"
          ? "reach"
        : flightState === "starCatch"
          ? "catch"
          : flightState === "personTurn"
            ? "turn"
            : flightState === "bendStart"
              ? "bendStart"
              : flightState === "bendDeep"
                ? "bendDeep"
                : flightState === "rocketEngine"
                  ? "engine"
                  : flightState === "rocketBody"
                    ? "body"
                    : flightState === "rocketDetails"
                      ? "details"
            : flightState === "welding"
              ? "welding"
              : flightState === "standUp"
                ? "standUp"
                : flightState === "rocketReady"
                  ? "ready"
                : flightState === "personDissolve"
                  ? "dissolve"
                  : flightState === "ignition"
                    ? "ignition"
                    : flightState === "launching"
                      ? "launching"
                      : launchFinished
                        ? "departed"
                        : "hidden";
  const constellationStage: ConstellationStage =
    flightState === "constellationGather"
      ? "gather"
      : flightState === "constellationConnect"
        ? "connect"
        : flightState === "constellationGlow"
          ? "glow"
          : flightState === "reveal"
            ? "reveal"
            : flightState === "complete"
              ? "complete"
              : "hidden";

  return (
    <main
      id="main"
      className={styles.scene}
      data-flight-state={flightState}
    >
      <InteractiveStarfield />

      <div className={styles.deepSpace} aria-hidden="true" />
      <div className={styles.speedLines} aria-hidden="true">
        {SPEED_LINES.map((left, index) => (
          <span
            key={left}
            style={{
              "--line-left": `${left}%`,
              "--line-delay": `${index * 70}ms`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <RocketWorkshop stage={workshopStage} />
      <ConstellationEmblem stage={constellationStage} />

      <Link
        href="/"
        className={styles.backButton}
        aria-label="返回首页"
        title="返回首页"
      >
        <ArrowLeft size={20} aria-hidden="true" />
      </Link>

      {canSkip && sequenceActive && !messageVisible ? (
        <button
          type="button"
          className={styles.skipButton}
          onClick={skipSequence}
          aria-label="跳过演出"
          title="跳过演出"
        >
          <FastForward size={20} aria-hidden="true" />
        </button>
      ) : null}

      <header className={styles.missionHeader} aria-hidden={sequenceActive}>
        <p className={styles.missionCode}>YC-01 · YANCHUAN SPACEPORT</p>
        <h1>燕中星港</h1>
        <p>所有远行，都从一次勇敢的点火开始</p>
      </header>

      {NARRATIVE_LINES[flightState] ? (
        <p
          key={NARRATIVE_LINES[flightState]}
          className={styles.narrativeLine}
          aria-live="polite"
        >
          {NARRATIVE_LINES[flightState]}
        </p>
      ) : null}

      <section
        className={styles.message}
        aria-hidden={!messageVisible}
        aria-live="polite"
      >
        <p className={styles.messageEyebrow}>TO EVERY YANCHUAN GRADUATE</p>
        <h2>
          <span>愿你奔赴群星</span>
          <span>也永远记得从燕川出发</span>
        </h2>
        <p className={styles.signature}>深圳市燕川中学 · 燕中校友汇</p>
        <p className={styles.flightRecord}>第 {launchCount} 次从燕中星港出发</p>
      </section>

      <div className={styles.launchZone} aria-hidden={sequenceActive}>
        <div className={styles.orbitMarker} aria-hidden="true" />
        <button
          type="button"
          className={styles.launchControl}
          onClick={launch}
          disabled={sequenceActive}
          aria-label="启动星港演出"
          title="启动星港演出"
        >
          <Rocket size={42} strokeWidth={1.55} aria-hidden="true" />
        </button>
        <p className={styles.launchHint}>
          点击启动星港
        </p>
      </div>

      <div className={styles.horizon} aria-hidden="true">
        <span />
      </div>

      {flightState === "complete" ? (
        <button
          type="button"
          className={styles.replayButton}
          onClick={replay}
          aria-label="重新发射"
          title="重新发射"
        >
          <RotateCcw size={20} aria-hidden="true" />
        </button>
      ) : null}

      <p className="sr-only" aria-live="assertive">
        {flightState === "personGather" ? "星光正在组成一位仰望天空的少年" : null}
        {flightState === "personAwake" ? "少年抬头望向远方的星光" : null}
        {flightState === "starReach" ? "少年缓缓伸手靠近星光" : null}
        {flightState === "starCatch" ? "少年伸手接住一颗星" : null}
        {flightState === "personTurn" ? "少年带着星光转向工作台" : null}
        {flightState === "bendStart" ? "少年开始屈膝俯身" : null}
        {flightState === "bendDeep" ? "少年俯身准备建造火箭" : null}
        {flightState === "rocketEngine" ? "星光正在组成火箭发动机" : null}
        {flightState === "rocketBody" ? "星光正在组成火箭箭体" : null}
        {flightState === "rocketDetails" ? "火箭舷窗和尾翼正在成形" : null}
        {flightState === "welding" ? "少年俯身点亮火箭" : null}
        {flightState === "standUp" ? "少年正在缓慢起身" : null}
        {flightState === "rocketReady" ? "火箭已经整装待发" : null}
        {flightState === "personDissolve" ? "少年化作星流汇入火箭" : null}
        {flightState === "ignition" ? "火箭正在点火" : null}
        {flightState === "launching" ? "火箭正在升空" : null}
        {flightState === "constellationGather" ? "星光正在汇聚" : null}
        {flightState === "constellationConnect" ? "会徽轮廓正在连接" : null}
        {flightState === "constellationGlow" ? "星座会徽已经点亮" : null}
        {messageVisible ? "愿你奔赴群星，也永远记得从燕川出发" : null}
      </p>
    </main>
  );
}
