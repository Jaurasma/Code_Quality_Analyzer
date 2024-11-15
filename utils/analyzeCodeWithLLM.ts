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
        'You are a code quality analysis assistant. Provide a score out of 100 and detailed reasoning. Respond strictly in JSON format with the following structure:\n\n{\n  "score": <number>,\n  "reasoning": "<string>"\n}',
    },
    {
      role: "user",
      content: `Please analyze the quality of the following code snippet:
      
\`\`\`
${code}
\`\`\`

Provide your analysis in the specified JSON format.`,
    },
  ];

  const MAX_RETRIES = 3; // Maximum retry attempts

  // Define the function to execute with retries
  const fetchAnalysis = async (): Promise<AnalyzeResponse> => {
    const response: AxiosResponse<OpenAIResponse> = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: messages,
        max_tokens: 500,
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

    // Attempt to parse the JSON response
    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(assistantMessage);
    } catch (_error) {
      throw new AbortError("Failed to parse JSON response from LLM.");
    }

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
      error.message || "Failed to analyze code quality using LLM."
    );
  }
};

export default analyzeCodeWithLLM;
