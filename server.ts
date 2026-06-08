import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini Client Lazily & Safely
let ai: GoogleGenAI | null = null;
const API_KEY = process.env.GEMINI_API_KEY;

function getGeminiClient(): GoogleGenAI | null {
  if (!ai && API_KEY && API_KEY !== "MY_GEMINI_API_KEY" && API_KEY.trim() !== "") {
    try {
      ai = new GoogleGenAI({
        apiKey: API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      console.log("Successfully initialized Gemini API Client for CricketVerse AI.");
    } catch (err) {
      console.warn("Failed to initialize Gemini API client:", err instanceof Error ? err.message : String(err));
    }
  }
  return ai;
}

// REST API DEFINITIONS

// 1. Commentary Generator Endpoint
app.post("/api/generate-commentary", async (req, res) => {
  const {
    batsman,
    bowler,
    runs,
    event,
    score,
    wickets,
    overs,
    target,
    commentatorStyle = 'ravi'
  } = req.body;

  const client = getGeminiClient();

  // Create prompt detailing the event
  let styleGuideline = "";
  if (commentatorStyle === 'ravi') {
    styleGuideline = "Write in the style of Ravi Shastri. Use extreme energy, booming, legendary expressions like 'Traced like a tracer bullet!', 'Edged and gone!', 'He is putting on an absolute exhibition!', 'Make no mistake about it!', 'That is high, wide and handsome!'";
  } else if (commentatorStyle === 'harsha') {
    styleGuideline = "Write in the style of Harsha Bhogle. Be warm, elegant, poetic, articulate, and thoughtful. Highlight the beauty of the sport or bowler's persistence. Use expressions like 'What a beautiful timing!', 'Oh, he played that with pristine grace', 'It is as if he is playing a harp', 'Cricket is a great leveler, is it not?'";
  } else {
    styleGuideline = "Write in the style of Tony Greig. Be immensely dramatic, enthusiastic, focus on the pitch, raw excitement, the roar of the crowd, using phrases like 'Oh, they are keying up!', 'Whacked away for six!', 'Look at him run, he has long legs!', 'Sensational stuff!', 'They're dancing in the aisles!'";
  }

  const prompt = `You are a legendary cricket radio commentator.
CURRENT MATCH STATE:
- Batsman on strike: ${batsman}
- Bowler delivering: ${bowler}
- Latest Delivery Result: ${event.toUpperCase()} (which resulted in ${runs} run(s) scored)
- Total Score: ${score}/${wickets} after ${overs} overs ${target ? `(Chasing target: ${target})` : ""}

SCENE SPECS:
- ${styleGuideline}
- Deliver a single, electrifying, realistic commentary line (maximum 3 sentences) describing this specific ball.
- Bring the stadium atmosphere alive! No text formatting prefixes (like "Ravi:"), just output the raw commentary quote.`;

  if (client) {
    try {
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 1.0,
        }
      });
      
      const text = response.text?.trim() || "";
      return res.json({ commentary: text, aiPowered: true });
    } catch (err: any) {
      console.warn("Gemini commentary generation went offline (quota or rate-limit). Falling back to stylish local engine.");
      // Fall through to algorithmic simulation
    }
  }

  // High-Quality Style-Specific Local Commentary Fallback
  const styleFallbacks: Record<string, Record<string, string[]>> = {
    ravi: {
      six: [
        `That is BIG! He has absolutely hammered that out of the park! \${batsman} goes high, wide and handsome!`,
        `Traced like a tracer bullet! He's put that cleanly into the crowd! What an exhibition from \${batsman}!`,
        `Make no mistake about it, that is a massive blow! \${bowler} looks completely shocked here!`
      ],
      four: [
        `Up and over! One bounce, two bounce, and over the ropes! Beautifully creamed cover drive from \${batsman}!`,
        `He has hammered that down the ground! It races like a tracer bullet to the boundary! Shot of the day from \${batsman}!`,
        `Elegant timing! \${batsman} gets on top of the bounce and steers it past point. Absolutely pristine focus!`
      ],
      wicket: [
        `EDGED AND GONE! Oh, what a beauty from \${bowler}! The crowd is absolutely roaring! \${batsman} must go!`,
        `CLEAN BOWLED! Stumps flying everywhere! \${bowler} has put on a masterclass, total destruction of the stumps!`,
        `OUT! A massive appeal, the umpire raises the finger! The big wicket of \${batsman} is down!`
      ],
      dot: [
        `Solid defense, no run. \${bowler} is bowling with excellent discipline, keeping \${batsman} under tight leash.`,
        `Beaten! Absolutely beaten by the pace and late movement there. Brilliant response from \${bowler}!`,
        `Blocked back to the bowler. A rare quiet moment in this absolute cooker of a match!`
      ],
      wide: [
        `Wayward delivery from \${bowler}, well outside leg stump! Umpire stretches the arms, one extra to the tally!`,
        `Down the leg side, that was far too wide from \${bowler}. Free runs given away easily under pressure!`
      ],
      noball: [
        `Oh no! \${bowler} has overstepped! Front-foot no-ball! This is dynamic pressure, and now a free hit follows!`
      ]
    },
    harsha: {
      six: [
        `Oh, that is sweet timing! \dots \${batsman} didn't try to muscle it; he just caressed it over the ropes with pure elegance.`,
        `Beautiful timing, elegant lift of the bat. It sails into the crowd. \${batsman} is showing us a masterclass today.`,
        `That is as high and graceful as an eagle. What a delightful strike! \dots \${bowler} had no response to that.`
      ],
      four: [
        `Played with pristine grace! It finds the gap perfectly between cover and point and races away to the boundary.`,
        `Oh, he plays that with such a soft touch. It’s as if \${batsman} is playing a harp out there. Four runs!`,
        `Classic drive down the ground from \${batsman}. It is always a treat to watch that majestic stroke.`
      ],
      wicket: [
        `Oh, the bails have lit up! Pristine accuracy from \dots \${bowler}, and the stumps are broken. \${batsman} has to walk back.`,
        `Caught! An aerial shot that didn't have the distance. A safe pair of hands under the ball, and a crucial breakthrough for \${bowler}.`,
        `That's a very big appeal, and yes, the finger has gone up! \${bowler}'s persistence has paid off handsomely.`
      ],
      dot: [
        `A lovely piece of bowling there from \${bowler}, beat the bat on the outside edge. The duel continues.`,
        `Safely defended. \${batsman} respects the good length delivery and places it back down the pitch.`,
        `A subtle slower ball from \${bowler}. \${batsman} waits and handles it with caution. Very smart cricket here.`
      ],
      wide: [
        `That will be collected by the keeper, wide of the off stump. Umpire signals an extra run for \${batsman}'s side.`,
        `A bit erratic there from \${bowler}. Just drifted too wide, extra pressure building.`
      ],
      noball: [
        `Oh, that is unfortunate! \${bowler} has overstepped the line. No-ball, and a free hit coming up for \${batsman}!`
      ]
    },
    tony: {
      six: [
        `Whacked away for six! Absolutely magnificent! They are dancing in the aisles here at the stadium!`,
        `Oh, look at that fly! Out of the main ground! \${batsman} has absolutely destroyed that delivery from \${bowler}!`,
        `Sensational stuff! \${batsman} charges down the crease and sends it clean over the bowler's head!`
      ],
      four: [
        `A marvelous cover drive from \${batsman}! Look at him run, the outfield is incredibly fast and it beats the fielder easily!`,
        `Pure class! Brushed off the pads and through fine leg. Outstanding batting display from \${batsman}!`,
        `Smacked through the covers! No one is stopping that, a super boundary for \dots \${batsman}!`
      ],
      wicket: [
        `HE'S GONE! Absolutely brilliant! \${bowler} gets him clean bowled! Oh, look at the joy on his face!`,
        `GOT HIM! Plumb in front! That is a sensational delivery from \dots \${bowler}, absolutely outstanding bowling!`,
        `CAUGHT! High, high into the air... and taken! What a monumental catch! Ground is going wild!`
      ],
      dot: [
        `Ah, beat him completely! Wonderful line from \${bowler}, right on the corridor of uncertainty!`,
        `Blocked away by \${batsman}. \${bowler} walks back to his mark, looking immensely confident.`,
        `Well bowled by \${bowler}! A little bit of extra bounce there, handled well by the defensive batsman.`
      ],
      wide: [
        `Wide ball! Well outside off, the keeper had to stretch to stop that from running away.`,
        `Oh, far too wide! \${bowler} tried for the yorker but missed the strip completely.`
      ],
      noball: [
        `No-ball! He's overstepped the crease! Massive mistake from \${bowler} under this pressure!`
      ]
    }
  };

  const style = (commentatorStyle && styleFallbacks[commentatorStyle]) ? commentatorStyle : 'ravi';
  const category = event || 'dot';
  const lines = styleFallbacks[style][category] || styleFallbacks[style]['dot'];
  const randomIndex = Math.floor(Math.random() * lines.length);
  let fallbackText = lines[randomIndex];

  // Tailor fallback text
  fallbackText = fallbackText.replace(/\${batsman}/g, batsman).replace(/\${bowler}/g, bowler);

  return res.json({
    commentary: `[Local Engine] ${fallbackText}`,
    aiPowered: false,
    note: "Set GEMINI_API_KEY for dynamic real-time AI commentator tones."
  });
});

