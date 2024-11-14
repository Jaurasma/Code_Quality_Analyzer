// types.ts
export interface AnalyzeResponse {
  score: number;
  reasoning: string;
}

export interface HistoryItem {
  repo: string;
  sha: string;
  result: AnalyzeResponse;
}
