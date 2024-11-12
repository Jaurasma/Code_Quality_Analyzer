// pages/api/getFileSha.ts
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

interface GetFileShaRequest {
  repo: string;
  filePath: string;
}

interface GetFileShaResponse {
  sha: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetFileShaResponse | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  console.log("Session:", session, session?.accessToken);

  if (!session || !session.accessToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { repo, filePath } = req.body as GetFileShaRequest;

  if (!repo || !filePath) {
    return res
      .status(400)
      .json({ error: "Repository and file path are required" });
  }

  const [owner, repoName] = repo.split("/");
  if (!owner || !repoName) {
    return res
      .status(400)
      .json({ error: "Repository must be in the format owner/repo" });
  }

  try {
    // Fetch the file information from GitHub API
    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`,
      {
        headers: {
          Authorization: `token ${session.accessToken}`,
          Accept: "application/vnd.github.v3.raw",
        },
      }
    );

    const { sha } = response.data;

    res.status(200).json({ sha });
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      res.status(404).json({ error: "File not found in the repository" });
    } else {
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  }
}