// 2. Play Tactics and Analytics Sandbox
app.post("/api/predict-match", async (req, res) => {
  const {
    battingTeam,
    bowlingTeam,
    targetScore,
    currentScore,
    currentWickets,
    currentBalls,
    totalBalls,
    batsmanHand,
    bowlerType
  } = req.body;

  const ballsRemaining = totalBalls - currentBalls;
  const runsNeeded = targetScore - currentScore;

  // Simple Crickbuzz-inspired logit estimation for win percentage
  let winProbability = 50;
  if (targetScore > 0) {
    if (currentWickets >= 10) {
      winProbability = 0; // Bowling team wins
    } else if (runsNeeded <= 0) {
      winProbability = 100; // Batting team wins
    } else if (ballsRemaining <= 0) {
      winProbability = 0; // Overs finished
    } else {
      // Basic factors: runs per ball needed, wickets left ratio
      const rrr = (runsNeeded / ballsRemaining) * 6; // Required Run Rate
      const wicketsLeft = 10 - currentWickets;
      const wicketWeight = wicketsLeft * 10;
      
      // Target probability shift
      let scoreStrength = 50 + (wicketsLeft * 5) - (rrr * 4);
      if (scoreStrength > 98) scoreStrength = 98;
      if (scoreStrength < 2) scoreStrength = 2;
      winProbability = Math.round(scoreStrength);
    }
  }

  // Next Ball Prediction Logic:
  // Leg spin vs right hander, fast bowler vs weak leg side, etc.
  let nextBallPrediction = {
    dotBall: 35,
    singleDouble: 45,
    boundary: 15,
    wicket: 5
  };

  if (bowlerType === "spin" && batsmanHand === "right") {
    nextBallPrediction.dotBall = 40;
    nextBallPrediction.singleDouble = 35;
    nextBallPrediction.boundary = 18;
    nextBallPrediction.wicket = 7;
  } else if (bowlerType === "fast") {
    nextBallPrediction.dotBall = 30;
    nextBallPrediction.singleDouble = 40;
    nextBallPrediction.boundary = 23;
    nextBallPrediction.wicket = 7;
  }

  const client = getGeminiClient();

  if (client) {
    try {
      const systemInstruction = 
        "You are an elite cricket analytics strategist. Provide real-time tactics for the captain based on batter and bowler.";
      
      const prompt = `Provide the AI Captain field advice & tactics for:
Batsman Matchup: ${batsmanHand.toUpperCase()}-handed opening batsman.
Bowler Matchup: ${bowlerType.toUpperCase()} pitcher/bowler bowl style.
Match situation: ${battingTeam} needs ${runsNeeded} runs in ${ballsRemaining} balls with ${10 - currentWickets} wickets in hand.
Current Win Probability: ${winProbability}% for batting team.

Generate raw JSON with exactly these keys:
{
  "tactics": "A tactical one-liner detailing field adjustments (e.g. 'Move third-man inside and drop deep mid-wicket')",
  "bowlingStrategy": "Instruction for bowler where to pitch (e.g. 'Bowl wider of off stump to restrict his reach')",
  "weakSpot": "Batsman weakness identified to target"
}`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        }
      });

      const data = JSON.parse(response.text || "{}");
      return res.json({
        winProbability,
        bowlingTeamProb: 100 - winProbability,
        nextBallPrediction,
        aiAdvice: data,
        aiPowered: true
      });
    } catch (_) {
      // Fail gracefully to local calculation
    }
  }

  // Local Tactician Fallback
  let localTactic = "Place fielders in defensive deep mid-wicket and drop long-on back.";
  let localStrategy = "Pitch full and straight on off-stump to suffocate timing.";
  let localWeakSpot = "Struggles with short-pitched deliveries climbing on the ribs.";

  if (bowlerType === "spin") {
    localTactic = "Bring point and slip forward, invite the drive with an open cover region.";
    localStrategy = "Toss it slow outside off stump, look for the driving aerial edge.";
    localWeakSpot = "Struggles with flight and turn when stepping down the pitch.";
  } else if (batsmanHand === "left") {
    localTactic = "Pack the legside field with deep-square leg, deep-midwicket, and short mid-wicket.";
    localStrategy = "Sling it across into the left-hander, angling away towards slip cord.";
    localWeakSpot = "Susceptible of nicking the swinging delivery angling away from off stump.";
  }

  return res.json({
    winProbability,
    bowlingTeamProb: 100 - winProbability,
    nextBallPrediction,
    aiAdvice: {
      tactics: localTactic,
      bowlingStrategy: localStrategy,
      weakSpot: localWeakSpot
    },
    aiPowered: false
  });
});

