"use client";

import React, { useState, useEffect, useRef } from "react";
import { useThemeAndLocale } from "../ThemeAndLocaleProvider";

interface BashTerminalProps {
  command?: string;
  lines?: string[];
}

export default function BashTerminal({
  command = "connect --target yc_alumni_port",
  lines,
}: BashTerminalProps) {
  const { locale } = useThemeAndLocale();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [started, setStarted] = useState(false);
  const [typedCommand, setTypedCommand] = useState("");
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [showCursor, setShowCursor] = useState(true);

  const defaultLines = React.useMemo(() => {
    return locale === "zh"
      ? [
          "正在解析域名 yanchuaner.cn ...",
          "[OK] 成功建立与燕中数字母港的星轨加密信道。",
          "[OK] 本地登录安全凭据读取成功。",
          "[OK] 欢迎回来，燕川中学校友！",
          "初始化母港空间仪表盘模块..."
        ]
      : [
          "Resolving domain yanchuaner.cn ...",
          "[OK] Successfully established secure orbit channel to YZ Alumni Port.",
          "[OK] Local authentication credentials loaded.",
          "[OK] Welcome back, Yanchuan High School Alumnus!",
          "Initializing alumni port space dashboard..."
        ];
  }, [locale]);

  const displayLines = React.useMemo(() => {
    return lines || defaultLines;
  }, [lines, defaultLines]);

  // Cursor blinking
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Typing effect
  useEffect(() => {
    if (!started) return;

    setTypedCommand("");
    setTerminalLines([]);
    let charIdx = 0;
    let lineTimer: ReturnType<typeof setInterval> | null = null;

    const typingTimer = setInterval(() => {
      setTypedCommand(command.slice(0, charIdx + 1));
      charIdx++;
      if (charIdx >= command.length) {
        clearInterval(typingTimer);

        let lineIdx = 0;
        lineTimer = setInterval(() => {
          if (lineIdx < displayLines.length) {
            const nextLine = displayLines[lineIdx];
            lineIdx++;
            setTerminalLines((prev) => [...prev, nextLine]);
          } else {
            if (lineTimer) clearInterval(lineTimer);
          }
        }, 500);
      }
    }, 55);

    return () => {
      clearInterval(typingTimer);
      if (lineTimer) clearInterval(lineTimer);
    };
  }, [started, command, displayLines]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-card border border-line bg-surface/85 p-4 font-mono text-[11px] text-brand leading-relaxed shadow-lg backdrop-blur-xl relative overflow-hidden"
    >
      {/* CRT scanlines overlay */}
      <div className="terminal-scanlines pointer-events-none absolute inset-0" />

      {/* Top window decoration */}
      <div className="flex items-center gap-1.5 border-b border-line pb-2 mb-3">
        <span className="h-2 w-2 rounded-full bg-danger/80" />
        <span className="h-2 w-2 rounded-full bg-warning/80" />
        <span className="h-2 w-2 rounded-full bg-success/80" />
        <span className="ml-2 text-[9px] text-main/40 select-none">bash - alumni@yanchuaner.cn</span>
      </div>

      {/* Terminal Content */}
      <div className="space-y-1 select-text">
        <div className="flex items-center">
          <span className="text-accent mr-1.5 select-none">$</span>
          <span>{typedCommand}</span>
          {typedCommand.length < command.length && (
            <span className={`inline-block w-1.5 h-3 bg-brand ${showCursor ? "opacity-100" : "opacity-0"}`} />
          )}
        </div>

        {terminalLines.map((line, idx) => (
          <div key={idx} className="text-main/80 animate-fade-in">
            {line}
          </div>
        ))}

        {typedCommand.length === command.length && terminalLines.length === displayLines.length && (
          <div className="flex items-center">
            <span className="text-accent mr-1.5 select-none">$</span>
            <span className={`inline-block w-1.5 h-3 bg-brand ${showCursor ? "opacity-100" : "opacity-0"}`} />
          </div>
        )}
      </div>
    </div>
  );
}
