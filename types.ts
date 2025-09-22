export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  }
}

export interface StructuredSource extends GroundingChunk {
  reportName: string;
  publicationDate: string | null;
}

export interface AnalysisSection {
  title: string;
  content: string;
  sources?: string;
}

export interface Framework {
  name_zh: string;
  name_en: string;
  advantage: string;
}

export interface SearchResult {
  overallSummary: string;
  analysis: AnalysisSection[] | null;
  sources: StructuredSource[];
}

export enum AppStatus {
  Idle,
  AwaitingGoalInput,
  LoadingFrameworks,
  AwaitingFrameworkSelection,
  LoadingReport, // State before stream starts
  Generating, // State while stream is active
  LoadingMetadata, // New state for processing sources
  Success,
  Error,
}

export interface ResearchSession {
  id: string;
  topic: string;
  objective: string;
  scope: string;
  status: AppStatus;
  results: SearchResult | null;
  error: string | null;
  frameworks: Framework[];
  selectedFramework: Framework | null;
  createdAt: number;
}