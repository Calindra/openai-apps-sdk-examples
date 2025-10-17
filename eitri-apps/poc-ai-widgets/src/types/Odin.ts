export interface OdinResponse {
  candidates: Candidate[];
  usageMetadata: UsageMetadata;
  modelVersion: string;
  responseId: string;
}

export interface Candidate {
  content: Content;
  finishReason: string;
  avgLogprobs: number;
}

export interface Content {
  parts: Part[];
  role: string;
}

export interface Part {
  text: string;
}

export interface UsageMetadata {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
  promptTokensDetails: TokensDetail[];
  candidatesTokensDetails: TokensDetail[];
}

export interface TokensDetail {
  modality: string;
  tokenCount: number;
}
