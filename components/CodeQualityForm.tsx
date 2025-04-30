"use client";

import React, { useState, useEffect } from "react";
import FilePicker from "./FilePicker";
import ReactMarkdown from "react-markdown";
import { loadHistory, saveHistory } from "@/utils/localStorageUtils";
import { AnalyzeResponse, HistoryItem } from "@/types/types";
import { useSession } from "next-auth/react";
import ClipLoader from "react-spinners/ClipLoader";
import debounce from "lodash.debounce";

// Header component for the hero section
const Header = () => (
  <header className="bg-indigo-600 text-white py-6 px-4 rounded-lg text-center shadow-md">
    <h1 className="text-3xl font-bold">Code Quality Analyzer 🚀</h1>
    <p className="mt-2 text-lg">
      Assess and elevate your code quality with actionable insights.
    </p>
  </header>
);

// Card component for each step
interface StepCardProps {
  step: number;
  title: string;
  children: React.ReactNode;
}
const StepCard: React.FC<StepCardProps> = ({ step, title, children }) => (
  <div className="border rounded-lg p-4 shadow-sm bg-white text-black">
    <div className="flex items-center mb-2">
      <span className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 font-bold">
        {step}
      </span>
      <h2 className="text-xl font-semibold">{title}</h2>
    </div>
    <div>{children}</div>
  </div>
);

