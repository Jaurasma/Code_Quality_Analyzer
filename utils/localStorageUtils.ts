// localStorageUtils.ts
import { HistoryItem } from "../types/types";

const HISTORY_KEY = "codeQualityHistory";

// Load history from local storage
export const loadHistory = (): HistoryItem[] => {
  const storedHistory = localStorage.getItem(HISTORY_KEY);
  return storedHistory ? JSON.parse(storedHistory) : [];
};

// Save history to local storage
export const saveHistory = (history: HistoryItem[]) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};
