/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HorseStats {
  speed: number;
  stamina: number;
  acceleration: number;
  agility?: number;
  temperament: number;
  grit: number;
  // Tactical Race Skills
  startBurst: number;        // Gate break & initial positioning
  finishKick: number;        // Final furlong sprint power
  cornering: number;         // Agility around tight track bends
  surfaceAdaptability: number; // Dirt/Turf/Synthetic versatility
  weatherResistance: number;  // Mud/Rain tolerance
  focus: number;              // Resistance to fading under pressure
  // Growth & Potential
  potential: number;         // Max stat ceiling
  trainability: number;      // Stat improvement multiplier
  overallRating?: number;    // Calculated overall rating score
}

export interface HorseGrowth {
  growthRate: "Early Bloomer" | "Standard" | "Late Bloomer" | string;
  peakAgeYears: number;      // e.g. 5 years old
  currentStage?: "Juvenile" | "Prime" | "Veteran" | "Senior" | string;
}

export interface HorseRacingRecord {
  starts: number;
  wins: number;
  places: number;
  shows: number;
  earnings: number;
}

export interface Horse {
  id: string;
  name: string;
  gender: "Stallion" | "Mare" | "Colt" | "Filly" | string;
  coatColor: string;
  generation: number;
  sireId: string | null;
  damId: string | null;
  sireName?: string | null;
  damName?: string | null;
  preferredTrack: "Dirt" | "Turf" | "Mud" | "Synthetic" | string;
  preferredDistance: "Sprint (5-7f)" | "Mid-Distance (8-10f)" | "Long (11-14f)" | string;
  runningStyle: "Front Runner" | "Presser" | "Closer" | "Finisher" | string;
  specialTraits: string[];
  stats: HorseStats;
  growth: HorseGrowth;
  racingRecord: HorseRacingRecord;
  createdAt: string;
  dob?: string;
  age?: number;
  jockeySilksColor?: string;
  trainer_id?: string | null;
}

export interface GrandTurfAPIResponse {
  success: boolean;
  data: Horse[];
  metadata: {
    total: number;
    sourceRepo: string;
    branch: string;
    cached: boolean;
    lastFetchedAt: string;
    latencyMs: number;
    githubTokenConfigured: boolean;
  };
  error?: string;
}

export interface GrandTurfSingleHorseAPIResponse {
  success: boolean;
  data?: Horse;
  simulation?: boolean;
  message?: string;
  latencyMs?: number;
  error?: string;
}

export type TrackSurface = 'Turf' | 'Dirt' | 'Muddy' | 'Mud' | 'Synthetic';
export type BetType = 'Win' | 'Place' | 'Show';

export interface Bet {
  id: string;
  horseId: string;
  horseName: string;
  type: BetType;
  amount: number;
  oddsDecimal: number;
  payoutPotential: number;
}

export interface RaceResult {
  raceId: string;
  trackName: string;
  distanceMeters: number;
  surface: TrackSurface;
  date: string;
  finishOrder: {
    rank: number;
    horseId: string;
    horseName: string;
    coatColor: string;
    jockeySilksColor: string;
    finishTimeSeconds: number;
    prizeWon: number;
    isPlayerHorse: boolean;
  }[];
  betsPlaced: Bet[];
  betsWonTotal: number;
  userHorseEarningsTotal: number;
}

export interface CommentaryMessage {
  id: string;
  timestampSeconds: number;
  text: string;
  type: 'start' | 'lead_change' | 'surge' | 'fatigue' | 'stretch' | 'finish' | 'general';
}

export interface RaceTrack {
  id?: string;
  name: string;
  distanceMeters: number;
  purseTotal: number;
  surface: TrackSurface;
  condition?: string;
}

export interface SimulatedRunner {
  horse: Horse;
  lane: number;
  positionX: number;
  positionY: number;
  targetY: number;
  currentSpeed: number;
  currentEnergy: number;
  strideFrame: number;
  dustParticles: any[];
  burstTimer: number;
  isSurging: boolean;
  finishTime: number | null;
  rank: number;
  odds: number;
}
