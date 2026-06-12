"use client";

import { useId } from "react";
import { motion } from "framer-motion";

export function PlatformScaleBackdrop() {
  const uid = useId().replace(/:/g, "");
  const scaleGrad = `scaleGrad-${uid}`;
  const panGrad = `panGrad-${uid}`;

  return (
    <>
      <div className="absolute inset-0 grid-pattern opacity-40" />
      <div className="absolute left-[55%] top-16 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />

      <motion.div
        className="absolute left-[55%] top-24 -translate-x-1/2 opacity-[0.28] md:opacity-[0.26]"
        animate={{ rotate: [-4, 4, -4], y: [0, -8, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width={520} height={440} viewBox="0 0 420 360" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="210" y1="40" x2="210" y2="280" stroke={`url(#${scaleGrad})`} strokeWidth="4" />
          <line x1="110" y1="280" x2="310" y2="280" stroke={`url(#${scaleGrad})`} strokeWidth="4" />
          <circle cx="210" cy="40" r="10" fill={`url(#${scaleGrad})`} />
          <motion.g
            animate={{ rotate: [-6, 6, -6] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "210px 90px" }}
          >
            <line x1="90" y1="90" x2="330" y2="90" stroke={`url(#${scaleGrad})`} strokeWidth="3" />
            <line x1="90" y1="90" x2="90" y2="150" stroke={`url(#${scaleGrad})`} strokeWidth="2" />
            <line x1="330" y1="90" x2="330" y2="150" stroke={`url(#${scaleGrad})`} strokeWidth="2" />
            <path d="M60 150 Q90 190 120 150 Z" fill={`url(#${panGrad})`} stroke={`url(#${scaleGrad})`} strokeWidth="2" />
            <path d="M300 150 Q330 190 360 150 Z" fill={`url(#${panGrad})`} stroke={`url(#${scaleGrad})`} strokeWidth="2" />
          </motion.g>
          <defs>
            <linearGradient id={scaleGrad} x1="0" y1="0" x2="420" y2="360">
              <stop stopColor="#60A5FA" stopOpacity="0.9" />
              <stop offset="1" stopColor="#A78BFA" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id={panGrad} x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#93C5FD" stopOpacity="0.55" />
              <stop offset="1" stopColor="#C4B5FD" stopOpacity="0.25" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background/50 to-transparent" />
    </>
  );
}
