"use client";

import { useMemo, useState } from "react";

export type MetricPoint = { date: string; value: number | null };

const CHART_W = 560;
const CHART_H = 140;
const PAD_X = 14;
const PAD_Y = 18;

function formatDateShort(date: string) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function EvolutionChart({
  label,
  unit = "",
  points,
  color,
  format,
  goodDirection = "up",
}: {
  label: string;
  unit?: string;
  points: MetricPoint[];
  color: string;
  format?: (value: number) => string;
  goodDirection?: "up" | "down";
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const fmt = format ?? ((v: number) => `${Math.round(v * 100) / 100}${unit}`);

  const valid = useMemo(
    () => points.filter((p): p is { date: string; value: number } => p.value != null),
    [points]
  );

  const geometry = useMemo(() => {
    if (valid.length < 2) return null;
    const times = valid.map((p) => new Date(p.date).getTime());
    const minT = Math.min(...times);
    const maxT = Math.max(...times);
    const spanT = maxT - minT || 1;

    const values = valid.map((p) => p.value);
    let minV = Math.min(...values);
    let maxV = Math.max(...values);
    if (minV === maxV) {
      minV -= Math.max(1, Math.abs(minV) * 0.1);
      maxV += Math.max(1, Math.abs(maxV) * 0.1);
    } else {
      const pad = (maxV - minV) * 0.12;
      minV -= pad;
      maxV += pad;
    }

    const x = (t: number) => PAD_X + ((t - minT) / spanT) * (CHART_W - PAD_X * 2);
    const y = (v: number) => CHART_H - PAD_Y - ((v - minV) / (maxV - minV)) * (CHART_H - PAD_Y * 2);

    const coords = valid.map((p, i) => ({ cx: x(times[i]), cy: y(p.value), date: p.date, value: p.value }));
    const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.cx},${c.cy}`).join(" ");
    const areaPath = `${linePath} L${coords.at(-1)!.cx},${CHART_H - PAD_Y} L${coords[0].cx},${CHART_H - PAD_Y} Z`;

    return { coords, linePath, areaPath };
  }, [valid]);

  const latest = valid.at(-1) ?? null;
  const prev = valid.length >= 2 ? valid[valid.length - 2] : null;
  const active = geometry && hoverIndex != null ? geometry.coords[hoverIndex] : null;

  const displayedValue = active ? active.value : latest?.value ?? null;
  const displayedDate = active ? active.date : latest?.date ?? null;

  const delta = !active && latest && prev ? latest.value - prev.value : null;
  const deltaGood = delta == null ? null : goodDirection === "up" ? delta > 0 : delta < 0;
  const deltaBad = delta == null ? null : goodDirection === "up" ? delta < 0 : delta > 0;

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-neutral-400">{label}</span>
        {displayedDate && (
          <span className="text-[10px] text-neutral-600">{formatDateShort(displayedDate)}</span>
        )}
      </div>
      <div className="mt-0.5 flex items-baseline gap-2">
        <span className="text-lg font-semibold text-neutral-100">
          {displayedValue != null ? fmt(displayedValue) : "null"}
        </span>
        {delta != null && (
          <span
            className={`text-xs font-medium ${
              deltaGood ? "text-emerald-400" : deltaBad ? "text-red-400" : "text-neutral-500"
            }`}
          >
            {delta > 0 ? "+" : ""}
            {fmt(delta)} vs snapshot anterior
          </span>
        )}
      </div>

      {!geometry ? (
        <p className="mt-3 text-xs text-neutral-600">
          {valid.length === 0
            ? "Nenhum snapshot com esse número ainda."
            : "Só 1 snapshot até agora — precisa de pelo menos 2 pra traçar a evolução."}
        </p>
      ) : (
        <div className="mt-2" style={{ aspectRatio: `${CHART_W} / ${CHART_H}` }}>
          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            className="h-full w-full touch-none"
            onPointerMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const px = ((e.clientX - rect.left) / rect.width) * CHART_W;
              let nearest = 0;
              let best = Infinity;
              geometry.coords.forEach((c, i) => {
                const d = Math.abs(c.cx - px);
                if (d < best) {
                  best = d;
                  nearest = i;
                }
              });
              setHoverIndex(nearest);
            }}
            onPointerLeave={() => setHoverIndex(null)}
          >
            {[0, 0.5, 1].map((t) => (
              <line
                key={t}
                x1={0}
                x2={CHART_W}
                y1={PAD_Y + t * (CHART_H - PAD_Y * 2)}
                y2={PAD_Y + t * (CHART_H - PAD_Y * 2)}
                stroke="#2c2c2a"
                strokeWidth={1}
              />
            ))}
            <path d={geometry.areaPath} fill={color} fillOpacity={0.1} stroke="none" />
            <path d={geometry.linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            {hoverIndex != null && (
              <line
                x1={geometry.coords[hoverIndex].cx}
                x2={geometry.coords[hoverIndex].cx}
                y1={PAD_Y}
                y2={CHART_H - PAD_Y}
                stroke="#52514e"
                strokeWidth={1}
              />
            )}
            {geometry.coords.map((c, i) => (
              <circle
                key={c.date}
                cx={c.cx}
                cy={c.cy}
                r={i === hoverIndex || (hoverIndex == null && i === geometry.coords.length - 1) ? 5 : 3}
                fill={color}
                stroke="#0a0a0a"
                strokeWidth={2}
              />
            ))}
          </svg>
        </div>
      )}
    </div>
  );
}
