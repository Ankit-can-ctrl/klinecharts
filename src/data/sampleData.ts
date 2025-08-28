export interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Generate realistic OHLCV data for demo purposes
export function generateSampleData(count: number = 250): CandleData[] {
  const data: CandleData[] = [];
  let currentPrice = 100; // Starting price
  const baseTime = Date.now() - count * 24 * 60 * 60 * 1000; // Start from 'count' days ago

  for (let i = 0; i < count; i++) {
    const timestamp = baseTime + i * 24 * 60 * 60 * 1000; // Daily candles

    // Generate realistic price movements with some trend and volatility
    const trend = Math.sin(i / 20) * 0.5; // Long-term trend
    const volatility = (Math.random() - 0.5) * 4; // Random volatility
    const priceChange = trend + volatility;

    currentPrice = Math.max(1, currentPrice + priceChange); // Ensure price stays positive

    // Generate OHLC values
    const open = currentPrice;
    const rangeFactor = Math.random() * 0.1 + 0.02; // 2-12% range
    const range = open * rangeFactor;

    const high = open + Math.random() * range;
    const low = open - Math.random() * range;

    // Close price influences next candle's open
    const closeDirection = Math.random() - 0.5;
    const close = open + closeDirection * range * 0.7;
    currentPrice = close;

    // Ensure OHLC logic is maintained
    const actualHigh = Math.max(open, high, low, close);
    const actualLow = Math.min(open, high, low, close);

    // Generate volume (higher volume on bigger price moves)
    const volumeBase = 1000000;
    const volumeVariation = Math.abs(priceChange) * 500000;
    const volume = Math.floor(
      volumeBase + volumeVariation + Math.random() * 2000000
    );

    data.push({
      timestamp,
      open: Math.round(open * 100) / 100,
      high: Math.round(actualHigh * 100) / 100,
      low: Math.round(actualLow * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    });
  }

  return data;
}

// Convert to KLineCharts format
export function convertToKLineFormat(data: CandleData[]) {
  return data.map((candle) => ({
    timestamp: candle.timestamp,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
  }));
}

// Sample data instance
export const sampleData = generateSampleData(250);
