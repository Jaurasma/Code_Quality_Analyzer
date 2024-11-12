// components/CodeQualityForm.tsx
"use client";

import { useState } from "react";
import FilePicker from "./FilePicker";
import ReactMarkdown from "react-markdown";
// import AnalyzeCodeWithLLM from "./AnalyzeCodeWithLLM"; // Ensure correct import path

interface AnalyzeResponse {
  score: number;
  reasoning: string;
}

const CodeQualityForm = () => {
  // State variables for repository and SHA
  const [repoInput, setRepoInput] = useState(""); // Tracks input field for repo
  const [shaInput, setShaInput] = useState(""); // Tracks input field for SHA

  // State variables for active repo and SHA from FilePicker
  const [activeRepo, setActiveRepo] = useState(""); // Confirmed repo
  const [activeSha, setActiveSha] = useState(""); // Confirmed SHA

  // State variables for analysis result, loading, and error
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Handles file selection from FilePicker.
   * Sets the active SHA based on the selected file.
   * @param selectedFilePath - Path of the selected file
   * @param selectedSha - SHA of the selected file
   */
  const handleFileSelect = (selectedFilePath: string, selectedSha: string) => {
    setActiveSha(selectedSha);
    setShaInput(selectedSha); // Update SHA input field
    setError("");
  };

  /**
   * Parses the repository input to extract owner and repo.
   * Supports both full URLs and owner/repo formats.
   * @param input - The repository input string.
   * @returns The extracted owner/repo string or null if invalid.
   */
  const parseRepoInput = (input: string): string | null => {
    try {
      // Check if input is a URL
      const url = new URL(input);
      if (url.hostname !== "github.com") return null;
      const paths = url.pathname.split("/").filter(Boolean);
      if (paths.length < 2) return null;
      return `${paths[0]}/${paths[1]}`;
    } catch {
      // If not a URL, assume it's in owner/repo format
      const parts = input.split("/");
      if (parts.length !== 2) return null;
      const [owner, repo] = parts;
      if (!owner || !repo) return null;
      return `${owner}/${repo}`;
    }
  };

  /**
   * Handles the "Load Repository" button click.
   * Sets the active repository based on user input.
   * @param e - Form event
   */
  const handleLoadRepo = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent form submission
    if (!repoInput.trim()) {
      setError("Please enter a GitHub repository.");
      return;
    }
    const parsedRepo = parseRepoInput(repoInput.trim());
    if (!parsedRepo) {
      setError(
        "Invalid repository format. Please enter a valid GitHub repository URL or 'owner/repo'."
      );
      return;
    }
    setActiveRepo(parsedRepo);
    setError("");
    setResult(null); // Clear previous results
    setShaInput(""); // Reset SHA input
    setActiveSha("");
  };

  /**
   * Handles form submission for analysis.
   * Sends the repository and SHA to the API for analysis.
   * @param e - Form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRepo.trim()) {
      setError("Please load a repository.");
      return;
    }
    if (!activeSha.trim()) {
      setError("Please select a file or enter a SHA to analyze.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo: activeRepo, sha: activeSha }),
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

  /**
   * Handles manual input of SHA.
   * @param e - Input change event
   */
  const handleManualShaInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShaInput(e.target.value);
    setActiveSha(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Repository Input Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          GitHub Repo (URL or owner/repo)
        </label>
        <div className="flex space-x-2 mt-1 text-gray-700">
          <input
            type="text"
            placeholder="e.g., https://github.com/facebook/react or facebook/react"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            required={!activeRepo}
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

      {/* SHA Input Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          SHA of the File
        </label>
        <div className="flex space-x-2 mt-1 text-gray-700">
          <input
            type="text"
            placeholder="Enter SHA or select a file"
            value={shaInput}
            onChange={handleManualShaInput}
            className="flex-grow border border-gray-300 rounded-md p-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* FilePicker Section - Only Rendered When activeRepo is Set */}
      {activeRepo && (
        <FilePicker repo={activeRepo} onFileSelect={handleFileSelect} />
      )}

      {/* Analyze Button */}
      <button
        type="submit"
        disabled={loading || !activeSha || !activeRepo}
        className={`w-full px-4 py-2 bg-blue-600 text-black rounded-md hover:bg-blue-700 transition ${
          (loading || !activeSha || !activeRepo) &&
          "opacity-50 cursor-not-allowed"
        }`}
      >
        {loading ? "Analyzing..." : "Analyze"}
      </button>

      {/* Error Message */}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Analysis Result */}
      {result && (
        <div className="mt-6 p-4 border border-gray-200 rounded-md bg-white shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Quality Score: {result.score}
          </h2>
          <ReactMarkdown className="prose prose-sm text-gray-700">
            {result.reasoning}
          </ReactMarkdown>
        </div>
      )}
    </form>
  );
};

export default CodeQualityForm;
