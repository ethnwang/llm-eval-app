"use client";

import { useState } from "react";

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.remove(theme);
    document.documentElement.classList.add(newTheme);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold">LLM Comparison Dashboard</h1>
        <button
          onClick={toggleTheme}
          className="px-4 py-2 rounded"
        >
          Toggle {theme === "light" ? "Dark" : "Light"} Mode
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-grow grid grid-cols-3 gap-4 p-4">
        {/* Column 1 */}
        <div className="p-4 rounded shadow" style={{ backgroundColor: "var(--secondary-background)" }}>
          <h2 className="text-lg font-semibold mb-2">LLM 1 Response</h2>
          <p>Response goes here...</p>
        </div>

        {/* Column 2 */}
        <div className="p-4 rounded shadow" style={{ backgroundColor: "var(--secondary-background)" }}>
          <h2 className="text-lg font-semibold mb-2">LLM 2 Response</h2>
          <p>Response goes here...</p>
        </div>

        {/* Column 3 */}
        <div className="p-4 rounded shadow" style={{ backgroundColor: "var(--secondary-background)" }}>
          <h2 className="text-lg font-semibold mb-2">LLM 3 Response</h2>
          <p>Response goes here...</p>
        </div>
      </div>

      {/* Prompt Bar */}
      <footer className="p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="flex-grow px-4 py-2 rounded"
            placeholder="Enter your prompt here..."
          />
          <button className="px-4 py-2 rounded">Submit</button>
        </div>
      </footer>
    </div>
  );
}
