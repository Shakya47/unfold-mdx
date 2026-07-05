import { useState } from "react";
import FissionDemo from "./FissionDemo.tsx";
import QuicksortDemo from "./QuicksortDemo.tsx";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState<"quicksort" | "fission">("quicksort");

  return (
    <div className="app-wrapper">
      <h1 className="main-title">unfold-mdx</h1>
      <p className="subtitle">
        Progressive-depth prose explanations with sentence diffing and code pane sync.
      </p>

      <div className="tab-controls">
        <button
          className={`tab-btn ${activeTab === "quicksort" ? "active" : ""}`}
          onClick={() => setActiveTab("quicksort")}
        >
          Quicksort — Prose + Code
        </button>
        <button
          className={`tab-btn ${activeTab === "fission" ? "active" : ""}`}
          onClick={() => setActiveTab("fission")}
        >
          Nuclear Fission — Prose Only
        </button>
      </div>

      {activeTab === "quicksort" && <QuicksortDemo />}
      {activeTab === "fission" && <FissionDemo />}
    </div>
  );
}
