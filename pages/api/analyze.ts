// pages/api/analyze.ts

import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import analyzeCodeWithLLM, {
  AnalyzeResponse,
} from "../../utils/analyzeCodeWithLLM"; // Updated import path

interface AnalyzeRequest {
  repo: string;
  sha: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalyzeResponse | { error: string }>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // Retrieve session using getServerSession
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.accessToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { repo, sha } = req.body as AnalyzeRequest;

    // Example: Validate SHA format (SHA-1 is a 40-character hexadecimal string)
    const isValidSHA = (sha: string): boolean => /^[a-f0-9]{40}$/.test(sha);

    if (!isValidSHA(sha)) {
      return res.status(400).json({ error: "Invalid SHA format." });
    }

    // Validate input
    if (!repo || !sha) {
      return res.status(400).json({ error: "Repository and SHA are required" });
    }

    const [owner, repoName] = repo.split("/");
    if (!owner || !repoName) {
      return res
        .status(400)
        .json({ error: "Repository must be in the format owner/repo" });
    }

    // Fetch the file content from GitHub
    const fileResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repoName}/git/blobs/${sha}`,
      {
        headers: {
          Authorization: `token ${session.accessToken}`,
          Accept: "application/vnd.github.v3.raw",
        },
      }
    );

    const fileContent: string = fileResponse.data;

    // Analyze the code using the LLM
    const llmResponse: AnalyzeResponse = await analyzeCodeWithLLM(fileContent);

    // Respond with the analysis
    return res.status(200).json(llmResponse);
  } catch (error: unknown) {
    console.error("API Route Error:", error);

    // Check if the error is an AxiosError
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with a status other than 2xx
        const status = error.response.status;
        const message =
          error.response.data?.error?.message ||
          `GitHub API responded with status ${status}`;
        return res.status(status).json({ error: message });
      } else if (error.request) {
        // Request was made but no response received
        return res.status(503).json({ error: "No response from GitHub API" });
      } else {
        // Something happened in setting up the request
        const message = error.message || "Error setting up the request";
        return res.status(500).json({ error: message });
      }
    }

    // Check if the error is a SyntaxError
    if (error instanceof SyntaxError) {
      return res
        .status(500)
        .json({ error: "Failed to parse JSON response from LLM." });
    }

    // Check if the error is an instance of Error
    if (error instanceof Error) {
      return res
        .status(500)
        .json({ error: error.message || "Internal Server Error" });
    }

    // Fallback for unknown error types
    return res.status(500).json({ error: "An unknown error occurred." });
  }
}
