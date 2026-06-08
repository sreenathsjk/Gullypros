import React, { useState, useEffect } from "react";
import { 
  Trophy, 
  Calendar, 
  Users, 
  Search, 
  Filter, 
  Sparkles, 
  Clock, 
  ChevronRight, 
  User, 
  Award, 
  Plus, 
  Play, 
  AlertCircle, 
  CheckCircle,
  TrendingUp,
  Map
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { Match, Tournament, INITIAL_TOURNAMENTS } from "../types";

interface TournamentsTabProps {
  onLoadLiveMatch: (matchData: {
    battingTeam: string;
    bowlingTeam: string;
    striker: string;
    bowler: string;
    score: number;
    wickets: number;
    overs: number;
    balls: number;
    target: number;
    statusText: string;
    matchId: string;
    tournamentId: string;
  }) => void;
  userRole?: string;
  onElevateRole?: () => void;
  tournaments: Tournament[];
  setTournaments: React.Dispatch<React.SetStateAction<Tournament[]>>;
  selectedTourneyId: string;
  setSelectedTourneyId: (id: string) => void;
  userSession?: { name: string; email: string; role: "spectator" | "conducting_person" } | null;
}

export default function TournamentsTab({ 
  onLoadLiveMatch, 
  userRole = "spectator", 
  onElevateRole,
  tournaments,
  setTournaments,
  selectedTourneyId,
  setSelectedTourneyId,
  userSession
}: TournamentsTabProps) {
  // Automatically select the first tournament if selectedTourneyId is empty but tournaments exist
  useEffect(() => {
    if (tournaments.length > 0 && !selectedTourneyId) {
      setSelectedTourneyId(tournaments[0].id);
    }
  }, [tournaments, selectedTourneyId]);

  const [tourneySearch, setTourneySearch] = useState<string>("");
  const [tourneyFilter, setTourneyFilter] = useState<"All" | "Ongoing" | "Completed" | "Upcoming">("All");
  const [matchStatusFilter, setMatchStatusFilter] = useState<"All" | "LIVE" | "COMPLETED" | "UPCOMING">("LIVE");
  const [roleWarnMessage, setRoleWarnMessage] = useState<string | null>(null);

  // Selection states for Modals/Previews
  const [activeMatchPreview, setActiveMatchPreview] = useState<Match | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<any | null>(null);

  // Match summary states
  const [activeMatchSummary, setActiveMatchSummary] = useState<Match | null>(null);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);
  const [summaryData, setSummaryData] = useState<any | null>(null);

  // Player Profile states
  const [activePlayerProfile, setActivePlayerProfile] = useState<any | null>(null);
  const [playerLoading, setPlayerLoading] = useState<boolean>(false);
  const [searchPlayerName, setSearchPlayerName] = useState<string>("");

  const handleOpenMatchSummary = async (match: Match) => {
    setActiveMatchSummary(match);
    setSummaryLoading(true);
    setSummaryData(null);
    try {
      const resp = await fetch("/api/generate-match-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamA: match.teamA,
          teamB: match.teamB,
          scoreA: match.scoreA || 165,
          wicketsA: match.wicketsA || 4,
          oversA: match.oversA || "20.0",
          scoreB: match.scoreB || 151,
          wicketsB: match.wicketsB || 8,
          oversB: match.oversB || "20.0",
          winner: match.details || `${match.teamA} defeated ${match.teamB}`,
          mvp: match.mvp || "Not Specified",
          tournamentName: selectedTourney?.name || "Local Championship Series"
        })
      });
      const data = await resp.json();
      setSummaryData(data);
    } catch (err) {
      console.error("Failed to load match summary:", err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleOpenPlayerProfile = async (playerName: string) => {
    setPlayerLoading(true);
    setActivePlayerProfile({ name: playerName }); // Loading state display name
    try {
      const resp = await fetch("/api/get-player-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName,
          teamName: ""
        })
      });
      const data = await resp.json();
      setActivePlayerProfile(data);
    } catch (err) {
      console.error("Failed to load player profile:", err);
    } finally {
      setPlayerLoading(false);
    }
  };

  // Forms states
  const [showAddTourneyForm, setShowAddTourneyForm] = useState<boolean>(false);
  const [newTourneyName, setNewTourneyName] = useState<string>("");
  const [newTourneyLocation, setNewTourneyLocation] = useState<string>("");
  const [newTourneyFormat, setNewTourneyFormat] = useState<"T10" | "T20" | "ODI" | "Test">("T20");
  const [newTourneyPrize, setNewTourneyPrize] = useState<string>("$15,000 USD");
  const [newTourneyTeams, setNewTourneyTeams] = useState<number>(8);
  const [newTourneyStatus, setNewTourneyStatus] = useState<"Ongoing" | "Completed" | "Upcoming">("Upcoming");

  const [showAddMatchForm, setShowAddMatchForm] = useState<boolean>(false);
  const [newMatchTeamA, setNewMatchTeamA] = useState<string>("");
  const [newMatchTeamB, setNewMatchTeamB] = useState<string>("");
  const [newMatchVenue, setNewMatchVenue] = useState<string>("");
  const [newMatchDate, setNewMatchDate] = useState<string>("");
  const [newMatchStatus, setNewMatchStatus] = useState<"LIVE" | "COMPLETED" | "UPCOMING">("UPCOMING");
  const [newMatchDetails, setNewMatchDetails] = useState<string>("");
  const [newMatchTarget, setNewMatchTarget] = useState<number>(180);
  const [newMatchStriker, setNewMatchStriker] = useState<string>("Rohan Sharma");
  const [newMatchBowler, setNewMatchBowler] = useState<string>("Pat Cummins");

  // Persist modifications
  useEffect(() => {
    localStorage.setItem("cricketverse_tournaments", JSON.stringify(tournaments));
  }, [tournaments]);

  const selectedTourney = tournaments.find(t => t.id === selectedTourneyId);
  const isTourneyCreator = !selectedTourney || !selectedTourney.creatorEmail || (userSession?.email === selectedTourney.creatorEmail);

  // Add Tournament callback
  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTourneyName.trim() || !newTourneyLocation.trim()) return;

    const newTourney: Tournament = {
      id: `tourney-${Date.now()}`,
      name: newTourneyName,
      location: newTourneyLocation,
      format: newTourneyFormat,
      prizePool: newTourneyPrize,
      teamsCount: newTourneyTeams,
      status: newTourneyStatus,
      dateRange: "Summer 2026",
      statsSummary: "Newly registered tournament awaiting schedules",
      matches: [],
      creatorEmail: userSession?.email || ""
    };

    setTournaments(prev => [...prev, newTourney]);
    setSelectedTourneyId(newTourney.id);
    setNewTourneyName("");
    setNewTourneyLocation("");
    setShowAddTourneyForm(false);
  };

  // Add Match to selected Tournament
  const handleScheduleMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatchTeamA.trim() || !newMatchTeamB.trim() || !selectedTourneyId) return;

    const isLive = newMatchStatus === "LIVE";
    const isCompleted = newMatchStatus === "COMPLETED";

    const newMatch: Match = {
      id: `match-${Date.now()}`,
      teamA: newMatchTeamA,
      teamB: newMatchTeamB,
      venue: newMatchVenue || "Global Turf Lawn",
      date: newMatchDate || "TBD",
      status: newMatchStatus,
      target: isLive ? newMatchTarget : undefined,
      scoreA: isLive ? 0 : isCompleted ? 172 : undefined,
      wicketsA: isLive ? 0 : isCompleted ? 7 : undefined,
      oversA: isLive ? "0.0" : isCompleted ? "20.0" : undefined,
      activeStriker: isLive ? newMatchStriker : undefined,
      activeBowler: isLive ? newMatchBowler : undefined,
      details: newMatchDetails || (isLive ? "Match just kicked off live!" : "Match scheduled."),
      creatorEmail: userSession?.email || ""
    };

    setTournaments(prev => prev.map(t => {
      if (t.id === selectedTourneyId) {
        return {
          ...t,
          matches: [...t.matches, newMatch]
        };
      }
      return t;
    }));

    setNewMatchTeamA("");
    setNewMatchTeamB("");
    setNewMatchVenue("");
    setNewMatchDetails("");
    setShowAddMatchForm(false);
  };

  // Generate Editorial Web Preview via API
  const generateMatchPreview = async (match: Match) => {
    if (!selectedTourney) return;
    setActiveMatchPreview(match);
    setPreviewLoading(true);
    setPreviewData(null);

    try {
      const resp = await fetch("/api/generate-match-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentName: selectedTourney.name,
          teamA: match.teamA,
          teamB: match.teamB,
          venue: match.venue,
          date: match.date,
          format: selectedTourney.format
        })
      });
      const data = await resp.json();
      setPreviewData(data);
    } catch (err) {
      console.error("Failed to generate preview article:", err);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Filter Tournaments list
  const filteredTourneys = tournaments.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(tourneySearch.toLowerCase()) || 
                          t.location.toLowerCase().includes(tourneySearch.toLowerCase());
    const matchesFilter = tourneyFilter === "All" || t.status === tourneyFilter;
    return matchesSearch && matchesFilter;
  });

  // Filter and display matches of the selected tournament that correspond to the active status category filter
  const filteredMatches = selectedTourney 
    ? selectedTourney.matches.filter(m => {
        if (matchStatusFilter === "All") return true;
        return m.status === matchStatusFilter;
      })
    : [];

  return (
    <div className="space-y-6">
      
      {/* Main grids: left side is Tournaments, center/right side is the designated Match Portal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Tournament Selector rail */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            
            {/* Search/Filter heading */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400">
                Tournaments Index ({filteredTourneys.length})
              </span>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input 
                  id="search-tournaments"
                  type="text" 
                  placeholder="Search by league, location..."
                  value={tourneySearch}
                  onChange={(e) => setTourneySearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                />
              </div>

              {/* Status filtering chips */}
              <div className="flex flex-wrap gap-1 pt-1">
                {(["All", "Ongoing", "Completed", "Upcoming"] as const).map((f) => (
                  <button
                    id={`filter-tourney-btn-${f}`}
                    key={f}
                    onClick={() => setTourneyFilter(f)}
                    className={`px-2 py-1 rounded text-[10px] font-mono leading-none border transition ${
                      tourneyFilter === f 
                        ? "border-orange-500/40 bg-orange-950/20 text-orange-400 font-bold" 
                        : "border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-900"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Tournaments list Cards */}
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
              {filteredTourneys.map((t) => {
                const isSelected = t.id === selectedTourneyId;
                return (
                  <div 
                    id={`tourney-card-${t.id}`}
                    key={t.id}
                    onClick={() => {
                      setSelectedTourneyId(t.id);
                      setMatchStatusFilter("All");
                    }}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all duration-150 relative overflow-hidden ${
                      isSelected 
                        ? "bg-slate-800/80 border-orange-500/80 text-white shadow-md shadow-orange-950/20" 
                        : "bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-extrabold uppercase tracking-widest ${
                        t.status === "Ongoing" ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/20" :
                        t.status === "Completed" ? "bg-blue-950/40 text-blue-400 border border-blue-805/20" :
                        "bg-orange-950/40 text-orange-400 border border-orange-805/20"
                      }`}>
                        {t.status}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 font-bold">{t.format} Format</span>
                    </div>

                    <h4 className="font-display font-bold text-xs mt-2 border-b border-slate-800 pb-1.5 leading-normal">
                      {t.name}
                    </h4>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 pt-2 leading-none">
                      <div>
                        <span className="text-slate-500 block text-[9px]">Location</span>
                        <span className="truncate block font-semibold text-slate-300">{t.location}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">Prize Pool</span>
                        <span className="font-bold text-amber-400">{t.prizePool}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredTourneys.length === 0 && (
                <div className="text-center text-xs text-slate-500 py-6">
                  No tournaments found. Create one above!
                </div>
              )}
            </div>

          </div>

          {/* Tournament Overview Stats Detail Box */}
          {selectedTourney && (
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5 font-mono text-xs">
              <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-orange-400 block pb-1 border-b border-slate-800">
                Tournament Analytics Info
              </span>
              <div className="space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
                <p><b className="text-slate-400">Total Teams:</b> {selectedTourney.teamsCount} clubs active</p>
                <p><b className="text-slate-400">Timeline:</b> {selectedTourney.dateRange}</p>
                {selectedTourney.champion && (
                  <p className="flex items-center text-amber-400">
                    <Award className="h-3.5 w-3.5 mr-1" />
                    <b>CHAMPION:</b> {selectedTourney.champion}
                  </p>
                )}
                <div className="mt-2 bg-slate-950 p-2.5 rounded border border-slate-850 text-[10px] text-slate-400 italic">
                  <b>High-Stats Headline:</b> {selectedTourney.statsSummary}
                </div>
              </div>
            </div>
          )}

          {/* Player Profiling Directory Search */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-orange-400 block pb-1 border-b border-slate-800">
              Cricketer Profiles Directory
            </span>
            <p className="text-[11px] text-slate-400 leading-normal">
              Type any cricketer's name (e.g., <span className="text-orange-400/80 cursor-pointer hover:underline font-mono font-bold" onClick={() => handleOpenPlayerProfile("Lokesh Rahul")}>Lokesh Rahul</span>, <span className="text-orange-400/80 cursor-pointer hover:underline font-mono font-bold" onClick={() => handleOpenPlayerProfile("Ravindra Jadeja")}>Ravindra Jadeja</span>, or <span className="text-orange-400/80 cursor-pointer hover:underline font-mono font-bold" onClick={() => handleOpenPlayerProfile("Mitchell Starc")}>Mitchell Starc</span>) to fetch their detailed scout stats card:
            </p>
            <div className="flex gap-2">
              <input
                id="inp-search-player-profile"
                type="text"
                placeholder="Enter player name..."
                value={searchPlayerName}
                onChange={(e) => setSearchPlayerName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchPlayerName.trim()) {
                    handleOpenPlayerProfile(searchPlayerName);
                  }
                }}
                className="flex-1 bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
              />
              <button
                id="btn-trigger-player-profile"
                onClick={() => {
                  if (searchPlayerName.trim()) {
                    handleOpenPlayerProfile(searchPlayerName);
                  }
                }}
                className="bg-orange-600 hover:bg-orange-500 text-white font-mono font-bold text-xs px-3 rounded-lg border border-transparent transition cursor-pointer active:scale-95 shrink-0"
              >
                Inspect
              </button>
            </div>
          </div>

        </div>

        {/* CENTER/RIGHT COLUMN: Web Matches Portal */}
        <div className="lg:col-span-8 space-y-6">
          {selectedTourney ? (
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-5 space-y-4">
              
              {/* Header inside Selected Tourney */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-800 gap-3">
                <div>
                  <h3 className="font-display font-black text-white text-base">
                    {selectedTourney.name} Matches Web Portal
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                    Official fixture schedule & scoreboard index
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="bg-red-950/50 text-red-400 border border-red-500/10 px-2 rounded text-[10px] font-mono uppercase tracking-wider select-none py-1 block">
                    ● conducting live matches
                  </span>

                  <button
                    id="btn-open-match-form"
                    onClick={() => {
                      if (userRole !== "conducting_person") {
                        setRoleWarnMessage("Only authorized tournament match conducting persons are verified to schedule new ongoing match fixtures.");
                      } else if (!isTourneyCreator) {
                        setRoleWarnMessage(`Only the creator of this tournament (${selectedTourney?.creatorEmail || "Authorized Scorer"}) can add match fixtures to it.`);
                      } else {
                        setShowAddMatchForm(true);
                      }
                    }}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-orange-400 text-xs font-mono font-bold flex items-center space-x-1 border border-slate-705 transition cursor-pointer"
                  >
                    <span>{(!isTourneyCreator || userRole !== "conducting_person") ? "🔒 Add Match" : "+ Add Match"}</span>
                  </button>
                </div>
              </div>

              {/* Match Category Filters */}
              <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-800">
                <span className="text-[10px] uppercase tracking-wider font-mono text-slate-500 mr-2">Filter Matches:</span>
                {(["All", "LIVE", "COMPLETED", "UPCOMING"] as const).map((st) => {
                  const isActive = matchStatusFilter === st;
                  const label = st === "All" ? "🌐 All" : st === "LIVE" ? "🔴 Live" : st === "COMPLETED" ? "🏆 Completed" : "📅 Upcoming";
                  return (
                    <button
                      id={`btn-match-status-tab-${st}`}
                      key={st}
                      onClick={() => setMatchStatusFilter(st)}
                      className={`px-3 py-1 font-mono text-xs font-semibold rounded-lg border cursor-pointer transition ${
                        isActive 
                          ? "bg-slate-950 text-orange-400 border-orange-500/70" 
                          : "bg-slate-950/40 text-slate-400 border-slate-850 hover:border-slate-800 hover:text-slate-300"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* LIST OF MATCHES */}
              <div className="space-y-4">
                {filteredMatches.map((m) => {
                  return (
                    <div 
                      id={`match-card-${m.id}`}
                      key={m.id}
                      className="bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-xl p-4 transition duration-150 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      
                      {/* Left: Match Teams & Scores */}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase ${
                            m.status === "LIVE" ? "bg-red-950 text-red-400 border border-red-500/20 animate-pulse" :
                            m.status === "COMPLETED" ? "bg-slate-800 text-slate-400 border border-slate-700" :
                            "bg-orange-950/40 text-orange-400 border border-orange-800/10"
                          }`}>
                            {m.status}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 flex items-center space-x-1">
                            <Clock className="h-3 w-3 mr-0.5" />
                            <span>{m.date} - {m.venue}</span>
                          </span>
                        </div>

                        {/* Playing Teams Versus setup */}
                        <div className="flex items-center space-x-3 text-slate-200">
                          <div className="flex flex-col">
                            <span className="font-display font-bold text-sm tracking-tight">{m.teamA}</span>
                            {m.status !== "UPCOMING" && m.scoreA !== undefined && (
                              <span className="font-mono text-xs text-orange-400 font-extrabold">{m.scoreA}-{m.wicketsA} <span className="text-slate-500 font-medium font-sans">({m.oversA} ov)</span></span>
                            )}
                          </div>
                          
                          <span className="text-xs uppercase font-mono text-slate-600 font-bold">VS</span>

                          <div className="flex flex-col">
                            <span className="font-display font-bold text-sm tracking-tight">{m.teamB}</span>
                            {m.status === "COMPLETED" && m.scoreB !== undefined && (
                              <span className="font-mono text-xs text-orange-400 font-extrabold">{m.scoreB}-{m.wicketsB} <span className="text-slate-500 font-medium font-sans">({m.oversB} ov)</span></span>
                            )}
                          </div>
                        </div>

                        {/* Short details bar */}
                        <span className="text-[11px] text-slate-400 block bg-slate-900/50 p-2 rounded border border-slate-900 font-sans tracking-tight">
                          {m.details}
                        </span>
                      </div>

                      {/* Right side: Actions of match */}
                      <div className="flex flex-col justify-center items-end shrink-0 gap-2">
                        
                        {/* LIVE ACTION: Score Match */}
                        {m.status === "LIVE" && (
                          isTourneyCreator ? (
                            <button
                              id={`btn-score-live-${m.id}`}
                              onClick={() => {
                                onLoadLiveMatch({
                                  battingTeam: m.teamA,
                                  bowlingTeam: m.teamB,
                                  striker: m.activeStriker || "Rohan Sharma",
                                  bowler: m.activeBowler || "Pat Cummins",
                                  score: m.scoreA || 142,
                                  wickets: m.wicketsA || 3,
                                  overs: m.oversA ? Math.floor(parseFloat(m.oversA)) : 16,
                                  balls: m.oversA ? Math.round((parseFloat(m.oversA) - Math.floor(parseFloat(m.oversA))) * 10) : 4,
                                  target: m.target || 185,
                                  statusText: m.details,
                                  matchId: m.id,
                                  tournamentId: selectedTourney?.id || ""
                                });
                              }}
                              className="bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-950/20 text-white font-display font-bold text-xs px-3 py-2 rounded-lg flex items-center space-x-1.5 transition active:scale-95 shadow cursor-pointer uppercase tracking-wider"
                            >
                              <Play className="h-3 w-3 fill-white" />
                              <span>Score Match</span>
                            </button>
                          ) : (
                            <button
                              id={`btn-view-live-${m.id}`}
                              onClick={() => {
                                onLoadLiveMatch({
                                  battingTeam: m.teamA,
                                  bowlingTeam: m.teamB,
                                  striker: m.activeStriker || "Rohan Sharma",
                                  bowler: m.activeBowler || "Pat Cummins",
                                  score: m.scoreA || 142,
                                  wickets: m.wicketsA || 3,
                                  overs: m.oversA ? Math.floor(parseFloat(m.oversA)) : 16,
                                  balls: m.oversA ? Math.round((parseFloat(m.oversA) - Math.floor(parseFloat(m.oversA))) * 10) : 4,
                                  target: m.target || 185,
                                  statusText: m.details,
                                  matchId: m.id,
                                  tournamentId: selectedTourney?.id || ""
                                });
                              }}
                              className="bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-950/20 text-white font-display font-bold text-xs px-3 py-2 rounded-lg flex items-center space-x-1.5 transition active:scale-95 shadow cursor-pointer uppercase tracking-wider font-sans ml-1"
                            >
                              <span className="text-sm leading-none mr-1">📺</span>
                              <span>View Live Scores</span>
                            </button>
                          )
                        )}

                        {/* COMPLETED ACTIONS: View Match Summary + MVP */}
                        {m.status === "COMPLETED" && (
                          <div className="flex flex-col items-end gap-2 text-right">
                            <button
                              id={`btn-summary-${m.id}`}
                              onClick={() => handleOpenMatchSummary(m)}
                              className="bg-orange-600 hover:bg-orange-500 text-white font-display font-medium text-[11px] px-3 py-1.5 rounded-lg flex items-center space-x-1 transition active:scale-95 shadow cursor-pointer uppercase tracking-wider font-bold"
                            >
                              <span>📰 View Summary</span>
                            </button>
                            {m.mvp && (
                              <div className="text-right text-[10px] font-mono leading-relaxed bg-[#0f172a] p-1.5 rounded border border-slate-800">
                                <span className="text-slate-500 uppercase block font-semibold">Match MVP</span>
                                <button
                                  id={`mvp-btn-${m.id}`} 
                                  onClick={() => handleOpenPlayerProfile(m.mvp!)}
                                  className="text-amber-400 font-bold hover:underline cursor-pointer transition text-[10px] block mt-0.5 text-right w-full font-mono"
                                >
                                  ✨ {m.mvp}
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* UPCOMING MATCHES: Simply display fixture information without AI preview intelligence */}
                        {m.status === "UPCOMING" && (
                          <div className="flex flex-col gap-2 items-end">
                            {isTourneyCreator && (
                              <button
                                id={`btn-score-upcoming-${m.id}`}
                                onClick={() => {
                                  // Update status of match to LIVE in state
                                  setTournaments(prev => prev.map(t => {
                                    if (t.id === selectedTourney?.id) {
                                      return {
                                        ...t,
                                        matches: t.matches.map(match => {
                                          if (match.id === m.id) {
                                            return {
                                              ...match,
                                              status: "LIVE",
                                              scoreA: 0,
                                              wicketsA: 0,
                                              oversA: "0.0",
                                              details: "Match created and playing live!"
                                            };
                                          }
                                          return match;
                                        })
                                      };
                                    }
                                    return t;
                                  }));

                                  // Load the live match view
                                  onLoadLiveMatch({
                                    battingTeam: m.teamA,
                                    bowlingTeam: m.teamB,
                                    striker: "Rohit Sharma",
                                    bowler: "Jasprit Bumrah",
                                    score: 0,
                                    wickets: 0,
                                    overs: 0,
                                    balls: 0,
                                    target: m.target || 120,
                                    statusText: "Match created and playing live!",
                                    matchId: m.id,
                                    tournamentId: selectedTourney?.id || ""
                                  });
                                }}
                                className="bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-950/20 text-white font-display font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center space-x-1 transition active:scale-95 shadow cursor-pointer uppercase tracking-wider"
                              >
                                <Play className="h-3 w-3 fill-white" />
                                <span>Score Match</span>
                              </button>
                            )}
                            <button
                              id={`btn-pre-preview-${m.id}`}
                              onClick={() => generateMatchPreview(m)}
                              className="bg-slate-800 hover:bg-slate-705 text-orange-400 font-mono font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-705 transition active:scale-95 cursor-pointer text-center font-bold"
                            >
                              🔮 Pre-Match Intel
                            </button>
                            <div className="text-right text-[10px] font-mono leading-relaxed bg-[#0f172a] p-1.5 rounded border border-slate-800">
                              <span className="text-slate-500 uppercase block font-semibold">Fixture Schedule</span>
                              <span className="text-slate-300 font-bold">Upcoming Match</span>
                            </div>
                          </div>
                        )}

                      </div>

                    </div>
                  );
                })}

                {filteredMatches.length === 0 && (
                  <div className="text-center text-xs text-slate-500 py-12 font-mono">
                    No scheduled fixtures match this filtering category.
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="text-center text-slate-500 py-12">
              Select or register a tournament from the left panel index.
            </div>
          )}
        </div>

      </div>

      {/* --- ADD TOURNAMENT FORM MODAL --- */}
      <AnimatePresence>
        {showAddTourneyForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative"
            >
              <div className="pb-3 border-b border-slate-800 mb-4 flex justify-between items-center">
                <h3 className="font-display font-extrabold text-white text-base flex items-center space-x-1.5">
                  <Trophy className="h-5 w-5 text-orange-500" />
                  <span>Register Professional Tournament</span>
                </h3>
                <button 
                  id="close-tourney-form"
                  onClick={() => setShowAddTourneyForm(false)}
                  className="text-slate-400 hover:text-slate-100 font-mono text-base font-bold select-none cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateTournament} className="space-y-4 text-xs font-sans leading-relaxed">
                <div>
                  <label className="text-slate-400 block mb-1 font-mono">Tournament/League Branded Name</label>
                  <input 
                    id="new-tourney-name"
                    type="text"
                    required
                    value={newTourneyName}
                    onChange={(e) => setNewTourneyName(e.target.value)}
                    placeholder="e.g. Indian Cricket Glory Series"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1 font-mono">Venue Grounds Location</label>
                    <input 
                      id="new-tourney-location"
                      type="text"
                      required
                      value={newTourneyLocation}
                      onChange={(e) => setNewTourneyLocation(e.target.value)}
                      placeholder="e.g. Mumbai, Cricket Turf"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1 font-mono">Match Format</label>
                    <select
                      id="new-tourney-format"
                      value={newTourneyFormat}
                      onChange={(e: any) => setNewTourneyFormat(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none cursor-pointer"
                    >
                      <option value="T10">T10 Blitz</option>
                      <option value="T20">T20 Overs standard</option>
                      <option value="ODI">ODI 50 Overs</option>
                      <option value="Test">Five-Day Test</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1 font-mono font-medium">Bidding Prize Pool</label>
                    <input 
                      id="new-tourney-prize"
                      type="text"
                      value={newTourneyPrize}
                      onChange={(e) => setNewTourneyPrize(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1 font-mono font-medium">Clubs Count</label>
                    <input 
                      id="new-tourney-teams"
                      type="number"
                      value={newTourneyTeams}
                      onChange={(e) => setNewTourneyTeams(parseInt(e.target.value) || 8)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1 font-mono font-medium">Status</label>
                    <select
                      id="new-tourney-status"
                      value={newTourneyStatus}
                      onChange={(e: any) => setNewTourneyStatus(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none cursor-pointer"
                    >
                      <option value="Upcoming">Upcoming</option>
                      <option value="Ongoing">Ongoing</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-end space-x-2">
                  <button 
                    id="cancel-tourney-submit"
                    type="button"
                    onClick={() => setShowAddTourneyForm(false)}
                    className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 rounded-lg transition text-xs font-bold font-display cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    id="btn-tourney-submit"
                    type="submit"
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition text-xs font-bold font-display cursor-pointer"
                  >
                    Save Tournament
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ADD MATCH SCHEDULE FORM MODAL --- */}
      <AnimatePresence>
        {showAddMatchForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative"
            >
              <div className="pb-3 border-b border-slate-800 mb-4 flex justify-between items-center">
                <h3 className="font-display font-extrabold text-white text-base flex items-center space-x-1.5">
                  <Calendar className="h-5 w-5 text-orange-500" />
                  <span>Schedule Tournament Match Fixture</span>
                </h3>
                <button 
                  id="close-match-form"
                  onClick={() => setShowAddMatchForm(false)}
                  className="text-slate-400 hover:text-slate-100 font-mono text-base font-bold select-none cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleScheduleMatch} className="space-y-4 text-xs font-sans leading-relaxed">
                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div>
                    <label className="text-slate-400 block mb-1">Batting Franchise / Team A</label>
                    <input 
                      id="new-match-team-a"
                      type="text"
                      required
                      value={newMatchTeamA}
                      onChange={(e) => setNewMatchTeamA(e.target.value)}
                      placeholder="e.g. Kolkata Knights"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Bowling Franchise / Team B</label>
                    <input 
                      id="new-match-team-b"
                      type="text"
                      required
                      value={newMatchTeamB}
                      onChange={(e) => setNewMatchTeamB(e.target.value)}
                      placeholder="e.g. Bangalore Kings"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1 font-mono">Ground/Venue</label>
                    <input 
                      id="new-match-venue"
                      type="text"
                      value={newMatchVenue}
                      onChange={(e) => setNewMatchVenue(e.target.value)}
                      placeholder="e.g. Lord's Turf Stadium"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-705 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1 font-mono">Date / Time Display</label>
                    <input 
                      id="new-match-date"
                      type="text"
                      value={newMatchDate}
                      onChange={(e) => setNewMatchDate(e.target.value)}
                      placeholder="e.g. Tomorrow, 16:00 UTC"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-705 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1 font-mono font-medium">Operational Status</label>
                    <select
                      id="new-match-status"
                      value={newMatchStatus}
                      onChange={(e: any) => setNewMatchStatus(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none cursor-pointer"
                    >
                      <option value="UPCOMING">UPCOMING Match</option>
                      <option value="LIVE">LIVE Now</option>
                      <option value="COMPLETED">COMPLETED History</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1 font-mono font-medium">Chasing Target (if LIVE)</label>
                    <input 
                      id="new-match-target"
                      type="number"
                      disabled={newMatchStatus !== "LIVE"}
                      value={newMatchTarget}
                      onChange={(e) => setNewMatchTarget(parseInt(e.target.value) || 120)}
                      className="w-full bg-slate-950 border border-slate-800 disabled:bg-slate-900 rounded-lg px-3 py-2 text-slate-100 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {newMatchStatus === "LIVE" && (
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/70 border border-slate-850 rounded-lg">
                    <div>
                      <label className="text-slate-400 block mb-1 font-mono text-[10px]">Active Striker (LIVE)</label>
                      <input 
                        id="new-match-striker"
                        type="text"
                        value={newMatchStriker}
                        onChange={(e) => setNewMatchStriker(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1 font-mono text-[10px]">Lead Bowler (LIVE)</label>
                      <input 
                        id="new-match-bowler"
                        type="text"
                        value={newMatchBowler}
                        onChange={(e) => setNewMatchBowler(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-slate-400 block mb-1 font-mono">Dynamic Status/Tally Details</label>
                  <input 
                    id="new-match-details"
                    type="text"
                    value={newMatchDetails}
                    onChange={(e) => setNewMatchDetails(e.target.value)}
                    placeholder="e.g. Match starts in two hours. Direct qualifiers in stakes."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-705 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div className="pt-4 flex justify-end space-x-2">
                  <button 
                    id="cancel-match-submit"
                    type="button"
                    onClick={() => setShowAddMatchForm(false)}
                    className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 rounded-lg transition text-xs font-bold font-display cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    id="btn-match-submit"
                    type="submit"
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition text-xs font-bold font-display cursor-pointer"
                  >
                    Schedule Match
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- PREMATCH PREVIEW editorial intelligence VIEW MODAL --- */}
      <AnimatePresence>
        {activeMatchPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-850 rounded-2xl p-6 w-full max-w-2xl my-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="pb-3 border-b border-slate-800 mb-5 flex justify-between items-start">
                <div>
                  <span className="px-2 py-0.5 bg-orange-950 text-orange-400 font-mono font-bold text-[9px] rounded uppercase tracking-wider mb-2 inline-block border border-orange-800/10">
                    ESPNcricinfo AI Intelligence Report
                  </span>
                  <h3 className="font-display font-black text-white text-base leading-tight">
                    {activeMatchPreview.teamA} vs {activeMatchPreview.teamB}
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase">
                    VENUE: {activeMatchPreview.venue} • {selectedTourney?.name}
                  </p>
                </div>
                <button 
                  id="close-preview-modal"
                  onClick={() => {
                    setActiveMatchPreview(null);
                    setPreviewData(null);
                  }}
                  className="text-slate-400 hover:text-slate-100 font-mono text-base font-bold select-none cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>

              {/* Loader */}
              {previewLoading && (
                <div className="py-16 text-center space-y-4">
                  <div className="h-10 w-10 border-4 border-t-orange-500 border-r-transparent border-slate-805 rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs font-mono text-orange-400 animate-pulse">Running Gemini pre-match scenario intelligence models ...</p>
                </div>
              )}

              {/* Data Content */}
              {!previewLoading && (
                <div className="space-y-5 text-slate-300 font-sans text-xs sm:text-sm leading-relaxed">
                  
                  {previewData ? (
                    <>
                      {/* Editorial Headline */}
                      <div className="border-l-4 border-orange-500 pl-3 py-1">
                        <h4 className="text-base font-display font-extrabold text-white italic leading-tight">
                          &ldquo;{previewData.previewHeadline}&rdquo;
                        </h4>
                      </div>

                      {/* Editorial Paragraphs Text */}
                      <div className="space-y-3 font-serif text-slate-300 text-xs sm:text-xs leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-850">
                        {previewData.editorialText?.split('\n\n').map((pStr: string, idx: number) => (
                          <p key={idx}>{pStr}</p>
                        ))}
                      </div>

                      {/* Key battles indicators */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800 font-sans">
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                          <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">{activeMatchPreview.teamA} Spot Light Player</span>
                          <p className="text-slate-200 text-xs mt-1 leading-normal font-medium">{previewData.keyPlayerA}</p>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                          <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">{activeMatchPreview.teamB} Spot Light Player</span>
                          <p className="text-slate-200 text-xs mt-1 leading-normal font-medium">{previewData.keyPlayerB}</p>
                        </div>
                      </div>

                      {/* Expected playing 11 */}
                      <div className="space-y-2 pt-3 border-t border-slate-800">
                        <span className="text-[10px] font-mono text-slate-400 block uppercase">Projected Lineups Playing XI</span>
                        <div className="grid grid-cols-2 gap-4 text-[11px] font-mono">
                          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-850">
                            <span className="text-orange-400 font-bold block mb-1.5 border-b border-slate-800 pb-1">{activeMatchPreview.teamA}</span>
                            <ul className="space-y-1 text-slate-300 list-decimal pl-4.5 cursor-default">
                              {previewData.expectedPlayingXI?.teamA?.map((p: string, pIdx: number) => (
                                <li key={pIdx}>
                                  <span 
                                    className="hover:underline hover:text-amber-400 cursor-pointer transition" 
                                    onClick={() => handleOpenPlayerProfile(p)}
                                  >
                                    {p}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-850">
                            <span className="text-orange-400 font-bold block mb-1.5 border-b border-slate-800 pb-1">{activeMatchPreview.teamB}</span>
                            <ul className="space-y-1 text-slate-300 list-decimal pl-4.5 cursor-default">
                              {previewData.expectedPlayingXI?.teamB?.map((p: string, pIdx: number) => (
                                <li key={pIdx}>
                                  <span 
                                    className="hover:underline hover:text-amber-400 cursor-pointer transition" 
                                    onClick={() => handleOpenPlayerProfile(p)}
                                  >
                                    {p}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Projection footer */}
                      <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-[10px] font-mono text-slate-500">
                        <div className="flex items-center space-x-1.5">
                          <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
                          <span>Win Projection Probability:</span>
                          <span className="text-emerald-400 font-bold">{previewData.confidenceScore}</span>
                        </div>
                        <span>PROMPT ENGINE: {previewData.aiPowered ? "Active (Gemini 3.5)" : "Active (Offline Rules)"}</span>
                      </div>

                    </>
                  ) : (
                    <div className="text-center text-rose-500 py-6 font-mono text-xs">
                      Failed to parse intelligence report correctly. Please try again.
                    </div>
                  )}

                  <div className="pt-3 flex justify-end">
                    <button 
                      id="close-preview-footer"
                      onClick={() => {
                        setActiveMatchPreview(null);
                        setPreviewData(null);
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition text-xs font-bold font-display cursor-pointer"
                    >
                      Dismiss Report
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Role Restriction warning modal with elevate options */}
      <AnimatePresence>
        {roleWarnMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 text-center"
            >
              <div className="mx-auto w-12 h-12 bg-orange-950/40 text-orange-400 border border-orange-850/20 rounded-full flex items-center justify-center">
                <span className="text-lg">⚠️</span>
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-black text-white text-base">Authorized Organizer Only</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {roleWarnMessage}
                </p>
              </div>
              
              <div className="pt-3 flex flex-col gap-2">
                <button
                  id="btn-elevate-role-warn"
                  onClick={() => {
                    if (onElevateRole) onElevateRole();
                    setRoleWarnMessage(null);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-bold text-xs py-2.5 rounded-lg transition cursor-pointer"
                >
                  🔑 Elevate Account to Match Organizer (Free)
                </button>
                <button
                  id="btn-close-role-warn"
                  onClick={() => setRoleWarnMessage(null)}
                  className="w-full bg-slate-840 hover:bg-slate-750 text-slate-300 font-sans font-bold text-xs py-2 rounded-lg transition cursor-pointer"
                >
                  Dismiss warning
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- EXTRACTION: DYNAMIC POST-MATCH SUMMARY VIEW MODAL --- */}
      <AnimatePresence>
        {activeMatchSummary && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-805 rounded-2xl p-6 w-full max-w-2xl my-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="pb-3 border-b border-slate-800 mb-4 flex justify-between items-start">
                <div>
                  <span className="px-2 py-0.5 bg-orange-950 text-orange-400 font-mono font-bold text-[9px] rounded uppercase tracking-wider mb-2 inline-block border border-orange-850/20">
                    GullyPros Post-Match Sportsroom
                  </span>
                  <h3 className="font-display font-black text-white text-sm sm:text-base leading-tight text-left">
                    {activeMatchSummary.teamA} vs {activeMatchSummary.teamB} (Post-Match analysis)
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase text-left">
                    VENUE: {activeMatchSummary.venue} • {selectedTourney?.name}
                  </p>
                </div>
                <button 
                  id="close-summary-modal"
                  onClick={() => {
                    setActiveMatchSummary(null);
                    setSummaryData(null);
                  }}
                  className="text-slate-400 hover:text-slate-100 font-mono text-base font-bold select-none cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>

              {/* Loader */}
              {summaryLoading && (
                <div className="py-16 text-center space-y-4">
                  <div className="h-10 w-10 border-4 border-t-orange-500 border-r-transparent border-slate-800 rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs font-mono text-orange-400 animate-pulse">Consulting sports columnists & generating editorial summary...</p>
                </div>
              )}

              {/* Summary Content */}
              {!summaryLoading && (
                <div className="space-y-5 text-slate-300 font-sans text-xs sm:text-sm leading-relaxed text-left">
                  {summaryData ? (
                    <>
                      {/* Newspaper Headline style */}
                      <div className="border-l-4 border-orange-500 pl-3 py-1 bg-slate-950/40 rounded-r-lg p-2">
                        <span className="text-[9px] font-mono text-orange-400 font-bold uppercase tracking-widest block mb-0.5">WISDEN EXPERT WRITEPUP</span>
                        <h4 className="text-sm sm:text-base font-display font-extrabold text-white italic leading-tight uppercase font-black">
                          &ldquo;{summaryData.headline}&rdquo;
                        </h4>
                      </div>

                      {/* Match Story narrative */}
                      <div className="space-y-3 font-serif text-slate-300 text-xs sm:text-xs leading-relaxed bg-slate-955 p-4 rounded-xl border border-slate-850">
                        {summaryData.matchStory?.split('\n\n').map((pStr: string, idx: number) => (
                          <p key={idx}>{pStr}</p>
                        ))}
                      </div>

                      {/* Honor Rolls */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 font-sans">
                        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-850 relative overflow-hidden">
                          <div className="absolute right-2 top-2 text-[20px] opacity-10">🏏</div>
                          <span className="text-[10px] font-mono text-orange-400 block uppercase font-bold border-b border-slate-830 pb-1 mb-2">🔥 Batting Performance</span>
                          <ul className="space-y-1.5 text-xs text-slate-300 select-none">
                            {summaryData.batsmanHonorRoll && Object.entries(summaryData.batsmanHonorRoll).map(([k, val]: any) => (
                              <li key={k} className="flex justify-between items-center bg-slate-900/50 p-1.5 rounded font-mono">
                                <span className="hover:underline cursor-pointer text-slate-200" onClick={() => handleOpenPlayerProfile(val.split(' - ')[0])}>
                                  {val.split(' - ')[0]}
                                </span>
                                <span className="text-orange-400 font-bold">{val.split(' - ')[1] || ""}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-850 relative overflow-hidden">
                          <div className="absolute right-2 top-2 text-[20px] opacity-10">⚾</div>
                          <span className="text-[10px] font-mono text-orange-400 block uppercase font-bold border-b border-slate-830 pb-1 mb-2">⭐ Bowling Excellence</span>
                          <ul className="space-y-1.5 text-xs text-slate-300 select-none">
                            {summaryData.bowlerHonorRoll && Object.entries(summaryData.bowlerHonorRoll).map(([k, val]: any) => (
                              <li key={k} className="flex justify-between items-center bg-slate-900/50 p-1.5 rounded font-mono">
                                <span className="hover:underline cursor-pointer text-slate-200" onClick={() => handleOpenPlayerProfile(val.split(' - ')[0])}>
                                  {val.split(' - ')[0]}
                                </span>
                                <span className="text-orange-400 font-bold">{val.split(' - ')[1] || ""}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Turning Point */}
                      <div className="bg-amber-955/20 border border-amber-500/15 p-3.5 rounded-xl">
                        <div className="flex items-center space-x-1.5 mb-1.5">
                          <TrendingUp className="h-4 w-4 text-amber-400" />
                          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">⚡ Match-Defining Turning Point</span>
                        </div>
                        <p className="text-xs text-slate-200 leading-normal font-sans italic">
                          {summaryData.turningPoint}
                        </p>
                      </div>

                      {/* Crowd response & metadata status */}
                      <div className="border-t border-slate-805 pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] font-mono text-slate-500 gap-2">
                        <p className="italic text-slate-400 leading-normal">
                          <b>Atmosphere:</b> {summaryData.crowdAtmosphere}
                        </p>
                        <span className="shrink-0 bg-slate-955 px-2 py-0.5 rounded border border-slate-800 text-[9px]">
                          ENGINE: {summaryData.aiPowered ? "Gemini Models" : "Fallback Engine"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-rose-500 py-6 font-mono text-xs">
                      Post-match summary failed to load. Please try again.
                    </div>
                  )}

                  <div className="pt-3 flex justify-end">
                    <button 
                      id="close-summary-footer"
                      onClick={() => {
                        setActiveMatchSummary(null);
                        setSummaryData(null);
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition text-xs font-bold font-display cursor-pointer"
                    >
                      Dismiss Summary
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- EXTRACTION: ATHLETE PROFESSIONAL CARD / PLAYER PROFILE MODAL --- */}
      <AnimatePresence>
        {activePlayerProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/90 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md my-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button right off top corner */}
              <button 
                id="close-player-profile"
                onClick={() => setActivePlayerProfile(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 font-mono text-base font-bold select-none cursor-pointer p-1"
              >
                ✕
              </button>

              {/* Loader */}
              {playerLoading && (
                <div className="py-16 text-center space-y-4">
                  <div className="h-10 w-10 border-4 border-t-orange-500 border-r-transparent border-slate-805 rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs font-mono text-orange-400 animate-pulse">Retrieving professional player database statistics...</p>
                </div>
              )}

              {/* Profile Card display */}
              {!playerLoading && (
                <div className="space-y-4 pt-2 text-left">
                  
                  {/* Decorative Sports Avatar Header */}
                  <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-805 rounded-2xl p-4 flex items-center space-x-4 relative overflow-hidden">
                    <div className="w-14 h-14 bg-gradient-to-tr from-orange-600 to-amber-500 rounded-full flex items-center justify-center font-display font-black text-white text-xl uppercase shadow-md shrink-0">
                      {activePlayerProfile.name?.slice(0, 2) || "PL"}
                    </div>
                    <div>
                      <span className="px-1.5 py-0.5 bg-orange-950/80 text-orange-400 font-mono font-bold text-[8px] rounded uppercase tracking-widest border border-orange-500/10">
                        {activePlayerProfile.role || "Professional Athlete"}
                      </span>
                      <h4 className="font-display font-black text-white text-base mt-1 leading-none">
                        {activePlayerProfile.name}
                      </h4>
                      <span className="text-[9.5px] font-mono text-slate-500 block mt-1.5">
                        STATUS: {activePlayerProfile.careerStatus || "Active Roster"}
                      </span>
                    </div>
                    <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-orange-500/5 to-transparent pointer-events-none"></div>
                  </div>

                  {/* High Performance Athletic Stats Board */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 block mb-1">PRO ATHLETIC RECORD SUMMARY</span>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                        <span className="text-[9px] text-slate-500 block uppercase font-bold">Matches</span>
                        <span className="text-white font-bold">{activePlayerProfile.internationalStats?.matches || "74"}</span>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                        <span className="text-[9px] text-slate-500 block uppercase font-bold">Runs Scored</span>
                        <span className="text-orange-400 font-bold">{activePlayerProfile.internationalStats?.runs || "2345"}</span>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                        <span className="text-[9px] text-slate-500 block uppercase font-bold">Batting Avg</span>
                        <span className="text-amber-400 font-bold">{activePlayerProfile.internationalStats?.battingAvg || "38.2"}</span>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                        <span className="text-[9px] text-slate-500 block uppercase font-bold">Strike Rate</span>
                        <span className="text-white font-bold">{activePlayerProfile.internationalStats?.strikeRate || "136.1"}</span>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                        <span className="text-[9px] text-slate-500 block uppercase font-bold font-bold">Wickets</span>
                        <span className="text-orange-400 font-bold">{activePlayerProfile.internationalStats?.wickets || "12"}</span>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-850">
                        <span className="text-[9px] text-slate-500 block uppercase font-bold font-bold">Economy</span>
                        <span className="text-amber-400 font-bold">{activePlayerProfile.internationalStats?.economy || "7.8"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Biography */}
                  <div className="space-y-1 bg-slate-955/40 p-3 rounded-lg border border-slate-850">
                    <span className="text-[9.5px] uppercase font-mono tracking-wider font-bold text-slate-500 block">TACTICAL PLAYER DOSSIER</span>
                    <p className="text-xs text-slate-300 leading-relaxed italic">
                      &ldquo;{activePlayerProfile.bio}&rdquo;
                    </p>
                  </div>

                  {/* Core Technical Strengths */}
                  <div className="space-y-1.5 font-sans">
                    <span className="text-[9.5px] uppercase font-mono tracking-wider font-bold text-slate-500 block">CORE TECHNICAL STRENGTHS</span>
                    <ul className="space-y-1 text-[11px] list-disc pl-4 text-slate-300">
                      {activePlayerProfile.strengths?.map((st: string, idx: number) => (
                        <li key={idx} className="leading-snug">{st}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Core Vulnerabilities */}
                  <div className="space-y-1.5 font-sans">
                    <span className="text-[9.5px] uppercase font-mono tracking-wider font-bold text-slate-400 block">VULNERABILITY AREAS</span>
                    <ul className="space-y-1 text-[11px] list-disc pl-4 text-slate-400">
                      {activePlayerProfile.weaknesses?.map((wk: string, idx: number) => (
                        <li key={idx} className="leading-snug">{wk}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Comparison Badge */}
                  <div className="bg-slate-955 p-3 rounded-xl border border-slate-850 flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-500 font-bold uppercase">STYLE MIMICS LEGEND:</span>
                    <span className="text-amber-400 font-bold tracking-tight bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                      👑 {activePlayerProfile.legendComparison || "Rahul Dravid"}
                    </span>
                  </div>

                  {/* Dismiss footer */}
                  <div className="pt-2 border-t border-slate-800 flex justify-end">
                    <button 
                      id="close-profile-footer"
                      onClick={() => setActivePlayerProfile(null)}
                      className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition text-xs font-bold font-display cursor-pointer"
                    >
                      Dismiss Profile Card
                    </button>
                  </div>

                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
