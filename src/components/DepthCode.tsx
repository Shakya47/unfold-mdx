import React from "react";

export interface DepthCodeProps extends React.HTMLAttributes<HTMLPreElement> {
  lang?: string;
  label?: string;
  children: string;
}

export function DepthCode({ lang, label, children, ...rest }: DepthCodeProps) {
  // DepthCode acts as a slot component within Depth.
  // When rendered outside of Depth context (or as fallback), it renders a simple pre/code block.
  return (
    <pre data-lang={lang} {...rest}>
      <code>{children}</code>
    </pre>
  );
}

DepthCode.unfoldType = "code";
