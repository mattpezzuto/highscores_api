/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from "react";
import { 
  Github, 
  ExternalLink, 
  Copy, 
  Check, 
  Activity, 
  RefreshCw, 
  Sliders, 
  Database, 
  Search, 
  Trophy, 
  Code, 
  Clock, 
  ShieldAlert,
  Terminal,
  FileJson,
  Info,
  Server,
  Sparkles,
  PlusCircle,
  Gamepad2,
  BookOpen,
  ChevronLeft,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { HighscoreEntry, HighscoresAPIResponse } from "./types";
import AcademyPortal from "./components/AcademyPortal";

export default function App() {
  // Selected Game directory state: null | "atonement" | "the_academy"
  const [selectedGame, setSelectedGame] = useState<"atonement" | "the_academy" | null>(null);

  // Input settings for Custom Repo / File
  const [repo, setRepo] = useState("mattpezzuto/highscores");
  const [file, setFile] = useState("atonement.json");
  const [branch, setBranch] = useState("main");

  // Query Parameters
  const [limit, setLimit] = useState<number | "">("");
  const [sortBy, setSortBy] = useState<"score" | "date">("score");
  const [order, setOrder] = useState<"desc" | "asc">("desc");
  const [playerFilter, setPlayerFilter] = useState("");

  // Submit Highscore Parameters
  const [submitPlayer, setSubmitPlayer] = useState("");
  const [submitScore, setSubmitScore] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{
    success: boolean;
    added: boolean;
    rank: number | null;
    simulation: boolean;
    message: string;
  } | null>(null);

  // UI / Logic States
  const [apiResponse, setApiResponse] = useState<HighscoresAPIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorString, setErrorString] = useState<string | null>(null);
  const [latencyHistory, setLatencyHistory] = useState<number[]>([]);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [jsonExpanded, setJsonExpanded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Active terminal console tab
  const [activeConsoleTab, setActiveConsoleTab] = useState<"GET" | "POST">("GET");

  // Countdown timer for caching TTL
  const [cacheTtlRemaining, setCacheTtlRemaining] = useState(0);

  // Active query builders (to run on button click or change)
  const [triggerCount, setTriggerCount] = useState(0);
  const [forceNextRefresh, setForceNextRefresh] = useState(false);

  // Quick preset templates
  const presets = [
    {
      name: "Default Leaderboard",
      description: "Default state of mattpezzuto/highscores highscores sorted descending.",
      action: () => {
        setRepo("mattpezzuto/highscores");
        setFile("atonement.json");
        setBranch("main");
        setLimit("");
        setSortBy("score");
        setOrder("desc");
        setPlayerFilter("");
        setSubmitFeedback(null);
        setTriggerCount(prev => prev + 1);
      }
    },
    {
      name: "Top 1 Competitor",
      description: "Finds the highest record scorer currently in atonement.json file.",
      action: () => {
        setLimit(1);
        setSortBy("score");
        setOrder("desc");
        setPlayerFilter("");
        setSubmitFeedback(null);
        setTriggerCount(prev => prev + 1);
      }
    },
    {
      name: "Filtered for 'Player2'",
      description: "Search filter specifically targeting 'Player2'.",
      action: () => {
        setPlayerFilter("Player2");
        setLimit("");
        setSortBy("score");
        setOrder("desc");
        setSubmitFeedback(null);
        setTriggerCount(prev => prev + 1);
      }
    },
    {
      name: "Chronological Order",
      description: "Inspects highscores sorted oldest-to-newest submission date.",
      action: () => {
        setSortBy("date");
        setOrder("asc");
        setLimit("");
        setPlayerFilter("");
        setSubmitFeedback(null);
        setTriggerCount(prev => prev + 1);
      }
    }
  ];

  // Build current query endpoint relative path
  const buildRelativeUrl = (isAbsolute = false) => {
    const params = new URLSearchParams();
    if (repo !== "mattpezzuto/highscores") params.append("repo", repo);
    if (file !== "atonement.json") params.append("file", file);
    if (branch !== "main") params.append("branch", branch);
    if (limit) params.append("limit", limit.toString());
    if (sortBy !== "score") params.append("sortBy", sortBy);
    if (order !== "desc") params.append("order", order);
    if (playerFilter) params.append("player", playerFilter);
    if (forceNextRefresh) params.append("refresh", "true");

    const queryStr = params.toString();
    const basePath = "/api/highscores";
    const pathWithQuery = queryStr ? `${basePath}?${queryStr}` : basePath;
    
    if (isAbsolute) {
      const origin = window.location.origin;
      return `${origin}${pathWithQuery}`;
    }
    return pathWithQuery;
  };

  // Fetch Logic
  const handleFetch = async (bypassCache = false) => {
    setLoading(true);
    setErrorString(null);
    
    const params = new URLSearchParams();
    params.append("repo", repo);
    params.append("file", file);
    params.append("branch", branch);
    if (limit) params.append("limit", limit.toString());
    params.append("sortBy", sortBy);
    params.append("order", order);
    if (playerFilter) params.append("player", playerFilter);
    if (bypassCache) {
      params.append("refresh", "true");
    }

    const requestUrl = `/api/highscores?${params.toString()}`;

    try {
      const res = await fetch(requestUrl);
      const payload: HighscoresAPIResponse = await res.json();
      
      if (payload.success) {
        setApiResponse(payload);
        setCacheTtlRemaining(payload.metadata.cacheTtlRemainingMs);
        setLastUpdated(new Date());
        
        // Push latency historical tracing (max 8 records)
        setLatencyHistory(prev => {
          const next = [...prev, payload.metadata.latencyMs];
          if (next.length > 8) next.shift();
          return next;
        });
      } else {
        setErrorString(payload.error || "Failed to reach endpoint correctly.");
        setApiResponse(payload); // Show error payload
      }
    } catch (err: any) {
      console.error(err);
      setErrorString("Network connection to `/api/highscores` failed. Ensure the server is booted correctly.");
    } finally {
      setLoading(false);
      setForceNextRefresh(false);
    }
  };

  // Submit highscore POST logic
  const handleSubmitScore = async (e: FormEvent) => {
    e.preventDefault();
    if (!submitPlayer.trim()) return;
    if (submitScore === "" || Number(submitScore) < 0) return;

    setIsSubmitting(true);
    setSubmitFeedback(null);

    const postPayload = {
      repo,
      file,
      branch,
      player: submitPlayer.trim(),
      score: Number(submitScore)
    };

    try {
      const res = await fetch("/api/highscores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(postPayload)
      });

      const payload = await res.json();
      if (payload.success) {
        setSubmitFeedback({
          success: true,
          added: payload.added,
          rank: payload.rank,
          simulation: payload.simulation,
          message: payload.message
        });

        // Blank input score for ease of consecutive submission testing
        setSubmitScore("");
        
        // Refresh standard query stats
        setForceNextRefresh(true);
        setTriggerCount(prev => prev + 1);
      } else {
        setSubmitFeedback({
          success: false,
          added: false,
          rank: null,
          simulation: true,
          message: payload.error || "Error storing highscore."
        });
      }
    } catch (err) {
      console.error(err);
      setSubmitFeedback({
        success: false,
        added: false,
        rank: null,
        simulation: true,
        message: "Failed to connect to backend POST score service."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch on change or trigger
  useEffect(() => {
    handleFetch(forceNextRefresh);
  }, [triggerCount, sortBy, order]);

  // Timer interval for cache TTL countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCacheTtlRemaining(prev => {
        if (prev <= 100) return 0;
        return prev - 200;
      });
    }, 200);
    return () => clearInterval(timer);
  }, []);

  const copyToClipboard = (text: string, isCurl = false) => {
    navigator.clipboard.writeText(text);
    if (isCurl) {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const fullApiUrl = buildRelativeUrl(true);
  const curlCommand = `curl -X GET "${fullApiUrl}"`;

  const postApiUrl = `${window.location.origin}/api/highscores`;
  const curlPostCommand = `curl -X POST "${postApiUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{"repo":"${repo}", "file":"${file}", "branch":"${branch}", "player":"${submitPlayer || "Atoner"}", "score":${submitScore || 8500}}'`;

  const sampleJsonSchemaPost = `{
  "repo": "${repo}",
  "file": "${file}",
  "branch": "${branch}",
  "player": "PlayerName",
  "score": 5000
}`;

  if (selectedGame === null) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-950 flex flex-col antialiased font-sans">
        {/* Core Header */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 sm:px-8 shrink-0 relative z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 font-display">
                Arcade Score Ledger
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-150 font-mono">
              Leaderboard Portal v1.1.0
            </span>
          </div>
        </header>

        {/* Hero Section */}
        <div className="flex-1 max-w-[1000px] w-full mx-auto px-4 sm:px-8 py-12 flex flex-col justify-center">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-650 border border-indigo-100 uppercase tracking-wider mb-4 inline-block">
              Choose Directory
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-display mb-4">
              Select a Game Database
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Explore custom Highscore REST APIs, inspect real-time leaderboards, commit local sandbox scores, or test live integration queries across active play files.
            </p>
          </div>

          {/* Grid Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
            
            {/* Card 1: Atonement (Active) */}
            <motion.div
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedGame("atonement")}
              className="bg-white border-2 border-indigo-100 hover:border-indigo-500 rounded-2xl p-6 sm:p-8 cursor-pointer shadow-sm hover:shadow-md transition flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -mr-8 -mt-8 -z-0 transition-all group-hover:scale-110" />
              
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-indigo-950 group-hover:bg-indigo-900 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-100 transition-colors">
                    <Gamepad2 className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1.5 font-mono">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    API Active
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold tracking-tight text-slate-900 font-display group-hover:text-indigo-650 transition-colors flex items-center gap-2">
                    <span>Atonement</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className="text-xs text-slate-550 leading-relaxed">
                    Access active highscores, test GET filters (limit, order, fuzzy search), submit real-time scores, and review Git proxy metadata. Powered by in-memory sandbox and live GitHub synchronization.
                  </p>
                </div>
              </div>

              <div className="relative z-10 mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>FILE: atonement.json</span>
                <span className="text-indigo-650 font-bold group-hover:underline flex items-center gap-1">
                  Open Game directory &rarr;
                </span>
              </div>
            </motion.div>

            {/* Card 2: The Academy (Pending) */}
            <motion.div
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedGame("the_academy")}
              className="bg-white border border-slate-200 hover:border-slate-400 rounded-2xl p-6 sm:p-8 cursor-pointer shadow-xs hover:shadow-sm transition flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full -mr-8 -mt-8 -z-0 transition-all group-hover:scale-110" />
              
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-slate-100 group-hover:bg-slate-200 rounded-xl flex items-center justify-center text-slate-600 transition-colors">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200 font-mono">
                    Coming Soon
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold tracking-tight text-slate-900 font-display group-hover:text-indigo-650 transition-colors flex items-center gap-2">
                    <span>The Academy</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className="text-xs text-slate-550 leading-relaxed">
                    Nerve-wracking academy trial-by-fire sequence scores. Competitive leaderboards and historical telemetry parameters are under design and will be deployed in an upcoming update.
                  </p>
                </div>
              </div>

              <div className="relative z-10 mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>STATUS: PRE-ALPHA</span>
                <span className="text-slate-550 group-hover:underline">
                  Preview options &rarr;
                </span>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Minimal Footer */}
        <footer className="h-11 bg-white border-t border-slate-200 flex items-center justify-between px-6 sm:px-8 text-[9px] font-bold text-slate-400 shrink-0 uppercase tracking-widest relative z-10">
          <div>DEPLOY_REGION: AUTO-CONTAINER</div>
          <div className="flex items-center gap-4">
            <span>SCORE_ROUTER - v1.0.0</span>
          </div>
        </footer>
      </div>
    );
  }

  if (selectedGame === "the_academy") {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-950 flex flex-col antialiased font-sans">
        {/* Core Header */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 sm:px-8 shrink-0 relative z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedGame(null)}
              className="flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg border border-slate-200 transition duration-150 shrink-0 cursor-pointer"
              id="back_from_academy_to_selection_button"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm">
                <BookOpen className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 font-display flex items-center gap-2">
                  <span>The Academy Archives Portal</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-250 font-mono font-bold">
                    API Active
                  </span>
                </h1>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500 border border-slate-200 font-mono">
              Live Database
            </span>
          </div>
        </header>

        {/* Live Academy Database UI */}
        <AcademyPortal onBack={() => setSelectedGame(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 flex flex-col antialiased font-sans">
      
      {/* Pristine Minimalism Header */}
      <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 sm:px-8 shrink-0 relative z-21">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedGame(null)}
            className="flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg border border-slate-200 transition duration-150 shrink-0 cursor-pointer"
            id="back_to_selection_button"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span>Back</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 font-display flex items-center gap-2">
                <span>Atonement Highscores API</span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-800 border border-slate-200 font-mono">
                  Active
                </span>
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:inline">Endpoint Active</span>
          </div>
          <button 
            onClick={() => {
              setForceNextRefresh(true);
              setTriggerCount(prev => prev + 1);
            }}
            disabled={loading}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition duration-200 flex items-center gap-1.5 disabled:opacity-50"
            id="resync_source_button"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-sync Source</span>
          </button>
        </div>
      </header>

      {/* Main Body Grid */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Left column: Parameters and Source configurations */}
        <section className="lg:col-span-4 flex flex-col gap-6" id="api-controller">
          
          {/* Resource Settings Panel */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col gap-4">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span>Resource Source Details</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider mb-1">GitHub Repository</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">github/</span>
                  <input
                    type="text"
                    value={repo}
                    onChange={(e) => setRepo(e.target.value)}
                    className="w-full text-xs font-mono pl-16 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-slate-400 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider mb-1">Target File</label>
                  <input
                    type="text"
                    value={file}
                    onChange={(e) => setFile(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-slate-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider mb-1">Git Branch</label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-slate-400 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit New Score (Capacity check: keeps top 10 limit) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col gap-4">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <PlusCircle className="w-3.5 h-3.5 text-indigo-500" />
                <span>Add Score (Top 10 Enforced)</span>
              </span>
              <span className="text-[9px] font-bold bg-indigo-50 text-indigo-650 px-1.5 py-0.5 rounded font-mono uppercase">
                Active Limits
              </span>
            </h2>

            <form onSubmit={handleSubmitScore} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider mb-1">Player Name</label>
                <input
                  type="text"
                  placeholder="Enter name to record..."
                  value={submitPlayer}
                  onChange={(e) => setSubmitPlayer(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-slate-400 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider mb-1">Game Score</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 10400"
                  value={submitScore}
                  onChange={(e) => setSubmitScore(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-slate-400 transition cursor-text"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !submitPlayer.trim() || submitScore === ""}
                className="w-full py-2 bg-slate-900 hover:bg-indigo-950 text-white text-xs font-semibold rounded-lg transition-transform focus:scale-98 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Submit Score Entry</span>
                )}
              </button>
            </form>

            {/* Submission outcome banner representation */}
            <AnimatePresence>
              {submitFeedback && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`p-3 rounded-lg border text-xs overflow-hidden ${
                    submitFeedback.success
                      ? submitFeedback.added
                        ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                        : "bg-amber-50 border-amber-100 text-amber-800"
                      : "bg-rose-50 border-rose-150 text-rose-800"
                  }`}
                >
                  <p className="font-bold text-[11px] mb-1 flex items-center gap-1.5">
                    {submitFeedback.success ? (
                      submitFeedback.added ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>Placed Rank #{submitFeedback.rank}!</span>
                        </>
                      ) : (
                        <span>Out of Top 10 Entry</span>
                      )
                    ) : (
                      <span>Submission Failure</span>
                    )}
                  </p>
                  <p className={`text-[10px] leading-relaxed whitespace-pre-wrap ${submitFeedback.success ? "text-slate-600" : "text-rose-700 font-medium"}`}>
                    {submitFeedback.success ? (
                      submitFeedback.added ? (
                        <span>Fantastic score! Your record secured slot #{submitFeedback.rank} in the Top 10. The former 11th-placed score has been trimmed from the filesystem permanently.</span>
                      ) : (
                        <span>Valid submission. However, this score didn't exceed the minimum threshold required to place in the Top 10. List remains unchanged.</span>
                      )
                    ) : (
                      submitFeedback.message
                    )}
                  </p>
                  <div className="mt-2 text-[9px] font-mono flex items-center justify-between border-t border-slate-200/50 pt-1.5 italic text-slate-400">
                    <span>MODE: {submitFeedback.simulation ? "SANDBOX SIMULATION" : "GITHUB COMMITTED"}</span>
                    <span>SUCCESS</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Query Filter panel */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col gap-4">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <span>Query Parameters</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider mb-1">Player Match Filter</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Fuzzy search player..."
                    value={playerFilter}
                    onChange={(e) => {
                      setPlayerFilter(e.target.value);
                      setTriggerCount(prev => prev + 1);
                    }}
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider mb-1">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "score" | "date")}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-slate-400 transition animate-none cursor-pointer"
                  >
                    <option value="score">Game Score</option>
                    <option value="date">Registry Date</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider mb-1">Row Limit</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={limit}
                    onChange={(e) => {
                      const val = e.target.value === "" ? "" : Number(e.target.value);
                      setLimit(val);
                      setTriggerCount(prev => prev + 1);
                    }}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider mb-1.5 font-semibold">Order Direction</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrder("desc")}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition duration-150 ${order === 'desc' ? 'bg-slate-900 text-white' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                  >
                    Descending (High)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrder("asc")}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition duration-150 ${order === 'asc' ? 'bg-slate-900 text-white' : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                  >
                    Ascending (Low)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Config Presets Widget */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col gap-3">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2 flex items-center gap-2">
              <Code className="w-3.5 h-3.5 text-slate-400" />
              <span>Diagnostic Presets</span>
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={p.action}
                  className="w-full text-left p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition flex flex-col gap-0.5 group"
                >
                  <span className="text-xs font-semibold text-slate-900 group-hover:text-amber-700 transition">{p.name}</span>
                  <span className="text-[10px] text-slate-500">{p.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Developer smart cache explanation card */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3 text-[11px] text-slate-600 leading-relaxed">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800 mb-1 font-display">Optimized Memory Cache Layer</p>
              Queries are proxied and active for <span className="font-bold text-slate-900">60 seconds</span> to protect github API thresholds. Submission updates bypass the cache immediately.
            </div>
          </div>
        </section>

        {/* Right Code Column: Visual Live Analytics Dashboard */}
        <section className="lg:col-span-8 flex flex-col gap-6" id="dashboard-displays">
          
          {/* Metadata & Performance Indicators Banner */}
          {apiResponse?.success && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm text-slate-900 flex flex-col justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">🏆 TOP SCORE</p>
                <div className="mt-2">
                  <h3 className="text-2xl font-bold text-slate-900 font-display">{apiResponse.summary.highestScore}</h3>
                  <p className="text-[10px] text-slate-500 font-mono truncate">by {apiResponse.summary.highestPlayer}</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm text-slate-900 flex flex-col justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">📊 AVG SCORE</p>
                <div className="mt-2">
                  <h3 className="text-2xl font-bold text-slate-900 font-display">{apiResponse.summary.averageScore}</h3>
                  <p className="text-[10px] text-slate-500 font-mono">top 10 averaged</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm text-slate-900 flex flex-col justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">👥 ACTIVE ENTRIES</p>
                <div className="mt-2">
                  <h3 className="text-2xl font-bold text-slate-900 font-display">
                    {apiResponse.summary.totalPlayers} <span className="text-[10px] font-normal text-slate-400 font-mono">/ 10 max</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono">{apiResponse.summary.uniquePlayers} unique players</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm text-slate-900 flex flex-col justify-between flex-wrap overflow-hidden">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">⚡ CONNECTION STATE</p>
                <div className="mt-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${apiResponse.metadata.githubTokenConfigured ? 'bg-indigo-500' : 'bg-slate-400'} animate-pulse`} />
                    <span className="text-sm font-bold font-display text-slate-900 capitalize leading-none">
                      {apiResponse.metadata.githubTokenConfigured ? "GitHub Production" : "Sandbox Simulator"}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-500 mt-1 font-mono leading-tight">
                    {apiResponse.metadata.githubTokenConfigured ? "Sync commits fully active" : "In-memory test active"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorString && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 px-5 py-4 rounded-xl flex items-start gap-3.5 text-xs">
              <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-rose-950 mb-0.5">REST Proxy Lookup Failed</span>
                {errorString}
                <div className="mt-2 text-[10px] text-rose-650 font-mono">
                  Confirm public endpoint configuration. (You can still run live high-fidelity POST and GET tests locally inside our sandbox memory simulator anytime).
                </div>
              </div>
            </div>
          )}

          {/* Primary Highscores Table Panel */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            
            {/* Table Header Section */}
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">Live Leaderboard Preview</span>
                <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-mono font-bold">
                  {apiResponse?.success ? `${apiResponse.data.length} registered scorelines` : "Offline Simulation"}
                </span>
              </div>

              {/* Cache Countdown Progress element */}
              {apiResponse?.success && apiResponse.metadata.cached && (
                <div className="flex items-center gap-2 text-xs bg-amber-500/5 hover:bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/10 transition">
                  <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-slate-600">
                    Cache sync in: {((cacheTtlRemaining) / 1000).toFixed(1)}s
                  </span>
                  <div className="w-12 bg-slate-200 h-1 rounded overflow-hidden">
                    <div 
                      className="bg-amber-500 h-1 transition-all duration-200" 
                      style={{ width: `${(cacheTtlRemaining / 60000) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* List / Scrollable Table */}
            <div className="overflow-x-auto min-h-[320px] relative">
              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-3xs z-20">
                  <RefreshCw className="w-8 h-8 text-slate-700 animate-spin mb-2" />
                  <span className="font-mono text-xs text-slate-550">Resolving Leaderboards...</span>
                </div>
              )}

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-white sticky top-0 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-6 text-center w-20">Rank</th>
                    <th className="py-3 px-4">Player</th>
                    <th className="py-3 px-4 text-right">Game Score</th>
                    <th className="py-3 px-6 text-right">Submission Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence mode="popLayout">
                    {apiResponse?.data && apiResponse.data.length > 0 ? (
                      apiResponse.data.map((item, index) => {
                        const displayRank = index + 1;
                        let medalStyle = "text-slate-500 bg-slate-50 border-slate-200/50";
                        if (displayRank === 1) medalStyle = "text-amber-800 bg-amber-50 border-amber-200 font-semibold";
                        if (displayRank === 2) medalStyle = "text-slate-800 bg-slate-100 border-slate-200 font-semibold";
                        if (displayRank === 3) medalStyle = "text-amber-950 bg-amber-100/50 border-amber-250 font-semibold";

                        return (
                          <motion.tr 
                            key={`${item.player}-${item.score}-${index}`}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="hover:bg-slate-50/80 transition duration-150"
                          >
                            <td className="py-3.5 px-6 text-center">
                              <span className={`inline-flex items-center justify-center w-5.5 h-5.5 rounded-full text-[10px] border ${medalStyle}`}>
                                {displayRank.toString().padStart(2, '0')}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-900">
                              {item.player || "N/A"}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                              {item.score?.toLocaleString()}
                            </td>
                            <td className="py-3.5 px-6 text-right text-slate-500 font-mono text-[11px]">
                              {item.date ? new Date(item.date).toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'}) : "N/A"}
                            </td>
                          </motion.tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-16 text-center text-slate-400 bg-slate-20/20">
                          <Trophy className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-60" />
                          <p className="font-bold text-slate-800 text-xs font-display">No Records Located</p>
                          <p className="text-[10px] text-slate-400 mt-1">Adjust active filtering keys or submit scores in our form above.</p>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* Analytics Visual Chart Widget */}
          {apiResponse?.success && apiResponse.data.length > 0 && (
            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-500" />
                  <h3 className="font-display font-semibold text-[11px] uppercase tracking-wider text-slate-800">
                    Leaderboard Score Scaling Graph Representation
                  </h3>
                </div>
                <span className="text-[10px] italic text-slate-400 font-mono">Strict Top 10 active capacity</span>
              </div>

              <div className="space-y-3 pt-1">
                {apiResponse.data.slice(0, 10).map((item, idx) => {
                  const maxVal = Math.max(...apiResponse.data.map(i => i.score), 1);
                  const percentage = (item.score / maxVal) * 100;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-semibold text-slate-800">
                          <span className="font-mono text-slate-400 text-[10px] mr-1">#{idx + 1}</span>
                          {item.player}
                        </span>
                        <span className="font-mono text-slate-500 font-medium">
                          {item.score.toLocaleString()} points ({Math.round(percentage)}%)
                        </span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <motion.div 
                          className="bg-indigo-650 h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.05 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interactive Live Endpoint Console Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Deployable API REST Integration
                  </span>
                </div>
                <div className="flex bg-slate-800 p-0.5 rounded-lg shrink-0">
                  <button
                    onClick={() => setActiveConsoleTab("GET")}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition duration-150 ${activeConsoleTab === "GET" ? "bg-slate-900 text-emerald-400 shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    GET (Fetch)
                  </button>
                  <button
                    onClick={() => setActiveConsoleTab("POST")}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition duration-150 ${activeConsoleTab === "POST" ? "bg-slate-900 text-blue-400 shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    POST (Submit)
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setJsonExpanded(!jsonExpanded)}
                  className="p-1 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium font-sans text-[10px] transition"
                  id="inspect_json_button"
                >
                  <FileJson className="w-3.5 h-3.5 inline mr-1" />
                  <span>{jsonExpanded ? "Collapse Block" : "Inspect Spec Details"}</span>
                </button>
              </div>
            </div>

            {/* Path configurations & copy targets */}
            <div className="p-5 text-xs font-mono space-y-4">
              
              {activeConsoleTab === "GET" ? (
                <>
                  {/* Endpoint target copy container */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-500 block uppercase tracking-wider">GET Endpoint Target Route</span>
                    <div className="flex bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 items-center justify-between gap-4 overflow-hidden">
                      <div className="flex items-center gap-2 overflow-hidden truncate">
                        <span className="text-emerald-400 font-bold shrink-0">GET</span>
                        <span className="text-slate-300 truncate select-all">{fullApiUrl}</span>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(fullApiUrl)}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 shrink-0 transition"
                        title="Copy API target endpoint URL"
                        id="copy-endpoint-btn"
                      >
                        {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Import curl target container */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-500 block uppercase tracking-wider">cURL CLI Import</span>
                    <div className="flex bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 items-center justify-between gap-4 overflow-hidden">
                      <span className="text-slate-300 truncate select-all">{curlCommand}</span>
                      <button 
                        onClick={() => copyToClipboard(curlCommand, true)}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 shrink-0 transition"
                        title="Copy terminal curl command"
                        id="copy-curl-btn"
                      >
                        {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* POST Endpoint target copy container */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-500 block uppercase tracking-wider">POST Submit Endpoint Route</span>
                    <div className="flex bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 items-center justify-between gap-4 overflow-hidden">
                      <div className="flex items-center gap-2 overflow-hidden truncate">
                        <span className="text-blue-400 font-bold shrink-0">POST</span>
                        <span className="text-slate-300 truncate select-all">{postApiUrl}</span>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(postApiUrl)}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 shrink-0 transition"
                        title="Copy POST URL"
                        id="copy-post-endpoint-btn"
                      >
                        {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Import curl target container */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-500 block uppercase tracking-wider">POST Submit cURL CLI Format (Strict Capacity Trim)</span>
                    <div className="flex bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 items-center justify-between gap-4 overflow-hidden">
                      <span className="text-slate-300 truncate select-all text-[10px] block whitespace-pre-wrap">{curlPostCommand}</span>
                      <button 
                        onClick={() => copyToClipboard(curlPostCommand, true)}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 shrink-0 transition"
                        title="Copy terminal curl command"
                        id="copy-curl-post-btn"
                      >
                        {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Toggleable JSON preview details */}
              <AnimatePresence>
                {jsonExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-slate-800 pt-4"
                  >
                    {activeConsoleTab === "GET" ? (
                      <>
                        <span className="text-[9px] text-slate-500 block uppercase tracking-wider mb-2">GET Response REST Payload Structure</span>
                        <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800/40 text-[10px] overflow-x-auto max-h-64 leading-relaxed font-mono text-slate-300">
                          <code>
                            {apiResponse ? JSON.stringify(apiResponse, null, 2) : `// Waiting for endpoint resolution to inspect structure...`}
                          </code>
                        </pre>
                      </>
                    ) : (
                      <>
                        <span className="text-[9px] text-slate-500 block uppercase tracking-wider mb-2">POST Request Payload Specification Format</span>
                        <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800/40 text-[10px] overflow-x-auto max-h-64 leading-relaxed font-mono text-slate-300">
                          <code>
                            {sampleJsonSchemaPost}
                          </code>
                        </pre>
                        <p className="text-[10px] text-slate-400 mt-2 italic leading-relaxed">
                          Note: POSTing records automatically validates inputs, inserts and high-score sorts the player. If the entry places in the Top 10, it is added and any 11th place record is safely dropped in real-time.
                        </p>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="px-4 py-3 bg-slate-950/40 border-t border-slate-800/60">
              <button 
                onClick={() => copyToClipboard(activeConsoleTab === "GET" ? fullApiUrl : postApiUrl)}
                className="w-full py-2 bg-white hover:bg-slate-100 text-slate-950 rounded-lg text-xs font-bold transition duration-150 cursor-pointer"
                id="footer_copy_url_btn"
              >
                Copy {activeConsoleTab} Route URL
              </button>
            </div>
          </div>

        </section>
      </main>

      {/* Structured Minimal Footer */}
      <footer className="h-11 bg-white border-t border-slate-200 flex items-center justify-between px-6 sm:px-8 text-[9px] font-bold text-slate-400 shrink-0 uppercase tracking-widest relative z-10">
        <div>DEPLOY_REGION: AUTO-CONTAINER</div>
        <div className="flex items-center gap-4">
          <span>HIGH_SCORE_PROXY - v1.1.0</span>
          <span className="text-slate-250">|</span>
          <span>MEMORY ENGINE CAPABILITY: Top 10 strict capacity trim</span>
        </div>
      </footer>
    </div>
  );
}
