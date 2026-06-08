import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  Settings, 
  Database, 
  Users, 
  Coins, 
  Trophy, 
  CheckCircle, 
  Zap, 
  Sparkles, 
  TrendingUp, 
  Search, 
  Copy, 
  Activity, 
  Info, 
  ArrowRight,
  ClipboardCheck
} from "lucide-react";
import { PlayerScoutRequest, SponsorMatchRequest, Tournament, Match } from "../types";

interface ProfileTabProps {
  favoriteFranchise: string;
  onSetFavoriteFranchise: (team: string) => void;
  commentatorStyle: string;
  onSetCommentatorStyle: (style: string) => void;
  userSession?: { name: string; email: string; role: "spectator" | "conducting_person" } | null;
  onLogout?: () => void;
  onElevateRole?: () => void;
  tournaments?: Tournament[];
  setTournaments?: React.Dispatch<React.SetStateAction<Tournament[]>>;
  selectedTourneyId?: string;
  setSelectedTourneyId?: (id: string) => void;
  onSwitchTab?: (tab: "live" | "upcoming" | "community" | "profile") => void;
}

export default function ProfileTab({ 
  favoriteFranchise, 
  onSetFavoriteFranchise,
  commentatorStyle,
  onSetCommentatorStyle,
  userSession,
  onLogout,
  onElevateRole,
  tournaments = [],
  setTournaments,
  selectedTourneyId = "",
  setSelectedTourneyId,
  onSwitchTab
}: ProfileTabProps) {
  // Pro dashboard tab
  const [profileActiveTool, setProfileActiveTool] = useState<"none" | "blueprint" | "scouting" | "monetization">("none");

  // Tournament / Friendly Match Creation States
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [newEventCategory, setNewEventCategory] = useState<"tournament" | "friendly">("tournament");
  const [newEventName, setNewEventName] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newEventFormat, setNewEventFormat] = useState<"T10" | "T20" | "ODI" | "Test">("T20");
  const [newEventPrize, setNewEventPrize] = useState("$10,000 USD");
  const [newEventTeams, setNewEventTeams] = useState(8);
  const [newFriendlyTeamA, setNewFriendlyTeamA] = useState("Local Titans");
  const [newFriendlyTeamB, setNewFriendlyTeamB] = useState("Vanguard XI");
  const [newFriendlyTarget, setNewFriendlyTarget] = useState(120);
  const [newFriendlyStriker, setNewFriendlyStriker] = useState("Amit Mishra");
  const [newFriendlyBowler, setNewFriendlyBowler] = useState("Zaheer Khan");
  const [createSuccessMsg, setCreateSuccessMsg] = useState<string | null>(null);

  const handleCreateEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventLocation.trim()) return;

    let createdEvent: Tournament;

    if (newEventCategory === "tournament") {
      const id = `tourney-${Date.now()}`;
      createdEvent = {
        id,
        name: newEventName.trim() || "Gully Cricket Championship",
        location: newEventLocation.trim(),
        format: newEventFormat,
        prizePool: newEventPrize,
        teamsCount: Number(newEventTeams),
        status: "Upcoming",
        dateRange: "June - July 2026",
        statsSummary: "Official Tournament registered via profile control.",
        eventType: "tournament",
        matches: [],
        creatorEmail: userSession?.email || ""
      };
    } else {
      const id = `friendly-${Date.now()}`;
      createdEvent = {
        id,
        name: `${newFriendlyTeamA} vs ${newFriendlyTeamB} (Friendly Exhibition)`,
        location: newEventLocation.trim(),
        format: newEventFormat,
        prizePool: "Exhibition Trophy",
        teamsCount: 2,
        status: "Ongoing",
        dateRange: "Today • Live exhibition",
        statsSummary: `Friendly match hosted via Profile. Target to chase is ${newFriendlyTarget} runs!`,
        eventType: "friendly",
        matches: [
          {
            id: `match-${id}`,
            teamA: newFriendlyTeamA,
            teamB: newFriendlyTeamB,
            date: "LIVE NOW • friendly Exhibition",
            venue: newEventLocation.trim(),
            status: "LIVE",
            scoreA: 0,
            wicketsA: 0,
            oversA: "0.0",
            scoreB: 0,
            wicketsB: 0,
            oversB: "0.0",
            target: Number(newFriendlyTarget),
            activeStriker: newFriendlyStriker,
            activeBowler: newFriendlyBowler,
            details: "Friendly exhibition underway. Score live now!",
            eventType: "friendly",
            creatorEmail: userSession?.email || ""
          }
        ],
        creatorEmail: userSession?.email || ""
      };
    }

    if (setTournaments) {
      setTournaments(prev => {
        const next = [...prev, createdEvent];
        localStorage.setItem("cricketverse_tournaments", JSON.stringify(next));
        return next;
      });
    }

    if (setSelectedTourneyId) {
      setSelectedTourneyId(createdEvent.id);
    }

    setCreateSuccessMsg(`Successfully registered ${newEventCategory === "tournament" ? "Tournament" : "Friendly Single Match"}!`);
    
    // Clear state
    setNewEventName("");
    setNewEventLocation("");
    
    setTimeout(() => {
      setCreateSuccessMsg(null);
      setShowCreateEventModal(false);
      if (onSwitchTab) {
        onSwitchTab("upcoming");
      }
    }, 1500);
  };

  // 2. Scouting States
  const [scoutingName, setScoutingName] = useState("Yashasvi Jaiswal");
  const [scoutingAge, setScoutingAge] = useState(20);
  const [scoutingRole, setScoutingRole] = useState<"batsman" | "bowler" | "allrounder" | "wicketkeeper">("batsman");
  const [scoutingBatting, setScoutingBatting] = useState("Left Hand Batsman");
  const [scoutingBowling, setScoutingBowling] = useState("Right arm offbreak spinner");
  const [scoutingMatches, setScoutingMatches] = useState(14);
  const [scoutingRuns, setScoutingRuns] = useState(612);
  const [scoutingAvg, setScoutingAvg] = useState(43.7);
  const [scoutingSR, setScoutingSR] = useState(148.2);
  const [scoutingWickets, setScoutingWickets] = useState(2);
  const [scoutingEconomy, setScoutingEconomy] = useState(8.1);
  const [scoutingRegion, setScoutingRegion] = useState("Mumbai Elite League");
  const [scoutLoading, setScoutLoading] = useState(false);
  const [scoutResult, setScoutResult] = useState<any>({
    rating: 88,
    scoutVerdict: "Jaiswal possesses elite wrist torque and a devastating bat swing matching sub-continental legends. Biomechanics indicators show high adaptability score against pace and back-foot pull drives.",
    strengths: ["Sensational backfoot punch geometry", "High bat speed transition (>115kmh)", "Exceptional ground-running velocity stats"],
    weaknesses: ["Vulnerable to sharp in-swing deliveries inside the first 5 overs", "Occasional visual distraction off line of off-stump"],
    comparableLegend: "Saurav Ganguly",
    trainingPlan: "Engage in off-stump leave drills against 145kmh left-arm throwdowns. Focus on lateral core stability sets to boost balance on pull drives.",
    aiPowered: false
  });

  // 3. Sponsor States
  const [sponsorTournament, setSponsorTournament] = useState("Gully Cricket Premier Cup");
  const [sponsorFormat, setSponsorFormat] = useState<"T10" | "T20" | "ODI" | "Test">("T20");
  const [sponsorTeams, setSponsorTeams] = useState(12);
  const [sponsorLocation, setSponsorLocation] = useState("Delhi NCR");
  const [sponsorReach, setSponsorReach] = useState(120000);
  const [sponsorAudience, setSponsorAudience] = useState<"local" | "regional" | "national" | "global">("regional");
  const [sponsorLoading, setSponsorLoading] = useState(false);
  const [sponsorMatchData, setSponsorMatchData] = useState<any>({
    estimatedSponsorshipPool: "$18,500 - $32,000 USD",
    suggestedSponsors: [
      {
        brand: "Dream11",
        category: "Fantasy Partner",
        integration: "Interactive QR discount code overlays embedded directly within streaming scorecard panels during timeouts.",
        estValue: "$12,500"
      },
      {
        brand: "TATA motors",
        category: "Automotive Exhibit",
        integration: "Displaying prominent animated bumper banners and official electric vehicle showcase frames at each boundary.",
        estValue: "$9,000"
      }
    ],
    monetizationTiers: {
      saasSubscription: "$39/month Core Organizer Admin suite",
      ticketEngineModel: "2.5% transaction clip plus flat player passport claim fees"
    },
    tacticsToEnrichSponsorROI: "Execute digital instant fantasy-quizzes linked with live brand vouchers during drinks intervals to sustain focus.",
    aiPowered: false
  });

  // Submit methods for API callers
  const runScoutingAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setScoutLoading(true);
    try {
      const resp = await fetch("/api/scout-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: scoutingName,
          age: scoutingAge,
          role: scoutingRole,
          battingStyle: scoutingBatting,
          bowlingStyle: scoutingBowling,
          matches: scoutingMatches,
          runs: scoutingRuns,
          average: scoutingAvg,
          strikeRate: scoutingSR,
          wickets: scoutingWickets,
          economy: scoutingEconomy,
          region: scoutingRegion
        } as PlayerScoutRequest)
      });
      const data = await resp.json();
      if (data) {
        setScoutResult(data);
      }
    } catch (err) {
      console.warn("Using localized fallback intelligence for athlete contract assessment.", err);
    } finally {
      setScoutLoading(false);
    }
  };

  const runSponsorshipMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSponsorLoading(true);
    try {
      const resp = await fetch("/api/sponsor-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentName: sponsorTournament,
          teamsCount: sponsorTeams,
          location: sponsorLocation,
          targetAudience: sponsorAudience,
          format: sponsorFormat,
          estimatedReach: sponsorReach
        } as SponsorMatchRequest)
      });
      const data = await resp.json();
      if (data) {
        setSponsorMatchData(data);
      }
    } catch (err) {
      console.warn("Using localized fallback intelligence for financial modeling.", err);
    } finally {
      setSponsorLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Verified Instagram-style user info card */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-8 text-center md:text-left space-y-4 md:space-y-0">
          
          {/* Avatar representation */}
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-orange-500 via-amber-500 to-yellow-400 p-0.5">
              <div className="h-full w-full rounded-full bg-slate-950 border-2 border-slate-900 flex items-center justify-center text-4xl shadow font-semibold animate-pulse">
                👤
              </div>
            </div>
            <span className="absolute bottom-1 right-1 h-5 w-5 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center shadow-md">
              <CheckCircle className="h-3 w-3 text-white" />
            </span>
          </div>

          {/* User Bio and Profile Info */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0">
              <h2 className="text-xl font-display font-black text-white">
                @{userSession?.name?.toLowerCase().replace(/\s+/g, "_") || "cricket_captain_you"}
              </h2>
              <span className={`px-2 py-0.5 border text-[10px] rounded font-mono uppercase tracking-wider ${
                userSession?.role === "conducting_person"
                  ? "bg-amber-950 text-amber-400 border-amber-800/40"
                  : "bg-slate-800 text-slate-400 border-slate-705"
              }`}>
                {userSession?.role === "conducting_person" ? "Match Conducting Organizer 👮" : "Free Spectator 🎮"}
              </span>
            </div>

            {/* Profile Statistics metrics */}
            <div className="flex items-center justify-center md:justify-start space-x-6 text-sm font-mono text-slate-300">
              <div>
                <b className="text-white text-base">4</b> <span className="text-slate-500 text-xs">Posts</span>
              </div>
              <div>
                <b className="text-white text-base">12.4K</b> <span className="text-slate-500 text-xs">Followers</span>
              </div>
              <div>
                <b className="text-white text-base">340</b> <span className="text-slate-500 text-xs">Following</span>
              </div>
              <div>
                <b className="text-orange-400 text-base">980</b> <span className="text-slate-500 text-xs">Fan Score</span>
              </div>
            </div>

            {/* Personal bio narrative */}
            <div className="text-xs text-slate-300 space-y-1 font-sans leading-relaxed">
              <p className="font-semibold text-slate-100">{userSession?.name || "Cricket Fanatic"} ({userSession?.email || "fan@stadium.com"}) 🏏</p>
              <p className="text-slate-400">Managing street circuits & municipal matches using real-time AI analytics. Powered by Gemini 3.5-Flash.</p>
              <p className="font-mono text-xs text-amber-500 font-semibold">• Favorite franchise: {favoriteFranchise}</p>
            </div>
          </div>
        </div>

        {/* Dynamic Buttons for Log out and Elevation */}
        <div className="pt-4 border-t border-slate-850 flex flex-wrap gap-2 justify-center md:justify-end">
          {userSession?.role === "spectator" && onElevateRole && (
            <button
              id="profile-elevate-btn"
              onClick={onElevateRole}
              className="px-3.5 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/35 border border-emerald-800/30 rounded-lg text-emerald-400 font-bold text-xs transition cursor-pointer"
            >
              🔑 Request Match Conducting Access (Elevate)
            </button>
          )}
          {onLogout && (
            <button
              id="profile-logout-btn"
              onClick={onLogout}
              className="px-3.5 py-1.5 bg-rose-950/20 hover:bg-rose-900/20 border border-rose-900/30 rounded-lg text-rose-400 font-bold text-xs transition cursor-pointer"
            >
              🚪 Sign Out / Switch Identity
            </button>
          )}
        </div>
      </div>

      {/* 1.5. NEW League Organizing Control Deck */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 shadow-md space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-display font-black text-white flex items-center space-x-2">
              <Trophy className="h-4.5 w-4.5 text-amber-500" />
              <span>League Organizer Control Deck</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-lg leading-relaxed">
              Design professional local cricket series, register street-league clubs, or host custom dual exhibition matches. Simulated with Gemini-powered sports commentary.
            </p>
          </div>

          <div>
            {userSession?.role === "conducting_person" ? (
              <button
                id="btn-trigger-create-event"
                onClick={() => setShowCreateEventModal(true)}
                className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white text-xs font-bold font-mono rounded-lg transition shadow-lg shadow-orange-950/20 active:scale-95 cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>➕ Create Tournament / Match</span>
              </button>
            ) : (
              <button
                id="btn-trigger-create-event-disabled"
                onClick={onElevateRole}
                className="w-full md:w-auto px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 text-xs font-mono rounded-lg transition cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>🔒 Create Tournament (Officer Only)</span>
              </button>
            )}
          </div>
        </div>

        {/* List of Registered Events on Profile with Category Labels */}
        <div className="space-y-3 pt-2">
          <span className="text-[10px] text-slate-500 uppercase font-mono font-bold tracking-wider block">Registered Tournaments & Exhibition Events ({tournaments.length}):</span>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tournaments.map((tourney) => (
              <div 
                key={tourney.id}
                onClick={() => {
                  if (setSelectedTourneyId) {
                    setSelectedTourneyId(tourney.id);
                  }
                  if (onSwitchTab) {
                    onSwitchTab("upcoming");
                  }
                }}
                className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                  selectedTourneyId === tourney.id
                    ? "bg-slate-950/80 border-amber-500/45 text-slate-100"
                    : "bg-slate-950/30 border-slate-850 hover:border-slate-700 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider ${
                    tourney.eventType === "friendly"
                      ? "bg-blue-950 text-blue-400 border border-blue-900/30"
                      : "bg-amber-950 text-amber-400 border border-amber-900/30"
                  }`}>
                    {tourney.eventType === "friendly" ? "🤝 Friendly Single Match" : "🏆 Multi-Team Tournament"}
                  </span>
                  
                  <span className="text-[10px] font-mono text-slate-500">{tourney.format}</span>
                </div>
                
                <h4 className="font-display font-bold text-xs text-white truncate">{tourney.name}</h4>
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 font-mono">
                  <span>📍 {tourney.location}</span>
                  <span className="text-orange-400">{tourney.eventType === "friendly" ? "Live" : `${tourney.teamsCount} Teams`}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic Creation Modal (Opens option to select tournament or friendly single match) */}
      <AnimatePresence>
        {showCreateEventModal && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5 max-h-[92vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-display font-black text-white">Create New Athletic Event</h3>
                  <p className="text-[11px] text-slate-400 leading-normal">Configure custom rules for local tournaments or casual duals.</p>
                </div>
                <button
                  id="btn-close-create-modal"
                  onClick={() => setShowCreateEventModal(false)}
                  className="p-1 px-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-500 hover:text-white rounded-lg text-xs font-mono tracking-tighter"
                >
                  ✕ Close
                </button>
              </div>

              {createSuccessMsg ? (
                <div className="py-12 text-center space-y-4 font-mono">
                  <div className="mx-auto h-12 w-12 rounded-full bg-emerald-950 flex items-center justify-center border border-emerald-500 text-emerald-400 text-xl animate-bounce">
                    ✓
                  </div>
                  <p className="text-xs text-orange-400 animate-pulse">{createSuccessMsg}</p>
                </div>
              ) : (
                <form onSubmit={handleCreateEventSubmit} className="space-y-4 text-xs">
                  
                  {/* Category Selection: tournament vs friendly match */}
                  <div className="space-y-2">
                    <label className="text-slate-400 block font-mono">Select Event Category:</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        id="category-btn-tournament"
                        onClick={() => setNewEventCategory("tournament")}
                        className={`p-3 rounded-xl border text-left transition flex flex-col space-y-1.5 ${
                          newEventCategory === "tournament"
                            ? "bg-orange-950/30 border-orange-500 text-white"
                            : "bg-slate-950/40 border-slate-850 text-slate-400 hover:bg-slate-950"
                        }`}
                      >
                        <span className="text-lg">🏆</span>
                        <span className="font-bold text-[10px] uppercase font-mono tracking-wide">Tournament</span>
                        <span className="text-[9px] text-slate-400">Multiple clubs & teams, scheduled brackets, group stages.</span>
                      </button>

                      <button
                        type="button"
                        id="category-btn-friendly"
                        onClick={() => setNewEventCategory("friendly")}
                        className={`p-3 rounded-xl border text-left transition flex flex-col space-y-1.5 ${
                          newEventCategory === "friendly"
                            ? "bg-orange-950/30 border-orange-500 text-white"
                            : "bg-slate-950/40 border-slate-850 text-slate-400 hover:bg-slate-950"
                        }`}
                      >
                        <span className="text-lg">🤝</span>
                        <span className="font-bold text-[10px] uppercase font-mono tracking-wide">Friendly Match</span>
                        <span className="text-[9px] text-slate-400">One-off dual, 2 specific teams, scoring starts immediately.</span>
                      </button>
                    </div>
                  </div>

                  {/* COMMON FIELDS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800/40">
                    <div>
                      <label className="text-slate-400 block mb-1 font-mono">Venue / Stadium Location</label>
                      <input
                        id="input-create-location"
                        type="text"
                        required
                        value={newEventLocation}
                        onChange={(e) => setNewEventLocation(e.target.value)}
                        placeholder="e.g. Shivaji Park, Pitch B"
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-slate-150 focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 font-mono">Match Format</label>
                      <select
                        id="select-create-format"
                        value={newEventFormat}
                        onChange={(e) => setNewEventFormat(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-slate-200 focus:outline-none cursor-pointer"
                      >
                        <option value="T10">T10 format (10 Overs)</option>
                        <option value="T20">T20 format (20 Overs)</option>
                        <option value="ODI">ODI format (50 Overs)</option>
                        <option value="Test">Test format (Multi-Day)</option>
                      </select>
                    </div>
                  </div>

                  {/* BRACKET TOURNAMENT SPECIFIC FIELDS */}
                  {newEventCategory === "tournament" ? (
                    <div className="space-y-3 pt-2 border-t border-slate-800/40">
                      <div>
                        <label className="text-slate-400 block mb-1 font-mono">Tournament Championship Title</label>
                        <input
                          id="input-create-tourney-name"
                          type="text"
                          required={newEventCategory === "tournament"}
                          value={newEventName}
                          onChange={(e) => setNewEventName(e.target.value)}
                          placeholder="e.g. Mumbai Corporate Premier League"
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-slate-150 focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-400 block mb-1 font-mono">Prize Pool Valuation</label>
                          <input
                            id="input-create-tourney-prize"
                            type="text"
                            value={newEventPrize}
                            onChange={(e) => setNewEventPrize(e.target.value)}
                            placeholder="e.g. $12,000 USD"
                            className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-slate-150 focus:outline-none focus:border-orange-500"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1 font-mono">Participating Teams Count</label>
                          <input
                            id="input-create-tourney-teams"
                            type="number"
                            min={2}
                            max={32}
                            value={newEventTeams}
                            onChange={(e) => setNewEventTeams(parseInt(e.target.value) || 8)}
                            className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-slate-150 focus:outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* FRIENDLY MATCH SPECIFIC FIELDS */
                    <div className="space-y-3 pt-2 border-t border-slate-800/40">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-400 block mb-1 font-mono">Team A Name (Batting)</label>
                          <input
                            id="input-friendly-teama"
                            type="text"
                            required={newEventCategory === "friendly"}
                            value={newFriendlyTeamA}
                            onChange={(e) => setNewFriendlyTeamA(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-slate-150 focus:outline-none focus:border-orange-500"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1 font-mono">Team B Name (Bowling)</label>
                          <input
                            id="input-friendly-teamb"
                            type="text"
                            required={newEventCategory === "friendly"}
                            value={newFriendlyTeamB}
                            onChange={(e) => setNewFriendlyTeamB(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-slate-150 focus:outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-slate-400 block mb-1 font-mono">Target Runs</label>
                          <input
                            id="input-friendly-target"
                            type="number"
                            min={1}
                            required={newEventCategory === "friendly"}
                            value={newFriendlyTarget}
                            onChange={(e) => setNewFriendlyTarget(parseInt(e.target.value) || 120)}
                            className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-2 text-slate-150 text-center focus:outline-none focus:border-orange-500"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1 font-mono">Striker Batter</label>
                          <input
                            id="input-friendly-striker"
                            type="text"
                            required={newEventCategory === "friendly"}
                            value={newFriendlyStriker}
                            onChange={(e) => setNewFriendlyStriker(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-2 text-slate-150 focus:outline-none focus:border-orange-500"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 block mb-1 font-mono">Target Bowler</label>
                          <input
                            id="input-friendly-bowler"
                            type="text"
                            required={newEventCategory === "friendly"}
                            value={newFriendlyBowler}
                            onChange={(e) => setNewFriendlyBowler(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-2 text-slate-150 focus:outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submission buttons */}
                  <div className="pt-2 flex justify-end space-x-2">
                    <button
                      id="btn-cancel-create"
                      type="button"
                      onClick={() => setShowCreateEventModal(false)}
                      className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 rounded-lg font-mono transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      id="btn-confirm-create"
                      type="submit"
                      className="px-5 py-2.5 bg-orange-600 hover:bg-orange-550 text-white font-bold rounded-lg font-mono transition cursor-pointer shadow-md shadow-orange-900/10 active:scale-[0.98]"
                    >
                      Confirm Event Registration
                    </button>
                  </div>

                </form>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Personalization Preferences Form (General Settings) */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-display font-bold text-white flex items-center space-x-2 border-b border-slate-800/60 pb-2">
          <Settings className="h-4 w-4 text-orange-400" />
          <span>Dashboard Personalization Engine</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1.5 font-mono">My Favorite Cricket Franchise</label>
            <select
              value={favoriteFranchise}
              onChange={(e) => onSetFavoriteFranchise(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer text-xs"
            >
              <option value="India Royals">India Royals (👑)</option>
              <option value="Australia Stars">Australia Stars (⭐)</option>
              <option value="Mumbai Blast">Mumbai Blast (🔥)</option>
              <option value="Delhi Dynamos">Delhi Dynamos (⚡)</option>
              <option value="Kolkata Knights">Kolkata Knights (🛡️)</option>
              <option value="Bangalore Royalists">Bangalore Royalists (🏰)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1.5 font-mono">Preferred AI Commentary Voice</label>
            <div className="flex space-x-2">
              {[
                { id: "ravi", label: "Ravi S." },
                { id: "harsha", label: "Harsha B." },
                { id: "tony", label: "Tony G." }
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => onSetCommentatorStyle(style.id)}
                  className={`flex-1 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                    commentatorStyle === style.id
                      ? "bg-orange-650 text-white border-orange-500 shadow"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Pro Business Utilities Grid Header */}
      <div className="pt-2">
        <div className="flex items-center space-x-2 mb-3">
          <Sparkles className="h-4.5 w-4.5 text-orange-400 animate-pulse" />
          <h3 className="text-sm font-display font-black text-white uppercase tracking-wider">Professional Administration Toolkit</h3>
        </div>

        {/* Buttons Rail */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono leading-none">
          <button
            onClick={() => setProfileActiveTool(profileActiveTool === "scouting" ? "none" : "scouting")}
            className={`py-3 px-2 border rounded-lg flex flex-col items-center justify-center text-center space-y-1.5 cursor-pointer transition ${
              profileActiveTool === "scouting"
                ? "bg-orange-950/20 text-orange-400 border-orange-500"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
            }`}
          >
            <Users className="h-4 w-4" />
            <span className="text-[10px] font-bold">Talent Scouting</span>
          </button>

          <button
            onClick={() => setProfileActiveTool(profileActiveTool === "monetization" ? "none" : "monetization")}
            className={`py-3 px-2 border rounded-lg flex flex-col items-center justify-center text-center space-y-1.5 cursor-pointer transition ${
              profileActiveTool === "monetization"
                ? "bg-orange-950/20 text-orange-400 border-orange-500"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
            }`}
          >
            <Coins className="h-4 w-4" />
            <span className="text-[10px] font-bold">Sponsor Matcher</span>
          </button>
        </div>
      </div>

      {/* 4. Active Tool Section */}

      {profileActiveTool === "scouting" && (
        <div className="bg-[#0f172a] border border-orange-500/20 rounded-xl p-5 shadow space-y-4">
          <div className="border-b border-slate-800 pb-2">
            <h4 className="text-xs font-mono font-bold text-slate-200">AI Career Scouting Passport Hub</h4>
            <p className="text-[10px] text-slate-400">Validate local bio data parameters to retrieve contract passports.</p>
          </div>

          <form onSubmit={runScoutingAnalysis} className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-5 space-y-3.5 text-xs font-sans">
              <div>
                <label className="text-slate-400 block mb-1 font-mono">Player Name</label>
                <input 
                  type="text" 
                  value={scoutingName} 
                  onChange={(e) => setScoutingName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500" 
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1 font-mono">Age</label>
                  <input 
                    type="number" 
                    value={scoutingAge} 
                    onChange={(e) => setScoutingAge(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500" 
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-mono">Role</label>
                  <select 
                    value={scoutingRole} 
                    onChange={(e: any) => setScoutingRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none font-mono"
                  >
                    <option value="batsman">Batsman</option>
                    <option value="bowler">Bowler</option>
                    <option value="allrounder">All-Rounder</option>
                    <option value="wicketkeeper">Wicketkeeper</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                <div>
                  <label className="text-slate-500 block mb-0.5">Matches</label>
                  <input 
                    type="number" 
                    value={scoutingMatches} 
                    onChange={(e) => setScoutingMatches(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-0.5">Runs Scored</label>
                  <input 
                    type="number" 
                    value={scoutingRuns} 
                    onChange={(e) => setScoutingRuns(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200 focus:outline-none" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={scoutLoading}
                className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-orange-850 py-2 rounded text-xs font-semibold text-white transition uppercase font-display cursor-pointer"
              >
                {scoutLoading ? "Computing biometric indexes..." : "Analyze with AI Scout"}
              </button>
            </div>

            {/* Passport Detail View right */}
            <div className="md:col-span-7 bg-slate-950 p-4 border border-slate-850 rounded-xl relative overflow-hidden flex flex-col justify-between space-y-4">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <div>
                  <span className="text-[8px] uppercase tracking-wider text-orange-400 block">ICC APPROVED DIGITAL ASSET ID</span>
                  <h5 className="text-xs font-display font-medium text-white">#CV-{scoutingName.substring(0,3).toUpperCase()}-{scoutingMatches}M</h5>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold block">RATING: {scoutResult.rating || 85}</span>
                </div>
              </div>

              <p className="text-[11px] font-serif text-slate-400 italic bg-slate-900 border border-slate-800/40 p-2.5 rounded leading-relaxed">
                &ldquo;{scoutResult.scoutVerdict}&rdquo;
              </p>

              <div className="text-[10px] text-slate-300">
                <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-500 font-semibold block mb-0.5">Key Strengths</span>
                <ul className="list-disc pl-4 space-y-1">
                  {scoutResult.strengths?.map((str: string, sIdx: number) => (
                    <li key={sIdx}>{str}</li>
                  ))}
                </ul>
              </div>

              <p className="text-[9px] font-sans text-amber-500 border-t border-slate-850 pt-2 font-semibold">
                TRAINING REGISTER: {scoutResult.trainingPlan}
              </p>
            </div>
          </form>
        </div>
      )}

      {profileActiveTool === "monetization" && (
        <div className="bg-[#0f172a] border border-orange-500/20 rounded-xl p-5 shadow space-y-4">
          <div className="border-b border-slate-800 pb-2">
            <h4 className="text-xs font-mono font-bold text-slate-200">AI Sponsorship Bidding Pipeline Optimizer</h4>
            <p className="text-[10px] text-slate-400">Input tournament requirements to calculate optimal commercial bidding values.</p>
          </div>

          <form onSubmit={runSponsorshipMatch} className="grid grid-cols-1 md:grid-cols-12 gap-5 leading-none">
            <div className="md:col-span-5 space-y-3.5 text-xs text-slate-300">
              <div>
                <label className="text-slate-400 block mb-1 font-mono">League Tournament Name</label>
                <input 
                  type="text" 
                  value={sponsorTournament}
                  onChange={(e) => setSponsorTournament(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500" 
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1 font-mono">Teams Count</label>
                  <input 
                    type="number" 
                    value={sponsorTeams}
                    onChange={(e) => setSponsorTeams(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-250 focus:outline-none" 
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-mono">Format</label>
                  <select 
                    value={sponsorFormat}
                    onChange={(e: any) => setSponsorFormat(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-80 w-full rounded p-2 text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="T10">T10 format</option>
                    <option value="T20">T20 format</option>
                    <option value="ODI">ODI format</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-mono flex justify-between">
                  <span>Fan Reach Coverage:</span>
                  <span className="text-orange-400">{sponsorReach.toLocaleString()}</span>
                </label>
                <input 
                  type="range"
                  min="5000"
                  max="500000"
                  step="5000"
                  value={sponsorReach}
                  onChange={(e) => setSponsorReach(parseInt(e.target.value))}
                  className="w-full h-1.5 accent-orange-500 bg-slate-950 rounded"
                />
              </div>

              <button 
                type="submit"
                disabled={sponsorLoading}
                className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-orange-850 py-2 rounded text-xs font-semibold text-white transition uppercase font-display cursor-pointer"
              >
                {sponsorLoading ? "Crunching media values..." : "Match Sponsor Brands"}
              </button>
            </div>

            {/* Sponsor Matches right */}
            <div className="md:col-span-7 bg-slate-950 p-4 border border-slate-850 rounded-xl flex flex-col justify-between space-y-4 text-xs font-sans text-slate-350">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <div>
                  <span className="text-[8px] tracking-wider text-orange-400 block uppercase">ESTIMATED COMMERCIAL POOL</span>
                  <h5 className="text-sm font-display font-bold text-white leading-normal">{sponsorMatchData.estimatedSponsorshipPool}</h5>
                </div>
                <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded font-mono font-bold">
                  Matched
                </span>
              </div>

              <div className="space-y-2.5">
                {sponsorMatchData.suggestedSponsors?.map((spon: any, sIdx: number) => (
                  <div key={sIdx} className="p-2 bg-slate-900 rounded border border-slate-850 text-[11px] leading-normal">
                    <div className="flex justify-between mb-0.5 font-bold text-white">
                      <span>{spon.brand}</span>
                      <span className="text-emerald-400 font-mono font-medium">{spon.estValue}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">{spon.integration}</p>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-850 text-[10px] text-slate-450 leading-normal bg-slate-900/50 p-2 rounded">
                <span className="font-mono text-[9px] text-orange-400 uppercase tracking-widest font-bold block mb-0.5">Sponsor ROI growth hack</span>
                <p className="italic text-slate-300 font-sans">&ldquo;{sponsorMatchData.tacticsToEnrichSponsorROI}&rdquo;</p>
              </div>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
