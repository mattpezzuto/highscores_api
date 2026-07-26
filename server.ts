/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { HighscoreEntry, HighscoresData, HighscoresAPIResponse, Jedi, AcademyAPIResponse, Horse, HorseStats, HorseRacingRecord, GrandTurfAPIResponse } from "./src/types";
import { grandTurfRouter } from "./src/features/grandTurf";

// Load environment variables
dotenv.config({ override: true });

const PORT = 3000;
const app = express();

app.use(express.json());

// Enable CORS for all requests to support third-party dashboard integration
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Cache-Control, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// Cache configuration
interface CacheEntry {
  data: HighscoresData;
  fetchedAt: number;
  urlUsed: string;
}

let inMemoryCache: CacheEntry | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

// Academy Cache configuration
interface AcademyCacheEntry {
  data: Jedi[];
  fetchedAt: number;
}
const academyCache: Record<string, AcademyCacheEntry> = {};


/**
 * Helper to check if GITHUB_TOKEN is configured in environment
 */
function isTokenConfigured(): boolean {
  const token = process.env.GITHUB_TOKEN;
  return !!(token && token !== "your_github_personal_access_token_here" && token.trim() !== "");
}

/**
 * Fetches highscores directly from GitHub.
 * If a token is provided, uses the GitHub Content API to handle private repos.
 * Otherwise, uses the raw open content fallback.
 */
async function fetchHighscoresRaw(repo: string, file: string, branch: string): Promise<{ data: HighscoresData; url: string; latency: number }> {
  const startTime = Date.now();
  const token = process.env.GITHUB_TOKEN;
  const hasToken = token && token !== "your_github_personal_access_token_here" && token.trim() !== "";

  // 1. If GITHUB_TOKEN is configured, use the official GitHub REST API /contents endpoint
  // This supports private repositories seamlessly as raw.githubusercontent.com ignores Bearer authorization.
  if (hasToken) {
    const apiUrl = `https://api.github.com/repos/${repo}/contents/${file}?ref=${branch}`;
    const apiHeaders: Record<string, string> = {
      "User-Agent": "Atonement-Highscores-App",
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github.v3.raw"
    };

    try {
      console.log(`[API Fetch] Querying file contents from: ${apiUrl}`);
      const response = await fetch(apiUrl, { headers: apiHeaders });
      
      if (response.ok) {
        try {
          const text = await response.text();
          const json = JSON.parse(text) as HighscoresData;
          return {
            data: json,
            url: apiUrl,
            latency: Date.now() - startTime
          };
        } catch (parseError) {
          console.warn("[API Fetch] File is empty or has invalid JSON format. Initializing empty list.");
          return {
            data: { highscores: [] },
            url: apiUrl,
            latency: Date.now() - startTime
          };
        }
      }

      // If branch was 'main' and file 404'd, let's try the 'master' fallback branch
      if (response.status === 404 && branch === "main") {
        console.log(`[API Fetch] 404 on 'main', attempting fallback to 'master' branch...`);
        const fallbackApiUrl = `https://api.github.com/repos/${repo}/contents/${file}?ref=master`;
        const fallbackResponse = await fetch(fallbackApiUrl, { headers: apiHeaders });
        
        if (fallbackResponse.ok) {
          try {
            const text = await fallbackResponse.text();
            const json = JSON.parse(text) as HighscoresData;
            return {
              data: json,
              url: fallbackApiUrl,
              latency: Date.now() - startTime
            };
          } catch (parseError) {
            console.warn("[API Fetch Fallback] Fallback file is empty or has invalid JSON. Initializing empty list.");
            return {
              data: { highscores: [] },
              url: fallbackApiUrl,
              latency: Date.now() - startTime
            };
          }
        }
      }

      // If the file does not exist at all, return an empty default list
      // instead of failing: this allows the user to post their first highscore!
      if (response.status === 404) {
        console.log(`[API Fetch] File not found (404). Initializing with empty highscores.`);
        return {
          data: { highscores: [] },
          url: apiUrl,
          latency: Date.now() - startTime
        };
      }

      console.warn(`[API Fetch] Non-OK response code: ${response.status}. Falling back to raw file load.`);
    } catch (err) {
      console.error(`[API Fetch] Failed fetching from API. Falling back to raw URL.`, err);
    }
  }

  // 2. Fallback to raw client-friendly fetch (useful if public repo or no token set)
  // Note: we do NOT attach Bearer tokens here as that can trigger 400 Bad Request Errors from raw.githubusercontent.com
  const rawUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${file}`;
  const rawHeaders: Record<string, string> = {
    "User-Agent": "Atonement-Highscores-App"
  };

  try {
    console.log(`[Raw Fetch] Querying file from: ${rawUrl}`);
    const response = await fetch(rawUrl, { headers: rawHeaders });
    
    if (response.ok) {
      const json = await response.json() as HighscoresData;
      return {
        data: json,
        url: rawUrl,
        latency: Date.now() - startTime
      };
    }

    // Attempt fallback branch if main branch missed
    if (response.status === 404 && branch === "main") {
      console.warn(`[Raw Fetch] File not found on 'main' branch, attempting 'master' fallback...`);
      const fallbackRawUrl = `https://raw.githubusercontent.com/${repo}/master/${file}`;
      const fallbackResponse = await fetch(fallbackRawUrl, { headers: rawHeaders });
      
      if (fallbackResponse.ok) {
        const json = await fallbackResponse.json() as HighscoresData;
        return {
          data: json,
          url: fallbackRawUrl,
          latency: Date.now() - startTime
        };
      }
    }

    // Default to empty highscores array if the raw file is not found (404)
    if (response.status === 404) {
      console.log(`[Raw Fetch] File not found or repo empty. Returning empty default list.`);
      return {
        data: { highscores: [] },
        url: rawUrl,
        latency: Date.now() - startTime
      };
    }

    throw new Error(`GitHub raw fetch failed with status: ${response.status} ${response.statusText}`);
  } catch (error: any) {
    console.error(`Error in raw file loader for ${rawUrl}:`, error);
    throw error;
  }
}

