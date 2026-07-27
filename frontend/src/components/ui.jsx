import React, { useState, useEffect } from "react";
import { motion, animate, AnimatePresence } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

/* ---------------------------------------------------------
   ANIMATED NUMBER — counts up from 0 whenever `value` changes
--------------------------------------------------------- */
export function useAnimatedNumber(target, duration = 1.1) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const controls = animate(0, target, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return value;
}

export function AnimatedNumber({ value, decimals = 0, suffix = "", prefix = "", thousands = false }) {
  const animated = useAnimatedNumber(value);
  let text = animated.toFixed(decimals);
  if (thousands) text = text.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return <>{prefix}{text}{suffix}</>;
}

/* ---------------------------------------------------------
   SHARED UI ATOMS
--------------------------------------------------------- */
export function Pulse() {
  const { theme: C } = useTheme();
  return (
    <svg width="120" height="28" viewBox="0 0 120 28" fill="none">
      <path
        d="M0 14 H30 L36 4 L44 24 L50 14 H62 L68 8 L74 20 L80 14 H120"
        stroke={C.teal}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RiskBadge({ score }) {
  const { theme: C } = useTheme();
  let band, fg, bg;
  if (score >= 0.6) { band = "High"; fg = C.high; bg = C.highPale; }
  else if (score >= 0.35) { band = "Moderate"; fg = C.mod; bg = C.modPale; }
  else { band = "Low"; fg = C.low; bg = C.lowPale; }
  return (
    <motion.span
      key={band}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        color: fg, background: bg, fontFamily: C.mono, fontSize: 12,
        fontWeight: 600, padding: "3px 9px", borderRadius: 999, letterSpacing: 0.3,
        display: "inline-block",
      }}
    >
      {band}
    </motion.span>
  );
}

export function Card({ children, style, noHover, delay = 0 }) {
  const { theme: C } = useTheme();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      whileHover={noHover ? undefined : { y: -3, boxShadow: C.shadowMd }}
      style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
        padding: 20, boxShadow: C.shadowSm, ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

export function SectionLabel({ children }) {
  const { theme: C } = useTheme();
  return (
    <div style={{
      fontFamily: C.mono, fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase",
      color: C.inkFaint, marginBottom: 10, fontWeight: 600,
    }}>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------
   ANIMATED MEDICAL BACKGROUND
--------------------------------------------------------- */
export function BackgroundFX() {
  const { theme: C } = useTheme();
  const ecgSvg = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='340' height='60' viewBox='0 0 340 60'>` +
    `<path d='M0 30 H60 L72 8 L86 52 L98 30 H140 L150 18 L160 42 L170 30 H340' ` +
    `fill='none' stroke='${C.teal}' stroke-opacity='0.5' stroke-width='1.6'/></svg>`
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage:
          `linear-gradient(${C.teal}12 1px, transparent 1px), linear-gradient(90deg, ${C.teal}12 1px, transparent 1px)`,
        backgroundSize: "42px 42px",
        maskImage: "radial-gradient(ellipse 75% 55% at 50% 10%, black 30%, transparent 85%)",
        WebkitMaskImage: "radial-gradient(ellipse 75% 55% at 50% 10%, black 30%, transparent 85%)",
      }} />

      <div style={{
        position: "absolute", width: 420, height: 420, top: -140, right: -120,
        borderRadius: "50%", filter: "blur(70px)", background: `${C.teal}20`,
        animation: "fxBreatheA 10s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", width: 380, height: 380, bottom: -160, left: -100,
        borderRadius: "50%", filter: "blur(70px)", background: `${C.mod}18`,
        animation: "fxBreatheB 13s ease-in-out infinite",
      }} />

      <div style={{ position: "absolute", left: 0, top: "16%", width: "200%", height: 60, display: "flex", animation: "fxScroll 22s linear infinite" }}>
        <div style={{ width: "50%", height: "100%", flexShrink: 0, backgroundRepeat: "repeat-x", backgroundSize: "340px 60px", backgroundImage: `url("data:image/svg+xml,${ecgSvg}")` }} />
        <div style={{ width: "50%", height: "100%", flexShrink: 0, backgroundRepeat: "repeat-x", backgroundSize: "340px 60px", backgroundImage: `url("data:image/svg+xml,${ecgSvg}")` }} />
      </div>
      <div style={{ position: "absolute", left: 0, top: "74%", width: "200%", height: 60, opacity: 0.55, display: "flex", animation: "fxScroll 30s linear infinite reverse" }}>
        <div style={{ width: "50%", height: "100%", flexShrink: 0, backgroundRepeat: "repeat-x", backgroundSize: "340px 60px", backgroundImage: `url("data:image/svg+xml,${ecgSvg}")` }} />
        <div style={{ width: "50%", height: "100%", flexShrink: 0, backgroundRepeat: "repeat-x", backgroundSize: "340px 60px", backgroundImage: `url("data:image/svg+xml,${ecgSvg}")` }} />
      </div>

      <style>{`
        @keyframes fxScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes fxBreatheA { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.18); opacity: 0.85; } }
        @keyframes fxBreatheB { 0%, 100% { transform: scale(1); opacity: 0.45; } 50% { transform: scale(1.15); opacity: 0.8; } }
      `}</style>
    </div>
  );
}

/* ---------------------------------------------------------
   DARK MODE TOGGLE
--------------------------------------------------------- */
export function ThemeToggle() {
  const { theme: C, mode, toggle } = useTheme();
  return (
    <motion.button
      onClick={toggle}
      whileHover={{ scale: 1.05, borderColor: C.teal }}
      whileTap={{ scale: 0.92 }}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border}`,
        background: C.surfaceAlt, cursor: "pointer", color: C.inkMuted,
        overflow: "hidden", position: "relative",
      }}
      aria-label="Toggle dark mode"
      title={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={mode}
          initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          style={{ display: "flex" }}
        >
          {mode === "light" ? <Moon size={14} strokeWidth={2} /> : <Sun size={14} strokeWidth={2} />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