// 3. AI Talent Scout Engine
app.post("/api/scout-player", async (req, res) => {
  const {
    name,
    age,
    role,
    battingStyle,
    bowlingStyle,
    matches,
    runs = 0,
    average = 0,
    strikeRate = 0,
    wickets = 0,
    economy = 0,
    region
  } = req.body;

  const client = getGeminiClient();

  // Create a structured analysis
  if (client) {
    try {
      const prompt = `You are a high-performance talent scout director for India/Global IPL teams.
Player Profile:
- Name: ${name} (Age: ${age}, Region: ${region})
- Role: ${role.toUpperCase()}
- Batting: ${battingStyle}
- Bowling: ${bowlingStyle}
- Match Experience: ${matches} matches
- Stats: Batting Avg: ${average}, Strike Rate: ${strikeRate}, Runs: ${runs}. Bowling Wickets: ${wickets}, Economy: ${economy}.

Analyze this player's prospect. Provide output in JSON format with keys:
{
  "rating": "Overall rating out of 99 (number)",
  "scoutVerdict": "3-sentence expert scouting summary on physical and technical prowess",
  "strengths": ["list 3 key strengths"],
  "weaknesses": ["list 2 key development areas"],
  "comparableLegend": "Famous cricketer this player style mimics",
  "trainingPlan": "Recommended professional practice regimen"
}`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.4,
        }
      });

      const data = JSON.parse(response.text || "{}");
      return res.json({
        ...data,
        aiPowered: true
      });
    } catch (err) {
      console.warn("AI player scout generation fell back to local engine.", err instanceof Error ? err.message : String(err));
    }
  }

  // Local Scouter Algorithm Fallback
  let rating = 72;
  let verdict = `${name} shows immense modern cricket potential. Their biomechanics under ${battingStyle} indicate an adaptive swing arc. Will thrive in quick-format professional matches with elite coaching.`;
  let strengths = ["Excellent naturally fast hand-eye coordination", "Athletic boundary-covering sprint stats", "Deceptive variations in slow wickets"];
  let weaknesses = ["Inconsistent shot-making discipline outside off stump", "Susceptible to fatigue in long bowling spells"];
  let comparableLegend = "Ravindra Jadeja";
  let trainingPlan = "Focus on cone drills for lateral bat speed, 40-meter wind sprints, and bowling rhythm consistency under pressure simulations.";

  // Tailor based on role
  if (role === "batsman") {
    rating = strikeRate > 140 ? 84 : 75;
    comparableLegend = battingStyle.toLowerCase().includes("left") ? "Brian Lara" : "Virat Kohli";
    strengths[0] = "Phenomenal wrist-flick timing through the leg side";
    weaknesses[0] = "Gets caught on front-foot crease frozen to spinners";
  } else if (role === "bowler") {
    rating = economy < 7 ? 85 : 74;
    comparableLegend = bowlingStyle.toLowerCase().includes("fast") ? "Jasprit Bumrah" : "Rashid Khan";
    strengths[0] = "Superb vertical shoulder alignment during release";
    weaknesses[0] = "Overstepping vulnerability during backfoot landing";
  }

  return res.json({
    rating,
    scoutVerdict: `[Local Engine] ${verdict}`,
    strengths,
    weaknesses,
    comparableLegend,
    trainingPlan,
    aiPowered: false,
    note: "Set GEMINI_API_KEY for hyper-custom talent reports."
  });
});

