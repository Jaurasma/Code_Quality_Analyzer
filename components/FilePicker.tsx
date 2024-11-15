// components/FilePicker.tsx
"use client";

import { useEffect, useState } from "react";

interface FilePickerProps {
  repo: string;
  onFileSelect: (filePath: string, sha: string) => void;
}

interface RepoContent {
  name: string;
  path: string;
  sha: string;
  type: "file" | "dir";
}

const FilePicker: React.FC<FilePickerProps> = ({ repo, onFileSelect }) => {
  const [contents, setContents] = useState<RepoContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentPath, setCurrentPath] = useState<string>(""); // Tracks the current directory path

  useEffect(() => {
    const fetchRepoContents = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/getRepoContents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repo, path: currentPath }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch repository contents");
        }

        // Filter only files and directories
        const files = data.filter(
          (item: RepoContent) => item.type === "file" || item.type === "dir"
        );
        setContents(files);
      } catch (err: any) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchRepoContents();
  }, [repo, currentPath]);

  /**
   * Navigates into a directory.
   * @param dirPath - The path of the directory to navigate into.
   */
  const navigateToDirectory = (dirPath: string) => {
    setCurrentPath(dirPath);
  };

  /**
   * Navigates up one directory level.
   */
  const navigateUp = () => {
    if (currentPath === "") return; // Already at root
    const pathSegments = currentPath.split("/");
    pathSegments.pop(); // Remove the last segment
    const newPath = pathSegments.join("/");
    setCurrentPath(newPath);
  };

  /**
   * Renders the breadcrumb navigation based on the current path.
   */
  const renderBreadcrumb = () => {
    const pathSegments = currentPath.split("/").filter(Boolean);
    return (
      <nav className="text-sm mb-2 text-gray-700" aria-label="Breadcrumb">
        <ol className="list-reset flex text-gray-700">
          <li>
            <button
              onClick={() => setCurrentPath("")}
              className="text-blue-600 hover:text-blue-800"
            >
              Root
            </button>
          </li>
          {pathSegments.map((segment, index) => (
            <li key={index} className="flex items-center">
              <span className="mx-2 text-gray-700">/</span>
              {index === pathSegments.length - 1 ? (
                <span className="text-gray-700">{segment}</span>
              ) : (
                <button
                  onClick={() => {
                    const newPath = pathSegments.slice(0, index + 1).join("/");
                    setCurrentPath(newPath);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {segment}
                </button>
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  };

  if (loading) {
    return <p className="text-gray-500">Loading repository contents...</p>;
  }

  if (error) {
    return <p className="text-red-500 text-sm">{error}</p>;
  }

  return (
    <div className="mt-4">
      <h3 className="text-md font-medium text-gray-700">
        Select a File to Analyze
      </h3>

      {/* Breadcrumb Navigation */}
      {currentPath && renderBreadcrumb()}

      {/* Directory Navigation Buttons */}
      {currentPath && (
        <button
          onClick={navigateUp}
          className="mb-2 px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition text-sm"
        >
          ↑ Up
        </button>
      )}

      {/* Files and Directories List */}
      <ul className="mt-2 border rounded-md p-2 bg-gray-100 max-h-60 overflow-y-auto">
        {contents.length === 0 ? (
          <li className="text-gray-500">No files or directories found.</li>
        ) : (
          contents.map((item) => (
            <li key={item.sha} className="mb-1 text-gray-700">
              {item.type === "dir" ? (
                <button
                  onClick={() => {
                    console.log(`Navigating to directory: ${item.path}`);
                    navigateToDirectory(item.path);
                  }}
                  className="w-full text-left px-3 py-2 bg-white rounded-md hover:bg-blue-50 transition"
                >
                  📁 {item.name}
                </button>
              ) : (
                <button
                  onClick={() => {
                    console.log(
                      `Selecting file: ${item.path} with SHA: ${item.sha}`
                    );
                    onFileSelect(item.path, item.sha);
                  }}
                  className="w-full text-left px-3 py-2 bg-white rounded-md hover:bg-blue-50 transition"
                >
                  📄 {item.name}
                </button>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default FilePicker;
