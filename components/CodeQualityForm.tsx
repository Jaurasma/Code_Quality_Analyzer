// components/CodeQualityForm.tsx
"use client";

import { useState } from "react";
import FilePicker from "./FilePicker";

interface AnalyzeResponse {
  score: number;
  reasoning: string;
}

const CodeQualityForm = () => {
  // New state variables
  const [repoInput, setRepoInput] = useState(""); // Tracks input field
  const [activeRepo, setActiveRepo] = useState(""); // Tracks confirmed repo
  const [filePath, setFilePath] = useState("");
  const [sha, setSha] = useState("");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handles file selection from FilePicker
  const handleFileSelect = (selectedFilePath: string, selectedSha: string) => {
    setFilePath(selectedFilePath);
    setSha(selectedSha);
  };

  // Handles the "Load Repository" button click
  const handleLoadRepo = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent form submission
    if (!repoInput.trim()) {
      setError("Please enter a GitHub repository.");
      return;
    }
    setActiveRepo(repoInput.trim());
    setError("");
  };

  // Handles form submission for analysis
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sha) {
      setError("Please select a file to analyze.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo: activeRepo, sha }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze code");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Repository Input Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          GitHub Repo (owner/repo)
        </label>
        <div className="flex space-x-2 mt-1">
          <input
            type="text"
            placeholder="e.g., facebook/react"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            required
            className="flex-grow border border-gray-300 rounded-md p-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleLoadRepo}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm"
          >
            Load Repo
          </button>
        </div>
      </div>

      {/* FilePicker Section - Only Rendered When activeRepo is Set */}
      {activeRepo && (
        <FilePicker repo={activeRepo} onFileSelect={handleFileSelect} />
      )}

      {/* Analyze Button */}
      <button
        type="submit"
        disabled={loading || !sha}
        className={`w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition ${
          (loading || !sha) && "opacity-50 cursor-not-allowed"
        }`}
      >
        {loading ? "Analyzing..." : "Analyze"}
      </button>

      {/* Error Message */}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Analysis Result */}
      {result && (
        <div className="mt-6 p-4 border border-gray-200 rounded-md bg-white shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">
            Quality Score: {result.score}
          </h2>
          <p className="mt-2 text-gray-700">Reasoning: {result.reasoning}</p>
        </div>
      )}
    </form>
  );
};

export default CodeQualityForm;
