/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HighscoreEntry {
  player: string;
  score: number;
  date: string;
}

export interface HighscoresData {
  highscores: HighscoreEntry[];
}

export interface APIMetadata {
  sourceRepo: string;
  sourceFile: string;
  sourceBranch: string;
  cached: boolean;
  cacheTtlRemainingMs: number;
  lastFetchedAt: string;
  latencyMs: number;
  totalEntries: number;
  githubTokenConfigured: boolean;
}

export interface HighscoresAPIResponse {
  success: boolean;
  data: HighscoreEntry[];
  summary: {
    highestScore: number;
    highestPlayer: string;
    lowestScore: number;
    averageScore: number;
    totalPlayers: number;
    uniquePlayers: number;
  };
  metadata: APIMetadata;
  error?: string;
}
