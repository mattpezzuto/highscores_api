import { Horse } from "../../types";
import { STARTER_HORSES, sanitizeAndEnrichHorse } from "./utils";

export interface GrandTurfCacheEntry {
  data: Horse[];
  fetchedAt: number;
}

export const grandTurfCache: Record<string, GrandTurfCacheEntry> = {};
export const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export function isTokenConfigured(): boolean {
  const token = process.env.GITHUB_TOKEN;
  return !!(token && token !== "your_github_personal_access_token_here" && token.trim() !== "");
}

export async function fetchGrandTurfHorses(repo: string, branch: string): Promise<Horse[]> {
  const token = process.env.GITHUB_TOKEN;
  const hasToken = isTokenConfigured();

  const headers: Record<string, string> = {
    "User-Agent": "Grand-Turf-App"
  };
  if (hasToken) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    let jsonFiles: Array<{ name: string; download_url?: string }> = [];

    if (hasToken) {
      const listApiUrl = `https://api.github.com/repos/${repo}/contents/grandturf?ref=${branch}`;
      const response = await fetch(listApiUrl, { headers });

      if (response.ok) {
        const items = await response.json() as any[];
        if (Array.isArray(items)) {
          jsonFiles = items.filter(i => i.name && i.name.endsWith(".json"));
        }
      }
    }

    if (jsonFiles.length === 0) {
      return STARTER_HORSES;
    }

    const horses: Horse[] = [];
    const fetchPromises = jsonFiles.map(async (fileInfo) => {
      try {
        let contentResponse;
        if (hasToken) {
          const fileApiUrl = `https://api.github.com/repos/${repo}/contents/grandturf/${fileInfo.name}?ref=${branch}`;
          contentResponse = await fetch(fileApiUrl, {
            headers: {
              ...headers,
              "Accept": "application/vnd.github.v3.raw"
            }
          });
        } else {
          const rawUrl = fileInfo.download_url || `https://raw.githubusercontent.com/${repo}/${branch}/grandturf/${fileInfo.name}`;
          contentResponse = await fetch(rawUrl, { headers });
        }

        if (contentResponse.ok) {
          const text = await contentResponse.text();
          const parsed = JSON.parse(text);
          if (parsed && parsed.id) {
            horses.push(sanitizeAndEnrichHorse(parsed));
          }
        }
      } catch (err) {
        console.error(`[Grand Turf Fetch] Error loading horse file ${fileInfo.name}:`, err);
      }
    });

    await Promise.all(fetchPromises);
    return horses.length > 0 ? horses : STARTER_HORSES;
  } catch (err) {
    console.error("Error fetching Grand Turf horses from GitHub:", err);
    return STARTER_HORSES;
  }
}

export async function saveHorseToGitHubOrCache(
  horse: Horse,
  repo: string,
  branch: string
): Promise<{ githubSaved: boolean; message: string }> {
  const token = process.env.GITHUB_TOKEN;
  const file = `grandturf/${horse.id}.json`;
  let githubSaved = false;
  let message = "";

  if (token && token !== "your_github_personal_access_token_here" && token.trim() !== "") {
    try {
      const metaUrl = `https://api.github.com/repos/${repo}/contents/${file}?ref=${branch}`;
      let sha: string | undefined = undefined;

      try {
        const getMeta = await fetch(metaUrl, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Grand-Turf-App"
          }
        });
        if (getMeta.ok) {
          const metaJson = await getMeta.json() as any;
          if (metaJson) sha = metaJson.sha;
        }
      } catch (e) {
        console.warn("[Grand Turf PUT] Meta check error, proceeding.");
      }

      const fileContentString = JSON.stringify(horse, null, 2);
      const b64Payload = Buffer.from(fileContentString, "utf-8").toString("base64");

      const putUrl = `https://api.github.com/repos/${repo}/contents/${file}`;
      const putBody = {
        message: `Grand Turf horse entry: '${horse.name}' (Gen ${horse.generation}, Rating ${horse.stats.overallRating})`,
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
          "User-Agent": "Grand-Turf-App"
        },
        body: JSON.stringify(putBody)
      });

      if (putResponse.ok) {
        githubSaved = true;
        message = `Successfully committed horse '${horse.name}' (${horse.id}) to GitHub repository.`;
      } else {
        message = `Saved horse in-memory sandbox. (GitHub commit status ${putResponse.status})`;
      }
    } catch (e: any) {
      message = `Saved horse in-memory sandbox. (${e.message})`;
    }
  } else {
    message = "Saved horse in active sandbox memory storage.";
  }

  // Always update in-memory cache
  const cacheKey = `${repo}/${branch}`;
  if (!grandTurfCache[cacheKey]) {
    grandTurfCache[cacheKey] = { data: [...STARTER_HORSES], fetchedAt: Date.now() };
  }
  const existingIdx = grandTurfCache[cacheKey].data.findIndex(h => h.id === horse.id);
  if (existingIdx !== -1) {
    grandTurfCache[cacheKey].data[existingIdx] = horse;
  } else {
    grandTurfCache[cacheKey].data.unshift(horse);
  }
  grandTurfCache[cacheKey].fetchedAt = Date.now();

  return { githubSaved, message };
}
