import { createContext } from "react";

export interface DepthContextValue {
  selectedIndex: number;
  totalSteps: number;
  labels: string[];
  show: "both" | "prose" | "code";
  orientation: "horizontal" | "vertical";
  goTo: (index: number) => void;
  advance: () => void;
  back: () => void;
}

export const DepthContext = createContext<DepthContextValue | null>(null);
