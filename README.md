# unfold-mdx

`unfold-mdx` is a standalone npm package that adds progressive-depth prose explanations to React + MDX pipelines. Authors write full text snapshots at each depth level; the library diffs consecutive snapshots at sentence granularity, highlights newly-added or modified sentences when the reader advances a level, and decays that highlight when the reader advances again. The component renders inline — no accordion collapses, no page navigation, and no scroll-jumps.

---

## Installation

Install the package via npm or your preferred package manager:

```bash
npm install unfold-mdx
```

### Peer Dependencies
- `react` >= 18
- `react-dom` >= 18

---

## Quick Start

Import the components and write multiple snapshots inside `<Depth>` elements:

```mdx
import { Depth, DepthLevel } from "unfold-mdx";

<Depth defaultIndex={0}>
  <DepthLevel label="overview">
    Nuclear fission splits a heavy atom into two lighter ones.
    This releases a large amount of energy.
  </DepthLevel>

  <DepthLevel label="how it works">
    Nuclear fission splits a heavy atom into two lighter ones.
    This releases a large amount of energy.
    The split is triggered by a neutron striking the nucleus,
    causing it to become unstable and divide.
  </DepthLevel>

  <DepthLevel label="why it works">
    Nuclear fission splits a heavy atom into two lighter ones.
    This releases a large amount of energy.
    The split is triggered by a neutron striking the nucleus,
    causing it to become unstable and divide.
    The energy comes from the mass difference between the original atom
    and its products — described by E=mc².
    Each fission event also releases additional neutrons,
    enabling a chain reaction.
  </DepthLevel>
</Depth>
```

---

## Styling (Headless Approach)

`unfold-mdx` is **headless** and ships with zero CSS styles. You have full styling control using standard CSS attribute selectors.

### HTML DOM Output Structure

```html
<div data-unfold-root role="region" aria-label="how it works" data-level="1" data-total-levels="3">
  <div data-unfold-content aria-live="polite">
    <span data-sentence="equal">Nuclear fission splits a heavy atom into two lighter ones. </span>
    <span data-sentence="equal">This releases a large amount of energy. </span>
    <span data-sentence="added">The split is triggered by a neutron striking the nucleus, causing it to become unstable and divide. </span>
  </div>
  <div data-unfold-controls>
    <button data-unfold-back aria-disabled="false" aria-label="Go back to level: overview">Back</button>
    <button data-unfold-next aria-disabled="false" aria-label="Advance to level: why it works">Next</button>
  </div>
</div>
```

### Example CSS Styling

```css
/* Root Container styling */
[data-unfold-root] {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 24px;
  max-width: 640px;
}

/* Sentence formatting styles */
[data-sentence="equal"] {
  color: #374151;
  transition: background-color 0.4s ease, color 0.4s ease;
}

[data-sentence="added"] {
  background: #fef9c3; /* Yellow highlight for newly revealed sentences */
  color: #111827;
  border-radius: 3px;
  padding: 1px 2px;
}

/* Controls and navigation buttons */
[data-unfold-controls] {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  align-items: center;
}

[data-unfold-controls] button {
  padding: 6px 18px;
  border-radius: 5px;
  border: 1px solid #cbd5e1;
  background: #f1f5f9;
  cursor: pointer;
}

[data-unfold-controls] button[aria-disabled="true"] {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

## Composing with Code Hike

`unfold-mdx` integrates cleanly with Code Hike using a shared step index. This allows a single controller to synchronize your prose pane and Code Hike code layout panels (e.g. `<CH.Spotlight>`).

Use the `useSharedIndex` hook to manage the selection index at the page level and spread it to both components:

```mdx
import { Depth, DepthLevel, useSharedIndex } from "unfold-mdx";
import { SelectionProvider } from "codehike/utils/selection";

