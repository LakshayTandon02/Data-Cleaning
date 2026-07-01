import { ColumnDataType, ColumnMetric, CleaningPipelineConfig } from "./types";

/**
 * Checks if a string is a valid date helper
 */
export function isValidDate(val: any): boolean {
  if (typeof val === "number" || val === null || val === undefined) return false;
  const str = String(val).trim();
  if (!str || str.length < 5) return false;
  // Exclude raw integers/floats
  if (/^\d+$/.test(str) || /^\d+\.\d+$/.test(str)) return false;
  
  const parsed = Date.parse(str);
  return !isNaN(parsed);
}

/**
 * Helper to check if a value represents empty/null/missing in data science
 */
export function isMissing(val: any): boolean {
  if (val === null || val === undefined) return true;
  const str = String(val).trim().toLowerCase();
  return (
    str === "" ||
    str === "null" ||
    str === "undefined" ||
    str === "nan" ||
    str === "n/a" ||
    str === "na" ||
    str === "none" ||
    str === "-" ||
    str === "."
  );
}

/**
 * Programmatic type detector
 */
export function detectColumnType(values: any[]): ColumnDataType {
  const nonMissing = values.filter((v) => !isMissing(v));
  if (nonMissing.length === 0) return "text";

  // Check boolean first
  const booleanRepresentations = new Set(["true", "false", "yes", "no", "1", "0", "t", "f", true, false, 1, 0]);
  const isAllBoolean = nonMissing.every((v) => {
    if (typeof v === "boolean") return true;
    const s = String(v).trim().toLowerCase();
    return booleanRepresentations.add(s).size === booleanRepresentations.size; // check set presence
  });
  if (isAllBoolean && nonMissing.length > 0) return "boolean";

  // Check numerical
  const numCheck = nonMissing.map((v) => {
    if (typeof v === "number") return v;
    // Strip common currency signs or punctuation
    const s = String(v).trim().replace(/[\$,]/g, "");
    return Number(s);
  });
  const isAllNum = numCheck.every((n) => !isNaN(n));
  if (isAllNum) return "numerical";

  // Check date
  const isAllDate = nonMissing.every((v) => isValidDate(v));
  if (isAllDate) return "date";

  // Categorical vs Text heuristic based on uniqueness ratio
  const uniques = new Set(nonMissing.map((v) => String(v).trim()));
  const uniqueRatio = uniques.size / nonMissing.length;
  if (uniques.size <= 15 || (uniqueRatio < 0.25 && uniques.size < 100)) {
    return "categorical";
  }

  return "text";
}

/**
 * Compute robust statistical analytics for a column
 */
export function calculateColumnMetrics(headers: string[], rows: any[]): ColumnMetric[] {
  return headers.map((colName) => {
    const rawValues = rows.map((r) => r[colName]);
    const type = detectColumnType(rawValues);

    const missingIndices: number[] = [];
    const nonMissingValues: any[] = [];
    rawValues.forEach((val, idx) => {
      if (isMissing(val)) {
        missingIndices.push(idx);
      } else {
        nonMissingValues.push(val);
      }
    });

    const totalCount = rawValues.length;
    const missingCount = missingIndices.length;
    const missingPercentage = totalCount > 0 ? (missingCount / totalCount) * 100 : 0;

    const uniqueSet = new Set(nonMissingValues.map((v) => String(v).trim()));
    const uniqueCount = uniqueSet.size;
    const uniqueValues = Array.from(uniqueSet).slice(0, 15); // visual previews

    // 10 samples
    const sampleValues = rawValues.slice(0, 10);

    const metric: ColumnMetric = {
      name: colName,
      type,
      missingCount,
      missingPercentage,
      uniqueCount,
      uniqueValues,
      sampleValues,
    };

    if (type === "numerical") {
      // Parse numeric items
      const numbers = nonMissingValues
        .map((v) => {
          if (typeof v === "number") return v;
          return Number(String(v).trim().replace(/[\$,]/g, ""));
        })
        .filter((n) => !isNaN(n))
        .sort((a, b) => a - b);

      if (numbers.length > 0) {
        // Mean
        const sum = numbers.reduce((currSum, n) => currSum + n, 0);
        const mean = sum / numbers.length;
        metric.mean = parseFloat(mean.toFixed(4));

        // Median
        const midIdx = Math.floor(numbers.length / 2);
        const median = numbers.length % 2 !== 0 ? numbers[midIdx] : (numbers[midIdx - 1] + numbers[midIdx]) / 2;
        metric.median = parseFloat(median.toFixed(4));

        // Min & Max
        metric.min = numbers[0];
        metric.max = numbers[numbers.length - 1];

        // StdDev
        const sqDiffs = numbers.map((n) => Math.pow(n - mean, 2));
        const variance = sqDiffs.reduce((currSum, diff) => currSum + diff, 0) / numbers.length;
        metric.stdDev = parseFloat(Math.sqrt(variance).toFixed(4));

        // IQR Outliers Formula
        // Q1 (25th percentile) & Q3 (75th percentile)
        const getPercentile = (arr: number[], pct: number) => {
          const idx = (arr.length - 1) * pct;
          const base = Math.floor(idx);
          const rest = idx - base;
          if (arr[base + 1] !== undefined) {
            return arr[base] + rest * (arr[base + 1] - arr[base]);
          } else {
            return arr[base];
          }
        };

        const q1 = getPercentile(numbers, 0.25);
        const q3 = getPercentile(numbers, 0.75);
        const iqr = q3 - q1;
        
        const lowerFence = q1 - 1.5 * iqr;
        const upperFence = q3 + 1.5 * iqr;
        metric.lowerFence = lowerFence;
        metric.upperFence = upperFence;

        // Locate rows index holding outliers
        const outlierIndexes: number[] = [];
        rawValues.forEach((val, idx) => {
          if (!isMissing(val)) {
            const numVal = Number(String(val).trim().replace(/[\$,]/g, ""));
            if (!isNaN(numVal) && (numVal < lowerFence || numVal > upperFence)) {
              outlierIndexes.push(idx);
            }
          }
        });
        metric.outlierIndexes = outlierIndexes;
      }
    }

    return metric;
  });
}