// 4. Sponsor Matching Marketplace AI
app.post("/api/sponsor-match", async (req, res) => {
  const {
    tournamentName,
    teamsCount,
    location,
    targetAudience,
    format,
    estimatedReach
  } = req.body;

  const client = getGeminiClient();

  if (client) {
    try {
      const prompt = `You are a Sports Monetization specialist matching brand sponsors to local/provincial cricket tournaments.
Tournament Detail:
- Name: ${tournamentName}
- Location: ${location}
- Format: ${format} (Teams count: ${teamsCount})
- Target reach: ${estimatedReach} cricket fans (${targetAudience} scale).

Generate an optimized sponsorship portfolio in JSON with keys:
{
  "estimatedSponsorshipPool": "Total revenue range (e.g. '$15,000 - $25,000')",
  "suggestedSponsors": [
    { "brand": "Brand Name (e.g. Tata, Hero)", "category": "Tech/FMCG", "integration": "How they integrate (e.g. 'Title sponsor on live streaming digital overlay')", "estValue": "Estimated sponsorship amount" }
  ],
  "monetizationTiers": {
    "saasSubscription": "Value-add premium cost recommended for team registration suite",
    "ticketEngineModel": "Ticket-handling dynamic commission recommend"
  },
  "tacticsToEnrichSponsorROI": "One expert growth hack to maximize brand impressions in stream"
}`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3,
        }
      });

      const data = JSON.parse(response.text || "{}");
      return res.json({
        ...data,
        aiPowered: true
      });
    } catch (_) {
      // fallback
    }
  }

  // Local Sponsor Fallback
  return res.json({
    estimatedSponsorshipPool: `$${Math.round(estimatedReach * 0.15)} - $${Math.round(estimatedReach * 0.35)} USD`,
    suggestedSponsors: [
      {
        brand: "Dream11 Sportswear",
        category: "Sport-Tech / Games",
        integration: "Title sponsor featuring prominently on digital scoreboard overlay and player of the match trophies.",
        estValue: `$${Math.round(estimatedReach * 0.12)}`
      },
      {
        brand: "CEAT Tyres",
        category: "Automotive Accessories",
        integration: "Strategic timeout countdown sponsor + boundary board banners in stream.",
        estValue: `$${Math.round(estimatedReach * 0.08)}`
      }
    ],
    monetizationTiers: {
      saasSubscription: "$49/month for Platinum Tournament Broadcast Suite",
      ticketEngineModel: "2.5% standard payment processing and premium fan analytics ticketing addon"
    },
    tacticsToEnrichSponsorROI: "Embed real-time QR codes on streaming cards linked with instant fantasy quiz discounts during drinks intervals.",
    aiPowered: false,
    note: "Set GEMINI_API_KEY to retrieve global brand campaign strategies."
  });
});

