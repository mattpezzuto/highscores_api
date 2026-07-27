import { Horse, HorseStats } from "../../types";
import {
  STARTER_HORSES_RAW,
  HORSE_NAME_PREFIXES,
  HORSE_NAME_SUFFIXES,
  COAT_COLORS,
  TRACK_TYPES,
  DISTANCES,
  RUNNING_STYLES,
  TRAITS_POOL,
} from "./constants";

// Helper: Calculate dynamic age based on DOB
export function calculateHorseAge(dob: string): number {
  if (!dob) return 3;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return 3;
  const now = new Date();
  let years = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
    years--;
  }
  return Math.max(0, years);
}

// Helper: Calculate dynamic growth stage based on age
export function calculateGrowthStage(ageYears: number): "Juvenile" | "Prime" | "Veteran" | "Senior" {
  if (ageYears <= 2) return "Juvenile";
  if (ageYears <= 5) return "Prime";
  if (ageYears <= 8) return "Veteran";
  return "Senior";
}

// Helper: Calculate dynamic overall rating from core stats and tactical skills
export function calculateOverallRating(stats: Partial<HorseStats>): number {
  const speed = stats.speed ?? 70;
  const stamina = stats.stamina ?? 70;
  const acceleration = stats.acceleration ?? 70;
  const temperament = stats.temperament ?? 70;
  const grit = stats.grit ?? 70;
  const startBurst = stats.startBurst ?? 70;
  const finishKick = stats.finishKick ?? 70;
  const cornering = stats.cornering ?? 70;
  const focus = stats.focus ?? 70;

  // Weighted average reflecting racing capability:
  // Speed (20%), Stamina (20%), Acceleration (15%), Finish Kick (15%), Start Burst (10%), Grit (10%), Cornering (5%), Focus (5%)
  const weighted =
    (speed * 0.20) +
    (stamina * 0.20) +
    (acceleration * 0.15) +
    (finishKick * 0.15) +
    (startBurst * 0.10) +
    (grit * 0.10) +
    (cornering * 0.05) +
    (focus * 0.05);

  return Math.round(weighted);
}

// Enrich and dynamically compute properties on the fly matching the exact Grand Turf API JSON schema
export function sanitizeAndEnrichHorse(raw: any): Horse {
  const age = raw.dob ? calculateHorseAge(raw.dob) : (raw.growth?.peakAgeYears ? raw.growth.peakAgeYears - 1 : 4);
  const rawStats = raw.stats || {};

  const stats: HorseStats = {
    speed: rawStats.speed ?? 75,
    stamina: rawStats.stamina ?? 75,
    acceleration: rawStats.acceleration ?? 75,
    temperament: rawStats.temperament ?? 75,
    grit: rawStats.grit ?? 75,
    startBurst: rawStats.startBurst ?? 75,
    finishKick: rawStats.finishKick ?? 75,
    cornering: rawStats.cornering ?? 75,
    surfaceAdaptability: rawStats.surfaceAdaptability ?? 75,
    weatherResistance: rawStats.weatherResistance ?? 75,
    focus: rawStats.focus ?? 75,
    potential: rawStats.potential ?? 88,
    trainability: rawStats.trainability ?? 80,
    overallRating: 0
  };

  // Calculate overall rating dynamically inside stats
  stats.overallRating = calculateOverallRating(stats);

  const growthStage = raw.growth?.currentStage || calculateGrowthStage(age);

  return {
    id: String(raw.id || `gt_horse_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`),
    name: String(raw.name || "Unnamed Horse"),
    gender: raw.gender || "Stallion",
    coatColor: raw.coatColor || "Bay",
    generation: Number(raw.generation ?? 1),
    sireId: raw.sireId ?? null,
    damId: raw.damId ?? null,
    sireName: raw.sireName ?? null,
    damName: raw.damName ?? null,
    preferredTrack: raw.preferredTrack || "Turf",
    preferredDistance: raw.preferredDistance || "Mid-Distance (8-10f)",
    runningStyle: raw.runningStyle || "Presser",
    specialTraits: Array.isArray(raw.specialTraits) && raw.specialTraits.length > 0 ? raw.specialTraits : ["Late Surge"],
    stats,
    growth: {
      growthRate: raw.growth?.growthRate || "Standard",
      peakAgeYears: raw.growth?.peakAgeYears || 4,
      currentStage: growthStage
    },
    racingRecord: {
      starts: raw.racingRecord?.starts ?? 0,
      wins: raw.racingRecord?.wins ?? 0,
      places: raw.racingRecord?.places ?? 0,
      shows: raw.racingRecord?.shows ?? 0,
      earnings: raw.racingRecord?.earnings ?? 0
    },
    trainer_id: raw.trainer_id ?? raw.trainerId ?? raw.trainer ?? null,
    createdAt: raw.createdAt || new Date().toISOString()
  };
}

