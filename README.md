# VenueSync AI — Predictive Digital Twin & Crowd Load-Balancer

**VenueSync AI** is an enterprise-grade spatial digital twin designed to actively monitor, manage, and load-balance large-scale venue crowds in real-time. Powered by **Next.js 15**, **Mapbox GL**, and the **Gemini 2.5 Flash** cognitive engine, the system utilizes artificial intelligence to calculate optimal routes, bypass dynamic bottlenecks, simulate IoT environmental feeds, and instantly enact systemic evacuation protocols.

---

## ⚡ Key Features

### 🧠 Gemini AI Routing Engine
- **Conversational Interface**: Users engage with the AI natively in natural language to request routing to exits, merch stands, food courts, or general safety zones.
- **Closed-Loop Load Balancing**: When the AI computes and assigns a route, the system updates its internal state to reflect the impending influx (`pending_arrivals`). The Gemini engine intelligently avoids directing new traffic into newly created bottlenecks.
- **3D Constraints (Z-Axis penalties)**: Nodes contain exact `elevation_level` data. The AI intrinsically factors in physical climbing penalties (stairs/escalators), steering users toward visually longer—but physically faster—flat routes when appropriate.

### 🗺️ Real-Time Spatial Digital Twin
- **Dynamic Pathfinding Cinematics**: Visual Mapbox integration smoothly flies the camera to targeted nodes while animating a dual-layer cyan path tracking from the user's origin to the destination.
- **Multi-Event Switching**: The platform scales simultaneously. An interactive Command Module drop-down instantly sweeps the viewport across the globe (e.g., Active Stadium, Simulated Sector, Offline Exhibition) to monitor disparate geographic events.
- **Micro-Animations & IoT Hardware**: Pulsing radar loops denote zone density thresholds. Absolute top-level layout tracking monitors mocked live feeds of `LiDAR`, `Thermal`, and `Ticketing Edge` sensors.

### 🚨 Autonomous Panic Propagation ("Evacuation Mode")
An adjustable Venue Stress Level actively monitors event dynamics:
- Upon eclipsing the **critical `2.0` threshold**, the system tint-shifts immediately to a deep emergency red. 
- Map markers execute aggressive pulse frequencies. 
- The master Gemini heuristic is forcefully overridden: regardless of the user's intent (e.g., "I want to buy a t-shirt"), the AI rigidly denies the request and enforces an immediate, priority route to the nearest structural exit.

---

## 💻 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Mapping/GIS**: [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/api/) & [react-map-gl](https://visgl.github.io/react-map-gl/)
- **LLM Cognitive Core**: [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai) (Gemini 2.5 Flash)

---

## 🛠️ Setup & Installation

**1. Clone the repository**
```bash
git clone https://github.com/krish57-bit/venuesync-ai.git
cd venuesync-ai
```

**2. Install dependencies**
```bash
npm install
```

**3. Configure Environment Variables**
Create a `.env.local` file at the root of the directory and include:
```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_public_token
GEMINI_API_KEY=your_gemini_api_key
```

**4. Start the Development Server**
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to launch the Command Center.

---

## 🎨 Enterprise UI/UX Architecture
Vigorously modeled after top-tier design systems, the layout is deeply rooted in modern web application aesthetics:
- **Glassmorphism**: Elegant sheer `bg-white/[0.02]` backgrounds heavily blurred with `backdrop-blur-2xl`. 
- **Kinetic Physics**: Chat bubbles effortlessly pop into view using raw physics-based spring animations (`stiffness: 400`, `damping: 25`).
- **Responsive Layout Architecture**: On desktop, the user engages in a 60/40 cinematic split-screen. On smartphones, the layout structurally refactors via Flexbox, shifting the Chat into a full-screen overlay to prevent map crushing on small viewports.

---

*Built for Hackathon Demonstration.*
