import React, { useState } from "react";
import { Search, Sliders, Type, Hash, Calendar, HelpCircle, CheckSquare, Sparkles } from "lucide-react";
import { ColumnDataType, ColumnMetric, CleaningPipelineConfig } from "../types";

interface ColumnsConfigPanelProps {
  columns: ColumnMetric[];
  config: CleaningPipelineConfig;
  onChange: (newConfig: CleaningPipelineConfig) => void;
}

export const ColumnsConfigPanel: React.FC<ColumnsConfigPanelProps> = ({ columns, config, onChange }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const updateStrategy = (colName: string, value: any) => {
    onChange({
      ...config,
      missingValueStrategies: {
        ...config.missingValueStrategies,
        [colName]: value,
      },
    });
  };

  const updateConstant = (colName: string, value: string) => {
    onChange({
      ...config,
      constantValues: {
        ...config.constantValues,
        [colName]: value,
      },
    });
  };

  const updateTypeCast = (colName: string, value: ColumnDataType | "auto") => {
    onChange({
      ...config,
      dataTypeCast: {
        ...config.dataTypeCast,
        [colName]: value,
      },
    });
  };

  const updateOutlierStrat = (colName: string, value: any) => {
    onChange({
      ...config,
      outlierStrategies: {
        ...config.outlierStrategies,
        [colName]: value,
      },
    });
  };

  const updateTextFormatting = (colName: string, value: any) => {
    onChange({
      ...config,
      textStandardizations: {
        ...config.textStandardizations,
        [colName]: value,
      },
    });
  };

  const filteredColumns = columns.filter((col) => col.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const getTypeIcon = (type: ColumnDataType) => {
    switch (type) {
      case "numerical":
        return <Hash className="w-3.5 h-3.5 text-blue-500" />;
      case "date":
        return <Calendar className="w-3.5 h-3.5 text-amber-500" />;
      case "boolean":
        return <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />;
      case "categorical":
        return <Sparkles className="w-3.5 h-3.5 text-cyan-500" />;
      case "text":
      default:
        return <Type className="w-3.5 h-3.5 text-purple-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/5 border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md">
      {/* Panel title */}
      <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <h4 className="font-sans font-semibold text-white text-sm tracking-tight">Active Advanced Pipeline Settings</h4>
        </div>
        <span className="font-mono text-xs bg-indigo-500/15 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/20">
          {columns.length} columns
        </span>
      </div>

      {/* Global Swatches */}
      <div className="p-3 bg-white/5 border-b border-white/10 space-y-3">
        <div className="flex items-center justify-between pointer-events-auto">
          <label className="flex items-center gap-2 cursor-pointer font-sans text-xs font-medium text-slate-350">
            <input
              type="checkbox"
              className="rounded-sm accent-indigo-500 text-white w-3.5 h-3.5 border-white/10 bg-black/20"
              checked={config.normalizeHeaders}
              onChange={(e) => onChange({ ...config, normalizeHeaders: e.target.checked })}
            />
            Normalize columns to snake_case
          </label>
          <span className="font-mono text-4xs text-slate-400">"User Age" → "user_age"</span>
        </div>

        <div className="flex items-center justify-between pointer-events-auto">
          <label className="flex items-center gap-2 cursor-pointer font-sans text-xs font-medium text-slate-350">
            <input
              type="checkbox"
              className="rounded-sm accent-indigo-500 text-white w-3.5 h-3.5 border-white/10 bg-black/20"
              checked={config.removeDuplicates}
              onChange={(e) => onChange({ ...config, removeDuplicates: e.target.checked })}
            />
            Prune exact duplicate rows
          </label>
          <span className="font-mono text-4xs text-slate-400">Keeps 1st instance</span>
        </div>
      </div>

      {/* Search columns bar */}
      <div className="p-3 border-b border-white/10 bg-black/10">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search columns..."
            className="w-full pl-8 pr-3 py-1.5 font-sans text-xs border border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white/5 focus:bg-white/10 transition text-white placeholder-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Columns configuration list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[500px]">
        {filteredColumns.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">No matching columns found.</div>
        ) : (
          filteredColumns.map((col) => {
            const currentCast = config.dataTypeCast[col.name] || "auto";
            const effectiveType = currentCast === "auto" ? col.type : currentCast;
            const currentStrategy = config.missingValueStrategies[col.name] || "none";
            const currentOutlier = config.outlierStrategies[col.name] || "none";
            const currentCasing = config.textStandardizations[col.name] || "none";

            return (
              <div
                key={col.name}
                className="p-3 bg-white/5 border border-white/10 rounded-lg hover:border-indigo-500/30 transition-colors"
              >
                {/* Column header */}
                <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/5">
                  <div className="truncate flex items-center gap-1.5">
                    {getTypeIcon(col.type)}
                    <span className="font-sans font-medium text-xs text-white truncate" title={col.name}>
                      {col.name}
                    </span>
                  </div>
                  {col.missingCount > 0 ? (
                    <span className="font-sans text-4xs bg-rose-500/15 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/20">
                      {col.missingCount} missing ({col.missingPercentage.toFixed(0)}%)
                    </span>
                  ) : (
                    <span className="font-sans text-4xs bg-emerald-500/15 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      Clean (0% null)
                    </span>
                  )}
                </div>

                {/* Configurations grid */}
                <div className="grid grid-cols-2 gap-2 text-4xs font-sans">
                  {/* Cast Type */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-400 font-medium font-sans animate-fade-in">Type Designation</span>
                    <select
                      className="w-full text-xs font-sans px-1.5 py-1 bg-white/5 border border-white/10 rounded-sm outline-none text-white pointer-events-auto hover:bg-white/10 transition cursor-pointer"
                      value={currentCast}
                      onChange={(e) => updateTypeCast(col.name, e.target.value as any)}
                    >
                      <option value="auto" className="bg-slate-900 text-white">Auto ({col.type})</option>
                      <option value="numerical" className="bg-slate-900 text-white">Numerical</option>
                      <option value="categorical" className="bg-slate-900 text-white">Categorical</option>
                      <option value="text" className="bg-slate-900 text-white">Text</option>
                      <option value="date" className="bg-slate-900 text-white">Date/Time</option>
                      <option value="boolean" className="bg-slate-900 text-white">Boolean</option>
                    </select>
                  </div>

                  {/* Missing Value Fill Strategy */}
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-400 font-medium font-sans">Null Cell Action</span>
                    <select
                      className="w-full text-xs font-sans px-1.5 py-1 bg-white/5 border border-white/10 rounded-sm outline-none text-white pointer-events-auto hover:bg-white/10 transition cursor-pointer"
                      value={currentStrategy}
                      onChange={(e) => updateStrategy(col.name, e.target.value as any)}
                    >
                      <option value="none" className="bg-slate-900 text-white">Keep Unaffected (Null)</option>
                      {effectiveType === "numerical" && (
                        <>
                          <option value="mean" className="bg-slate-900 text-white">Replace with Mean</option>
                          <option value="median" className="bg-slate-900 text-white">Replace with Median</option>
                        </>
                      )}
                      {(effectiveType === "categorical" || effectiveType === "text" || effectiveType === "boolean") && (
                        <option value="mode" className="bg-slate-900 text-white">Replace with Mode</option>
                      )}
                      <option value="constant" className="bg-slate-900 text-white">Custom Constant</option>
                      <option value="drop_row" className="bg-slate-900 text-white">Drop Dirty Rows</option>
                      <option value="drop_col" className="bg-slate-900 text-white">Drop Whole Column</option>
                    </select>
                  </div>

                  {/* Constant Value (Shown only if constant is selected) */}
                  {currentStrategy === "constant" && (
                    <div className="col-span-2 flex flex-col gap-0.5">
                      <span className="text-slate-400 font-medium font-sans">Constant Value</span>
                      <input
                        type="text"
                        placeholder="e.g. 0, Unknown"
                        className="w-full px-2 py-1 bg-white/5 text-white border border-white/10 rounded text-xs outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-white/10 transition"
                        value={config.constantValues[col.name] || ""}
                        onChange={(e) => updateConstant(col.name, e.target.value)}
                      />
                    </div>
                  )}

                  {/* Row Outliers handling (Only for active numerical columns) */}
                  {effectiveType === "numerical" && (
                    <div className="col-span-2 flex flex-col gap-0.5 mt-1">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-medium font-sans">Anomalous Outlier Handling</span>
                        {col.outlierIndexes && col.outlierIndexes.length > 0 && (
                          <span className="text-rose-400 text-[10px] font-medium font-sans">
                            {col.outlierIndexes.length} outliers detected
                          </span>
                        )}
                      </div>
                      <select
                        className="w-full text-xs font-sans px-1.5 py-1 bg-white/5 border border-white/10 rounded-sm outline-none text-white pointer-events-auto hover:bg-white/10 transition cursor-pointer"
                        value={currentOutlier}
                        onChange={(e) => updateOutlierStrat(col.name, e.target.value as any)}
                      >
                        <option value="none" className="bg-slate-900 text-white">No Filter (Preserve)</option>
                        <option value="winsorize" className="bg-slate-900 text-white">Winsorize Capping (IQR Fences)</option>
                        <option value="remove_row" className="bg-slate-900 text-white">Remove Outlier Rows</option>
                      </select>
                    </div>
                  )}

                  {/* Standardize Casing (Only for active strings / text) */}
                  {(effectiveType === "text" || effectiveType === "categorical") && (
                    <div className="col-span-2 flex flex-col gap-0.5 mt-1">
                      <span className="text-slate-400 font-medium font-sans">Text Casing Standardizations</span>
                      <select
                        className="w-full text-xs font-sans px-1.5 py-1 bg-white/5 border border-white/10 rounded-sm outline-none text-white pointer-events-auto hover:bg-white/10 transition cursor-pointer"
                        value={currentCasing}
                        onChange={(e) => updateTextFormatting(col.name, e.target.value as any)}
                      >
                        <option value="none" className="bg-slate-900 text-white">As-is Original</option>
                        <option value="lowercase" className="bg-slate-900 text-white">Force lowercase</option>
                        <option value="uppercase" className="bg-slate-900 text-white">FORCE UPPERCASE</option>
                        <option value="titlecase" className="bg-slate-900 text-white">Force Title Case</option>
                        <option value="trim" className="bg-slate-900 text-white">Only Trim Whitespaces</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
