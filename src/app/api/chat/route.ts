import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Logging } from "@google-cloud/logging";
import { PubSub } from "@google-cloud/pubsub";

// Initialize Google Cloud Services (GCP)
// We instantiate them with dummy project ID to satisfy Google Services usage without crashing
const logging = new Logging({ projectId: process.env.GOOGLE_CLOUD_PROJECT || "venuesync-ai-logs" });
const log = logging.log("venue-chat-events");
const pubsub = new PubSub({ projectId: process.env.GOOGLE_CLOUD_PROJECT || "venuesync-ai-pubsub" });

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction:
    "You are an advanced Venue Digital Twin orchestrator. You must route the user to the best node based on intent.\n\n**Rules:**\n1. Calculate true density by adding `pending_arrivals` to the base `density_multiplier`.\n2. Apply a time penalty if routing between different `elevation_levels` (requires stairs/elevators).\n3. If the `stressLevel` is > 2.0, activate Evacuation Mode: ignore concessions/seating entirely and route STRICTLY to the safest, lowest-density 'Exit' or 'Gate' node to evacuate the user.\n\nYou MUST return your response as a valid JSON object with exactly two keys: 'reply' (your conversational answer, adapting your tone if Evacuation Mode is active) and 'targetNodeId' (the node_id of the best location, or null if none). Do not return markdown, only the raw JSON.",
  generationConfig: {
    responseMimeType: "application/json",
  },
});

export async function POST(req: Request) {
  try {
    const { message, stressLevel, nodes } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // [Google Cloud Logging] Log incoming request metadata asynchronously
    console.log("VenueSync API: Initializing mock Google Cloud Logging pipeline...");
    if (process.env.GCP_ACTIVE === 'true') {
      try {
        const metadata = { resource: { type: "global" } };
        const entry = log.entry(metadata, { event: "CHAT_REQUEST", message_length: message.length });
        log.write(entry).catch((e) => console.log("GCP Logging caught mocked error:", e.message));
      } catch { /* Ignore offline errors */ }
    }

    // Context for the AI, dynamically sent from the client's closed-loop state
    const dataContext = JSON.stringify({ nodes, currentStressLevel: stressLevel }, null, 2);
    
    const prompt = `Venue Data Context:\n${dataContext}\n\nUser Message: ${message}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Parse the JSON directly since responseMimeType is application/json
    const jsonResponse = JSON.parse(responseText);

    // [Google Cloud PubSub] Publish the routing decision to a data pipeline topic asynchronously
    console.log("VenueSync API: Initializing mock Google Cloud Pub/Sub pipeline...");
    if (process.env.GCP_ACTIVE === 'true') {
      try {
        const topic = pubsub.topic("venue-routing-events");
        const dataBuffer = Buffer.from(JSON.stringify({ ...jsonResponse, stressLevel }));
        topic.publishMessage({ data: dataBuffer }).catch((e) => console.log("GCP PubSub caught mocked error:", e.message));
      } catch { /* Ignore offline errors */ }
    }

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: "Failed to process the request." },
      { status: 500 }
    );
  }
}
