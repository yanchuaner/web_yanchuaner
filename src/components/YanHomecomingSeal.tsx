"use client";

import CelestialSphere from "./CelestialSphere";

export default function YanHomecomingSeal({ stamped }: { stamped: boolean }) {
  return (
    <div
      className={`yan-homecoming-seal ${stamped ? "yan-homecoming-seal--stamped" : ""}`}
      aria-hidden="true"
    >
      <div className="yan-homecoming-seal__sphere">
        <CelestialSphere size={520} interactive={false} variant="hero" density="quiet" glyphScale={0.8} />
      </div>
      <div className="yan-homecoming-seal__flow" role="presentation">
        <span className="yan-homecoming-seal__flow-line flow-a" />
        <span className="yan-homecoming-seal__flow-line flow-b" />
        <span className="yan-homecoming-seal__flow-line flow-c" />
      </div>
    </div>
  );
}
