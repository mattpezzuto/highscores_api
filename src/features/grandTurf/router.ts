import { Router, Request, Response } from "express";
import { Horse, RaceTrack } from "../../types";
import {
  STARTER_HORSES,
  createRandomHorseData,
  breedChildHorse,
} from "./utils";
import {
  grandTurfCache,
  CACHE_TTL_MS,
  isTokenConfigured,
  fetchGrandTurfHorses,
  saveHorseToGitHubOrCache,
} from "./githubStore";
import { simulateFullRaceJson } from "./raceEngine";

export const grandTurfRouter = Router();

// REST API 1: Get all Horses (GET /api/grandturf/horses)
grandTurfRouter.get("/horses", async (req: Request, res: Response) => {
  const repo = (req.query.repo as string) || "mattpezzuto/highscores";
  const branch = (req.query.branch as string) || "main";
  const forceRefresh = req.query.refresh === "true" || req.headers["cache-control"] === "no-cache";

  const cacheKey = `${repo}/${branch}`;
  const now = Date.now();
  const startTime = Date.now();

  let cached = false;
  let activeHorses: Horse[] = [];

  try {
    const isCacheValid =
      grandTurfCache[cacheKey] &&
      (now - grandTurfCache[cacheKey].fetchedAt < CACHE_TTL_MS) &&
      !forceRefresh;

    if (isCacheValid) {
      activeHorses = grandTurfCache[cacheKey].data;
      cached = true;
    } else {
      activeHorses = await fetchGrandTurfHorses(repo, branch);
      grandTurfCache[cacheKey] = {
        data: activeHorses,
        fetchedAt: now
      };
    }

    let filtered = [...activeHorses];

    // Search query
    const searchQuery = req.query.search as string;
    if (searchQuery) {
      const lower = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(h =>
        (h.name || "").toLowerCase().includes(lower) ||
        (h.id || "").toLowerCase().includes(lower) ||
        (h.coatColor || "").toLowerCase().includes(lower) ||
        (h.sireName || "").toLowerCase().includes(lower) ||
        (h.damName || "").toLowerCase().includes(lower)
      );
    }

    // Gender filter
    const genderQuery = req.query.gender as string;
    if (genderQuery) {
      const lowerGender = genderQuery.toLowerCase().trim();
      filtered = filtered.filter(h => (h.gender || "").toLowerCase() === lowerGender);
    }

    // Minimum rating filter
    const minRatingQuery = req.query.minRating;
    if (minRatingQuery) {
      const minVal = Number(minRatingQuery);
      if (!isNaN(minVal)) {
        filtered = filtered.filter(h => h.stats.overallRating >= minVal);
      }
    }

    // Sorting
    const sortBy = (req.query.sortBy as string) || "overallRating";
    const order = (req.query.order as string) || "desc";

    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "speed") {
        comparison = a.stats.speed - b.stats.speed;
      } else if (sortBy === "generation") {
        comparison = a.generation - b.generation;
      } else if (sortBy === "createdAt") {
        comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      } else if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else {
        comparison = a.stats.overallRating - b.stats.overallRating;
      }
      return order === "desc" ? -comparison : comparison;
    });

    return res.json({
      success: true,
      data: filtered,
      metadata: {
        total: filtered.length,
        sourceRepo: repo,
        branch,
        cached,
        lastFetchedAt: grandTurfCache[cacheKey] ? new Date(grandTurfCache[cacheKey].fetchedAt).toISOString() : new Date().toISOString(),
        latencyMs: Date.now() - startTime,
        githubTokenConfigured: isTokenConfigured()
      }
    });
  } catch (err: any) {
    console.error("GET Grand Turf Horses Error:", err);
    return res.status(200).json({
      success: false,
      data: STARTER_HORSES,
      metadata: {
        total: STARTER_HORSES.length,
        sourceRepo: repo,
        branch,
        cached: false,
        lastFetchedAt: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
        githubTokenConfigured: isTokenConfigured()
      },
      error: err.message || "Failed to query Grand Turf horse database."
    });
  }
});

// GET Single Horse by ID
grandTurfRouter.get("/horses/:id", async (req: Request, res: Response) => {
  const repo = (req.query.repo as string) || "mattpezzuto/highscores";
  const branch = (req.query.branch as string) || "main";
  const horseId = req.params.id;

  try {
    const cacheKey = `${repo}/${branch}`;
    let horses = grandTurfCache[cacheKey]?.data;
    if (!horses || horses.length === 0) {
      horses = await fetchGrandTurfHorses(repo, branch);
      grandTurfCache[cacheKey] = { data: horses, fetchedAt: Date.now() };
    }

    const match = horses.find(h => h.id === horseId || h.name.toLowerCase() === horseId.toLowerCase());
    if (!match) {
      return res.status(404).json({
        success: false,
        error: `Horse with ID '${horseId}' not found.`
      });
    }

    return res.json({
      success: true,
      data: match
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to retrieve horse."
    });
  }
});