// 5. AI Editorial Match Preview Generator
app.post("/api/generate-match-preview", async (req, res) => {
  const { tournamentName, teamA, teamB, venue, date, format } = req.body;
  const client = getGeminiClient();
  
  if (client) {
    try {
      const prompt = `You are a high-profile sports editorial columnist for ESPNcricinfo.
Write an enticing, professional pre-match intelligence report and preview for:
Tournament: ${tournamentName}
Matchup: ${teamA} vs ${teamB}
Date: ${date}
Format: ${format}
Venue: ${venue}

Analyze this high-stakes matchup. Provide output in JSON format with exactly these keys:
{
  "previewHeadline": "Catchy headline for the preview (be creative, dynamic)",
  "editorialText": "3-paragraph professional editorial analysis covering pitch favorability (spin/pace), key battles (batsman vs bowler), weather, and expected momentum. Do not use Markdown inside the string.",
  "keyPlayerA": "Key player scorecard impact indicator from ${teamA} and why to watch them",
  "keyPlayerB": "Key player scorecard impact indicator from ${teamB} and why to watch them",
  "confidenceScore": "Win probability projection estimate (e.g. '55% in favor of ${teamA}')",
  "expectedPlayingXI": {
    "teamA": ["Player 1", "Player 2", "Player 3", "Player 4", "Player 5"],
    "teamB": ["Player 1", "Player 2", "Player 3", "Player 4", "Player 5"]
  }
}`;
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
        }
      });
      const text = response.text || "{}";
      const data = JSON.parse(text);
      return res.json({
        ...data,
        aiPowered: true
      });
    } catch (err) {
      console.warn("Match preview generation fell back to local engine.", err instanceof Error ? err.message : String(err));
    }
  }

  // Fallback
  return res.json({
    previewHeadline: "High-Octane Derby Set to Ignite the Pitch!",
    editorialText: `The upcoming clash between ${teamA} and ${teamB} as part of the ${tournamentName} is generating immense buzz. Under the crisp lights at ${venue}, pitch curators predict a balanced wicket offering equal seam assist initially before flattening into a batting paradise during middle overs. Given the rich histories between both factions, early key breakthroughs and fielding composure during high-stress scenarios will formulate the defining path to glory.`,
    keyPlayerA: "Opening batsman's powerplay rate and quick wrist torque are in magnificent touch.",
    keyPlayerB: "Lead swing bowler's lethal yorkers and swing movement inside initial overs are feared.",
    confidenceScore: `52% in favor of ${teamA} (Narrow Edge)`,
    expectedPlayingXI: {
      teamA: ["S. Gill", "Y. Jaiswal", "V. Kohli", "R. Sharma (c)", "K. Rahul (wk)"],
      teamB: ["T. Head", "M. Marsh", "S. Smith", "G. Maxwell", "A. Zampa"]
    },
    aiPowered: false,
    note: "Set GEMINI_API_KEY to retrieve dynamic editorial predictions."
  });
});

