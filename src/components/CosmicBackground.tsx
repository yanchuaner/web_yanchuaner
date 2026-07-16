"use client";

import React, { memo } from "react";

/** Theme-aware hero atmosphere: night sky in dark mode, orbital chart in light. */
const CosmicBackground = memo(function CosmicBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="cosmic-theme-glow absolute inset-0" />
      <div className="cosmic-night-chart absolute inset-0">
        <span className="cosmic-night-route cosmic-night-route-a" />
        <span className="cosmic-night-route cosmic-night-route-b" />
        <span className="cosmic-night-node cosmic-night-node-a" />
        <span className="cosmic-night-node cosmic-night-node-b" />
        <span className="cosmic-night-node cosmic-night-node-c" />
        <span className="cosmic-night-node cosmic-night-node-d" />
      </div>
      <div className="cosmic-daylight-chart absolute inset-0">
        <span className="cosmic-daylight-orbit cosmic-daylight-orbit-a" />
        <span className="cosmic-daylight-orbit cosmic-daylight-orbit-b" />
        <span className="cosmic-daylight-axis" />
        <span className="cosmic-daylight-node cosmic-daylight-node-a" />
        <span className="cosmic-daylight-node cosmic-daylight-node-b" />
        <span className="cosmic-daylight-node cosmic-daylight-node-c" />
      </div>
      <div className="meteor-layer absolute inset-0" />
    </div>
  );
});

export default CosmicBackground;
