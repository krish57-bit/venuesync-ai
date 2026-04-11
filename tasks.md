# Project: VenueSync - Predictive Digital Twin & Crowd Load-Balancer
# Goal: Build an interactive, AI-native spatial digital twin for stadium crowd management using Next.js 15, Mapbox GL JS, and the Gemini API.
# Market Gap: Transitioning venues from reactive, static routing to proactive, AI-driven pedestrian fluid dynamics.

## Phase 1: The Spatial Data Layer (Real-Time Edge State)
- Tech: Supabase (or Firebase Realtime Database) + Mock JSON.
- Create a digital twin state machine representing the venue topology.
- Nodes must include: `node_id`, `type` (Gate, Concession, Exit), `coordinates` (Lat/Long for Mapbox), `base_processing_time`, and a live `density_resistance_multiplier` (1.0 = Empty, 3.0 = Gridlock).

## Phase 2: Interactive Spatial UI (The Frontend)
- Tech: Next.js 15 (App Router), Tailwind CSS, Framer Motion, Mapbox GL JS (or deck.gl).
- Build a split-screen layout.
- Left Panel (60%): A highly interactive Mapbox canvas. Plot the JSON venue nodes as visual markers. Markers should dynamically pulse/change color (Green/Yellow/Red) based on their live `density_resistance_multiplier`.
- Right Panel (40%): A sleek, floating chat interface using Framer Motion for fluid message transitions.

## Phase 3: The LLM Heuristic Engine (The Brain)
- Tech: Gemini API (Configured for strict JSON output).
- The Gemini agent must act as the routing orchestrator. 
- Input: User chat prompt + current spatial JSON state.
- Logic: The AI must evaluate all possible destination nodes for the user's intent and calculate the path of least resistance (lowest combined travel + wait time).
- Output: Strict JSON containing:
  1. `user_response`: A natural, concise explanation of the route.
  2. `target_node_id`: The ID of the optimal location.
  3. `system_action`: "PAN_MAP_TO_NODE" so the Next.js frontend can automatically fly the Mapbox camera to the recommended location.