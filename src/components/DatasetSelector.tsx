import React, { useState } from "react";
import { Upload, Database, Eye, Terminal, Sparkles, Check, FileSpreadsheet } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { DEMO_DATASETS, DemoDataset } from "../data";

interface DatasetSelectorProps {
  onDatasetSelected: (name: string, headers: string[], rows: any[]) => void;
  isLoading: boolean;
}

export const DatasetSelector: React.FC<DatasetSelectorProps> = ({ onDatasetSelected, isLoading }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [parsingError, setParsingError] = useState<string | null>(null);

  // File Upload Handlers (CSV + XLSX)
  const processRawFile = (file: File) => {
    setParsingError(null);
    const fileName = file.name;
    const isCSV = fileName.endsWith(".csv");
    const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

    if (!isCSV && !isExcel) {
      setParsingError("Unsupported file format. Please upload a standard CSV or Excel (.xlsx/.xls) file.");
      return;
    }

    const reader = new FileReader();

    if (isCSV) {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        Papa.parse(text, {
          header: true,
          dynamicTyping: false, // Let auto-type discoverers do typing reliably
          skipEmptyLines: "greedy",
          complete: (results) => {
            if (results.errors.length > 0 && results.data.length === 0) {
              setParsingError(`CSV Parse Error: ${results.errors[0].message}`);
              return;
            }
            if (results.data.length === 0) {
              setParsingError("The uploaded CSV format is raw or empty.");
              return;
            }
            // Extract headers
            const headers = results.meta.fields || Object.keys(results.data[0] as object);
            onDatasetSelected(fileName, headers, results.data);
          },
        });
      };
      reader.readAsText(file);
    } else if (isExcel) {
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" }); // retain empty cell markers

          if (jsonData.length === 0) {
            setParsingError("The uploaded spreadsheet holds no data records.");
            return;
          }

          const headers = Object.keys(jsonData[0] as object);
          onDatasetSelected(fileName, headers, jsonData);
        } catch (err: any) {
          setParsingError(`Excel Parse Error: ${err.message || "Invalid spreadsheet structure."}`);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processRawFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processRawFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Drag Card Box */}
      <div
        id="file-drop-zone"
        className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer backdrop-blur-md ${
          isDragOver
            ? "border-indigo-500 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.25)]"
            : "border-white/10 hover:border-indigo-500/40 bg-white/5 text-white"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!isLoading) {
            document.getElementById("file-input-raw")?.click();
          }
        }}
      >
        <input
          type="file"
          id="file-input-raw"
          className="hidden"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          disabled={isLoading}
        />

        <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-full mb-4 border border-indigo-500/20">
          <Upload className={`w-8 h-8 ${isLoading ? "animate-pulse" : ""}`} />
        </div>

        <h3 className="font-sans font-semibold text-white text-base mb-1">
          {isLoading ? "Ingesting & Analyzing File..." : "Upload raw tabular dataset"}
        </h3>
        <p className="font-sans text-xs text-slate-400 max-w-sm leading-relaxed mb-4">
          Drag and drop your computer file here, or click to browse. Supports high-performance{" "}
          <strong className="text-white">CSV</strong> or <strong className="text-white">Excel (.xlsx)</strong> spreadsheets.
        </p>

        <div className="flex items-center gap-4 text-4xs font-mono text-slate-400 border-t border-white/5 pt-3 w-full justify-center">
          <span className="flex items-center gap-1">
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" /> Auto schema parsing
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> Outlier diagnostics
          </span>
        </div>
      </div>

      {/* Parsing Errors Display */}
      {parsingError && (
        <div className="p-3 bg-rose-500/10 text-rose-350 text-xs rounded-lg border border-rose-500/20 font-sans flex items-center gap-2 backdrop-blur-md">
          <span className="font-bold">Error:</span> {parsingError}
        </div>
      )}

      {/* Realistic Trials presets */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-indigo-300 pl-1">
          <Database className="w-4 h-4 text-indigo-400" />
          <span className="font-sans font-semibold text-xs uppercase tracking-wider">Try beautiful loaded demo datasets</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEMO_DATASETS.map((demo) => (
            <button
              key={demo.name}
              type="button"
              id={`load-demo-${demo.name.replace(/\s+/g, "-").toLowerCase()}`}
              className="flex flex-col text-left p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/40 rounded-xl transition-all shadow-md hover:shadow-lg pointer-events-auto"
              onClick={() => onDatasetSelected(demo.name, demo.headers, demo.rows)}
              disabled={isLoading}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-sans font-semibold text-white text-sm tracking-tight">{demo.name}</span>
                <span className="font-mono text-xs bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full font-medium">
                  {demo.rows.length} rows × {demo.headers.length} cols
                </span>
              </div>
              <p className="font-sans text-xs text-slate-400 leading-snug line-clamp-2">{demo.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
