// pages/api/getRepoContents.ts

import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

interface GetRepoContentsRequest {
  repo: string;
  path?: string;
}

interface RepoContent {
  name: string;
  path: string;
  sha: string;
  type: "file" | "dir";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RepoContent[] | { error: string }>
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

  const { repo, path } = req.body as GetRepoContentsRequest;

  if (!repo) {
    return res.status(400).json({ error: "Repository is required" });
  }

  const [owner, repoName] = repo.split("/");
  if (!owner || !repoName) {
    return res
      .status(400)
      .json({ error: "Repository must be in the format owner/repo" });
  }

  try {
    // Construct the API URL with optional path
    const apiUrl = path
      ? `https://api.github.com/repos/${owner}/${repoName}/contents/${path}`
      : `https://api.github.com/repos/${owner}/${repoName}/contents`;

    // Fetch the contents from GitHub API
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `token ${session.accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    // GitHub API returns an object for files and an array for directories
    const data = response.data;

    if (Array.isArray(data)) {
      // It's a directory
      const contents: RepoContent[] = data.map((item: any) => ({
        name: item.name,
        path: item.path,
        sha: item.sha,
        type: item.type,
      }));
      res.status(200).json(contents);
    } else {
      // It's a file
      const file: RepoContent = {
        name: data.name,
        path: data.path,
        sha: data.sha,
        type: data.type,
      };
      res.status(200).json([file]);
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      res.status(404).json({ error: "Path not found in the repository" });
    } else {
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  }
}
