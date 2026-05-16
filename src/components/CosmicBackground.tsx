"use client";

import React, { memo } from "react";

/**
 * Extracted global animations to a pure client component.
 * Mounted only on pages that specifically request the cosmic/starfield effect
 * to save GPU memory on standard content pages.
 */
const CosmicBackground = memo(function CosmicBackground() {
  return (
    <>
      {/* 纹理叠加层 */}
      <div className="noise-overlay" />
      {/* 紫色星空背景 */}
      <div className="pointer-events-none absolute inset-0 starfield" />
      {/* 流星层 */}
      <div className="pointer-events-none absolute inset-0 meteor-layer" />
      {/* 星云光晕 */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(124,58,237,0.12),transparent_45%),radial-gradient(circle_at_80%_90%,rgba(167,139,250,0.14),transparent_50%)]" />
    </>
  );
});

export default CosmicBackground;