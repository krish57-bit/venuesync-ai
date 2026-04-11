"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PanelRightClose, PanelRightOpen, Anchor } from "lucide-react";
import MapPanel from "./components/MapPanel";
import ChatPanel from "./components/ChatPanel";
import initialVenueState from "@/data/venueState.json";

export interface VenueNode {
  node_id: string;
  label: string;
  type: string;
  coordinates: { lat: number; lng: number };
  base_processing_time: number;
  density_multiplier: number;
  elevation_level: number;
  pending_arrivals: number;
}

export default function Home() {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [stressLevel, setStressLevel] = useState<number>(1.0);
  const [nodes, setNodes] = useState<VenueNode[]>(initialVenueState.nodes);
  const [isChatOpen, setIsChatOpen] = useState(true);

  // Closed-loop helper to update pending arrivals in the frontend state
  const handleRouteAssigned = (nodeId: string) => {
    setActiveNodeId(nodeId);
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.node_id === nodeId
          ? { ...node, pending_arrivals: node.pending_arrivals + 1 }
          : node
      )
    );
  };

  return (
    <main
      id="venue-sync-main"
      className="relative flex h-full w-full overflow-hidden"
      style={{ background: "#0A0A0A" }}
    >
      {/* ── Radial gradient glow — top-center like Linear ── */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-colors duration-1000"
        style={{
          background:
            stressLevel > 2.0
              ? "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(248,81,73,0.15), rgba(10,10,10,0) 60%)"
              : "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(88,166,255,0.08), rgba(10,10,10,0) 60%)",
        }}
      />

      {/* ── Map Panel Wrapper ── */}
      <motion.div
        initial={false}
        animate={{
          flex: isChatOpen ? 1 : 1, // Let flex-1 naturally handle width
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex-1 relative h-full min-w-0"
      >
        <MapPanel
          activeNodeId={activeNodeId}
          stressLevel={stressLevel}
          nodes={nodes}
          isChatOpen={isChatOpen}
        />
        
        {/* Toggle Button (when chat is closed) */}
        <AnimatePresence>
          {!isChatOpen && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onClick={() => setIsChatOpen(true)}
              className="absolute top-1/2 right-4 -translate-y-1/2 z-50 p-2.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-xl text-white/70 hover:text-white cursor-pointer shadow-xl hover:bg-white/[0.08] transition-colors"
            >
              <PanelRightOpen size={20} />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Chat Panel Wrapper ── */}
      <motion.div
        initial={false}
        animate={{
          width: isChatOpen ? "100%" : "0%",
          opacity: isChatOpen ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="absolute inset-y-0 right-0 z-40 md:relative md:max-w-[40%] lg:max-w-md h-full shrink-0 overflow-hidden bg-black/90 md:bg-transparent backdrop-blur-2xl md:backdrop-blur-none border-l border-white/10 shadow-2xl md:shadow-none"
      >
        {/* Toggle Button (when chat is open) */}
        <button
          onClick={() => setIsChatOpen(false)}
          className="absolute top-1/2 -left-4 -translate-y-1/2 z-50 p-1.5 rounded-full bg-[#111] border border-white/10 text-white/50 hover:text-white cursor-pointer shadow-xl hover:bg-[#222] transition-colors"
        >
          <PanelRightClose size={16} />
        </button>

        <div className="w-full h-full min-w-[320px]">
          <ChatPanel
            onRouteAssigned={handleRouteAssigned}
            stressLevel={stressLevel}
            setStressLevel={setStressLevel}
            nodes={nodes}
          />
        </div>
      </motion.div>
    </main>
  );
}
