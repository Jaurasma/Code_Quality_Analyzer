// CodeQualityForm.tsx
"use client";

import { useState, useEffect } from "react";
import FilePicker from "./FilePicker"; // Ensure this component exists
import ReactMarkdown from "react-markdown";
import { loadHistory, saveHistory } from "@/utils/localStorageUtils";
import { AnalyzeResponse, HistoryItem } from "@/types/types";

const CodeQualityForm = () => {
  const [repoInput, setRepoInput] = useState("");
  const [shaInput, setShaInput] = useState("");
  const [activeRepo, setActiveRepo] = useState("");
  const [activeSha, setActiveSha] = useState("");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory()); // Initialize from local storage
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Update local storage whenever history changes
  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const addToHistory = (item: HistoryItem) => {
    setHistory((prevHistory) => [...prevHistory, item]);
  };

  const handleFileSelect = (selectedFilePath: string, selectedSha: string) => {
    setActiveSha(selectedSha);
    setShaInput(selectedSha);
    setError("");
  };

  const parseRepoInput = (input: string): string | null => {
    try {
      const url = new URL(input);
      if (url.hostname !== "github.com") return null;
      const paths = url.pathname.split("/").filter(Boolean);
      if (paths.length < 2) return null;
      return `${paths[0]}/${paths[1]}`;
    } catch {
      const parts = input.split("/");
      if (parts.length !== 2) return null;
      const [owner, repo] = parts;
      if (!owner || !repo) return null;
      return `${owner}/${repo}`;
    }
  };

  const handleLoadRepo = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedRepo = parseRepoInput(repoInput.trim());
    if (!parsedRepo) {
      setError(
        "Invalid repository format. Please enter a valid GitHub repository URL or 'owner/repo'."
      );
      return;
    }
    setActiveRepo(parsedRepo);
    setError("");
    setResult(null);
    setShaInput("");
    setActiveSha("");
  };

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

      // Add to history
      addToHistory({ repo: activeRepo, sha: activeSha, result: data });
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualShaInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShaInput(e.target.value);
    setActiveSha(e.target.value);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
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

        {activeRepo && (
          <FilePicker repo={activeRepo} onFileSelect={handleFileSelect} />
        )}

        <button
          type="submit"
          disabled={loading || !activeSha || !activeRepo}
          className={`w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition ${
            (loading || !activeSha || !activeRepo) &&
            "opacity-50 cursor-not-allowed"
          }`}
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>

        {error && <p className="text-red-500 text-sm">{error}</p>}

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

      {/* History Section */}
      {history.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">History</h2>
            <button
              onClick={clearHistory}
              className="px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm"
            >
              Clear History
            </button>
          </div>
          <ul className="mt-4 space-y-4">
            {history.map((item, index) => (
              <li
                key={index}
                className="p-4 border border-gray-200 rounded-md bg-gray-50 shadow-sm"
              >
                <p className="text-sm text-gray-700">
                  <strong>Repo:</strong> {item.repo}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>SHA:</strong> {item.sha}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Score:</strong> {item.result.score}
                </p>
                <ReactMarkdown className="prose prose-sm text-gray-700 mt-2">
                  {item.result.reasoning}
                </ReactMarkdown>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CodeQualityForm;
