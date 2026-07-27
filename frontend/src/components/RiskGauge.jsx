import React from "react";
import { useTheme } from "../context/ThemeContext";
import { useAnimatedNumber } from "./ui";

// Real thresholds the backend uses (see risk_band() in main.py)
const LOW_CUTOFF = 0.35;
const HIGH_CUTOFF = 0.60;

// Speedometer shape: sweeps 240° total, leaving a 120° gap at the
// bottom (from START_DEG to END_DEG going the *short* way through
// the bottom is empty — the arc goes the long way, over the top).
// This guarantees the arc's lowest points sit well above center,
// leaving clear open space below for the percentage and label text.
const START_DEG = -210; // lower-left
const END_DEG = 30;     // lower-right
const SWEEP = END_DEG - START_DEG; // 240

function angleFor(fraction) {
  return START_DEG + fraction * SWEEP;
}

export function RiskGauge({ score }) {
  const { theme: C } = useTheme();
  const animatedScore = useAnimatedNumber(score, 1.0);
  const r = 76, cx = 130, cy = 96;

  const toXY = (deg) => {
    const rad = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };

  const arc = (startDeg, endDeg, color) => {
    const [x1, y1] = toXY(startDeg);
    const [x2, y2] = toXY(endDeg);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return (
      <path
        key={`${startDeg}-${endDeg}`}
        d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
        stroke={color} strokeWidth="15" fill="none" strokeLinecap="butt"
      />
    );
  };

  const needleDeg = angleFor(animatedScore);
  const needleRad = (needleDeg * Math.PI) / 180;
  const nx = cx + (r - 10) * Math.cos(needleRad);
  const ny = cy + (r - 10) * Math.sin(needleRad);

  let label, color;
  if (animatedScore >= HIGH_CUTOFF) { label = "High risk"; color = C.high; }
  else if (animatedScore >= LOW_CUTOFF) { label = "Moderate risk"; color = C.mod; }
  else { label = "Low risk"; color = C.low; }

  return (
    <svg width="260" height="220" viewBox="0 0 260 220">
      {arc(angleFor(0), angleFor(LOW_CUTOFF), C.low)}
      {arc(angleFor(LOW_CUTOFF), angleFor(HIGH_CUTOFF), C.mod)}
      {arc(angleFor(HIGH_CUTOFF), angleFor(1), C.high)}

      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={C.ink} strokeWidth="3" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="5" fill={C.ink} />

      {/* Positioned well clear of the arc's lowest point (cy + r/2),
          in the open gap this shape leaves at the bottom. */}
      <text x={cx} y={cy + 62} textAnchor="middle" fontFamily={C.mono} fontSize="32" fontWeight="700" fill={color}>
        {(animatedScore * 100).toFixed(0)}%
      </text>
      <text x={cx} y={cy + 85} textAnchor="middle" fontFamily={C.sans} fontSize="13" fontWeight="600" fill={color}>
        {label}
      </text>
    </svg>
  );
}
