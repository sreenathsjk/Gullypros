import React, { useState, useEffect } from "react";
import { 
  Camera, 
  Send, 
  HelpCircle, 
  Heart, 
  Tv, 
  Trophy, 
  User, 
  Info, 
  Volume2, 
  VolumeX,
  Music,
  Sparkles, 
  RefreshCcw, 
  Settings, 
  Compass, 
  Activity, 
  Globe 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip as ChartTooltip, 
  CartesianGrid, 
  ReferenceLine 
} from "recharts";
import { CommentaryRequest, PredictionRequest, Tournament, INITIAL_TOURNAMENTS } from "./types";
import TournamentsTab from "./components/TournamentsTab";
import CommunityTab from "./components/CommunityTab";
import ProfileTab from "./components/ProfileTab";
import { cricketBgm } from "./utils/audio";

export interface RunRateDataPoint {
  ballLabel: string;
  score: number;
  runRate: number;
  wickets: number;
  overNum: number;
}

export function generateRunRateHistory(
  targetScore: number,
  targetWickets: number,
  targetOvers: number,
  targetBalls: number
): RunRateDataPoint[] {
  const points: RunRateDataPoint[] = [];
  
  // Start with 0.0
  points.push({
    ballLabel: "0.0",
    score: 0,
    runRate: 0,
    wickets: 0,
    overNum: 0
  });

  const totalBalls = (targetOvers * 6) + targetBalls;
  if (totalBalls <= 0) {
    return points;
  }

  let currentScore = 0;
  let currentWickets = 0;

  for (let b = 1; b <= totalBalls; b++) {
    const progress = b / totalBalls;
    const targetRunsAtBall = progress * targetScore;
    let approxScore = Math.round(targetRunsAtBall + (Math.sin(progress * Math.PI * 4) * Math.min(10, targetScore * 0.1)));
    if (approxScore < currentScore) {
      approxScore = currentScore;
    }
    if (b === totalBalls) {
      approxScore = targetScore;
    }
    currentScore = approxScore;

    const approxWickets = Math.min(targetWickets, Math.floor(progress * targetWickets * 1.2));
    if (b === totalBalls) {
      currentWickets = targetWickets;
    } else {
      currentWickets = approxWickets;
    }

    const ov = Math.floor(b / 6);
    const bl = b % 6;
    const overNum = ov + (bl / 6);
    const runRate = overNum > 0 ? parseFloat((currentScore / overNum).toFixed(2)) : 0;

    points.push({
      ballLabel: `${ov}.${bl}`,
      score: currentScore,
      runRate,
      wickets: currentWickets,
      overNum
    });
  }

  return points;
}

