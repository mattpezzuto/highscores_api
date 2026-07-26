import { useState, useEffect, FormEvent } from "react";
import { 
  BookOpen, 
  ChevronLeft, 
  Search, 
  PlusCircle, 
  Copy, 
  Check, 
  Activity, 
  RefreshCw, 
  FileJson, 
  User, 
  Shield, 
  Zap, 
  Swords, 
  Compass, 
  MessageSquare,
  Sparkles,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Jedi, AcademyAPIResponse } from "../types";

interface AcademyPortalProps {
  onBack: () => void;
}

export function calculateAge(dobString: string): number {
  if (!dobString) return 14;
  const dob = new Date(dobString);
  const now = new Date();
  
  // Normalize to midnight to accurately count calendar days difference
  const dobMidnight = new Date(dob.getFullYear(), dob.getMonth(), dob.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = nowMidnight.getTime() - dobMidnight.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 2) {
    return 14;
  }
  return 14 + Math.floor(Math.log2(diffDays));
}

export function getDobFromAge(age: number): string {
  const diffDays = Math.pow(2, Math.max(0, age - 14));
  const dobDate = new Date();
  dobDate.setDate(dobDate.getDate() - diffDays);
  return dobDate.toISOString().split("T")[0];
}

const TEMPLATE_JEDI_LIST: Partial<Jedi>[] = [
  {
    accountId: "oring",
    name: "Kalren Voss",
    title: "Jedi Knight",
    species: "Human",
    dob: getDobFromAge(28),
    gender: "Male",
    height: "1.85m",
    affiliation: "Jedi Order",
    lastDayTrained: new Date().toISOString().split("T")[0],
    lightsaber: {
      color: "Blue",
      crystal: "Kyber Crystal",
      hiltStyle: "Standard Jedi",
      hiltMaterial: "Polished Durasteel with Electrum accents",
      length: "Single Blade",
      form: "Form V - Shien/Djem So",
      status: "Fully Operational"
    },
    appearance: {
      hair: "Short dark brown, neatly trimmed",
      eyes: "Hazel",
      build: "Athletic and muscular",
      clothing: "Standard brown Jedi robes with tan tunic, utility belt, and leather boots",
      distinguishingFeatures: "Small scar across left cheek, calm and focused expression"
    },
    stats: {
      strength: 75,
      agility: 82,
      defense: 70,
      forcePower: 88,
      lightsaberSkill: 92,
      wisdom: 85
    },
    combatRecord: {
      wins: 47,
      losses: 12,
      draws: 5,
      totalDuels: 64
    },
    ranking: {
      title: "Jedi Knight",
      achievementPoints: 12450,
      galacticRank: 87
    },
    forceAbilities: [
      "Force Push", "Force Pull", "Force Leap", "Saber Throw", "Force Sense", "Mind Trick", "Heal"
    ],
    combatStyle: "Balanced defensive counter-attacker. Excels at redirecting blaster bolts and using strong, powerful strikes when closing distance.",
    background: "A former farm boy from Corellia discovered by the Jedi at age 9. Kalren is known for his calm demeanor and strong connection to the Living Force. He survived the Battle of Geonosis and now patrols the Outer Rim, protecting remote systems.",
    personality: {
      traits: ["Honorable", "Patient", "Protective", "Meditative"],
      quote: "The Force will guide my blade, but it is my will that strikes true."
    }
  },
  {
    accountId: "skywalker_fan",
    name: "Ayla Korr",
    title: "Jedi Guardian",
    species: "Twi'lek",
    dob: getDobFromAge(24),
    gender: "Female",
    height: "1.78m",
    affiliation: "Jedi Order",
    lastDayTrained: new Date().toISOString().split("T")[0],
    lightsaber: {
      color: "Green",
      crystal: "Ilum crystal",
      hiltStyle: "Curved",
      hiltMaterial: "Chromium shroud with rubberized grip",
      length: "Single Blade",
      form: "Form II - Makashi",
      status: "Fully Operational"
    },
    appearance: {
      hair: "None (Lekku decoration)",
      eyes: "Emerald Green",
      build: "Slender and agile",
      clothing: "Form-fitting leather combat tunic, dark tabards, and custom armguards",
      distinguishingFeatures: "Geometric forehead tattoos, bright orange skin tone"
    },
    stats: {
      strength: 65,
      agility: 95,
      defense: 75,
      forcePower: 82,
      lightsaberSkill: 94,
      wisdom: 78
    },
    combatRecord: {
      wins: 52,
      losses: 8,
      draws: 3,
      totalDuels: 63
    },
    ranking: {
      title: "Jedi Guardian",
      achievementPoints: 14200,
      galacticRank: 62
    },
    forceAbilities: [
      "Force Speed", "Force Jump", "Saber Throw", "Force Sense", "Absorb Energy", "Deflection"
    ],
    combatStyle: "Precision duelist specializing in single-target lightsaber combat. Fluid fencing steps and rapid parry-riposte rhythms.",
    background: "Discovered on Ryloth during an investigation into local syndicate activities. Ayla proved an exceptional physical prodigy, mastering complex Makashi footwork early in her training.",
    personality: {
      traits: ["Disciplined", "Confident", "Swift", "Bold"],
      quote: "My focus is unwavering, my speed absolute."
    }
  },
  {
    accountId: "windu_apprentice",
    name: "Vaelen Shan",
    title: "Jedi Consular",
    species: "Mirialan",
    dob: getDobFromAge(32),
    gender: "Male",
    height: "1.82m",
    affiliation: "Jedi Order",
    lastDayTrained: new Date().toISOString().split("T")[0],
    lightsaber: {
      color: "Purple",
      crystal: "Adegan crystal",
      hiltStyle: "Crossguard",
      hiltMaterial: "Bronzium casing, heavy emitter ring",
      length: "Single Blade / Heavy",
      form: "Form VI - Niman",
      status: "Fully Operational"
    },
    appearance: {
      hair: "Shaved sides, topknot black hair",
      eyes: "Golden Brown",
      build: "Aesthetic and meditative",
      clothing: "Light gray tunic, traditional Mirialan sash, loose gray robes",
      distinguishingFeatures: "Diamond-shaped facial tattoos denoting discipline and mental prowess"
    },
    stats: {
      strength: 70,
      agility: 75,
      defense: 80,
      forcePower: 96,
      lightsaberSkill: 80,
      wisdom: 95
    },
    combatRecord: {
      wins: 30,
      losses: 6,
      draws: 18,
      totalDuels: 54
    },
    ranking: {
      title: "Jedi Consular",
      achievementPoints: 16800,
      galacticRank: 41
    },
    forceAbilities: [
      "Force Wave", "Force Barrier", "Force Valour", "Telekinesis", "Force Heal", "Psychometry", "Stasis"
    ],
    combatStyle: "Combines tactical Force telekinesis seamlessly with defensive blade maneuvers. Prefers diplomacy but will end conflicts decisively with kinetic projection.",
    background: "Born into a monastic tribe on Mirial, Vaelen's incredible telekinetic sensitivity was noted before he could walk. He is a primary archivist and mediator for the Order.",
    personality: {
      traits: ["Serene", "Wise", "Empathetic", "Philosophical"],
      quote: "Knowledge is the greatest shield; the Force is the ultimate truth."
    }
  }
];

