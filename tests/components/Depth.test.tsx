import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import "@testing-library/jest-dom/vitest";
import { Depth } from "../../src/components/Depth.js";
import { DepthLevel } from "../../src/components/DepthLevel.js";

// Helper to wait one animation frame (clearing justReturned)
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
    const backBtn = container.querySelector("[data-unfold-back]")!;

    expect(backBtn).toHaveAttribute("aria-disabled", "true");
    expect(nextBtn).toHaveAttribute("aria-disabled", "false");

    // Advance to Level 1
    await user.click(nextBtn);

    expect(root).toHaveAttribute("data-level", "1");
    expect(root).toHaveAttribute("aria-label", "how it works");
    expect(backBtn).toHaveAttribute("aria-disabled", "false");
    expect(backBtn).toHaveAttribute("aria-label", "Go back to level: overview");
    expect(nextBtn).toHaveAttribute("aria-label", "Advance to level: why it works");

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
    const backBtn = container.querySelector("[data-unfold-back]")!;

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

    // Settle to equal after decay
    expect(spans[0]).toHaveAttribute("data-sentence", "equal");
    expect(spans[1]).toHaveAttribute("data-sentence", "equal");
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
    const backBtn = container.querySelector("[data-unfold-back]")!;

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
    const { container } = render(sampleMdx);

    const root = container.querySelector("[data-unfold-root]");
    expect(root).toBeInTheDocument();
    expect(root).toHaveAttribute("role", "region");
    expect(root).toHaveAttribute("aria-label", "overview");

    const content = container.querySelector("[data-unfold-content]");
    expect(content).toBeInTheDocument();
    expect(content).toHaveAttribute("aria-live", "polite");

    const controls = container.querySelector("[data-unfold-controls]");
    expect(controls).toBeInTheDocument();

    const backBtn = container.querySelector("[data-unfold-back]")!;
    const nextBtn = container.querySelector("[data-unfold-next]")!;
    expect(backBtn).toBeInTheDocument();
    expect(nextBtn).toBeInTheDocument();

    expect(backBtn).toHaveAttribute("aria-disabled", "true");
    expect(nextBtn).toHaveAttribute("aria-disabled", "false");
    expect(nextBtn).toHaveAttribute("aria-label", "Advance to level: how it works");
  });

  it("should support SSR / no-JS fallback rendering", () => {
    const mdx = (
      <Depth defaultIndex={0}>
        <DepthLevel label="overview">Sentence one.</DepthLevel>
        <DepthLevel label="how it works">Sentence one. Sentence two.</DepthLevel>
        <DepthLevel label="why it works">Sentence one. Sentence two. Sentence three.</DepthLevel>
      </Depth>
    );

    const serverHtml = renderToString(mdx);

    // Verify root contains all DepthLevel containers and accessibility attributes
    expect(serverHtml).toContain('data-unfold-root="true"');
    expect(serverHtml).toContain('data-level="2"'); // last level by default
    expect(serverHtml).toContain('data-total-levels="3"');
    expect(serverHtml).toContain('role="region"');
    expect(serverHtml).toContain('aria-label="why it works"');

    // Verify all 3 DepthLevels are present with data-depth-level="true"
    expect(serverHtml).toContain('data-depth-level="true"');
    
    // Verify only the last level has data-unfold-active="true"
    expect(serverHtml).toContain('<div data-depth-level="true">Sentence one.</div>');
    expect(serverHtml).toContain('<div data-depth-level="true">Sentence one. Sentence two.</div>');
    expect(serverHtml).toContain('<div data-depth-level="true" data-unfold-active="true">Sentence one. Sentence two. Sentence three.</div>');
  });
});