// REST Endpoint: Get highscores with caching, stats, filtering, and sorting
app.get("/api/highscores", async (req, res) => {
  const repo = (req.query.repo as string) || "mattpezzuto/highscores";
  const file = (req.query.file as string) || "atonement.json";
  const branch = (req.query.branch as string) || "main";
  const forceRefresh = req.query.refresh === "true" || req.headers["cache-control"] === "no-cache";

  const startTime = Date.now();
  let cached = false;
  let cacheTtlRemainingMs = 0;
  let activeData: HighscoresData;
  let fetchLatencyMs = 0;
  let actualUrlUsed = "";

  try {
    const now = Date.now();
    
    // Determine if cache matches same configurations & parameters
    const isCacheValid = 
      inMemoryCache && 
      (now - inMemoryCache.fetchedAt < CACHE_TTL_MS) &&
      inMemoryCache.urlUsed.includes(repo) &&
      inMemoryCache.urlUsed.includes(file) &&
      !forceRefresh;

    if (isCacheValid && inMemoryCache) {
      activeData = inMemoryCache.data;
      cached = true;
      cacheTtlRemainingMs = Math.max(0, CACHE_TTL_MS - (now - inMemoryCache.fetchedAt));
      actualUrlUsed = inMemoryCache.urlUsed;
    } else {
      // Fetch fresh data
      const fetched = await fetchHighscoresRaw(repo, file, branch);
      activeData = fetched.data;
      fetchLatencyMs = fetched.latency;
      actualUrlUsed = fetched.url;
      
      // Update in-memory cache
      inMemoryCache = {
        data: activeData,
        fetchedAt: now,
        urlUsed: fetched.url
      };
      cacheTtlRemainingMs = CACHE_TTL_MS;
    }

    // Verify format and fallback to empty array if nested property doesn't exist
    if (!activeData || !Array.isArray(activeData.highscores)) {
      throw new Error("Invalid highscores JSON structure. Expected an object with a 'highscores' array.");
    }

    // Clone entries to avoid mutating cache during filtering/sorting
    let entries = [...activeData.highscores] as HighscoreEntry[];

    // --- APPLY FILTERS ---
    const playerQuery = req.query.player as string;
    if (playerQuery) {
      const lowerQuery = playerQuery.toLowerCase();
      entries = entries.filter(e => e.player?.toLowerCase().includes(lowerQuery));
    }

    const minScoreQuery = req.query.minScore;
    if (minScoreQuery) {
      const minVal = Number(minScoreQuery);
      if (!isNaN(minVal)) {
        entries = entries.filter(e => e.score >= minVal);
      }
    }

    const maxScoreQuery = req.query.maxScore;
    if (maxScoreQuery) {
      const maxVal = Number(maxScoreQuery);
      if (!isNaN(maxVal)) {
        entries = entries.filter(e => e.score <= maxVal);
      }
    }

    // Calculate metadata/summary stats of original unfiltered list
    const rawEntries = activeData.highscores;
    const scores = rawEntries.map(e => Number(e.score) || 0);
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
    const averageScore = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : 0;
    
    const uniquePlayersSet = new Set(rawEntries.map(e => e.player));
    const highestPlayer = rawEntries.find(e => e.score === highestScore)?.player || "N/A";

    // --- APPLY SORTING ---
    const sortField = (req.query.sortBy as string) || "score"; // score or date
    const sortOrder = (req.query.order as string) || "desc"; // desc or asc

    entries.sort((a, b) => {
      let comparison = 0;
      if (sortField === "date") {
        comparison = new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
      } else {
        comparison = (Number(a.score) || 0) - (Number(b.score) || 0);
      }
      return sortOrder === "desc" ? -comparison : comparison;
    });

    // --- APPLY LIMIT ---
    const limitQuery = req.query.limit;
    if (limitQuery) {
      const limitVal = Number(limitQuery);
      if (!isNaN(limitVal) && limitVal > 0) {
        entries = entries.slice(0, limitVal);
      }
    }

    const responsePayload: HighscoresAPIResponse = {
      success: true,
      data: entries,
      summary: {
        highestScore,
        highestPlayer,
        lowestScore,
        averageScore,
        totalPlayers: rawEntries.length,
        uniquePlayers: uniquePlayersSet.size
      },
      metadata: {
        sourceRepo: repo,
        sourceFile: file,
        sourceBranch: branch,
        cached,
        cacheTtlRemainingMs,
        lastFetchedAt: inMemoryCache ? new Date(inMemoryCache.fetchedAt).toISOString() : new Date().toISOString(),
        latencyMs: cached ? (Date.now() - startTime) : fetchLatencyMs,
        totalEntries: rawEntries.length,
        githubTokenConfigured: isTokenConfigured()
      }
    };

    return res.json(responsePayload);
  } catch (err: any) {
    console.error("API Error: ", err);
    return res.status(200).json({
      success: false,
      data: [],
      summary: {
        highestScore: 0,
        highestPlayer: "N/A",
        lowestScore: 0,
        averageScore: 0,
        totalPlayers: 0,
        uniquePlayers: 0
      },
      metadata: {
        sourceRepo: repo,
        sourceFile: file,
        sourceBranch: branch,
        cached: false,
        cacheTtlRemainingMs: 0,
        lastFetchedAt: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
        totalEntries: 0,
        githubTokenConfigured: isTokenConfigured()
      },
      error: err.message || "Failed to fetch highscores from git repository. Verify repository is public and contains the requested JSON file."
    });
  }
});

