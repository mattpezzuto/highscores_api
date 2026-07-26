import { Horse } from "../../types";

export const STARTER_HORSES_RAW: any[] = [
  {
    id: "gt_horse_thunder_eclipse",
    name: "Thunder Eclipse",
    gender: "Stallion",
    dob: "2021-04-12",
    coatColor: "Black",
    generation: 1,
    sireId: null,
    damId: null,
    sireName: null,
    damName: null,
    preferredTrack: "Turf",
    preferredDistance: "Mid-Distance (8-10f)",
    runningStyle: "Presser",
    specialTraits: ["Late Surge", "Iron Lung", "Turf Specialist"],
    stats: {
      speed: 88,
      stamina: 82,
      acceleration: 85,
      temperament: 78,
      grit: 86,
      startBurst: 80,
      finishKick: 92,
      cornering: 84,
      surfaceAdaptability: 88,
      weatherResistance: 82,
      focus: 85,
      potential: 95,
      trainability: 88
    },
    growth: {
      growthRate: "Standard",
      peakAgeYears: 4
    },
    racingRecord: { starts: 12, wins: 8, places: 2, shows: 1, earnings: 450000 },
    createdAt: "2026-01-10T12:00:00.000Z"
  },
  {
    id: "gt_horse_silver_dynasty",
    name: "Silver Dynasty",
    gender: "Mare",
    dob: "2022-02-18",
    coatColor: "Dappled Gray",
    generation: 1,
    sireId: null,
    damId: null,
    sireName: null,
    damName: null,
    preferredTrack: "Dirt",
    preferredDistance: "Sprint (5-7f)",
    runningStyle: "Front Runner",
    specialTraits: ["Rocket Gate", "Bender"],
    stats: {
      speed: 84,
      stamina: 79,
      acceleration: 90,
      temperament: 82,
      grit: 80,
      startBurst: 94,
      finishKick: 81,
      cornering: 89,
      surfaceAdaptability: 82,
      weatherResistance: 78,
      focus: 86,
      potential: 92,
      trainability: 85
    },
    growth: {
      growthRate: "Early Bloomer",
      peakAgeYears: 3
    },
    racingRecord: { starts: 10, wins: 6, places: 3, shows: 0, earnings: 320000 },
    createdAt: "2026-01-12T14:30:00.000Z"
  },
  {
    id: "gt_horse_gilded_monarch",
    name: "Gilded Monarch",
    gender: "Stallion",
    dob: "2020-05-20",
    coatColor: "Palomino",
    generation: 1,
    sireId: null,
    damId: null,
    sireName: null,
    damName: null,
    preferredTrack: "Turf",
    preferredDistance: "Long (11-14f)",
    runningStyle: "Closer",
    specialTraits: ["Iron Lung", "Heart of a Champion"],
    stats: {
      speed: 80,
      stamina: 92,
      acceleration: 78,
      temperament: 85,
      grit: 88,
      startBurst: 74,
      finishKick: 88,
      cornering: 82,
      surfaceAdaptability: 85,
      weatherResistance: 80,
      focus: 90,
      potential: 94,
      trainability: 82
    },
    growth: {
      growthRate: "Late Bloomer",
      peakAgeYears: 5
    },
    racingRecord: { starts: 16, wins: 9, places: 4, shows: 2, earnings: 580000 },
    createdAt: "2026-01-15T09:15:00.000Z"
  },
  {
    id: "gt_horse_velvet_horizon",
    name: "Velvet Horizon",
    gender: "Mare",
    dob: "2022-03-05",
    coatColor: "Chestnut",
    generation: 1,
    sireId: null,
    damId: null,
    sireName: null,
    damName: null,
    preferredTrack: "Synthetic",
    preferredDistance: "Mid-Distance (8-10f)",
    runningStyle: "Presser",
    specialTraits: ["Late Surge", "Turf Specialist"],
    stats: {
      speed: 86,
      stamina: 84,
      acceleration: 82,
      temperament: 88,
      grit: 83,
      startBurst: 82,
      finishKick: 89,
      cornering: 86,
      surfaceAdaptability: 90,
      weatherResistance: 84,
      focus: 88,
      potential: 93,
      trainability: 86
    },
    growth: {
      growthRate: "Standard",
      peakAgeYears: 4
    },
    racingRecord: { starts: 8, wins: 5, places: 2, shows: 1, earnings: 280000 },
    createdAt: "2026-01-18T16:20:00.000Z"
  },
  {
    id: "gt_horse_phantom_stride",
    name: "Phantom Stride",
    gender: "Stallion",
    dob: "2021-01-30",
    coatColor: "Bay",
    generation: 1,
    sireId: null,
    damId: null,
    sireName: null,
    damName: null,
    preferredTrack: "Mud",
    preferredDistance: "Sprint (5-7f)",
    runningStyle: "Finisher",
    specialTraits: ["Mud Lark", "Rocket Gate"],
    stats: {
      speed: 89,
      stamina: 76,
      acceleration: 88,
      temperament: 72,
      grit: 84,
      startBurst: 88,
      finishKick: 94,
      cornering: 80,
      surfaceAdaptability: 84,
      weatherResistance: 95,
      focus: 80,
      potential: 96,
      trainability: 84
    },
    growth: {
      growthRate: "Early Bloomer",
      peakAgeYears: 3
    },
    racingRecord: { starts: 11, wins: 7, places: 1, shows: 2, earnings: 390000 },
    createdAt: "2026-01-20T11:45:00.000Z"
  },
  {
    id: "gt_horse_crimson_grace",
    name: "Crimson Grace",
    gender: "Mare",
    dob: "2021-06-14",
    coatColor: "Roan",
    generation: 1,
    sireId: null,
    damId: null,
    sireName: null,
    damName: null,
    preferredTrack: "Turf",
    preferredDistance: "Mid-Distance (8-10f)",
    runningStyle: "Presser",
    specialTraits: ["Late Surge", "Heart of a Champion"],
    stats: {
      speed: 81,
      stamina: 86,
      acceleration: 80,
      temperament: 90,
      grit: 87,
      startBurst: 79,
      finishKick: 88,
      cornering: 85,
      surfaceAdaptability: 86,
      weatherResistance: 88,
      focus: 92,
      potential: 91,
      trainability: 90
    },
    growth: {
      growthRate: "Standard",
      peakAgeYears: 4
    },
    racingRecord: { starts: 14, wins: 8, places: 4, shows: 1, earnings: 490000 },
    createdAt: "2026-01-22T08:10:00.000Z"
  }
];