// 6. AI Match Summary Generator
app.post("/api/generate-match-summary", async (req, res) => {
  const { teamA, teamB, scoreA, wicketsA, oversA, scoreB, wicketsB, oversB, winner, mvp, tournamentName } = req.body;
  const client = getGeminiClient();

  if (client) {
    try {
      const prompt = `You are a world-class cricket journalist writing for Wisden and Cricbuzz.
Write a detailed, high-energy, exciting Post-Match Summary Report for:
Tournament: ${tournamentName || "Local Championship Series"}
Matchup: ${teamA} vs ${teamB}
Final Score Team A (${teamA}): ${scoreA}/${wicketsA} after ${oversA} overs
Final Score Team B (${teamB}): ${scoreB}/${wicketsB} after ${oversB} overs
Result: ${winner || `${teamA} won`}
Match MVP: ${mvp || "Not Specified"}

Provide the output in JSON format with exactly these keys:
{
  "headline": "A catchy, dramatic newspaper-style headline summarizing the epic clash",
  "matchStory": "A detailed 2-paragraph narrative of how the match unfolded. Mention key overs, pressure moments, and the tactical battle. Do not use markdown tags.",
  "turningPoint": "A single sentence describing the absolute critical turning point of the game (e.g. a spectacular run-out or a 20-run over).",
  "batsmanHonorRoll": {
    "batsman1": "Top scorer name & stats (e.g., 'Virat Kohli - 82* (53 balls)')",
    "batsman2": "Second-best batter name & stats (e.g., 'Rohit Sharma - 45 (24 balls)')"
  },
  "bowlerHonorRoll": {
    "bowler1": "Best bowler name & stats (e.g., 'Jasprit Bumrah - 3/15 (4 overs)')",
    "bowler2": "Second-best bowler name & stats (e.g., 'Mohammed Shami - 2/28 (4 overs)')"
  },
  "crowdAtmosphere": "A sentence describing the fan response, stadium noise, and electric atmosphere."
}`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
        }
      });
      const text = response.text || "{}";
      const data = JSON.parse(text);
      return res.json({
        ...data,
        aiPowered: true
      });
    } catch (err) {
      console.warn("Match summary generation fell back to local engine.", err instanceof Error ? err.message : String(err));
    }
  }

  // Fallback engine
  return res.json({
    headline: `${teamA} Clinch a Thrilling Victory in the Stadium Clash!`,
    matchStory: `In a closely contested match of ${tournamentName || "Gully Cricket Championship"}, ${teamA} batted first to put up a decent total of ${scoreA}/${wicketsA}. The batsmen showed impressive timing right from the powerplay, building a strong core partnership. In response, ${teamB} kept chasing with fierce intent, but ${teamA}'s death bowlers kept their cool under extreme pressure to restrict the opposition to ${scoreB}/${wicketsB}.`,
    turningPoint: `The turning point came in the 17th over when the set batsman was brilliantly caught at the deep mid-wicket boundary, cutting short the momentum of the run chase.`,
    batsmanHonorRoll: {
      batsman1: `${teamA === "India Royals" || teamA.includes("India") ? "Lokesh Rahul" : "Opening Batsman"} - 74 runs (45 balls)`,
      batsman2: `${teamB === "Australia Stars" || teamB.includes("Australia") ? "Travis Head" : "Chasing Skipper"} - 52 runs (31 balls)`
    },
    bowlerHonorRoll: {
      bowler1: `${teamA === "India Royals" || teamA.includes("India") ? "Ravindra Jadeja" : "Lead spinner"} - 3 wickets for 22 runs (4 overs)`,
      bowler2: `${teamB === "Australia Stars" || teamB.includes("Australia") ? "Mitchell Starc" : "Opening paceman"} - 2 wickets for 31 runs (4 overs)`
    },
    crowdAtmosphere: "The stadium erupted with joy under the floodlights, with fans cheering every boundary and singing anthems in high spirit.",
    aiPowered: false,
    note: "Set GEMINI_API_KEY to retrieve dynamic editorial summaries."
  });
});