/**
 * Standardize text case helper
 */
export function standardizeString(val: string, mode: "lowercase" | "uppercase" | "titlecase" | "trim" | "none"): string {
  if (!val) return "";
  const trimmed = val.trim();
  switch (mode) {
    case "lowercase":
      return trimmed.toLowerCase();
    case "uppercase":
      return trimmed.toUpperCase();
    case "titlecase":
      return trimmed
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    case "trim":
      return trimmed;
    case "none":
    default:
      return trimmed;
  }
}

/**
 * Converts column name to snake_case and cleans alphanumeric labels
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/[@#\$%\^&\*\(\)\+=\{\}\[\]\|\\:;"'<>\?,\.\/\s]+/g, "_") // Replace spec-chars and spacers with underscore
    .replace(/^_+|_+$/g, "") // Clean trailing/leading underscores
    .toLowerCase();
}

/**
 * Apply the dynamic and manual programmatic values pipeline
 */
export function applyCleaningPipeline(
  rows: any[],
  headers: string[],
  config: CleaningPipelineConfig,
  columnMetrics: ColumnMetric[]
): { cleanedRows: any[]; cleanedHeaders: string[]; logs: string[] } {
  const logs: string[] = [];
  
  if (rows.length === 0) {
    return { cleanedRows: [], cleanedHeaders: headers, logs: ["No rows detected to clean."] };
  }

  // Find column metric quick lookup Map
  const metricMap = new Map<string, ColumnMetric>();
  columnMetrics.forEach((m) => metricMap.set(m.name, m));

  // Determine header translation mapping
  let finalHeaders = [...headers];
  const headerMap: Record<string, string> = {};
  
  headers.forEach((h) => {
    if (config.normalizeHeaders) {
      const normalized = toSnakeCase(h) || `col_${Math.floor(Math.random() * 1000)}`;
      headerMap[h] = normalized;
    } else {
      headerMap[h] = h;
    }
  });

  if (config.normalizeHeaders) {
    finalHeaders = headers.map((h) => headerMap[h]);
    logs.push("Applied Columns Normalization: Transformed labels to clean snake_case names.");
  }

  // Keep columns that are not marked for dropping via 'drop_col'
  const activeHeaders = headers.filter((h) => config.missingValueStrategies[h] !== "drop_col");
  const activeFinalHeaders = activeHeaders.map((h) => headerMap[h]);
  const droppedColCount = headers.length - activeHeaders.length;
  if (droppedColCount > 0) {
    logs.push(`Dropped columns matching threshold or preference: Removed ${droppedColCount} columns.`);
  }

  // Pre-calculate typical modes or replacement references per column to avoid loops in mapping
  const modeFallbackMap: Record<string, any> = {};
  headers.forEach((h) => {
    const rawValues = rows.map((r) => r[h]).filter((v) => !isMissing(v));
    if (rawValues.length > 0) {
      const frequencyMap: Record<string, number> = {};
      let maxFreq = 0;
      let mode = rawValues[0];
      rawValues.forEach((val) => {
        const s = String(val).trim();
        frequencyMap[s] = (frequencyMap[s] || 0) + 1;
        if (frequencyMap[s] > maxFreq) {
          maxFreq = frequencyMap[s];
          mode = val;
        }
      });
      modeFallbackMap[h] = mode;
    } else {
      modeFallbackMap[h] = "Unknown";
    }
  });

  // Keep track of rows to remove
  const rowIndicesToRemove = new Set<number>();

  // Process rows
  let targetData = rows.map((originalRow, rowIndex) => {
    const freshRow: Record<string, any> = {};
    
    for (let i = 0; i < activeHeaders.length; i++) {
      const origHeader = activeHeaders[i];
      const targetHeader = headerMap[origHeader];
      let value = originalRow[origHeader];

      const colMetric = metricMap.get(origHeader);
      const isValMissing = isMissing(value);

      // Handle missing value strategy
      if (isValMissing) {
        const strategy = config.missingValueStrategies[origHeader] || "none";
        if (strategy === "drop_row") {
          rowIndicesToRemove.add(rowIndex);
          freshRow[targetHeader] = null;
          continue;
        } else if (strategy === "mean" && colMetric?.mean !== undefined) {
          value = colMetric.mean;
        } else if (strategy === "median" && colMetric?.median !== undefined) {
          value = colMetric.median;
        } else if (strategy === "mode") {
          value = modeFallbackMap[origHeader];
        } else if (strategy === "constant") {
          value = config.constantValues[origHeader] || "0";
        } else {
          // Keep null representation values
          value = null;
        }
      }

      // If value is still present, cast or format it
      if (value !== null) {
        // Apply Outlier Strategy if column is numerical
        if (colMetric?.type === "numerical") {
          let numVal = typeof value === "number" ? value : Number(String(value).trim().replace(/[\$,]/g, ""));
          if (!isNaN(numVal)) {
            const outlierStrat = config.outlierStrategies[origHeader] || "none";
            if (outlierStrat === "remove_row") {
              const lower = colMetric.lowerFence ?? -Infinity;
              const upper = colMetric.upperFence ?? Infinity;
              if (numVal < lower || numVal > upper) {
                rowIndicesToRemove.add(rowIndex);
                freshRow[targetHeader] = null;
                continue;
              }
            } else if (outlierStrat === "winsorize") {
              const lower = colMetric.lowerFence ?? numVal;
              const upper = colMetric.upperFence ?? numVal;
              if (numVal < lower) {
                numVal = parseFloat(lower.toFixed(4));
              } else if (numVal > upper) {
                numVal = parseFloat(upper.toFixed(4));
              }
            }
            value = numVal;
          }
        }

        // Apply custom data types cast if requested by user
        const castType = config.dataTypeCast[origHeader] || "auto";
        if (castType === "numerical") {
          value = Number(String(value).trim().replace(/[\$,]/g, ""));
          if (isNaN(value)) value = null;
        } else if (castType === "boolean") {
          const s = String(value).trim().toLowerCase();
          value = s === "true" || s === "yes" || s === "1" || s === "t" || value === true || value === 1;
        } else if (castType === "text" || castType === "categorical") {
          value = String(value);
        }

        // Text standardizations
        if (typeof value === "string") {
          const textMode = config.textStandardizations[origHeader] || "none";
          if (textMode !== "none") {
            value = standardizeString(value, textMode);
          }
        }
      }

      freshRow[targetHeader] = value;
    }

    return freshRow;
  });

  // Drop rows marked for exclusion
  if (rowIndicesToRemove.size > 0) {
    targetData = targetData.filter((_, idx) => !rowIndicesToRemove.has(idx));
    logs.push(`Removed Row Records: Filtered out ${rowIndicesToRemove.size} row records containing extreme outliers or unfillable missing entries.`);
  }

  // Handle Duplicates Rows
  if (config.removeDuplicates) {
    const uniqueRowHashes = new Set<string>();
    const originalLength = targetData.length;
    
    targetData = targetData.filter((row) => {
      const hash = JSON.stringify(row);
      if (uniqueRowHashes.has(hash)) {
        return false;
      }
      uniqueRowHashes.add(hash);
      return true;
    });

    const duplicatesRemoved = originalLength - targetData.length;
    if (duplicatesRemoved > 0) {
      logs.push(`Removed Duplicate Records: Pruned ${duplicatesRemoved} identical row instances to avoid training leakage.`);
    }
  }

  logs.push(`Clean Complete: Resulting dataset holds ${targetData.length} records across ${activeHeaders.length} healthy columns.`);

  return {
    cleanedRows: targetData,
    cleanedHeaders: activeFinalHeaders,
    logs,
  };
}
