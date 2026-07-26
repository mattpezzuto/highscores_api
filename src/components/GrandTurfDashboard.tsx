import { useState, useEffect, FormEvent } from "react";
import { 
  Trophy, 
  Search, 
  RefreshCw, 
  PlusCircle, 
  Dna, 
  Terminal, 
  Copy, 
  Check, 
  Filter, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  Activity,
  Award,
  Zap,
  Shield,
  Clock,
  Heart,
  Code,
  Code2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Horse, GrandTurfAPIResponse, GrandTurfSingleHorseAPIResponse } from "../types";
import { 
  getHorses, 
  generateHorse, 
  breedHorse, 
  simulateRace 
} from "../APIs/grandTurfApi";

interface GrandTurfDashboardProps {
  onBack: () => void;
}

export default function GrandTurfDashboard({ onBack }: GrandTurfDashboardProps) {
  // Navigation tabs: "stable" | "generate" | "breed" | "race" | "docs"
  const [activeTab, setActiveTab] = useState<"stable" | "generate" | "breed" | "race" | "docs">("stable");

  // State for Horses list
  const [horses, setHorses] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);

  // Filters for GET API
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("overallRating");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Selected horse for Pedigree/Detail modal
  const [selectedHorse, setSelectedHorse] = useState<Horse | null>(null);

  // Copy feedback state
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Form State: Generate New Horse API (Note: age and overall removed from user inputs; calculated dynamically!)
  const [genName, setGenName] = useState("");
  const [genGender, setGenGender] = useState<"Stallion" | "Mare" | "">("");
  const [genCoat, setGenCoat] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [genResponse, setGenResponse] = useState<GrandTurfSingleHorseAPIResponse | null>(null);

  // Form State: Breed Horse API
  const [sireId, setSireId] = useState("");
  const [damId, setDamId] = useState("");
  const [childName, setChildName] = useState("");
  const [childGender, setChildGender] = useState<"Colt" | "Filly" | "">("");
  const [isBreeding, setIsBreeding] = useState(false);
  const [breedResponse, setBreedResponse] = useState<any | null>(null);

  // State for Race Simulator
  const [selectedRaceHorseIds, setSelectedRaceHorseIds] = useState<string[]>([]);
  const [raceTrack, setRaceTrack] = useState<"Dirt" | "Turf" | "Mud" | "Synthetic">("Turf");
  const [raceDistance, setRaceDistance] = useState<"Sprint (5-7f)" | "Mid-Distance (8-10f)" | "Long (11-14f)">("Mid-Distance (8-10f)");
  const [raceWeather, setRaceWeather] = useState<"Clear" | "Rain" | "Heavy Mud" | "Windy">("Clear");
  const [isSimulating, setIsSimulating] = useState(false);
  const [raceResults, setRaceResults] = useState<any | null>(null);
  const [showReplayJson, setShowReplayJson] = useState(false);

  // Fetch Horses GET API
  const fetchHorses = async (refresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const payload = await getHorses({
        search: searchQuery,
        gender: genderFilter,
        sortBy,
        order: sortOrder,
        refresh
      });

      if (payload.success) {
        setHorses(payload.data || []);
        setMetadata(payload.metadata || null);
      } else {
        setError(payload.error || "Failed to load Grand Turf horse registry.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Network request to `/api/grandturf/horses` failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHorses();
  }, [searchQuery, genderFilter, sortBy, sortOrder]);

  // Handle Generate Horse API POST
  const handleGenerateHorse = async (e: FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGenResponse(null);

    try {
      const data = await generateHorse({
        name: genName,
        gender: genGender,
        coatColor: genCoat
      });
      setGenResponse(data);
      if (data.success && data.data) {
        // Refresh active horse catalog
        fetchHorses(true);
      }
    } catch (err: any) {
      setGenResponse({
        success: false,
        error: "Failed to connect to POST /api/grandturf/horses/generate"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Breed Horse API POST
  const handleBreedHorse = async (e: FormEvent) => {
    e.preventDefault();
    if (!sireId || !damId) return;

    setIsBreeding(true);
    setBreedResponse(null);

    try {
      const data = await breedHorse({
        sireId,
        damId,
        name: childName,
        gender: childGender
      });
      setBreedResponse(data);
      if (data.success && data.data) {
        fetchHorses(true);
      }
    } catch (err: any) {
      setBreedResponse({
        success: false,
        error: "Failed to connect to POST /api/grandturf/horses/breed"
      });
    } finally {
      setIsBreeding(false);
    }
  };

  // Handle Race Simulation API POST
  const handleRunRaceSimulation = async () => {
    if (selectedRaceHorseIds.length < 2) return;
    setIsSimulating(true);
    setRaceResults(null);

    try {
      const data = await simulateRace({
        horseIds: selectedRaceHorseIds,
        trackType: raceTrack,
        distance: raceDistance,
        weather: raceWeather
      });
      setRaceResults(data);
    } catch (err) {
      setRaceResults({ success: false, error: "Failed to simulate race." });
    } finally {
      setIsSimulating(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(id);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const originUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  // Available stallions & mares for breeding select dropdowns
  const availableStallions = horses.filter(h => h.gender === "Stallion" || h.gender === "Colt");
  const availableMares = horses.filter(h => h.gender === "Mare" || h.gender === "Filly");

  const selectedSireObj = horses.find(h => h.id === sireId);
  const selectedDamObj = horses.find(h => h.id === damId);

  // Rating badge helper
  const getRatingGrade = (rating: number) => {
    if (rating >= 90) return { grade: "S", color: "bg-amber-100 text-amber-900 border-amber-300 font-bold" };
    if (rating >= 85) return { grade: "A+", color: "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold" };
    if (rating >= 80) return { grade: "A", color: "bg-blue-100 text-blue-900 border-blue-300 font-bold" };
    if (rating >= 75) return { grade: "B+", color: "bg-indigo-100 text-indigo-900 border-indigo-300 font-bold" };
    return { grade: "B", color: "bg-slate-100 text-slate-800 border-slate-300 font-medium" };
  };

  return (
    <div className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-8 py-8 flex flex-col gap-8">
      {/* Top Banner & Control Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider font-mono">
              Game 3 REST Services
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
              Live API
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight font-display flex items-center gap-2">
            <span>Grand Turf Dashboard</span>
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl">
            Test and manage Grand Turf APIs: generate new base horses, breed foals by passing sire and dam parent IDs, and query active horse statistics.
          </p>
        </div>

        {/* Dashboard Mode Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0 self-start md:self-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab("stable")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "stable" 
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80" 
                : "text-slate-600 hover:text-slate-900"
            }`}
            id="tab_stable_button"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>All Horses API ({horses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("generate")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "generate" 
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80" 
                : "text-slate-600 hover:text-slate-900"
            }`}
            id="tab_generate_button"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Generate Horse API</span>
          </button>

          <button
            onClick={() => setActiveTab("breed")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "breed" 
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80" 
                : "text-slate-600 hover:text-slate-900"
            }`}
            id="tab_breed_button"
          >
            <Dna className="w-3.5 h-3.5 text-indigo-600" />
            <span>Breed Horse API</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("race");
              if (selectedRaceHorseIds.length === 0 && horses.length >= 2) {
                setSelectedRaceHorseIds([horses[0].id, horses[1].id]);
              }
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "race" 
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80" 
                : "text-slate-600 hover:text-slate-900"
            }`}
            id="tab_race_button"
          >
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>Race Simulator API</span>
          </button>

          <button
            onClick={() => setActiveTab("docs")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "docs" 
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80" 
                : "text-slate-600 hover:text-slate-900"
            }`}
            id="tab_docs_button"
          >
            <Terminal className="w-3.5 h-3.5 text-slate-600" />
            <span>API Docs & cURL</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ALL HORSES STABLE VIEW */}
      {activeTab === "stable" && (
        <div className="flex flex-col gap-6">
          {/* Search, Filter & Metrics Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search horse name, ID, coat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none font-medium cursor-pointer"
                >
                  <option value="">All Genders</option>
                  <option value="Stallion">Stallions</option>
                  <option value="Mare">Mares</option>
                  <option value="Colt">Colts</option>
                  <option value="Filly">Fillies</option>
                </select>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none font-medium cursor-pointer"
              >
                <option value="overallRating">Sort by Rating</option>
                <option value="speed">Sort by Speed</option>
                <option value="generation">Sort by Generation</option>
                <option value="name">Sort by Name</option>
                <option value="createdAt">Sort by Date</option>
              </select>

              <button
                onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700 transition cursor-pointer"
              >
                {sortOrder.toUpperCase()}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchHorses(true)}
                disabled={loading}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Re-sync List</span>
              </button>
            </div>
          </div>

          {/* Endpoint cURL Callout */}
          <div className="bg-slate-900 text-slate-200 rounded-xl p-4 font-mono text-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">GET</span>
              <span className="text-slate-300 font-medium whitespace-nowrap">
                /api/grandturf/horses{searchQuery ? `?search=${searchQuery}` : ''}
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(`curl -X GET "${originUrl}/api/grandturf/horses"`, "get_all")}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-sans font-medium transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              {copiedUrl === "get_all" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUrl === "get_all" ? "Copied cURL" : "Copy cURL"}</span>
            </button>
          </div>

          {/* Horses Grid */}
          {loading && (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-amber-600 animate-spin" />
              <p className="text-xs font-medium text-slate-500">Querying Grand Turf Horse Catalog...</p>
            </div>
          )}

          {!loading && horses.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center justify-center gap-2">
              <AlertCircle className="w-8 h-8 text-slate-400" />
              <p className="text-sm font-bold text-slate-800">No Horses Found</p>
              <p className="text-xs text-slate-500">Try adjusting your filter or generate a new horse using the Generate Horse API.</p>
            </div>
          )}

          {!loading && horses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {horses.map((horse) => {
                const gradeInfo = getRatingGrade(horse.stats.overallRating);
                return (
                  <motion.div
                    key={horse.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between group relative overflow-hidden"
                  >
                    <div>
                      {/* Top Row: Gender badge, Generation badge, Rating */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            horse.gender === "Stallion" || horse.gender === "Colt" 
                              ? "bg-blue-50 text-blue-800 border border-blue-200" 
                              : "bg-rose-50 text-rose-800 border border-rose-200"
                          }`}>
                            {horse.gender}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            Gen {horse.generation}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-xs font-extrabold text-slate-900 font-display">{horse.stats.overallRating}</span>
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-mono ${gradeInfo.color}`}>
                            {gradeInfo.grade}
                          </span>
                        </div>
                      </div>

                      {/* Horse Name & ID */}
                      <div className="space-y-1 mb-3">
                        <h3 className="text-lg font-extrabold text-slate-900 font-display group-hover:text-amber-800 transition">
                          {horse.name}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-mono truncate">
                          ID: {horse.id}
                        </p>
                      </div>

                      {/* Generation, Peak & Growth Stage Badge */}
                      <div className="flex items-center justify-between bg-amber-50/60 border border-amber-200/80 rounded-xl px-3 py-2 mb-3 text-xs">
                        <div>
                          <span className="text-[9px] font-bold text-amber-800 uppercase block">Generation & Peak</span>
                          <span className="font-extrabold text-slate-900 font-mono">
                            Gen {horse.generation ?? 1} &bull; Peak {horse.growth?.peakAgeYears ?? 4}yo
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-bold text-amber-800 uppercase block">Growth Stage</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            {horse.growth?.currentStage || "Prime"} ({horse.growth?.growthRate || "Standard"})
                          </span>
                        </div>
                      </div>

                      {/* Special Traits Badges */}
                      {horse.specialTraits && horse.specialTraits.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {horse.specialTraits.map((trait, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                              <span>{trait}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Pedigree & Origin */}
                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 mb-3 text-xs space-y-1.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400 font-semibold uppercase text-[9px]">Coat Color</span>
                          <span className="font-semibold text-slate-800">{horse.coatColor}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400 font-semibold uppercase text-[9px]">Running Style</span>
                          <span className="font-bold text-indigo-900">{horse.runningStyle || "Presser"}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400 font-semibold uppercase text-[9px]">Potential Ceiling</span>
                          <span className="font-mono font-extrabold text-emerald-700">{horse.stats.potential || 90} MAX</span>
                        </div>
                      </div>

                      {/* Stats Overview bars */}
                      <div className="space-y-2 mb-4">
                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                            <span>Speed & Start Burst</span>
                            <span className="font-mono text-slate-900">{horse.stats.speed} / Burst {horse.stats.startBurst || 75}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${horse.stats.speed}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                            <span>Stamina & Finish Kick</span>
                            <span className="font-mono text-slate-900">{horse.stats.stamina} / Kick {horse.stats.finishKick || 75}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${horse.stats.stamina}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                            <span>Cornering & Agility</span>
                            <span className="font-mono text-slate-900">{horse.stats.cornering || 75}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${horse.stats.cornering || 75}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[10px] font-mono text-slate-400">
                        Track: {horse.preferredTrack}
                      </span>
                      <button
                        onClick={() => setSelectedHorse(horse)}
                        className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Pedigree</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GENERATE NEW HORSE API TESTER */}
      {activeTab === "generate" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Input Form */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                <span>API 1: Generate Base Horse</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Call <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">POST /api/grandturf/horses/generate</code> to create a fresh thoroughbred horse with randomized or custom attributes.
              </p>
            </div>

            <form onSubmit={handleGenerateHorse} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Horse Name (Optional - Auto-generated if blank)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Celestial Sovereign"
                  value={genName}
                  onChange={(e) => setGenName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Gender
                  </label>
                  <select
                    value={genGender}
                    onChange={(e) => setGenGender(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none cursor-pointer"
                  >
                    <option value="">Random Gender</option>
                    <option value="Stallion">Stallion</option>
                    <option value="Mare">Mare</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Coat Color
                  </label>
                  <select
                    value={genCoat}
                    onChange={(e) => setGenCoat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none cursor-pointer"
                  >
                    <option value="">Random Color</option>
                    <option value="Bay">Bay</option>
                    <option value="Chestnut">Chestnut</option>
                    <option value="Black">Black</option>
                    <option value="Dappled Gray">Dappled Gray</option>
                    <option value="Palomino">Palomino</option>
                    <option value="Roan">Roan</option>
                    <option value="Silver Dapple">Silver Dapple</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                id="execute_generate_horse_api_button"
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Execute POST /api/grandturf/horses/generate</span>
                  </>
                )}
              </button>
            </form>

            <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl text-xs text-emerald-950 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-emerald-600" />
                <span>Base Generation Specs</span>
              </p>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Base horses generated with this endpoint start as <strong>Generation 1</strong> (Unbred) and have no Sire or Dam parent linkages.
              </p>
            </div>
          </div>

          {/* Right: API Response & Output Preview */}
          <div className="lg:col-span-7 bg-slate-900 rounded-2xl p-6 text-slate-200 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">POST</span>
                  <span className="text-slate-300">/api/grandturf/horses/generate</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Response Payload</span>
              </div>

              {!genResponse && (
                <div className="py-16 text-center text-slate-500 font-mono text-xs space-y-2">
                  <Code className="w-8 h-8 mx-auto text-slate-600" />
                  <p>Click "Execute POST" to test the API and generate a new horse.</p>
                </div>
              )}

              {genResponse && (
                <div className="space-y-4">
                  {genResponse.success && genResponse.data ? (
                    <div className="space-y-4">
                      {/* Generated Horse Quick Summary Banner */}
                      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-emerald-400 text-xs font-bold font-mono">200 OK</span>
                            <span className="text-slate-400 text-[10px] font-mono">
                              Latency: {genResponse.latencyMs || 12}ms
                            </span>
                          </div>
                          <h4 className="text-base font-extrabold text-white font-display">
                            {genResponse.data.name}
                          </h4>
                          <p className="text-xs text-slate-400 font-mono">
                            {genResponse.data.gender} &bull; {genResponse.data.coatColor} &bull; Rating: {genResponse.data.stats.overallRating}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold rounded-lg">
                          Gen 1 Foal
                        </span>
                      </div>

                      {/* Raw JSON Code view */}
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-[320px] overflow-y-auto text-[11px] font-mono text-emerald-400">
                        <pre>{JSON.stringify(genResponse, null, 2)}</pre>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-rose-900/30 border border-rose-800 text-rose-300 text-xs rounded-xl font-mono">
                      Error: {genResponse.error}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* cURL Command for Generate */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="truncate max-w-[320px]">
                curl -X POST "{originUrl}/api/grandturf/horses/generate"
              </span>
              <button
                onClick={() => copyToClipboard(`curl -X POST "${originUrl}/api/grandturf/horses/generate" -H "Content-Type: application/json" -d '{"name":"${genName || "Apex Sovereign"}", "gender":"${genGender || "Stallion"}"}'`, "post_gen")}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] transition cursor-pointer shrink-0"
              >
                {copiedUrl === "post_gen" ? "Copied" : "Copy cURL"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BREED HORSES VIA PARENT IDS API TESTER */}
      {activeTab === "breed" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Input Form */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                <Dna className="w-5 h-5 text-indigo-600" />
                <span>API 2: Breed Foal from 2 Parent Horses</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Call <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">POST /api/grandturf/horses/breed</code> passing <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">sireId</code> and <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">damId</code>.
              </p>
            </div>

            <form onSubmit={handleBreedHorse} className="space-y-4">
              {/* Sire selection */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-1">
                  Sire (Father Horse ID / Selection) *
                </label>
                <select
                  value={sireId}
                  onChange={(e) => setSireId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-blue-50/50 border border-blue-200 text-xs text-slate-900 focus:outline-none font-medium cursor-pointer"
                  required
                >
                  <option value="">-- Select Sire (Stallion) --</option>
                  {availableStallions.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.id}) - Rating: {h.stats.overallRating}
                    </option>
                  ))}
                  {/* Option to type custom ID */}
                  {horses.map(h => !availableStallions.includes(h) && (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.id})
                    </option>
                  ))}
                </select>
                {selectedSireObj && (
                  <p className="text-[10px] text-blue-600 mt-1 font-mono">
                    Selected Sire: {selectedSireObj.name} (Speed: {selectedSireObj.stats.speed}, Stamina: {selectedSireObj.stats.stamina})
                  </p>
                )}
              </div>

              {/* Dam selection */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-rose-700 mb-1">
                  Dam (Mother Horse ID / Selection) *
                </label>
                <select
                  value={damId}
                  onChange={(e) => setDamId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-rose-50/50 border border-rose-200 text-xs text-slate-900 focus:outline-none font-medium cursor-pointer"
                  required
                >
                  <option value="">-- Select Dam (Mare) --</option>
                  {availableMares.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.id}) - Rating: {h.stats.overallRating}
                    </option>
                  ))}
                  {/* Option to type custom ID */}
                  {horses.map(h => !availableMares.includes(h) && (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.id})
                    </option>
                  ))}
                </select>
                {selectedDamObj && (
                  <p className="text-[10px] text-rose-600 mt-1 font-mono">
                    Selected Dam: {selectedDamObj.name} (Speed: {selectedDamObj.stats.speed}, Stamina: {selectedDamObj.stats.stamina})
                  </p>
                )}
              </div>

              {/* Optional Foal Name */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Foal Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Thunder's Dynasty"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              {/* Optional Foal Gender */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Foal Gender
                </label>
                <select
                  value={childGender}
                  onChange={(e) => setChildGender(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none cursor-pointer"
                >
                  <option value="">Random (Colt / Filly)</option>
                  <option value="Colt">Colt (Male Foal)</option>
                  <option value="Filly">Filly (Female Foal)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isBreeding || !sireId || !damId}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                id="execute_breed_horse_api_button"
              >
                {isBreeding ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Dna className="w-4 h-4" />
                    <span>Execute POST /api/grandturf/horses/breed</span>
                  </>
                )}
              </button>
            </form>

            <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-950 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Genetic Inheritance Engine</span>
              </p>
              <p className="text-[11px] text-indigo-800 leading-relaxed">
                Breeding combines Sire and Dam stats with natural genetic mutation variances. The child's generation becomes <code className="font-bold">Max(Sire.Gen, Dam.Gen) + 1</code>.
              </p>
            </div>
          </div>

          {/* Right: Response Output */}
          <div className="lg:col-span-7 bg-slate-900 rounded-2xl p-6 text-slate-200 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-bold">POST</span>
                  <span className="text-slate-300">/api/grandturf/horses/breed</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Response Payload</span>
              </div>

              {!breedResponse && (
                <div className="py-16 text-center text-slate-500 font-mono text-xs space-y-2">
                  <Dna className="w-8 h-8 mx-auto text-slate-600" />
                  <p>Select Sire and Dam IDs and execute POST to breed a child horse.</p>
                </div>
              )}

              {breedResponse && (
                <div className="space-y-4">
                  {breedResponse.success && breedResponse.data ? (
                    <div className="space-y-4">
                      {/* Foal Summary Card */}
                      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 text-xs font-bold font-mono">200 OK</span>
                            <span className="text-slate-400 text-[10px] font-mono">
                              Latency: {breedResponse.latencyMs || 15}ms
                            </span>
                          </div>
                          <span className="px-2.5 py-0.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-bold rounded-lg">
                            Generation {breedResponse.data.generation}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-base font-extrabold text-white font-display">
                            {breedResponse.data.name}
                          </h4>
                          <p className="text-xs text-slate-300 font-mono mt-0.5">
                            {breedResponse.data.gender} &bull; Coat: {breedResponse.data.coatColor} &bull; Rating: {breedResponse.data.stats.overallRating}
                          </p>
                        </div>

                        {/* Sire & Dam Info */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/60">
                          <div>
                            <span className="text-blue-400 font-bold block">Sire (Father)</span>
                            <span className="text-slate-200">{breedResponse.sire?.name || breedResponse.data.sireName}</span>
                          </div>
                          <div>
                            <span className="text-rose-400 font-bold block">Dam (Mother)</span>
                            <span className="text-slate-200">{breedResponse.dam?.name || breedResponse.data.damName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Raw JSON Code view */}
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-[280px] overflow-y-auto text-[11px] font-mono text-indigo-300">
                        <pre>{JSON.stringify(breedResponse, null, 2)}</pre>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-rose-900/30 border border-rose-800 text-rose-300 text-xs rounded-xl font-mono">
                      Error: {breedResponse.error}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* cURL Command for Breed */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="truncate max-w-[320px]">
                curl -X POST "{originUrl}/api/grandturf/horses/breed"
              </span>
              <button
                onClick={() => copyToClipboard(`curl -X POST "${originUrl}/api/grandturf/horses/breed" -H "Content-Type: application/json" -d '{"sireId":"${sireId || "gt_horse_thunder_eclipse"}", "damId":"${damId || "gt_horse_silver_dynasty"}"}'`, "post_breed")}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] transition cursor-pointer shrink-0"
              >
                {copiedUrl === "post_breed" ? "Copied" : "Copy cURL"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RACE SIMULATOR API TESTER */}
      {activeTab === "race" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Race Setup Controls */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-600" />
                <span>API 4: Race Simulator Engine</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Call <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">POST /api/grandturf/race/simulate</code> to run realistic furlong-by-furlong race calculations.
              </p>
            </div>

            <div className="space-y-4">
              {/* Select Horses */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Select 2 to 6 Runner Horses *
                </label>
                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2.5 bg-slate-50">
                  {horses.map((horse) => {
                    const isSelected = selectedRaceHorseIds.includes(horse.id);
                    return (
                      <div
                        key={horse.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedRaceHorseIds(prev => prev.filter(id => id !== horse.id));
                          } else {
                            if (selectedRaceHorseIds.length < 6) {
                              setSelectedRaceHorseIds(prev => [...prev, horse.id]);
                            }
                          }
                        }}
                        className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer border transition ${
                          isSelected 
                            ? "bg-amber-50 border-amber-300 text-amber-950 font-bold" 
                            : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="rounded text-amber-600 cursor-pointer"
                          />
                          <span>{horse.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({horse.gender})</span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-600">
                          {horse.stats.overallRating} OVR &bull; {horse.preferredTrack}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Selected {selectedRaceHorseIds.length} runner(s) (Minimum 2 required).
                </p>
              </div>

              {/* Race Conditions */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Track Surface
                  </label>
                  <select
                    value={raceTrack}
                    onChange={(e) => setRaceTrack(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none cursor-pointer"
                  >
                    <option value="Turf">Turf Track</option>
                    <option value="Dirt">Dirt Main Track</option>
                    <option value="Mud">Sloppy Mud</option>
                    <option value="Synthetic">Synthetic All-Weather</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Race Distance
                  </label>
                  <select
                    value={raceDistance}
                    onChange={(e) => setRaceDistance(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none cursor-pointer"
                  >
                    <option value="Sprint (5-7f)">Sprint (5-7 Furlongs)</option>
                    <option value="Mid-Distance (8-10f)">Mid-Distance (8-10 Furlongs)</option>
                    <option value="Long (11-14f)">Marathon Long (11-14 Furlongs)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Weather Conditions
                </label>
                <select
                  value={raceWeather}
                  onChange={(e) => setRaceWeather(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none cursor-pointer"
                >
                  <option value="Clear">Clear & Fast</option>
                  <option value="Rain">Light Rain</option>
                  <option value="Heavy Mud">Heavy Rain & Mud</option>
                  <option value="Windy">Strong Headwind</option>
                </select>
              </div>

              <button
                onClick={handleRunRaceSimulation}
                disabled={isSimulating || selectedRaceHorseIds.length < 2}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                id="execute_race_simulation_api_button"
              >
                {isSimulating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trophy className="w-4 h-4" />
                    <span>Run Race Simulation API</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Race Results & Furlong Progression */}
          <div className="lg:col-span-7 bg-slate-900 rounded-2xl p-6 text-slate-200 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">POST</span>
                  <span className="text-slate-300">/api/grandturf/race/simulate</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Simulation Engine Output</span>
              </div>

              {!raceResults && (
                <div className="py-20 text-center text-slate-500 font-mono text-xs space-y-2">
                  <Trophy className="w-10 h-10 mx-auto text-slate-700" />
                  <p>Select at least 2 horses and click "Run Race Simulation" to simulate a thoroughbred race.</p>
                </div>
              )}

              {raceResults && (
                <div className="space-y-4">
                  {raceResults.success ? (
                    <div className="space-y-4">
                      {/* View Mode Toggle Bar */}
                      <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setShowReplayJson(false)}
                            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                              !showReplayJson
                                ? "bg-amber-600 text-white shadow-xs"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            <Trophy className="w-3.5 h-3.5" />
                            <span>Leaderboard</span>
                          </button>
                          <button
                            onClick={() => setShowReplayJson(true)}
                            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                              showReplayJson
                                ? "bg-amber-600 text-white shadow-xs"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            <Code2 className="w-3.5 h-3.5" />
                            <span>Replay JSON Data</span>
                          </button>
                        </div>

                        {showReplayJson && (
                          <button
                            onClick={() => copyToClipboard(JSON.stringify(raceResults, null, 2), "replay_json_raw")}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono transition flex items-center gap-1 cursor-pointer mr-1"
                          >
                            <Copy className="w-3 h-3 text-amber-400" />
                            <span>{copiedUrl === "replay_json_raw" ? "Copied!" : "Copy Full Replay JSON"}</span>
                          </button>
                        )}
                      </div>

                      {!showReplayJson ? (() => {
                        const winner = raceResults.winner || (raceResults.finishOrder?.[0] ? {
                          name: raceResults.finishOrder[0].horseName,
                          time: `${Math.floor(raceResults.finishOrder[0].finishTimeSeconds / 60)}:${(raceResults.finishOrder[0].finishTimeSeconds % 60).toFixed(2).padStart(5, '0')}`,
                          timeSeconds: raceResults.finishOrder[0].finishTimeSeconds?.toFixed(2) || '0.00'
                        } : { name: 'Unknown', time: '0:00.00', timeSeconds: '0.00' });

                        const raceDetails = raceResults.raceDetails || {
                          trackType: raceResults.track?.surface || 'Turf',
                          distance: raceResults.track?.distanceMeters ? `${raceResults.track.distanceMeters}m` : '1800m',
                          weather: raceResults.track?.condition || 'Clear'
                        };

                        const resultsList = raceResults.results || (raceResults.finishOrder || []).map((res: any) => {
                          const winnerTime = raceResults.finishOrder?.[0]?.finishTimeSeconds || 0;
                          return {
                            place: res.rank,
                            horse: { id: res.horseId, name: res.horseName, runningStyle: "Presser" },
                            finalTime: `${Math.floor(res.finishTimeSeconds / 60)}:${(res.finishTimeSeconds % 60).toFixed(2).padStart(5, '0')}`,
                            margin: res.rank === 1 ? "Winner" : `+${(res.finishTimeSeconds - winnerTime).toFixed(2)}s`,
                            tacticalNotes: [`Prizemoney: $${(res.prizeWon || 0).toLocaleString()}`]
                          };
                        });

                        return (
                          <>
                            {/* Winner Banner */}
                            <div className="bg-gradient-to-r from-amber-900/40 via-amber-800/30 to-slate-800 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1">
                                  <Trophy className="w-3.5 h-3.5 text-amber-400" /> Winner Official Time: {winner.time} ({winner.timeSeconds}s)
                                </span>
                                <h4 className="text-xl font-black text-white font-display mt-0.5">
                                  {winner.name}
                                </h4>
                                <p className="text-xs text-slate-300">
                                  Track: {raceDetails.trackType} &bull; {raceDetails.distance} &bull; Weather: {raceDetails.weather}
                                </p>
                              </div>
                            </div>

                            {/* Podium Leaderboard Table */}
                            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                              <h5 className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider">
                                Official Order of Finish & Tactical Notes
                              </h5>
                              <div className="space-y-2">
                                {resultsList.map((res: any) => (
                                  <div key={res.horse.id} className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 text-xs flex flex-col md:flex-row md:items-center justify-between gap-2">
                                    <div className="flex items-center gap-3">
                                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono text-xs ${
                                        res.place === 1 ? 'bg-amber-400 text-slate-950' : res.place === 2 ? 'bg-slate-300 text-slate-950' : 'bg-amber-800/60 text-amber-200'
                                      }`}>
                                        {res.place}
                                      </span>
                                      <div>
                                        <span className="font-extrabold text-slate-100">{res.horse.name}</span>
                                        <span className="text-[10px] text-slate-400 ml-2 font-mono">({res.horse.runningStyle || "Presser"})</span>
                                      </div>
                                    </div>

                                    <div className="flex flex-col md:items-end text-[11px] font-mono">
                                      <span className="text-emerald-400 font-bold">{res.finalTime} &bull; {res.margin}</span>
                                      {res.tacticalNotes && res.tacticalNotes.length > 0 && (
                                        <span className="text-[10px] text-amber-300/80">
                                          {res.tacticalNotes.join(" | ")}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        );
                      })() : (
                        /* JSON Replay Data View */
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                            <span>Replay JSON Schema Payload</span>
                            <span className="text-emerald-400">{raceResults.replayData?.furlongTicks?.length || 0} Furlong Ticks &bull; {Object.keys(raceResults.replayData?.horseReplays || {}).length} Horse Streams</span>
                          </div>
                          <pre className="text-[11px] font-mono bg-slate-900/90 text-amber-300/90 p-3 rounded-lg overflow-x-auto max-h-96 border border-slate-800">
                            {JSON.stringify(raceResults, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-rose-900/30 border border-rose-800 text-rose-300 text-xs rounded-xl font-mono">
                      Error: {raceResults.error}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* cURL Command for Race Simulate */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="truncate max-w-[320px]">
                curl -X POST "{originUrl}/api/grandturf/race/simulate"
              </span>
              <button
                onClick={() => copyToClipboard(`curl -X POST "${originUrl}/api/grandturf/race/simulate" -H "Content-Type: application/json" -d '{"horseIds":["gt_horse_thunder_eclipse","gt_horse_silver_dynasty"]}'`, "post_race")}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] transition cursor-pointer shrink-0"
              >
                {copiedUrl === "post_race" ? "Copied" : "Copy cURL"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: API DOCS & CURL COMMANDS */}
      {activeTab === "docs" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 font-display flex items-center gap-2">
              <Terminal className="w-5 h-5 text-slate-800" />
              <span>Grand Turf REST API Documentation</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Comprehensive reference for integrated Grand Turf endpoints available on this backend server.
            </p>
          </div>

          <div className="space-y-6">
            {/* Endpoint 1 Doc */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold">GET</span>
                  <span className="font-bold text-slate-900">/api/grandturf/horses</span>
                </div>
                <span className="text-xs font-semibold text-slate-500">Get All Horses</span>
              </div>
              <div className="p-4 space-y-3 text-xs">
                <p className="text-slate-600">Retrieves active horses in the catalog with optional query filtering and sorting.</p>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Query Parameters:</h4>
                  <ul className="list-disc list-inside text-slate-600 space-y-1 font-mono text-[11px]">
                    <li><code>search</code> - Search substring in name, coat, or parent names</li>
                    <li><code>gender</code> - Filter by "Stallion", "Mare", "Colt", or "Filly"</li>
                    <li><code>sortBy</code> - "overallRating" | "speed" | "generation" | "name" | "createdAt"</li>
                    <li><code>order</code> - "desc" | "asc"</li>
                  </ul>
                </div>
                <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[11px] flex justify-between items-center">
                  <code>curl -X GET "{originUrl}/api/grandturf/horses?sortBy=overallRating&order=desc"</code>
                  <button
                    onClick={() => copyToClipboard(`curl -X GET "${originUrl}/api/grandturf/horses?sortBy=overallRating&order=desc"`, "doc_get")}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] cursor-pointer shrink-0 ml-2"
                  >
                    {copiedUrl === "doc_get" ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            {/* Endpoint 2 Doc */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 font-bold">POST</span>
                  <span className="font-bold text-slate-900">/api/grandturf/horses/generate</span>
                </div>
                <span className="text-xs font-semibold text-slate-500">Generate Base Horse</span>
              </div>
              <div className="p-4 space-y-3 text-xs">
                <p className="text-slate-600">Generates a new Generation 1 unbred base horse with thoroughbred statistics.</p>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Request Body (JSON):</h4>
                  <pre className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] font-mono text-slate-800">{`{
  "name": "Optional Custom Name",
  "gender": "Stallion" | "Mare",
  "coatColor": "Bay" | "Chestnut" | "Black"
}`}</pre>
                </div>
                <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[11px] flex justify-between items-center">
                  <code>curl -X POST "{originUrl}/api/grandturf/horses/generate" -H "Content-Type: application/json" -d '&#123;"name":"Thunder Knight"&#125;'</code>
                  <button
                    onClick={() => copyToClipboard(`curl -X POST "${originUrl}/api/grandturf/horses/generate" -H "Content-Type: application/json" -d '{"name":"Thunder Knight"}'`, "doc_gen")}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] cursor-pointer shrink-0 ml-2"
                  >
                    {copiedUrl === "doc_gen" ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            {/* Endpoint 3 Doc */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="px-2.5 py-1 rounded bg-indigo-100 text-indigo-800 font-bold">POST</span>
                  <span className="font-bold text-slate-900">/api/grandturf/horses/breed</span>
                </div>
                <span className="text-xs font-semibold text-slate-500">Breed Horse via Parent IDs</span>
              </div>
              <div className="p-4 space-y-3 text-xs">
                <p className="text-slate-600">Generates a new child horse by combining 2 parent horses identified by sireId and damId.</p>
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Request Body (JSON):</h4>
                  <pre className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] font-mono text-slate-800">{`{
  "sireId": "gt_horse_thunder_eclipse",  // Required Sire Horse ID
  "damId": "gt_horse_silver_dynasty",     // Required Dam Horse ID
  "name": "Optional Foal Name",
  "gender": "Colt" | "Filly"
}`}</pre>
                </div>
                <div className="bg-slate-900 text-slate-200 p-3 rounded-lg font-mono text-[11px] flex justify-between items-center">
                  <code>curl -X POST "{originUrl}/api/grandturf/horses/breed" -H "Content-Type: application/json" -d '&#123;"sireId":"gt_horse_thunder_eclipse", "damId":"gt_horse_silver_dynasty"&#125;'</code>
                  <button
                    onClick={() => copyToClipboard(`curl -X POST "${originUrl}/api/grandturf/horses/breed" -H "Content-Type: application/json" -d '{"sireId":"gt_horse_thunder_eclipse", "damId":"gt_horse_silver_dynasty"}'`, "doc_breed")}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] cursor-pointer shrink-0 ml-2"
                  >
                    {copiedUrl === "doc_breed" ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PEDIGREE / HORSE DETAIL MODAL */}
      <AnimatePresence>
        {selectedHorse && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto relative"
            >
              <button
                onClick={() => setSelectedHorse(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 font-bold p-1 cursor-pointer text-sm"
              >
                ✕
              </button>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Gen {selectedHorse.generation}
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                    {selectedHorse.gender}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 font-display">
                  {selectedHorse.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  ID: {selectedHorse.id}
                </p>
              </div>

              {/* Stats & Grade */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[9px] block">Overall Rating</span>
                  <span className="text-xl font-extrabold text-slate-900 font-display">
                    {selectedHorse.stats.overallRating}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[9px] block">Coat Color & Gen</span>
                  <span className="text-sm font-bold text-slate-800">
                    {selectedHorse.coatColor} (Gen {selectedHorse.generation ?? 1})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[9px] block">Growth Stage</span>
                  <span className="font-bold text-amber-800">{selectedHorse.growth?.currentStage || "Prime"} ({selectedHorse.growth?.growthRate || "Standard"})</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[9px] block">Potential Ceiling</span>
                  <span className="font-extrabold text-emerald-700 font-mono">{selectedHorse.stats.potential || 90} MAX</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[9px] block">Running Style</span>
                  <span className="font-semibold text-indigo-900">{selectedHorse.runningStyle || "Presser"}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[9px] block">Preferred Track / Dist</span>
                  <span className="font-semibold text-slate-800">{selectedHorse.preferredTrack} &bull; {selectedHorse.preferredDistance}</span>
                </div>
              </div>

              {/* Special Traits */}
              {selectedHorse.specialTraits && selectedHorse.specialTraits.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                    Special Traits
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedHorse.specialTraits.map((trait, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{trait}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Stat breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                  Core & Tactical Attribute Breakdown
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>Speed: <strong className="text-slate-900">{selectedHorse.stats.speed}</strong></div>
                  <div>Stamina: <strong className="text-slate-900">{selectedHorse.stats.stamina}</strong></div>
                  <div>Acceleration: <strong className="text-slate-900">{selectedHorse.stats.acceleration}</strong></div>
                  <div>Temperament: <strong className="text-slate-900">{selectedHorse.stats.temperament}</strong></div>
                  <div>Grit: <strong className="text-slate-900">{selectedHorse.stats.grit}</strong></div>
                  <div>Start Burst: <strong className="text-amber-800">{selectedHorse.stats.startBurst || 75}</strong></div>
                  <div>Finish Kick: <strong className="text-emerald-800">{selectedHorse.stats.finishKick || 75}</strong></div>
                  <div>Cornering: <strong className="text-blue-800">{selectedHorse.stats.cornering || 75}</strong></div>
                  <div>Focus: <strong className="text-indigo-800">{selectedHorse.stats.focus || 75}</strong></div>
                  <div>Surface Adapt: <strong className="text-slate-900">{selectedHorse.stats.surfaceAdaptability || 75}</strong></div>
                  <div>Weather Resist: <strong className="text-slate-900">{selectedHorse.stats.weatherResistance || 75}</strong></div>
                </div>
              </div>

              {/* Pedigree Parentage Tree */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                  Pedigree Tree
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl">
                    <span className="text-[10px] font-bold text-blue-700 uppercase block mb-1">Sire (Father)</span>
                    <p className="text-xs font-bold text-slate-900">
                      {selectedHorse.sireName || "Unbred Base"}
                    </p>
                    {selectedHorse.sireId && (
                      <p className="text-[9px] text-slate-500 font-mono truncate">{selectedHorse.sireId}</p>
                    )}
                  </div>

                  <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl">
                    <span className="text-[10px] font-bold text-rose-700 uppercase block mb-1">Dam (Mother)</span>
                    <p className="text-xs font-bold text-slate-900">
                      {selectedHorse.damName || "Unbred Base"}
                    </p>
                    {selectedHorse.damId && (
                      <p className="text-[9px] text-slate-500 font-mono truncate">{selectedHorse.damId}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedHorse(null)}
                  className="px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Close Inspection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