// REST Endpoint: Add item with capacity check (Keep only TOP 10. Drop 11th place).
app.post("/api/highscores", async (req, res) => {
  const repo = (req.body.repo as string) || "mattpezzuto/highscores";
  const file = (req.body.file as string) || "atonement.json";
  const branch = (req.body.branch as string) || "main";
  
  const player = req.body.player;
  const score = Number(req.body.score);
  // Default to today's date if missing (matching system format: YYYY-MM-DD)
  const date = req.body.date || new Date().toISOString().split('T')[0];

  if (!player || typeof player !== "string" || player.trim() === "") {
    return res.status(200).json({ success: false, error: "Missing or invalid 'player' field." });
  }

  if (isNaN(score) || score < 0) {
    return res.status(200).json({ success: false, error: "Missing or invalid 'score' field. Must be a positive integer." });
  }

  const startTime = Date.now();
  let githubSaved = false;
  let writeMessage = "";

  try {
    // 1. Fetch current scores
    let activeData: HighscoresData = { highscores: [] };
    
    try {
      const fetched = await fetchHighscoresRaw(repo, file, branch);
      activeData = fetched.data;
    } catch (e) {
      // Fallback to cache
      if (inMemoryCache && inMemoryCache.urlUsed.includes(repo) && inMemoryCache.urlUsed.includes(file)) {
        activeData = inMemoryCache.data;
      } else {
        console.warn("Unable to fetch remote raw file for update, starting new state...");
        activeData = { highscores: [] };
      }
    }

    if (!activeData || !Array.isArray(activeData.highscores)) {
      activeData = { highscores: [] };
    }

    const newEntry: HighscoreEntry = {
      player: player.trim(),
      score,
      date
    };

    // 2. Insert and Sort (Double check priority sorting: Game score descending, tie broken by date newer first)
    const proposedEntries = [...activeData.highscores, newEntry];
    proposedEntries.sort((a, b) => {
      const diff = (Number(b.score) || 0) - (Number(a.score) || 0);
      if (diff !== 0) return diff;
      return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
    });

    // 3. Limit to the top 3 high scores for each player
    const playerCounts: Record<string, number> = {};
    const filteredEntries: HighscoreEntry[] = [];
    for (const entry of proposedEntries) {
      const playerName = (entry.player || "").trim().toLowerCase();
      playerCounts[playerName] = (playerCounts[playerName] || 0) + 1;
      if (playerCounts[playerName] <= 3) {
        filteredEntries.push(entry);
      }
    }

    // 4. Enforce strictly TOP 10 overall restriction
    const trimmedScores = filteredEntries.slice(0, 10);

    // Compute if the new score made it into the Top 10
    const madeItToTop10 = trimmedScores.some(
      entry => entry.player === newEntry.player && entry.score === newEntry.score && entry.date === newEntry.date
    );

    const rankIndex = trimmedScores.findIndex(
      entry => entry.player === newEntry.player && entry.score === newEntry.score && entry.date === newEntry.date
    );
    const achievedRank = madeItToTop10 ? rankIndex + 1 : null;

    const updatedData: HighscoresData = {
      highscores: trimmedScores
    };

    // 4. Update the local client proxy cache immediately to provide synchronous high fidelity UI feedback
    inMemoryCache = {
      data: updatedData,
      fetchedAt: Date.now(),
      urlUsed: `https://raw.githubusercontent.com/${repo}/${branch}/${file}`
    };

    // 5. If GitHub Developer Token is available, commit back automatically!
    const token = process.env.GITHUB_TOKEN;
    if (token && token !== "your_github_personal_access_token_here" && token.trim() !== "") {
      const metaUrl = `https://api.github.com/repos/${repo}/contents/${file}?ref=${branch}`;
      let sha: string | undefined = undefined;

      try {
        const getMeta = await fetch(metaUrl, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Atonement-Highscores-App"
          }
        });

        if (getMeta.ok) {
          const metaJson = await getMeta.json() as any;
          if (metaJson) sha = metaJson.sha;
        } else {
          console.warn(`File SHA hash missing on repository contents branch (Status: ${getMeta.status}). Writing fresh file.`);
        }
      } catch (e) {
        console.warn("Could not query GitHub Content SHA hash context. Attempting fresh override commit.");
      }

      // Convert updated object into formatted JSON, then convert into secure base64 string
      const fileContentString = JSON.stringify(updatedData, null, 2);
      const b64Payload = Buffer.from(fileContentString, "utf-8").toString("base64");

      const putUrl = `https://api.github.com/repos/${repo}/contents/${file}`;
      const putBody = {
        message: `Highscore update: added ${player.trim()} score ${score} (Kept top 10)`,
        content: b64Payload,
        sha,
        branch
      };

      const putResponse = await fetch(putUrl, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/vnd.github.v3+json",
          "Content-Type": "application/json",
          "User-Agent": "Atonement-Highscores-App"
        },
        body: JSON.stringify(putBody)
      });

      if (putResponse.ok) {
        githubSaved = true;
        writeMessage = "Successfully committed the updated highscores back to GitHub.";
      } else {
        const textErr = await putResponse.text();
        let friendlyMessage = `GitHub API request failed with status ${putResponse.status}.`;
        
        try {
          const parsedErr = JSON.parse(textErr);
          if (putResponse.status === 403 && parsedErr.message?.includes("Resource not accessible")) {
            friendlyMessage = "Your GITHUB_TOKEN exists but has read-only permission for this repository.\n\n" +
              "To resolve this, update your token permissions on GitHub:\n" +
              "• Fine-grained Token: Under 'Repository permissions', set 'Contents' to 'Read and write'.\n" +
              "• Classic Token: Under scope checkboxes, make sure the entire 'repo' scope is checked.";
          } else if (putResponse.status === 401) {
            const maskedToken = token ? `${token.slice(0, 8)}...${token.slice(-4)}` : "None";
            friendlyMessage = `The configured GITHUB_TOKEN is invalid or expired (Loaded Token: ${maskedToken}). Please check your AI Studio environment settings.`;
          } else if (putResponse.status === 404) {
            friendlyMessage = "The repository path or branch was not found, or your token doesn't have access to this resource. Verify the repository and branch name.";
          } else {
            friendlyMessage = parsedErr.message || friendlyMessage;
          }
        } catch {
          friendlyMessage = textErr || friendlyMessage;
        }

        return res.status(200).json({
          success: false,
          error: friendlyMessage,
          githubStatus: putResponse.status
        });
      }
    } else {
      writeMessage = "In-memory sandbox update successful. Save active temporarily for live checking!";
    }

    return res.json({
      success: true,
      added: madeItToTop10,
      rank: achievedRank,
      data: trimmedScores,
      simulation: !githubSaved,
      message: writeMessage,
      latencyMs: Date.now() - startTime
    });

  } catch (err: any) {
    console.error("POST Score Failure:", err);
    return res.status(200).json({
      success: false,
      error: err.message || "Failed to parse/update highscores correctly."
    });
  }
});

