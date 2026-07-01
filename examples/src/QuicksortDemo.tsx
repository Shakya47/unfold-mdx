import React from "react";
import { Depth, DepthLevel, useSharedIndex } from "unfold-mdx";

// Since we want the code to run out-of-the-box in the local playground,
// we can simulate Code Hike's SelectionProvider and useSelectedIndex
// directly or import it if codehike is fully installed.
// To avoid potential bundler/ESM package resolution issues with codehike v0.9's internal exports,
// we provide a clean fallback provider that mirrors the exact context contract.
interface SelectionContextValue {
  selectedIndex: number;
}
const SelectionContext = React.createContext<SelectionContextValue>({ selectedIndex: 0 });

function SelectionProvider({ value, children }: { value: number; children: React.ReactNode }) {
  return (
    <SelectionContext.Provider value={{ selectedIndex: value }}>
      {children}
    </SelectionContext.Provider>
  );
}

function useSelectedIndex() {
  return React.useContext(SelectionContext).selectedIndex;
}

// Code snippets corresponding to each quicksort level
const CODE_STEPS = [
  `// Step 1: Base Case & Setup
function quicksort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;
  
  // Choose pivot and partition
  // (click Next to see partitioning details...)
}`,
  `// Step 2: Choose Pivot & Partition
function quicksort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;

  const pivot = arr[arr.length - 1];
  const left = arr.filter((x) => x < pivot);
  const right = arr.filter((x) => x > pivot);

  // Combine and recurse
  // (click Next to see recursive calls...)
}`,
  `// Step 3: Complete Recursive Sort
function quicksort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;

  const pivot = arr[arr.length - 1];
  const left = arr.filter((x) => x < pivot);
  const right = arr.filter((x) => x > pivot);

  return [...quicksort(left), pivot, ...quicksort(right)];
}`,
];

function CodePane() {
  const selectedIndex = useSelectedIndex();
  return (
    <div className="code-pane">
      <div className="code-header">
        <span className="file-name">quicksort.ts</span>
        <span className="step-indicator">Step {selectedIndex + 1} of 3</span>
      </div>
      <pre>
        <code>{CODE_STEPS[selectedIndex]}</code>
      </pre>
    </div>
  );
}

export default function QuicksortDemo() {
  const totalLevels = 3;
  const { selectedIndex, setIndex } = useSharedIndex(totalLevels);

  return (
    <div className="demo-container">
      <div className="demo-header">
        <h2>Quicksort</h2>
        <span className="badge">Code Hike Sync Demo</span>
      </div>
      <p className="demo-desc">
        Demonstrates the <code>useSharedIndex</code> hook driving both the prose
        pane and the code panel in synchronization.
      </p>

      <SelectionProvider value={selectedIndex}>
        <div className="split-layout">
          {/* Prose Pane */}
          <div className="prose-pane">
            <Depth selectedIndex={selectedIndex} onChange={setIndex}>
              <DepthLevel label="Overview">
                Quicksort is a divide-and-conquer sorting algorithm.
                It selects a 'pivot' element and partitions the array.
              </DepthLevel>

              <DepthLevel label="Partitioning">
                Quicksort is a divide-and-conquer sorting algorithm.
                It selects a 'pivot' element and partitions the array.
                Elements smaller than the pivot are moved before it, and elements
                larger are moved after.
              </DepthLevel>

              <DepthLevel label="Recursion">
                Quicksort is a divide-and-conquer sorting algorithm.
                It selects a 'pivot' element and partitions the array.
                Elements smaller than the pivot are moved before it, and elements
                larger are moved after.
                The algorithm then recursively sorts the sub-arrays on both sides
                of the pivot.
              </DepthLevel>
            </Depth>
          </div>

          {/* Code Pane */}
          <CodePane />
        </div>
      </SelectionProvider>
    </div>
  );
}
