export interface GestureResponse {
  gesture: string;
  confidence: number;
  description: string;
  emoji: string;
  actionSuggested?: string;
}

export enum AppState {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  ERROR = 'ERROR',
}

export interface HistoryItem {
  timestamp: number;
  result: GestureResponse;
}