/**
 * Fetches all Academy Jedis from GitHub directory/files in parallel.
 */
async function fetchAcademyJedis(repo: string, branch: string): Promise<Jedi[]> {
  const token = process.env.GITHUB_TOKEN;
  const hasToken = token && token !== "your_github_personal_access_token_here" && token.trim() !== "";
  
  const headers: Record<string, string> = {
    "User-Agent": "Academy-Jedi-App"
  };
  if (hasToken) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  // 1. List directory content at /academy
  let listUrl = `https://api.github.com/repos/${repo}/contents/academy?ref=${branch}`;
  let listResponse = await fetch(listUrl, { headers });
  
  // Try master fallback if main 404s
  if (!listResponse.ok && listResponse.status === 404 && branch === "main") {
    const fallbackListUrl = `https://api.github.com/repos/${repo}/contents/academy?ref=master`;
    const fallbackResponse = await fetch(fallbackListUrl, { headers });
    if (fallbackResponse.ok) {
      listUrl = fallbackListUrl;
      listResponse = fallbackResponse;
    }
  }

  if (listResponse.status === 404) {
    console.log(`[Academy Fetch] 'academy/' directory not found. Returning empty list.`);
    return [];
  }
  
  if (!listResponse.ok) {
    throw new Error(`Failed to list 'academy' directory. GitHub status: ${listResponse.status}`);
  }
  
  const filesList = await listResponse.json() as any;
  if (!Array.isArray(filesList)) {
    return [];
  }
  
  // Filter for .json files inside directory
  const jsonFiles = filesList.filter(f => f.type === "file" && f.name.endsWith(".json"));
  
  // 2. Fetch each Jedi file content in parallel
  const jedis: Jedi[] = [];
  const fetchPromises = jsonFiles.map(async (fileInfo) => {
    try {
      let contentResponse;
      if (hasToken) {
        // GET API with Raw Accept header so GitHub sends decoded raw file back (ideal for private repos)
        const fileApiUrl = `https://api.github.com/repos/${repo}/contents/academy/${fileInfo.name}?ref=${branch}`;
        contentResponse = await fetch(fileApiUrl, {
          headers: {
            ...headers,
            "Accept": "application/vnd.github.v3.raw"
          }
        });
      } else {
        // Public download fallback
        const rawUrl = fileInfo.download_url || `https://raw.githubusercontent.com/${repo}/${branch}/academy/${fileInfo.name}`;
        contentResponse = await fetch(rawUrl, { headers });
      }
      
      if (contentResponse.ok) {
        const text = await contentResponse.text();
        const jediData = JSON.parse(text) as Jedi;
        if (jediData && jediData.id) {
          jedis.push(jediData);
        }
      }
    } catch (err) {
      console.error(`[Academy Fetch] Error loading Jedi file ${fileInfo.name}:`, err);
    }
  });
  
  await Promise.all(fetchPromises);
  return jedis;
}

