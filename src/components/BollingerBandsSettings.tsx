"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import {
  BollingerBandsParams,
  DEFAULT_BOLLINGER_PARAMS,
} from "@/utils/bollingerBands";
import {
  BollingerBandsStyle,
  DEFAULT_BOLLINGER_STYLE,
} from "./BollingerBandsChart";

interface BollingerBandsSettingsProps {
  params: BollingerBandsParams;
  style: BollingerBandsStyle;
  onParamsChange: (params: BollingerBandsParams) => void;
  onStyleChange: (style: BollingerBandsStyle) => void;
  onClose: () => void;
}

type TabType = "inputs" | "style";

const BollingerBandsSettings: React.FC<BollingerBandsSettingsProps> = ({
  params,
  style,
  onParamsChange,
  onStyleChange,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("inputs");
  const [localParams, setLocalParams] = useState<BollingerBandsParams>(params);
  const [localStyle, setLocalStyle] = useState<BollingerBandsStyle>(style);

  const handleParamChange = <K extends keyof BollingerBandsParams>(
    key: K,
    value: BollingerBandsParams[K]
  ) => {
    const newParams = { ...localParams, [key]: value };
    setLocalParams(newParams);
    onParamsChange(newParams);
  };

  const handleStyleChange = (
    band: keyof BollingerBandsStyle,
    property: string,
    value: any
  ) => {
    const newStyle = {
      ...localStyle,
      [band]: {
        ...localStyle[band],
        [property]: value,
      },
    };
    setLocalStyle(newStyle);
    onStyleChange(newStyle);
  };

  const resetToDefaults = () => {
    if (activeTab === "inputs") {
      setLocalParams(DEFAULT_BOLLINGER_PARAMS);
      onParamsChange(DEFAULT_BOLLINGER_PARAMS);
    } else {
      setLocalStyle(DEFAULT_BOLLINGER_STYLE);
      onStyleChange(DEFAULT_BOLLINGER_STYLE);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-96 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">
            Bollinger Bands Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab("inputs")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "inputs"
                ? "text-blue-400 border-b-2 border-blue-400 bg-gray-750"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Inputs
          </button>
          <button
            onClick={() => setActiveTab("style")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "style"
                ? "text-blue-400 border-b-2 border-blue-400 bg-gray-750"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Style
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {activeTab === "inputs" ? (
            <div className="space-y-4">
              {/* Length */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Length
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={localParams.length}
                  onChange={(e) =>
                    handleParamChange("length", parseInt(e.target.value) || 20)
                  }
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* MA Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Basic MA Type
                </label>
                <select
                  value={localParams.maType}
                  onChange={(e) =>
                    handleParamChange("maType", e.target.value as "SMA")
                  }
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="SMA">SMA</option>
                </select>
              </div>

              {/* Source */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Source
                </label>
                <select
                  value={localParams.source}
                  onChange={(e) =>
                    handleParamChange(
                      "source",
                      e.target.value as "open" | "high" | "low" | "close"
                    )
                  }
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="close">Close</option>
                  <option value="open">Open</option>
                  <option value="high">High</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* StdDev Multiplier */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  StdDev (multiplier)
                </label>
                <input
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={localParams.stdDevMultiplier}
                  onChange={(e) =>
                    handleParamChange(
                      "stdDevMultiplier",
                      parseFloat(e.target.value) || 2
                    )
                  }
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Offset */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Offset
                </label>
                <input
                  type="number"
                  min="-50"
                  max="50"
                  value={localParams.offset}
                  onChange={(e) =>
                    handleParamChange("offset", parseInt(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Basic (Middle Band) */}
              <div className="border border-gray-600 rounded p-3">
                <h3 className="text-sm font-medium text-gray-300 mb-3">
                  Basic (Middle Band)
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Visible</span>
                    <input
                      type="checkbox"
                      checked={localStyle.basis.visible}
                      onChange={(e) =>
                        handleStyleChange("basis", "visible", e.target.checked)
                      }
                      className="w-4 h-4"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Color</span>
                    <input
                      type="color"
                      value={localStyle.basis.color}
                      onChange={(e) =>
                        handleStyleChange("basis", "color", e.target.value)
                      }
                      className="w-8 h-8 rounded border border-gray-600"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Line Width</span>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={localStyle.basis.lineWidth}
                      onChange={(e) =>
                        handleStyleChange(
                          "basis",
                          "lineWidth",
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="w-16 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Line Style</span>
                    <select
                      value={localStyle.basis.lineStyle}
                      onChange={(e) =>
                        handleStyleChange("basis", "lineStyle", e.target.value)
                      }
                      className="px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-sm"
                    >
                      <option value="solid">Solid</option>
                      <option value="dashed">Dashed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Upper Band */}
              <div className="border border-gray-600 rounded p-3">
                <h3 className="text-sm font-medium text-gray-300 mb-3">
                  Upper Band
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Visible</span>
                    <input
                      type="checkbox"
                      checked={localStyle.upper.visible}
                      onChange={(e) =>
                        handleStyleChange("upper", "visible", e.target.checked)
                      }
                      className="w-4 h-4"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Color</span>
                    <input
                      type="color"
                      value={localStyle.upper.color}
                      onChange={(e) =>
                        handleStyleChange("upper", "color", e.target.value)
                      }
                      className="w-8 h-8 rounded border border-gray-600"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Line Width</span>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={localStyle.upper.lineWidth}
                      onChange={(e) =>
                        handleStyleChange(
                          "upper",
                          "lineWidth",
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="w-16 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Line Style</span>
                    <select
                      value={localStyle.upper.lineStyle}
                      onChange={(e) =>
                        handleStyleChange("upper", "lineStyle", e.target.value)
                      }
                      className="px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-sm"
                    >
                      <option value="solid">Solid</option>
                      <option value="dashed">Dashed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Lower Band */}
              <div className="border border-gray-600 rounded p-3">
                <h3 className="text-sm font-medium text-gray-300 mb-3">
                  Lower Band
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Visible</span>
                    <input
                      type="checkbox"
                      checked={localStyle.lower.visible}
                      onChange={(e) =>
                        handleStyleChange("lower", "visible", e.target.checked)
                      }
                      className="w-4 h-4"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Color</span>
                    <input
                      type="color"
                      value={localStyle.lower.color}
                      onChange={(e) =>
                        handleStyleChange("lower", "color", e.target.value)
                      }
                      className="w-8 h-8 rounded border border-gray-600"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Line Width</span>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={localStyle.lower.lineWidth}
                      onChange={(e) =>
                        handleStyleChange(
                          "lower",
                          "lineWidth",
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="w-16 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Line Style</span>
                    <select
                      value={localStyle.lower.lineStyle}
                      onChange={(e) =>
                        handleStyleChange("lower", "lineStyle", e.target.value)
                      }
                      className="px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-sm"
                    >
                      <option value="solid">Solid</option>
                      <option value="dashed">Dashed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Background Fill */}
              <div className="border border-gray-600 rounded p-3">
                <h3 className="text-sm font-medium text-gray-300 mb-3">
                  Background Fill
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Visible</span>
                    <input
                      type="checkbox"
                      checked={localStyle.fill.visible}
                      onChange={(e) =>
                        handleStyleChange("fill", "visible", e.target.checked)
                      }
                      className="w-4 h-4"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Opacity</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={localStyle.fill.opacity}
                      onChange={(e) =>
                        handleStyleChange(
                          "fill",
                          "opacity",
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-24"
                    />
                    <span className="text-xs text-gray-500 w-8">
                      {Math.round(localStyle.fill.opacity * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-700">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default BollingerBandsSettings;
