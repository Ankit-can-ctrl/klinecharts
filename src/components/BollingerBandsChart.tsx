"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  init,
  dispose,
  Chart,
  registerIndicator,
  IndicatorSeries,
  LineType,
  getSupportedIndicators,
} from "klinecharts";
import { Settings, Plus, X, TrendingUp } from "lucide-react";
import { sampleData } from "@/data/sampleData";
import {
  calculateBollingerBands,
  BollingerBandsParams,
  BollingerBandsData,
  DEFAULT_BOLLINGER_PARAMS,
  getBollingerBandsAtTimestamp,
  formatBollingerValue,
} from "@/utils/bollingerBands";
import BollingerBandsSettings from "./BollingerBandsSettings";

export interface BollingerBandsStyle {
  basis: {
    visible: boolean;
    color: string;
    lineWidth: number;
    lineStyle: "solid" | "dashed";
  };
  upper: {
    visible: boolean;
    color: string;
    lineWidth: number;
    lineStyle: "solid" | "dashed";
  };
  lower: {
    visible: boolean;
    color: string;
    lineWidth: number;
    lineStyle: "solid" | "dashed";
  };
  fill: {
    visible: boolean;
    opacity: number;
  };
}

export const DEFAULT_BOLLINGER_STYLE: BollingerBandsStyle = {
  basis: {
    visible: true,
    color: "#3B82F6", // Bright blue - good contrast on dark
    lineWidth: 1,
    lineStyle: "solid",
  },
  upper: {
    visible: true,
    color: "#EF4444", // Bright red - good contrast on dark
    lineWidth: 1,
    lineStyle: "solid",
  },
  lower: {
    visible: true,
    color: "#22C55E", // Bright green - good contrast on dark
    lineWidth: 1,
    lineStyle: "solid",
  },
  fill: {
    visible: true,
    opacity: 0.08, // Slightly more subtle fill
  },
};

// Track if indicator is already registered
let isIndicatorRegistered = false;

// Register custom Bollinger Bands indicator
const registerBollingerBandsIndicator = () => {
  if (isIndicatorRegistered) {
    console.log("BOLL indicator already registered, skipping...");
    return;
  }

  console.log("Registering Bollinger Bands indicator...");

  try {
    registerIndicator({
      name: "BOLL",
      shortName: "BOLL",
      series: IndicatorSeries.Price,
      calcParams: [20, 2], // length, stdDevMultiplier
      shouldOhlc: true,
      precision: 2,
      figures: [
        {
          key: "up",
          title: "BOLL-UP: ",
          type: "line",
          baseValue: 0,
          attrs: ({}) => ({
            color: "#EF4444",
            lineWidth: 2,
          }),
        },
        {
          key: "mid",
          title: "BOLL-MID: ",
          type: "line",
          baseValue: 0,
          attrs: ({}) => ({
            color: "#3B82F6",
            lineWidth: 2,
          }),
        },
        {
          key: "dn",
          title: "BOLL-DN: ",
          type: "line",
          baseValue: 0,
          attrs: ({}) => ({
            color: "#22C55E",
            lineWidth: 2,
          }),
        },
      ],
      calc: (dataList, indicator) => {
        console.log(
          "Calculating Bollinger Bands for",
          dataList.length,
          "data points"
        );
        const { calcParams } = indicator;
        const [length, stdDevMultiplier] = calcParams as [number, number];

        const params: BollingerBandsParams = {
          length,
          stdDevMultiplier,
          offset: 0,
          source: "close",
          maType: "SMA",
        };

        const candleData = dataList.map((d) => ({
          timestamp: d.timestamp,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
          volume: d.volume || 0,
        }));

        const bollingerData = calculateBollingerBands(candleData, params);

        const result = bollingerData.map((bb) => ({
          up: isNaN(bb.upper) ? null : bb.upper,
          mid: isNaN(bb.basis) ? null : bb.basis,
          dn: isNaN(bb.lower) ? null : bb.lower,
        }));

        console.log(
          "Bollinger calculation result (first 5):",
          result.slice(0, 5)
        );
        console.log("Bollinger calculation result (last 5):", result.slice(-5));

        // Log some specific values to see if they're valid
        const validResults = result.filter(
          (r) => r.up !== null && r.mid !== null && r.dn !== null
        );
        console.log(`Valid results: ${validResults.length}/${result.length}`);
        if (validResults.length > 0) {
          console.log("Sample valid result:", validResults[0]);
        }

        return result;
      },
    });

    isIndicatorRegistered = true;
    console.log("Bollinger Bands indicator registered successfully");

    // Check what indicators are now available
    const supportedIndicators = getSupportedIndicators();
    console.log(
      "Supported indicators after registration:",
      supportedIndicators
    );
  } catch (error) {
    console.error("❌ Error registering Bollinger Bands indicator:", error);
  }
};

const BollingerBandsChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [indicatorAdded, setIndicatorAdded] = useState(false);
  const [bollIndicatorId, setBollIndicatorId] = useState<string | null>(null);

  // Debug logging
  console.log(
    "BollingerBandsChart render - indicatorAdded:",
    indicatorAdded,
    "showAddMenu:",
    showAddMenu
  );
  const [bollingerParams, setBollingerParams] = useState<BollingerBandsParams>(
    DEFAULT_BOLLINGER_PARAMS
  );
  const [bollingerStyle, setBollingerStyle] = useState<BollingerBandsStyle>(
    DEFAULT_BOLLINGER_STYLE
  );
  const [bollingerData, setBollingerData] = useState<BollingerBandsData[]>([]);
  const [crosshairData, setCrosshairData] = useState<{
    timestamp: number;
    basis: number;
    upper: number;
    lower: number;
  } | null>(null);

  // Close add menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Don't close if clicking on the add button or its children
      if (target?.closest(".add-indicator-container")) {
        return;
      }
      if (showAddMenu) {
        setShowAddMenu(false);
      }
    };

    if (showAddMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAddMenu]);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Register the custom Bollinger Bands indicator
    registerBollingerBandsIndicator();

    // Initialize KLineCharts with basic configuration
    const chart = init(chartContainerRef.current);

    chartRef.current = chart;

    // Load sample data (convert to KLineData format)
    const klineData = sampleData.map((item) => ({
      timestamp: item.timestamp,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
    }));
    chart?.applyNewData(klineData);

    // Use mouse events for crosshair data since KLineCharts API varies

    // Fallback to mouse events for crosshair data
    const handleMouseMove = (event: MouseEvent) => {
      if (indicatorAdded && bollIndicatorId && chartRef.current) {
        const rect = chartContainerRef.current?.getBoundingClientRect();
        if (rect) {
          const x = event.clientX - rect.left;

          // Try to get indicator data from the chart
          const indicators = chartRef.current.getIndicators({
            id: bollIndicatorId,
          });
          if (indicators.length > 0) {
            const indicator = indicators[0];
            const result = indicator.result;

            if (result && result.length > 0) {
              const dataIndex = Math.floor((x / rect.width) * result.length);

              if (dataIndex >= 0 && dataIndex < result.length) {
                const bbData = result[dataIndex] as {
                  up: number | null;
                  mid: number | null;
                  dn: number | null;
                };
                if (
                  bbData &&
                  bbData.up !== null &&
                  bbData.mid !== null &&
                  bbData.dn !== null
                ) {
                  // Get timestamp from original data
                  const timestamp =
                    sampleData[dataIndex]?.timestamp || Date.now();
                  setCrosshairData({
                    timestamp,
                    basis: bbData.mid,
                    upper: bbData.up,
                    lower: bbData.dn,
                  });
                }
              }
            }
          }
        }
      }
    };

    chartContainerRef.current?.addEventListener("mousemove", handleMouseMove);

    // Cleanup function
    return () => {
      if (chartContainerRef.current) {
        chartContainerRef.current.removeEventListener(
          "mousemove",
          handleMouseMove
        );
      }
      if (chartRef.current) {
        dispose(chartContainerRef.current!);
        chartRef.current = null;
      }
    };
  }, [indicatorAdded, bollIndicatorId]);

  // Update indicator when params or style change
  useEffect(() => {
    if (indicatorAdded && bollIndicatorId && chartRef.current) {
      // Update indicator parameters and styles
      chartRef.current.overrideIndicator({
        id: bollIndicatorId,
        name: "BOLL",
        calcParams: [bollingerParams.length, bollingerParams.stdDevMultiplier],
        styles: {
          lines: [
            {
              color: bollingerStyle.upper.color,
              size: bollingerStyle.upper.lineWidth,
              style:
                bollingerStyle.upper.lineStyle === "dashed"
                  ? LineType.Dashed
                  : LineType.Solid,
            },
            {
              color: bollingerStyle.basis.color,
              size: bollingerStyle.basis.lineWidth,
              style:
                bollingerStyle.basis.lineStyle === "dashed"
                  ? LineType.Dashed
                  : LineType.Solid,
            },
            {
              color: bollingerStyle.lower.color,
              size: bollingerStyle.lower.lineWidth,
              style:
                bollingerStyle.lower.lineStyle === "dashed"
                  ? LineType.Dashed
                  : LineType.Solid,
            },
          ],
        },
      });
    }
  }, [bollingerParams, bollingerStyle, indicatorAdded, bollIndicatorId]);

  const handleParamsChange = (newParams: BollingerBandsParams) => {
    setBollingerParams(newParams);
  };

  const handleStyleChange = (newStyle: BollingerBandsStyle) => {
    setBollingerStyle(newStyle);
  };

  const addBollingerBands = () => {
    console.log("Adding Bollinger Bands indicator...");
    if (chartRef.current) {
      console.log("Chart reference exists, creating indicator...");

      try {
        // Create the indicator on the main price pane
        console.log("Attempting to create BOLL indicator...");
        const indicatorId = chartRef.current.createIndicator("BOLL");
        console.log(
          "Raw indicator ID result:",
          indicatorId,
          "Type:",
          typeof indicatorId
        );

        if (indicatorId) {
          setBollIndicatorId(indicatorId);
          setIndicatorAdded(true);
          console.log(
            "✅ Bollinger Bands added successfully with ID:",
            indicatorId
          );

          // Log the created indicator details
          const createdIndicator = chartRef.current.getIndicators({
            id: indicatorId,
          })[0];
          console.log("Created indicator details:", createdIndicator);

          // Check if the indicator has result data
          if (createdIndicator && createdIndicator.result) {
            console.log(
              "Indicator result length:",
              createdIndicator.result.length
            );
            console.log(
              "Sample result data:",
              createdIndicator.result.slice(-3)
            );
          }

          // Log current indicators
          const indicators = chartRef.current.getIndicators();
          console.log("All indicators on chart:", indicators);

          // Try to get the specific indicator we just created
          const ourIndicator = chartRef.current.getIndicators({ name: "BOLL" });
          console.log("Our BOLL indicator:", ourIndicator);
        } else {
          console.error(
            "❌ Failed to create Bollinger Bands indicator - ID is null/undefined"
          );
        }
      } catch (error) {
        console.error("❌ Error creating indicator:", error);
      }
    } else {
      console.error("❌ Chart reference is null");
    }
    setShowAddMenu(false);
  };

  const removeBollingerBands = () => {
    if (chartRef.current && bollIndicatorId) {
      chartRef.current.removeIndicator({ id: bollIndicatorId });
      setBollIndicatorId(null);
    }
    setIndicatorAdded(false);
    setBollingerData([]);
    setCrosshairData(null);
    console.log("Bollinger Bands removed");
  };

  return (
    <div className="w-full h-screen bg-gray-900 relative">
      {/* Chart Container */}
      <div
        ref={chartContainerRef}
        className="w-full h-full"
        style={{ pointerEvents: "auto" }}
      />

      {/* Crosshair Info */}
      {crosshairData && indicatorAdded && (
        <div className="absolute top-4 left-4 bg-gray-800 text-white p-3 rounded-lg shadow-lg text-sm border border-gray-700">
          <div className="font-semibold mb-2">Bollinger Bands</div>
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">Upper:</span>
              <span style={{ color: bollingerStyle.upper.color }}>
                {formatBollingerValue(crosshairData.upper)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">Basis:</span>
              <span style={{ color: bollingerStyle.basis.color }}>
                {formatBollingerValue(crosshairData.basis)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">Lower:</span>
              <span style={{ color: bollingerStyle.lower.color }}>
                {formatBollingerValue(crosshairData.lower)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Top Control Bar */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        {/* Add Indicator Button */}
        {!indicatorAdded && (
          <div className="relative add-indicator-container">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Add Indicator button clicked!", showAddMenu);
                setShowAddMenu(!showAddMenu);
              }}
              className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg shadow-lg transition-colors flex items-center gap-1 cursor-pointer relative z-20"
              title="Add Indicator"
              type="button"
            >
              <Plus size={20} />
              <span className="text-sm font-medium">Add Indicator</span>
            </button>

            {/* Add Indicator Menu */}
            {showAddMenu && (
              <div className="absolute top-12 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl min-w-48 z-50">
                <div className="p-2">
                  <div className="text-xs text-gray-400 px-2 py-1 font-medium">
                    TECHNICAL INDICATORS
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("Bollinger Bands menu item clicked!");
                      addBollingerBands();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-700 rounded flex items-center gap-2 text-white transition-colors cursor-pointer"
                    type="button"
                  >
                    <TrendingUp size={16} />
                    <div>
                      <div className="font-medium">Bollinger Bands</div>
                      <div className="text-xs text-gray-400">BB (20, 2)</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Indicator Controls (when added) */}
        {indicatorAdded && (
          <>
            <button
              onClick={() => setShowSettings(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg shadow-lg transition-colors"
              title="Bollinger Bands Settings"
            >
              <Settings size={20} />
            </button>

            <button
              onClick={removeBollingerBands}
              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg shadow-lg transition-colors"
              title="Remove Bollinger Bands"
            >
              <X size={20} />
            </button>
          </>
        )}
      </div>

      {/* Active Indicators List */}
      {indicatorAdded && (
        <div className="absolute bottom-4 left-4 bg-gray-800 text-white p-2 rounded-lg shadow-lg text-sm border border-gray-700">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-400" />
            <span className="font-medium">Bollinger Bands</span>
            <span className="text-gray-400 text-xs">
              ({bollingerParams.length}, {bollingerParams.stdDevMultiplier})
            </span>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <BollingerBandsSettings
          params={bollingerParams}
          style={bollingerStyle}
          onParamsChange={handleParamsChange}
          onStyleChange={handleStyleChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default BollingerBandsChart;
