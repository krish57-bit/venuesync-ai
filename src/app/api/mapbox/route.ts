import { NextResponse } from "next/server";

export async function GET() {
  // This endpoint allows the frontend to fetch the Mapbox token at runtime.
  // Next.js 'NEXT_PUBLIC_' variables are baked in at build-time. If the token
  // is added to Google Cloud after the build, the frontend won't see it.
  // The Node.js server, however, always sees runtime variables!
  
  const token = 
    process.env.MAPBOX_TOKEN || 
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 
    process.env.mapboxAccessToken;
  
  return NextResponse.json({ token: token || null });
}
