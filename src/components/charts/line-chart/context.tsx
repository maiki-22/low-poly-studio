"use client";

import { createContext, useContext } from "react";
import type { LineChartSeries } from "./model";

export type ChartContext = {
  series: readonly LineChartSeries[];
  visible: readonly LineChartSeries[];
  categories: readonly string[];
  activeIndex: number;
  setActiveIndex: (index: number | null) => void;
  hidden: readonly string[];
  toggleSeries: (id: string) => void;
  formatValue: (value: number) => string;
  formatCategory: (value: string) => string;
  domain?: readonly [number, number];
  label: string;
};
export const LineChartContext = createContext<ChartContext | null>(null);
export function useLineChart(): ChartContext {
  const context = useContext(LineChartContext);
  if (!context)
    throw new Error(
      "Chart components must be rendered inside LineChart.",
    );
  return context;
}
