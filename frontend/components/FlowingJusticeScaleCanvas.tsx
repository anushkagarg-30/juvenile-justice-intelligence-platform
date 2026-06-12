"use client";

import { useEffect, useRef } from "react";

type Node = {
  bx: number;
  by: number;
  sx: number;
  sy: number;
  phase: number;
  sway: boolean;
};

type Edge = [number, number];

type BuiltScale = {
  nodes: Node[];
  edges: Edge[];
  pivotIndex: number;
  cy: number;
};

/** Wireframe justice scale — nodes + edges for DNA-style flowing animation. */
function buildScale(cx: number, cy: number, size: number): BuiltScale {
  const s = size;
  const raw: { x: number; y: number; sx: number; sy: number; sway: boolean }[] = [];
  const edges: Edge[] = [];
  let idx = 0;

  const add = (x: number, y: number, sx: number, sy: number, sway = false) => {
    raw.push({ x, y, sx, sy, sway });
    return idx++;
  };

  const line = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    n: number,
    scatter: [number, number][],
    sway = false,
  ) => {
    const start = idx;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const [dsx, dsy] = scatter[i] ?? [0, 0];
      add(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, dsx, dsy, sway);
      if (i > 0) edges.push([start + i - 1, start + i]);
    }
  };

  // Pole
  line(
    cx,
    cy - s * 0.55,
    cx,
    cy + s * 0.35,
    9,
    [
      [-s * 0.9, -s * 0.3],
      [-s * 0.7, s * 0.5],
      [-s * 0.5, -s * 0.6],
      [-s * 0.3, s * 0.7],
      [0, -s * 0.8],
      [s * 0.3, s * 0.6],
      [s * 0.5, -s * 0.5],
      [s * 0.7, s * 0.4],
      [s * 0.85, -s * 0.35],
    ],
  );

  const poleTop = 0;
  const poleBot = 8;

  // Base
  const baseStart = idx;
  line(
    cx - s * 0.45,
    cy + s * 0.35,
    cx + s * 0.45,
    cy + s * 0.35,
    7,
    [
      [-s * 1.1, s * 0.2],
      [-s * 0.6, s * 0.55],
      [-s * 0.2, s * 0.15],
      [0, s * 0.65],
      [s * 0.2, s * 0.2],
      [s * 0.65, s * 0.5],
      [s * 1.05, s * 0.25],
    ],
  );
  edges.push([poleBot, baseStart + 3]);

  // Pivot
  const pivotIndex = add(cx, cy - s * 0.55, s * 0.15, -s * 0.95);
  edges.push([poleTop, pivotIndex]);

  // Beam
  const beamStart = idx;
  line(
    cx - s * 0.48,
    cy - s * 0.38,
    cx + s * 0.48,
    cy - s * 0.38,
    9,
    [
      [-s * 1.0, -s * 0.7],
      [-s * 0.75, s * 0.3],
      [-s * 0.5, -s * 0.55],
      [-s * 0.25, s * 0.45],
      [0, -s * 0.65],
      [s * 0.25, s * 0.4],
      [s * 0.5, -s * 0.5],
      [s * 0.75, s * 0.35],
      [s * 1.0, -s * 0.6],
    ],
    true,
  );
  edges.push([pivotIndex, beamStart + 4]);

  const beamLeft = beamStart;
  const beamRight = beamStart + 8;

  // Left chain + pan
  const lcStart = idx;
  line(
    cx - s * 0.48,
    cy - s * 0.38,
    cx - s * 0.48,
    cy - s * 0.05,
    4,
    [
      [-s * 0.95, -s * 0.5],
      [-s * 0.85, s * 0.35],
      [-s * 0.75, -s * 0.4],
      [-s * 0.7, s * 0.55],
    ],
    true,
  );
  edges.push([beamLeft, lcStart]);

  const panLStart = idx;
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const angle = Math.PI * 0.15 + t * Math.PI * 0.7;
    const px = cx - s * 0.48 + Math.cos(angle) * s * 0.22;
    const py = cy - s * 0.05 + Math.sin(angle) * s * 0.12;
    add(px, py, -s * (0.8 + t * 0.15), s * (0.3 - t * 0.1), true);
    if (i > 0) edges.push([panLStart + i - 1, panLStart + i]);
  }
  edges.push([lcStart + 3, panLStart]);
  edges.push([panLStart, panLStart + 4]);

  // Right chain + pan
  const rcStart = idx;
  line(
    cx + s * 0.48,
    cy - s * 0.38,
    cx + s * 0.48,
    cy - s * 0.05,
    4,
    [
      [s * 0.95, -s * 0.45],
      [s * 0.85, s * 0.4],
      [s * 0.75, -s * 0.35],
      [s * 0.7, s * 0.5],
    ],
    true,
  );
  edges.push([beamRight, rcStart]);

  const panRStart = idx;
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const angle = Math.PI * 0.15 + t * Math.PI * 0.7;
    const px = cx + s * 0.48 - Math.cos(angle) * s * 0.22;
    const py = cy - s * 0.05 + Math.sin(angle) * s * 0.12;
    add(px, py, s * (0.8 + t * 0.15), s * (0.3 - t * 0.1), true);
    if (i > 0) edges.push([panRStart + i - 1, panRStart + i]);
  }
  edges.push([rcStart + 3, panRStart]);
  edges.push([panRStart, panRStart + 4]);

  // DNA-like rungs between pan arcs
  for (let i = 0; i < 3; i++) {
    edges.push([panLStart + i * 2, panRStart + i * 2]);
  }

  const nodes: Node[] = raw.map((p, i) => ({
    bx: p.x,
    by: p.y,
    sx: p.sx,
    sy: p.sy,
    phase: (i / raw.length) * Math.PI * 2,
    sway: p.sway,
  }));

  return { nodes, edges, pivotIndex, cy };
}