// REST API 2: Generate a new Horse (POST /api/grandturf/horses/generate)
grandTurfRouter.post("/horses/generate", async (req: Request, res: Response) => {
  const repo = (req.body.repo as string) || "mattpezzuto/highscores";
  const branch = (req.body.branch as string) || "main";
  const startTime = Date.now();

  try {
    const { name, gender, coatColor } = req.body;
    const trainerId = req.body.trainer_id || req.body.trainerId || req.query.trainer_id || req.query.trainerId || null;
    const newHorse = createRandomHorseData(name, gender, coatColor, trainerId);

    const { githubSaved, message } = await saveHorseToGitHubOrCache(newHorse, repo, branch);

    return res.json({
      success: true,
      data: newHorse,
      simulation: !githubSaved,
      message,
      latencyMs: Date.now() - startTime
    });
  } catch (err: any) {
    console.error("POST Generate Horse Error:", err);
    return res.status(200).json({
      success: false,
      error: err.message || "Failed to generate new horse."
    });
  }
});

// REST API 3: Generate a new horse passing 2 parent horses via ID (POST /api/grandturf/horses/breed)
grandTurfRouter.post("/horses/breed", async (req: Request, res: Response) => {
  const repo = (req.body.repo as string) || "mattpezzuto/highscores";
  const branch = (req.body.branch as string) || "main";
  const startTime = Date.now();

  const sireId = req.body.sireId || req.query.sireId;
  const damId = req.body.damId || req.query.damId;
  const name = req.body.name;
  const gender = req.body.gender;
  const coatColor = req.body.coatColor;
  const trainerId = req.body.trainer_id || req.body.trainerId || req.query.trainer_id || req.query.trainerId || null;

  if (!sireId || !damId) {
    return res.status(200).json({
      success: false,
      error: "Missing required parent parameters: both 'sireId' and 'damId' must be provided to breed a horse."
    });
  }

  try {
    const cacheKey = `${repo}/${branch}`;
    let horses = grandTurfCache[cacheKey]?.data;
    if (!horses || horses.length === 0) {
      horses = await fetchGrandTurfHorses(repo, branch);
      grandTurfCache[cacheKey] = { data: horses, fetchedAt: Date.now() };
    }

    const sire = horses.find(h => h.id === sireId || h.name.toLowerCase() === String(sireId).toLowerCase());
    const dam = horses.find(h => h.id === damId || h.name.toLowerCase() === String(damId).toLowerCase());

    if (!sire) {
      return res.status(200).json({
        success: false,
        error: `Sire horse with ID/Name '${sireId}' not found in active catalog.`
      });
    }

    if (!dam) {
      return res.status(200).json({
        success: false,
        error: `Dam horse with ID/Name '${damId}' not found in active catalog.`
      });
    }

    const childHorse = breedChildHorse(sire, dam, name, gender, coatColor, trainerId);
    const { githubSaved, message } = await saveHorseToGitHubOrCache(childHorse, repo, branch);

    return res.json({
      success: true,
      data: childHorse,
      sire: { id: sire.id, name: sire.name, stats: sire.stats },
      dam: { id: dam.id, name: dam.name, stats: dam.stats },
      simulation: !githubSaved,
      message,
      latencyMs: Date.now() - startTime
    });
  } catch (err: any) {
    console.error("POST Breed Horse Error:", err);
    return res.status(200).json({
      success: false,
      error: err.message || "Failed to breed foal from parent horses."
    });
  }
});

// Generic POST endpoint alias (/api/grandturf/horses)
grandTurfRouter.post("/horses", async (req: Request, res: Response) => {
  if (req.body.sireId && req.body.damId) {
    return breedHandler(req, res);
  } else {
    return generateHandler(req, res);
  }
});

// Internal helper route handlers for the alias
async function generateHandler(req: Request, res: Response) {
  const repo = (req.body.repo as string) || "mattpezzuto/highscores";
  const branch = (req.body.branch as string) || "main";
  const startTime = Date.now();

  try {
    const { name, gender, coatColor } = req.body;
    const trainerId = req.body.trainer_id || req.body.trainerId || req.query.trainer_id || req.query.trainerId || null;
    const newHorse = createRandomHorseData(name, gender, coatColor, trainerId);
    const { githubSaved, message } = await saveHorseToGitHubOrCache(newHorse, repo, branch);

    return res.json({
      success: true,
      data: newHorse,
      simulation: !githubSaved,
      message,
      latencyMs: Date.now() - startTime
    });
  } catch (err: any) {
    return res.status(200).json({
      success: false,
      error: err.message || "Failed to generate new horse."
    });
  }
}

