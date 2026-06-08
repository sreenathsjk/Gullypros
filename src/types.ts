export interface CommentaryRequest {
  batsman: string;
  bowler: string;
  runs: string;
  event: string; // 'dot' | '1' | '2' | '3' | 'four' | 'six' | 'wicket' | 'noball' | 'wide'
  score: string;
  wickets: number;
  overs: string;
  target?: string;
  commentatorStyle?: string; // 'ravi' | 'harsha' | 'tony'
}

export interface PredictionRequest {
  battingTeam: string;
  bowlingTeam: string;
  targetScore: number;
  currentScore: number;
  currentWickets: number;
  currentBalls: number;
  totalBalls: number;
  batsmanHand: 'right' | 'left';
  bowlerType: 'fast' | 'spin' | 'medium';
}

export interface PlayerScoutRequest {
  name: string;
  age: number;
  role: 'batsman' | 'bowler' | 'allrounder' | 'wicketkeeper';
  battingStyle: string;
  bowlingStyle: string;
  matches: number;
  runs?: number;
  average?: number;
  strikeRate?: number;
  wickets?: number;
  economy?: number;
  region: string;
}

export interface SponsorMatchRequest {
  tournamentName: string;
  teamsCount: number;
  location: string;
  targetAudience: 'local' | 'regional' | 'national' | 'global';
  format: 'T10' | 'T20' | 'ODI' | 'Test';
  estimatedReach: number; // e.g. 100000
}

export interface Match {
  id: string;
  teamA: string;
  teamB: string;
  date: string;
  venue: string;
  status: "LIVE" | "COMPLETED" | "UPCOMING";
  scoreA?: number;
  wicketsA?: number;
  oversA?: string;
  scoreB?: number;
  wicketsB?: number;
  oversB?: string;
  target?: number;
  activeStriker?: string;
  activeBowler?: string;
  details: string;
  mvp?: string;
  eventType?: "tournament" | "friendly";
  creatorEmail?: string;
}

export interface Tournament {
  id: string;
  name: string;
  format: "T10" | "T20" | "ODI" | "Test";
  location: string;
  status: "Ongoing" | "Completed" | "Upcoming";
  teamsCount: number;
  dateRange: string;
  prizePool: string;
  champion?: string;
  statsSummary?: string;
  matches: Match[];
  eventType?: "tournament" | "friendly";
  creatorEmail?: string;
}

export const INITIAL_TOURNAMENTS: Tournament[] = [
  {
    id: "tourney-tatacup-2026",
    name: "Tata Indian Premier Cup 2026",
    format: "T20",
    location: "Mumbai, Wankhede Grounds",
    status: "Ongoing",
    teamsCount: 8,
    dateRange: "June - July 2026",
    prizePool: "$250,500 USD",
    statsSummary: "Royal qualifiers peak session. India Royals dominating live projections",
    eventType: "tournament",
    matches: [
      {
        id: "match-mumbai-live",
        teamA: "India Royals",
        teamB: "Australia Stars",
        date: "LIVE NOW • 19:30 Local",
        venue: "Wankhede Arena, Pitch Area 1",
        status: "LIVE",
        scoreA: 154,
        wicketsA: 4,
        oversA: "17.2",
        scoreB: 0,
        wicketsB: 0,
        oversB: "0.0",
        target: 188,
        activeStriker: "Lokesh Rahul",
        activeBowler: "Mitchell Starc",
        details: "India Royals need 34 runs in 16 balls to win this live opener."
      },
      {
        id: "match-completed-chennai",
        teamA: "Chennai Kings",
        teamB: "Kolkata Riders",
        date: "Completed • June 7",
        venue: "Chidambaram Stadium",
        status: "COMPLETED",
        scoreA: 198,
        wicketsA: 6,
        oversA: "20.0",
        scoreB: 182,
        wicketsB: 8,
        oversB: "20.0",
        target: 199,
        details: "Chennai Kings won by 16 runs in dynamic finish",
        mvp: "Ravindra Jadeja"
      }
    ]
  },
  {
    id: "tourney-colombo-25",
    name: "Colombo Challenge Cup",
    format: "T20",
    location: "R. Premadasa Stadium",
    status: "Ongoing",
    teamsCount: 6,
    dateRange: "May - June 2026",
    prizePool: "$80,000 USD",
    statsSummary: "Completed group stages. Colombo Jaguars leading group standings",
    eventType: "tournament",
    matches: [
      {
        id: "match-colombo-live",
        teamA: "Colombo Jaguars",
        teamB: "Galle Gladiators",
        date: "LIVE NOW • 15:00 Local",
        venue: "Premadasa Pitch 2",
        status: "LIVE",
        scoreA: 132,
        wicketsA: 5,
        oversA: "15.4",
        scoreB: 0,
        wicketsB: 0,
        oversB: "0.0",
        target: 165,
        activeStriker: "Pathum Nissanka",
        activeBowler: "Maheesh Theekshana",
        details: "Colombo Jaguars need 33 runs in 26 balls to secure qualification."
      }
    ]
  }
];

