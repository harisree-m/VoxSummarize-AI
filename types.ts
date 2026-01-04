
export interface VoiceNoteSummary {
  id: string;
  timestamp: number;
  transcription: string;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  title: string;
}

export interface SummaryResponse {
  title: string;
  transcription: string;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
}

export type AppStatus = 'idle' | 'recording' | 'processing' | 'error' | 'success';