export default function AcademyPortal({ onBack }: AcademyPortalProps) {
  // Config state
  const [repo, setRepo] = useState("mattpezzuto/highscores");
  const [branch, setBranch] = useState("main");
  
  // API filters
  const [search, setSearch] = useState("");
  const [accountIdFilter, setAccountIdFilter] = useState("");
  
  // Active UI States
  const [jedis, setJedis] = useState<Jedi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<string | null>(null);
  const [latency, setLatency] = useState<number>(0);
  const [isCached, setIsCached] = useState(false);
  const [isTokenConfigured, setIsTokenConfigured] = useState(false);
  
  // Detailed Modal/Pane view
  const [selectedJedi, setSelectedJedi] = useState<Jedi | null>(null);
  
  // Active posting state
  const [showForm, setShowForm] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postFeedback, setPostFeedback] = useState<{ success: boolean; message: string; simulation?: boolean } | null>(null);
  
  // Post Jedi Payload state (Defaults to Kalren Voss)
  const [postAccountId, setPostAccountId] = useState("oring");
  const [postName, setPostName] = useState("Kalren Voss");
  const [postTitle, setPostTitle] = useState("Jedi Knight");
  const [postSpecies, setPostSpecies] = useState("Human");
  const [postDob, setPostDob] = useState<string>(getDobFromAge(28));
  const [postGender, setPostGender] = useState("Male");
  const [postHeight, setPostHeight] = useState("1.85m");
  const [postAffiliation, setPostAffiliation] = useState("Jedi Order");
  
  // Lightsaber Form state
  const [postSaberColor, setPostSaberColor] = useState("Blue");
  const [postSaberCrystal, setPostSaberCrystal] = useState("Kyber Crystal");
  const [postSaberHiltStyle, setPostSaberHiltStyle] = useState("Standard Jedi");
  const [postSaberHiltMat, setPostSaberHiltMat] = useState("Polished Durasteel with Electrum accents");
  const [postSaberLength, setPostSaberLength] = useState("Single Blade");
  const [postSaberForm, setPostSaberForm] = useState("Form V - Shien/Djem So");
  const [postSaberStatus, setPostSaberStatus] = useState("Fully Operational");
  
  // Stats state
  const [statStrength, setStatStrength] = useState<number>(75);
  const [statAgility, setStatAgility] = useState<number>(82);
  const [statDefense, setStatDefense] = useState<number>(70);
  const [statForcePower, setStatForcePower] = useState<number>(88);
  const [statSaberSkill, setStatSaberSkill] = useState<number>(92);
  const [statWisdom, setStatWisdom] = useState<number>(85);
  
  // Combat stats
  const [recordWins, setRecordWins] = useState<number>(47);
  const [recordLosses, setRecordLosses] = useState<number>(12);
  const [recordDraws, setRecordDraws] = useState<number>(5);
  const [recordTotalDuels, setRecordTotalDuels] = useState<number>(64);
  const [postCombatStyle, setPostCombatStyle] = useState("Balanced defensive counter-attacker.");
  
  // Ranking
  const [rankTitle, setRankTitle] = useState("Jedi Knight");
  const [rankPoints, setRankPoints] = useState<number>(12450);
  const [rankGalactic, setRankGalactic] = useState<number>(87);
  
  // Text states
  const [postAbilities, setPostAbilities] = useState("Force Push, Force Pull, Force Leap, Saber Throw");
  const [postBackground, setPostBackground] = useState("A former farm boy from Corellia discovered by the Jedi.");
  const [postTraits, setPostTraits] = useState("Honorable, Patient, Protective, Meditative");
  const [postQuote, setPostQuote] = useState("The Force will guide my blade, but it is my will that strikes true.");

  // Dev tab state
  const [activeTab, setActiveTab] = useState<"JEDIS" | "PLAYGROUND">("JEDIS");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  // Load jedis on mount
  useEffect(() => {
    fetchJedis();
  }, [repo, branch, search, accountIdFilter]);

  const fetchJedis = async (bypassCache = false) => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      q.append("repo", repo);
      q.append("branch", branch);
      if (search) q.append("search", search);
      if (accountIdFilter) q.append("accountId", accountIdFilter);
      if (bypassCache) q.append("refresh", "true");

      const response = await fetch(`/api/academy?${q.toString()}`);
      const payload: AcademyAPIResponse = await response.json();
      
      if (payload.success) {
        setJedis(payload.data || []);
        setLastFetched(payload.metadata.lastFetchedAt);
        setLatency(payload.metadata.latencyMs);
        setIsCached(payload.metadata.cached);
        setIsTokenConfigured(payload.metadata.githubTokenConfigured);
      } else {
        setError(payload.error || "Failed to load Academy Database.");
      }
    } catch (err: any) {
      setError("Failed to fetch Academy Jedis. Verify that the server is working and GITHUB_TOKEN is properly configured.");
    } finally {
      setLoading(false);
    }
  };

  const selectPreset = (jedi: Partial<Jedi>) => {
    if (!jedi) return;
    setPostAccountId(jedi.accountId || "jedi_user");
    setPostName(jedi.name || "Unnamed Jedi");
    setPostTitle(jedi.title || "Padawan");
    setPostSpecies(jedi.species || "Human");
    setPostDob(jedi.dob || getDobFromAge(20));
    setPostGender(jedi.gender || "Non-binary");
    setPostHeight(jedi.height || "1.80m");
    setPostAffiliation(jedi.affiliation || "Jedi Order");
    
    if (jedi.lightsaber) {
      setPostSaberColor(jedi.lightsaber.color || "Blue");
      setPostSaberCrystal(jedi.lightsaber.crystal || "Kyber Crystal");
      setPostSaberHiltStyle(jedi.lightsaber.hiltStyle || "Standard");
      setPostSaberHiltMat(jedi.lightsaber.hiltMaterial || "Alloy");
      setPostSaberLength(jedi.lightsaber.length || "Single Blade");
      setPostSaberForm(jedi.lightsaber.form || "Form I");
      setPostSaberStatus(jedi.lightsaber.status || "Functional");
    }
    
    if (jedi.stats) {
      setStatStrength(jedi.stats.strength || 50);
      setStatAgility(jedi.stats.agility || 50);
      setStatDefense(jedi.stats.defense || 50);
      setStatForcePower(jedi.stats.forcePower || 50);
      setStatSaberSkill(jedi.stats.lightsaberSkill || 50);
      setStatWisdom(jedi.stats.wisdom || 50);
    }

    if (jedi.combatRecord) {
      setRecordWins(jedi.combatRecord.wins || 0);
      setRecordLosses(jedi.combatRecord.losses || 0);
      setRecordDraws(jedi.combatRecord.draws || 0);
      setRecordTotalDuels(jedi.combatRecord.totalDuels || 0);
    }

    setPostCombatStyle(jedi.combatStyle || "");
    setPostBackground(jedi.background || "");

    if (jedi.ranking) {
      setRankTitle(jedi.ranking.title || "");
      setRankPoints(jedi.ranking.achievementPoints || 0);
      setRankGalactic(jedi.ranking.galacticRank || 0);
    }

    if (jedi.forceAbilities) {
      setPostAbilities(jedi.forceAbilities.join(", "));
    }

    if (jedi.personality) {
      setPostTraits(jedi.personality.traits.join(", "));
      setPostQuote(jedi.personality.quote || "");
    }

    // Set post feedback clean
    setPostFeedback({ success: true, message: `Loaded '${jedi.name}' template! Modify fields or click 'Commit record' below.` });
  };

  const handlePostJedi = async (e: FormEvent) => {
    e.preventDefault();
    setPosting(true);
    setPostFeedback(null);

    const parsedAbilities = postAbilities.split(",").map(x => x.trim()).filter(Boolean);
    const parsedTraits = postTraits.split(",").map(x => x.trim()).filter(Boolean);

    const jediData: Partial<Jedi> = {
      accountId: postAccountId.trim(),
      name: postName.trim(),
      title: postTitle.trim(),
      species: postSpecies.trim(),
      dob: postDob,
      gender: postGender.trim(),
      height: postHeight.trim(),
      affiliation: postAffiliation.trim(),
      lastDayTrained: new Date().toISOString().split("T")[0],
      lightsaber: {
        color: postSaberColor,
        crystal: postSaberCrystal,
        hiltStyle: postSaberHiltStyle,
        hiltMaterial: postSaberHiltMat,
        length: postSaberLength,
        form: postSaberForm,
        status: postSaberStatus
      },
      appearance: {
        hair: "Trimmed",
        eyes: "Clear",
        build: "Fit",
        clothing: "Traditional Jedi Robes",
        distinguishingFeatures: "None"
      },
      stats: {
        strength: Number(statStrength) || 50,
        agility: Number(statAgility) || 50,
        defense: Number(statDefense) || 50,
        forcePower: Number(statForcePower) || 50,
        lightsaberSkill: Number(statSaberSkill) || 50,
        wisdom: Number(statWisdom) || 50
      },
      combatRecord: {
        wins: Number(recordWins) || 0,
        losses: Number(recordLosses) || 0,
        draws: Number(recordDraws) || 0,
        totalDuels: Number(recordTotalDuels) || 0
      },
      ranking: {
        title: rankTitle,
        achievementPoints: Number(rankPoints) || 0,
        galacticRank: Number(rankGalactic) || 100
      },
      forceAbilities: parsedAbilities,
      combatStyle: postCombatStyle.trim(),
      background: postBackground.trim(),
      personality: {
        traits: parsedTraits,
        quote: postQuote.trim()
      }
    };

    try {
      const response = await fetch("/api/academy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          repo,
          branch,
          jedi: jediData
        })
      });

      const payload = await response.json();
      if (payload.success) {
        setPostFeedback({
          success: true,
          message: payload.message || "Jedi updated successfully!",
          simulation: payload.simulation
        });
        
        // Refresh Jedi records
        fetchJedis(true);
      } else {
        setPostFeedback({
          success: false,
          message: payload.error || "Failed to commit Jedi record."
        });
      }
    } catch (err: any) {
      setPostFeedback({
        success: false,
        message: "Network request failed. Ensure backend has Express active."
      });
    } finally {
      setPosting(false);
    }
  };

  const getSaberGlowClass = (color: string) => {
    switch (color.toLowerCase()) {
      case "blue": return "bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]";
      case "green": return "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]";
      case "purple": return "bg-purple-500 shadow-[0_0_12px_rgba(139,92,246,0.8)]";
      case "yellow": return "bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.8)]";
      case "red": return "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]";
      default: return "bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.6)]";
    }
  };

  const getSaberTextCol = (color: string) => {
    switch (color.toLowerCase()) {
      case "blue": return "text-blue-600";
      case "green": return "text-emerald-600";
      case "purple": return "text-purple-600";
      case "yellow": return "text-amber-600";
      case "red": return "text-red-500";
      default: return "text-slate-500";
    }
  };

  const getAbsoluteGetUrl = () => {
    const params = new URLSearchParams();
    if (repo !== "mattpezzuto/highscores") params.append("repo", repo);
    if (branch !== "main") params.append("branch", branch);
    if (search) params.append("search", search);
    if (accountIdFilter) params.append("accountId", accountIdFilter);
    return `${window.location.origin}/api/academy${params.toString() ? '?' + params.toString() : ''}`;
  };

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

  const sampleMockPayloadString = JSON.stringify({
    repo,
    branch,
    jedi: TEMPLATE_JEDI_LIST[0]
  }, null, 2);

  const curlGetCommand = `curl -X GET "${getAbsoluteGetUrl()}"`;
  const curlPostCommand = `curl -X POST "${window.location.origin}/api/academy" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ repo, branch, jedi: { accountId: "oring", name: "Kalren Voss", title: "Jedi Knight" } })}'`;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
      
      {/* Pristine Sub Header with Repository Settings */}
      <div className="bg-white border-b border-slate-200 py-3 px-6 sm:px-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between shrink-0 relative z-10 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <BookOpen className="w-4 h-4 text-amber-500" />
          <span className="font-bold text-slate-400 uppercase tracking-wider font-mono">DIR:</span>
          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-mono font-bold">
            /academy
          </span>
          <span className="text-slate-300">|</span>
          <span className="font-bold text-slate-400 uppercase tracking-wider font-mono">FILES:</span>
          <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-mono font-bold">
            {"{id}.json"}
          </span>
        </div>

        {/* Global Git target parameters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Repo:</span>
            <input 
              type="text" 
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 font-mono focus:outline-none focus:border-amber-500 w-44 shadow-inner"
              placeholder="github_user/repository"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Branch:</span>
            <input 
              type="text" 
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 font-mono focus:outline-none focus:border-amber-500 w-24 shadow-inner"
              placeholder="main"
            />
          </div>

          <button 
            onClick={() => fetchJedis(true)}
            className="flex items-center justify-center p-1.5 rounded-md hover:bg-slate-100 border border-slate-200 text-slate-600 cursor-pointer transition shadow-xs"
            title="Bypass cached GET and force recheck git repository"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main split-screen workbench */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Side: Directory Search & Jedi List (2/3 width) */}
        <div className="flex-1 flex flex-col border-r border-slate-200 overflow-y-auto">
          
          <div className="p-6 space-y-6">
            
            {/* API Metrics Dashboard bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Total Jedis</div>
                  <div className="text-xl font-black text-slate-900 font-display">{jedis.length}</div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">API Status</div>
                  <div className="text-[11px] font-bold font-mono text-emerald-600 uppercase flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                    READY
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 shrink-0">
                  <RefreshCw className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Latency</div>
                  <div className="text-base font-bold font-mono text-slate-700">{latency} ms</div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
                  <Shield className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Git Commit</div>
                  <div className={`text-[10px] font-bold font-mono uppercase px-1.5 py-0.5 rounded inline-block mt-1 ${isTokenConfigured ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                    {isTokenConfigured ? "Authenticated" : "Sandbox"}
                  </div>
                </div>
              </div>
            </div>

            {/* Filter controls */}
            <div className="bg-white border border-slate-250 rounded-xl p-4 flex flex-col md:flex-row gap-4 shadow-xs">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 font-medium placeholder-slate-400 text-slate-800"
                  placeholder="Fuzzy search by name, species, rank, saber custom colors..."
                />
              </div>

              <div className="w-full md:w-64">
                <input 
                  type="text" 
                  value={accountIdFilter}
                  onChange={(e) => setAccountIdFilter(e.target.value)}
                  className="w-full px-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 font-mono placeholder-slate-400"
                  placeholder="Filter accountId (e.g. oring)"
                />
              </div>

              <button 
                onClick={() => {
                  setSearch("");
                  setAccountIdFilter("");
                }}
                className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
              >
                Clear Filters
              </button>
            </div>

            {/* Error notifications */}
            {error && (
              <div className="bg-rose-50 border border-rose-250 text-rose-800 rounded-xl p-4 text-xs font-medium space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full inline-block animate-ping"></span>
                  API Error Code context:
                </div>
                <p className="text-rose-650 opacity-90 leading-relaxed font-mono text-[11px]">{error}</p>
                <div className="mt-2 text-[10px] text-rose-550 border-t border-rose-200/50 pt-2 leading-relaxed font-sans">
                  PROtip: If your repository is brand-new, this directory path won't exist yet. Click <strong className="text-rose-850">"Submit New Jedi"</strong> in the playground panel to commit your very first file!
                </div>
              </div>
            )}

            {/* Jedi Roster Index */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 tracking-wider font-mono uppercase">
                  ACTIVE JEDI ROSTER ({jedis.length})
                </h3>
                <span className="text-[10px] text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-mono">
                  GET {repo}/contents/academy/
                </span>
              </div>

              {loading ? (
                <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-xs flex flex-col items-center justify-center gap-4">
                  <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
                  <p className="text-xs text-slate-400 font-medium font-mono">Syncing Academy Archives from GitHub repository...</p>
                </div>
              ) : jedis.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <h4 className="font-bold text-slate-800">No Academy JSON files discovered</h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      Verify your repository name. If this directory is empty or does not exist, use the playground column on the right side to publish your initial Jedi file (it will create the <code>/academy/</code> folder on GitHub automatically!).
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jedis.map((jedi) => (
                    <motion.div
                      key={jedi.id}
                      whileHover={{ y: -3 }}
                      onClick={() => setSelectedJedi(jedi)}
                      className={`bg-white border rounded-xl p-5 cursor-pointer shadow-xs hover:shadow-sm transition duration-150 relative overflow-hidden flex flex-col justify-between group h-44 ${selectedJedi?.id === jedi.id ? 'border-amber-500 ring-2 ring-amber-500/10' : 'border-slate-200 hover:border-slate-350'}`}
                    >
                      {/* Sabre glow accent line */}
                      <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${getSaberGlowClass(jedi.lightsaber?.color || "blue")}`} />
                      
                      <div className="pl-2 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 font-display group-hover:text-amber-650 transition-colors">
                              {jedi.name}
                            </h4>
                            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">
                              {jedi.title} &bull; {jedi.species}
                            </span>
                          </div>

                          <div className="flex flex-col items-end shrink-0 select-none">
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono ${getSaberTextCol(jedi.lightsaber?.color || "blue")} bg-slate-50 border border-slate-150`}>
                              {jedi.lightsaber?.color} Saber
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-450 line-clamp-2 leading-relaxed">
                          {jedi.background || "No historical record provided in highscore sequence."}
                        </p>
                      </div>

                      <div className="pl-2 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-450">
                        <span className="font-bold">accID: <span className="text-slate-800">{jedi.accountId}</span></span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {jedi.id}.json
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Detailed Jedi Record Inspector */}
            <AnimatePresence>
              {selectedJedi && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-white border-2 border-slate-900 rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden"
                >
                  <button 
                    onClick={() => setSelectedJedi(null)}
                    className="absolute top-4 right-4 text-xs font-bold text-slate-400 hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition shrink-0 cursor-pointer"
                  >
                    Close Record
                  </button>

                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold">
                      <Swords className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black tracking-tight text-slate-900 font-display flex items-center gap-2">
                        {selectedJedi.name}
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-650">
                          {selectedJedi.id}.json
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 font-mono">
                        Galactic File Index: {selectedJedi.accountId} &bull; Age {selectedJedi.dob ? calculateAge(selectedJedi.dob) : ((selectedJedi as any).age || 14)} {selectedJedi.dob && `(Born ${selectedJedi.dob})`}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* General Specs */}
                    <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
                      <h5 className="text-[10px] font-black tracking-wider text-slate-400 uppercase font-mono">Jedi Characteristics</h5>
                      <div className="space-y-2.5 text-xs text-slate-700">
                        <div className="flex justify-between"><span className="text-slate-400">Class Rank:</span> <span className="font-bold">{selectedJedi.title}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Species:</span> <span className="font-bold">{selectedJedi.species}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Gender:</span> <span>{selectedJedi.gender}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Height:</span> <span>{selectedJedi.height}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Affiliation:</span> <span className="text-indigo-650 font-bold">{selectedJedi.affiliation}</span></div>
                      </div>

                      {/* Lightsaber build */}
                      <div className="pt-4 border-t border-slate-200 space-y-2.5 text-xs">
                        <h5 className="text-[10px] font-black tracking-wider text-slate-400 uppercase font-mono mb-1">Lightsaber Specs</h5>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Color:</span> 
                          <span className={`font-black uppercase tracking-wider text-[11px] flex items-center gap-1.5 ${getSaberTextCol(selectedJedi.lightsaber?.color || "blue")}`}>
                            <span className={`w-2.5 h-2.5 rounded-full ${getSaberGlowClass(selectedJedi.lightsaber?.color || "blue")}`}></span>
                            {selectedJedi.lightsaber?.color}
                          </span>
                        </div>
                        <div className="flex justify-between"><span className="text-slate-400">Crystal:</span> <span className="font-medium text-slate-800">{selectedJedi.lightsaber?.crystal}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Hilt Type:</span> <span className="text-slate-800">{selectedJedi.lightsaber?.hiltStyle}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Material:</span> <span className="text-slate-650 whitespace-nowrap text-ellipsis overflow-hidden max-w-[140px] block" title={selectedJedi.lightsaber?.hiltMaterial}>{selectedJedi.lightsaber?.hiltMaterial}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Combat Form:</span> <span className="font-bold text-slate-700">{selectedJedi.lightsaber?.form}</span></div>
                      </div>
                    </div>

                    {/* Stats & Skills */}
                    <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
                      <h5 className="text-[10px] font-black tracking-wider text-slate-400 uppercase font-mono">Combat Trial Performance</h5>
                      
                      <div className="space-y-3">
                        {[
                          { label: "Saber Skill", val: selectedJedi.stats?.lightsaberSkill, color: "bg-blue-600" },
                          { label: "Force Power", val: selectedJedi.stats?.forcePower, color: "bg-purple-600" },
                          { label: "Agility", val: selectedJedi.stats?.agility, color: "bg-emerald-600" },
                          { label: "Wisdom", val: selectedJedi.stats?.wisdom, color: "bg-amber-500" },
                          { label: "Defense", val: selectedJedi.stats?.defense, color: "bg-indigo-600" },
                          { label: "Strength", val: selectedJedi.stats?.strength, color: "bg-slate-700" }
                        ].map((stat, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-[11px] font-medium text-slate-600">
                              <span>{stat.label}</span>
                              <span className="font-mono font-bold text-slate-800">{stat.val || 50}/100</span>
                            </div>
                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div className={`h-full ${stat.color} rounded-full`} style={{ width: `${stat.val || 50}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Combat Records and Force Powers */}
                    <div className="space-y-4 flex flex-col justify-between">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3">
                        <h5 className="text-[10px] font-black tracking-wider text-slate-400 uppercase font-mono">Duel Record</h5>
                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div className="bg-white border border-slate-100 rounded-lg p-2">
                            <span className="text-[10px] text-slate-400 block font-mono">WINS</span>
                            <span className="text-base font-extrabold text-emerald-600">{selectedJedi.combatRecord?.wins || 0}</span>
                          </div>
                          <div className="bg-white border border-slate-100 rounded-lg p-2">
                            <span className="text-[10px] text-slate-400 block font-mono">LOSSES</span>
                            <span className="text-base font-extrabold text-rose-500">{selectedJedi.combatRecord?.losses || 0}</span>
                          </div>
                        </div>

                        <div className="text-xs space-y-1 leading-relaxed">
                          <div className="flex justify-between"><span className="text-slate-400">Total Duels:</span> <span className="font-bold text-slate-800">{selectedJedi.combatRecord?.totalDuels || 0}</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">Galactic Rank:</span> <span className="font-bold text-amber-600">#{selectedJedi.ranking?.galacticRank || 100}</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">Achievement Points:</span> <span className="font-bold text-slate-800">{selectedJedi.ranking?.achievementPoints || 0}</span></div>
                        </div>
                      </div>

                      <div className="bg-amber-50/20 border border-amber-100 rounded-xl p-4 space-y-2">
                        <h5 className="text-[10px] font-black tracking-wider text-amber-700 uppercase font-mono flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5" />
                          Unlocked Force Powers
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {(selectedJedi.forceAbilities || []).map((ability, index) => (
                            <span key={index} className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-mono">
                              {ability}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Combat Style & Bio */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100 text-xs">
                    <div className="space-y-1.5">
                      <span className="font-bold font-mono text-[10px] uppercase text-slate-400 block">Form & Combat Analysis</span>
                      <p className="text-slate-650 leading-relaxed font-sans">{selectedJedi.combatStyle}</p>
                    </div>
                    <div className="space-y-1.5">
                      <span className="font-bold font-mono text-[10px] uppercase text-slate-400 block">Jedi Biography & Background</span>
                      <p className="text-slate-650 leading-relaxed font-sans">{selectedJedi.background}</p>
                    </div>
                  </div>

                  {/* Personality Quote */}
                  <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-150 flex gap-3 italic text-xs text-slate-600 relative">
                    <MessageSquare className="w-4 h-4 text-slate-450 shrink-0 mt-0.5" />
                    <div>
                      <p className="leading-relaxed">"{selectedJedi.personality?.quote}"</p>
                      <div className="flex flex-wrap gap-1.5 mt-2 not-italic font-bold">
                        {(selectedJedi.personality?.traits || []).map((trait, index) => (
                          <span key={index} className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-200 text-slate-600 font-mono">
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

        {/* Right Side: REST API Playground & Post Jedi Form (1/3 width) */}
        <div className="w-full lg:w-[460px] bg-white border-t lg:border-t-0 p-6 flex flex-col justify-between overflow-y-auto shrink-0 border-l border-slate-200">
          
          <div className="space-y-6">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-slate-800" />
                <h3 className="text-sm font-extrabold text-slate-900 font-display">
                  API & Sandbox controls
                </h3>
              </div>

              {/* Console Tab */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-bold font-mono">
                <button 
                  onClick={() => setActiveTab("JEDIS")}
                  className={`px-3 py-1 rounded-md transition cursor-pointer ${activeTab === "JEDIS" ? "bg-white text-slate-950 shadow-xs" : "text-slate-400 hover:text-slate-700"}`}
                >
                  Write Record
                </button>
                <button 
                  onClick={() => setActiveTab("PLAYGROUND")}
                  className={`px-3 py-1 rounded-md transition cursor-pointer ${activeTab === "PLAYGROUND" ? "bg-white text-slate-950 shadow-xs" : "text-slate-400 hover:text-slate-700"}`}
                >
                  Console/SDK
                </button>
              </div>
            </div>

            {activeTab === "JEDIS" ? (
              <div className="space-y-4">
                
                {/* Visual Header */}
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                    <Sparkles className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '6s' }} />
                    <span>Jedi Templates & Presets</span>
                  </div>
                  <p className="text-[11px] text-slate-450 leading-relaxed font-sans">
                    Fast track testing by choosing one of the following canonical templates, or modify properties natively below and click <strong className="text-slate-800">Commit</strong>.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TEMPLATE_JEDI_LIST.map((temp, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => selectPreset(temp)}
                        className="px-2.5 py-1.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-mono font-black text-slate-700 cursor-pointer shadow-xs transition"
                      >
                        {temp.name}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handlePostJedi} className="space-y-4">
                  
                  {/* Basic Specifications group */}
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black tracking-wider text-slate-400 font-mono uppercase">1. Jedi Identity</h5>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">AccountId (Unique)</label>
                        <input 
                          type="text" 
                          value={postAccountId}
                          onChange={(e) => setPostAccountId(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/10"
                          required
                          placeholder="oring"
                        />
                      </div>
                      
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Jedi Name</label>
                        <input 
                          type="text" 
                          value={postName}
                          onChange={(e) => setPostName(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/10 font-medium"
                          required
                          placeholder="Kalren Voss"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Rank Title</label>
                        <input 
                          type="text" 
                          value={postTitle}
                          onChange={(e) => setPostTitle(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500 uppercase tracking-wide font-mono"
                          placeholder="Jedi Knight"
                        />
                      </div>
                      
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Species</label>
                        <input 
                          type="text" 
                          value={postSpecies}
                          onChange={(e) => setPostSpecies(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500 font-medium"
                          placeholder="Human"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                          DOB (Age: {calculateAge(postDob)})
                        </label>
                        <input 
                          type="date" 
                          value={postDob}
                          onChange={(e) => setPostDob(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Gender</label>
                        <input 
                          type="text" 
                          value={postGender}
                          onChange={(e) => setPostGender(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none"
                          placeholder="Male"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Height</label>
                        <input 
                          type="text" 
                          value={postHeight}
                          onChange={(e) => setPostHeight(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none"
                          placeholder="1.85m"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lightsaber specifications */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <h5 className="text-[10px] font-black tracking-wider text-slate-400 font-mono uppercase">2. Lightsaber Design</h5>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 font-mono text-[9px]">Saber Color</label>
                        <select
                          value={postSaberColor}
                          onChange={(e) => setPostSaberColor(e.target.value)}
                          className={`w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-black uppercase tracking-wider focus:outline-none ${getSaberTextCol(postSaberColor)} bg-slate-50`}
                        >
                          <option value="Blue" className="text-blue-600 font-bold">Blue</option>
                          <option value="Green" className="text-emerald-600 font-bold">Green</option>
                          <option value="Purple" className="text-purple-600 font-bold">Purple</option>
                          <option value="Yellow" className="text-amber-500 font-bold">Yellow</option>
                          <option value="Red" className="text-red-500 font-bold">Red</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 font-mono text-[9px]">Combat Style Form</label>
                        <input 
                          type="text" 
                          value={postSaberForm}
                          onChange={(e) => setPostSaberForm(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none text-slate-700"
                          placeholder="Form V - Shien/Djem So"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 font-mono text-[9px]">Hilt Material / Design Accents</label>
                      <input 
                        type="text" 
                        value={postSaberHiltMat}
                        onChange={(e) => setPostSaberHiltMat(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none"
                        placeholder="Polished Durasteel with Electrum accents"
                      />
                    </div>
                  </div>

                  {/* Character stats sliders */}
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <h5 className="text-[10px] font-black tracking-wider text-slate-400 font-mono uppercase">3. Combat Stat Distribution</h5>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Strength */}
                      <div>
                        <div className="flex justify-between text-[11px] font-medium text-slate-600">
                          <span>Lightsaber Skill</span>
                          <span className="font-mono font-bold">{statSaberSkill}</span>
                        </div>
                        <input 
                          type="range" min="10" max="100" value={statSaberSkill} 
                          onChange={(e) => setStatSaberSkill(Number(e.target.value))}
                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                      </div>

                      {/* Force Power */}
                      <div>
                        <div className="flex justify-between text-[11px] font-medium text-slate-600">
                          <span>Force Power</span>
                          <span className="font-mono font-bold">{statForcePower}</span>
                        </div>
                        <input 
                          type="range" min="10" max="100" value={statForcePower} 
                          onChange={(e) => setStatForcePower(Number(e.target.value))}
                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>

                      {/* Wisdom */}
                      <div>
                        <div className="flex justify-between text-[11px] font-medium text-slate-600">
                          <span>Wisdom</span>
                          <span className="font-mono font-bold">{statWisdom}</span>
                        </div>
                        <input 
                          type="range" min="10" max="100" value={statWisdom} 
                          onChange={(e) => setStatWisdom(Number(e.target.value))}
                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                      </div>

                      {/* Agility */}
                      <div>
                        <div className="flex justify-between text-[11px] font-medium text-slate-600">
                          <span>Agility</span>
                          <span className="font-mono font-bold">{statAgility}</span>
                        </div>
                        <input 
                          type="range" min="10" max="100" value={statAgility} 
                          onChange={(e) => setStatAgility(Number(e.target.value))}
                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Character Narrative */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <h5 className="text-[10px] font-black tracking-wider text-slate-400 font-mono uppercase">4. Abilities & Background</h5>
                    
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Force Abilities (Comma separated list)</label>
                      <input 
                        type="text" 
                        value={postAbilities}
                        onChange={(e) => setPostAbilities(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                        placeholder="Force Push, Force Pull, Mind Trick"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Biography / Background Description</label>
                      <textarea 
                        value={postBackground}
                        onChange={(e) => setPostBackground(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500 h-16 resize-none leading-normal font-sans"
                        placeholder="A former farm boy from Corellia discovered by the Jedi..."
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Signature Zen Quote</label>
                      <input 
                        type="text" 
                        value={postQuote}
                        onChange={(e) => setPostQuote(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 border-dashed rounded-lg text-xs italic text-slate-600 focus:outline-none bg-slate-50/50"
                        placeholder="The Force will guide my blade..."
                      />
                    </div>
                  </div>

                  {postFeedback && (
                    <div className={`p-4 rounded-xl border text-xs font-medium space-y-1 ${postFeedback.success ? 'bg-emerald-50 border-emerald-250 text-emerald-800' : 'bg-rose-50 border-rose-250 text-rose-800'}`}>
                      <div className="font-bold flex items-center gap-1">
                        {postFeedback.success ? (
                          <>
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
                            Success:
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full inline-block animate-ping"></span>
                            Commit Failed:
                          </>
                        )}
                      </div>
                      <p className="leading-relaxed opacity-90">{postFeedback.message}</p>
                      
                      {postFeedback.success && postFeedback.simulation && (
                        <div className="mt-2 text-[10px] text-amber-800 bg-amber-50 border border-amber-250 rounded p-2 font-mono flex items-start gap-1.5 leading-relaxed">
                          <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>
                            <strong>Developer Environment Sandbox:</strong> Your GITHUB_TOKEN is missing or not configured in AI Studio, so files are committed locally in Node's active memory for instantaneous developer flow checking!
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={posting}
                    className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 disabled:bg-slate-500 text-white rounded-lg text-xs font-mono font-black tracking-wide flex items-center justify-center gap-1.5 cursor-pointer shadow-xs uppercase"
                  >
                    <PlusCircle className="w-4 h-4" />
                    {posting ? "Writing to Git..." : "Commit Jedi Record"}
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Visual Header */}
                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl space-y-2 border border-slate-800 font-mono text-xs shadow-md">
                  <div className="flex items-center gap-1.5 font-bold text-amber-500 uppercase tracking-widest text-[10px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Interactive REST SDK Console
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Test live queries directly on the `/api/academy` endpoint. Set repo files and target paths dynamically to receive payload streams.
                  </p>
                </div>

                {/* GET Route Doc Card */}
                <div className="space-y-2 border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-250 rounded font-black">GET</span>
                    <span className="text-slate-400 font-bold">/api/academy</span>
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between bg-white border border-slate-200 rounded px-3 py-1.5 items-center">
                      <span className="text-[11px] text-slate-500 font-mono truncate max-w-[280px]">
                        {getAbsoluteGetUrl()}
                      </span>
                      <button 
                        onClick={() => copyToClipboard(getAbsoluteGetUrl())}
                        className="text-slate-450 hover:text-slate-800 hover:bg-slate-100 p-1 rounded-md transition cursor-pointer"
                        title="Copy relative GET URL"
                      >
                        {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="bg-slate-900 rounded-lg p-3 relative overflow-hidden group">
                      <button 
                        onClick={() => copyToClipboard(curlGetCommand, true)}
                        className="absolute right-2 top-2 p-1 rounded bg-slate-800/80 hover:bg-slate-800 hover:scale-105 border border-slate-700 text-slate-200 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                      >
                        {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <span className="text-[9px] text-slate-500 font-mono uppercase block font-bold mb-1">CURL STATEMENT</span>
                      <pre className="text-[10px] text-amber-450 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {curlGetCommand}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* POST Route Doc Card */}
                <div className="space-y-2 border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-250 rounded font-black">POST</span>
                    <span className="text-slate-400 font-bold">/api/academy</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="bg-slate-900 rounded-lg p-3 relative overflow-hidden group">
                      <button 
                        onClick={() => copyToClipboard(curlPostCommand, true)}
                        className="absolute right-2 top-2 p-1 rounded bg-slate-800/80 hover:bg-slate-800 hover:scale-105 border border-slate-700 text-slate-200 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                      >
                        {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <span className="text-[9px] text-slate-500 font-mono uppercase block font-bold mb-1">CURL STATEMENT</span>
                      <pre className="text-[10px] text-blue-400 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {curlPostCommand}
                      </pre>
                    </div>

                    <div className="bg-slate-900 rounded-lg p-3">
                      <span className="text-[9px] text-slate-500 font-mono uppercase block font-bold mb-1">MOCK BODY SCHEMA ({`academy/*.json`})</span>
                      <pre className="text-[9px] text-slate-350 font-mono overflow-x-auto h-48 whitespace-pre leading-normal">
                        {sampleMockPayloadString}
                      </pre>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 text-[11px] text-slate-450 flex items-center justify-between">
            <span className="font-semibold text-slate-600">Jedi File Ledger Portal</span>
            <span>&copy; 2026 Galactic Center</span>
          </div>

        </div>

      </div>

    </div>
  );
}
