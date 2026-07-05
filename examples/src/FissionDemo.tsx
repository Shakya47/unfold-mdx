import { Depth, DepthLevel } from "../../src/index.js";

export default function FissionDemo() {
  return (
    <div className="demo-card">
      <div className="demo-header">
        <h2>Nuclear Fission</h2>
      </div>
      <p className="demo-desc">
        Prose-only progressive disclosure. New sentences appear with a subtle border highlight
        that decays when you advance again.
      </p>

      <Depth defaultIndex={0} show="prose" indicators buttonVariant="arrow" highlight={false}>
        <DepthLevel label="Overview">
          Nuclear fission splits a heavy atom into two lighter ones.
          This releases a large amount of energy.
        </DepthLevel>

        <DepthLevel label="How it works">
          Nuclear fission splits a heavy atom into two lighter ones.
          This releases a large amount of energy.
          The split is triggered by a neutron striking the nucleus, causing it to become unstable and divide.
        </DepthLevel>

        <DepthLevel label="Why it works">
          Nuclear fission splits a heavy atom into two lighter ones.
          This releases a large amount of energy.
          The split is triggered by a neutron striking the nucleus, causing it to become unstable and divide.
          The energy comes from the mass difference between the original atom and its products — described by E=mc².
          Each fission event also releases additional neutrons, enabling a chain reaction.
        </DepthLevel>
      </Depth>
    </div>
  );
}
