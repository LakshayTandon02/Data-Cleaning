/**
 * Structural types for the Data Cleaner application.
 */

export type ColumnDataType = "numerical" | "categorical" | "date" | "text" | "boolean";

export interface ColumnMetric {
  name: string;
  type: ColumnDataType;
  missingCount: number;
  missingPercentage: number;
  uniqueCount: number;
  uniqueValues: string[];
  sampleValues: Array<string | number>;
  
  // Numerical only
  mean?: number;
  median?: number;
  stdDev?: number;
  min?: number;
  max?: number;
  outlierIndexes?: number[]; // indices of rows containing outliers for this column
  lowerFence?: number;
  upperFence?: number;
}

export interface DatasetDetails {
  name: string;
  size: string;
  rowCount: number;
  columnCount: number;
}

export interface CleaningPipelineConfig {
  normalizeHeaders: boolean; // convert to snake_case, trim, remove special characters
  removeDuplicates: boolean;

  // Keyed by column name
  missingValueStrategies: Record<string, "mean" | "median" | "mode" | "drop_row" | "drop_col" | "constant" | "none">;
  constantValues: Record<string, string>; // constant string/number representation

  outlierStrategies: Record<string, "winsorize" | "remove_row" | "none">;

  textStandardizations: Record<string, "lowercase" | "uppercase" | "titlecase" | "trim" | "none">;

  // Custom column conversions
  dataTypeCast: Record<string, ColumnDataType | "auto">;
}

export interface CleaningHistoryLog {
  action: string;
  timestamp: string;
  details: string;
}

export interface AnalysisPayload {
  datasetSummary: DatasetDetails;
  columns: ColumnMetric[];
  originalStats: {
    duplicateRowsCount: number;
    rowsCount: number;
    colsCount: number;
  };
  sampleRows: any[];
}