export const MyInteractivePage = () => {
  const totalLevels = 3;
  const { selectedIndex, advance, back, setIndex } = useSharedIndex(totalLevels);

  return (
    <SelectionProvider value={selectedIndex}>
      <div style={{ display: "flex", gap: "2rem" }}>
        {/* Prose Pane */}
        <Depth selectedIndex={selectedIndex} onChange={setIndex}>
          <DepthLevel label="overview">...</DepthLevel>
          <DepthLevel label="how it works">...</DepthLevel>
          <DepthLevel label="why it works">...</DepthLevel>
        </Depth>

        {/* Code Pane driven by the same index */}
        <CH.Spotlight>
          {/* Spotlight steps */}
        </CH.Spotlight>
      </div>
    </SelectionProvider>
  );
};
```

> [!NOTE]
> `SelectionProvider` is imported directly from Code Hike (`codehike/utils/selection`). `unfold-mdx` does not re-export or bundle Code Hike. If Code Hike is absent, `useSharedIndex` still works to control the `<Depth>` pane alone.

---

## API Reference

### `<Depth>` Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `selectedIndex` | `number` | — | Controlled current depth index (0-based). Used when `onChange` is also provided. |
| `defaultIndex` | `number` | `0` | Uncontrolled initial depth index. |
| `onChange` | `(i: number) => void` | — | Callback fired when the reader navigates to a new depth index. |
| `children` | `ReactNode` | — | One or more `<DepthLevel>` components. |

### `<DepthLevel>` Props

| Prop | Type | Description |
| --- | --- | --- |
| `label` | `string` | The human-readable name of the level (e.g. "overview"). |
| `children` | `ReactNode` | Full prose snapshot text/content for this level. |

### `useSharedIndex(totalLevels: number)` return shape

Returns an object with:
- `selectedIndex: number` - The clamped index.
- `advance: () => void` - Increments the index (clamped to `totalLevels - 1`).
- `back: () => void` - Decrements the index (clamped to `0`).
- `setIndex: (i: number) => void` - Sets the index directly (clamped to `[0, totalLevels - 1]`).

### `SentenceDiff` Type

```typescript
type SentenceDiff =
  | { kind: "equal";    sentence: string }
  | { kind: "added";    sentence: string }
  | { kind: "removed";  sentence: string }
  | { kind: "modified"; before: string; after: string };
```

---

## SSR / no-JS Fallback

For SSR / no-JS environments, `DepthLevel` falls back to rendering its children directly inside a container with `data-depth-level`. By default, only the last (deepest) level is displayed. 

To hide inactive levels before hydration, add the following CSS rule to your global stylesheet:

```css
[data-unfold-root] [data-depth-level]:not([data-unfold-active]) {
  display: none;
}
```

This ensures a clean, cumulative no-JS presentation where only the final prose level is visible to readers who have JavaScript disabled, while interactive clients take over control automatically post-hydration.

---

## Investigation Note: Using `useSelectedIndex` outside Code Hike Layouts

- **Finding**: `useSelectedIndex()` uses React's context API to read state from the nearest `<SelectionProvider>`. A component **must be a descendant (child)** of `<SelectionProvider>` in the React tree to use the hook. Calling it inside the page-level component that *renders* `<SelectionProvider>` will return `undefined` (because context is not available at the same level as its provider).
- **Recommended Pattern**: Lift selection state to the page level using `useSharedIndex` and pass it down as props directly to `<Depth selectedIndex={selectedIndex} onChange={setIndex}>` and `<SelectionProvider value={selectedIndex}>`.

---

## Examples

We provide interactive, worked demos showing both standalone and synced integration styles in the [examples/](file:///Users/saurabhshakya/Documents/Projects/unfold-mdx/examples) directory:

1. **Nuclear Fission Demo (Standalone)**: Demonstrates `<Depth>` and `<DepthLevel>` usage with headless styling selectors and yellow highlights on newly added sentences.
2. **Quicksort Demo (Code Hike Sync)**: Demonstrates the `useSharedIndex` synchronization hook driving both `<Depth>` and a code highlighted panel via `SelectionProvider` in sync.

---

## License

MIT License
