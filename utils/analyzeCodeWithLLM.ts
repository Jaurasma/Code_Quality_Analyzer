// utils/analyzeCodeWithLLM.ts

import axios, { AxiosResponse } from "axios";
import pRetry, { AbortError } from "p-retry";

export interface AnalyzeResponse {
  score: number;
  reasoning: string;
}

interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIChoice {
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
  index: number;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  choices: OpenAIChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Analyzes code quality using OpenAI's Chat Completion API.
 * Utilizes a retry mechanism for transient errors.
 * @param code - The code snippet to analyze.
 * @returns An object containing the quality score and reasoning.
 */
const analyzeCodeWithLLM = async (code: string): Promise<AnalyzeResponse> => {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    throw new Error("OpenAI API key is not set");
  }

  const messages: OpenAIMessage[] = [
    {
      role: "system",
      content:
        'You are a code quality analysis assistant. Provide a score out of 0 to 100 and detailed reasoning. Your reasoning should include Markdown formatting such as headings, bullet points, and code blocks to enhance readability. Respond strictly in JSON format with the following structure:\n\n{\n  "score": <number>,\n  "reasoning": "<string with Markdown formatting and escaped quotes>"\n}\n\n**Example Reasoning:**\n\n```\n# Analysis Report\n\n## Strengths\n- Well-structured codebase\n- Comprehensive test coverage\n\n## Areas for Improvement\n1. Optimize the sorting algorithm in `utils.js`\n2. Refactor repetitive code blocks in `component.jsx`\n\n**Conclusion:** The code quality is solid but can benefit from targeted optimizations.\n```',
    },
    {
      role: "user",
      content: `Please explain quickly what the code does and analyze the quality of the code in the following file. You can provide code blocks or other Markdown elements to illustrate your points:

\`\`\`
${code}
\`\`\`

Provide your analysis in the specified JSON format.`,
    },
  ];

  const MAX_RETRIES = 3; // Maximum retry attempts

  // OpenAI api call, can be modified to be more powerfull with model & tokens
  const fetchAnalysis = async (): Promise<AnalyzeResponse> => {
    const response: AxiosResponse<OpenAIResponse> = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: messages,
        max_tokens: 2024,
        temperature: 0.3,
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

    const assistantMessage = response.data.choices[0].message.content.trim();
    const parsedResponse = JSON.parse(assistantMessage);

    // Validate the parsed response
    if (
      typeof parsedResponse.score !== "number" ||
      typeof parsedResponse.reasoning !== "string"
    ) {
      throw new AbortError("Invalid response format from LLM.");
    }

    return {
      score: parsedResponse.score,
      reasoning: parsedResponse.reasoning,
    };
  };

  try {
    const analysis = await pRetry(fetchAnalysis, {
      retries: MAX_RETRIES,
      onFailedAttempt: (error) => {
        console.warn(
          `Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left.`
        );
      },
      // Retry on all errors except AbortError
      shouldRetry: (error) => {
        return !(error instanceof AbortError);
      },
    });

    return analysis;
  } catch (error: any) {
    console.error("LLM Analysis Failed:", error.message);
    throw new Error(
      "Analyzing code quality using AI is tricky buisness please try again."
    );
  }
};

export default analyzeCodeWithLLM;
