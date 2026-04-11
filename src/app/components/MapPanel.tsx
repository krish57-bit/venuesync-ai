"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import Map, { Marker, NavigationControl, MapRef, Source, Layer } from "react-map-gl/mapbox";
import type { FeatureCollection } from "geojson";
import type { LineLayer } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { motion, AnimatePresence } from "framer-motion";
import type { VenueNode } from "../page";
import venueStateMetadata from "@/data/venueState.json";

/* ── Types ────────────────────────────────────────────── */
interface MapPanelProps {
  activeNodeId: string | null;
  stressLevel: number;
  nodes: VenueNode[];
  isChatOpen: boolean;
}

// Mock User Location (Center of Stadium)
const MOCK_USER_COORDS: [number, number] = [76.7794, 30.7335];

/* ── Helpers ──────────────────────────────────────────── */
function getDensityTheme(density: number, pending: number, stress: number) {
  // Panic logic: if stress is extremely high, everything feels "High" visually except safe zones
  const effectiveDensity = density + (pending * 0.2); 
  
  if (stress > 2.0) {
    return {
      color: "#f85149",
      bg: "rgba(248,81,73,0.15)",
      glow: "0 0 20px rgba(248,81,73,0.8)",
      label: "Critical",
      duration: 0.5, // Violent fast pulse
    };
  }

  if (effectiveDensity <= 1.3)
    return {
      color: "#3fb950",
      bg: "rgba(63,185,80,0.15)",
      glow: "0 0 12px rgba(63,185,80,0.3)",
      label: "Low",
      duration: 3,
    };
  if (effectiveDensity <= 2.0)
    return {
      color: "#d29922",
      bg: "rgba(210,153,34,0.15)",
      glow: "0 0 16px rgba(210,153,34,0.4)",
      label: "Medium",
      duration: 2,
    };
  return {
    color: "#f85149",
    bg: "rgba(248,81,73,0.15)",
    glow: "0 0 20px rgba(248,81,73,0.6)",
    label: "High",
    duration: 1,
  };
}

function getNodeIcon(type: string) {
  switch (type) {
    case "Gate": return "🚪";
    case "Concession": return "🍔";
    case "Exit": return "🚶";
    case "Seating": return "💺";
    default: return "📍";
  }
}

/* ── Map Layers ───────────────────────────────────────── */
const routeGlowLayer: LineLayer = {
  id: "route-glow",
  type: "line",
  source: "route-data",
  layout: {
    "line-join": "round",
    "line-cap": "round",
  },
  paint: {
    "line-color": "#58a6ff",
    "line-width": 12,
    "line-opacity": 0.2,
    "line-blur": 6,
  },
};

const routeLineLayer: LineLayer = {
  id: "route-line",
  type: "line",
  source: "route-data",
  layout: {
    "line-join": "round",
    "line-cap": "round",
  },
  paint: {
    "line-color": "#58a6ff",
    "line-width": 3,
    "line-dasharray": [2, 3],
  },
};

