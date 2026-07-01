import { Depth, DepthLevel } from "unfold-mdx";

export default function FissionDemo() {
  return (
    <div className="demo-container">
      <div className="demo-header">
        <h2>Nuclear Fission</h2>
        <span className="badge">Standalone Depth Demo</span>
      </div>
      <p className="demo-desc">
        Demonstrates the package's core progressive prose disclosure. Advance
        through the levels below to reveal more detailed explanations. New
        sentences will highlight in yellow.
      </p>

      <Depth defaultIndex={0}>
        <DepthLevel label="Overview">
          Nuclear fission splits a heavy atom into two lighter ones.
          This releases a large amount of energy.
        </DepthLevel>

        <DepthLevel label="How it works">
          Nuclear fission splits a heavy atom into two lighter ones.
          This releases a large amount of energy.
          The split is triggered by a neutron striking the nucleus,
          causing it to become unstable and divide.
        </DepthLevel>

        <DepthLevel label="Why it works">
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
    </div>
  );
}