// Result card with details always expanded by default
const ResultCard: React.FC<{ result: AnalyzeResponse }> = ({ result }) => {
  // Set default expanded to true
  const [expanded, setExpanded] = useState(true);

  const scoreClass =
    result.score >= 80
      ? "text-green-500"
      : result.score >= 60
      ? "text-yellow-500"
      : result.score >= 40
      ? "text-orange-500"
      : "text-red-500";

  return (
    <div className="border rounded-lg p-4 bg-white shadow-md mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Quality Score:{" "}
          <span
            className={`ml-2 px-2 py-1 rounded-full text-xl font-bold ${scoreClass}`}
          >
            {result.score}
          </span>
        </h2>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-indigo-600 hover:underline"
        >
          {expanded ? "Hide Details" : "Show Details"}
        </button>
      </div>
      {expanded && (
        <div className="mt-4">
          <ReactMarkdown className="prose prose-sm text-gray-700">
            {result.reasoning}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

const CodeQualityForm = () => {
  const { data: session, status } = useSession();
  const [repoInput, setRepoInput] = useState("");
  const [shaInput, setShaInput] = useState("");
  const [activeRepo, setActiveRepo] = useState("");
  const [activeSha, setActiveSha] = useState("");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFocus, setSelectedFocus] = useState("None");
  const [customFocus, setCustomFocus] = useState("");

  // Load history when session is active
  useEffect(() => {
    if (session) {
      const storedHistory = loadHistory();
      setHistory(storedHistory);
    }
  }, [session]);

  // Add analysis to history (prepended)
  const addToHistory = (item: HistoryItem) => {
    setHistory((prev) => {
      const updated = [item, ...prev];
      saveHistory(updated);
      return updated;
    });
  };

  // File selection handler
  const handleFileSelect = (selectedFilePath: string, selectedSha: string) => {
    setActiveSha(selectedSha);
    setShaInput(selectedSha);
    setError("");
  };

  // Parse repository input from URL or owner/repo string
  const parseRepoInput = (input: string): string | null => {
    try {
      const url = new URL(input);
      if (url.hostname !== "github.com") return null;
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length < 2) return null;
      return `${parts[0]}/${parts[1]}`;
    } catch {
      const parts = input.split("/");
      if (parts.length !== 2) return null;
      const [owner, repo] = parts;
      if (!owner || !repo) return null;
      return `${owner}/${repo}`;
    }
  };

  // Load repository handler
  const handleLoadRepo = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const parsed = parseRepoInput(repoInput.trim());
    if (!parsed) {
      setError("Invalid repository format. Use URL or 'owner/repo'.");
      return;
    }
    setActiveRepo(parsed);
    setError("");
    setResult(null);
    setShaInput("");
    setActiveSha("");
  };

  // Debounce functions to avoid rapid submissions
  const debouncedHandleLoadRepo = debounce(handleLoadRepo, 500, {
    leading: true,
    trailing: false,
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!activeRepo.trim()) {
      setError("Please load a repository.");
      return;
    }
    if (!activeSha.trim()) {
      setError("Please select a file or enter a SHA.");
      return;
    }
    const extraQuestion =
      selectedFocus === "Custom"
        ? customFocus
        : selectedFocus !== "None"
        ? selectedFocus
        : "";

    setLoading(true);
    setError("");
    setResult(null);
    console.log(extraQuestion);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo: activeRepo,
          sha: activeSha,
          extraQuestion,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze code");
      }
      setResult(data);
      addToHistory({ repo: activeRepo, sha: activeSha, result: data });
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };
  const debouncedHandleSubmit = debounce(handleSubmit, 500, {
    leading: true,
    trailing: false,
  });
  const handleManualShaInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShaInput(e.target.value);
    setActiveSha(e.target.value);
  };

  const clearHistory = () => {
    if (loading) return;
    if (confirm("Are you sure you want to clear the analysis history?")) {
      setHistory([]);
      saveHistory([]);
    }
  };

  // If session is loading, show spinner
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <ClipLoader color="#4F46E5" size={50} />
      </div>
    );
  }
  // If not authenticated, show sign-in prompt
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full transform transition duration-300 hover:scale-105">
          <div className="flex justify-center mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="currentColor"
              className="mr-2"
              viewBox="0 0 1792 1792"
            >
              <path d="M896 128q209 0 385.5 103t279.5 279.5 103 385.5q0 251-146.5 451.5t-378.5 277.5q-27 5-40-7t-13-30q0-3 .5-76.5t.5-134.5q0-97-52-142 57-6 102.5-18t94-39 81-66.5 53-105 20.5-150.5q0-119-79-206 37-91-8-204-28-9-81 11t-92 44l-38 24q-93-26-192-26t-192 26q-16-11-42.5-27t-83.5-38.5-85-13.5q-45 113-8 204-79 87-79 206 0 85 20.5 150t52.5 105 80.5 67 94 39 102.5 18q-39 36-49 103-21 10-45 15t-57 5-65.5-21.5-55.5-62.5q-19-32-48.5-52t-49.5-24l-20-3q-21 0-29 4.5t-5 11.5 9 14 13 12l7 5q22 10 43.5 38t31.5 51l10 23q13 38 44 61.5t67 30 69.5 7 55.5-3.5l23-4q0 38 .5 88.5t.5 54.5q0 18-13 30t-40 7q-232-77-378.5-277.5t-146.5-451.5q0-209 103-385.5t279.5-279.5 385.5-103zm-477 1103q3-7-7-12-10-3-13 2-3 7 7 12 9 6 13-2zm31 34q7-5-2-16-10-9-16-3-7 5 2 16 10 10 16 3zm30 45q9-7 0-19-8-13-17-6-9 5 0 18t17 7zm42 42q8-8-4-19-12-12-20-3-9 8 4 19 12 12 20 3zm57 25q3-11-13-16-15-4-19 7t13 15q15 6 19-6zm63 5q0-13-17-11-16 0-16 11 0 13 17 11 16 0 16-11zm58-10q-2-11-18-9-16 3-14 15t18 8 14-14z"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800 text-center mb-4">
            Welcome to Code Quality Analyzer 🚀
          </h1>
          <p className="text-gray-700 text-center mb-6">
            Unlock the full potential of your code with detailed analysis and
            actionable feedback.
          </p>
          <ul className="list-disc list-inside text-gray-700 text-left mb-6 space-y-2">
            <li className="flex items-start">
              <span className="mr-2">1️⃣</span>
              <span>
                <strong>Sign in with GitHub</strong> to explore repositories.
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">2️⃣</span>
              <span>
                <strong>Select a Repository</strong> and choose a file or enter
                a SHA.
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">3️⃣</span>
              <span>
                <strong>Receive Detailed Feedback</strong> on your code quality.
              </span>
            </li>
          </ul>
          <p className="text-gray-500 text-center text-sm mt-4">
            Get started by signing in to GitHub from the top right corner.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4">
      <Header />
      <form onSubmit={(e) => debouncedHandleSubmit(e)} className="space-y-8">
        {/* Step 1: Load Repository */}
        <StepCard step={1} title="Load Repository">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <input
              id="repoInput"
              type="text"
              placeholder="e.g., https://github.com/facebook/react or facebook/react"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              disabled={loading}
              className="flex-grow border border-gray-300 rounded-md p-2 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={(e) => debouncedHandleLoadRepo(e)}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm"
            >
              Load Repo
            </button>
          </div>
          {activeRepo && (
            <p className="mt-2 text-sm text-gray-600">
              Loaded repository: <strong>{activeRepo}</strong>
            </p>
          )}
        </StepCard>

        {/* Step 2: Select File or Enter SHA */}
        <StepCard step={2} title="Select File or Enter SHA">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-black">
            <input
              id="shaInput"
              type="text"
              placeholder="Enter SHA or select a file"
              value={shaInput}
              onChange={handleManualShaInput}
              disabled={loading}
              className="flex-grow border border-gray-300 rounded-md p-2 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          {activeRepo && (
            <div className="mt-4">
              <FilePicker
                key={activeRepo}
                repo={activeRepo}
                onFileSelect={handleFileSelect}
                disabled={loading}
              />
            </div>
          )}
        </StepCard>

        {/* Step 3: Analyze Code */}
        <StepCard step={3} title="Analyze Code">
          <div className="space-y-4">
            {/* Extra context dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Extra Context (optional)
              </label>
              <select
                value={selectedFocus}
                onChange={(e) => setSelectedFocus(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="None">None</option>
                <option value="Focus on Comments">Focus on Comments</option>
                <option value="Focus on Readability">
                  Focus on Readability
                </option>
                <option value="Focus on Accessibility">
                  Focus on Accessibility
                </option>
                <option value="Custom">Custom</option>
              </select>
            </div>
            {/* Conditional custom input */}
            {selectedFocus === "Custom" && (
              <div>
                <input
                  type="text"
                  placeholder="Enter your custom extra context"
                  value={customFocus}
                  onChange={(e) => setCustomFocus(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !activeSha || !activeRepo}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition text-sm"
            >
              {loading ? "Analyzing..." : "Analyze"}
            </button>
            {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
          </div>
        </StepCard>
      </form>

      {/* Analysis Result */}
      {result && <ResultCard result={result} />}

      {/* History Section */}
      {history.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">History</h2>
            <button
              onClick={clearHistory}
              disabled={loading}
              className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm"
            >
              Clear History
            </button>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {history.map((item, index) => (
              <div
                key={`${item.repo}-${item.sha}-${index}`}
                className="border rounded-lg p-4 bg-gray-50 shadow-sm"
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
                <button
                  onClick={() => setResult(item.result)}
                  className="mt-2 text-indigo-600 hover:underline text-sm"
                >
                  View Analysis
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeQualityForm;