async function breedHandler(req: Request, res: Response) {
  const repo = (req.body.repo as string) || "mattpezzuto/highscores";
  const branch = (req.body.branch as string) || "main";
  const startTime = Date.now();

  const sireId = req.body.sireId || req.query.sireId;
  const damId = req.body.damId || req.query.damId;
  const name = req.body.name;
  const gender = req.body.gender;
  const coatColor = req.body.coatColor;
  const trainerId = req.body.trainer_id || req.body.trainerId || req.query.trainer_id || req.query.trainerId || null;

  if (!sireId || !damId) {
    return res.status(200).json({
      success: false,
      error: "Missing required parent parameters: both 'sireId' and 'damId' must be provided to breed a horse."
    });
  }

  try {
    const cacheKey = `${repo}/${branch}`;
    let horses = grandTurfCache[cacheKey]?.data;
    if (!horses || horses.length === 0) {
      horses = await fetchGrandTurfHorses(repo, branch);
      grandTurfCache[cacheKey] = { data: horses, fetchedAt: Date.now() };
    }

    const sire = horses.find(h => h.id === sireId || h.name.toLowerCase() === String(sireId).toLowerCase());
    const dam = horses.find(h => h.id === damId || h.name.toLowerCase() === String(damId).toLowerCase());

    if (!sire || !dam) {
      return res.status(200).json({
        success: false,
        error: "Parent horse not found in catalog."
      });
    }

    const childHorse = breedChildHorse(sire, dam, name, gender, coatColor, trainerId);
    const { githubSaved, message } = await saveHorseToGitHubOrCache(childHorse, repo, branch);

    return res.json({
      success: true,
      data: childHorse,
      sire: { id: sire.id, name: sire.name, stats: sire.stats },
      dam: { id: dam.id, name: dam.name, stats: dam.stats },
      simulation: !githubSaved,
      message,
      latencyMs: Date.now() - startTime
    });
  } catch (err: any) {
    return res.status(200).json({
      success: false,
      error: err.message || "Failed to breed foal from parent horses."
    });
  }
}

// REST API 4: Simulate a realistic Grand Turf race with selected horses
grandTurfRouter.post("/race/simulate", async (req: Request, res: Response) => {
  const { track, allRaceHorses, playerHorseIds = [], bets = [], horseIds, trackType = "Turf", distance = "Mid-Distance (8-10f)", weather = "Clear" } = req.body;
  const repo = (req.body.repo as string) || "mattpezzuto/highscores";
  const branch = (req.body.branch as string) || "main";

  try {
    let activeTrack: RaceTrack;
    if (track && track.distanceMeters) {
      activeTrack = track;
    } else {
      const distanceMeters = String(distance).includes("Sprint") ? 1200 : String(distance).includes("Long") ? 2400 : 1800;
      activeTrack = {
        name: `${trackType} Track`,
        distanceMeters,
        purseTotal: 50000,
        surface: (trackType as any) || "Turf",
        condition: weather
      };
    }

    let raceHorses: Horse[] = [];
    if (Array.isArray(allRaceHorses) && allRaceHorses.length >= 2) {
      raceHorses = allRaceHorses;
    } else if (Array.isArray(horseIds) && horseIds.length >= 2) {
      const cacheKey = `${repo}/${branch}`;
      let horses = grandTurfCache[cacheKey]?.data;
      if (!horses || horses.length === 0) {
        horses = await fetchGrandTurfHorses(repo, branch);
        grandTurfCache[cacheKey] = { data: horses, fetchedAt: Date.now() };
      }

      for (const id of horseIds) {
        const match = horses.find(h => h.id === id || h.name.toLowerCase() === String(id).toLowerCase());
        if (match) raceHorses.push(match);
      }
    }

    if (raceHorses.length < 2) {
      return res.status(200).json({
        success: false,
        error: "At least 2 valid horses must be provided to run a race simulation."
      });
    }

    const simulationResult = simulateFullRaceJson(activeTrack, raceHorses, playerHorseIds, bets);

    return res.json({
      success: true,
      ...simulationResult
    });
  } catch (err: any) {
    console.error("Race Simulation Error:", err);
    return res.status(200).json({
      success: false,
      error: err.message || "Failed to simulate race."
    });
  }
});
