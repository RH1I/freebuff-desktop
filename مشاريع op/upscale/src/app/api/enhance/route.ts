// Upscale v2 — /api/enhance
// POST multipart/form-data: file=<image>, scale=<1..6>
// Server-side Lanczos upscale via sharp (pipeline integration path).
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "file field required" }, { status: 400 });
    }
    const scale = Math.min(6, Math.max(1, Number(form.get("scale") ?? 2) || 2));
    const buf = Buffer.from(await file.arrayBuffer());

    const meta = await sharp(buf).metadata();
    const out = await sharp(buf)
      .resize({
        width: Math.round((meta.width ?? 0) * scale),
        height: Math.round((meta.height ?? 0) * scale),
        kernel: "lanczos3",
        fit: "fill",
      })
      .png({ compressionLevel: 8 })
      .toBuffer();

    return new NextResponse(new Uint8Array(out), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="enhanced-${file.name.replace(/\.[^.]+$/, "")}.png"`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "enhance failed" },
      { status: 500 }
    );
  }
}
