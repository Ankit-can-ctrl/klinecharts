import { CandleData } from "@/data/sampleData";

export interface BollingerBandsParams {
  length: number;
  stdDevMultiplier: number;
  offset: number;
  source: "open" | "high" | "low" | "close";
  maType: "SMA"; // Only SMA for this assignment
}

export interface BollingerBandsData {
  timestamp: number;
  basis: number; // Middle band (SMA)
  upper: number; // Upper band
  lower: number; // Lower band
  stdDev: number; // Standard deviation value
}

export const DEFAULT_BOLLINGER_PARAMS: BollingerBandsParams = {
  length: 20,
  stdDevMultiplier: 2,
  offset: 0,
  source: "close",
  maType: "SMA",
};

/**
 * Calculate Simple Moving Average (SMA)
 * @param values Array of values
 * @param period Period for SMA calculation
 * @returns Array of SMA values
 */
function calculateSMA(values: number[], period: number): number[] {
  const sma: number[] = [];

  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      sma.push(NaN); // Not enough data points
    } else {
      const sum = values
        .slice(i - period + 1, i + 1)
        .reduce((acc, val) => acc + val, 0);
      sma.push(sum / period);
    }
  }

  return sma;
}

/**
 * Calculate Standard Deviation using sample standard deviation formula
 * Note: Using sample standard deviation (n-1 denominator) for consistency with most trading platforms
 * @param values Array of values
 * @param period Period for standard deviation calculation
 * @param smaValues Corresponding SMA values to use as mean
 * @returns Array of standard deviation values
 */
function calculateStandardDeviation(
  values: number[],
  period: number,
  smaValues: number[]
): number[] {
  const stdDev: number[] = [];

  for (let i = 0; i < values.length; i++) {
    if (i < period - 1 || isNaN(smaValues[i])) {
      stdDev.push(NaN);
    } else {
      const periodValues = values.slice(i - period + 1, i + 1);
      const mean = smaValues[i];

      // Calculate variance using sample standard deviation (n-1)
      const squaredDifferences = periodValues.map((val) =>
        Math.pow(val - mean, 2)
      );
      const variance =
        squaredDifferences.reduce((acc, val) => acc + val, 0) / (period - 1);
      const standardDeviation = Math.sqrt(variance);

      stdDev.push(standardDeviation);
    }
  }

  return stdDev;
}

/**
 * Apply offset to data array
 * Positive offset shifts data forward (future), negative shifts backward (past)
 * @param data Array of data points
 * @param offset Number of periods to shift
 * @returns Shifted array
 */
function applyOffset<T>(data: T[], offset: number): T[] {
  if (offset === 0) return data;

  const result: T[] = new Array(data.length);

  if (offset > 0) {
    // Shift forward: move data to the right, fill beginning with NaN
    for (let i = 0; i < data.length; i++) {
      if (i < offset) {
        result[i] = NaN as unknown as T;
      } else {
        result[i] = data[i - offset];
      }
    }
  } else {
    // Shift backward: move data to the left, fill end with NaN
    const absOffset = Math.abs(offset);
    for (let i = 0; i < data.length; i++) {
      if (i >= data.length - absOffset) {
        result[i] = NaN as unknown as T;
      } else {
        result[i] = data[i + absOffset];
      }
    }
  }

  return result;
}

/**
 * Calculate Bollinger Bands for given candle data
 * @param candleData Array of OHLCV candle data
 * @param params Bollinger Bands parameters
 * @returns Array of Bollinger Bands data points
 */
export function calculateBollingerBands(
  candleData: CandleData[],
  params: BollingerBandsParams = DEFAULT_BOLLINGER_PARAMS
): BollingerBandsData[] {
  if (candleData.length === 0) return [];

  // Extract source values (close, open, high, low)
  const sourceValues = candleData.map((candle) => candle[params.source]);

  // Calculate SMA (basis/middle band)
  const smaValues = calculateSMA(sourceValues, params.length);

  // Calculate Standard Deviation
  const stdDevValues = calculateStandardDeviation(
    sourceValues,
    params.length,
    smaValues
  );

  // Calculate upper and lower bands
  const upperValues = smaValues.map((sma, i) =>
    isNaN(sma) || isNaN(stdDevValues[i])
      ? NaN
      : sma + params.stdDevMultiplier * stdDevValues[i]
  );

  const lowerValues = smaValues.map((sma, i) =>
    isNaN(sma) || isNaN(stdDevValues[i])
      ? NaN
      : sma - params.stdDevMultiplier * stdDevValues[i]
  );

  // Apply offset if specified
  const offsetSMA = applyOffset(smaValues, params.offset);
  const offsetUpper = applyOffset(upperValues, params.offset);
  const offsetLower = applyOffset(lowerValues, params.offset);
  const offsetStdDev = applyOffset(stdDevValues, params.offset);

  // Combine into result format
  const result: BollingerBandsData[] = candleData.map((candle, i) => ({
    timestamp: candle.timestamp,
    basis: offsetSMA[i],
    upper: offsetUpper[i],
    lower: offsetLower[i],
    stdDev: offsetStdDev[i],
  }));

  return result;
}

/**
 * Get Bollinger Bands value for a specific timestamp
 * @param bollingerData Array of Bollinger Bands data
 * @param timestamp Target timestamp
 * @returns Bollinger Bands data for the timestamp or null if not found
 */
export function getBollingerBandsAtTimestamp(
  bollingerData: BollingerBandsData[],
  timestamp: number
): BollingerBandsData | null {
  return bollingerData.find((data) => data.timestamp === timestamp) || null;
}

/**
 * Format Bollinger Bands value for display
 * @param value Numeric value
 * @param decimals Number of decimal places
 * @returns Formatted string
 */
export function formatBollingerValue(
  value: number,
  decimals: number = 2
): string {
  if (isNaN(value)) return "--";
  return value.toFixed(decimals);
}
