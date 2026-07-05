import React from "react";

export interface DepthLevelProps {
  label: string;
  children: React.ReactNode;
  [key: string]: any;
}

/**
 * DepthLevel acts as a slot component to hold a level's label and prose snapshot.
 * 
 * - Inside <Depth> (after mounting/hydration), it is parsed and not rendered directly.
 * - Outside <Depth> (or during SSR / before hydration), it falls back to rendering
 *   its children wrapped in a container with a data-depth-level attribute.
 */
export function DepthLevel({ label, children, ...props }: DepthLevelProps) {
  return (
    <div data-depth-level {...props}>
      {children}
    </div>
  );
}

DepthLevel.unfoldType = "level";