type ScaleInstance = {
  cx: number;
  cy: number;
  size: number;
  opacity: number;
  lineWidth: number;
  nodeRadius: number;
  speed: number;
  waveAmp: number;
};

function drawScale(
  ctx: CanvasRenderingContext2D,
  time: number,
  { cx, cy, size, opacity, lineWidth, nodeRadius, speed, waveAmp }: ScaleInstance,
) {
  const { nodes, edges, pivotIndex } = buildScale(cx, cy, size);

  // Smooth loop: assembled ↔ scattered, like DNA strands drifting
  const scatterT = (Math.sin(time * speed * 0.35) + 1) / 2;
  const scatterEase = scatterT * scatterT * (3 - 2 * scatterT);

  const positions = nodes.map((n) => {
    const wave =
      Math.sin(time * speed + n.phase) * waveAmp +
      Math.cos(time * speed * 0.7 + n.phase * 1.3) * waveAmp * 0.45;

    return {
      x: n.bx + n.sx * scatterEase,
      y: n.by + n.sy * scatterEase + wave,
    };
  });

  // Beam + pans sway as one unit when assembled
  const pivot = positions[pivotIndex];
  const beamAngle = Math.sin(time * speed * 0.9) * 0.14 * (1 - scatterEase * 0.6);
  const cos = Math.cos(beamAngle);
  const sin = Math.sin(beamAngle);

  for (let i = 0; i < nodes.length; i++) {
    if (!nodes[i].sway) continue;
    const dx = positions[i].x - pivot.x;
    const dy = positions[i].y - pivot.y;
    positions[i].x = pivot.x + dx * cos - dy * sin;
    positions[i].y = pivot.y + dx * sin + dy * cos;
  }

  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = `rgba(147, 197, 253, ${opacity * 0.6})`;
  for (const [a, b] of edges) {
    ctx.beginPath();
    ctx.moveTo(positions[a].x, positions[a].y);
    ctx.lineTo(positions[b].x, positions[b].y);
    ctx.stroke();
  }

  for (let i = 0; i < positions.length; i++) {
    const pulse = 0.65 + 0.35 * Math.sin(time * speed * 1.4 + nodes[i].phase);
    ctx.beginPath();
    ctx.arc(positions[i].x, positions[i].y, nodeRadius * pulse, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(191, 219, 254, ${opacity * pulse})`;
    ctx.fill();
  }
}

type FlowingJusticeScaleCanvasProps = {
  className?: string;
};

export function FlowingJusticeScaleCanvas({ className }: FlowingJusticeScaleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId = 0;
    const start = performance.now();

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      ctx.clearRect(0, 0, w, h);

      drawScale(ctx, t, {
        cx: w * 0.5,
        cy: h * 0.4,
        size: Math.min(w, h) * 0.42,
        opacity: 0.9,
        lineWidth: 1.3,
        nodeRadius: 3,
        speed: 1.05,
        waveAmp: 7,
      });

      drawScale(ctx, t + 2.8, {
        cx: w * 0.5,
        cy: h * 0.8,
        size: Math.min(w, h) * 0.24,
        opacity: 0.5,
        lineWidth: 0.9,
        nodeRadius: 2.2,
        speed: 0.8,
        waveAmp: 5,
      });

      animationId = requestAnimationFrame(draw);
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}