export const HORSE_NAME_PREFIXES = [
  "Majestic", "Shadow", "Solar", "Storm", "Royal", "Apex", "Midnight",
  "Wild", "Vanguard", "Ember", "Frost", "Iron", "Radiant", "Titan",
  "Golden", "Celestial", "Valiant", "Zenith", "Blaze", "Phantom", "Sovereign", "Echo"
];

export const HORSE_NAME_SUFFIXES = [
  "Blade", "Echo", "Sovereign", "Dash", "Runner", "Glory", "Knight",
  "Whisper", "Pulse", "Fury", "Chaser", "Legend", "Crown", "Arrow",
  "Comet", "Valor", "Thunder", "Tempest", "Spirit", "Legacy", "Blaze", "Dynasty"
];

export const COAT_COLORS = ["Bay", "Chestnut", "Black", "Dappled Gray", "Palomino", "Roan", "Silver Dapple", "Dun"];
export const TRACK_TYPES: Array<"Dirt" | "Turf" | "Mud" | "Synthetic"> = ["Dirt", "Turf", "Mud", "Synthetic"];
export const DISTANCES: Array<"Sprint (5-7f)" | "Mid-Distance (8-10f)" | "Long (11-14f)"> = ["Sprint (5-7f)", "Mid-Distance (8-10f)", "Long (11-14f)"];
export const RUNNING_STYLES: Array<"Front Runner" | "Presser" | "Closer" | "Finisher"> = ["Front Runner", "Presser", "Closer", "Finisher"];
export const TRAITS_POOL = ["Rocket Gate", "Late Surge", "Mud Lark", "Turf Specialist", "Iron Lung", "Bender", "Heart of a Champion", "Pacesetter", "Focus Anchor"];
