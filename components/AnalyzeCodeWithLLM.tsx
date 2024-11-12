// components/analyzeCodeWithLLM.tsx
"use client";

import axios from "axios";

interface AnalyzeResponse {
  score: number;
  reasoning: string;
}

/**
 * Analyzes code quality using OpenAI's Chat Completion API.
 * @param code - The code snippet to analyze.
 * @returns An object containing the quality score and reasoning.
 */
const analyzeCodeWithLLM = async (code: string): Promise<AnalyzeResponse> => {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    throw new Error("OpenAI API key is not set");
  }

  // Define the conversation messages with a system prompt for structured response
  const messages = [
    {
      role: "system",
      content: "You are a code quality analysis assistant.",
    },
    {
      role: "user",
      content: `Analyze the following code for quality. Provide a score out of 100 and explain your reasoning. Respond in strict JSON format with 'score' and 'reasoning' fields only.\n\n${code}`,
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

    // Parse the JSON response
    const parsedResponse = JSON.parse(assistantMessage);

    // Validate the parsed response
    if (
      typeof parsedResponse.score !== "number" ||
      typeof parsedResponse.reasoning !== "string"
    ) {
      throw new Error("Invalid response format from LLM.");
    }

    return { score: parsedResponse.score, reasoning: parsedResponse.reasoning };
  } catch (error: any) {
    // Enhanced error handling
    if (error.response) {
      const errorMessage =
        error.response.data.error.message || "LLM Analysis Failed";
      throw new Error(errorMessage);
    } else if (error instanceof SyntaxError) {
      throw new Error("Failed to parse JSON response from LLM.");
    } else {
      throw new Error("LLM Analysis Failed");
    }
  }
};

export default analyzeCodeWithLLM;
