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
      content: `You are a highly critical code quality analysis assistant. Your task is to evaluate a given piece of code based on its correctness, readability, maintainability, performance, scalability, and adherence to best practices. **Correctness is the most important criterion.** If the code contains syntax errors, fails to compile, or does not run as expected, you must give it a score below 50 regardless of other aspects.

Use the following scoring system:

- **90-100:** Exceptional quality with excellent coding practices and flawless functionality.
- **70-89:** Good quality with minor issues; code works as intended.
- **50-69:** Average quality; the code has several issues or inconsistencies.
- **Below 50:** Poor quality; the code is buggy, non-functional, or critically flawed.

Provide a detailed analysis including:
- **Correctness:** Does the code run? Are there any bugs?
- **Strengths:** What the code does well.
- **Weaknesses:** Issues in logic, performance, maintainability, or other flaws.
- **Suggestions:** Specific recommendations for improvement.

Format your analysis using Markdown with headings, bullet points, and code blocks where appropriate.

Respond strictly in JSON format with the following structure:
{
  "score": <number>,
  "reasoning": "<string with Markdown formatting and escaped quotes>"
}

**Example Response:**  
\`\`\`
{
  "score": 42,
  "reasoning": "# Code Quality Analysis\\n\\n## Correctness\\n- The code fails to compile due to a missing semicolon.\\n\\n## Strengths\\n- The overall structure is clear.\\n\\n## Weaknesses\\n- Critical syntax errors prevent execution.\\n- Lacks proper error handling.\\n\\n## Suggestions\\n- Fix the syntax errors and add proper validation.\\n\\n**Conclusion:** The code is fundamentally broken and requires significant revisions."
}
`,
    },
    {
      role: "user",
      content: `Analyze the following code and provide your detailed assessment in the JSON format specified above:

\`\`\`
${code}
\`\`\``,
    },
  ];

  const MAX_RETRIES = 3; // Maximum retry attempts

  const fetchAnalysis = async (): Promise<AnalyzeResponse> => {
    const response: AxiosResponse<OpenAIResponse> = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini", // Consider switching to a higher-capacity model if available
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

    // Attempt to remove Markdown code block formatting if present
    let cleanedMessage = assistantMessage;
    if (cleanedMessage.startsWith("```")) {
      const lines = cleanedMessage.split("\n");
      // Remove the first and last lines if they are code block markers
      if (lines.length >= 3 && lines[0].startsWith("```")) {
        lines.shift();
        if (lines[lines.length - 1].startsWith("```")) {
          lines.pop();
        }
        cleanedMessage = lines.join("\n").trim();
      }
    }

    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(cleanedMessage);
    } catch (parseError) {
      // Log the raw response and return it in the reasoning field with a score of 0
      console.error("Failed to parse JSON. Raw response:", assistantMessage);
      return {
        score: 0,
        reasoning: `**Raw response from LLM:**\n\n${assistantMessage}`,
      };
    }

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
      shouldRetry: (error) => !(error instanceof AbortError),
    });

    return analysis;
  } catch (error: any) {
    console.error("LLM Analysis Failed:", error.message);
    throw new Error(
      "Analyzing code quality using AI is tricky business. Please try again."
    );
  }
};

export default analyzeCodeWithLLM;