// 7. AI Player Profile Generator
app.post("/api/get-player-profile", async (req, res) => {
  const { playerName, teamName } = req.body;
  const client = getGeminiClient();

  if (client) {
    try {
      const prompt = `You are a seasoned international cricket expert and biographer.
Provide a highly detailed professional athlete card, biography, and stats breakdown of:
Player Name: ${playerName}
Team context: ${teamName || "Global Franchise / National Team"}

Provide the output in JSON format with exactly these keys:
{
  "name": "Full professional name of the cricketer",
  "role": "Batsman, Bowler, All-rounder, or Wicketkeeper-batsman",
  "battingStyle": "e.g., Right-handed top-order batsman",
  "bowlingStyle": "e.g., Right-arm fast-medium or Slow left-arm orthodox",
  "internationalStats": {
    "matches": "Estimated/Actual matches played (or 'Local league rookie')",
    "runs": "Total runs scored",
    "battingAvg": "Batting average",
    "strikeRate": "Strike rate",
    "wickets": "Wickets taken",
    "economy": "Economy rate"
  },
  "bio": "A fascinating 2-3 sentence biography describing their career style, unique batting stance/delivery action, and their impact in match-defining moments.",
  "strengths": ["list 3 key technical/athletic strengths"],
  "weaknesses": ["list 2 technical vulnerabilities or development areas"],
  "legendComparison": "A famous legend they play like",
  "careerStatus": "Active / Retiring soon / Emerging rookie"
}`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.6,
        }
      });
      const text = response.text || "{}";
      const data = JSON.parse(text);
      return res.json({
        ...data,
        aiPowered: true
      });
    } catch (err) {
      console.warn("Player profile generation fell back to local engine.", err instanceof Error ? err.message : String(err));
    }
  }

  // Local fallback directory
  const fallbackProfiles: Record<string, any> = {
    "lokesh rahul": {
      name: "KL Rahul (Lokesh Rahul)",
      role: "Wicketkeeper-batsman",
      battingStyle: "Right-handed opening batsman",
      bowlingStyle: "Right-arm off break",
      internationalStats: {
        matches: "182",
        runs: "7404",
        battingAvg: "41.8",
        strikeRate: "135.2",
        wickets: "0",
        economy: "-"
      },
      bio: "An elegant, technically supreme top-order batsman who can easily adapt between anchor roles and explosive finishes. Revered for his classic high-elbow cover drives and safe hands keeping wickets.",
      strengths: ["Exquisite cover drive & flick timing", "Adaptability under pressure", "Excellent wicketkeeping reflexes"],
      weaknesses: ["Tentative footwork against late in-swinging deliveries", "Starts slow in early powerplay overs"],
      legendComparison: "Rahul Dravid",
      careerStatus: "Active"
    },
    "mitchell starc": {
      name: "Mitchell Starc",
      role: "Bowler",
      battingStyle: "Left-handed lower-order batsman",
      bowlingStyle: "Left-arm fast bowler",
      internationalStats: {
        matches: "260",
        runs: "2015",
        battingAvg: "15.4",
        strikeRate: "88.2",
        wickets: "645",
        economy: "4.8"
      },
      bio: "One of the most lethal left-arm fast bowlers in white-ball cricket history. Known worldwide for his terrifying, toe-crushing inswinging yorkers at speeds exceeding 150 km/h, securing key wickets in first overs.",
      strengths: ["Lethal inswinging yorker", "High release point & raw pace", "Aggressive lower-order hitting"],
      weaknesses: ["Risk of leaking runs when pitch offers no swing", "Susceptibility to foot/ankle strains"],
      legendComparison: "Wasim Akram / Mitchell Johnson",
      careerStatus: "Active"
    },
    "ravindra jadeja": {
      name: "Ravindra Jadeja",
      role: "All-rounder",
      battingStyle: "Left-handed batsman",
      bowlingStyle: "Slow left-arm orthodox",
      internationalStats: {
        matches: "330",
        runs: "6145",
        battingAvg: "33.2",
        strikeRate: "128.8",
        wickets: "530",
        economy: "4.6"
      },
      bio: "A world-class premium all-rounder with unmatched utility across all phases of the game. Nicknamed 'Sir Jadeja', he is considered one of the fastest and most dangerous fielders in world cricket, with lightning direct-hits.",
      strengths: ["Superb flat spin control and tight lines", "Extremely quick direct-hit throws", "Clutch lower-order batting"],
      weaknesses: ["Struggles to turn the ball on dry, unresponsive wickets", "Sometimes plays around straight lines in early batting runs"],
      legendComparison: "Daniel Vettori / Kapil Dev",
      careerStatus: "Active"
    }
  };

  const key = playerName.toLowerCase().trim();
  let found = null;
  for (const k of Object.keys(fallbackProfiles)) {
    if (key.includes(k) || k.includes(key)) {
      found = fallbackProfiles[k];
      break;
    }
  }

  if (found) {
    return res.json({
      ...found,
      aiPowered: false,
      note: "Loaded from high-fidelity local cricket profiles database."
    });
  }

  // Create high-impact generic profile
  return res.json({
    name: playerName,
    role: "All-rounder / Franchise Rookie",
    battingStyle: "Right-handed batsman",
    bowlingStyle: "Right-arm medium fast bowler",
    internationalStats: {
      matches: "48 (Local Leagues)",
      runs: "1140",
      battingAvg: "31.6",
      strikeRate: "142.1",
      wickets: "38",
      economy: "7.2"
    },
    bio: `A highly competitive and spirited player who has emerged from regional turf tournaments. Combines positive attacking batting in middle overs with clever pace changes and cutters when defending targets.`,
    strengths: ["Deceptive slower-ball action", "Powerful horizontal leg-side pulls", "High work rate & athletic slider fielding"],
    weaknesses: ["Occasional high-risk shot selection in powerplay", "Prone to bowling leg-stump half-volleys"],
    legendComparison: "Glenn Maxwell / Hardik Pandya",
    careerStatus: "Emerging Prospect",
    aiPowered: false,
    note: "Set GEMINI_API_KEY to generate an authentic global stats bio dynamically."
  });
});

// Setup Vite & Static Files Middleware

async function startServer() {
  // Integrate Vite for server routing and hot reload handling
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA single point of entry
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`===============================================`);
    console.log(`🔥 CRICKETVERSE AI Dev Server Started 🔥`);
    console.log(`Address: http://localhost:${PORT}`);
    console.log(`Scale capability: Active`);
    console.log(`===============================================`);
  });
}

startServer();