export default function App() {
  // Free Signup/Signin and Authentication states
  const [userSession, setUserSession] = useState<{
    name: string;
    email: string;
    role: "spectator" | "conducting_person";
  } | null>(() => {
    const saved = localStorage.getItem("cricketverse_auth_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [authTab, setAuthTab] = useState<"signin" | "signup">("signup");
  const [authName, setAuthName] = useState<string>("");
  const [authEmail, setAuthEmail] = useState<string>("");
  const [authRole, setAuthRole] = useState<"spectator" | "conducting_person">("spectator");
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authTab === "signup") {
      if (!authName || !authEmail) return;
      const session = {
        name: authName.trim(),
        email: authEmail.trim(),
        role: authRole
      };
      setAuthSuccessMsg(`Welcome ${session.name}! Registering free access profile...`);
      setTimeout(() => {
        localStorage.setItem("cricketverse_auth_user", JSON.stringify(session));
        setUserSession(session);
        setAuthSuccessMsg(null);
      }, 1200);
    } else {
      if (!authEmail) return;
      const session = {
        name: authEmail.split("@")[0] || "Authorized Fan",
        email: authEmail.trim(),
        role: authRole
      };
      setAuthSuccessMsg(`Authenticating free user credentials...`);
      setTimeout(() => {
        localStorage.setItem("cricketverse_auth_user", JSON.stringify(session));
        setUserSession(session);
        setAuthSuccessMsg(null);
      }, 1000);
    }
  };

  const handleGuestAccess = (role: "spectator" | "conducting_person") => {
    const session = {
      name: role === "conducting_person" ? "Official Scorer" : "Anonymous Fan",
      email: role === "conducting_person" ? "scorer@gullypros.com" : "fan@gullypros.com",
      role
    };
    setAuthSuccessMsg(`Creating complimentary guest token...`);
    setTimeout(() => {
      localStorage.setItem("cricketverse_auth_user", JSON.stringify(session));
      setUserSession(session);
      setAuthSuccessMsg(null);
    }, 800);
  };

  // Navigation Tabs (Instagram 4-Button Footer structure)
  const [activeTab, setActiveTab] = useState<"live" | "upcoming" | "community" | "profile">("live");
  const [liveSubTab, setLiveSubTab] = useState<"scorer" | "commentary" | "hawkEye" | "aiCaptain">("scorer");

  // Shared tournaments state
  const [tournaments, setTournaments] = useState<Tournament[]>(() => {
    const saved = localStorage.getItem("cricketverse_tournaments");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Exclude system mock tournaments from previously saved data
        const list = parsed.filter((t: any) => t && t.id && !["tourney-1", "tourney-2", "tourney-3"].includes(t.id));
        return list.length > 0 ? list : INITIAL_TOURNAMENTS;
      } catch (e) {
        return INITIAL_TOURNAMENTS;
      }
    }
    return INITIAL_TOURNAMENTS;
  });

  const [selectedTourneyId, setSelectedTourneyId] = useState<string>(() => {
    const saved = localStorage.getItem("cricketverse_tournaments");
    if (saved) {
      try {
        const parsed = JSON.parse(saved).filter((t: any) => t && t.id && !["tourney-1", "tourney-2", "tourney-3"].includes(t.id));
        if (parsed.length > 0) return parsed[0].id;
      } catch (e) {}
    }
    return INITIAL_TOURNAMENTS[0].id;
  });

  const [activeLiveTourneyId, setActiveLiveTourneyId] = useState<string | null>(() => {
    return localStorage.getItem("cricketverse_active_tourney_id") || "tourney-tatacup-2026";
  });
  const [activeLiveMatchId, setActiveLiveMatchId] = useState<string | null>(() => {
    return localStorage.getItem("cricketverse_active_match_id") || "match-mumbai-live";
  });
  const [selectedLiveMatchId, setSelectedLiveMatchId] = useState<string | null>(() => {
    return localStorage.getItem("gullypros_selected_live_match_id") || null;
  });

  // Scoring Simulator State (Interactive Active Scorer panel)
  const [teamA, setTeamA] = useState<string>("India Royals");
  const [teamB, setTeamB] = useState<string>("Australia Stars");
  const [score, setScore] = useState<number>(142);
  const [wickets, setWickets] = useState<number>(3);
  const [overs, setOvers] = useState<number>(16);
  const [balls, setBalls] = useState<number>(4);
  const [target, setTarget] = useState<number>(178);
  const [striker, setStriker] = useState<string>("Virat Kohli");
  const [bowler, setBowler] = useState<string>("Jasprit Bumrah");
  const [commentatorStyle, setCommentatorStyle] = useState<string>("ravi");
  const [matchStatus, setMatchStatus] = useState<string>("Royalists chasing target score of 178.");

  // --- ROSTER AND SCOREBOARD UPGRADE STATES ---
  const [showRosterSetup, setShowRosterSetup] = useState<boolean>(false);
  const [teamAPlayers, setTeamAPlayers] = useState<string[]>([]);
  const [teamBPlayers, setTeamBPlayers] = useState<string[]>([]);
  const [nonStriker, setNonStriker] = useState<string>("Rohit Sharma");
  
  // Custom interactive popup dialogues
  const [nextBowlerPromptOpen, setNextBowlerPromptOpen] = useState<boolean>(false);
  const [dismissalModalOpen, setDismissalModalOpen] = useState<boolean>(false);
  const [nextBatsmanSelectionOpen, setNextBatsmanSelectionOpen] = useState<boolean>(false);
  
  // Dismissal setup state
  const [dismissalType, setDismissalType] = useState<string>("Caught Out");
  const [dismissedBatsman, setDismissedBatsman] = useState<string>("");
  const [dismissalFielder, setDismissalFielder] = useState<string>("");

  // Detailed player metrics dictionaries
  const [batsmanScores, setBatsmanScores] = useState<Record<string, { runs: number, balls: number, dots: number, fours: number, sixes: number, isOut: boolean, dismissalText?: string }>>({});
  const [bowlerStats, setBowlerStats] = useState<Record<string, { overs: number, balls: number, runs: number, wickets: number, maidens: number }>>({});
  const [extras, setExtras] = useState({ wides: 2, noBalls: 1, byes: 1, legByes: 2 });

  const [runRateHistory, setRunRateHistory] = useState<RunRateDataPoint[]>(() => {
    const saved = localStorage.getItem("cricketverse_run_rate_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return generateRunRateHistory(142, 3, 16, 4);
  });

  useEffect(() => {
    localStorage.setItem("cricketverse_run_rate_history", JSON.stringify(runRateHistory));
  }, [runRateHistory]);

  const [chartMode, setChartMode] = useState<"runRate" | "cumulative">("runRate");
  const [summaryExpanded, setSummaryExpanded] = useState<boolean>(false);
  const [boundaryPopup, setBoundaryPopup] = useState<number | null>(null);

  useEffect(() => {
    if (boundaryPopup !== null) {
      const timer = setTimeout(() => {
        setBoundaryPopup(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [boundaryPopup]);

  // Initialize rosters and statistics on component load automatically
  useEffect(() => {
    if (teamAPlayers.length === 0 || teamBPlayers.length === 0) {
      const rosterA = getPrepopulatedRoster(teamA);
      const rosterB = getPrepopulatedRoster(teamB);
      setTeamAPlayers(rosterA);
      setTeamBPlayers(rosterB);
      
      const stName = rosterA[0] || "Virat Kohli";
      const bName = rosterB[0] || "Jasprit Bumrah";
      setStriker(stName);
      setNonStriker(rosterA[1] || "Rohit Sharma");
      setBowler(bName);

      initializeStatsForMatch(score, wickets, stName, bName, rosterA, rosterB, overs, balls);
    }
  }, [teamA, teamB]);

  const activeTourney = tournaments.find(t => t.id === activeLiveTourneyId) || 
                        tournaments.find(t => t.matches.some(m => m.id === activeLiveMatchId));
  const isMatchOwner = !activeTourney || !activeTourney.creatorEmail || (userSession?.email === activeTourney.creatorEmail);
  const canScoreActiveMatch = !!userSession && userSession.role === "conducting_person" && isMatchOwner;

  // Utility to map default squad lists based on team titles
  function getPrepopulatedRoster(teamName: string): string[] {
    const norm = teamName.toLowerCase();
    if (norm.includes("india") || norm.includes("royal") || norm.includes("chennai") || norm.includes("mumbai") || norm.includes("ind")) {
      return [
        "Rohit Sharma",
        "Virat Kohli",
        "Shubman Gill",
        "Suryakumar Yadav",
        "Lokesh Rahul",
        "Hardik Pandya",
        "Ravindra Jadeja",
        "Ravichandran Ashwin",
        "Kuldeep Yadav",
        "Jasprit Bumrah",
        "Mohammed Siraj"
      ];
    }
    if (norm.includes("australia") || norm.includes("star") || norm.includes("king") || norm.includes("aus")) {
      return [
        "David Warner",
        "Travis Head",
        "Mitchell Marsh",
        "Steve Smith",
        "Glenn Maxwell",
        "Marcus Stoinis",
        "Matthew Wade",
        "Pat Cummins",
        "Mitchell Starc",
        "Adam Zampa",
        "Josh Hazlewood"
      ];
    }
    if (norm.includes("england") || norm.includes("elite")) {
      return [
        "Jos Buttler",
        "Phil Salt",
        "Will Jacks",
        "Jonny Bairstow",
        "Harry Brook",
        "Liam Livingstone",
        "Moeen Ali",
        "Sam Curran",
        "Jofra Archer",
        "Adil Rashid",
        "Mark Wood"
      ];
    }
    if (norm.includes("pakistan") || norm.includes("falcon")) {
      return [
        "Babar Azam",
        "Mohammad Rizwan",
        "Saim Ayub",
        "Fakhar Zaman",
        "Iftikhar Ahmed",
        "Shadab Khan",
        "Imad Wasim",
        "Shaheen Afridi",
        "Naseem Shah",
        "Haris Rauf",
        "Mohammad Amir"
      ];
    }
    return [
      "Kane Williamson",
      "Devon Conway",
      "Rachin Ravindra",
      "Daryl Mitchell",
      "Tom Latham",
      "Glenn Phillips",
      "Mark Chapman",
      "Mitchell Santner",
      "Matt Henry",
      "Tim Southee",
      "Trent Boult"
    ];
  }

  // Set up detailed player scores distributed from basic scorecard inputs
  const initializeStatsForMatch = (
    scoreVal: number, 
    wicketsVal: number, 
    strikerName: string, 
    bowlerName: string,
    teamAPers: string[],
    teamBPers: string[],
    oversVal?: number,
    ballsVal?: number
  ) => {
    const bats: typeof batsmanScores = {};
    teamAPers.forEach((p) => {
      bats[p] = { runs: 0, balls: 0, dots: 0, fours: 0, sixes: 0, isOut: false };
    });

    const bowls: typeof bowlerStats = {};
    teamBPers.forEach((p) => {
      bowls[p] = { overs: 0, balls: 0, runs: 0, wickets: 0, maidens: 0 };
    });

    // Establish non-striker
    const nonStrikerName = teamAPers.find(p => p !== strikerName) || "Rohit Sharma";
    setNonStriker(nonStrikerName);

    const oVal = (oversVal !== undefined) ? oversVal : overs;
    const bVal = (ballsVal !== undefined) ? ballsVal : balls;

    // If active score is initialized, hydrate players realistically
    if (scoreVal > 0) {
      const strikerRuns = Math.min(Math.floor(scoreVal * 0.45), scoreVal);
      const strikerBalls = Math.floor(strikerRuns * 0.8) + 3;
      bats[strikerName] = { 
        runs: strikerRuns, 
        balls: Math.max(1, strikerBalls), 
        dots: Math.floor(strikerBalls * 0.3), 
        fours: Math.floor(strikerRuns / 11) + 1, 
        sixes: Math.floor(strikerRuns / 22), 
        isOut: false 
      };

      const remForNonStriker = scoreVal - strikerRuns;
      const nonStrikerRuns = Math.min(Math.floor(remForNonStriker * 0.35), remForNonStriker);
      const nonStrikerBalls = Math.floor(nonStrikerRuns * 0.9) + 2;
      bats[nonStrikerName] = {
        runs: nonStrikerRuns,
        balls: Math.max(1, nonStrikerBalls),
        dots: Math.floor(nonStrikerBalls * 0.4),
        fours: Math.floor(nonStrikerRuns / 12),
        sixes: Math.floor(nonStrikerRuns / 32),
        isOut: false
      };

      // Set retired/dismissed players for previous wickets
      let outsCreated = 0;
      teamAPers.forEach((p) => {
        if (p !== strikerName && p !== nonStrikerName && outsCreated < wicketsVal) {
          bats[p] = {
            runs: Math.floor(Math.random() * 20) + 4,
            balls: Math.floor(Math.random() * 15) + 6,
            dots: 5,
            fours: 1,
            sixes: 0,
            isOut: true,
            dismissalText: `c. Wade b. ${bowlerName}`
          };
          outsCreated++;
        }
      });

      // Hydrate bowler figures
      bowls[bowlerName] = {
        overs: oVal,
        balls: bVal,
        runs: Math.min(scoreVal, Math.floor(scoreVal * 0.55)),
        wickets: Math.max(0, wicketsVal - 1),
        maidens: 0
      };
    }

    setBatsmanScores(bats);
    setBowlerStats(bowls);
    setExtras({ wides: Math.floor(scoreVal * 0.05), noBalls: Math.floor(scoreVal * 0.02), byes: 1, legByes: 2 });
    setRunRateHistory(generateRunRateHistory(scoreVal, wicketsVal, oVal, bVal));
  };

  const loadMatchIntoDashboard = (matchId: string, tournamentId: string) => {
    const targetT = tournaments.find(t => t.id === tournamentId);
    if (!targetT) return;
    const m = targetT.matches.find(match => match.id === matchId);
    if (!m) return;

    setTeamA(m.teamA);
    setTeamB(m.teamB);
    
    const rosterA = getPrepopulatedRoster(m.teamA);
    const rosterB = getPrepopulatedRoster(m.teamB);
    setTeamAPlayers(rosterA);
    setTeamBPlayers(rosterB);
    
    const stName = m.activeStriker && rosterA.includes(m.activeStriker) ? m.activeStriker : (rosterA[0] || "Virat Kohli");
    const bName = m.activeBowler && rosterB.includes(m.activeBowler) ? m.activeBowler : (rosterB[0] || "Jasprit Bumrah");
    
    setStriker(stName);
    setBowler(bName);

    const isOwner = !targetT.creatorEmail || (userSession?.email === targetT.creatorEmail);
    const canScoreMatch = userSession?.role === "conducting_person" && isOwner;

    // Load score, wickets, overs, balls
    const finalScore = canScoreMatch ? 0 : (m.scoreA ?? 0);
    const finalWickets = canScoreMatch ? 0 : (m.wicketsA ?? 0);
    const finalOvers = canScoreMatch ? 0 : (m.oversA ? Math.floor(parseFloat(m.oversA)) : 0);
    const finalBalls = canScoreMatch ? 0 : (m.oversA ? Math.round((parseFloat(m.oversA) - Math.floor(parseFloat(m.oversA))) * 10) : 0);

    setScore(finalScore);
    setWickets(finalWickets);
    setOvers(finalOvers);
    setBalls(finalBalls);
    setTarget(m.target || 120);

    if (canScoreMatch) {
      setCommentaryList([]);
      setRunRateHistory([]);
      setMatchStatus(`Organizers preparing match. Team players configuration underway for ${m.teamA} vs ${m.teamB}.`);
      setShowRosterSetup(true);
    } else {
      setMatchStatus(m.details);
      setShowRosterSetup(false);
    }

    setActiveLiveTourneyId(tournamentId);
    setActiveLiveMatchId(matchId);
    setSelectedLiveMatchId(matchId);
    
    localStorage.setItem("cricketverse_active_tourney_id", tournamentId);
    localStorage.setItem("cricketverse_active_match_id", matchId);
    localStorage.setItem("gullypros_selected_live_match_id", matchId);

    // Assign current user as creator if tournament has none
    setTournaments(prev => {
      const tIdx = prev.findIndex(t => t.id === tournamentId);
      if (tIdx > -1 && !prev[tIdx].creatorEmail) {
        const cloned = [...prev];
        cloned[tIdx] = {
          ...cloned[tIdx],
          creatorEmail: userSession?.email || ""
        };
        localStorage.setItem("cricketverse_tournaments", JSON.stringify(cloned));
        return cloned;
      }
      return prev;
    });

    initializeStatsForMatch(
      finalScore,
      finalWickets,
      stName,
      bName,
      rosterA,
      rosterB,
      finalOvers,
      finalBalls
    );
  };

  // State setters to mutate individual stats dynamically
  const updateBatsmanStats = (
    name: string, 
    runs: number, 
    isOut: boolean, 
    dismissalText?: string,
    isNoBall: boolean = false
  ) => {
    setBatsmanScores(prev => {
      const current = prev[name] || { runs: 0, balls: 0, dots: 0, fours: 0, sixes: 0, isOut: false };
      return {
        ...prev,
        [name]: {
          runs: current.runs + runs,
          balls: current.balls + 1,
          dots: current.dots + (runs === 0 ? 1 : 0),
          fours: current.fours + (runs === 4 ? 1 : 0),
          sixes: current.sixes + (runs === 6 ? 1 : 0),
          isOut: isOut || current.isOut,
          dismissalText: dismissalText || current.dismissalText
        }
      };
    });
  };

  const updateBowlerStats = (
    name: string, 
    runsAdded: number, 
    isLegalBall: boolean, 
    isWicket: boolean
  ) => {
    setBowlerStats(prev => {
      const current = prev[name] || { overs: 0, balls: 0, runs: 0, wickets: 0, maidens: 0 };
      let ballsNum = current.balls;
      let oversNum = current.overs;
      
      if (isLegalBall) {
        if (ballsNum === 5) {
          ballsNum = 0;
          oversNum += 1;
        } else {
          ballsNum += 1;
        }
      }
      
      return {
        ...prev,
        [name]: {
          overs: oversNum,
          balls: ballsNum,
          runs: current.runs + runsAdded,
          wickets: current.wickets + (isWicket ? 1 : 0),
          maidens: current.maidens
        }
      };
    });
  };


  // Commentary Logs State
  const [commentaryList, setCommentaryList] = useState<Array<{
    ball: string;
    text: string;
    event: string;
    style: string;
    aiPowered: boolean;
  }>>([]);
  const [commentaryLoading, setCommentaryLoading] = useState<boolean>(false);

  // Audio Control states (Speaker on/off and Cricket Stadium BGM volume & active status)
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);
  const [bgmActive, setBgmActive] = useState<boolean>(true);
  const [bgmVolume, setBgmVolume] = useState<number>(0.15);

  // Auto-play ambient Cricket BGM when the user first interacts with the page
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (bgmActive && !cricketBgm.isPlaying()) {
        cricketBgm.start();
      }
      // Remove listeners once initial interaction registers
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };

    window.addEventListener("click", handleFirstInteraction);
    window.addEventListener("keydown", handleFirstInteraction);
    window.addEventListener("touchstart", handleFirstInteraction);

    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, [bgmActive]);

  // Synchronize component state with BGM engine volume
  useEffect(() => {
    cricketBgm.setVolume(bgmVolume);
  }, [bgmVolume]);

  // Read synthesized text using HTML5 browser SpeechSynthesis
  const speakText = (text: string) => {
    if (!isSpeakerOn || typeof window === "undefined" || !window.speechSynthesis) return;
    
    try {
      window.speechSynthesis.cancel(); // Cancel any current talking speaker
      
      // Clean bracket prefixes for pronunciation
      const cleanText = text.replace(/\[.*?\]/g, "").trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      if (commentatorStyle === "ravi") {
        utterance.rate = 1.15; // Fast, passionate
        utterance.pitch = 1.0;
      } else if (commentatorStyle === "harsha") {
        utterance.rate = 0.95; // Calm, editorial
        utterance.pitch = 1.05;
      } else if (commentatorStyle === "tony") {
        utterance.rate = 1.1; // Sizzling classic Australian tone
        utterance.pitch = 0.95;
      }
      
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech Synthesis engine exception:", e);
    }
  };

  // Predictions Probability State (Client/Server hybrid metrics)
  const [winProbBatting, setWinProbBatting] = useState<number>(64);
  const [winProbBowling, setWinProbBowling] = useState<number>(36);
  const [nextBallProbs, setNextBallProbs] = useState({
    dotBall: 25,
    singleDouble: 45,
    boundary: 22,
    wicket: 8
  });
  const [aiCaptainAdvice, setAiCaptainAdvice] = useState({
    tactics: "Keep a deep extra-cover to restrict Virat's signature inside-out drives over the covers.",
    bowlingStrategy: "Pace off-cutters targeted in the Good Length coordinate vector (-1.5 bounce index).",
    weakSpot: "Batter struggles with deliveries moving away late on the off-channel corridor."
  });

  // Boundary Celebration Alert state
  const [celebration, setCelebration] = useState<string | null>(null);

  // Hawkeye Virtual Pitch State (Edge Computer Vision simulation)
  const [lastBounceType, setLastBounceType] = useState<"Yorker" | "Full Pitch" | "Good Length" | "Short">("Good Length");
  const [ballsHistoryOnPitch, setBallsHistoryOnPitch] = useState<Array<{
    x: number;
    y: number;
    length: "Yorker" | "Full Pitch" | "Good Length" | "Short";
    colorName: string;
  }>>([]);

  const [cvAngle, setCvAngle] = useState<"pitch" | "crease" | "runout">("pitch");
  const [cvOverlays, setCvOverlays] = useState({
    hawkEye: true,
    batSwing: true,
    stumpsBox: true
  });

  // Profile Customization Settings
  const [favoriteFranchise, setFavoriteFranchise] = useState<string>("India Royals");
  const [fakeMsgAlert, setFakeMsgAlert] = useState<string | null>(null);

  // Sync the active live match's real-time score back to the tournaments list
  useEffect(() => {
    if (!activeLiveMatchId || !activeLiveTourneyId) return;
    setTournaments(prev => {
      const matchExists = prev.some(t => t.id === activeLiveTourneyId && t.matches.some(m => m.id === activeLiveMatchId));
      if (!matchExists) return prev;
      return prev.map(t => {
        if (t.id === activeLiveTourneyId) {
          return {
            ...t,
            matches: t.matches.map(m => {
              if (m.id === activeLiveMatchId) {
                return {
                  ...m,
                  scoreA: score,
                  wicketsA: wickets,
                  oversA: `${overs}.${balls}`,
                  details: matchStatus
                };
              }
              return m;
            })
          };
        }
        return t;
      });
    });
  }, [score, wickets, overs, balls, matchStatus, activeLiveMatchId, activeLiveTourneyId]);

  // Sync AI Match Predictions on ball score changes
  useEffect(() => {
    fetchPredictionData();
  }, [score, wickets, overs, balls]);

  const fetchPredictionData = async () => {
    try {
      const response = await fetch("/api/predict-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          battingTeam: teamA,
          bowlingTeam: teamB,
          targetScore: target,
          currentScore: score,
          currentWickets: wickets,
          currentBalls: (overs * 6) + balls,
          totalBalls: 120, // T20 Match
          batsmanHand: "right",
          bowlerType: commentatorStyle === "ravi" ? "fast" : "spin"
        } as PredictionRequest)
      });
      const data = await response.json();
      if (data) {
        setWinProbBatting(data.winProbability || 64);
        setWinProbBowling(data.bowlingTeamProb || 36);
        if (data.nextBallPrediction) {
          setNextBallProbs(data.nextBallPrediction);
        }
        if (data.aiAdvice) {
          setAiCaptainAdvice(data.aiAdvice);
        }
      }
    } catch (err) {
      console.warn("Prediction API failed, using native hybrid matrix algorithms.", err);
    }
  };

  // Ball Score Trigger (Main scoring method upgraded for true league scoring logic)
  const handleScoreBall = async (eventType: string, runScored: number) => {
    if (wickets >= 10 && eventType !== "wide" && eventType !== "noball") {
      setFakeMsgAlert("All out! Target chase concluded.");
      return;
    }

    let nextScore = score;
    let nextWickets = wickets;
    let nextOvers = overs;
    let nextBalls = balls;
    
    let isLegalBall = true;
    let swapStrikeRequired = false;
    let runsAddedToBat = 0;
    let runsAddedToBowler = 0;

    // Calculate scoreboard shifts and advanced extras metrics
    if (eventType === "wicket") {
      nextWickets += 1;
      setCelebration("Wicket Dismissal!");
      cricketBgm.playDynamicCheer("wicket");
      
      // Update batsman stats (is out)
      updateBatsmanStats(striker, 0, true, "b. " + bowler);
      updateBowlerStats(bowler, 0, true, true);
      
      // Open selector for next batsman
      if (nextWickets < 10) {
        setNextBatsmanSelectionOpen(true);
      }
    } else if (eventType === "six") {
      runsAddedToBat = 6;
      runsAddedToBowler = 6;
      nextScore += 6;
      setCelebration("MAXIMUM SIX!");
      setBoundaryPopup(6);
      cricketBgm.playDynamicCheer("six");
      
      updateBatsmanStats(striker, 6, false);
      updateBowlerStats(bowler, 6, true, false);
    } else if (eventType === "four") {
      runsAddedToBat = 4;
      runsAddedToBowler = 4;
      nextScore += 4;
      setCelebration("GLORIOUS BOUNDARY!");
      setBoundaryPopup(4);
      cricketBgm.playDynamicCheer("four");
      
      updateBatsmanStats(striker, 4, false);
      updateBowlerStats(bowler, 4, true, false);
    } else if (eventType === "wide") {
      isLegalBall = false;
      runsAddedToBowler = 1;
      nextScore += 1;
      setExtras(prev => ({ ...prev, wides: prev.wides + 1 }));
      setCelebration("WIDE (+1)");
      
      // Wide doesn't add to batsman ballsfaced, but adds to bowler runs and team score
      updateBowlerStats(bowler, 1, false, false);
    } else if (eventType === "noball") {
      isLegalBall = false;
      runsAddedToBowler = 1 + runScored;
      runsAddedToBat = runScored;
      nextScore += (1 + runScored);
      setExtras(prev => ({ ...prev, noBalls: prev.noBalls + 1 }));
      setCelebration("NO-BALL " + (runScored > 0 ? `+ ${runScored} runs` : ""));
      
      // No ball adds ballsfaced to batsman, but doesn't add a legal ball to bowler
      updateBatsmanStats(striker, runScored, false);
      updateBowlerStats(bowler, 1 + runScored, false, false);
      
      if (runScored === 1 || runScored === 3) {
        swapStrikeRequired = true;
      }
    } else if (eventType === "bye" || eventType === "legbye") {
      isLegalBall = true;
      nextScore += runScored;
      if (eventType === "bye") {
        setExtras(prev => ({ ...prev, byes: prev.byes + runScored }));
      } else {
        setExtras(prev => ({ ...prev, legByes: prev.legByes + runScored }));
      }
      setCelebration(`${eventType.toUpperCase()} + ${runScored}`);
      
      // Bye runs don't go to batsman and don't go as bowler runs conceded, but balls faced/bowled increment
      updateBatsmanStats(striker, 0, false);
      updateBowlerStats(bowler, 0, true, false);
      
      if (runScored === 1 || runScored === 3) {
        swapStrikeRequired = true;
      }
    } else if (eventType === "dot") {
      nextScore += 0;
      updateBatsmanStats(striker, 0, false);
      updateBowlerStats(bowler, 0, true, false);
    } else {
      // Standard runs scored by the batsman (single, double, triple)
      runsAddedToBat = runScored;
      runsAddedToBowler = runScored;
      nextScore += runScored;
      
      updateBatsmanStats(striker, runScored, false);
      updateBowlerStats(bowler, runScored, true, false);
      
      if (runScored === 1 || runScored === 3) {
        swapStrikeRequired = true;
      }
    }

    // Advance over balls delivery index
    let overEnded = false;
    if (isLegalBall) {
      if (nextBalls === 5) {
        nextBalls = 0;
        nextOvers += 1;
        overEnded = true;
      } else {
        nextBalls += 1;
      }
    }

    // Set updated state
    setScore(nextScore);
    setWickets(nextWickets);
    setOvers(nextOvers);
    setBalls(nextBalls);

    const nextOverNum = nextOvers + (nextBalls / 6);
    const nextRunRate = nextOverNum > 0 ? parseFloat((nextScore / nextOverNum).toFixed(2)) : 0;
    setRunRateHistory(prev => {
      // Avoid inserting duplicates at the same ball index if we triggered multiple times by accident
      const filtered = prev.filter(p => p.ballLabel !== `${nextOvers}.${nextBalls}`);
      return [
        ...filtered,
        {
          ballLabel: `${nextOvers}.${nextBalls}`,
          score: nextScore,
          runRate: nextRunRate,
          wickets: nextWickets,
          overNum: nextOverNum
        }
      ];
    });

    // Call API for live generative commentary quote
    setCommentaryLoading(true);
    try {
      const resp = await fetch("/api/generate-commentary", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           batsman: striker,
           bowler,
           runs: runScored.toString(),
           event: eventType,
           score: nextScore.toString(),
           wickets: nextWickets,
           overs: `${nextOvers}.${nextBalls}`,
           target: target.toString(),
           commentatorStyle
         } as CommentaryRequest)
      });
      const commentData = await resp.json();
      if (commentData) {
        setCommentaryList(prev => [
          {
            ball: `${nextOvers}.${nextBalls}`,
            text: commentData.commentary,
            event: eventType,
            style: commentatorStyle,
            aiPowered: commentData.aiPowered || false
          },
          ...prev
        ]);
        // Speak out the live commentary
        speakText(commentData.commentary);
      }
    } catch (err) {
      console.warn("Using localized fallback commentary generator.", err);
      // Fallback
      const fallbackText = `A great delivery from ${bowler}, and ${striker} steers it away. Splendid cricket on showcase!`;
      setCommentaryList(prev => [
        {
          ball: `${nextOvers}.${nextBalls}`,
          text: fallbackText,
          event: eventType,
          style: commentatorStyle,
          aiPowered: false
        },
        ...prev
      ]);
      // Speak out fallback commentary
      speakText(fallbackText);
    } finally {
      setCommentaryLoading(false);
      setTimeout(() => {
        setCelebration(null);
      }, 2300);
    }

    // Process Strike swaps
    if (swapStrikeRequired) {
      const temp = striker;
      setStriker(nonStriker);
      setNonStriker(temp);
    }

    // Handle end of over notifications & automatic striker swap
    if (overEnded) {
      setTimeout(() => {
        setCelebration("OVER FINISHED!");
        // Swap batters because bowler bowls from the other end now
        const temp = striker;
        setStriker(nonStriker);
        setNonStriker(temp);
        // Prompt for a bowler rotation
        setNextBowlerPromptOpen(true);
      }, 600);
    }
  };

  // Click on Pitch Coordinates handler
  const handlePitchClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    let lenName: "Yorker" | "Full Pitch" | "Good Length" | "Short" = "Good Length";
    let colorName = "bg-green-500";

    if (y > 75) {
      lenName = "Yorker";
      colorName = "bg-red-500";
    } else if (y > 55) {
      lenName = "Full Pitch";
      colorName = "bg-teal-500";
    } else if (y > 35) {
      lenName = "Good Length";
      colorName = "bg-green-500";
    } else {
      lenName = "Short";
      colorName = "bg-orange-500";
    }

    setLastBounceType(lenName);
    setBallsHistoryOnPitch(prev => [...prev, { x, y, length: lenName, colorName }]);
  };

  if (!userSession) {
    return (
      <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Pitch backdrop decoration */}
        <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-emerald-950/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full filter blur-[120px] pointer-events-none animate-pulse" />
        
        <div className="w-full max-w-sm z-10 space-y-6">
          {/* Branded Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-baseline space-x-1.5">
              <span className="font-display font-black text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-450 italic">
                GullyPros
              </span>
              <span className="text-[10px] uppercase font-mono bg-orange-950 text-orange-400 px-2 py-0.5 rounded font-black">OS</span>
            </div>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Broadcast, Simulate & Score professional cricket tournaments.
            </p>
          </div>

          {/* Core Auth Card */}
          <div className="bg-[#0c111e] border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden space-y-4">
            
            {/* Tabs selector */}
            <div className="flex border-b border-slate-800 pb-1.5 gap-2">
              <button
                id="btn-tab-signup"
                type="button"
                onClick={() => setAuthTab("signup")}
                className={`flex-1 text-center py-1.5 text-xs font-bold transition rounded-md font-mono cursor-pointer ${
                  authTab === "signup" ? "text-orange-400 bg-orange-950/30 border border-orange-900/10" : "text-slate-550 hover:text-slate-300"
                }`}
              >
                Free Sign Up
              </button>
              <button
                id="btn-tab-signin"
                type="button"
                onClick={() => setAuthTab("signin")}
                className={`flex-1 text-center py-1.5 text-xs font-bold transition rounded-md font-mono cursor-pointer ${
                  authTab === "signin" ? "text-orange-400 bg-orange-950/30 border border-orange-900/10" : "text-slate-550 hover:text-slate-300"
                }`}
              >
                Sign In
              </button>
            </div>

            {/* Success spinner loader */}
            {authSuccessMsg ? (
              <div className="py-12 text-center space-y-4 font-mono">
                <div className="h-10 w-10 border-2 border-t-orange-500 border-r-transparent border-slate-800 rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-orange-400 animate-pulse">{authSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs font-mono">
                {authTab === "signup" && (
                  <div>
                    <label className="text-slate-400 block mb-1">Your Full Name</label>
                    <input
                      id="input-auth-name"
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="e.g. Rohan Sharma"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                )}

                <div>
                  <label className="text-slate-400 block mb-1">Personal or Work Email</label>
                  <input
                    id="input-auth-email"
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="e.g. name@stadium.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Select Access Privileges</label>
                  <select
                    id="select-auth-role"
                    value={authRole}
                    onChange={(e) => setAuthRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="spectator">Spectator / Cricket Fan (Free View)</option>
                    <option value="conducting_person">Match Conducting Official (Score Live)</option>
                  </select>
                </div>

                <button
                  id="submit-auth-form"
                  type="submit"
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-550 text-white font-bold rounded-lg transition mt-2 cursor-pointer relative"
                >
                  {authTab === "signup" ? "Create Free Access Profile" : "Validate Free Credentials"}
                </button>
              </form>
            )}

            <div className="border-t border-slate-850 pt-3 text-center space-y-2">
              <span className="text-[10px] text-slate-550 text-slate-550 block uppercase font-mono font-bold leading-none">Instant Complimentary Guest Access</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="guest-fan-btn"
                  type="button"
                  onClick={() => handleGuestAccess("spectator")}
                  className="py-1.5 bg-slate-900 hover:bg-slate-850 rounded-lg border border-slate-800 text-[10px] text-slate-300 font-bold transition cursor-pointer"
                >
                  🎮 Guest Fan
                </button>
                <button
                  id="guest-official-btn"
                  type="button"
                  onClick={() => handleGuestAccess("conducting_person")}
                  className="py-1.5 bg-slate-900 hover:bg-slate-850 rounded-lg border border-slate-800 text-[10px] text-orange-400 font-bold transition cursor-pointer"
                >
                  👮 Guest Official
                </button>
              </div>
            </div>

          </div>

          {/* Fineprint information */}
          <div className="text-center text-[10px] font-mono leading-normal text-slate-505 text-slate-500">
            <span>By entering corporate stadium gates, you enjoy free streaming broadcasts, interactive hawk-eye simulations & live expert Audio Commentary.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 font-sans flex flex-col antialiased pb-20 select-none">
      
      {/* 1. INSTAGRAM-STYLE HEADER */}
      <header className="border-b border-slate-800 bg-[#0d1322] px-4 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setFakeMsgAlert("Live camera telemetry active. Snap standard match clips coordinates to share! 📸")}
            className="p-1 hover:bg-slate-800 rounded transition text-slate-400 hover:text-white cursor-pointer"
            title="Camera Overlays"
          >
            <Camera className="h-5.5 w-5.5" />
          </button>
          <div className="flex items-baseline space-x-1.5">
            <span className="font-display font-black text-xl italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-450">
              GullyPros
            </span>
            <span className="text-[9px] uppercase font-mono bg-orange-950 text-orange-400 px-1.5 py-0.5 rounded font-bold">OS</span>
          </div>
        </div>

        {/* Real-time unified status dot */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800/80 px-2.5 py-1 rounded text-[10px] font-mono leading-none">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-400 text-[9px]">AI CAPTAIN:</span>
            <span className="text-emerald-400 font-bold text-[9px]">READY</span>
          </div>
          
          <button 
            onClick={() => setFakeMsgAlert("Connected to the GullyPros Local Fan Relay. No unread DM requests. 💬")}
            className="text-slate-400 hover:text-orange-405 relative cursor-pointer p-1"
            title="Chat Relay"
          >
            <Send className="h-5 w-5 transform -rotate-12 hover:text-orange-400" />
            <span className="absolute top-0.5 right-0.5 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </header>

      {/* PROFESSIONAL AUDIO BROADCAST DECK */}
      <div className="bg-[#0b0f19] border-b border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-slate-400 font-mono text-[11px]">
          <Music className="h-3.5 w-3.5 text-orange-400 animate-pulse" />
          <span className="text-slate-200">STADIUM ATMOSPHERE:</span>
          <button
            onClick={() => {
              if (bgmActive) {
                cricketBgm.stop();
                setBgmActive(false);
              } else {
                cricketBgm.start();
                setBgmActive(true);
              }
            }}
            className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition duration-200 cursor-pointer ${
              bgmActive 
                ? "bg-orange-950 text-orange-401 text-orange-400 border border-orange-850" 
                : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}
          >
            {bgmActive ? "● Play Ambient" : "○ Mute BGM"}
          </button>
          
          {bgmActive && (
            <div className="flex items-center space-x-1.5 ml-2">
              <span className="text-[10px] text-slate-500">Vol:</span>
              <input
                type="range"
                min="0"
                max="0.4"
                step="0.02"
                value={bgmVolume}
                onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <span className="text-[10px] text-slate-300 font-bold">{Math.round(bgmVolume * 250)}%</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2.5 font-mono text-[11px]">
          <span className="text-slate-400">COMMENTARY TTS SPEAKER:</span>
          <button
            id="toggle-commentary-speaker"
            onClick={() => {
              const nextVal = !isSpeakerOn;
              setIsSpeakerOn(nextVal);
              if (!nextVal && typeof window !== "undefined" && window.speechSynthesis) {
                window.speechSynthesis.cancel();
              }
            }}
            className={`px-3 py-1 rounded-lg flex items-center space-x-1.5 transition text-[10px] font-bold cursor-pointer border ${
              isSpeakerOn
                ? "bg-emerald-950/45 text-emerald-400 border-emerald-800/40"
                : "bg-rose-950/40 text-rose-400 border-rose-900/35"
            }`}
          >
            {isSpeakerOn ? (
              <>
                <Volume2 className="h-3.5 w-3.5 text-emerald-455" />
                <span>SPEAKER ACTIVE (ON)</span>
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5 text-rose-400" />
                <span>SPEAKER OFF (MUTED)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Real-time alerts popup bar */}
      <AnimatePresence>
        {fakeMsgAlert && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-4 right-4 z-50 bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-2xl flex items-center justify-between text-xs font-sans text-slate-200"
          >
            <div className="flex items-center space-x-2">
              <Info className="h-4 w-4 text-orange-400 shrink-0" />
              <span>{fakeMsgAlert}</span>
            </div>
            <button 
              onClick={() => setFakeMsgAlert(null)}
              className="font-bold underline text-orange-400 text-[11px] ml-2 cursor-pointer"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. DYNAMIC CONTENT CONTAINER */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-4">
        
        {/* VIEW 1: LIVE MATCHE BROADCAST ROOM */}
        {activeTab === "live" && (
          <div className="space-y-6">
            {selectedLiveMatchId === null ? (
              <div className="space-y-5">
                <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden text-left">
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-orange-600/10 rounded-full filter blur-xl"></div>
                  <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-sm font-sans font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
                        <span className="text-orange-500 text-lg leading-none">🎙️</span>
                        GullyPros Live Scorerooms
                      </h2>
                      <p className="text-[10px] text-slate-400 mt-1 font-sans leading-normal">
                        Select an active stadium match to view ball-by-ball summaries, live-commentary, and 3D simulations.
                      </p>
                    </div>
                    <span className="text-[9px] font-mono bg-orange-950/40 border border-orange-500/20 text-orange-400 font-bold px-2 py-0.5 rounded uppercase select-none">
                      ● Active Relays
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 font-mono italic mt-3 bg-slate-950/40 border border-slate-850/60 p-2.5 rounded leading-normal">
                    💡 <span className="text-orange-400 font-black">Note:</span> Standard mock games are filtered out. You are viewing live-scoring stadium events created directly by GullyPros officials.
                  </p>
                </div>

                {(() => {
                  const liveMatchesList = tournaments.flatMap(t => 
                    (t.matches || [])
                      .filter(m => m.status === "LIVE" && m.id !== "match-mumbai-live" && m.id !== "match-colombo-live")
                      .map(m => ({ ...m, tournamentId: t.id, tournamentName: t.name }))
                  );

                  if (liveMatchesList.length === 0) {
                    return (
                      <div className="bg-[#0c111e] border border-slate-850 rounded-2xl p-8 py-11 text-center space-y-4 shadow-lg">
                        <div className="mx-auto w-14 h-14 bg-slate-900 border border-slate-800 text-slate-500 rounded-full flex items-center justify-center text-2xl select-none">
                          📡
                        </div>
                        <div className="space-y-1.5 max-w-xs mx-auto">
                          <h3 className="font-display font-black text-slate-200 text-xs uppercase tracking-wide">No Active Broadcasts Found</h3>
                          <p className="text-[10px] text-slate-400 leading-normal">
                            All mock data is hidden. There are no user-created stadium matches marked as live right now.
                          </p>
                        </div>
                        
                        <div className="pt-2">
                          <button
                            onClick={() => setActiveTab("upcoming")}
                            className="py-1.5 px-4 bg-orange-600 hover:bg-orange-550 text-white text-[10px] font-bold font-mono rounded-lg transition duration-150 cursor-pointer select-none uppercase tracking-wider"
                          >
                            🏆 Go to Upcoming tab to start a match
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 gap-4">
                      {liveMatchesList.map((m) => {
                        return (
                          <div 
                            key={m.id} 
                            className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 hover:border-slate-700/60 transition duration-150 shadow-md space-y-3"
                          >
                            <div className="flex justify-between items-start">
                              <div className="space-y-1 max-w-[70%] text-left">
                                <span className="text-[8px] font-mono bg-slate-950 text-orange-400 border border-slate-850 px-2 py-0.5 rounded font-black uppercase tracking-wider block w-fit">
                                  {m.tournamentName}
                                </span>
                                <h3 className="text-white font-bold text-sm tracking-tight pt-1 leading-none">
                                  {m.teamA} vs {m.teamB}
                                </h3>
                                <p className="text-[9px] text-slate-400 flex items-center gap-1 font-mono pt-0.5">
                                  📍 {m.venue || "Stadium Ground"} • {m.date || "Today"}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="inline-flex items-center space-x-1 bg-red-950/20 px-1.5 py-0.5 border border-red-500/20 text-red-500 text-[8px] uppercase font-mono font-bold rounded">
                                  <span className="h-1 w-1 rounded-full bg-red-500 animate-ping"></span>
                                  <span>LIVE NOW</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-slate-950 px-3 py-2 border border-slate-850 rounded-lg text-[11px] font-mono flex items-center justify-between">
                              <div className="space-y-0.5 text-left">
                                <span className="text-[8px] text-slate-500 block uppercase font-bold">Batting Score</span>
                                <span className="text-slate-200 font-bold text-xs">{m.scoreA ?? 0} / {m.wicketsA ?? 0}</span>
                                <span className="text-[9px] text-slate-400 block pb-0.5">
                                  Overs: {m.oversA ?? "0.0"} <span className="text-[8px] text-slate-500 italic">({m.details || "In Progress"})</span>
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[8px] text-slate-500 block uppercase font-bold">Innings Target</span>
                                <span className="text-orange-400 font-bold text-xs font-mono">
                                  {m.target ?? 120} runs
                                </span>
                                <span className="text-[9px] text-slate-500 block">Required RR in effect</span>
                              </div>
                            </div>

                            <button
                              onClick={() => loadMatchIntoDashboard(m.id, m.tournamentId)}
                              className="bg-orange-600 hover:bg-orange-550 border border-orange-500/10 text-white font-mono font-black text-[10px] uppercase py-2 px-3 rounded-lg w-full flex items-center justify-center space-x-1.5 transition duration-150 cursor-pointer"
                            >
                              <span>📺 Join live dashboard relay</span>
                              <span className="text-xs">⚡</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <>
                {/* Unified scorecard header banner */}
                <div className="bg-[#0f172a] border border-slate-800/90 rounded-xl p-5 shadow-lg relative overflow-hidden text-left">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-800/60 pb-3">
                    <button
                      onClick={() => {
                        setSelectedLiveMatchId(null);
                        localStorage.removeItem("gullypros_selected_live_match_id");
                      }}
                      className="inline-flex items-center space-x-1.5 font-mono text-[9px] text-orange-400 hover:text-orange-300 font-bold transition focus:outline-none bg-slate-950/80 py-1 px-2.5 border border-slate-800 hover:border-slate-700 rounded-lg cursor-pointer select-none"
                    >
                      <span>← Back to Live Rooms</span>
                    </button>
                    <div className="bg-red-650 px-2 py-0.5 text-[8px] uppercase tracking-wider font-mono font-bold rounded border border-red-500/20 text-red-500 flex items-center space-x-1 select-none">
                      <span className="h-1 w-1 rounded-full bg-red-400 animate-ping"></span>
                      <span>Telemetry relay live</span>
                    </div>
                  </div>

                  <div className="space-y-3 font-sans">
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold block">
                  {favoriteFranchise === teamB ? teamB : teamA} vs {favoriteFranchise === teamB ? teamA : teamB} • LIVE
                </span>
                
                <div className="flex items-baseline space-x-3.5">
                  <span className="text-4xl font-display font-black text-white tracking-tight flex items-baseline">
                    <motion.span
                      key={`score-${score}`}
                      initial={{ scale: 0.8, y: -5, color: "#10b981" }}
                      animate={{ scale: 1, y: 0, color: "#ffffff" }}
                      transition={{ type: "spring", stiffness: 450, damping: 11 }}
                      className="inline-block"
                    >
                      {score}
                    </motion.span>
                    <span className="text-slate-500 mx-1 select-none">-</span>
                    <motion.span
                      key={`wickets-${wickets}`}
                      initial={{ scale: 1.35, color: "#ef4444" }}
                      animate={{ scale: 1, color: "#ffffff" }}
                      transition={{ type: "spring", stiffness: 450, damping: 10 }}
                      className="inline-block"
                    >
                      {wickets}
                    </motion.span>
                  </span>
                  <motion.span 
                    key={`overs-${overs}-${balls}`}
                    initial={{ opacity: 0.65 }}
                    animate={{ opacity: 1 }}
                    className="text-xs font-mono text-slate-400"
                  >
                    Overs: {overs}.{balls}
                  </motion.span>
                </div>

                <div className="flex justify-between items-center text-xs font-mono border-t border-slate-800/60 pt-3 text-slate-400 leading-none">
                  <div>
                    <span>Current Run Rate: </span>
                    <strong className="text-slate-200">
                      {overs > 0 || balls > 0 ? (score / (overs + balls/6)).toFixed(2) : "0.00"}
                    </strong>
                  </div>
                  <div>
                    <span>Req. Run Rate: </span>
                    <strong className="text-orange-400">
                      {overs < 20 ? (((target - score) / (20 - (overs + balls/6)))).toFixed(2) : "0.00"}
                    </strong>
                  </div>
                </div>

                <p className="text-[11px] text-amber-500 font-mono italic leading-none pt-1">
                  {matchStatus} • Needs {target - score > 0 ? target - score : 0} runs in {120 - (overs * 6 + balls)} balls remaining
                </p>
              </div>

              {/* Celebration overlay */}
              <AnimatePresence>
                {celebration && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-950/95 flex flex-col justify-center items-center text-center z-15 p-4"
                  >
                    <Sparkles className="h-8 w-8 text-orange-400 animate-bounce mb-1" />
                    <h3 className="text-lg font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300 uppercase">
                      {celebration}
                    </h3>
                    <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-wider">
                      Analyzing ball vector bounce landing...
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sub Tabs Pill switch */}
            <div className="bg-[#0f172a] border border-slate-850 p-1 rounded-xl flex space-x-1 text-xs font-mono select-none">
              {[
                { id: "scorer", label: "Scoring" },
                { id: "commentary", label: "Voice Audio" },
                { id: "hawkEye", label: "HawkEye (CV)" },
                { id: "aiCaptain", label: "Captain AI" }
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setLiveSubTab(pill.id as any)}
                  className={`flex-1 py-2 rounded-lg text-center font-bold tracking-tight font-mono transition text-[10px] cursor-pointer ${
                    liveSubTab === pill.id
                      ? "bg-slate-800 text-orange-400 shadow-inner"
                      : "text-slate-500 hover:text-slate-350"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Sub views */}
            {liveSubTab === "scorer" && (
              <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow space-y-5">
                {/* Roster builder header */}
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
                      {!canScoreActiveMatch 
                        ? "📺 Live Spectator Match Dashboard" 
                        : showRosterSetup 
                          ? "Step 1: Custom Squad Rosters Setup" 
                          : "Step 2: Score Administration Console"
                      }
                    </h3>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      {!canScoreActiveMatch
                        ? "Real-time cricket dashboard with active batsman partnership tracking and bowler economy metrics."
                        : showRosterSetup 
                          ? `Configure final rosters for ${teamA} and ${teamB} before opening scorecard controls.` 
                          : "Simulate advanced ball-by-ball actions to prompt live commentary engines."
                      }
                    </p>
                  </div>
                  {!showRosterSetup && canScoreActiveMatch && (
                    <button
                      onClick={() => setShowRosterSetup(true)}
                      className="px-2.5 py-1 text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 text-orange-400 hover:bg-slate-850 rounded transition cursor-pointer"
                    >
                      📋 Edit Rosters
                    </button>
                  )}
                </div>

                {!canScoreActiveMatch ? (
                  <div className="space-y-4 font-sans text-xs">
                    {/* Dynamic Target progress and projected run rates */}
                    <div className="bg-[#111827]/65 p-4 rounded-xl border border-slate-800/80 space-y-3 shadow-md">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                          🎯 Target Progress (Target: {target} runs)
                        </span>
                        <span className="text-orange-400 font-bold font-mono">
                          {score} / {target} ({((score / (target || 120)) * 100).toFixed(0)}%)
                        </span>
                      </div>
                      
                      {/* Target Progress Bar */}
                      <div className="w-full bg-slate-900 border border-slate-850 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, (score / (target || 120)) * 100)}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-850/50 text-[10px] text-slate-400 font-mono">
                        <div className="bg-slate-950/60 p-2 rounded border border-slate-850 flex justify-between">
                          <span>Current R/R:</span>
                          <span className="text-white font-bold">{overs > 0 || balls > 0 ? (score / (overs + balls / 6)).toFixed(2) : "0.00"}</span>
                        </div>
                        <div className="bg-slate-950/60 p-2 rounded border border-slate-850 flex justify-between">
                          <span>Required R/R:</span>
                          <span className="text-orange-400 font-bold">
                            {(() => {
                              const remainingRuns = Math.max(0, target - score);
                              const totalBalls = 120;
                              const facedBalls = (overs * 6) + balls;
                              const remBalls = Math.max(1, totalBalls - facedBalls);
                              return ((remainingRuns / remBalls) * 6).toFixed(2);
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Active Batsmen Partnership (Striker and Non-Striker side by side) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Striker Stats */}
                      <div className="relative overflow-hidden bg-slate-950 p-3.5 rounded-xl border border-orange-500/30 shadow-lg space-y-1.5 flex flex-col justify-between">
                        <div className="absolute top-0 right-0 bg-orange-600 text-white font-mono text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-bl">
                          Striker ⚡
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-sm tracking-tight truncate pr-14">
                            {striker || "Waiting Batsman"}
                          </h4>
                          <p className="text-[10px] text-slate-500 leading-none mt-0.5">Active Batsman</p>
                        </div>
                        <div className="flex justify-between items-baseline pt-2">
                          <span className="text-2xl font-black text-orange-400 font-mono">
                            {(batsmanScores[striker || ""]?.runs) ?? 0}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {(batsmanScores[striker || ""]?.balls) ?? 0} balls faced
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-900/60 text-[9px] text-slate-400 font-mono text-center">
                          <div className="bg-slate-900/40 p-1 rounded">
                            <span>4s: </span>
                            <strong className="text-white">{(batsmanScores[striker || ""]?.fours) ?? 0}</strong>
                          </div>
                          <div className="bg-slate-900/40 p-1 rounded">
                            <span>6s: </span>
                            <strong className="text-white">{(batsmanScores[striker || ""]?.sixes) ?? 0}</strong>
                          </div>
                          <div className="bg-slate-900/40 p-1 rounded">
                            <span>S/R: </span>
                            <strong className="text-emerald-400">
                              {(() => {
                                const b = batsmanScores[striker || ""];
                                return b && b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : "0.0";
                              })()}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* Non-Striker Stats */}
                      <div className="relative overflow-hidden bg-slate-950 p-3.5 rounded-xl border border-slate-800 shadow space-y-1.5 flex flex-col justify-between">
                        <div className="absolute top-0 right-0 bg-slate-850 text-slate-400 font-mono text-[8px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-bl">
                          Non-Striker
                        </div>
                        <div>
                          <h4 className="text-slate-300 font-bold text-sm tracking-tight truncate pr-16">
                            {nonStriker || "Waiting Batsman"}
                          </h4>
                          <p className="text-[10px] text-slate-500 leading-none mt-0.5">Off strike partner</p>
                        </div>
                        <div className="flex justify-between items-baseline pt-2">
                          <span className="text-2xl font-black text-slate-300 font-mono">
                            {(batsmanScores[nonStriker || ""]?.runs) ?? 0}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {(batsmanScores[nonStriker || ""]?.balls) ?? 0} balls faced
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-900/60 text-[9px] text-slate-400 font-mono text-center">
                          <div className="bg-slate-900/40 p-1 rounded">
                            <span>4s: </span>
                            <strong className="text-white">{(batsmanScores[nonStriker || ""]?.fours) ?? 0}</strong>
                          </div>
                          <div className="bg-slate-900/40 p-1 rounded">
                            <span>6s: </span>
                            <strong className="text-white">{(batsmanScores[nonStriker || ""]?.sixes) ?? 0}</strong>
                          </div>
                          <div className="bg-slate-900/40 p-1 rounded">
                            <span>S/R: </span>
                            <strong className="text-emerald-400">
                              {(() => {
                                const b = batsmanScores[nonStriker || ""];
                                return b && b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : "0.0";
                              })()}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Active Bowler Card */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/80 space-y-2">
                      <div className="flex justify-between items-center border-b border-slate-850 pb-1.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-indigo-400">⚾</span>
                          <span className="font-bold text-slate-200 text-xs truncate max-w-[150px]">
                            {bowler || "Active Bowler"}
                          </span>
                        </div>
                        <span className="text-[9px] uppercase font-mono text-slate-500 tracking-wider">
                          Current Bowler Stats
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                        <div className="p-1 px-1.5 bg-[#0f172a] rounded border border-slate-900/50">
                          <p className="text-[9px] text-slate-500 uppercase">Overs</p>
                          <p className="font-extrabold text-slate-300">
                            {((bowlerStats[bowler || ""]?.overs) ?? 0)}.{((bowlerStats[bowler || ""]?.balls) ?? 0)}
                          </p>
                        </div>
                        <div className="p-1 px-1.5 bg-[#0f172a] rounded border border-slate-900/50">
                          <p className="text-[9px] text-slate-500 uppercase">Runs</p>
                          <p className="font-extrabold text-rose-450">
                            {((bowlerStats[bowler || ""]?.runs) ?? 0)}
                          </p>
                        </div>
                        <div className="p-1 px-1.5 bg-[#0f172a] rounded border border-slate-900/50">
                          <p className="text-[9px] text-slate-500 uppercase">Wkts</p>
                          <p className="font-extrabold text-emerald-400">
                            {((bowlerStats[bowler || ""]?.wickets) ?? 0)}
                          </p>
                        </div>
                        <div className="p-1 px-1.5 bg-[#0f172a] rounded border border-slate-900/50">
                          <p className="text-[9px] text-slate-500 uppercase">Econ</p>
                          <p className="font-extrabold text-indigo-300">
                            {(() => {
                              const b = bowlerStats[bowler || ""];
                              if (!b) return "0.00";
                              const totalOversFraction = b.overs + (b.balls / 6);
                              return totalOversFraction > 0 ? (b.runs / totalOversFraction).toFixed(2) : "0.00";
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Recent ball timeline: Beautiful micro delivery badges */}
                    <div className="bg-[#111827]/40 p-3.5 rounded-xl border border-slate-850/60 space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                        <span>📊 Recent Deliveries</span>
                        <span className="text-[9px] uppercase tracking-wider text-slate-500">Left-to-right (chronological)</span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 pt-1 font-mono">
                        {commentaryList.length === 0 ? (
                          <span className="text-slate-600 text-[10px] leading-relaxed italic">No delivery statistics recorded on scoreboard yet...</span>
                        ) : (
                          [...commentaryList].reverse().slice(-10).map((item, idx) => {
                            let bgClass = "bg-slate-800 text-slate-300 border-slate-700";
                            let displayLabel = "•";
                            
                            const ev = item.event.toLowerCase();
                            if (ev === "six") {
                              bgClass = "bg-fuchsia-950 text-fuchsia-300 border-fuchsia-500/40 font-black";
                              displayLabel = "6";
                            } else if (ev === "four") {
                              bgClass = "bg-orange-950 text-orange-300 border-orange-550/40 font-bold";
                              displayLabel = "4";
                            } else if (ev === "wicket") {
                              bgClass = "bg-rose-950 text-rose-300 border-rose-500/40 font-extrabold";
                              displayLabel = "W";
                            } else if (ev === "wide") {
                              bgClass = "bg-sky-950 text-sky-300 border-sky-550/30";
                              displayLabel = "Wd";
                            } else if (ev === "noball") {
                              bgClass = "bg-amber-950 text-amber-300 border-amber-550/30";
                              displayLabel = "Nb";
                            } else if (item.text.toLowerCase().includes("single") || item.text.toLowerCase().includes("1 run")) {
                              displayLabel = "1";
                            } else if (item.text.toLowerCase().includes("double") || item.text.toLowerCase().includes("2 runs")) {
                              displayLabel = "2";
                            } else if (item.text.toLowerCase().includes("triple") || item.text.toLowerCase().includes("3 runs")) {
                              displayLabel = "3";
                            } else {
                              bgClass = "bg-slate-900 text-slate-500 border-slate-800/80";
                              displayLabel = "0";
                            }
                            
                            return (
                              <div 
                                key={idx} 
                                className={`h-7 min-w-7 px-1.5 flex items-center justify-center rounded-full text-xs border font-mono select-none shadow ${bgClass}`}
                                title={`Ball ${item.ball}: ${item.event}`}
                              >
                                {displayLabel}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Mini Role Elevate section nested humbly at the bottom */}
                    <div className="pt-2 border-t border-slate-850/50 mt-2 flex justify-between items-center text-[10px] text-slate-500">
                      <span>Connected Mode: Spectator Stream</span>
                      {userSession?.role !== "conducting_person" && (
                        <button
                          id="elevate-role-quick"
                          onClick={() => {
                            const updated = { ...userSession!, role: "conducting_person" as const };
                            setUserSession(updated);
                            localStorage.setItem("cricketverse_auth_user", JSON.stringify(updated));
                          }}
                          className="text-orange-400 hover:text-orange-300 transition font-bold underline cursor-pointer"
                        >
                          🔑 Turn on Scorekeeper Access
                        </button>
                      )}
                    </div>
                  </div>
                ) : showRosterSetup ? (
                  /* STEP 1: SQUAD ALIGNMENT AND SQUAD ADDITIONS */
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Team A (Batting) Lineup */}
                      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                          <span className="text-xs font-mono font-bold text-orange-400">🏏 {teamA} Batting Lineup</span>
                          <span className="text-[9px] font-mono text-slate-500">{teamAPlayers.length} Players</span>
                        </div>
                        <div className="max-h-52 overflow-y-auto space-y-1 pr-1 font-mono text-xs">
                          {teamAPlayers.map((player, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-slate-900 px-2 py-1.5 rounded border border-slate-850/40">
                              <span className="text-slate-300 font-bold">{idx + 1}. {player}</span>
                              <button
                                onClick={() => setTeamAPlayers(prev => prev.filter((_, pIdx) => pIdx !== idx))}
                                className="text-rose-500 hover:text-rose-450 text-[10px] cursor-pointer font-bold shrink-0 ml-1"
                              >
                                ✕ Remove
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        {/* Add Player to Team A Form */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const form = e.currentTarget;
                            const input = form.elements.namedItem("playerName") as HTMLInputElement;
                            if (input.value.trim()) {
                              setTeamAPlayers(prev => [...prev, input.value.trim()]);
                              input.value = "";
                            }
                          }}
                          className="flex gap-2"
                        >
                          <input
                            name="playerName"
                            type="text"
                            placeholder="Add Player Name..."
                            className="bg-slate-900 text-xs px-2.5 py-1.5 border border-slate-800 focus:border-orange-500 focus:outline-none rounded text-slate-350 flex-1 font-mono"
                          />
                          <button
                            type="submit"
                            className="bg-orange-600 hover:bg-orange-550 text-white text-xs px-3 rounded font-mono font-bold cursor-pointer"
                          >
                            + Add
                          </button>
                        </form>
                      </div>

                      {/* Team B (Bowling) Lineup */}
                      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                          <span className="text-xs font-mono font-bold text-amber-500">⚾ {teamB} Bowling Lineup</span>
                          <span className="text-[9px] font-mono text-slate-500">{teamBPlayers.length} Players</span>
                        </div>
                        <div className="max-h-52 overflow-y-auto space-y-1 pr-1 font-mono text-xs">
                          {teamBPlayers.map((player, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-slate-900 px-2 py-1.5 rounded border border-slate-850/40">
                              <span className="text-slate-300 font-bold">{idx + 1}. {player}</span>
                              <button
                                onClick={() => setTeamBPlayers(prev => prev.filter((_, pIdx) => pIdx !== idx))}
                                className="text-rose-500 hover:text-rose-450 text-[10px] cursor-pointer font-bold shrink-0 ml-1"
                              >
                                ✕ Remove
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        {/* Add Player to Team B Form */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const form = e.currentTarget;
                            const input = form.elements.namedItem("playerName") as HTMLInputElement;
                            if (input.value.trim()) {
                              setTeamBPlayers(prev => [...prev, input.value.trim()]);
                              input.value = "";
                            }
                          }}
                          className="flex gap-2"
                        >
                          <input
                            name="playerName"
                            type="text"
                            placeholder="Add Bowler / Fielder..."
                            className="bg-slate-900 text-xs px-2.5 py-1.5 border border-slate-800 focus:border-orange-500 focus:outline-none rounded text-slate-350 flex-1 font-mono"
                          />
                          <button
                            type="submit"
                            className="bg-orange-600 hover:bg-orange-550 text-white text-xs px-3 rounded font-mono font-bold cursor-pointer"
                          >
                            + Add
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* Presets and Proceed Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2.5 justify-between pt-3 border-t border-slate-850 font-mono text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          const rA = getPrepopulatedRoster(teamA);
                          const rB = getPrepopulatedRoster(teamB);
                          setTeamAPlayers(rA);
                          setTeamBPlayers(rB);
                          setFakeMsgAlert("Standard rosters loaded for both teams! ✨");
                        }}
                        className="py-2 px-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded font-bold cursor-pointer transition"
                      >
                        🌟 Reload Star Pre-sets
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (teamAPlayers.length < 2 || teamBPlayers.length < 1) {
                            setFakeMsgAlert("Lineups must contain at least 2 batters and 1 bowler to score legally! 🏏");
                            return;
                          }
                          
                          // Establish active lineup slots
                          const stName = teamAPlayers[0];
                          const nonStName = teamAPlayers[1];
                          const bName = teamBPlayers[0];
                          
                          setStriker(stName);
                          setNonStriker(nonStName);
                          setBowler(bName);
                          
                          // Set up statistical charts cleanly or distribute based on the scoreboard
                          initializeStatsForMatch(score, wickets, stName, bName, teamAPlayers, teamBPlayers, overs, balls);
                          
                          setShowRosterSetup(false);
                          setFakeMsgAlert(`Squad players configured successfully! Start scoring for ${teamA} vs ${teamB}. 🏏`);
                        }}
                        className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-555 rounded text-white font-bold cursor-pointer transition active:scale-98 shadow-md"
                      >
                        🏏 Finish Setup & Go to Scoring Console
                      </button>
                    </div>
                  </div>
                ) : (
                  /* STEP 2: ACTIVE SCORES ADMINISTRATION BOARD */
                  <div className="space-y-5">
                    {/* Reset scoreboard header */}
                    <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-850 flex flex-col sm:flex-row gap-3 justify-between items-center text-xs font-mono text-slate-500 leading-none shadow-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400 font-semibold">Target score to chase:</span>
                        <input 
                          type="number"
                          value={target}
                          onChange={(e) => setTarget(parseInt(e.target.value) || 0)}
                          className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded text-orange-400 font-bold w-16 text-center focus:outline-none focus:border-orange-500 transition"
                        />
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const confirmClear = window.confirm("Are you sure you want to reset the active team scorer back to initial status?");
                          if (confirmClear) {
                            setScore(0);
                            setWickets(0);
                            setOvers(0);
                            setBalls(0);
                            setCommentaryList([]);
                            initializeStatsForMatch(0, 0, teamAPlayers[0] || "Virat Kohli", teamBPlayers[0] || "Jasprit Bumrah", teamAPlayers, teamBPlayers, 0, 0);
                            setFakeMsgAlert("Scorecard data reset back to 0-0. Innings fresh start! 🏏");
                          }
                        }}
                        className="text-rose-500 hover:underline cursor-pointer border border-rose-950/20 px-2.5 py-1 bg-rose-950/10 rounded font-bold transition hover:bg-rose-950/20"
                      >
                        🔄 Safe Reset Innings Score
                      </button>
                    </div>

                    {/* MAIN SCORING INTERACTION BUTTONS */}
                    <div className="space-y-4 text-xs font-mono">
                      {/* Section A: Standard runs scoring (Batsman runs) */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">A: Standard Scored Runs (Striker)</span>
                        <div className="grid grid-cols-6 gap-2 text-center font-mono">
                          
                          <button
                            type="button"
                            onClick={() => handleScoreBall("dot", 0)}
                            className="bg-slate-950 border border-slate-800 hover:bg-slate-850 rounded-lg py-2.5 flex flex-col items-center justify-center cursor-pointer transition text-slate-300 active:scale-95"
                            title="Dot Delivery"
                          >
                            <span className="text-sm font-black text-slate-400">0</span>
                            <span className="text-[8px] text-slate-500 font-sans uppercase font-bold mt-1">dot</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleScoreBall("single", 1)}
                            className="bg-slate-950 border border-slate-800 hover:bg-slate-850 rounded-lg py-2.5 flex flex-col items-center justify-center cursor-pointer transition text-slate-300 active:scale-95"
                            title="Single Run (Strike Swap)"
                          >
                            <span className="text-sm font-black text-amber-500">1</span>
                            <span className="text-[8px] text-slate-500 font-sans uppercase font-bold mt-1">single</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleScoreBall("double", 2)}
                            className="bg-slate-950 border border-slate-800 hover:bg-slate-850 rounded-lg py-2.5 flex flex-col items-center justify-center cursor-pointer transition text-slate-300 active:scale-95"
                            title="Double Runs"
                          >
                            <span className="text-sm font-black text-slate-200">2</span>
                            <span className="text-[8px] text-slate-500 font-sans uppercase font-bold mt-1">double</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleScoreBall("triple", 3)}
                            className="bg-slate-950 border border-slate-800 hover:bg-slate-850 rounded-lg py-2.5 flex flex-col items-center justify-center cursor-pointer transition text-slate-300 active:scale-95"
                            title="Triple Runs (Strike Swap)"
                          >
                            <span className="text-sm font-black text-orange-400 font-bold">3</span>
                            <span className="text-[8px] text-slate-500 font-sans uppercase font-bold mt-1">thrible</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleScoreBall("four", 4)}
                            className="bg-emerald-950/20 border border-emerald-900/40 hover:bg-emerald-900/20 rounded-lg py-2.5 flex flex-col items-center justify-center cursor-pointer transition text-emerald-400 active:scale-95 font-black text-xs"
                            title="Boundary Four"
                          >
                            <span className="text-sm font-black text-emerald-455 font-extrabold">4</span>
                            <span className="text-[8px] text-emerald-500 font-sans uppercase font-bold mt-1">four</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleScoreBall("six", 6)}
                            className="bg-orange-950/25 border border-orange-900/45 hover:bg-orange-850/20 rounded-lg py-2.5 flex flex-col items-center justify-center cursor-pointer transition text-orange-400 active:scale-95 font-black text-xs"
                            title="Maximum Six"
                          >
                            <span className="text-sm font-black text-orange-455 font-extrabold">6</span>
                            <span className="text-[8px] text-orange-500 font-sans uppercase font-bold mt-1">six</span>
                          </button>

                        </div>
                      </div>

                      {/* Section B: Extra Runs Delivery Panel (Wide, NoBall, Byes) */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">B: Extras Deliveries (Non-batter runs)</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
                          
                          <button
                            type="button"
                            onClick={() => handleScoreBall("wide", 0)}
                            className="bg-slate-950 border border-slate-800 hover:bg-slate-850 rounded-lg py-2 px-1 flex flex-col justify-center items-center text-slate-300 transition text-xs font-bold font-mono cursor-pointer"
                          >
                            <span>Wide Delivery (+1)</span>
                            <span className="text-[8px] text-slate-500 uppercase font-sans font-bold block mt-0.5">no ball faced</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleScoreBall("noball", 0)}
                            className="bg-slate-950 border border-slate-800 hover:bg-slate-850 rounded-lg py-2 px-1 flex flex-col justify-center items-center text-slate-305 text-slate-300 transition text-xs font-bold font-mono cursor-pointer"
                          >
                            <span>No-Ball Penalty (+1)</span>
                            <span className="text-[8px] text-slate-500 uppercase font-sans font-bold block mt-0.5">Free Hit chance</span>
                          </button>

                          {/* Bye runs button menu */}
                          <div className="bg-slate-950 border border-slate-800 rounded-lg p-1 flex flex-col justify-center items-center gap-1">
                            <span className="text-[9px] text-slate-550 text-slate-500 uppercase font-bold font-sans">Byes Extras</span>
                            <div className="flex gap-1">
                              {[1, 2, 4].map(r => (
                                <button
                                  type="button"
                                  key={r}
                                  onClick={() => handleScoreBall("bye", r)}
                                  className="px-1.5 bg-slate-900 hover:bg-slate-800 text-[9px] text-amber-500 font-bold border border-slate-800 rounded cursor-pointer py-1"
                                >
                                  +{r}B
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Leg bye runs button menu */}
                          <div className="bg-slate-950 border border-slate-800 rounded-lg p-1 flex flex-col justify-center items-center gap-1">
                            <span className="text-[9px] text-slate-550 text-slate-500 uppercase font-bold font-sans">Leg Byes Extras</span>
                            <div className="flex gap-1 font-mono">
                              {[1, 2, 4].map(r => (
                                <button
                                  type="button"
                                  key={r}
                                  onClick={() => handleScoreBall("legbye", r)}
                                  className="px-1.5 bg-slate-900 hover:bg-slate-800 text-[9px] text-orange-400 font-bold border border-slate-800 rounded cursor-pointer py-1"
                                >
                                  +{r}LB
                                </button>
                              ))}
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* Section C: DISMISSALS & DISMISSAL POPUP TRIGGERS (Wickets) */}
                      <div className="border-t border-slate-800 pt-3.5 flex flex-wrap gap-2.5 justify-between items-center text-xs font-mono">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">C: Match Dismissals Panel</span>
                          <span className="text-[9px] text-slate-550 text-slate-500 block leading-tight">Registers standard wickets to update scoreboard live.</span>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => {
                            setDismissedBatsman(striker);
                            setDismissalFielder("");
                            setDismissalModalOpen(true);
                          }}
                          className="bg-red-955/45 hover:bg-red-955/60 bg-red-950/45 hover:bg-red-950/60 border border-red-900/40 text-red-300 py-2.5 px-6 font-bold rounded-lg flex items-center space-x-1.5 transition active:scale-95 cursor-pointer uppercase text-xs"
                        >
                          <span>🔴 Out / Dismiss Batter</span>
                        </button>
                      </div>

                    </div>

                    {/* Active Match Setup Droppers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-slate-950 p-4 rounded-xl border border-slate-850 text-xs font-mono">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center bg-slate-900/40 p-1.5 rounded">
                          <span className="text-slate-400 font-bold">🏏 Active Batters</span>
                          <button
                            type="button"
                            onClick={() => {
                              const temp = striker;
                              setStriker(nonStriker);
                              setNonStriker(temp);
                              setFakeMsgAlert("Strike swapped! Handoff rearranged. 🔄");
                            }}
                            className="text-[9px] text-orange-400 hover:underline cursor-pointer bg-orange-950/40 px-2 py-0.5 rounded border border-orange-900/30 font-bold"
                          >
                            🔄 Swap Strike
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-500 block mb-1">Striker (Facing)</span>
                            <select
                              value={striker}
                              onChange={(e) => {
                                setStriker(e.target.value);
                                if (e.target.value === nonStriker) {
                                  const alternative = teamAPlayers.find(p => p !== e.target.value && !(batsmanScores[p]?.isOut)) || "";
                                  setNonStriker(alternative);
                                }
                              }}
                              className="bg-slate-900 text-slate-100 border border-slate-800 rounded px-2 py-1.5 w-full focus:outline-none focus:border-orange-500 cursor-pointer text-xs"
                            >
                              {teamAPlayers.filter(p => !batsmanScores[p]?.isOut).map((player, pIdx) => (
                                <option key={pIdx} value={player}>
                                  {player}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block mb-1">Non-Striker (Runner)</span>
                            <select
                              value={nonStriker}
                              onChange={(e) => {
                                setNonStriker(e.target.value);
                                if (e.target.value === striker) {
                                  const alternative = teamAPlayers.find(p => p !== e.target.value && !(batsmanScores[p]?.isOut)) || "";
                                  setStriker(alternative);
                                }
                              }}
                              className="bg-slate-900 text-slate-100 border border-slate-800 rounded px-2 py-1.5 w-full focus:outline-none focus:border-orange-500 cursor-pointer text-xs"
                            >
                              {teamAPlayers.filter(p => p !== striker && !batsmanScores[p]?.isOut).map((player, pIdx) => (
                                <option key={pIdx} value={player}>
                                  {player}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 border-t md:border-t-0 md:border-l border-slate-855 pt-3 md:pt-0 md:pl-3.5">
                        <span className="text-slate-400 block font-bold bg-slate-900/40 p-1.5 rounded font-bold">⚾ Active Bowler Selection</span>
                        <div>
                          <span className="text-[10px] text-slate-500 block mb-1">Bowler from {teamB}</span>
                          <select
                            value={bowler}
                            onChange={(e) => setBowler(e.target.value)}
                            className="bg-slate-900 text-slate-100 border border-slate-800 rounded px-2 py-1.5 w-full focus:outline-none focus:border-orange-500 cursor-pointer text-xs"
                          >
                            {teamBPlayers.map((player, pIdx) => (
                              <option key={pIdx} value={player}>
                                {player}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* LIVE UPDATING PLAYER SCOREBOARD CARD */}
                    <div className="bg-[#111827]/80 rounded-xl border border-slate-800/80 p-4 font-mono text-xs space-y-3.5 shadow-md">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 border-b border-slate-800 pb-1.5 uppercase tracking-wider">
                        <span>🏏 Active Batsmen Metrics</span>
                        <span className="text-orange-400 font-bold">Batting Extras: {extras.byes + extras.legByes} Runs</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Striker Stats Box */}
                        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-850/60 flex flex-col justify-between relative overflow-hidden">
                          <div className="absolute top-2 right-2 bg-orange-600 text-white rounded text-[8px] font-bold px-1.5 py-0.2 animate-pulse uppercase">
                            Strike
                          </div>
                          <span className="text-slate-200 font-black text-sm">🏏 {striker}*</span>
                          <div className="grid grid-cols-4 gap-1 text-[10px] text-slate-400 mt-2">
                             <div>
                               <p className="text-slate-500 text-[9px] uppercase">runs</p>
                               <p className="font-extrabold text-orange-400 text-sm leading-tight mt-0.5">{batsmanScores[striker]?.runs ?? 0}</p>
                             </div>
                             <div>
                               <p className="text-slate-500 text-[9px] uppercase">balls</p>
                               <p className="font-bold text-slate-300 mt-1 leading-none">{batsmanScores[striker]?.balls ?? 0}</p>
                             </div>
                             <div>
                               <p className="text-slate-500 text-[9px] uppercase">4s / 6s</p>
                               <p className="text-slate-300 mt-1 leading-none">{batsmanScores[striker]?.fours ?? 0} / {batsmanScores[striker]?.sixes ?? 0}</p>
                             </div>
                             <div>
                               <p className="text-slate-500 text-[9px] uppercase">s/r</p>
                               <p className="text-slate-300 mt-1 leading-none">
                                 {(((batsmanScores[striker]?.runs ?? 0) / Math.max(1, batsmanScores[striker]?.balls ?? 0)) * 100).toFixed(0)}
                               </p>
                             </div>
                          </div>
                        </div>

                        {/* Non-Striker Stats Box */}
                        <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-870 flex flex-col justify-between">
                          <span className="text-slate-300 font-bold text-sm">🏏 {nonStriker}</span>
                          <div className="grid grid-cols-4 gap-1 text-[10px] text-slate-400 mt-2">
                            <div>
                              <p className="text-slate-500 text-[9px] uppercase">runs</p>
                              <p className="font-bold text-slate-200 text-sm leading-tight mt-0.5">{batsmanScores[nonStriker]?.runs ?? 0}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-[9px] uppercase">balls</p>
                              <p className="font-bold text-slate-400 mt-1 leading-none">{batsmanScores[nonStriker]?.balls ?? 0}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-[9px] uppercase">4s / 6s</p>
                              <p className="text-slate-400 mt-1 leading-none">{batsmanScores[nonStriker]?.fours ?? 0} / {batsmanScores[nonStriker]?.sixes ?? 0}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-[9px] uppercase">s/r</p>
                              <p className="text-slate-400 mt-1 leading-none">
                                {(((batsmanScores[nonStriker]?.runs ?? 0) / Math.max(1, batsmanScores[nonStriker]?.balls ?? 0)) * 105 / 105).toFixed(0)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Current Bowler and Extras Summary Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-slate-800">
                        {/* Bowler figures box */}
                        <div className="flex justify-between items-center text-[11px] bg-slate-900/40 p-2.5 rounded-lg border border-slate-850/40">
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase text-slate-500 font-bold leading-none mb-1">Active bowler analysis</span>
                            <span className="text-indigo-400 font-bold">⚾ {bowler}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-200 font-black text-[13px]">
                              {bowlerStats[bowler]?.overs ?? 0}.{bowlerStats[bowler]?.balls ?? 0} - {bowlerStats[bowler]?.runs ?? 0} - {bowlerStats[bowler]?.wickets ?? 0}
                            </span>
                            <span className="text-[8px] text-slate-500 block">O-M-R-W</span>
                          </div>
                        </div>

                        {/* Extras counts panel */}
                        <div className="flex justify-between items-center text-[10px] bg-slate-900/40 p-2.5 rounded-lg border border-slate-850/40 leading-none">
                          <div className="space-y-1">
                            <span className="text-slate-400 block text-[9px] uppercase font-bold mb-1">Extras Breakdown</span>
                            <div className="flex flex-wrap gap-2 text-slate-300">
                              <span>Wd: <strong>{extras.wides}</strong></span>
                              <span>Nb: <strong>{extras.noBalls}</strong></span>
                              <span>By: <strong>{extras.byes}</strong></span>
                              <span>Lb: <strong>{extras.legByes}</strong></span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-slate-400 font-black text-xs block">
                              {extras.wides + extras.noBalls + extras.byes + extras.legByes}
                            </span>
                            <span className="text-[8px] text-slate-500 block uppercase font-bold mt-0.5 text-right w-full">Total extras</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* COLLAPSIBLE ACTIVE MATCH SUMMARY CARD */}
                    <div className="bg-[#111827]/80 rounded-xl border border-slate-800/80 p-4 font-mono text-xs space-y-3 shadow-md">
                      {/* Accordion Trigger Header */}
                      <button
                        type="button"
                        onClick={() => setSummaryExpanded(!summaryExpanded)}
                        className="w-full flex justify-between items-center text-left focus:outline-none group cursor-pointer"
                      >
                        <div className="space-y-0.5">
                          <h4 className="font-sans font-bold text-slate-200 tracking-tight text-xs flex items-center gap-2 group-hover:text-orange-405 group-hover:text-amber-500 transition">
                            📊 Full Match Squad Summary
                            <span className="bg-slate-900 border border-slate-800 px-1.5 py-0.2 text-[8px] rounded font-mono text-slate-400 uppercase">
                              {summaryExpanded ? "Collapse" : "Expand"}
                            </span>
                          </h4>
                          <p className="text-[10px] text-slate-500 font-sans">
                            Review all batsmen and bowlers aggregate statistics at a glance
                          </p>
                        </div>
                        <div className="p-1 rounded bg-slate-950 border border-slate-850 group-hover:border-orange-500/30 transition">
                          <motion.span
                            animate={{ rotate: summaryExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="block text-slate-400 group-hover:text-orange-400 text-[10px] px-1"
                          >
                            ▼
                          </motion.span>
                        </div>
                      </button>

                      <AnimatePresence initial={false}>
                        {summaryExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="overflow-hidden space-y-4 pt-3 border-t border-slate-800/50"
                          >
                            {/* Batting Team Stats */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-center bg-slate-950/70 p-2 rounded-lg border border-slate-850">
                                <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">
                                  🏏 Batting Performance: {teamA}
                                </span>
                                <span className="text-[9px] text-slate-400">
                                  Score: <strong>{score}-{wickets}</strong> ({overs}.{balls} Ov)
                                </span>
                              </div>
                              
                              <div className="overflow-x-auto rounded-lg border border-slate-850 bg-slate-900/15">
                                <table className="w-full text-left font-mono text-[10px] border-collapse">
                                  <thead>
                                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold">
                                      <th className="py-2 px-2.5">Batter</th>
                                      <th className="py-2 px-1 text-center">Status</th>
                                      <th className="py-2 px-1.5 text-center">Runs</th>
                                      <th className="py-2 px-1.5 text-center">Balls</th>
                                      <th className="py-2 px-1 text-center">4s/6s</th>
                                      <th className="py-2 px-2 text-right">S/R</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {teamAPlayers.map((player) => {
                                      const bStats = batsmanScores[player] || { runs: 0, balls: 0, dots: 0, fours: 0, sixes: 0, isOut: false, dismissalText: "" };
                                      const isCurrentStriker = player === striker;
                                      const isCurrentNonStriker = player === nonStriker;
                                      const isActive = isCurrentStriker || isCurrentNonStriker;

                                      let statusLabel = "Yet to bat";
                                      let statusColor = "text-slate-500";
                                      if (bStats.isOut) {
                                        statusLabel = bStats.dismissalText || "Out";
                                        statusColor = "text-rose-500";
                                      } else if (isCurrentStriker) {
                                        statusLabel = "Striker";
                                        statusColor = "text-orange-400 font-bold";
                                      } else if (isCurrentNonStriker) {
                                        statusLabel = "Non-Striker";
                                        statusColor = "text-amber-500 font-bold";
                                      } else if (bStats.balls > 0) {
                                        statusLabel = "Not Out";
                                        statusColor = "text-emerald-500";
                                      }

                                      const strikeRate = bStats.balls > 0 ? ((bStats.runs / bStats.balls) * 100).toFixed(0) : "0";

                                      return (
                                        <tr 
                                          key={player} 
                                          className={`border-b border-slate-900/40 hover:bg-slate-900/20 transition ${
                                            isActive ? "bg-orange-500/10 font-bold text-orange-200" : "text-slate-350"
                                          }`}
                                        >
                                          <td className="py-2 px-2.5 font-bold">
                                            {player} {isCurrentStriker ? "⚡" : ""}
                                          </td>
                                          <td className={`py-1.5 px-1 text-center text-[9px] ${statusColor}`}>
                                            {statusLabel}
                                          </td>
                                          <td className="py-1.5 px-1.5 text-center text-orange-400 font-black">
                                            {bStats.runs}
                                          </td>
                                          <td className="py-1.5 px-1.5 text-center text-slate-450">
                                            {bStats.balls}
                                          </td>
                                          <td className="py-1.5 px-1 text-center text-slate-400">
                                            {bStats.fours} / {bStats.sixes}
                                          </td>
                                          <td className="py-2 px-2 text-right text-slate-300">
                                            {strikeRate}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Bowling Team Stats */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-center bg-slate-950/70 p-2 rounded-lg border border-slate-850">
                                <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                                  ⚾ Bowling Performance: {teamB}
                                </span>
                                <span className="text-[9px] text-slate-450">
                                  Target: <strong>{target}</strong>
                                </span>
                              </div>

                              <div className="overflow-x-auto rounded-lg border border-slate-850 bg-slate-900/15">
                                <table className="w-full text-left font-mono text-[10px] border-collapse">
                                  <thead>
                                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold">
                                      <th className="py-2 px-2.5">Bowler</th>
                                      <th className="py-2 px-1.5 text-center">Overs</th>
                                      <th className="py-2 px-1.5 text-center">Runs</th>
                                      <th className="py-2 px-1.5 text-center">Wickets</th>
                                      <th className="py-2 px-2 text-right">Econ</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {teamBPlayers.map((player) => {
                                      const bStats = bowlerStats[player] || { overs: 0, balls: 0, runs: 0, wickets: 0, maidens: 0 };
                                      const isActiveBowler = player === bowler;

                                      const totalOversFraction = bStats.overs + (bStats.balls / 6);
                                      const economy = totalOversFraction > 0 ? (bStats.runs / totalOversFraction).toFixed(2) : "0.00";

                                      return (
                                        <tr 
                                          key={player} 
                                          className={`border-b border-slate-900/40 hover:bg-slate-900/20 transition ${
                                            isActiveBowler ? "bg-indigo-500/10 font-bold text-indigo-200" : "text-slate-350"
                                          }`}
                                        >
                                          <td className="py-2 px-2.5 font-bold">
                                            {player} {isActiveBowler ? "⚾" : ""}
                                          </td>
                                          <td className="py-1.5 px-1.5 text-center text-slate-300">
                                            {bStats.overs}.{bStats.balls}
                                          </td>
                                          <td className="py-1.5 px-1.5 text-center text-rose-400">
                                            {bStats.runs}
                                          </td>
                                          <td className="py-1.5 px-1.5 text-center text-emerald-400 font-extrabold">
                                            {bStats.wickets}
                                          </td>
                                          <td className="py-2 px-2 text-right text-indigo-300">
                                            {economy}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* RUN-RATE & CUMULATIVE PROGRESSION CHART CARD */}
                    <div className="bg-[#111827]/80 rounded-xl border border-slate-800/80 p-4 font-mono text-xs space-y-3.5 shadow-md">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-2.5 gap-2">
                        <div className="space-y-0.5">
                          <h4 className="font-sans font-bold text-slate-200 tracking-tight text-xs flex items-center gap-1.5">
                            📊 Innings Run-Rate Progression
                          </h4>
                          <p className="text-[10px] text-slate-500 font-sans">Live ball-by-ball performance visualization</p>
                        </div>
                        
                        {/* Selector tabs for Chart Mode */}
                        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-850 gap-1 text-[9px] font-bold">
                          <button
                            type="button"
                            onClick={() => setChartMode("runRate")}
                            className={`px-2.5 py-1 rounded transition cursor-pointer ${
                              chartMode === "runRate" 
                                ? "bg-orange-600 text-white font-extrabold" 
                                : "text-slate-400 hover:text-slate-350"
                            }`}
                          >
                            📈 Run Rate
                          </button>
                          <button
                            type="button"
                            onClick={() => setChartMode("cumulative")}
                            className={`px-2.5 py-1 rounded transition cursor-pointer ${
                              chartMode === "cumulative" 
                                ? "bg-orange-600 text-white font-extrabold" 
                                : "text-slate-400 hover:text-slate-350"
                            }`}
                          >
                            📈 Total Runs
                          </button>
                        </div>
                      </div>

                      {/* Scoreboard helper stats row inside chart header */}
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                        <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-850/40">
                          <span className="text-slate-500 block text-[8px] uppercase">Current Run Rate</span>
                          <span className="text-orange-400 font-extrabold text-xs">
                            {(() => {
                              const currOversNum = overs + (balls / 6);
                              return currOversNum > 0 ? (score / currOversNum).toFixed(2) : "0.00";
                            })()}
                          </span>
                        </div>
                        <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-850/40">
                          <span className="text-slate-500 block text-[8px] uppercase">Required Run Rate</span>
                          <span className="text-amber-500 font-extrabold text-xs">
                            {(() => {
                              const oversRemaining = 20 - (overs + (balls / 6));
                              if (target <= score) return "0.00";
                              return oversRemaining > 0 ? ((target - score) / oversRemaining).toFixed(2) : "0.00";
                            })()}
                          </span>
                        </div>
                        <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-850/40">
                          <span className="text-slate-500 block text-[8px] uppercase">Projected Score</span>
                          <span className="text-indigo-400 font-extrabold text-xs">
                            {(() => {
                              const currOversNum = overs + (balls / 6);
                              const crr = currOversNum > 0 ? (score / currOversNum) : 0;
                              return Math.round(score + crr * (20 - currOversNum));
                            })()}
                          </span>
                        </div>
                      </div>

                      {/* Chart container */}
                      <div className="h-44 w-full bg-slate-950/70 rounded-lg p-2 border border-slate-850/40 flex items-center justify-center relative overflow-hidden">
                        {runRateHistory.length <= 1 ? (
                          <div className="text-center space-y-1 font-sans">
                            <p className="text-slate-400 font-semibold text-xs">Waiting for deliveries...</p>
                            <p className="text-[10px] text-slate-500">Perform run events to plot history live</p>
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart 
                              data={runRateHistory} 
                              margin={{ top: 10, right: 10, left: -25, bottom: -5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                              <XAxis 
                                dataKey="ballLabel" 
                                stroke="#64748b" 
                                fontSize={9}
                                tickLine={false}
                                minTickGap={20}
                              />
                              <YAxis 
                                stroke="#64748b" 
                                fontSize={9}
                                tickLine={false}
                                domain={chartMode === "runRate" ? ['auto', 'auto'] : [0, 'auto']}
                              />
                              <ChartTooltip
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload as RunRateDataPoint;
                                    return (
                                      <div className="bg-slate-900 border border-slate-850 p-2 rounded-lg shadow-xl space-y-1 font-mono text-[9px] text-slate-300 pointer-events-none">
                                        <p className="text-orange-400 font-bold">Over: {data.ballLabel}</p>
                                        <div className="space-y-0.5 border-t border-slate-800/80 pt-1 mt-1 text-slate-400">
                                          <p>Score: <strong className="text-slate-100">{data.score}/{data.wickets}</strong></p>
                                          <p>Run Rate: <strong className="text-slate-100">{data.runRate.toFixed(2)}</strong></p>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              
                              {chartMode === "runRate" ? (
                                <>
                                  <Line 
                                    type="monotone" 
                                    dataKey="runRate" 
                                    stroke="#ea580c" 
                                    strokeWidth={2.5}
                                    dot={{ stroke: '#f97316', strokeWidth: 1, r: 1.5, fill: '#0f172a' }}
                                    activeDot={{ r: 4, strokeWidth: 1 }}
                                  />
                                  {/* Draw line for Required Run Rate */}
                                  {(() => {
                                    const oversRemaining = 20 - (overs + (balls / 6));
                                    const rrr = (target > score && oversRemaining > 0) ? ((target - score) / oversRemaining) : 0;
                                    return rrr > 0 ? (
                                      <ReferenceLine 
                                        y={parseFloat(rrr.toFixed(2))} 
                                        stroke="#10b981" 
                                        strokeDasharray="3 3"
                                        label={{ value: 'RRR', fill: '#10b981', fontSize: 8, position: 'insideRight' }}
                                      />
                                    ) : null;
                                  })()}
                                </>
                              ) : (
                                <>
                                  <Line 
                                    type="monotone" 
                                    dataKey="score" 
                                    stroke="#ec4899" 
                                    strokeWidth={2.5}
                                    dot={{ stroke: '#f472b6', strokeWidth: 1, r: 1.5, fill: '#0f172a' }}
                                    activeDot={{ r: 4 }}
                                  />
                                  {/* Draw line for target score */}
                                  {target > 0 && (
                                    <ReferenceLine 
                                      y={target} 
                                      stroke="#ef4444" 
                                      strokeDasharray="4 4"
                                      label={{ value: 'Target', fill: '#ef4444', fontSize: 8, position: 'top' }}
                                    />
                                  )}
                                </>
                              )}
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>

                    {/* --- DIALOG MODALS INLINE RENDER --- */}

                    {/* 1. DISMISSAL MODAL PANEL */}
                    {dismissalModalOpen && (
                      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 w-full max-w-sm space-y-4 shadow-2xl font-mono text-xs"
                        >
                          <div className="border-b border-slate-800 pb-2">
                            <h4 className="text-slate-200 font-black text-sm">🏏 Match Official Dismissal Panel</h4>
                            <p className="text-[10px] text-slate-550 text-slate-500 font-sans mt-0.5">Select a dismissal category from the list.</p>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <label className="text-slate-400 block mb-1">1. Dismissal Outcome Type</label>
                              <select
                                value={dismissalType}
                                onChange={(e) => setDismissalType(e.target.value)}
                                className="bg-slate-950 border border-slate-850 px-2.5 py-1.5 rounded text-slate-200 w-full focus:outline-none cursor-pointer text-xs"
                              >
                                <option value="Caught Out">Caught Out</option>
                                <option value="Bowled">Bowled Out</option>
                                <option value="LBW">LBW (Leg Before Wicket)</option>
                                <option value="Stumped">Stumped Out</option>
                                <option value="Run Out">Run Out</option>
                                <option value="Hit Wicket">Hit Wicket</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-slate-400 block mb-1">2. Dismissed Batsman</label>
                              <select
                                value={dismissedBatsman}
                                onChange={(e) => setDismissedBatsman(e.target.value)}
                                className="bg-slate-950 border border-slate-850 px-2.5 py-1.5 rounded text-slate-200 w-full focus:outline-none cursor-pointer text-xs"
                              >
                                <option value={striker}>{striker} (Striker)</option>
                                <option value={nonStriker}>{nonStriker} (Non-Striker)</option>
                              </select>
                            </div>

                            {["Caught Out", "Stumped", "Run Out"].includes(dismissalType) && (
                              <div>
                                <label className="text-slate-400 block mb-1">3. Active Fielder Name (Optional)</label>
                                <input
                                  type="text"
                                  value={dismissalFielder}
                                  onChange={(e) => setDismissalFielder(e.target.value)}
                                  placeholder="e.g. Mitchell Starc"
                                  className="bg-slate-955 bg-slate-950 border border-slate-850 px-2.5 py-1.5 rounded text-slate-200 w-full focus:outline-none focus:border-orange-500"
                                />
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 justify-end pt-2.5 border-t border-slate-800">
                            <button
                              type="button"
                              onClick={() => setDismissalModalOpen(false)}
                              className="px-3 py-1.5 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-400 rounded cursor-pointer font-bold font-mono"
                            >
                              ✕ Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                // Execute final wicket placement
                                let text = "";
                                if (dismissalType === "Caught Out") {
                                  text = dismissalFielder ? `c. ${dismissalFielder} b. ${bowler}` : `c. Fielder b. ${bowler}`;
                                } else if (dismissalType === "Stumped") {
                                  text = dismissalFielder ? `st. ${dismissalFielder} b. ${bowler}` : `st. Keeper b. ${bowler}`;
                                } else if (dismissalType === "Run Out") {
                                  text = dismissalFielder ? `run out (${dismissalFielder})` : "run out";
                                } else {
                                  text = dismissalType === "LBW" ? `lbw b. ${bowler}` : dismissalType === "Hit Wicket" ? `hit wicket b. ${bowler}` : `b. ${bowler}`;
                                }

                                const targetIsStriker = dismissedBatsman === striker;
                                updateBatsmanStats(dismissedBatsman, 0, true, text);
                                
                                // Bowler gets wicket except for Run out
                                const bowledWd = dismissalType !== "Run Out";
                                updateBowlerStats(bowler, 0, true, bowledWd);

                                const nextWickets = wickets + 1;
                                setWickets(nextWickets);
                                setCelebration(`WICKET! Dismissed ${dismissedBatsman}`);
                                cricketBgm.playDynamicCheer("wicket");

                                // Close this modal
                                setDismissalModalOpen(false);

                                if (nextWickets < 10) {
                                  // Prompt for incoming batsman
                                  setNextBatsmanSelectionOpen(true);
                                } else {
                                  setFakeMsgAlert("Match Inning complete! Team is all out.");
                                }
                              }}
                              className="px-4 py-1.5 bg-red-600 hover:bg-red-550 text-white rounded cursor-pointer font-bold font-mono"
                            >
                              Confirm Wicket OUT
                            </button>
                          </div>
                        </motion.div>
                      </div>
                    )}

                    {/* 2. CHOOSE NEXT BATSMAN MODAL */}
                    {nextBatsmanSelectionOpen && (
                      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 w-full max-w-sm space-y-4 shadow-2xl font-mono text-xs"
                        >
                          <div className="border-b border-slate-800 pb-2">
                            <h4 className="text-slate-200 font-black text-sm">🏏 Select Incoming Batsman</h4>
                            <p className="text-[10px] text-slate-500 font-sans mt-0.5">Please specify the next batsman for {teamA}.</p>
                          </div>

                          <div className="space-y-3">
                            <label className="text-slate-400 block mb-1">Choose Not-Out Player</label>
                            <select
                              id="next-incoming-batsman-select"
                              className="bg-slate-950 border border-slate-850 px-2.5 py-1.5 rounded text-slate-200 w-full focus:outline-none cursor-pointer text-xs"
                              defaultValue={teamAPlayers.find(p => !batsmanScores[p]?.isOut && p !== striker && p !== nonStriker) || ""}
                            >
                              {teamAPlayers.filter(p => !batsmanScores[p]?.isOut && p !== striker && p !== nonStriker).map((player, pIdx) => (
                                <option key={pIdx} value={player}>
                                  {player}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex justify-end pt-2 border-t border-slate-800">
                            <button
                              type="button"
                              onClick={() => {
                                const selectEl = document.getElementById("next-incoming-batsman-select") as HTMLSelectElement;
                                const chosen = selectEl ? selectEl.value : "";
                                if (chosen) {
                                  const strikerOut = batsmanScores[striker]?.isOut;
                                  if (strikerOut) {
                                    setStriker(chosen);
                                  } else {
                                    setNonStriker(chosen);
                                  }
                                  setNextBatsmanSelectionOpen(false);
                                  setFakeMsgAlert(`${chosen} is walking down the pitch to bat! 🏏`);
                                } else {
                                  setNextBatsmanSelectionOpen(false);
                                }
                              }}
                              className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-555 text-white rounded cursor-pointer font-bold font-mono"
                            >
                              Send to Batting Pitch
                            </button>
                          </div>
                        </motion.div>
                      </div>
                    )}

                    {/* 3. BOUNDARY OVER COMPLETED: SELECT NEXT BOWLER */}
                    {nextBowlerPromptOpen && (
                      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-4">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 w-full max-w-sm space-y-4 shadow-2xl font-mono text-xs"
                        >
                          <div className="border-b border-slate-800 pb-2 text-indigo-400">
                            <h4 className="text-slate-200 font-black text-sm">⚾ Over Finished! Select New Bowler</h4>
                            <p className="text-[10px] text-slate-500 font-sans mt-0.5">Please assign the bowler for the next over.</p>
                          </div>

                          <div className="space-y-3">
                            <label className="text-slate-400 block mb-1">Choose bowler from {teamB}</label>
                            <select
                              id="next-incoming-bowler-select"
                              className="bg-slate-950 border border-slate-850 px-2.5 py-1.5 rounded text-slate-200 w-full focus:outline-none cursor-pointer text-xs"
                              defaultValue={teamBPlayers.find(p => p !== bowler) || bowler}
                            >
                              {teamBPlayers.map((player, pIdx) => (
                                <option key={pIdx} value={player}>
                                  {player}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex justify-end pt-2 border-t border-slate-800">
                            <button
                              type="button"
                              onClick={() => {
                                const selectEl = document.getElementById("next-incoming-bowler-select") as HTMLSelectElement;
                                const chosen = selectEl ? selectEl.value : "";
                                if (chosen) {
                                  setBowler(chosen);
                                  setNextBowlerPromptOpen(false);
                                  setFakeMsgAlert(`${chosen} is taking over the bowling runup! ⚡`);
                                } else {
                                  setNextBowlerPromptOpen(false);
                                }
                              }}
                              className="px-5 py-1.5 bg-indigo-650 bg-indigo-600 hover:bg-indigo-550 text-white rounded cursor-pointer font-bold font-mono"
                            >
                              Start New Over Now
                            </button>
                          </div>
                        </motion.div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            )}

            {liveSubTab === "commentary" && (
              <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">Voice Commentary Feed</h3>
                    <p className="text-[10px] text-slate-500 leading-normal">Live simulated sports broadcaster voice generated of match updates.</p>
                  </div>
                  
                  {/* Dedicated live commentary speaker on/off toggle button */}
                  <button
                    id="commentary-panel-speaker-toggle"
                    onClick={() => {
                      const nextVal = !isSpeakerOn;
                      setIsSpeakerOn(nextVal);
                      if (!nextVal && typeof window !== "undefined" && window.speechSynthesis) {
                        window.speechSynthesis.cancel();
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition text-[10px] font-mono font-bold cursor-pointer border ${
                      isSpeakerOn
                        ? "bg-emerald-950/50 text-emerald-400 border-emerald-800/40"
                        : "bg-rose-950/45 text-rose-400 border-rose-900/35"
                    }`}
                  >
                    {isSpeakerOn ? (
                      <>
                        <Volume2 className="h-3.5 w-3.5 text-emerald-450" />
                        <span>SPEAKER: ON</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="h-3.5 w-3.5 text-rose-455" />
                        <span>SPEAKER: OFF</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
                  {commentaryLoading && (
                    <div className="flex items-center space-x-2 p-3 bg-slate-950 rounded border border-slate-850 animate-pulse">
                      <span className="h-2 w-2 rounded-full bg-orange-500 animate-ping"></span>
                      <span className="text-xs text-slate-400 font-mono">
                        Gemini formulating voice radio commentary lines...
                      </span>
                    </div>
                  )}

                  {commentaryList.length === 0 && !commentaryLoading && (
                    <div className="text-center text-slate-500 py-12 font-mono text-xs">
                      No balls scored yet. Register innings actions in the &ldquo;Scoring&rdquo; tab to stream radio quotes.
                    </div>
                  )}

                  {commentaryList.map((comm, cIdx) => (
                    <div key={cIdx} className="p-3 bg-slate-950 rounded-xl border border-slate-850 text-xs leading-relaxed space-y-1 select-text">
                      <div className="flex justify-between items-center text-[9px] font-mono text-slate-550 border-b border-slate-900 pb-1 mb-1">
                        <span>BALL {comm.ball} ({comm.style.toUpperCase()} COGNIZANT VOICE)</span>
                        <span className="text-[8px] bg-amber-950 text-amber-400 border border-amber-900/40 px-1.5 rounded font-bold animate-pulse">
                          {comm.aiPowered ? "AI Engine" : "System Fallback"}
                        </span>
                      </div>
                      <p className="italic font-serif text-slate-350">
                        &ldquo;{comm.text}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {liveSubTab === "hawkEye" && (
              <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow space-y-4">
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">HawkEye Trajectory Tracking Cam</h3>
                  <p className="text-[10px] text-slate-500 leading-normal">Projecting 3D HawkEye ball landing. Click coordinates on green turf area to map deliveries pins!</p>
                </div>

                <div className="bg-slate-950 aspect-video rounded-xl border border-slate-850 relative overflow-hidden select-none flex flex-col justify-between p-3">
                  
                  {/* Pitch coordinates target */}
                  <div className="absolute inset-0 z-10 cursor-crosshair" onClick={handlePitchClick}>
                    
                    {/* Path mapping draw overlay */}
                    {ballsHistoryOnPitch.length > 1 && (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <path 
                          d={`M 10 100 ${ballsHistoryOnPitch.map((pt) => `Q ${pt.x}% ${pt.y}%`).join(' ')}`}
                          fill="none" 
                          stroke="#eab308" 
                          strokeWidth="1.5" 
                          strokeDasharray="4"
                        />
                      </svg>
                    )}

                    {/* Plots */}
                    {ballsHistoryOnPitch.map((pt, idx) => (
                      <div 
                        key={idx}
                        className={`absolute h-4.5 w-4.5 rounded-full flex items-center justify-center -translate-x-1/2 -translate-y-1/2 border border-white text-[9px] font-mono font-black text-white shadow-md animate-bounce ${pt.colorName}`}
                        style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                      >
                        {idx + 1}
                      </div>
                    ))}
                  </div>

                  {/* Top telemetry layer indicators */}
                  <div className="bg-[#0c1221]/95 p-2 rounded-lg border border-slate-800 font-mono text-[9px] text-slate-300 w-fit z-15 space-y-0.5">
                    <p className="text-amber-450 font-bold uppercase tracking-wider">Vision tracking layers</p>
                    <p className="text-cyan-400">• Last Bounce Length: {lastBounceType}</p>
                    <p className="text-emerald-450">• Ball velocity: 144.2 km/h stable</p>
                    <p className="text-red-400">• Target Hitbox guard: Lock active</p>
                  </div>

                  {/* Overlay logs bottom */}
                  <div className="z-15 flex justify-between items-center text-[8px] font-mono text-slate-500 leading-none">
                    <span>Frame capturing: yolo-nano 60fps stable</span>
                    <span>Coordinates count: {ballsHistoryOnPitch.length} mapped</span>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-850 font-mono text-[10px]">
                  <span className="text-slate-500">Telemetry points cached</span>
                  <button
                    onClick={() => {
                      setBallsHistoryOnPitch([]);
                      setLastBounceType("Good Length");
                    }} 
                    className="p-1 px-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-350 rounded font-bold cursor-pointer"
                  >
                    Clear Pins
                  </button>
                </div>
              </div>
            )}

            {liveSubTab === "aiCaptain" && (
              <div className="space-y-4">
                
                {/* Win probability log card */}
                <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 shadow-md space-y-3.5 leading-none">
                  <h3 className="font-display font-medium text-slate-200 text-xs uppercase tracking-wider flex justify-between">
                    <span>Win Probability index</span>
                    <span className="text-[10px] text-orange-400 font-mono">XGBoost Logit v3</span>
                  </h3>
                  
                  {/* Slider progress split */}
                  <div className="h-6 rounded-lg overflow-hidden flex font-mono font-bold text-[9px] select-none shadow">
                    <div 
                      className="bg-orange-600 transition-all duration-300 flex items-center justify-center text-white"
                      style={{ width: `${winProbBatting}%` }}
                    >
                      {winProbBatting >= 20 ? `${teamY(teamA)} (${winProbBatting}%)` : ""}
                    </div>
                    <div 
                      className="bg-slate-700 transition-all duration-300 flex items-center justify-center text-slate-300"
                      style={{ width: `${winProbBowling}%` }}
                    >
                      {winProbBowling >= 20 ? `${teamY(teamB)} (${winProbBowling}%)` : ""}
                    </div>
                  </div>
                </div>

                {/* AI Captain advice */}
                <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 shadow-md space-y-3">
                  <h3 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">AI Captain Intelligence</h3>
                  
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-855 space-y-3 text-xs leading-relaxed text-slate-300">
                    <div>
                      <span className="text-[9px] font-mono uppercase text-slate-500 block font-bold mb-0.5">Field positioning adjustments recommendation</span>
                      <p className="text-orange-400 font-semibold">{aiCaptainAdvice.tactics}</p>
                    </div>
                    <div className="border-t border-slate-850/60 pt-2.5">
                      <span className="text-[9px] font-mono uppercase text-slate-500 block font-bold mb-0.5">Pitch bowling vector strategy</span>
                      <p className="text-slate-300">{aiCaptainAdvice.bowlingStrategy}</p>
                    </div>
                    <div className="border-t border-slate-850/60 pt-2.5">
                      <span className="text-[9px] font-mono uppercase text-slate-500 block font-bold mb-0.5">Active batter observed weak spot</span>
                      <p className="text-rose-400 font-medium">{aiCaptainAdvice.weakSpot}</p>
                    </div>
                  </div>
                </div>

              </div>
            )}

              </>
            )}
          </div>
        )}

        {/* VIEW 2: LEAGUE SCHEDULES & TOURNAMENTS */}
        {activeTab === "upcoming" && (
          <TournamentsTab 
            userRole={userSession?.role || "spectator"}
            userSession={userSession}
            onElevateRole={() => {
              if (userSession) {
                const updated = { ...userSession, role: "conducting_person" as const };
                setUserSession(updated);
                localStorage.setItem("cricketverse_auth_user", JSON.stringify(updated));
              }
            }}
            tournaments={tournaments}
            setTournaments={setTournaments}
            selectedTourneyId={selectedTourneyId}
            setSelectedTourneyId={setSelectedTourneyId}
            onLoadLiveMatch={(matchData) => {
              loadMatchIntoDashboard(matchData.matchId, matchData.tournamentId);
              setActiveTab("live");
            }}
          />
        )}

        {/* VIEW 3: COMMUNITY FEED SCROLLS */}
        {activeTab === "community" && (
          <CommunityTab />
        )}

        {/* VIEW 4: PROFILE SETTINGS & PRO TOOLKITS */}
        {activeTab === "profile" && (
          <ProfileTab 
            favoriteFranchise={favoriteFranchise}
            onSetFavoriteFranchise={setFavoriteFranchise}
            commentatorStyle={commentatorStyle}
            onSetCommentatorStyle={setCommentatorStyle}
            userSession={userSession}
            onLogout={() => {
              localStorage.removeItem("cricketverse_auth_user");
              setUserSession(null);
              setActiveTab("live");
            }}
            onElevateRole={() => {
              if (userSession) {
                const updated = { ...userSession, role: "conducting_person" as const };
                setUserSession(updated);
                localStorage.setItem("cricketverse_auth_user", JSON.stringify(updated));
              }
            }}
            tournaments={tournaments}
            setTournaments={setTournaments}
            selectedTourneyId={selectedTourneyId}
            setSelectedTourneyId={setSelectedTourneyId}
            onSwitchTab={setActiveTab}
          />
        )}

      </main>

      {/* 3. STICKY BOTTOM INSTAGRAM NAVIGATION FOOTER */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#0c1221] border-t border-slate-800 flex items-center justify-around px-1 z-40 shadow-2xl py-2">
        
        {/* Foot 1: Live scorer panel */}
        <button
          id="footer-btn-live"
          onClick={() => {
            setActiveTab("live");
            setSelectedLiveMatchId(null);
            localStorage.removeItem("gullypros_selected_live_match_id");
          }}
          className={`flex flex-col items-center justify-center space-y-1 focus:outline-none transition-all duration-150 flex-1 relative cursor-pointer ${
            activeTab === "live" ? "text-orange-400" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <div className="relative">
            <Tv className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-1.5 w-1.5 bg-red-500 rounded-full animate-ping"></span>
          </div>
          <span className="text-[10px] font-mono leading-none font-bold">Live Room</span>
        </button>

        {/* Foot 2: League matches upcoming */}
        <button
          id="footer-btn-upcoming"
          onClick={() => setActiveTab("upcoming")}
          className={`flex flex-col items-center justify-center space-y-1 focus:outline-none transition-all duration-150 flex-1 cursor-pointer ${
            activeTab === "upcoming" ? "text-orange-400" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Trophy className="h-5 w-5" />
          <span className="text-[10px] font-mono leading-none font-bold">Upcoming</span>
        </button>

        {/* Foot 3: Social feed and pooling */}
        <button
          id="footer-btn-community"
          onClick={() => setActiveTab("community")}
          className={`flex flex-col items-center justify-center space-y-1 focus:outline-none transition-all duration-150 flex-1 cursor-pointer ${
            activeTab === "community" ? "text-orange-400" : "text-slate-500 hover:text-slate-350"
          }`}
        >
          <Heart className="h-5 w-5" />
          <span className="text-[10px] font-mono leading-none font-bold">Community</span>
        </button>

        {/* Foot 4: Franchise Settings and Pro admin calculators */}
        <button
          id="footer-btn-profile"
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center justify-center space-y-1 focus:outline-none transition-all duration-150 flex-1 cursor-pointer ${
            activeTab === "profile" ? "text-orange-400" : "text-slate-500 hover:text-slate-350"
          }`}
        >
          <User className="h-5 w-5" />
          <span className="text-[10px] font-mono leading-none font-bold">Settings</span>
        </button>

      </nav>

      {/* 4 and 6 Boundary Celebration Popup */}
      <AnimatePresence>
        {boundaryPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden pointer-events-none"
          >
            {/* Screen-flash layer with celebratory overlay matching 4/6 event type */}
            <motion.div
              initial={{ opacity: 0.6 }}
              animate={{ opacity: [0, 0.45, 0, 0.45, 0] }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className={`absolute inset-0 select-none ${
                boundaryPopup === 6 
                  ? "bg-gradient-to-tr from-fuchsia-600/35 via-indigo-600/20 to-pink-600/35" 
                  : "bg-gradient-to-tr from-orange-600/25 via-amber-500/10 to-yellow-600/25"
              }`}
            />

            {/* Glowing Broadcaster-Style Popup Badge */}
            <motion.div
              initial={{ scale: 0.35, rotate: -15, y: 80 }}
              animate={{ 
                scale: 1, 
                rotate: 0, 
                y: 0 
              }}
              exit={{ scale: 0.5, opacity: 0, y: -70 }}
              transition={{ type: "spring", duration: 0.8, bounce: 0.35 }}
              className={`relative p-8 rounded-3xl border text-center shadow-2xl ${
                boundaryPopup === 6
                  ? "bg-slate-900 border-fuchsia-500 text-white shadow-fuchsia-500/10"
                  : "bg-slate-900 border-orange-500 text-white shadow-orange-500/10"
              } max-w-xs w-full mx-auto font-sans pointer-events-auto border-t-4`}
            >
              <div className="absolute top-2 right-2 bg-slate-950 px-2 py-0.5 rounded text-[8px] font-mono text-slate-500">
                LIVE CELEBRATION
              </div>

              {/* Sparkles / Confetti floating nodes */}
              <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none opacity-30">
                <div className="absolute top-6 left-6 w-1.5 h-1.5 bg-sky-400 rounded-full animate-ping" />
                <div className="absolute bottom-6 right-6 w-2 h-2 bg-rose-500 rounded-full animate-bounce" />
                <div className="absolute top-1/2 left-8 w-2 h-2 bg-yellow-400 rounded-full animate-bounce delay-300" />
              </div>

              {/* Giant Numeric display */}
              <motion.div
                animate={{ scale: [1, 1.18, 1], rotate: [0, -5, 5, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, repeatType: "reverse" }}
                className="relative mt-2"
              >
                <span className={`text-7xl font-display font-black tracking-tighter drop-shadow-lg inline-block filter ${
                  boundaryPopup === 6
                    ? "text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-indigo-300 to-pink-500"
                    : "text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-500"
                }`}>
                  {boundaryPopup}
                </span>
                
                <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[8px] font-mono tracking-widest font-black uppercase text-white shadow-sm ${
                  boundaryPopup === 6 ? "bg-fuchsia-600 shadow-fuchsia-500/30" : "bg-orange-600 shadow-orange-500/30"
                }`}>
                  {boundaryPopup === 6 ? "Maximum Shot" : "Boundary Hit"}
                </div>
              </motion.div>

              <h2 className={`text-lg font-display font-black uppercase mt-4 tracking-tight ${
                boundaryPopup === 6 ? "text-fuchsia-400" : "text-orange-400"
              }`}>
                {boundaryPopup === 6 ? "🚀 AMAZING SIXER!" : "🏏 FANTASTIC FOUR!"}
              </h2>

              <p className="text-[10px] text-slate-400 mt-1.5 leading-normal">
                {boundaryPopup === 6 
                  ? "Clean bat-swing straight back over the sightscreen rope! A monstrous strike." 
                  : "Stunning placement and precision timing! Dispatched along the turf easily."
                }
              </p>

              <button
                type="button"
                onClick={() => setBoundaryPopup(null)}
                className={`mt-4 w-full py-1.5 px-4 rounded-lg font-mono text-[9px] font-bold uppercase border cursor-pointer transition ${
                  boundaryPopup === 6
                    ? "bg-fuchsia-950/20 hover:bg-fuchsia-950/40 border-fuchsia-500/35 text-fuchsia-300"
                    : "bg-orange-950/20 hover:bg-orange-950/40 border-orange-500/35 text-orange-300"
                }`}
              >
                Okay, continue 🏏
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Simple layout formatting helper
function teamY(raw: string) {
  if (raw === "India Royals") return "IND Royals 👑";
  if (raw === "Australia Stars") return "AUS Stars ⭐";
  return raw;
}