// REST Endpoint: Get Academy Jedi directory
app.get("/api/academy", async (req, res) => {
  const repo = (req.query.repo as string) || "mattpezzuto/highscores";
  const branch = (req.query.branch as string) || "main";
  const forceRefresh = req.query.refresh === "true" || req.headers["cache-control"] === "no-cache";
  
  const cacheKey = `${repo}/${branch}`;
  const now = Date.now();
  const startTime = Date.now();
  
  let cached = false;
  let activeJedis: Jedi[] = [];
  
  try {
    const isCacheValid = 
      academyCache[cacheKey] && 
      (now - academyCache[cacheKey].fetchedAt < CACHE_TTL_MS) &&
      !forceRefresh;
      
    if (isCacheValid) {
      activeJedis = academyCache[cacheKey].data;
      cached = true;
    } else {
      activeJedis = await fetchAcademyJedis(repo, branch);
      academyCache[cacheKey] = {
        data: activeJedis,
        fetchedAt: now
      };
    }
    
    // Process search / filtering on active Jedis
    let filteredJedis = [...activeJedis];
    
    // Fuzzy search
    const searchQuery = req.query.search as string;
    if (searchQuery) {
      const lower = searchQuery.toLowerCase().trim();
      filteredJedis = filteredJedis.filter(j => 
        (j.name || "").toLowerCase().includes(lower) ||
        (j.accountId || "").toLowerCase().includes(lower) ||
        (j.title || "").toLowerCase().includes(lower) ||
        (j.species || "").toLowerCase().includes(lower) ||
        (j.background || "").toLowerCase().includes(lower) ||
        (j.lightsaber?.color || "").toLowerCase().includes(lower) ||
        (j.lightsaber?.form || "").toLowerCase().includes(lower)
      );
    }
    
    // Direct accountId filter
    const accountFilter = req.query.accountId as string;
    if (accountFilter) {
      const lower = accountFilter.toLowerCase().trim();
      filteredJedis = filteredJedis.filter(j => (j.accountId || "").toLowerCase() === lower);
    }
    
    return res.json({
      success: true,
      data: filteredJedis,
      metadata: {
        sourceRepo: repo,
        branch,
        cached,
        lastFetchedAt: academyCache[cacheKey] ? new Date(academyCache[cacheKey].fetchedAt).toISOString() : new Date().toISOString(),
        latencyMs: Date.now() - startTime,
        githubTokenConfigured: isTokenConfigured()
      }
    });
    
  } catch (err: any) {
    console.error("GET Academy Error:", err);
    return res.status(200).json({
      success: false,
      data: [],
      metadata: {
        sourceRepo: repo,
        branch,
        cached: false,
        lastFetchedAt: new Date().toISOString(),
        latencyMs: Date.now() - startTime,
        githubTokenConfigured: isTokenConfigured()
      },
      error: err.message || "Failed to load Academy Jedi index from GitHub."
    });
  }
});

