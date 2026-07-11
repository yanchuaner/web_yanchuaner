"use client";

import Link from "next/link";
import { ArrowLeft, RotateCcw, Rocket } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { InteractiveStarfield } from "@/components/ui";
import styles from "./StarfieldExperience.module.css";

type FlightState = "idle" | "ignition" | "launching" | "reveal" | "complete";

const SPEED_LINES = [12, 21, 31, 43, 55, 67, 77, 88];
const SPARKS = [0, 1, 2, 3, 4, 5, 6, 7];

export function StarfieldExperience() {
  const [flightState, setFlightState] = useState<FlightState>("idle");
  const [reducedMotion, setReducedMotion] = useState(false);
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
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

    if (reducedMotion) {
      setFlightState("reveal");
      timersRef.current.push(setTimeout(() => setFlightState("complete"), 500));
      return;
    }

    setFlightState("ignition");
    timersRef.current.push(
      setTimeout(() => setFlightState("launching"), 700),
      setTimeout(() => setFlightState("reveal"), 3200),
      setTimeout(() => setFlightState("complete"), 4700),
    );
  };

  const replay = () => {
    clearTimers();
    setFlightState("idle");
  };

  const sequenceActive = flightState !== "idle";
  const messageVisible = flightState === "reveal" || flightState === "complete";

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

      <Link
        href="/"
        className={styles.backButton}
        aria-label="返回首页"
        title="返回首页"
      >
        <ArrowLeft size={20} aria-hidden="true" />
      </Link>

      <header className={styles.missionHeader} aria-hidden={sequenceActive}>
        <p className={styles.missionCode}>YC-01 · YANCHUAN SPACEPORT</p>
        <h1>燕中星港</h1>
        <p>所有远行，都从一次勇敢的点火开始</p>
      </header>

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
      </section>

      <div className={styles.launchZone} aria-hidden={messageVisible}>
        <div className={styles.orbitMarker} aria-hidden="true" />
        <div className={styles.rocketAssembly}>
          <button
            type="button"
            className={styles.rocketButton}
            onClick={launch}
            disabled={sequenceActive}
            aria-label="点火发射"
            title="点火发射"
          >
            <span className={styles.rocketBody}>
              <Rocket size={50} strokeWidth={1.55} aria-hidden="true" />
            </span>
            <span className={styles.flame} aria-hidden="true" />
            <span className={styles.exhaust} aria-hidden="true" />
            <span className={styles.sparks} aria-hidden="true">
              {SPARKS.map((spark) => (
                <span key={spark} style={{ "--spark": spark } as React.CSSProperties} />
              ))}
            </span>
          </button>
        </div>
        <p className={styles.launchHint}>
          {flightState === "idle" ? "点击火箭点火" : "航向设定 · 正在升空"}
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
        {flightState === "ignition" ? "火箭正在点火" : null}
        {flightState === "launching" ? "火箭正在升空" : null}
        {messageVisible ? "愿你奔赴群星，也永远记得从燕川出发" : null}
      </p>
    </main>
  );
}
