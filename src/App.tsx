import { useState, useMemo, useEffect } from "react";
import {
  FileCode,
  Sparkles,
  Download,
  AlertCircle,
  Database,
  Trash2,
  RefreshCw,
  Clock,
  User,
  Info,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  BarChart4,
} from "lucide-react";
import Papa from "papaparse";
import { motion, AnimatePresence } from "motion/react";

import { ColumnMetric, CleaningPipelineConfig, DatasetDetails } from "./types";
import { DEMO_DATASETS } from "./data";
import { calculateColumnMetrics, applyCleaningPipeline, isMissing, toSnakeCase } from "./utils";
import { ColumnsConfigPanel } from "./components/ColumnsConfigPanel";
import { DatasetSelector } from "./components/DatasetSelector";
import { ReportView } from "./components/ReportView";
import { MetricTrendChart } from "./components/MetricTrendChart";

export default function App() {
  // Original Uploaded Data
  const [datasetName, setDatasetName] = useState<string>("");
  const [originalHeaders, setOriginalHeaders] = useState<string[]>([]);
  const [originalRows, setOriginalRows] = useState<any[]>([]);

  // Selected Inspect column details
  const [selectedInspectCol, setSelectedInspectCol] = useState<string | null>(null);

  // Tab views
  const [activeTab, setActiveTab] = useState<"original" | "report" | "cleaned">("original");

  // Search input for raw data
  const [previewSearch, setPreviewSearch] = useState<string>("");

  // AI Generated Report States
  const [aiReport, setAiReport] = useState<string>("");
  const [isFallbackReport, setIsFallbackReport] = useState<boolean>(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Custom Pipeline Configurations
  const [pipelineConfig, setPipelineConfig] = useState<CleaningPipelineConfig>({
    normalizeHeaders: false,
    removeDuplicates: true,
    missingValueStrategies: {},
    constantValues: {},
    outlierStrategies: {},
    textStandardizations: {},
    dataTypeCast: {},
  });

  // Count raw duplicate rows
  const originalDuplicatesCount = useMemo(() => {
    if (!originalRows.length) return 0;
    const seen = new Set<string>();
    let dupCount = 0;
    originalRows.forEach((r) => {
      const hStr = JSON.stringify(r);
      if (seen.has(hStr)) {
        dupCount++;
      } else {
        seen.add(hStr);
      }
    });
    return dupCount;
  }, [originalRows]);

  // Compute Column Metrics locally
  const columnMetrics = useMemo(() => {
    if (!originalHeaders.length || !originalRows.length) return [];
    return calculateColumnMetrics(originalHeaders, originalRows);
  }, [originalHeaders, originalRows]);

  // Compute Cleaned Row states automatically when raw data or pipeline configurations change
  const { cleanedRows, cleanedHeaders, logs } = useMemo(() => {
    if (!originalRows.length) return { cleanedRows: [], cleanedHeaders: [], logs: [] };
    return applyCleaningPipeline(originalRows, originalHeaders, pipelineConfig, columnMetrics);
  }, [originalRows, originalHeaders, pipelineConfig, columnMetrics]);

  // Auto Select first column to inspect upon dataset ingestion
  useEffect(() => {
    if (originalHeaders.length > 0) {
      setSelectedInspectCol(originalHeaders[0]);
    } else {
      setSelectedInspectCol(null);
    }
    // Clear AI report if data changes
    setAiReport("");
    setReportError(null);
    setActiveTab("original");
  }, [datasetName, originalHeaders]);

  // Initialize Strategy preferences based on detected types to save user click overhead
  useEffect(() => {
    if (columnMetrics.length === 0) return;
    const initialStrategies: Record<string, any> = {};
    const initialConstants: Record<string, string> = {};
    const initialOutliers: Record<string, any> = {};
    const initialTextOps: Record<string, any> = {};

    columnMetrics.forEach((m) => {
      // Best practices heuristics
      if (m.missingCount > 0) {
        if (m.type === "numerical") {
          initialStrategies[m.name] = "median"; // Median is robust to messy outliers
        } else if (m.type === "categorical" || m.type === "boolean") {
          initialStrategies[m.name] = "mode"; // Mode represents standard categorical imputation
        } else {
          initialStrategies[m.name] = "constant";
          initialConstants[m.name] = "N/A";
        }
      } else {
        initialStrategies[m.name] = "none";
      }

      initialOutliers[m.name] = "none";
      initialTextOps[m.name] = "none";
    });

    setPipelineConfig((prev) => ({
      ...prev,
      missingValueStrategies: { ...initialStrategies, ...prev.missingValueStrategies },
      constantValues: { ...initialConstants, ...prev.constantValues },
      outlierStrategies: { ...initialOutliers, ...prev.outlierStrategies },
      textStandardizations: { ...initialTextOps, ...prev.textStandardizations },
    }));
  }, [columnMetrics]);

  // Trigger Gemini Analysis payload on server route `/api/analyze`
  const requestAiAnalysis = async () => {
    if (originalRows.length === 0) return;
    setIsGeneratingReport(true);
    setReportError(null);
    setActiveTab("report");

    try {
      const payload = {
        datasetSummary: {
          name: datasetName,
          size: `${(JSON.stringify(originalRows).length / 1024).toFixed(1)} KB`,
          rowCount: originalRows.length,
          columnCount: originalHeaders.length,
        },
        columns: columnMetrics,
        originalStats: {
          duplicateRowsCount: originalDuplicatesCount,
          rowsCount: originalRows.length,
          colsCount: originalHeaders.length,
        },
        sampleRows: originalRows.slice(0, 15), // Safe concise representative records sample
      };

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "The AI server failed to produce structured outputs.");
      }

      setAiReport(data.reportMarkdown);
      setIsFallbackReport(!!data.isFallback);
    } catch (err: any) {
      console.error(err);
      setReportError(err.message || "An error occurred while connecting to the backend Gemini workspace. Please verify your GEMINI_API_KEY settings.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Download cleaned file utilities
  const handleDownloadCSV = () => {
    if (cleanedRows.length === 0) return;
    const csvContent = Papa.unparse(cleanedRows, { columns: cleanedHeaders });
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `cleaned_${datasetName.replace(/\.[^/.]+$/, "")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJSON = () => {
    if (cleanedRows.length === 0) return;
    const blob = new Blob([JSON.stringify(cleanedRows, null, 2)], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `cleaned_${datasetName.replace(/\.[^/.]+$/, "")}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset entire dashboard
  const handleReset = () => {
    setDatasetName("");
    setOriginalHeaders([]);
    setOriginalRows([]);
    setAiReport("");
    setSelectedInspectCol(null);
    setPipelineConfig({
      normalizeHeaders: false,
      removeDuplicates: true,
      missingValueStrategies: {},
      constantValues: {},
      outlierStrategies: {},
      textStandardizations: {},
      dataTypeCast: {},
    });
  };

  // Filter values in table previews
  const filteredOriginalRows = originalRows.filter((r) => {
    if (!previewSearch) return true;
    return Object.values(r).some((val) => String(val).toLowerCase().includes(previewSearch.toLowerCase()));
  });

  const filteredCleanedRows = cleanedRows.filter((r) => {
    if (!previewSearch) return true;
    return Object.values(r).some((val) => String(val).toLowerCase().includes(previewSearch.toLowerCase()));
  });

  // Calculate global summary indices
  const totalMissingCells = columnMetrics.reduce((sum, col) => sum + col.missingCount, 0);
  const totalCellsCount = originalRows.length * originalHeaders.length;
  const missingCellsRatio = totalCellsCount > 0 ? (totalMissingCells / totalCellsCount) * 100 : 0;
  const totalOutliersCount = columnMetrics.reduce((sum, col) => sum + (col.outlierIndexes?.length || 0), 0);

  // Dynamic metrics on the cleaned dataset for interactive score updates
  const cleanedMissingCount = useMemo(() => {
    if (!cleanedRows.length || !cleanedHeaders.length) return 0;
    let count = 0;
    for (const row of cleanedRows) {
      for (const col of cleanedHeaders) {
        if (isMissing(row[col])) {
          count++;
        }
      }
    }
    return count;
  }, [cleanedRows, cleanedHeaders]);

  const cleanedOutliersCount = useMemo(() => {
    if (!cleanedRows.length || !columnMetrics.length) return 0;
    let count = 0;
    const numericMetrics = columnMetrics.filter(
      (m) => m.type === "numerical" && m.lowerFence !== undefined && m.upperFence !== undefined
    );
    for (const row of cleanedRows) {
      for (const m of numericMetrics) {
        const colKey = pipelineConfig.normalizeHeaders ? toSnakeCase(m.name) : m.name;
        const val = row[colKey];
        if (val !== undefined && val !== null && !isMissing(val)) {
          const numVal = typeof val === "number" ? val : Number(String(val).trim().replace(/[\$,]/g, ""));
          if (!isNaN(numVal)) {
            if (numVal < m.lowerFence! || numVal > m.upperFence!) {
              count++;
            }
          }
        }
      }
    }
    return count;
  }, [cleanedRows, columnMetrics, pipelineConfig.normalizeHeaders]);

  const cleanedDuplicatesCount = useMemo(() => {
    if (!cleanedRows.length) return 0;
    const seen = new Set<string>();
    let dupCount = 0;
    cleanedRows.forEach((r) => {
      const hStr = JSON.stringify(r);
      if (seen.has(hStr)) {
        dupCount++;
      } else {
        seen.add(hStr);
      }
    });
    return dupCount;
  }, [cleanedRows]);

  const cleanedTotalCells = cleanedRows.length * cleanedHeaders.length;

  const computeQualityScore = (
    rowsCount: number,
    headersCount: number,
    missingCount: number,
    outliersCount: number,
    duplicatesCount: number
  ) => {
    if (rowsCount === 0 || headersCount === 0) return 0;
    
    const totalCells = rowsCount * headersCount;
    
    // 1. Completeness Score (max 40 points)
    const missingRatio = (missingCount / totalCells) * 100;
    const completenessScore = Math.max(0, 40 - (missingRatio * 2));

    // 2. Uniqueness Score (max 30 points)
    const duplicateRatio = (duplicatesCount / rowsCount) * 100;
    const uniquenessScore = Math.max(0, 30 - (duplicateRatio * 1.5));

    // 3. Statistical Integrity Score (max 30 points)
    const outliersRatio = (outliersCount / totalCells) * 100;
    const statisticalScore = Math.max(0, 30 - (outliersRatio * 3.0));

    // Combine and round
    const rawScore = completenessScore + uniquenessScore + statisticalScore;
    return Math.round(rawScore);
  };

  const originalQualityScore = useMemo(() => {
    return computeQualityScore(
      originalRows.length,
      originalHeaders.length,
      totalMissingCells,
      totalOutliersCount,
      originalDuplicatesCount
    );
  }, [originalRows.length, originalHeaders.length, totalMissingCells, totalOutliersCount, originalDuplicatesCount]);

  const cleanedQualityScore = useMemo(() => {
    return computeQualityScore(
      cleanedRows.length,
      cleanedHeaders.length,
      cleanedMissingCount,
      cleanedOutliersCount,
      cleanedDuplicatesCount
    );
  }, [cleanedRows.length, cleanedHeaders.length, cleanedMissingCount, cleanedOutliersCount, cleanedDuplicatesCount]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased relative overflow-hidden select-none">
      {/* Background Mesh Gradient Elements */}
      <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-emerald-600/15 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Top Banner Meta Header */}
      <header className="h-16 border-b border-white/10 backdrop-blur-md bg-white/5 px-6 flex flex-col sm:flex-row items-center justify-between gap-4 z-25 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-lg flex items-center justify-center font-bold shadow-inner">
            🧠
          </div>
          <div>
            <h1 className="font-sans font-semibold text-base leading-tight tracking-tight text-white">
              DataCleaner <span className="text-indigo-400">AI</span>
            </h1>
            <p className="font-mono text-[9px] text-slate-400">Interactive Pipeline Optimization & Diagnostics</p>
          </div>
        </div>

        {/* Workspace telemetry Indicators (No technology larping/clutter, only real informative context) */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-slate-300 text-[11px] backdrop-blur-md">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>UTC: 2026-06-05 12:49:48</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-slate-300 text-[11px] backdrop-blur-md">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span className="truncate max-w-[140px]" title="lakshaytandon125@gmail.com">
              lakshaytandon125@gmail.com
            </span>
          </div>
          {originalRows.length > 0 && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:text-white rounded-full transition border border-rose-500/20 font-sans font-medium text-[11px] pointer-events-auto backdrop-blur-md"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Reset Dataset
            </button>
          )}
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto flex flex-col gap-6 z-10 relative">
        {originalRows.length === 0 ? (
          /* Empty State Landing Screen */
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 md:p-10 shadow-xl max-w-3xl mx-auto w-full text-center space-y-6 z-10"
          >
            <div className="max-w-xl mx-auto space-y-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono bg-indigo-500/15 text-indigo-300 rounded-full border border-indigo-500/20 font-semibold uppercase tracking-wider backdrop-blur-sm">
                Senior intelligence engine
              </span>
              <h2 className="text-white font-sans font-extrabold text-2xl md:text-3xl tracking-tight leading-tight">
                Transform messy records into pristine, ML-ready tabular datasets
              </h2>
              <p className="text-slate-300 font-sans text-sm leading-relaxed">
                Provide any CSV or Excel file spreadsheet. This AI agent analyzes data types, uncovers missing records, isolates outliers, standardizes strings, and uses Gemini to map encoding and feature engineering strategies instantly.
              </p>
            </div>

            <DatasetSelector
              isLoading={false}
              onDatasetSelected={(name, headers, rows) => {
                setDatasetName(name);
                setOriginalHeaders(headers);
                setOriginalRows(rows);
              }}
            />
          </motion.div>
        ) : (
          /* Active Interactive Workspace Panel */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Sidebar - Configurations Column */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Dataset Quick Stats Cards */}
              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 shadow-xl space-y-3.5">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h3 className="font-sans font-bold text-slate-100 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-indigo-400" /> Loaded Summary
                  </h3>
                  <span className="text-4xs font-mono text-slate-400 truncate max-w-[150px]" title={datasetName}>
                    {datasetName}
                  </span>
                </div>

                {/* Dynamic Data Quality Score Meter */}
                <div className="p-3 bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 border border-white/10 rounded-lg space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-4xs font-sans text-slate-300 block uppercase font-bold tracking-widest">
                        Data Quality Score
                      </span>
                      <span className="text-sm font-sans font-bold text-white block mt-0.5">
                        {cleanedQualityScore} <span className="text-slate-400 text-xs font-normal">/ 100</span>
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-[9px] font-bold font-sans px-2 py-0.5 rounded-full border ${
                        cleanedQualityScore >= 90
                          ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-300"
                          : cleanedQualityScore >= 70
                          ? "bg-indigo-500/15 border-indigo-500/25 text-indigo-300"
                          : "bg-amber-500/15 border-amber-500/25 text-amber-300"
                      }`}>
                        {cleanedQualityScore >= 90 ? "Excellent" : cleanedQualityScore >= 70 ? "Good" : "Needs Care"}
                      </span>
                      {cleanedQualityScore > originalQualityScore && (
                        <span className="text-[10px] text-emerald-400 font-sans mt-0.5 flex items-center gap-0.5">
                          ▲ +{cleanedQualityScore - originalQualityScore} optimization
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Horizontal visual progress meter */}
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        cleanedQualityScore >= 90
                          ? "bg-gradient-to-r from-indigo-500 to-emerald-500"
                          : cleanedQualityScore >= 70
                          ? "bg-indigo-500"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${cleanedQualityScore}%` }}
                    ></div>
                  </div>
                  
                  {/* Miniature diagnostic feedback checklist based on properties */}
                  <div className="grid grid-cols-3 gap-1 pt-1 text-[9px] font-sans text-slate-400">
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${cleanedMissingCount === 0 ? "bg-emerald-400" : "bg-amber-400"}`}></span>
                      <span className="truncate">Nulls: {cleanedMissingCount === 0 ? "0" : `${(cleanedMissingCount / (cleanedTotalCells || 1) * 100).toFixed(1)}%`}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${cleanedDuplicatesCount === 0 ? "bg-emerald-400" : "bg-red-400"}`}></span>
                      <span className="truncate">Dups: {cleanedDuplicatesCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${cleanedOutliersCount === 0 ? "bg-emerald-400" : "bg-amber-400"}`}></span>
                      <span className="truncate">Outliers: {cleanedOutliersCount}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white/5 border border-white/5 rounded-lg">
                    <span className="text-4xs font-sans text-slate-400 block font-medium">Record Rows</span>
                    <span className="text-sm font-mono font-bold text-white block">{originalRows.length}</span>
                  </div>
                  <div className="p-3 bg-white/5 border border-white/5 rounded-lg">
                    <span className="text-4xs font-sans text-slate-400 block font-medium">Data Columns</span>
                    <span className="text-sm font-mono font-bold text-white block">{originalHeaders.length}</span>
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <span className="text-4xs font-sans text-amber-400 block font-medium">Missing Cells</span>
                    <span className="text-sm font-mono font-bold text-amber-300 block">
                      {totalMissingCells} ({missingCellsRatio.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <span className="text-4xs font-sans text-rose-400 block font-medium">Duplicate Rows</span>
                    <span className="text-sm font-mono font-bold text-rose-300 block">
                      {originalDuplicatesCount} rows
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  id="action-get-ai-report"
                  onClick={requestAiAnalysis}
                  disabled={isGeneratingReport}
                  className="w-full pointer-events-auto flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-semibold text-xs rounded-lg transition duration-200 shadow-md hover:shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                  {isGeneratingReport ? "Analyzing with Gemini..." : "Generate AI Expert Report"}
                </button>
              </div>

              {/* Sidebar Config options */}
              <div className="w-full">
                <ColumnsConfigPanel
                  columns={columnMetrics}
                  config={pipelineConfig}
                  onChange={(cfg) => setPipelineConfig(cfg)}
                />
              </div>
            </div>

            {/* Right Pane Console - Dynamic Views Area */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Tab selector bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-2 shadow-xl">
                <div className="flex flex-wrap items-center gap-1.5 p-0.5 bg-white/5 rounded-lg border border-white/5 self-start">
                  <button
                    type="button"
                    onClick={() => setActiveTab("original")}
                    className={`px-3 py-1.5 rounded-md font-sans font-semibold text-[11px] transition duration-150 flex items-center gap-1.5 pointer-events-auto ${
                      activeTab === "original"
                        ? "bg-white/10 text-white border border-white/15 shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Database className="w-3.5 h-3.5" />
                    Original Data Preview
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!aiReport && !isGeneratingReport) {
                        requestAiAnalysis();
                      } else {
                        setActiveTab("report");
                      }
                    }}
                    className={`px-3 py-1.5 rounded-md font-sans font-semibold text-[11px] transition duration-150 flex items-center gap-1.5 pointer-events-auto ${
                      activeTab === "report"
                        ? "bg-indigo-500/20 text-indigo-350 border border-indigo-500/35 shadow-sm"
                        : "text-slate-400 hover:text-indigo-400 hover:bg-white/5"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    AI Cleaning Report
                    {aiReport && (
                      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("cleaned")}
                    className={`px-3 py-1.5 rounded-md font-sans font-semibold text-[11px] transition duration-150 flex items-center gap-1.5 pointer-events-auto ${
                      activeTab === "cleaned"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 shadow-sm"
                        : "text-slate-400 hover:text-emerald-300 hover:bg-white/5"
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    Cleaned Dataset Preview
                  </button>
                </div>

                {/* Local search preview rows */}
                <div className="relative max-w-xs w-full">
                  <input
                    type="text"
                    placeholder="Filter preview values..."
                    value={previewSearch}
                    onChange={(e) => setPreviewSearch(e.target.value)}
                    className="w-full px-3 py-1.5 pl-8 font-sans text-xs border border-white/10 text-white placeholder-slate-450 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white/5 focus:bg-white/10 transition"
                  />
                  <span className="absolute left-2.5 top-2 ml-0.5 font-mono text-slate-400 text-xs">🔍</span>
                </div>
              </div>

              {/* Console window container */}
              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl shadow-2xl overflow-hidden min-h-[480px] flex flex-col">
                <AnimatePresence mode="wait">
                  {/* TAB 1: ORIGINAL DATA PREVIEW & VISUALIZATIONS */}
                  {activeTab === "original" && (
                    <motion.div
                      key="original-tab"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-6 flex flex-col gap-6 flex-1"
                    >
                      {/* Column Frequency/Numeric Properties Inspector Widget */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-indigo-500/15 text-indigo-300 rounded-md border border-indigo-500/20 uppercase tracking-widest font-bold font-sans">
                            Interactive data distribution inspector
                          </span>
                          <h4 className="font-sans font-bold text-white text-sm tracking-tight">
                            Select column to examine details
                          </h4>
                          <p className="font-sans text-xs text-slate-400">
                            Highlights properties of selected features prior to cleaning.
                          </p>
                        </div>

                        {/* Dropdown to switch inspected column */}
                        <div className="flex items-center gap-2 self-start md:self-center">
                          <label className="font-sans text-xs font-semibold text-slate-300">Inspection Target:</label>
                          <select
                            className="bg-white/5 text-white border border-white/15 rounded-md text-xs font-sans py-1.5 px-3 outline-none pointer-events-auto hover:bg-white/10 hover:border-indigo-500/50 transition cursor-pointer"
                            value={selectedInspectCol || ""}
                            onChange={(e) => setSelectedInspectCol(e.target.value)}
                          >
                            {originalHeaders.map((h) => (
                              <option key={h} value={h} className="bg-slate-900 text-white">
                                {h}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Display Inspections */}
                      {selectedInspectCol && (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white/5 rounded-xl p-4 border border-white/5">
                          {/* General stats */}
                          <div className="md:col-span-4 space-y-2.5">
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                              Column Summary Info
                            </span>
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs bg-white/5 p-2 rounded border border-white/5">
                                <span className="font-sans text-slate-400">Class Type</span>
                                <span className="font-mono font-bold text-white uppercase">
                                  {columnMetrics.find((m) => m.name === selectedInspectCol)?.type || "Unknown"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs bg-white/5 p-2 rounded border border-white/5">
                                <span className="font-sans text-slate-400">Null cells rate</span>
                                <span className="font-mono font-bold text-white">
                                  {columnMetrics
                                    .find((m) => m.name === selectedInspectCol)
                                    ?.missingPercentage.toFixed(1)}
                                  %
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs bg-white/5 p-2 rounded border border-white/5">
                                <span className="font-sans text-slate-400">Unique Values</span>
                                <span className="font-mono font-bold text-white">
                                  {columnMetrics.find((m) => m.name === selectedInspectCol)?.uniqueCount}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Specific stats and values check */}
                          <div className="md:col-span-8 space-y-2.5">
                            {columnMetrics.find((m) => m.name === selectedInspectCol)?.type === "numerical" ? (
                              /* Numerical metric block */
                              <div className="space-y-4">
                                <div className="space-y-2.5">
                                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                                    Descriptive ML Metrics (Calculated)
                                  </span>
                                  {(() => {
                                    const metric = columnMetrics.find((m) => m.name === selectedInspectCol);
                                    return (
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        <div className="bg-white/5 p-2 rounded border border-white/5 text-center">
                                          <span className="text-[10px] font-sans text-slate-400 block">Mean</span>
                                          <span className="text-xs font-mono font-semibold text-white">
                                            {metric?.mean ?? "N/A"}
                                          </span>
                                        </div>
                                        <div className="bg-white/5 p-2 rounded border border-white/5 text-center">
                                          <span className="text-[10px] font-sans text-slate-400 block">Median</span>
                                          <span className="text-xs font-mono font-semibold text-white">
                                            {metric?.median ?? "N/A"}
                                          </span>
                                        </div>
                                        <div className="bg-white/5 p-2 rounded border border-white/5 text-center">
                                          <span className="text-[10px] font-sans text-slate-400 block">Min / Max</span>
                                          <span className="text-[11px] font-mono font-semibold text-white truncate block">
                                            {metric?.min} / {metric?.max}
                                          </span>
                                        </div>
                                        <div className="bg-rose-500/10 p-2 rounded border border-rose-500/20 text-center">
                                          <span className="text-[10px] font-sans text-rose-350 block font-medium">Outliers</span>
                                          <span className="text-xs font-mono font-bold text-rose-400 block">
                                            {metric?.outlierIndexes?.length ?? 0} rows
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>

                                {/* Dynamic Interactive Trend Charting workspace */}
                                {(() => {
                                  const metric = columnMetrics.find((m) => m.name === selectedInspectCol);
                                  if (metric) {
                                    return (
                                      <div className="pt-2 border-t border-white/5">
                                        <span className="text-[10px] font-mono text-slate-450 uppercase tracking-widest block font-bold mb-2">
                                          Numerical Visual Trend & Outlier Diagnostics
                                        </span>
                                        <MetricTrendChart
                                          columnName={selectedInspectCol}
                                          metric={metric}
                                          rows={originalRows}
                                        />
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            ) : (
                              /* Categorical & Text previews */
                              <div className="space-y-2.5">
                                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                                  Discovered Unique Categories Preview (Limit 5)
                                </span>
                                <div className="space-y-1.5">
                                  {columnMetrics
                                    .find((m) => m.name === selectedInspectCol)
                                    ?.uniqueValues.slice(0, 5)
                                    .map((val, vIdx) => {
                                      // Calculate absolute count helper for demo visual progress
                                      const occurrences = originalRows.filter(
                                        (r) => String(r[selectedInspectCol]).trim() === String(val).trim()
                                      ).length;
                                      const ratio = originalRows.length > 0 ? (occurrences / originalRows.length) * 100 : 0;

                                      return (
                                        <div key={vIdx} className="space-y-1">
                                          <div className="flex justify-between items-center text-xs text-slate-200">
                                            <span className="font-mono font-semibold truncate bg-white/5 text-slate-100 px-1.5 py-0.5 rounded border border-white/5">
                                              "{val || "empty space"}"
                                            </span>
                                            <span className="text-[10px] font-mono text-slate-400">
                                              {occurrences} instances ({ratio.toFixed(0)}%)
                                            </span>
                                          </div>
                                          <div className="w-full bg-white/10 rounded-full h-1.5">
                                            <div
                                              className="bg-indigo-500 h-1.5 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                                              style={{ width: `${Math.max(ratio, 4)}%` }}
                                            />
                                          </div>
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* original table rows */}
                      <div className="flex-1 overflow-x-auto border border-white/10 rounded-xl max-h-[380px] overflow-y-auto bg-black/20">
                        <table className="w-full text-left font-sans border-collapse">
                          <thead className="bg-white/10 backdrop-blur-md text-slate-200 sticky top-0 z-10 border-b border-white/10">
                            <tr>
                              <th className="px-4 py-2.5 font-sans font-semibold text-xs uppercase tracking-wider text-slate-400">#</th>
                              {originalHeaders.map((header) => {
                                const metric = columnMetrics.find((m) => m.name === header);
                                const isDirty = (metric?.missingCount || 0) > 0 || (metric?.outlierIndexes?.length || 0) > 0;
                                return (
                                  <th
                                    key={header}
                                    className={`px-4 py-2.5 font-sans font-semibold text-xs uppercase tracking-wider ${
                                      isDirty ? "bg-amber-500/10 text-amber-300" : "text-white/90"
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <span>{header}</span>
                                      {header === selectedInspectCol && (
                                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                                      )}
                                    </div>
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-xs text-slate-350">
                            {filteredOriginalRows.slice(0, 100).map((row, idx) => {
                              return (
                                <tr key={idx} className="hover:bg-white/5 border-b border-white/5 transition-colors">
                                  <td className="px-4 py-2 text-slate-500 font-mono text-[10px] select-none">
                                    {idx + 1}
                                  </td>
                                  {originalHeaders.map((header) => {
                                    const value = row[header];
                                    const isValMissing = isMissing(value);
                                    const metric = columnMetrics.find((m) => m.name === header);
                                    const isOutlierVal =
                                      metric?.type === "numerical" && metric.outlierIndexes?.includes(idx);

                                    let cellStyle = "text-slate-300";
                                    let badge = null;

                                    if (isValMissing) {
                                      cellStyle = "bg-amber-500/10 text-amber-300 italic font-medium border-l border-amber-500/30";
                                      badge = <span className="text-[10px] font-mono text-amber-400 bg-amber-500/25 px-1.5 py-0.5 rounded ml-1 border border-amber-500/20">null</span>;
                                    } else if (isOutlierVal) {
                                      cellStyle = "bg-rose-500/10 text-rose-300 font-semibold border-l border-rose-500/30";
                                      badge = <span className="text-[10px] font-mono text-rose-400 bg-rose-500/25 px-1.5 py-0.5 rounded ml-1 border border-rose-500/20">outlier</span>;
                                    }

                                    return (
                                      <td key={header} className={`px-4 py-2 border-r border-white/5 max-w-[200px] truncate ${cellStyle}`}>
                                        <span className="font-sans">
                                          {isValMissing ? "Missing" : String(value)}
                                        </span>
                                        {badge}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {originalRows.length > 100 && (
                        <p className="text-[10px] font-sans text-slate-400 text-center italic">
                          Showing first 100 row records in pre-cleaning grid. All {originalRows.length} will be parsed on pipeline execution.
                        </p>
                      )}
                    </motion.div>
                  )}                     {/* TAB 2: AI ANALYTIC REPORT (GEMINI POWERED) */}
                  {activeTab === "report" && (
                    <motion.div
                      key="report-tab"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-6 flex-1 flex flex-col justify-start"
                    >
                      {isGeneratingReport ? (
                        /* Beautiful Senior ML pipeline Loader */
                        <div className="flex-1 flex flex-col items-center justify-center py-16 space-y-5">
                          <div className="relative">
                            <div className="w-16 h-16 rounded-full border-4 border-indigo-500/10 border-t-indigo-500 animate-spin shadow-[0_0_15px_rgba(99,102,241,0.3)]" />
                            <Sparkles className="w-6 h-6 text-indigo-400 absolute top-5 left-5 animate-pulse" />
                          </div>

                          <div className="text-center space-y-1 max-w-sm">
                            <h4 className="font-sans font-extrabold text-white text-base">
                              Generative Diagnostic Run in Progress
                            </h4>
                            <p className="font-sans text-xs text-slate-400 leading-relaxed">
                              Gemini is mapping categorical cardinalities, estimating winsorization thresholds, and writing mathematical representations for models. Please wait...
                            </p>
                          </div>
                        </div>
                      ) : reportError ? (
                        /* Error recovery block */
                        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto py-16 space-y-4">
                          <div className="p-3 bg-red-500/10 border border-red-500/20 text-rose-400 rounded-full">
                            <AlertCircle className="w-8 h-8" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-sans font-bold text-white">Gemini Workspace Required</h4>
                            <p className="font-sans text-xs text-slate-400 leading-relaxed">
                              {reportError}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={requestAiAnalysis}
                            className="pointer-events-auto flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-sans font-semibold text-xs rounded-lg transition"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Re-execute AI diagnostic
                          </button>
                        </div>
                      ) : (
                        /* Markdown analytical brief */
                        <div className="space-y-6">
                          <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border ${
                            isFallbackReport 
                              ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                              : "bg-indigo-500/15 border-indigo-500/25 text-indigo-300"
                          }`}>
                            <div className="flex items-center gap-2">
                              <Sparkles className={`w-4 h-4 ${isFallbackReport ? "text-amber-400" : "text-indigo-400"}`} />
                              <span className="font-sans font-semibold text-xs leading-relaxed">
                                {isFallbackReport 
                                  ? "Backup Heuristics: Successfully mapped local statistical & schema diagnostic reports."
                                  : "Gemini AI: This professional report is anchored on your dataset's actual patterns."
                                }
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={requestAiAnalysis}
                              className={`pointer-events-auto text-xs font-sans font-bold hover:underline flex items-center gap-1 ${
                                isFallbackReport ? "text-amber-400" : "text-indigo-400"
                              }`}
                            >
                              <RefreshCw className="w-3 h-3 animate-spin-slow" /> Re-run Diagnostic
                            </button>
                          </div>

                          <ReportView reportMarkdown={aiReport} />
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* TAB 3: CLEANED DATA PREVIEW & LOGS */}
                  {activeTab === "cleaned" && (
                    <motion.div
                      key="cleaned-tab"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-6 flex flex-col gap-6 flex-1"
                    >
                      {/* Controls and Stats block */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            <h4 className="font-sans font-semibold text-white text-sm tracking-tight">
                              Cleaned & Model-Ready Output
                            </h4>
                          </div>
                          <p className="font-sans text-xs text-emerald-300">
                            Resulting array holds {cleanedRows.length} healthy rows across {cleanedHeaders.length} Columns.
                          </p>
                        </div>

                        {/* Export Buttons */}
                        <div className="flex items-center gap-2 pointer-events-auto">
                          <button
                            type="button"
                            onClick={handleDownloadCSV}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-semibold rounded-lg transition-all shadow-md active:scale-95"
                          >
                            <Download className="w-3.5 h-3.5" /> Export Cleaned CSV
                          </button>
                          <button
                            type="button"
                            onClick={handleDownloadJSON}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-emerald-300 border border-white/10 font-sans text-xs font-semibold rounded-lg transition-all shadow-md active:scale-95 animate-fade-in"
                          >
                            <FileCode className="w-3.5 h-3.5 text-indigo-400" /> Export Cleaned JSON
                          </button>
                        </div>
                      </div>

                      {/* Audit Pipeline Actions Logs list */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                          Step-by-step cleaning audit trail log
                        </span>
                        <div className="bg-black/30 rounded-xl p-4 border border-white/10 text-slate-300 font-mono text-xs space-y-1.5 max-h-[140px] overflow-y-auto shadow-inner">
                          {logs.map((log, idx) => (
                            <div key={idx} className="flex gap-2 items-start text-[11px] font-mono">
                              <span className="text-indigo-400 font-bold select-none">[v{idx + 1}]</span>
                              <span className="flex-1 opacity-90">{log}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Cleaned tabular previews */}
                      <div className="flex-1 overflow-x-auto border border-white/10 rounded-xl max-h-[300px] overflow-y-auto bg-black/20">
                        <table className="w-full text-left font-sans border-collapse">
                          <thead className="bg-white/10 sticky top-0 z-10 border-b border-white/10">
                            <tr>
                              <th className="px-4 py-2.5 font-sans font-semibold text-xs uppercase tracking-wider text-slate-400">#</th>
                              {cleanedHeaders.map((header) => (
                                <th key={header} className="px-4 py-2.5 font-sans font-semibold text-xs uppercase tracking-wider text-slate-200">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-xs text-slate-350">
                            {filteredCleanedRows.slice(0, 100).map((row, idx) => (
                              <tr key={idx} className="hover:bg-white/5 border-b border-white/5 transition-colors">
                                <td className="px-4 py-2 text-slate-500 font-mono text-[10px] select-none">
                                  {idx + 1}
                                </td>
                                {cleanedHeaders.map((header) => {
                                  const value = row[header];
                                  const isColNull = value === null || value === undefined;
                                  return (
                                    <td
                                      key={header}
                                      className={`px-4 py-2 border-r border-white/5 max-w-[200px] truncate ${
                                        isColNull ? "text-slate-500 bg-white/5 italic font-medium font-sans" : "text-slate-200 font-sans"
                                      }`}
                                    >
                                      {isColNull ? "null" : String(value)}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {cleanedRows.length > 100 && (
                        <p className="text-xs font-sans text-slate-400 text-center italic">
                          Showing first 100 row records in cleaned grid. Exporting will write any changes to all {cleanedRows.length} elements.
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer (Architectural honesty - clean margins, minimal, human label) */}
      <footer className="bg-black/30 border-t border-white/10 py-5 px-6 text-center text-xs text-slate-400 font-sans backdrop-blur-md z-10 relative">
        <p>Interactive Data Cleaner AI Agent. Programmatic Clean is computed instantly in browser; AI diagnostic and encoding mapping is processed server-side.</p>
      </footer>
    </div>
  );
}
