import { useContext } from "react";
import { DepthContext } from "../../context/DepthContext.js";

export interface ControlsProps {
  buttonVariant: "text" | "arrow" | "chevron" | "minimal";
  indicators: boolean;
}

const BUTTON_LABELS: Record<string, { prev: string; next: string }> = {
  text: { prev: "Prev", next: "Next" },
  arrow: { prev: "← Prev", next: "Next →" },
  chevron: { prev: "‹ Prev", next: "Next ›" },
  minimal: { prev: "‹", next: "›" },
};

export function Controls({ buttonVariant, indicators }: ControlsProps) {
  const context = useContext(DepthContext);
  if (!context) return null;

  const { selectedIndex, totalSteps, advance, back, goTo, labels } = context;

  const isFirst = selectedIndex === 0;
  const isLast = selectedIndex === totalSteps - 1;
  const btnText = BUTTON_LABELS[buttonVariant] || BUTTON_LABELS.text;

  return (
    <div data-unfold-controls data-button-variant={buttonVariant}>
      <button
        data-unfold-prev
        aria-disabled={isFirst ? "true" : "false"}
        aria-label={!isFirst ? `Go back to step: ${labels[selectedIndex - 1]}` : undefined}
        onClick={back}
      >
        {btnText.prev}
      </button>
      
      {indicators && (
        <div data-unfold-indicators role="tablist">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === selectedIndex}
              data-unfold-dot
              data-active={i === selectedIndex ? "true" : undefined}
              aria-label={`Go to step: ${labels[i] || i + 1}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}

      <button
        data-unfold-next
        aria-disabled={isLast ? "true" : "false"}
        aria-label={!isLast ? `Advance to step: ${labels[selectedIndex + 1]}` : undefined}
        onClick={advance}
      >
        {btnText.next}
      </button>
    </div>
  );
}
