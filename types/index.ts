export type DiaryEntry = {
  content: string;
  timestamp: Date;
};

export type MBTIDimension = {
  name: string;
  score: number;
  label1: string;
  label2: string;
};

export type AnalysisResult = {
  id: string;
  dimensions: MBTIDimension[];
  feedback: string;
  summary: string;
  timestamp: Date;
  error?: string;
};

export type ApiResponse = {
  dimensions: {
    EI: number;
    SN: number;
    TF: number;
    JP: number;
  };
  feedback: string;
  summary: string;
  error?: string;
};