// REST Endpoint: Post/Add/Update individual Jedi record
app.post("/api/academy", async (req, res) => {
  const repo = (req.body.repo as string) || "mattpezzuto/highscores";
  const branch = (req.body.branch as string) || "main";
  
  const jediPayload = req.body.jedi || req.body;
  
  // Extract and strip wrapper parameters if needed
  const { repo: bodyRepo, branch: bodyBranch, ...cleanJedi } = jediPayload;
  
  if (!cleanJedi.accountId || typeof cleanJedi.accountId !== "string" || cleanJedi.accountId.trim() === "") {
    return res.status(200).json({ success: false, error: "Missing or invalid 'accountId' parameter." });
  }
  
  if (!cleanJedi.name || typeof cleanJedi.name !== "string" || cleanJedi.name.trim() === "") {
    return res.status(200).json({ success: false, error: "Missing or invalid 'name' parameter." });
  }
  
  const startTime = Date.now();
  let githubSaved = false;
  let writeMessage = "";
  
  // Force a slugified valid ID if not specified
  const id = cleanJedi.id || `jedi_${cleanJedi.accountId.trim().toLowerCase()}_${cleanJedi.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
  cleanJedi.id = id;
  
  try {
    const token = process.env.GITHUB_TOKEN;
    const file = `academy/${id}.json`;
    
    if (token && token !== "your_github_personal_access_token_here" && token.trim() !== "") {
      const metaUrl = `https://api.github.com/repos/${repo}/contents/${file}?ref=${branch}`;
      let sha: string | undefined = undefined;
      
      try {
        const getMeta = await fetch(metaUrl, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Academy-Jedi-App"
          }
        });
        
        if (getMeta.ok) {
          const metaJson = await getMeta.json() as any;
          if (metaJson) sha = metaJson.sha;
        }
      } catch (e) {
        console.warn("[Academy PUT] File meta inspect error, proceeding with override.");
      }
      
      const fileContentString = JSON.stringify(cleanJedi, null, 2);
      const b64Payload = Buffer.from(fileContentString, "utf-8").toString("base64");
      
      const putUrl = `https://api.github.com/repos/${repo}/contents/${file}`;
      const putBody = {
        message: `Academy database update: saved Jedi '${cleanJedi.name}' (${cleanJedi.title})`,
        content: b64Payload,
        sha,
        branch
      };
      
      const putResponse = await fetch(putUrl, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/vnd.github.v3+json",
          "Content-Type": "application/json",
          "User-Agent": "Academy-Jedi-App"
        },
        body: JSON.stringify(putBody)
      });
      
      if (putResponse.ok) {
        githubSaved = true;
        writeMessage = `Successfully committed Jedi record '${cleanJedi.name}' (${id}) backup to GitHub.`;
      } else {
        const textErr = await putResponse.text();
        let errMsg = `GitHub commit failed with status ${putResponse.status}.`;
        try {
          const parsed = JSON.parse(textErr);
          errMsg = parsed.message || errMsg;
        } catch {}
        
        return res.status(200).json({
          success: false,
          error: `Failed writing to Git: ${errMsg}`,
          githubStatus: putResponse.status
        });
      }
    } else {
      writeMessage = "Saved/updated Jedi in-memory active environment sandbox.";
    }
    
    // Secure matching inside client cache immediately
    const cacheKey = `${repo}/${branch}`;
    if (!academyCache[cacheKey]) {
      academyCache[cacheKey] = { data: [], fetchedAt: Date.now() };
    }
    
    const idx = academyCache[cacheKey].data.findIndex(j => j.id === id);
    if (idx !== -1) {
      academyCache[cacheKey].data[idx] = cleanJedi;
    } else {
      academyCache[cacheKey].data.push(cleanJedi);
    }
    academyCache[cacheKey].fetchedAt = Date.now();
    
    return res.json({
      success: true,
      data: cleanJedi,
      simulation: !githubSaved,
      message: writeMessage,
      latencyMs: Date.now() - startTime
    });
    
  } catch (err: any) {
    console.error("POST Academy Jedi Failure:", err);
    return res.status(200).json({
      success: false,
      error: err.message || "Failed to commit Jedi record data."
    });
  }
});

// ==========================================
// GRAND TURF THOROUGHBRED HORSE API ENGINE
// ==========================================
app.use("/api/grandturf", grandTurfRouter);
app.use("/api", grandTurfRouter);


// Start integration with Vite/Express template
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Mounted Vite middleware (Development Mode)");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving compiled static files from /dist (Production Mode)");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express application active at http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
