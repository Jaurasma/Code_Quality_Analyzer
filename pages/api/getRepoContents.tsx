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
    const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${
      path || ""
    }`;

    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `token ${session.accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    res.status(200).json(response.data);
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      res.status(404).json({ error: "Repository or path not found" });
    } else {
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  }
}
