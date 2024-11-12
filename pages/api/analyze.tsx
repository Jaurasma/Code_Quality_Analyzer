// pages/api/analyze.ts
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import AnalyzeCodeWithLLM from "../../components/AnalyzeCodeWithLLM"; // Adjust the import path if necessary

interface AnalyzeRequest {
  repo: string;
  sha: string;
}

interface AnalyzeResponse {
  score: number;
  reasoning: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalyzeResponse | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Retrieve session using getServerSession
  const session = await getServerSession(req, res, authOptions);
  console.log("Session:", session, session?.accessToken);

  if (!session || !session.accessToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { repo, sha } = req.body as AnalyzeRequest;

  if (!repo || !sha) {
    return res.status(400).json({ error: "Repository and SHA are required" });
  }

  const [owner, repoName] = repo.split("/");
  if (!owner || !repoName) {
    return res
      .status(400)
      .json({ error: "Repository must be in the format owner/repo" });
  }

  try {
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

    const fileContent = fileResponse.data;

    // Analyze the code using the updated function
    const llmResponse = await AnalyzeCodeWithLLM(fileContent);

    res.status(200).json(llmResponse);
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      res.status(404).json({ error: "File not found" });
    } else {
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  }
}
