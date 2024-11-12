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

  useEffect(() => {
    const fetchRepoContents = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/getRepoContents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repo }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch repository contents");
        }

        setContents(data);
      } catch (err: any) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    if (repo) {
      fetchRepoContents();
    }
  }, [repo]);

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
      <ul className="mt-2 border rounded-md p-2 bg-gray-100 max-h-60 overflow-y-auto">
        {contents.map((item) => (
          <li key={item.sha} className="mb-1">
            <button
              onClick={() => onFileSelect(item.path, item.sha)}
              className="w-full text-left px-3 py-2 bg-white rounded-md hover:bg-blue-50 transition"
            >
              {item.type === "dir" ? "📁" : "📄"} {item.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FilePicker;
