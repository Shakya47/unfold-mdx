import { useState } from "react";
import FissionDemo from "./FissionDemo.tsx";
import QuicksortDemo from "./QuicksortDemo.tsx";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState<"fission" | "quicksort">("fission");

  return (
    <div className="app-wrapper">
      <h1 className="main-title">unfold-mdx Demos</h1>
      <p className="subtitle">
        Interactive demonstrations of progressive-depth prose explanations.
      </p>

      <div className="tab-controls">
        <button
          className={`tab-btn ${activeTab === "fission" ? "active" : ""}`}
          onClick={() => setActiveTab("fission")}
        >
          Nuclear Fission (Standalone)
        </button>
        <button
          className={`tab-btn ${activeTab === "quicksort" ? "active" : ""}`}
          onClick={() => setActiveTab("quicksort")}
        >
          Quicksort (Code Hike Sync)
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "fission" ? <FissionDemo /> : <QuicksortDemo />}
      </div>
    </div>
  );
}
