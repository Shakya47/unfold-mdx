import { createContext } from "react";

export interface DepthContextValue {
  selectedIndex: number;
  totalLevels: number;
  labels: string[];
  advance: () => void;
  back: () => void;
}

export const DepthContext = createContext<DepthContextValue | null>(null);
