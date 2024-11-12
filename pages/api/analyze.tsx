// pages/api/analyze.ts
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

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
    console.log(fileContent);
    // Send fileContent to LLM for analysis
    const llmResponse = await analyzeCodeWithLLM(fileContent);

    res.status(200).json(llmResponse);
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      res.status(404).json({ error: "File not found" });
    } else {
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  }
}

async function analyzeCodeWithLLM(code: string): Promise<AnalyzeResponse> {
  // Retrieve OpenAI API key from environment variables
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    throw new Error("OpenAI API key is not set");
  }

  // Define the conversation messages
  const messages = [
    {
      role: "system",
      content: "You are a code quality analysis assistant.",
    },
    {
      role: "user",
      content: `Analyze the following code for quality. Provide a score out of 100 and explain your reasoning.\n\n${code}`,
    },
  ];

  try {
    // Make a POST request to OpenAI's Chat Completions API
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: messages,
        max_tokens: 2048,
        temperature: 0.5,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
      }
    );

    // Extract the assistant's reply
    const assistantMessage = response.data.choices[0].message.content.trim();

    // Parsing the response to extract score and reasoning
    const scoreMatch = assistantMessage.match(/score\s*[:\-]\s*(\d+)/i);
    const reasoningMatch = assistantMessage.match(/reasoning\s*[:\-]\s*(.+)/i);

    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
    const reasoning = reasoningMatch
      ? reasoningMatch[1].trim()
      : assistantMessage;

    return { score, reasoning };
  } catch (error: any) {
    // Enhanced error handling
    if (error.response) {
      const errorMessage =
        error.response.data.error.message || "LLM Analysis Failed";
      throw new Error(errorMessage);
    } else {
      throw new Error("LLM Analysis Failed");
    }
  }
}
