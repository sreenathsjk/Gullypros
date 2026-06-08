import React, { useState } from "react";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  CheckCircle2, 
  Send, 
  Smile, 
  Sparkles, 
  Activity, 
  Globe 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SocialPost {
  id: string;
  author: string;
  username: string;
  avatar: string;
  verified: boolean;
  timeAgo: string;
  likes: number;
  hasLiked: boolean;
  content: string;
  imageTheme: string;
  imageTag: string;
  comments: Array<{ author: string; text: string }>;
}

export default function CommunityTab() {
  const [stories, setStories] = useState([
    { id: "story-1", name: "Your Story", avatar: "👤", username: "you", seen: false, content: "Ready to captain the team tomorrow! Turf is set, boots are clean. Let's conquer the Tournament Series! 🏆" },
    { id: "story-2", name: "Virat K.", avatar: "👑", username: "virat_k_18", seen: false, content: "Net practice was intense today. The pitch has some serious bounce, but the wrist movement feels top-notch. Can't wait! 🏏🔥" },
    { id: "story-3", name: "Rohit S.", avatar: "🏏", username: "rohit_sharma_45", seen: false, content: "Nothing beats standard gully cricket in the rain. Everyone is timing them beautifully in training today! 💣" },
    { id: "story-4", name: "Pat C.", avatar: "☕", username: "pat_cummins_30", seen: false, content: "Coffee brewed, pitch strategy ready. Ready to defend the Stars' crown! Let's get it. ⚡" },
    { id: "story-5", name: "Jasprit B.", avatar: "🎯", username: "bumrah_yorkers_99", seen: false, content: "Perfecting those 144kph block-hole target indicators. It is all about the release angle! 🌪️" }
  ]);

  const [activeStory, setActiveStory] = useState<any | null>(null);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  const [posts, setPosts] = useState<SocialPost[]>([
    {
      id: "post-1",
      author: "Virat Kohli",
      username: "the_king_kohli",
      avatar: "👑",
      verified: true,
      timeAgo: "2 HOURS AGO",
      likes: 12420,
      hasLiked: false,
      content: "Nothing like standard twilight practice under lights. The leather ball is swinging majestically off the seam today. Who is ready for the high stakes derby tomorrow? Drop your score predictions below! 👇🏏",
      imageTheme: "from-amber-600 via-orange-950 to-slate-950",
      imageTag: "Chasing Glory",
      comments: [
        { author: "cricket_fan_99", text: "King is looking ready! Predict 80+ off 40 balls!" },
        { author: "pat_cummins_30", text: "Watch out for the out-swinger outside off, mate! 😉" }
      ]
    },
    {
      id: "post-2",
      author: "Delhi Dynamos FC",
      username: "delhi_dynamos",
      avatar: "🔥",
      verified: true,
      timeAgo: "5 HOURS AGO",
      likes: 8320,
      hasLiked: false,
      content: "Official pitch reports indicate high spin favorability for tomorrow's encounter at India Turf Arena. Team curator predicts deep dry cracks. Spinners represent! 🌪️",
      imageTheme: "from-blue-600 via-indigo-950 to-slate-950",
      imageTag: "Pitch Anatomy",
      comments: [
        { author: "shreyas_spin_master", text: "Perfect deck for some leg-breaks." },
        { author: "gully_champion_1", text: "We need a heavy target in first innings. Toss is key!" }
      ]
    },
    {
      id: "post-3",
      author: "GullyPros AI",
      username: "gullypros_officials",
      avatar: "⚡",
      verified: true,
      timeAgo: "1 DAY AGO",
      likes: 15403,
      hasLiked: true,
      content: "🚨 EXCLUSIVE HIGHLIGHT: Our AI engine computed optimized fielding presets! Adjusting deep cover boundaries decreases boundary conversions by 14.5% overall.",
      imageTheme: "from-emerald-600 via-slate-900 to-black",
      imageTag: "Captain AI Intel",
      comments: [
        { author: "coach_malhotra", text: "This is a massive game-changer for amateur team strategists." }
      ]
    }
  ]);

  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [pollVotes, setPollVotes] = useState({ teamAvotes: 142, teamBvotes: 89, hasVoted: false });

  const handleLikePost = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          hasLiked: !p.hasLiked,
          likes: p.hasLiked ? p.likes - 1 : p.likes + 1
        };
      }
      return p;
    }));
  };

  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [...p.comments, { author: "you", text: text.trim() }]
        };
      }
      return p;
    }));

    setCommentInputs(prev => ({ ...prev, [postId]: "" }));
  };

  const handleVotePoll = (team: 'A' | 'B') => {
    if (pollVotes.hasVoted) return;
    setPollVotes(prev => {
      const nextVotes = { ...prev };
      if (team === 'A') {
        nextVotes.teamAvotes += 1;
      } else {
        nextVotes.teamBvotes += 1;
      }
      nextVotes.hasVoted = true;
      return nextVotes;
    });
  };

  const handleOpenStory = (story: any) => {
    setActiveStory(story);
    setStories(prev => prev.map(s => s.id === story.id ? { ...s, seen: true } : s));
  };

  const copyShareLink = (postId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
    setCopiedPostId(postId);
    setTimeout(() => setCopiedPostId(null), 2500);
  };

  const totalVotes = pollVotes.teamAvotes + pollVotes.teamBvotes;
  const pctA = Math.round((pollVotes.teamAvotes / totalVotes) * 100);
  const pctB = 100 - pctA;

  return (
    <div className="space-y-6">
      
      {/* 1. Stories horizontal list rail */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 shadow-md overflow-x-auto scrollbar-none flex items-center space-x-4">
        {stories.map((story) => (
          <button
            key={story.id}
            onClick={() => handleOpenStory(story)}
            className="flex flex-col items-center shrink-0 space-y-1 focus:outline-none cursor-pointer group"
          >
            <div className={`p-0.5 rounded-full ${story.seen ? "bg-slate-700" : "bg-gradient-to-tr from-yellow-400 via-orange-500 to-pink-500"}`}>
              <div className="h-14 w-14 rounded-full bg-slate-900 border-2 border-slate-900 flex items-center justify-center text-xl shadow overflow-hidden transform transition group-hover:scale-105">
                {story.avatar}
              </div>
            </div>
            <span className="text-[10px] text-slate-400 font-mono max-w-[65px] truncate">{story.name}</span>
          </button>
        ))}
      </div>

      {/* 2. Interactive Fan Polling Card */}
      <div className="bg-gradient-to-r from-indigo-950/40 to-slate-950 border border-slate-800/85 rounded-xl p-4 shadow">
        <div className="flex items-center space-x-2 mb-2">
          <Globe className="h-4 w-4 text-orange-400 animate-pulse" />
          <span className="text-xs font-mono font-bold uppercase text-slate-300 tracking-wider">Fan Opinion Pulse Poll</span>
        </div>
        <h3 className="text-xs font-semibold text-slate-100 font-sans leading-relaxed mb-3">
          Who is holding the Gully Premier Cup final trophy tomorrow evening? 🏆
        </h3>

        {!pollVotes.hasVoted ? (
          <div className="grid grid-cols-2 gap-3 text-xs leading-none">
            <button
              onClick={() => handleVotePoll('A')}
              className="py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-200 font-semibold cursor-pointer transition active:scale-95"
            >
              India Royals (👑)
            </button>
            <button
              onClick={() => handleVotePoll('B')}
              className="py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-200 font-semibold cursor-pointer transition active:scale-95"
            >
              Australia Stars (⭐)
            </button>
          </div>
        ) : (
          <div className="space-y-3 font-mono text-xs">
            {/* Progress Bars */}
            <div className="space-y-1.5Packed">
              <div className="flex justify-between font-bold text-slate-300">
                <span>India Royals</span>
                <span>{pctA}% ({pollVotes.teamAvotes} votes)</span>
              </div>
              <div className="h-2 w-full bg-slate-900 rounded overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded" style={{ width: `${pctA}%` }}></div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-slate-300">
                <span>Australia Stars</span>
                <span>{pctB}% ({pollVotes.teamBvotes} votes)</span>
              </div>
              <div className="h-2 w-full bg-slate-900 rounded overflow-hidden">
                <div className="h-full bg-slate-600 rounded" style={{ width: `${pctB}%` }}></div>
              </div>
            </div>
            
            <p className="text-[10px] text-emerald-400 italic font-medium leading-none flex items-center justify-center space-x-1 pt-1">
              <span>✔ Your vote registered securely in local ledger!</span>
            </p>
          </div>
        )}
      </div>

      {/* 3. Instagram-style scrolling vertical feed */}
      <div className="space-y-6">
        {posts.map((post) => (
          <article 
            id={`community-post-${post.id}`}
            key={post.id} 
            className="bg-[#0f172a] border border-slate-800/80 rounded-xl overflow-hidden shadow-lg"
          >
            {/* Header: Avatar, Name, Verified Indicator */}
            <div className="p-4 flex items-center justify-between border-b border-slate-800/60">
              <div className="flex items-center space-x-2.5">
                <div className="h-9 w-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner text-lg">
                  {post.avatar}
                </div>
                <div>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-bold text-slate-150 font-display hover:underline cursor-pointer">
                      {post.author}
                    </span>
                    {post.verified && <CheckCircle2 className="h-3 w-3 text-sky-400 fill-sky-400/10 shrink-0" />}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase">@{post.username}</span>
                </div>
              </div>
              <span className="text-[9px] font-mono text-slate-500 uppercase">{post.timeAgo}</span>
            </div>

            {/* Post Photo Element: stylized graphic container */}
            <div className={`aspect-square bg-gradient-to-br ${post.imageTheme} relative p-6 flex flex-col justify-between select-none border-b border-slate-800`}>
              {/* Dynamic top banner */}
              <div className="flex justify-between items-center z-10 w-full mb-auto">
                <span className="px-2.5 py-1 bg-black/55 backdrop-blur-sm text-[9px] uppercase tracking-widest font-mono font-bold rounded-full text-amber-400 border border-amber-500/20">
                  {post.imageTag}
                </span>
                <span className="text-[10px] font-mono text-slate-400 font-semibold italic text-slate-300">
                  GULLYPROS 📸
                </span>
              </div>

              {/* Centered themed illustration placeholder */}
              <div className="my-auto flex flex-col items-center justify-center text-center space-y-3">
                <div className="h-16 w-16 rounded-full bg-slate-900/60 backdrop-blur-md flex items-center justify-center text-rose-500 shadow border border-slate-800/30">
                  <Activity className="h-8 w-8 text-orange-400 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-display font-black text-white tracking-tight uppercase leading-snug">
                    {post.author}&apos;s Match Room
                  </h4>
                  <p className="text-[10px] font-mono text-slate-300">
                    Live Score Tracking telemetry active
                  </p>
                </div>
              </div>

              {/* Photo Bottom telemetry metadata */}
              <div className="text-[9px] font-mono text-slate-500 flex justify-between bg-black/35 backdrop-blur-sm p-2 rounded-lg border border-slate-800/20 w-fit">
                <span>INDEX SCALE: 100M-READY PROT</span>
              </div>
            </div>

            {/* Interaction Buttons bar */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleLikePost(post.id)}
                    className="focus:outline-none transition active:scale-125 cursor-pointer"
                    title={post.hasLiked ? "Unlike" : "Like"}
                  >
                    <Heart 
                      className={`h-5 w-5 ${
                        post.hasLiked 
                          ? "text-red-500 fill-red-500" 
                          : "text-slate-300 hover:text-red-400"
                      }`} 
                    />
                  </button>
                  <button
                    className="focus:outline-none text-slate-300 hover:text-orange-400 transition cursor-pointer"
                    title="View Comments"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => copyShareLink(post.id)}
                    className="focus:outline-none text-slate-300 hover:text-orange-400 transition cursor-pointer relative"
                    title="Copy Share Link"
                  >
                    <Share2 className="h-5 w-5" />
                    {copiedPostId === post.id && (
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] font-mono bg-emerald-900 text-emerald-200 border border-emerald-800 px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                        Copied Link!
                      </span>
                    )}
                  </button>
                </div>
                <button className="focus:outline-none text-slate-300 hover:text-amber-400 transition">
                  <Bookmark className="h-5 w-5" />
                </button>
              </div>

              {/* Likes and Captions block */}
              <div className="text-xs space-y-1.5 leading-normal">
                <p className="font-mono font-bold text-slate-300">
                  {post.likes.toLocaleString()} likes
                </p>
                
                <p className="font-sans text-slate-300">
                  <span className="font-bold font-display text-slate-100 mr-1.5 hover:underline cursor-pointer">
                    {post.author}
                  </span>
                  {post.content}
                </p>
              </div>

              {/* Render Feed Comments block */}
              {post.comments.length > 0 && (
                <div className="mt-2.5 pt-2.5 border-t border-slate-800/40 space-y-1.5 text-xs font-sans">
                  {post.comments.map((comm, cIdx) => (
                    <p key={cIdx} className="text-slate-300 leading-normal">
                      <span className="font-bold text-slate-200 mr-2 hover:underline cursor-pointer">@{comm.author}</span>
                      <span>{comm.text}</span>
                    </p>
                  ))}
                </div>
              )}

              {/* Interactive add comment form */}
              <div className="pt-2 flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Add comment..."
                  value={commentInputs[post.id] || ""}
                  onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddComment(post.id);
                  }}
                  className="w-full bg-slate-900/60 border border-slate-800/70 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder-slate-500"
                />
                <button
                  onClick={() => handleAddComment(post.id)}
                  className="bg-orange-600 hover:bg-orange-500 text-white p-1.5 rounded-lg font-bold text-xs transition shrink-0 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>

            </div>
          </article>
        ))}
      </div>

      {/* 4. Stories Full Screen Zoom Popup Modal */}
      <AnimatePresence>
        {activeStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          >
            <div className="relative max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl overflow-hidden space-y-4">
              
              {/* Fake progress bar at top of story */}
              <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: "100%" }} 
                  transition={{ duration: 7 }}
                  onAnimationComplete={() => setActiveStory(null)}
                  className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500"
                ></motion.div>
              </div>

              {/* Story Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-10 w-10 rounded-full bg-slate-950 border border-slate-850 flex items-center justify-center text-xl shadow">
                    {activeStory.avatar}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">@{activeStory.username}</span>
                    <span className="text-[9px] text-slate-500 uppercase font-mono">{activeStory.name}</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveStory(null)}
                  className="p-1 px-2.5 bg-slate-950 text-xs font-bold font-mono text-slate-400 hover:text-white rounded border border-slate-800 cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              {/* Story Main Body Content */}
              <div className="py-12 px-2 text-center text-base leading-relaxed font-serif text-slate-100 flex items-center justify-center">
                &ldquo; {activeStory.content} &rdquo;
              </div>

              {/* React button and reply footer */}
              <div className="pt-4 border-t border-slate-800/60 flex items-center space-x-2">
                <input
                  type="text"
                  placeholder={`Reply to @${activeStory.username}...`}
                  className="w-full bg-slate-950 border border-slate-80 w-full rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setActiveStory(null);
                  }}
                />
                <button
                  onClick={() => setActiveStory(null)}
                  className="bg-rose-600 hover:bg-rose-500 text-white p-1.5 rounded-lg font-bold text-xs cursor-pointer"
                >
                  <Heart className="h-3.5 w-3.5 fill-white" />
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
