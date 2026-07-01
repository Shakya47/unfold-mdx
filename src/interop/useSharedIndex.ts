import { useState, useCallback } from "react";

/**
 * A thin convenience hook to manage selection index state that can drive
 * both `<Depth>` and a Code Hike provider or layout component.
 * 
 * Clamps the index value dynamically to [0, totalLevels - 1].
 */
export function useSharedIndex(totalLevels: number) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const clampedIndex = Math.max(0, Math.min(selectedIndex, totalLevels - 1));

  const advance = useCallback(() => {
    setSelectedIndex((prev) => Math.min(prev + 1, totalLevels - 1));
  }, [totalLevels]);

  const back = useCallback(() => {
    setSelectedIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const setIndex = useCallback(
    (index: number) => {
      setSelectedIndex(Math.max(0, Math.min(index, totalLevels - 1)));
    },
    [totalLevels]
  );

  return {
    selectedIndex: totalLevels > 0 ? clampedIndex : 0,
    advance,
    back,
    setIndex,
  };
}
