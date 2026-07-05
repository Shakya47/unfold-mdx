import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import "@testing-library/jest-dom/vitest";
import { Depth } from "../../src/components/Depth.js";
import { DepthLevel } from "../../src/components/DepthLevel.js";
import { DepthCode } from "../../src/components/DepthCode.js";

// Helper to wait one animation frame (clearing justEntered)
const waitAnimationFrame = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      // Allow react state updates to process
      setTimeout(resolve, 0);
    });
  });

describe("<Depth> Component", () => {
  const sampleMdx = (
    <Depth defaultIndex={0}>
      <DepthLevel label="overview">
        Nuclear fission splits a heavy atom. This releases energy.
      </DepthLevel>
      <DepthLevel label="how it works">
        Nuclear fission splits a heavy atom. This releases energy. The split is triggered by a neutron.
      </DepthLevel>
      <DepthLevel label="why it works">
        Nuclear fission splits a heavy atom. This releases energy. The split is triggered by a neutron. The energy comes from E=mc2.
      </DepthLevel>
      <DepthCode lang="js">{"console.log(1);"}</DepthCode>
      <DepthCode lang="js">{"console.log(1);\nconsole.log(2);"}</DepthCode>
      <DepthCode lang="js">{"console.log(1);\nconsole.log(2);\nconsole.log(3);"}</DepthCode>
    </Depth>
  );

  it("should render uncontrolled mode and start at defaultIndex (0)", () => {
    const { container } = render(sampleMdx);

    const root = container.querySelector("[data-unfold-root]");
    expect(root).toBeInTheDocument();
    expect(root).toHaveAttribute("data-level", "0");
    expect(root).toHaveAttribute("data-total-levels", "3");
    expect(root).toHaveAttribute("role", "region");
    expect(root).toHaveAttribute("aria-label", "overview");

    const spans = container.querySelectorAll("[data-sentence]");
    expect(spans).toHaveLength(2);
    // Since it's bootstrapped at level 0 (diff against empty), both sentences should be added
    expect(spans[0]).toHaveAttribute("data-sentence", "added");
    expect(spans[0].textContent?.trim()).toBe("Nuclear fission splits a heavy atom.");
    expect(spans[1]).toHaveAttribute("data-sentence", "added");
    expect(spans[1].textContent?.trim()).toBe("This releases energy.");
  });

  it("should support uncontrolled navigation forward", async () => {
    const user = userEvent.setup();
    const { container } = render(sampleMdx);

    const root = container.querySelector("[data-unfold-root]");
    const nextBtn = container.querySelector("[data-unfold-next]")!;
    const backBtn = container.querySelector("[data-unfold-prev]")!;

    expect(backBtn).toHaveAttribute("aria-disabled", "true");
    expect(nextBtn).toHaveAttribute("aria-disabled", "false");

    // Advance to Level 1
    await user.click(nextBtn);

    expect(root).toHaveAttribute("data-level", "1");
    expect(root).toHaveAttribute("aria-label", "how it works");
    expect(backBtn).toHaveAttribute("aria-disabled", "false");
    expect(backBtn).toHaveAttribute("aria-label", "Go back to step: overview");
    expect(nextBtn).toHaveAttribute("aria-label", "Advance to step: why it works");

    const spans = container.querySelectorAll("[data-sentence]");
    expect(spans).toHaveLength(3);
    // Previously added sentences decay to equal, new sentence is added
    expect(spans[0]).toHaveAttribute("data-sentence", "equal");
    expect(spans[1]).toHaveAttribute("data-sentence", "equal");
    expect(spans[2]).toHaveAttribute("data-sentence", "added");
    expect(spans[2].textContent?.trim()).toBe("The split is triggered by a neutron.");
  });

  it("should support uncontrolled navigation backward with re-flash and decay", async () => {
    const user = userEvent.setup();
    const { container } = render(sampleMdx);

    const nextBtn = container.querySelector("[data-unfold-next]")!;
    const backBtn = container.querySelector("[data-unfold-prev]")!;

    // Move to level 1 (2 equal sentences, 1 added sentence)
    await user.click(nextBtn);

    // Move back to level 0 (sentences are Nuclear fission splits a heavy atom. This releases energy.)
    await act(async () => {
      await user.click(backBtn);
    });

    const spans = container.querySelectorAll("[data-sentence]");
    // Immediately after going back, the added sentences of level 0 re-flash as "added"
    expect(spans[0]).toHaveAttribute("data-sentence", "added");
    expect(spans[1]).toHaveAttribute("data-sentence", "added");

    // Wait for the animation frame to clear justReturned state (decay)
    await act(async () => {
      await waitAnimationFrame();
    });

    // Settle to added (no decay per user feedback)
    expect(spans[0]).toHaveAttribute("data-sentence", "added");
    expect(spans[1]).toHaveAttribute("data-sentence", "added");
  });

  it("should render controlled mode and support navigation", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container, rerender } = render(
      <Depth selectedIndex={1} onChange={onChange}>
        <DepthLevel label="overview">Sentence one.</DepthLevel>
        <DepthLevel label="details">Sentence one. Sentence two.</DepthLevel>
      </Depth>
    );

    const root = container.querySelector("[data-unfold-root]");
    expect(root).toHaveAttribute("data-level", "1");

    const nextBtn = container.querySelector("[data-unfold-next]")!;
    const backBtn = container.querySelector("[data-unfold-prev]")!;

    // Next is disabled because it is at the last level
    expect(nextBtn).toHaveAttribute("aria-disabled", "true");

    // Click Back
    await user.click(backBtn);
    expect(onChange).toHaveBeenCalledWith(0);

    // Because it is controlled, the level shouldn't change unless rerendered with new selectedIndex
    expect(root).toHaveAttribute("data-level", "1");

    // Rerender with selectedIndex = 0
    rerender(
      <Depth selectedIndex={0} onChange={onChange}>
        <DepthLevel label="overview">Sentence one.</DepthLevel>
        <DepthLevel label="details">Sentence one. Sentence two.</DepthLevel>
      </Depth>
    );

    expect(root).toHaveAttribute("data-level", "0");
  });

  it("should output correct HTML structures and attributes", () => {
    const { container } = render(
      <Depth indicators={true}>
        <DepthLevel label="overview">Sentence one.</DepthLevel>
        <DepthLevel label="details">Sentence one. Sentence two.</DepthLevel>
      </Depth>
    );

    const root = container.querySelector("[data-unfold-root]");
    expect(root).toBeInTheDocument();
    expect(root).toHaveAttribute("role", "region");
    expect(root).toHaveAttribute("aria-label", "overview");
    expect(root).toHaveAttribute("data-show", "both");
    expect(root).toHaveAttribute("data-orientation", "horizontal");

    const panes = container.querySelector("[data-unfold-panes]");
    expect(panes).toBeInTheDocument();

    const prosePane = container.querySelector("[data-unfold-pane='prose']");
    expect(prosePane).toBeInTheDocument();
    expect(prosePane).toHaveAttribute("aria-live", "polite");

    const codePane = container.querySelector("[data-unfold-pane='code']");
    expect(codePane).toBeInTheDocument();
    expect(codePane).toHaveAttribute("aria-live", "polite");

    const controls = container.querySelector("[data-unfold-controls]");
    expect(controls).toBeInTheDocument();

    const backBtn = container.querySelector("[data-unfold-prev]")!;
    const nextBtn = container.querySelector("[data-unfold-next]")!;
    expect(backBtn).toBeInTheDocument();
    expect(nextBtn).toBeInTheDocument();

    const indicators = container.querySelector("[data-unfold-indicators]");
    expect(indicators).toBeInTheDocument();
    const dots = container.querySelectorAll("[data-unfold-dot]");
    expect(dots).toHaveLength(2);

    expect(backBtn).toHaveAttribute("aria-disabled", "true");
    expect(nextBtn).toHaveAttribute("aria-disabled", "false");
    expect(nextBtn).toHaveAttribute("aria-label", "Advance to step: details");
  });

  it("should extract label from DepthCode and support data-enter animation on advance", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Depth defaultIndex={0}>
        <DepthLevel label="step 1">First</DepthLevel>
        <DepthCode>{"const a = 1;"}</DepthCode>
        <DepthCode label="step 2 code">{"const b = 2;"}</DepthCode>
      </Depth>
    );

    const root = container.querySelector("[data-unfold-root]");
    const nextBtn = container.querySelector("[data-unfold-next]")!;
    
    // Label from DepthLevel for step 0
    expect(root).toHaveAttribute("aria-label", "step 1");
    
    await user.click(nextBtn);
    
    // Label from DepthCode for step 1 (since there is no DepthLevel for step 1)
    expect(root).toHaveAttribute("aria-label", "step 2 code");

    // Check data-enter is applied immediately on advance on the code line
    const codeLines = container.querySelectorAll("[data-code-line]");
    const changedLine = Array.from(codeLines).find(t => t.getAttribute("data-code-line") === "changed" || t.getAttribute("data-code-line") === "added");
    expect(changedLine).toHaveAttribute("data-enter", "true");

    // Wait for animation frame decay
    await act(async () => {
      await waitAnimationFrame();
    });

    // Check data-enter is removed from the line
    expect(changedLine).not.toHaveAttribute("data-enter");
  });

  it("should support SSR / no-JS fallback rendering with deepest level marking", () => {
    const mdx = (
      <Depth defaultIndex={0}>
        <DepthLevel label="overview">Sentence one.</DepthLevel>
        <DepthCode lang="js">{"one"}</DepthCode>
        <DepthLevel label="how it works">Sentence one. Sentence two.</DepthLevel>
        <DepthCode lang="js">{"two"}</DepthCode>
        <DepthLevel label="why it works">Sentence one. Sentence two. Sentence three.</DepthLevel>
        <DepthCode lang="js">{"three"}</DepthCode>
      </Depth>
    );

    const serverHtml = renderToString(mdx);

    // Verify root contains accessibility attributes
    expect(serverHtml).toContain('data-unfold-root="true"');
    expect(serverHtml).toContain('data-level="2"'); // last level by default
    expect(serverHtml).toContain('data-total-levels="3"');
    expect(serverHtml).toContain('role="region"');
    expect(serverHtml).toContain('aria-label="why it works"');

    // Verify deepest prose is marked
    expect(serverHtml).toContain('<div data-depth-level="true" data-unfold-active="true">Sentence one. Sentence two. Sentence three.</div>');
    // Verify earlier prose is not marked
    expect(serverHtml).toContain('<div data-depth-level="true">Sentence one.</div>');
    
    // Verify deepest code is marked
    expect(serverHtml).toContain('<pre data-lang="js" data-unfold-active="true"><code>three</code></pre>');
    // Verify earlier code is not marked
    expect(serverHtml).toContain('<pre data-lang="js"><code>one</code></pre>');
  });

  it("should support disabling highlights via highlight={false}", () => {
    const { container } = render(
      <Depth defaultIndex={0} highlight={false}>
        <DepthLevel label="overview">Sentence one. Sentence two.</DepthLevel>
        <DepthCode lang="js">{"const x = 1;"}</DepthCode>
      </Depth>
    );

    const sentences = container.querySelectorAll("[data-sentence]");
    expect(sentences).toHaveLength(2);
    expect(sentences[0]).toHaveAttribute("data-sentence", "equal");
    expect(sentences[1]).toHaveAttribute("data-sentence", "equal");

    const codeLines = container.querySelectorAll("[data-code-line]");
    expect(codeLines).toHaveLength(1);
    expect(codeLines[0]).toHaveAttribute("data-code-line", "equal");
  });
});
