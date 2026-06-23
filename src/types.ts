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

export interface JediLightsaber {
  color: string;
  crystal: string;
  hiltStyle: string;
  hiltMaterial: string;
  length: string;
  form: string;
  status: string;
}

export interface JediAppearance {
  hair: string;
  eyes: string;
  build: string;
  clothing: string;
  distinguishingFeatures: string;
}

export interface JediStats {
  strength: number;
  agility: number;
  defense: number;
  forcePower: number;
  lightsaberSkill: number;
  wisdom: number;
}

export interface JediCombatRecord {
  wins: number;
  losses: number;
  draws: number;
  totalDuels: number;
}

export interface JediRanking {
  title: string;
  achievementPoints: number;
  galacticRank: number;
}

export interface JediPersonality {
  traits: string[];
  quote: string;
}

export interface Jedi {
  id: string;
  accountId: string;
  name: string;
  title: string;
  species: string;
  age: number;
  gender: string;
  height: string;
  affiliation: string;
  lastDayTrained?: string;
  lightsaber: JediLightsaber;
  appearance: JediAppearance;
  stats: JediStats;
  combatRecord: JediCombatRecord;
  ranking: JediRanking;
  forceAbilities: string[];
  combatStyle: string;
  background: string;
  personality: JediPersonality;
}

export interface AcademyAPIResponse {
  success: boolean;
  data: Jedi[];
  metadata: {
    sourceRepo: string;
    branch: string;
    cached: boolean;
    lastFetchedAt: string;
    latencyMs: number;
    githubTokenConfigured: boolean;
  };
  error?: string;
}

