import {
  Horse,
  GrandTurfAPIResponse,
  GrandTurfSingleHorseAPIResponse,
} from "../types";

export interface GetHorsesParams {
  search?: string;
  gender?: string;
  sortBy?: string;
  order?: "asc" | "desc";
  refresh?: boolean;
}

export interface GenerateHorsePayload {
  name?: string;
  gender?: "Stallion" | "Mare" | "";
  coatColor?: string;
  trainer_id?: string;
  trainerId?: string;
}

export interface BreedHorsePayload {
  sireId: string;
  damId: string;
  name?: string;
  gender?: "Colt" | "Filly" | "";
  trainer_id?: string;
  trainerId?: string;
}

export interface SimulateRacePayload {
  horseIds: string[];
  trackType: "Dirt" | "Turf" | "Mud" | "Synthetic";
  distance: "Sprint (5-7f)" | "Mid-Distance (8-10f)" | "Long (11-14f)";
  weather: "Clear" | "Rain" | "Heavy Mud" | "Windy";
}

/**
 * GET /api/grandturf/horses
 * Fetches the catalog of Grand Turf horses with optional filtering and sorting.
 */
export async function getHorses(params: GetHorsesParams = {}): Promise<GrandTurfAPIResponse> {
  const urlParams = new URLSearchParams();
  if (params.search) urlParams.append("search", params.search);
  if (params.gender) urlParams.append("gender", params.gender);
  if (params.sortBy) urlParams.append("sortBy", params.sortBy);
  if (params.order) urlParams.append("order", params.order);
  if (params.refresh) urlParams.append("refresh", "true");

  const queryString = urlParams.toString();
  const endpointUrl = `/api/grandturf/horses${queryString ? `?${queryString}` : ""}`;

  const res = await fetch(endpointUrl);
  return await res.json();
}

/**
 * GET /api/grandturf/horses/:id
 * Fetches a single horse by ID.
 */
export async function getHorseById(id: string): Promise<GrandTurfSingleHorseAPIResponse> {
  const res = await fetch(`/api/grandturf/horses/${id}`);
  return await res.json();
}

/**
 * POST /api/grandturf/horses/generate
 * Generates a new random or custom Grand Turf horse.
 */
export async function generateHorse(payload: GenerateHorsePayload = {}): Promise<GrandTurfSingleHorseAPIResponse> {
  const body: Record<string, any> = {};
  if (payload.name?.trim()) body.name = payload.name.trim();
  if (payload.gender) body.gender = payload.gender;
  if (payload.coatColor?.trim()) body.coatColor = payload.coatColor.trim();
  const trainerId = payload.trainer_id || payload.trainerId;
  if (trainerId?.trim()) body.trainer_id = trainerId.trim();

  const res = await fetch("/api/grandturf/horses/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return await res.json();
}

/**
 * POST /api/grandturf/horses/breed
 * Breeds a foal from a sire and dam with inherited traits and stats.
 */
export async function breedHorse(payload: BreedHorsePayload): Promise<any> {
  const body: Record<string, any> = {
    sireId: payload.sireId,
    damId: payload.damId,
  };
  if (payload.name?.trim()) body.name = payload.name.trim();
  if (payload.gender) body.gender = payload.gender;
  const trainerId = payload.trainer_id || payload.trainerId;
  if (trainerId?.trim()) body.trainer_id = trainerId.trim();

  const res = await fetch("/api/grandturf/horses/breed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return await res.json();
}

/**
 * POST /api/grandturf/race/simulate
 * Simulates a Grand Turf race and returns results with replay data.
 */
export async function simulateRace(payload: SimulateRacePayload): Promise<any> {
  const res = await fetch("/api/grandturf/race/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return await res.json();
}