/* ── Map Panel Component ──────────────────────────────── */
export default function MapPanel({ activeNodeId, stressLevel, nodes, isChatOpen }: MapPanelProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  
  // Animation state for the drawing effect
  const [routeProgress, setRouteProgress] = useState(0);

  const [currentVenue, setCurrentVenue] = useState('chandigarh');

  const mapRef = useRef<MapRef>(null);

  const handleVenueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    setCurrentVenue(v);
    if (!mapRef.current) return;
    
    if (v === 'chandigarh') {
      mapRef.current.flyTo({ center: [76.7794, 30.7333], zoom: 15, pitch: 45, duration: 2500 });
    } else if (v === 'sector17') {
      mapRef.current.flyTo({ center: [76.7800, 30.7390], zoom: 16, pitch: 60, duration: 2500 });
    } else if (v === 'exhibition') {
      mapRef.current.flyTo({ center: [76.7600, 30.7200], zoom: 14.5, pitch: 30, duration: 2500 });
    }
  };

  // Handle Mapbox WebGL resize during framer-motion flex transitions
  useEffect(() => {
    let frameId: number;
    let startTime: number | null = null;
    const duration = 800; // Match approximate spring transition duration

    const triggerResize = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      if (mapRef.current) {
        mapRef.current.resize();
      }

      if (elapsed < duration) {
        frameId = requestAnimationFrame(triggerResize);
      }
    };

    frameId = requestAnimationFrame(triggerResize);
    return () => cancelAnimationFrame(frameId);
  }, [isChatOpen]);

  // If chat sets an active node, fly to it and trigger the drawing animation
  useEffect(() => {
    if (activeNodeId && mapRef.current) {
      const node = nodes.find((n) => n.node_id === activeNodeId);
      if (node) {
        // eslint-disable-next-line
        setSelectedNode(node.node_id);
        
        mapRef.current.flyTo({
          center: [node.coordinates.lng, node.coordinates.lat],
          zoom: 16.5,
          pitch: 50,
          bearing: -20,
          duration: 2500,
        });

        // Trigger path drawing animation
        setRouteProgress(0);
        let start: number | null = null;
        const duration = 1500; // 1.5s to draw the line

        const animateLine = (timestamp: number) => {
          if (!start) start = timestamp;
          const progress = Math.min((timestamp - start) / duration, 1);
          setRouteProgress(progress);
          if (progress < 1) {
            requestAnimationFrame(animateLine);
          }
        };
        // Delay animation slightly so it draws as we fly
        setTimeout(() => requestAnimationFrame(animateLine), 500);
      }
    } else {
      setRouteProgress(0);
    }
  }, [activeNodeId, nodes]);

  const handleMarkerClick = useCallback((nodeId: string) => {
    setSelectedNode((prev) => (prev === nodeId ? null : nodeId));
  }, []);

  // Compute the current visible segment of the route based on animation progress
  const activeGeojson = useMemo<FeatureCollection | null>(() => {
    if (!activeNodeId) return null;
    const targetNode = nodes.find((n) => n.node_id === activeNodeId);
    if (!targetNode) return null;

    const targetCoords: [number, number] = [targetNode.coordinates.lng, targetNode.coordinates.lat];
    
    // Interpolate coordinates based on routeProgress
    const currentLng = MOCK_USER_COORDS[0] + (targetCoords[0] - MOCK_USER_COORDS[0]) * routeProgress;
    const currentLat = MOCK_USER_COORDS[1] + (targetCoords[1] - MOCK_USER_COORDS[1]) * routeProgress;

    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [MOCK_USER_COORDS, [currentLng, currentLat]],
          },
          properties: {},
        },
      ],
    };
  }, [activeNodeId, routeProgress, nodes]);

  return (
    <section
      id="map-panel"
      className="relative z-0 flex-[3] min-w-0 h-full overflow-hidden select-none"
    >
      {/* ── Top Left Controls ── */}
      <div className="absolute top-4 left-4 sm:left-6 z-50 flex items-center gap-3">
        {/* Title Pill */}
        <div className="bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-3 shadow-lg pointer-events-auto">
          <div className="relative flex items-center justify-center w-2.5 h-2.5">
            <motion.div
              className={`absolute w-full h-full rounded-full ${stressLevel > 2.0 ? 'bg-accent-red' : 'bg-accent-green'}`}
              style={{ boxShadow: stressLevel > 2.0 ? "0 0 12px rgba(248,81,73,0.8)" : "0 0 8px rgba(63,185,80,0.6)" }}
            />
            <motion.div
              className={`absolute w-full h-full rounded-full border ${stressLevel > 2.0 ? 'border-accent-red' : 'border-accent-green'}`}
              animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
              transition={{ duration: stressLevel > 2.0 ? 0.8 : 2.5, repeat: Infinity, ease: "easeOut" }}
            />
          </div>
          <div className="text-[14px] tracking-tight">
            <span className="font-bold text-white">Venue</span><span className="text-accent-cyan">Sync</span>
          </div>
          {stressLevel > 2.0 && <span className="text-[10px] text-accent-red font-bold font-mono tracking-widest ml-1 hidden sm:inline-block">ENACTING PROTOCOL</span>}
        </div>

        {/* Venue Switcher */}
        <div className="hidden sm:block pointer-events-auto">
          <select 
            className="bg-black/60 backdrop-blur-md text-slate-300 text-[11.5px] font-mono tracking-wide px-4 py-2 rounded-full border border-white/10 outline-none hover:text-white cursor-pointer transition-colors shadow-lg appearance-none"
            value={currentVenue}
            onChange={handleVenueChange}
            style={{ 
              backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239CA3AF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right .8rem top 50%',
              backgroundSize: '.65rem auto',
              paddingRight: '2rem'
            }}
          >
            <option value="chandigarh" className="bg-[#0A0A0A]">Chandigarh Sports Complex (Active)</option>
            <option value="sector17" className="bg-[#0A0A0A]">Sector 17 Plaza (Simulated)</option>
            <option value="exhibition" className="bg-[#0A0A0A]">Exhibition Ground (Offline)</option>
          </select>
        </div>
      </div>

      {/* ── IoT Visualization Overlay ── */}
      <div className="absolute top-4 right-4 sm:right-6 z-50 hidden md:flex items-center gap-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/[0.06] shadow-lg">
        <span className="text-[10px] text-text-muted font-mono tracking-widest uppercase mr-1">Live Feeds:</span>
        {["LiDAR", "Thermal", "Ticketing Edge"].map((sensor, idx) => (
          <div key={sensor} className="flex items-center gap-1.5 text-[11px] text-text-secondary tracking-tight font-medium">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-accent-green"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: idx * 0.3 }}
            />
            {sensor}
          </div>
        ))}
      </div>

      {/* ── Mapbox Canvas ── */}
      <Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{
          latitude: 30.7333,
          longitude: 76.7794,
          zoom: 15,
          pitch: 45,
          bearing: -15,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        attributionControl={false}
        reuseMaps
      >
        <NavigationControl position="bottom-right" showCompass showZoom />

        {/* ── Dynamic Drawing Path Source & Layers ── */}
        {activeGeojson && (
          <Source id="route-source" type="geojson" data={activeGeojson}>
            <Layer {...routeGlowLayer} paint={{...routeGlowLayer.paint, "line-color": stressLevel > 2.0 ? "#f85149" : "#58a6ff"}} />
            <Layer {...routeLineLayer} paint={{...routeLineLayer.paint, "line-color": stressLevel > 2.0 ? "#f85149" : "#58a6ff"}} />
          </Source>
        )}

        {/* ── User Location Marker ── */}
        <Marker longitude={MOCK_USER_COORDS[0]} latitude={MOCK_USER_COORDS[1]} anchor="center">
          <div className="relative flex items-center justify-center">
            <motion.div
              className={`absolute w-8 h-8 rounded-full ${stressLevel > 2.0 ? 'bg-accent-red/[0.15] border border-accent-red/[0.4]' : 'bg-accent-cyan/[0.15] border border-accent-cyan/[0.4]'}`}
              animate={{ scale: [1, 2], opacity: [0.8, 0] }}
              transition={{ duration: stressLevel > 2.0 ? 0.8 : 2, repeat: Infinity, ease: "easeOut" }}
            />
            <div 
              className={`w-3 h-3 rounded-full border-2 border-black ${stressLevel > 2.0 ? 'bg-accent-red' : 'bg-accent-cyan'}`} 
              style={{ boxShadow: stressLevel > 2.0 ? "0 0 10px #f85149" : "0 0 10px #58a6ff" }} 
            />
          </div>
        </Marker>

        {nodes.map((node) => {
          const theme = getDensityTheme(node.density_multiplier, node.pending_arrivals, stressLevel);
          const isHovered = hoveredNode === node.node_id;
          const isSelected = selectedNode === node.node_id;
          const isActive = isHovered || isSelected;

          return (
            <Marker
              key={node.node_id}
              latitude={node.coordinates.lat}
              longitude={node.coordinates.lng}
              anchor="center"
              style={{ zIndex: isActive ? 10 : 1 }}
            >
              <div
                className="relative flex items-center justify-center cursor-pointer group"
                onMouseEnter={() => setHoveredNode(node.node_id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => handleMarkerClick(node.node_id)}
              >
                {/* ── Framer Motion Radar Ping ── */}
                <motion.div
                  className="absolute rounded-full border border-white/[0.2]"
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: theme.bg,
                    boxShadow: theme.glow,
                  }}
                  animate={{
                    scale: [1, 2.5],
                    opacity: [0.6, 0],
                  }}
                  transition={{
                    duration: theme.duration,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />

                {/* Additional fast ripple for High density / High Stress */}
                {(theme.label === "High" || theme.label === "Critical") && (
                  <motion.div
                    className="absolute rounded-full border border-white/[0.1]"
                    style={{
                      width: 32,
                      height: 32,
                      backgroundColor: theme.bg,
                    }}
                    animate={{
                      scale: [1, 2.2],
                      opacity: [0.5, 0],
                    }}
                    transition={{
                      delay: 0.5,
                      duration: theme.duration * 0.6,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                )}

                {/* Marker body */}
                <motion.div
                  className="relative w-8 h-8 rounded-full flex items-center justify-center text-[15px]"
                  style={{
                    backgroundColor: "rgba(10,10,10,0.9)",
                    border: `1.5px solid ${theme.color}`,
                    boxShadow: isActive
                      ? `0 0 0 4px ${theme.bg}, ${theme.glow}`
                      : theme.glow,
                  }}
                  animate={isActive ? { scale: 1.25 } : { scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  {getNodeIcon(node.type)}
                </motion.div>

                {/* Label (always visible minified) */}
                <motion.div
                  className="absolute top-full mt-2 whitespace-nowrap pointer-events-none"
                  animate={{ opacity: isActive ? 0 : 0.6 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className={`text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm border ${stressLevel > 2.0 ? 'border-accent-red/50 text-accent-red' : 'border-white/[0.08] text-white/70'}`}>
                    {node.label.split("—")[0].trim()}
                  </span>
                </motion.div>

                {/* Hover / Select Tooltip */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      className="absolute bottom-full mb-4 px-4 py-3 rounded-xl glass-panel-strong pointer-events-none z-50 origin-bottom"
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 4 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      style={{ minWidth: 200 }}
                    >
                      <h3 className="text-[13px] font-semibold text-white tracking-tight mb-1">
                        {node.label}
                      </h3>
                      <div className="flex items-center gap-2 mb-2 text-[10px] text-text-secondary uppercase tracking-widest font-mono">
                        <span>{node.type}</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span>LVL {node.elevation_level}</span>
                      </div>
                      
                      <div className="w-full h-px bg-white/[0.08] mb-2.5" />

                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-text-muted">Density</span>
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: theme.color, boxShadow: theme.glow }}
                            />
                            <span className="text-[11px] font-mono font-medium text-white/90">
                              {(node.density_multiplier + node.pending_arrivals * 0.2).toFixed(1)}x
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-text-muted">Pending AI Routes</span>
                          <span className="text-[11px] font-mono font-semibold text-accent-cyan">
                            +{node.pending_arrivals}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-text-muted">Est. Wait</span>
                          <span className="text-[11px] font-mono font-semibold text-white">
                            {Math.round(
                              node.base_processing_time * (node.density_multiplier + node.pending_arrivals * 0.2)
                            )}s
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Marker>
          );
        })}
      </Map>

      {/* ── Bottom status bar ── */}
      <div className="absolute bottom-0 inset-x-0 z-20 flex items-center justify-between px-6 py-3 glass-panel border-t-0 border-white/[0.04] text-[10px] text-text-muted font-mono uppercase tracking-widest">
        <span>
          {nodes.length} Nodes <span className="text-white/20 mx-2">/</span>{" "}
          {venueStateMetadata.venue_name}
        </span>
        <span className="text-accent-cyan/80">Mapbox GL · V3</span>
      </div>
    </section>
  );
}
