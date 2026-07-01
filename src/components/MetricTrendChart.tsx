import React, { useMemo, useState, useRef, useEffect } from "react";
import { ColumnMetric } from "../types";
import { isMissing } from "../utils";
import { Sparkles, TrendingUp, TrendingDown, Info, ShieldCheck, AlertCircle } from "lucide-react";

interface MetricTrendChartProps {
  columnName: string;
  metric: ColumnMetric;
  rows: any[];
}

export const MetricTrendChart: React.FC<MetricTrendChartProps> = ({ columnName, metric, rows }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    rowIndex: number;
    value: number;
    isOutlier: boolean;
    isMissing: boolean;
    x: number;
    y: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 160 });

  // Update dimensions responsively
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      // Keep height relative but bounded
      setDimensions({
        width: Math.max(120, width),
        height: 160
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute points and trendline
  const chartData = useMemo(() => {
    if (!rows.length) return { points: [], minVal: 0, maxVal: 0, trendSlope: 0, regressionLine: [] };

    // 1. Gather values and indices in sequence
    const parsedPoints = rows.map((row, idx) => {
      const val = row[columnName];
      let parsed = NaN;
      const isMissingVal = isMissing(val);
      if (!isMissingVal) {
        parsed = Number(String(val).trim().replace(/[\$,]/g, ""));
      }
      // If NaN or missing, fallback to median or mean so chart doesn't break
      const finalVal = isNaN(parsed) ? (metric.median ?? metric.mean ?? 0) : parsed;
      return {
        rowIndex: idx,
        value: finalVal,
        isMissing: isMissingVal,
        isOutlier: metric.outlierIndexes?.includes(idx) ?? false,
      };
    });

    // Determine Y scale range (with 10% breathing room on both sides)
    const rawMin = metric.min ?? Math.min(...parsedPoints.map(p => p.value));
    const rawMax = metric.max ?? Math.max(...parsedPoints.map(p => p.value));
    const range = rawMax - rawMin;
    const padding = range === 0 ? 1 : range * 0.12;
    const minVal = rawMin - padding;
    const maxVal = rawMax + padding;

    // 2. Perform Linear Regression (y = m * x + c)
    const n = parsedPoints.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    parsedPoints.forEach((p) => {
      const x = p.rowIndex;
      const y = p.value;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });

    const meanX = sumX / n;
    const meanY = sumY / n;
    
    // Calculate slope (m) and intercept (c)
    let slope = 0;
    let num = sumXY - n * meanX * meanY;
    let den = sumXX - n * meanX * meanX;
    if (den !== 0) {
      slope = num / den;
    }
    const intercept = meanY - slope * meanX;

    // Compute regression points at beginning, middle, and end
    const regressionPoints = [
      { rowIndex: 0, value: intercept },
      { rowIndex: Math.floor(n / 2), value: intercept + slope * Math.floor(n / 2) },
      { rowIndex: n - 1, value: intercept + slope * (n - 1) },
    ];

    return {
      points: parsedPoints,
      minVal,
      maxVal,
      trendSlope: slope,
      regressionLine: regressionPoints,
    };
  }, [rows, columnName, metric]);

  const { points, minVal, maxVal, trendSlope, regressionLine } = chartData;

  if (points.length === 0) {
    return (
      <div className="h-[160px] flex items-center justify-center text-slate-400 font-sans text-xs">
        No dataset rows to draw trend line.
      </div>
    );
  }

  // Coordinates helper
  const paddingX = 40;
  const paddingY = 15;
  const chartWidth = dimensions.width - paddingX * 2;
  const chartHeight = dimensions.height - paddingY * 2;

  const getCoordinates = (rowIndex: number, value: number) => {
    const x = paddingX + (rowIndex / (points.length - 1 || 1)) * chartWidth;
    // Map Y: maxVal goes to top (paddingY), minVal goes to bottom (paddingY + chartHeight)
    const yRange = maxVal - minVal || 1;
    const y = paddingY + chartHeight - ((value - minVal) / yRange) * chartHeight;
    return { x, y };
  };

  // Build points map for fast SVG coordinates
  const svgPoints = points.map((p) => ({
    ...p,
    ...getCoordinates(p.rowIndex, p.value),
  }));

  // Build polyline actual values string
  const actualLinePath = svgPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  // Build dashed regression trend line starting at end indices
  const regressionDPath = regressionLine
    .map((p) => {
      const coords = getCoordinates(p.rowIndex, p.value);
      return `${coords.x.toFixed(1)},${coords.y.toFixed(1)}`;
    })
    .join(" ");

  // Normal boundaries shading (using IQR Fences)
  let iqrBand: React.ReactNode = null;
  const hasFences = metric.lowerFence !== undefined && metric.upperFence !== undefined;
  if (hasFences) {
    const lowerCoords = getCoordinates(0, metric.lowerFence!);
    const upperCoords = getCoordinates(0, metric.upperFence!);
    
    // Clamped Y values for visual aesthetics
    const clampedYUpper = Math.min(paddingY + chartHeight, Math.max(paddingY, upperCoords.y));
    const clampedYLower = Math.min(paddingY + chartHeight, Math.max(paddingY, lowerCoords.y));
    const bandHeight = clampedYLower - clampedYUpper;

    if (bandHeight > 0) {
      iqrBand = (
        <rect
          x={paddingX}
          y={clampedYUpper}
          width={chartWidth}
          height={bandHeight}
          fill="rgba(99, 102, 241, 0.04)"
          stroke="rgba(99, 102, 241, 0.08)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      );
    }
  }

  // Mouse interactivity to retrieve closest point quickly
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - paddingX;
    
    // Calculate closest index based on X location
    const relativeXRatio = mouseX / chartWidth;
    let closestIndex = Math.round(relativeXRatio * (points.length - 1));
    closestIndex = Math.max(0, Math.min(points.length - 1, closestIndex));

    const pt = svgPoints[closestIndex];
    if (pt) {
      setHoveredPoint({
        rowIndex: pt.rowIndex,
        value: pt.value,
        isOutlier: pt.isOutlier,
        isMissing: pt.isMissing,
        x: pt.x,
        y: pt.y,
      });
    }
  };

  // Determine slope text
  const isUpward = trendSlope > 0.0001;
  const isDownward = trendSlope < -0.0001;
  const isStable = !isUpward && !isDownward;

  return (
    <div className="space-y-3" ref={containerRef}>
      {/* Header Info Banner containing computed trend metrics */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-black/30 p-2.5 rounded-lg border border-white/5">
        <div className="flex items-center gap-2">
          {isUpward ? (
            <div className="p-1.5 bg-emerald-500/10 rounded border border-emerald-500/25">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          ) : isDownward ? (
            <div className="p-1.5 bg-rose-500/10 rounded border border-rose-500/25">
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            </div>
          ) : (
            <div className="p-1.5 bg-slate-500/15 rounded border border-white/5">
              <Info className="w-3.5 h-3.5 text-slate-350" />
            </div>
          )}
          <div>
            <span className="text-[10px] font-sans text-slate-400 uppercase tracking-widest block font-semibold">
              Computed Dataset Trend
            </span>
            <span className="text-xs font-sans font-bold text-white leading-tight block">
              {isUpward ? (
                <span className="text-emerald-400">Upward Trend Slope</span>
              ) : isDownward ? (
                <span className="text-rose-400">Downward Trend Slope</span>
              ) : (
                <span className="text-slate-300">Flat / Horizontal Variance</span>
              )}
              {trendSlope !== 0 && (
                <span className="text-slate-400 font-mono font-medium text-[10px] ml-1.5">
                  ({trendSlope > 0 ? "+" : ""}{trendSlope.toFixed(4)} per row)
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Quick details counts */}
        <div className="flex gap-4 text-center">
          <div>
            <span className="text-[9px] font-sans text-slate-500 block uppercase">Normal IQR Bound</span>
            <span className="text-[10.5px] font-mono text-indigo-300 font-semibold">
              {metric.lowerFence !== undefined ? metric.lowerFence.toFixed(1) : "-"} to {metric.upperFence !== undefined ? metric.upperFence.toFixed(1) : "-"}
            </span>
          </div>
          <div className="border-l border-white/10 pl-4">
            <span className="text-[9px] font-sans text-slate-500 block uppercase">Outliers Flagged</span>
            <span className={`text-[10.5px] font-mono font-bold ${metric.outlierIndexes?.length ? "text-rose-400" : "text-emerald-400"}`}>
              {metric.outlierIndexes?.length ?? 0} ({((metric.outlierIndexes?.length ?? 0) / points.length * 100).toFixed(0)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Actual interactive SVG container */}
      <div className="relative bg-slate-900/45 rounded-xl border border-white/5 p-1 select-none">
        <svg
          width="100%"
          height={dimensions.height}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredPoint(null)}
          className="overflow-visible cursor-crosshair pointer-events-auto"
        >
          {/* 1. Shaded healthy/normal range (IQR Fences) */}
          {iqrBand}

          {/* 2. Grid lines representing middle / bounds */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={dimensions.width - paddingX}
            y2={paddingY}
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="1"
          />
          <line
            x1={paddingX}
            y1={paddingY + chartHeight}
            x2={dimensions.width - paddingX}
            y2={paddingY + chartHeight}
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="1"
          />
          <line
            x1={paddingX}
            y1={paddingY + chartHeight / 2}
            x2={dimensions.width - paddingX}
            y2={paddingY + chartHeight / 2}
            stroke="rgba(255,255,255,0.04)"
            strokeDasharray="2 2"
            strokeWidth="1"
          />

          {/* Y Axis min/max labels */}
          <text
            x={paddingX - 10}
            y={paddingY + 4}
            textAnchor="end"
            className="fill-slate-500 font-mono text-[9px] font-medium"
          >
            {maxVal.toFixed(1)}
          </text>
          <text
            x={paddingX - 10}
            y={paddingY + chartHeight + 3}
            textAnchor="end"
            className="fill-slate-500 font-mono text-[9px] font-medium"
          >
            {minVal.toFixed(1)}
          </text>

          {/* 3. Regression trend line (Gold / dashed) */}
          {regressionDPath && (
            <polyline
              points={regressionDPath}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              className="opacity-75"
            />
          )}

          {/* 4. Actual values main plot line */}
          {actualLinePath && (
            <polyline
              points={actualLinePath}
              fill="none"
              stroke="url(#indigoGrad)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* 5. Highlight outlier points in red */}
          {svgPoints
            .filter((p) => p.isOutlier)
            .map((p, idx) => (
              <g key={`outlier-${idx}`}>
                {/* Glowing ring */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="5"
                  className="fill-rose-500/30 stroke-rose-500/80 animate-ping"
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="3"
                  className="fill-rose-500 stroke-red-200"
                  strokeWidth="0.75"
                />
              </g>
            ))}

          {/* SVG Definitions for Gradients */}
          <defs>
            <linearGradient id="indigoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
          </defs>

          {/* 6. Active hovered crosshairs and indicator dots */}
          {hoveredPoint && (
            <g>
              {/* Vertical tracking line */}
              <line
                x1={hoveredPoint.x}
                y1={paddingY}
                x2={hoveredPoint.x}
                y2={paddingY + chartHeight}
                stroke="rgba(255,255,255,0.15)"
                strokeDasharray="2 2"
                strokeWidth="1.2"
              />
              {/* Highlight circle on line */}
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="5"
                className={`${hoveredPoint.isOutlier ? "fill-rose-400 stroke-rose-200" : "fill-indigo-400 stroke-white"}`}
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>

        {/* Hover Context Box Card (replaces standard html tooltips with beautifully positioned absolute div) */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none bg-slate-950/95 border border-white/10 rounded-lg p-2 shadow-2xl text-[10.5px] font-sans text-slate-200 space-y-1 backdrop-blur-md"
            style={{
              left: `${Math.max(10, Math.min(dimensions.width - 150, hoveredPoint.x - 70))}px`,
              top: `${Math.max(10, hoveredPoint.y - 85)}px`,
              width: "140px",
            }}
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-1">
              <span className="font-semibold text-slate-400">Row Index {hoveredPoint.rowIndex}</span>
              {hoveredPoint.isOutlier ? (
                <span className="text-red-400 px-1 rounded bg-red-450/15 font-bold uppercase text-[8px]">Outlier</span>
              ) : (
                <span className="text-emerald-400 px-1 rounded bg-emerald-500/10 font-medium uppercase text-[8px]">Normal</span>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span>Value:</span>
              <span className="font-mono font-bold text-white">
                {hoveredPoint.value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 3 })}
              </span>
            </div>

            {hasFences && (
              <div className="text-[9px] text-slate-400 font-medium">
                {hoveredPoint.value > (metric.upperFence ?? 0) ? (
                  <span className="text-rose-300">▲ Exceeds upper limit</span>
                ) : hoveredPoint.value < (metric.lowerFence ?? 0) ? (
                  <span className="text-rose-300">▼ Below lower limit</span>
                ) : (
                  <span className="text-emerald-500">Within normal IQR fence</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Clear Visual Colors Map/Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 text-[10px] font-sans text-slate-400 pt-0.5">
        <div className="flex items-center gap-1.5">
          <div className="h-0.5 w-4 bg-indigo-400"></div>
          <span>Actual value trend line</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-0.5 w-4 border-t-2 border-dashed border-[#fbbf24]"></div>
          <span>Gold Linear Regression</span>
        </div>
        {hasFences && (
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-2 bg-indigo-500/10 border border-indigo-500/20 border-dashed rounded-sm"></div>
            <span>Healthy IQR Sandbox Range</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-red-200"></span>
          <span>Detected Outlier Nodes</span>
        </div>
      </div>
    </div>
  );
};