export const STARTER_HORSES: Horse[] = STARTER_HORSES_RAW.map(sanitizeAndEnrichHorse);

export function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getRandomStat(min = 62, max = 88): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function createRandomHorseData(
  customName?: string,
  customGender?: "Stallion" | "Mare" | "Colt" | "Filly",
  customCoat?: string,
  customTrainerId?: string | null
): Horse {
  const prefix = getRandomItem(HORSE_NAME_PREFIXES);
  const suffix = getRandomItem(HORSE_NAME_SUFFIXES);
  const name = customName?.trim() || `${prefix} ${suffix}`;

  const gender = customGender || (Math.random() > 0.5 ? "Stallion" : "Mare");
  const coatColor = customCoat?.trim() || getRandomItem(COAT_COLORS);

  const speed = getRandomStat(64, 88);
  const stamina = getRandomStat(62, 88);
  const acceleration = getRandomStat(64, 88);
  const temperament = getRandomStat(66, 92);
  const grit = getRandomStat(62, 90);
  const startBurst = getRandomStat(60, 92);
  const finishKick = getRandomStat(62, 94);
  const cornering = getRandomStat(64, 90);
  const surfaceAdaptability = getRandomStat(60, 92);
  const weatherResistance = getRandomStat(60, 90);
  const focus = getRandomStat(65, 92);
  const potential = Math.max(speed, stamina, acceleration, finishKick) + Math.floor(Math.random() * 8 + 4);
  const trainability = getRandomStat(70, 92);

  const stats: HorseStats = {
    speed,
    stamina,
    acceleration,
    temperament,
    grit,
    startBurst,
    finishKick,
    cornering,
    surfaceAdaptability,
    weatherResistance,
    focus,
    potential: Math.min(99, potential),
    trainability
  };

  const now = new Date();
  const birthYear = now.getFullYear() - Math.floor(Math.random() * 4 + 2);
  const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
  const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, "0");
  const dob = `${birthYear}-${birthMonth}-${birthDay}`;

  const id = `gt_horse_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const traitCount = Math.random() > 0.5 ? 2 : 1;
  const traitsShuffled = [...TRAITS_POOL].sort(() => 0.5 - Math.random());
  const specialTraits = traitsShuffled.slice(0, traitCount);

  const growthRates: Array<"Early Bloomer" | "Standard" | "Late Bloomer"> = ["Early Bloomer", "Standard", "Late Bloomer"];

  const rawHorse = {
    id,
    name,
    gender,
    dob,
    coatColor,
    generation: 1,
    sireId: null,
    damId: null,
    sireName: null,
    damName: null,
    preferredTrack: getRandomItem(TRACK_TYPES),
    preferredDistance: getRandomItem(DISTANCES),
    runningStyle: getRandomItem(RUNNING_STYLES),
    specialTraits,
    stats,
    growth: {
      growthRate: getRandomItem(growthRates),
      peakAgeYears: Math.floor(Math.random() * 3 + 3)
    },
    racingRecord: {
      starts: 0,
      wins: 0,
      places: 0,
      shows: 0,
      earnings: 0
    },
    trainer_id: customTrainerId ?? null,
    createdAt: now.toISOString()
  };

  return sanitizeAndEnrichHorse(rawHorse);
}

export function breedChildHorse(
  sire: Horse,
  dam: Horse,
  customName?: string,
  customGender?: "Colt" | "Filly",
  customCoat?: string,
  customTrainerId?: string | null
): Horse {
  const suffix = getRandomItem(HORSE_NAME_SUFFIXES);
  const sireFirstName = sire.name.split(" ")[0];
  const defaultChildName = `${sireFirstName}'s ${suffix}`;
  const name = customName?.trim() || defaultChildName;

  const gender = customGender || (Math.random() > 0.5 ? "Colt" : "Filly");
  const coatColor = customCoat?.trim() || (Math.random() > 0.5 ? sire.coatColor : dam.coatColor);

  const inheritStat = (parentAVal: number = 75, parentBVal: number = 75) => {
    const avg = (parentAVal + parentBVal) / 2;
    const mutation = Math.floor(Math.random() * 13) - 5; // -5 to +7 mutation
    return Math.min(99, Math.max(40, Math.round(avg + mutation)));
  };

  const speed = inheritStat(sire.stats.speed, dam.stats.speed);
  const stamina = inheritStat(sire.stats.stamina, dam.stats.stamina);
  const acceleration = inheritStat(sire.stats.acceleration, dam.stats.acceleration);
  const temperament = inheritStat(sire.stats.temperament, dam.stats.temperament);
  const grit = inheritStat(sire.stats.grit, dam.stats.grit);
  const startBurst = inheritStat(sire.stats.startBurst, dam.stats.startBurst);
  const finishKick = inheritStat(sire.stats.finishKick, dam.stats.finishKick);
  const cornering = inheritStat(sire.stats.cornering, dam.stats.cornering);
  const surfaceAdaptability = inheritStat(sire.stats.surfaceAdaptability, dam.stats.surfaceAdaptability);
  const weatherResistance = inheritStat(sire.stats.weatherResistance, dam.stats.weatherResistance);
  const focus = inheritStat(sire.stats.focus, dam.stats.focus);
  const potential = inheritStat(sire.stats.potential || 90, dam.stats.potential || 90) + 2;
  const trainability = inheritStat(sire.stats.trainability || 82, dam.stats.trainability || 82);

  const stats: HorseStats = {
    speed,
    stamina,
    acceleration,
    temperament,
    grit,
    startBurst,
    finishKick,
    cornering,
    surfaceAdaptability,
    weatherResistance,
    focus,
    potential: Math.min(99, potential),
    trainability
  };

  const now = new Date();
  const dob = now.toISOString().split("T")[0];
  const maxGen = Math.max(sire.generation || 1, dam.generation || 1);
  const generation = maxGen + 1;

  const id = `gt_horse_bred_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const preferredTrack = Math.random() > 0.5 ? sire.preferredTrack : dam.preferredTrack;
  const preferredDistance = Math.random() > 0.5 ? sire.preferredDistance : dam.preferredDistance;
  const runningStyle = Math.random() > 0.5 ? sire.runningStyle : dam.runningStyle;

  const combinedTraits = Array.from(new Set([...(sire.specialTraits || []), ...(dam.specialTraits || [])]));
  if (combinedTraits.length < 2 && Math.random() > 0.4) {
    combinedTraits.push(getRandomItem(TRAITS_POOL));
  }
  const childTraits = combinedTraits.slice(0, 3);

  const growthRates: Array<"Early Bloomer" | "Standard" | "Late Bloomer"> = ["Early Bloomer", "Standard", "Late Bloomer"];

  const rawHorse = {
    id,
    name,
    gender,
    dob,
    coatColor,
    generation,
    sireId: sire.id,
    damId: dam.id,
    sireName: sire.name,
    damName: dam.name,
    preferredTrack,
    preferredDistance,
    runningStyle,
    specialTraits: childTraits,
    stats,
    growth: {
      growthRate: getRandomItem(growthRates),
      peakAgeYears: Math.floor(Math.random() * 3 + 3)
    },
    racingRecord: {
      starts: 0,
      wins: 0,
      places: 0,
      shows: 0,
      earnings: 0
    },
    trainer_id: customTrainerId ?? sire.trainer_id ?? dam.trainer_id ?? null,
    createdAt: now.toISOString()
  };

  return sanitizeAndEnrichHorse(rawHorse);
}

export function calculateRaceOdds(horses: Horse[], track?: any): Record<string, number> {
  const map: Record<string, number> = {};
  const totalRatings = horses.reduce((acc, h) => acc + (h.stats?.overallRating || 75), 0);
  horses.forEach(h => {
    const rating = h.stats?.overallRating || 75;
    const probability = totalRatings > 0 ? rating / totalRatings : 1 / Math.max(1, horses.length);
    const odds = Math.max(1.1, Math.min(99.0, Math.round((1 / Math.max(0.01, probability) * 0.88) * 10) / 10));
    map[h.id] = odds;
  });
  return map;
}

