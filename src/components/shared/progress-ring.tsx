'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ProgressRingProps {
  value: number;        // 0-100
  size?: number;        // px
  strokeWidth?: number;
  color?: string;       // CSS color
  bgColor?: string;
  label?: string;
  sublabel?: string;
  animate?: boolean;
}

export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 8,
  color = 'hsl(243, 75%, 59%)',
  bgColor = 'hsl(var(--muted))',
  label,
  sublabel,
  animate = true,
}: ProgressRingProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const cappedValue = Math.min(Math.max(animatedValue, 0), 100);
  const offset = circumference - (cappedValue / 100) * circumference;

  // Inner diameter available within the ring stroke
  const innerDiameter = Math.max(0, size - strokeWidth * 2);

  // Scale font sizes proportionally to the ring diameter with balanced typography
  const valueFontSize =
    size <= 44
      ? (Math.round(animatedValue) >= 100 ? 10.5 : 11.5)
      : size <= 60
      ? 15
      : size <= 80
      ? 19
      : size <= 100
      ? 22
      : Math.round(size * 0.21);

  // Dynamically calculate sublabel font size based on string length to guarantee it fits inside the circle chord
  const sublabelFontSize = (() => {
    if (!sublabel) return 9;
    const len = sublabel.length;
    if (size <= 60) return 7.5;
    if (size <= 80) return 8.5;
    
    // For larger rings, start around 9.5-10px and scale down if label is longer (e.g. 'of daily goal')
    let base = Math.min(10, Math.round(size * 0.075));
    if (len > 12) {
      base = Math.min(base, 8.5);
    } else if (len > 9) {
      base = Math.min(base, 9);
    }
    return Math.max(7.5, base);
  })();

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setAnimatedValue(value), 100);
      return () => clearTimeout(timer);
    }
    setAnimatedValue(value);
  }, [value, animate]);

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
        />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none text-center px-1.5"
        style={{
          maxWidth: `${innerDiameter}px`,
          maxHeight: `${innerDiameter}px`,
          margin: 'auto',
        }}
      >
        <motion.div
          className="flex items-baseline justify-center font-bold leading-none tabular-nums"
          style={{ fontSize: `${valueFontSize}px` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {label !== undefined ? (
            typeof label === 'string' && label.endsWith('%') ? (
              <>
                <span className="tracking-tight">{label.slice(0, -1)}</span>
                <span className="text-[0.68em] font-semibold opacity-75 ml-[1px]">%</span>
              </>
            ) : (
              <span>{label}</span>
            )
          ) : (
            <>
              <span className="tracking-tight">{Math.round(animatedValue)}</span>
              <span className="text-[0.68em] font-semibold opacity-75 ml-[1px]">%</span>
            </>
          )}
        </motion.div>
        {sublabel && (
          <span
            className="text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-semibold leading-tight text-center max-w-[90%] truncate"
            style={{ fontSize: `${sublabelFontSize}px`, marginTop: `${Math.max(2, Math.round(size * 0.035))}px` }}
            title={sublabel}
          >
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}

