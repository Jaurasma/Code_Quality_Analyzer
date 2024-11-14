// utils/analyzeCodeWithLLM.ts

import axios from "axios";

export interface AnalyzeResponse {
  score: number;
  reasoning: string;
}

/**
 * Analyzes code quality using OpenAI's Chat Completion API.
 * Retries up to 3 times in case of JSON parsing errors.
 * @param code - The code snippet to analyze.
 * @returns An object containing the quality score and reasoning.
 */
const analyzeCodeWithLLM = async (code: string): Promise<AnalyzeResponse> => {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    throw new Error("OpenAI API key is not set");
  }

  const messages = [
    {
      role: "system",
      content:
        "You are a code quality analysis assistant. Always respond with strict JSON.",
    },
    {
      role: "user",
      content: `Analyze the following code for quality. Provide a score out of 100 and explain your reasoning. Respond only in JSON format with the following structure:
  
  {
    "score": <number>,
    "reasoning": "<string>"
  }
  
  Here is the code:
  \`\`\`
  ${code}
  \`\`\``,
    },
  ];

  const maxRetries = 3; // Maximum retry attempts
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      attempts++;

      // Make a POST request to OpenAI's Chat Completions API
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: messages,
          max_tokens: 2048,
          temperature: 0.2,
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
      console.log(`Attempt ${attempts}: Raw LLM Response:`, assistantMessage);

      // Parse the JSON response
      const parsedResponse = JSON.parse(assistantMessage);

      // Validate the parsed response
      if (
        typeof parsedResponse.score !== "number" ||
        typeof parsedResponse.reasoning !== "string"
      ) {
        throw new Error("Invalid response format from LLM.");
      }

      return {
        score: parsedResponse.score,
        reasoning: parsedResponse.reasoning,
      };
    } catch (error: any) {
      console.error(`Attempt ${attempts} failed:`, error.message);

      // If it's the last attempt, rethrow the error
      if (attempts >= maxRetries) {
        if (error instanceof SyntaxError) {
          throw new Error(
            "Failed to parse JSON response from LLM after multiple attempts."
          );
        }
        throw new Error(
          error.response?.data?.error?.message || "LLM Analysis Failed"
        );
      }

      // Optionally, you can add a delay before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Fallback in case the loop exits unexpectedly
  throw new Error("LLM Analysis Failed after maximum retries.");
};

export default analyzeCodeWithLLM;
