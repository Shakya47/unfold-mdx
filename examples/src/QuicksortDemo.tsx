import { useState } from "react";
import { Depth, DepthLevel, DepthCode } from "../../src/index.js";
import { createShikiHighlighter } from "../../src/shiki/index.js";

const highlighter = createShikiHighlighter({
  theme: "vitesse-dark",
  langs: ["typescript"],
});

export default function QuicksortDemo() {
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">("horizontal");

  return (
    <div className="demo-card">
      <div className="demo-header">
        <h2>Quicksort — Step by Step</h2>
        <button
          className="orientation-toggle"
          onClick={() => setOrientation((o) => (o === "horizontal" ? "vertical" : "horizontal"))}
        >
          {orientation === "horizontal" ? "⇄ Horizontal" : "⇅ Vertical"}
        </button>
      </div>
      <p className="demo-desc">
        Click <strong>Next</strong> to progressively reveal the algorithm.
        New prose sentences and new code tokens are marked with a thin border.
      </p>

      <Depth
        show="both"
        orientation={orientation}
        ratio={0.45}
        indicators
        buttonVariant="arrow"
        highlighter={highlighter}
        highlight={false}
      >
        <DepthLevel label="Overview">
          Quicksort is a divide-and-conquer sorting algorithm.
          It selects a 'pivot' element and partitions the array around it.
        </DepthLevel>
        <DepthCode lang="typescript">
{`function quicksort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;
  // choose pivot & partition...
}`}
        </DepthCode>

        <DepthLevel label="Partitioning">
          Quicksort is a divide-and-conquer sorting algorithm.
          It selects a 'pivot' element and partitions the array around it.
          Elements smaller than the pivot go left; larger ones go right.
        </DepthLevel>
        <DepthCode lang="typescript">
{`function quicksort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;

  const pivot = arr[arr.length - 1];
  const left = arr.filter((x) => x < pivot);
  const right = arr.filter((x) => x > pivot);
  // combine & recurse...
}`}
        </DepthCode>

        <DepthLevel label="Recursion">
          Quicksort is a divide-and-conquer sorting algorithm.
          It selects a 'pivot' element and partitions the array around it.
          Elements smaller than the pivot go left; larger ones go right.
          The algorithm recursively sorts both sub-arrays, then combines them with the pivot in the middle.
        </DepthLevel>
        <DepthCode lang="typescript">
{`function quicksort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;

  const pivot = arr[arr.length - 1];
  const left = arr.filter((x) => x < pivot);
  const right = arr.filter((x) => x > pivot);

  return [...quicksort(left), pivot, ...quicksort(right)];
}`}
        </DepthCode>

        <DepthLevel label="Pivot Optimization">
          Quicksort is a divide-and-conquer sorting algorithm.
          It selects a 'pivot' element and partitions the array around it.
          Elements smaller than the pivot go left; larger ones go right.
          The algorithm recursively sorts both sub-arrays, then combines them with the pivot in the middle.
          We can change the pivot selection inline (e.g. to the first element) to experiment with different partitioning strategies.
        </DepthLevel>
        <DepthCode lang="typescript">
{`function quicksort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;

  const pivot = arr[0]; // choose first element
  const left = arr.filter((x) => x < pivot);
  const right = arr.filter((x) => x > pivot);

  return [...quicksort(left), pivot, ...quicksort(right)];
}`}
        </DepthCode>
      </Depth>
    </div>
  );
}
