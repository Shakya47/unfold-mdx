import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSharedIndex } from "../../src/interop/index.js";

describe("useSharedIndex hook", () => {
  it("should initialize at index 0", () => {
    const { result } = renderHook(() => useSharedIndex(3));
    expect(result.current.selectedIndex).toBe(0);
  });

  it("should advance within clamped boundaries", () => {
    const { result } = renderHook(() => useSharedIndex(3));

    // Advance once -> index 1
    act(() => {
      result.current.advance();
    });
    expect(result.current.selectedIndex).toBe(1);

    // Advance twice -> index 2 (last index)
    act(() => {
      result.current.advance();
    });
    expect(result.current.selectedIndex).toBe(2);

    // Advance again -> stays at index 2
    act(() => {
      result.current.advance();
    });
    expect(result.current.selectedIndex).toBe(2);
  });

  it("should go back within clamped boundaries", () => {
    const { result } = renderHook(() => useSharedIndex(3));

    // Set to last index directly
    act(() => {
      result.current.setIndex(2);
    });
    expect(result.current.selectedIndex).toBe(2);

    // Go back once -> index 1
    act(() => {
      result.current.back();
    });
    expect(result.current.selectedIndex).toBe(1);

    // Go back twice -> index 0
    act(() => {
      result.current.back();
    });
    expect(result.current.selectedIndex).toBe(0);

    // Go back again -> stays at index 0
    act(() => {
      result.current.back();
    });
    expect(result.current.selectedIndex).toBe(0);
  });

  it("should clamp values set by setIndex", () => {
    const { result } = renderHook(() => useSharedIndex(3));

    // Set within boundaries
    act(() => {
      result.current.setIndex(1);
    });
    expect(result.current.selectedIndex).toBe(1);

    // Set negative value -> clamped to 0
    act(() => {
      result.current.setIndex(-10);
    });
    expect(result.current.selectedIndex).toBe(0);

    // Set excessive value -> clamped to totalLevels - 1 (2)
    act(() => {
      result.current.setIndex(99);
    });
    expect(result.current.selectedIndex).toBe(2);
  });

  it("should clamp current index dynamically if totalLevels decreases", () => {
    let totalLevels = 4;
    const { result, rerender } = renderHook(() => useSharedIndex(totalLevels));

    act(() => {
      result.current.setIndex(3); // index 3
    });
    expect(result.current.selectedIndex).toBe(3);

    // Decrease totalLevels to 2
    totalLevels = 2;
    rerender();

    // Index should automatically clamp to 1 (2 - 1) on next render
    expect(result.current.selectedIndex).toBe(1);

    // Decrease totalLevels to 0 or negative
    totalLevels = 0;
    rerender();
    expect(result.current.selectedIndex).toBe(0);
  });
});
