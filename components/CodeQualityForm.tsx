// components/CodeQualityForm.tsx

"use client";

import { useState, useEffect } from "react";
import FilePicker from "./FilePicker"; // Ensure this component accepts a 'disabled' prop
import ReactMarkdown from "react-markdown";
import { loadHistory, saveHistory } from "@/utils/localStorageUtils";
import { AnalyzeResponse, HistoryItem } from "@/types/types";
import { useSession } from "next-auth/react";
import ClipLoader from "react-spinners/ClipLoader"; // Install react-spinners for loader
import debounce from "lodash.debounce";

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

  // Initialize history from local storage when session is available
  useEffect(() => {
    if (session) {
      const storedHistory = loadHistory();
      setHistory(storedHistory);
    }
  }, [session]);

  // Function to add a new analysis to history (Prepending)
  const addToHistory = (item: HistoryItem) => {
    setHistory((prevHistory) => {
      const updatedHistory = [item, ...prevHistory];
      saveHistory(updatedHistory);
      return updatedHistory;
    });
  };

  // Handler when a file is selected from the FilePicker component
  const handleFileSelect = (selectedFilePath: string, selectedSha: string) => {
    setActiveSha(selectedSha);
    setShaInput(selectedSha);
    setError("");
  };

  // Function to parse repository input (URL or owner/repo)
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

  // Handler to load the repository based on user input
  const handleLoadRepo = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent loading repo during analysis

    const parsedRepo = parseRepoInput(repoInput.trim());
    if (!parsedRepo) {
      setError(
        "Invalid repository format. Please enter a valid GitHub repository URL or 'owner/repo'."
      );
      return;
    }
    setActiveRepo(parsedRepo); // Set the active repository
    setError(""); // Clear any previous errors
    setResult(null); // Reset previous analysis result
    setShaInput(""); // Clear SHA input
    setActiveSha(""); // Clear active SHA
  };

  // Debounced handleSubmit to prevent rapid submissions
  // Debounced handleLoadRepo to prevent rapid clicks
  const debouncedHandleLoadRepo = debounce(handleLoadRepo, 500, {
    leading: true,
    trailing: false,
  });
  // Handler for form submission to analyze code
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent multiple submissions
    if (!activeRepo.trim()) {
      setError("Please load a repository.");
      return;
    }
    if (!activeSha.trim()) {
      setError("Please select a file or enter a SHA to analyze.");
      return;
    }

    setLoading(true); // Set loading state
    setError(""); // Clear previous errors
    setResult(null); // Reset previous result

    try {
      // Make a POST request to the analyze API
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo: activeRepo, sha: activeSha }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze code");
      }

      setResult(data); // Set the analysis result

      // Add the analysis to history (Prepending)
      addToHistory({ repo: activeRepo, sha: activeSha, result: data });
    } catch (err: any) {
      setError(err.message || "Something went wrong."); // Set error message
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  const debouncedHandleSubmit = debounce(handleSubmit, 500, {
    leading: true,
    trailing: false,
  });
  // Handler for manual SHA input changes
  const handleManualShaInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShaInput(e.target.value);
    setActiveSha(e.target.value);
  };

  // Function to clear the analysis history
  const clearHistory = () => {
    if (loading) return; // Prevent clearing history during analysis
    setHistory([]);
    saveHistory([]);
  };

  // Function to determine the Tailwind CSS color class based on the score
  const getScoreColor = (score: number): string => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  // If session is loading
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <ClipLoader color="#3b82f6" size={50} />
      </div>
    );
  }

  // If not authenticated
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full transform transition duration-300 hover:scale-105">
          {/* GitHub Icon */}
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

          {/* Title */}
          <h1 className="text-3xl font-extrabold text-gray-800 text-center mb-4">
            Welcome to Code Quality Analyzer 🚀
          </h1>

          {/* Description */}
          <p className="text-gray-700 text-center mb-6">
            Unlock the full potential of your code! Our{" "}
            <strong>Code Quality Analyzer</strong> helps you assess and elevate
            your code&apos;s quality with insightful analysis and actionable
            feedback.
          </p>

          {/* Features List with Improved Text */}
          <ul className="list-disc list-inside text-gray-700 text-left mb-6 space-y-2">
            {/* Step 1: Sign in */}
            <li className="flex items-start">
              <span className="mr-2">1️⃣</span>
              <span>
                <strong>Sign in with GitHub</strong> to effortlessly explore any
                public repositories or dive deep into your private ones. 🔍
              </span>
            </li>
            {/* Step 2: Select or input repository and SHA */}
            <li className="flex items-start">
              <span className="mr-2">2️⃣</span>
              <span>
                <strong>Select a Repository</strong> and choose the file you
                want to analyze, or enter a specific <code>SHA</code> to analyze
                a particular version of your code. 📂
              </span>
            </li>
            {/* Step 3: Receive feedback */}
            <li className="flex items-start">
              <span className="mr-2">3️⃣</span>
              <span>
                <strong>Receive Detailed Feedback</strong> on your code&apos;s
                quality, including performance metrics and improvement
                suggestions. ✅
              </span>
            </li>
          </ul>

          {/* Additional Information */}
          <p className="text-gray-500 text-center text-sm mt-4">
            Get started by signing in to GitHub from the top right corner.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6 relative">
      {/* Loading Overlay */}
      {loading && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          aria-live="assertive"
          aria-busy="true"
        >
          <ClipLoader color="#ffffff" size={60} />
          <span className="sr-only">Analyzing code, please wait...</span>
        </div>
      )}

      <form onSubmit={debouncedHandleSubmit} className="space-y-6">
        {/* Repository Input Field */}
        <div>
          <label
            htmlFor="repoInput"
            className="block text-sm font-medium text-gray-700"
          >
            GitHub Repo (URL or owner/repo)
          </label>
          <div className="flex space-x-2 mt-1 text-gray-700">
            <input
              id="repoInput"
              type="text"
              placeholder="e.g., https://github.com/facebook/react or facebook/react"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              required={!activeRepo} // Make input required if no active repo is set
              disabled={loading} // Disable input during loading
              className="flex-grow border border-gray-300 rounded-md p-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {/* Button to load the repository */}
            <button
              onClick={debouncedHandleLoadRepo}
              disabled={loading} // Disable button during loading
              className={`px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Load Repo
            </button>
          </div>
        </div>

        {/* SHA Input Field */}
        <div>
          <label
            htmlFor="shaInput"
            className="block text-sm font-medium text-gray-700"
          >
            SHA of the File
          </label>
          <div className="flex space-x-2 mt-1 text-gray-700">
            <input
              id="shaInput"
              type="text"
              placeholder="Enter SHA or select a file"
              value={shaInput}
              onChange={handleManualShaInput}
              disabled={loading} // Disable input during loading
              className="flex-grow border border-gray-300 rounded-md p-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* FilePicker Component to select files from the repository */}
        {activeRepo && (
          <FilePicker
            repo={activeRepo}
            onFileSelect={handleFileSelect}
            disabled={loading}
          />
        )}

        {/* Submit Button to analyze the selected file */}
        <button
          type="submit"
          disabled={loading || !activeSha || !activeRepo}
          className={`w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition ${
            (loading || !activeSha || !activeRepo) &&
            "opacity-50 cursor-not-allowed"
          }`}
        >
          {loading ? "Analyzing..." : "Analyze"} {/* Show loading state */}
        </button>

        {/* Display error message if any */}
        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* Display analysis result with Color Grading */}
        {result && (
          <div className="mt-6 p-4 border border-gray-200 rounded-md bg-white shadow-sm">
            {/* Quality Score with Badge */}
            <h2 className="flex items-center text-lg font-semibold mb-2 text-gray-900">
              Quality Score:
              <span
                className={` px-2 py-1 rounded-full text-xl font-bold ${getScoreColor(
                  result.score
                )} bg-opacity-20`}
              >
                {result.score}
              </span>
            </h2>
            {/* Render reasoning as Markdown */}
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
              disabled={loading} // Disable button during loading
              className={`px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Clear History
            </button>
          </div>
          <ul className="mt-4 space-y-4">
            {history
              .slice() // Create a shallow copy to avoid mutating the original array
              .reverse() // Reverse the copy to show latest first
              .map((item, index) => (
                <li
                  key={`${item.repo}-${item.sha}-${index}`} // Use a unique key
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
