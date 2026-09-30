import { NextResponse } from "next/server";

const START = Date.now();

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "upscale",
    version: "2.1.0",
    uptime_seconds: Math.floor((Date.now() - START) / 1000),
    pid: process.pid,
    capabilities: ["enhance", "batch", "formats", "sharpness", "video-export", "compare", "paste", "cancel", "pwa"],
    endpoints: ["/api/enhance"],
    timestamp: new Date().toISOString(),
  });
}