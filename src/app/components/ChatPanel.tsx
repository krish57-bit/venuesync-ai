"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { VenueNode } from "../page";

/* ── Types ────────────────────────────────────────────── */
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatPanelProps {
  onRouteAssigned: (id: string) => void;
  stressLevel: number;
  setStressLevel: (val: number) => void;
  nodes: VenueNode[];
}

/* ── Animation Configs ────────────────────────────────── */
const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 25,
};

const bubbleVariants = {
  hidden: (role: string) => ({
    opacity: 0,
    y: 16,
    x: role === "user" ? 12 : -12,
    scale: 0.95,
  }),
  visible: {
    opacity: 1,
    y: 0,
    x: 0,
    scale: 1,
    transition: springTransition,
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.97,
    transition: { duration: 0.15 },
  },
};

const thinkingDotVariants = {
  initial: { y: 0, opacity: 0.3 },
  animate: {
    y: [0, -6, 0],
    opacity: [0.3, 1, 0.3],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  },
};

/* ── Chat Panel Component ─────────────────────────────── */
export default function ChatPanel({ onRouteAssigned, stressLevel, setStressLevel, nodes }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: "1",
      role: "assistant",
      content:
        "Welcome to VenueSync AI. I can prioritize routing to the safest sectors based on multi-variable metrics.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, stressLevel, nodes }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch response from Gemini");
      }

      const data = await response.json();
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply || "I encountered an error processing your request.",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiMsg]);

      // If the AI recommends a node, pass it up to fly the map camera there
      // AND increment the pending_arrivals locally.
      if (data.targetNodeId) {
        onRouteAssigned(data.targetNodeId);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I am currently unable to process your request.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <section
      id="chat-panel"
      className="relative z-10 w-full min-w-0 h-full flex flex-col border-l border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl transition-colors duration-1000"
      style={{ backgroundColor: stressLevel > 2.0 ? "rgba(248,81,73,0.03)" : "rgba(255,255,255,0.02)" }}
    >
      {/* ── Ultra-Minimal Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] shrink-0">
        <div className="flex items-center gap-2">
          <motion.div
            className={`w-[6px] h-[6px] rounded-full ${stressLevel > 2.0 ? 'bg-accent-red' : 'bg-accent-cyan'}`}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{ boxShadow: stressLevel > 2.0 ? "0 0 10px rgba(248,81,73,0.8)" : "0 0 8px rgba(88,166,255,0.6)" }}
          />
          <h2 className="text-xs font-mono tracking-widest uppercase text-slate-400">
            AI CORE
          </h2>
        </div>
        
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-mono tracking-widest uppercase ${stressLevel > 2.0 ? 'text-accent-red font-bold' : 'text-slate-500'}`}>
            {stressLevel > 2.0 ? 'CRITICAL EVACUATION' : 'ONLINE'}
          </span>
        </div>
      </div>

      {/* ── Enterprise Control: Panic Slider ── */}
      <div className="px-6 py-4 border-b border-white/[0.04] bg-black/20 shrink-0">
        <div className="flex items-center justify-between mb-2">
           <label className="text-[11px] font-mono tracking-widest uppercase text-text-secondary">Venue Stress Level</label>
           <span className={`text-[11px] font-mono font-bold ${stressLevel > 2.0 ? 'text-accent-red' : 'text-accent-cyan'}`}>
             {stressLevel.toFixed(1)}x
           </span>
        </div>
        <input 
           type="range" 
           min="1.0" 
           max="3.0" 
           step="0.1" 
           value={stressLevel} 
           onChange={(e) => setStressLevel(parseFloat(e.target.value))}
           className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent-cyan"
           style={{ accentColor: stressLevel > 2.0 ? '#f85149' : '#58a6ff' }}
        />
        {stressLevel > 2.0 && (
           <p className="text-[10px] text-accent-red mt-2 tracking-wide font-medium">
             ⚠️ Evacuation Mode Active: Concessions restricted. Directing to Exits.
           </p>
        )}
      </div>

      {/* ── Messages ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-4"
      >
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              layout
              custom={msg.role}
              variants={bubbleVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[88%] px-5 py-3.5 text-[13.5px] leading-relaxed shadow-sm ${
                  msg.role === "user"
                    ? `rounded-2xl rounded-br-sm border text-text-primary ${stressLevel > 2.0 ? 'bg-accent-red/[0.1] border-accent-red/[0.2]' : 'bg-accent-cyan/[0.1] border-accent-cyan/[0.12]'}`
                    : "rounded-2xl rounded-bl-sm bg-white/[0.03] border border-white/[0.06] text-text-secondary"
                }`}
              >
                {msg.content}
                <p
                  suppressHydrationWarning
                  className={`text-[9.5px] mt-2 font-medium ${
                    msg.role === "user"
                      ? "opacity-50 text-right"
                      : "text-slate-500"
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* ── AI Thinking State ── */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={springTransition}
              className="flex justify-start"
            >
              <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl rounded-bl-sm bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-[6px] h-[6px] rounded-full"
                      style={{
                        background: stressLevel > 2.0 ? '#f85149' : "linear-gradient(135deg, #58a6ff, #bc8cff)",
                        boxShadow: stressLevel > 2.0 ? "0 0 8px rgba(248,81,73,0.6)" : "0 0 8px rgba(88,166,255,0.4)",
                      }}
                      variants={thinkingDotVariants}
                      initial="initial"
                      animate="animate"
                      transition={{
                        delay: i * 0.18,
                        duration: stressLevel > 2.0 ? 0.3 : 0.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>
                <span className={`text-[11px] uppercase tracking-wider font-mono ${stressLevel > 2.0 ? 'text-accent-red animate-pulse font-bold' : 'text-slate-500'}`}>
                  {stressLevel > 2.0 ? 'Computing Safe Routes...' : 'Processing'}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Suggestion chips ── */}
      <div className="px-6 pb-3 flex gap-2 flex-wrap shrink-0">
        {[
          "Where is the nearest exit?",
          "Check crowd density",
          "Best route to food court",
        ].map((chip) => (
          <motion.button
            key={chip}
            onClick={() => {
              setInput(chip);
              inputRef.current?.focus();
            }}
            className="text-[11.5px] px-3.5 py-1.5 rounded-full border border-white/[0.08] text-slate-400 bg-black/20 cursor-pointer shadow-sm"
            whileHover={{
              borderColor: stressLevel > 2.0 ? "rgba(248,81,73,0.3)" : "rgba(88,166,255,0.3)",
              color: stressLevel > 2.0 ? "#f85149" : "#58a6ff",
              backgroundColor: stressLevel > 2.0 ? "rgba(248,81,73,0.05)" : "rgba(88,166,255,0.05)",
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            {chip}
          </motion.button>
        ))}
      </div>

      {/* ── Input ── */}
      <div className="px-5 py-4 border-t border-white/[0.08] shrink-0">
        <motion.div
          className="flex items-center gap-3 rounded-2xl px-4 py-2.5 border"
          animate={{
            borderColor: isFocused
              ? (stressLevel > 2.0 ? "rgba(248,81,73,0.3)" : "rgba(88,166,255,0.25)")
              : "rgba(255,255,255,0.08)",
            backgroundColor: isFocused
              ? (stressLevel > 2.0 ? "rgba(248,81,73,0.05)" : "rgba(88,166,255,0.03)")
              : "rgba(255,255,255,0.02)",
            boxShadow: isFocused
              ? (stressLevel > 2.0 ? "0 0 0 1px rgba(248,81,73,0.1), 0 4px 20px rgba(248,81,73,0.08)" : "0 0 0 1px rgba(88,166,255,0.1), 0 4px 20px rgba(88,166,255,0.06)")
              : "none",
            scale: isFocused ? 1.005 : 1,
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <input
            ref={inputRef}
            id="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Initialize query..."
            className="flex-1 bg-transparent text-[13.5px] text-text-primary placeholder:text-slate-500 outline-none"
          />
          <motion.button
            id="chat-send-button"
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="w-8 h-8 rounded-xl flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
            style={{ background: stressLevel > 2.0 ? "rgba(248,81,73,0.1)" : "rgba(88,166,255,0.1)" }}
            whileHover={
              input.trim() && !isTyping
                ? { background: stressLevel > 2.0 ? "rgba(248,81,73,0.2)" : "rgba(88,166,255,0.2)", scale: 1.05 }
                : {}
            }
            whileTap={input.trim() && !isTyping ? { scale: 0.93 } : {}}
            transition={springTransition}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`w-4 h-4 ${stressLevel > 2.0 ? 'text-accent-red' : 'text-accent-cyan'} ${isTyping ? "opacity-50" : ""}`}
            >
              <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.154.75.75 0 0 0 0-1.116A28.897 28.897 0 0 0 3.105 2.288Z" />
            </svg>
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
