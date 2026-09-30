"use client";
// Upscale v2 — main page. Rebuilt with source; engine preserved 1:1 from production GLSL.
import { useCallback, useEffect, useRef, useState } from "react";
import { UpscaleEngine, checkOutputSize } from "@/lib/upscale-engine";
import { PRESETS, resolveSharpness, type EnhanceSettings, type OutputFormat, type QualityPreset } from "@/lib/types";

type Job = {
  id: string;
  file: File;
  kind: "image" | "video";
  status: "queued" | "working" | "done" | "error";
  progress: number;
  originalUrl?: string; // for before/after compare
  resultUrl?: string;
  resultSize?: { w: number; h: number };
  outBlob?: Blob;
  error?: string;
};

const SCALE_OPTIONS = [2, 3, 4, 6];

export default function Home() {
  const [settings, setSettings] = useState<EnhanceSettings>(() => {
    try {
      const s = localStorage.getItem("upscale-v2-settings");
      return s ? JSON.parse(s) : { scaleFactor: 2, preset: "balanced", sharpness: 0.6, usePostProcess: true };
    } catch {
      return { scaleFactor: 2, preset: "balanced", sharpness: 0.6, usePostProcess: true };
    }
  });
  const [format, setFormat] = useState<OutputFormat>("png");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [running, setRunning] = useState(false);
  const [comparePct, setComparePct] = useState(50);
  const [compareId, setCompareId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const engineRef = useRef<UpscaleEngine | null>(null);
  const cancelRef = useRef(false);

  useEffect(() => {
    try { localStorage.setItem("upscale-v2-settings", JSON.stringify(settings)); } catch {}
  }, [settings]);

  const update = (patch: Partial<EnhanceSettings>) =>
    setSettings((s) => {
      const next = { ...s, ...patch };
      if (patch.preset && patch.preset !== "custom") {
        const p = PRESETS[patch.preset];
        next.sharpness = p.sharpness;
        next.usePostProcess = p.usePostProcess;
      }
      return next;
    });

  const addFiles = useCallback((files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"));
    setJobs((prev) => [
      ...prev,
      ...list.map((f) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file: f,
        kind: f.type.startsWith("video/") ? ("video" as const) : ("image" as const),
        status: "queued" as const,
        progress: 0,
        originalUrl: URL.createObjectURL(f),
      })),
    ]);
  }, []);

  // Paste from clipboard (Ctrl+V) — new 2026-09-30
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      const imgs = Array.from(e.clipboardData?.items ?? [])
        .filter((it) => it.type.startsWith("image/"))
        .map((it) => it.getAsFile())
        .filter((f): f is File => !!f);
      if (imgs.length) { e.preventDefault(); addFiles(imgs); }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [addFiles]);

  const removeJob = useCallback((id: string) => {
    setJobs((prev) => {
      const target = prev.find((j) => j.id === id);
      if (target) {
        if (target.originalUrl) URL.revokeObjectURL(target.originalUrl);
        if (target.resultUrl) URL.revokeObjectURL(target.resultUrl);
      }
      return prev.filter((j) => j.id !== id);
    });
  }, []);

  const processImage = async (job: Job): Promise<Partial<Job>> => {
    if (!engineRef.current) engineRef.current = new UpscaleEngine();
    const engine = engineRef.current;
    const bitmap = await createImageBitmap(job.file);
    // Dimension guard — clear Arabic error instead of a cryptic export failure
    const guard = checkOutputSize(bitmap.width, bitmap.height, settings.scaleFactor);
    if (!guard.ok) {
      bitmap.close?.();
      return { status: "error", error: guard.reason };
    }
    const { sharpness, usePostProcess } = resolveSharpness(settings);
    const scale = settings.scaleFactor;
    engine.setupGL(bitmap.width, bitmap.height, scale);
    engine.processFrame(bitmap, scale, sharpness, usePostProcess);
    const canvas = engine.displayCanvas;
    const mime = format === "png" ? "image/png" : format === "jpeg" ? "image/jpeg" : "image/webp";
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Export failed — output may be too large"))),
        mime,
        format === "png" ? undefined : 0.92
      )
    );
    return {
      status: "done",
      progress: 1,
      outBlob: blob,
      resultUrl: URL.createObjectURL(blob),
      resultSize: { w: bitmap.width * scale, h: bitmap.height * scale },
    };
  };

  const processVideo = async (job: Job, onProgress: (p: number) => void): Promise<Partial<Job>> => {
    // Video path: render frames through the same WebGL pipeline via captureStream
    const url = URL.createObjectURL(job.file);
    const v = document.createElement("video");
    v.src = url; v.muted = false; v.playsInline = true;
    await new Promise((res, rej) => { v.onloadedmetadata = res; v.onerror = () => rej(new Error("Invalid video")); });

    const scale = settings.scaleFactor;
    const w = Math.round(v.videoWidth * scale);
    const h = Math.round(v.videoHeight * scale);
    const work = document.createElement("canvas");
    work.width = w; work.height = h;
    const ctx = work.getContext("2d")!;
    const { sharpness, usePostProcess } = resolveSharpness(settings);

    if (!engineRef.current) engineRef.current = new UpscaleEngine();
    const engine = engineRef.current;
    engine.setupGL(v.videoWidth, v.videoHeight, scale);

    // Audio passthrough
    let stream: MediaStream;
    try {
      const ac = new AudioContext();
      if (ac.state === "suspended") await ac.resume();
      const src = ac.createMediaElementSource(v);
      const dest = ac.createMediaStreamDestination();
      src.connect(dest);
      stream = new MediaStream([...work.captureStream(60).getVideoTracks(), ...dest.stream.getAudioTracks()]);
    } catch {
      stream = work.captureStream(60);
    }

    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : "video/webm";
    const bitrate = Math.round(6e6 * Math.max((w * h) / 2073600, 0.5));
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bitrate });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);

    const done = new Promise<Partial<Job>>((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        resolve({
          status: cancelRef.current ? "error" : "done",
          error: cancelRef.current ? "أُلغيت" : undefined,
          progress: 1,
          outBlob: blob,
          resultUrl: URL.createObjectURL(blob),
          resultSize: { w, h },
        });
      };
    });

    v.onended = () => setTimeout(() => recorder.state !== "inactive" && recorder.stop(), 200);

    const draw = () => {
      if (cancelRef.current) { recorder.stop(); return; }
      engine.processFrame(v, scale, sharpness, usePostProcess);
      ctx.drawImage(engine.displayCanvas, 0, 0);
      const end = v.duration || 1;
      onProgress(Math.min(0.99, v.currentTime / end));
      if (!v.paused && !v.ended) requestAnimationFrame(draw);
    };

    v.onplaying = draw;
    recorder.start();
    await v.play();

    return done.finally(() => URL.revokeObjectURL(url));
  };

  const runAll = async () => {
    setRunning(true);
    cancelRef.current = false;
    for (const job of jobs.filter((j) => j.status === "queued" || j.status === "error")) {
      if (cancelRef.current) break;
      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: "working", progress: 0 } : j)));
      try {
        const patch =
          job.kind === "image"
            ? await processImage(job)
            : await processVideo(job, (p) =>
                setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, progress: p } : j)))
              );
        setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, ...patch } : j)));
      } catch (err) {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id ? { ...j, status: "error", error: err instanceof Error ? err.message : String(err) } : j
          )
        );
      }
    }
    setRunning(false);
  };

  const fmtLabel = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <header className="mb-8 text-center">
          <h1 className="font-kufi text-3xl font-bold tracking-tight">Upscale <span className="text-emerald-500">v2</span></h1>
          <p className="mt-1 text-sm text-muted-foreground">
            تحسين دقة الصور والفيديو — WebGL محلي، بدون رفع ولا حسابات
          </p>
        </header>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
          className={`rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
            dragOver ? "border-emerald-500 bg-emerald-500/5" : "border-border"
          }`}
        >
          <p className="font-kufi text-lg font-semibold">اسحب الصور أو الفيديوهات هنا</p>
          <p className="mt-1 text-xs text-muted-foreground">أو الصق من الحافظة (Ctrl+V)</p>
          <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700">
            اختر ملفات
            <input type="file" multiple accept="image/*,video/*" className="hidden"
              onChange={(e) => { addFiles(e.target.files ?? []); e.target.value = ""; }} />
          </label>
        </div>

        {/* Settings */}
        <section className="mt-6 grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Scale Factor</label>
            <div className="mt-2 flex gap-2">
              {SCALE_OPTIONS.map((s) => (
                <button key={s} onClick={() => update({ scaleFactor: s })}
                  className={`flex-1 rounded-lg border py-2 text-sm font-semibold transition ${
                    settings.scaleFactor === s ? "border-emerald-500 bg-emerald-500/10 text-emerald-600" : "hover:bg-muted"
                  }`}>
                  {s}×
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Quality Preset</label>
            <div className="mt-2 flex gap-2">
              {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((p) => (
                <button key={p} onClick={() => update({ preset: p })}
                  className={`flex-1 rounded-lg border py-2 text-xs font-semibold capitalize transition ${
                    settings.preset === p ? "border-emerald-500 bg-emerald-500/10 text-emerald-600" : "hover:bg-muted"
                  }`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex justify-between text-sm font-medium">
              Sharpness <span className="text-muted-foreground">{settings.sharpness.toFixed(2)}</span>
            </label>
            <input type="range" min={0} max={1} step={0.05} value={settings.sharpness}
              onChange={(e) => update({ sharpness: Number(e.target.value), preset: "custom" })}
              className="mt-3 w-full accent-emerald-600" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Format</label>
              <select value={format} onChange={(e) => setFormat(e.target.value as OutputFormat)}
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm">
                <option value="png">PNG (خسارة صفرية)</option>
                <option value="jpeg">JPEG (صغير)</option>
                <option value="webp">WebP (متوازن)</option>
              </select>
            </div>
            <label className="flex cursor-pointer items-end gap-2 pb-2 text-sm">
              <input type="checkbox" checked={settings.usePostProcess}
                onChange={(e) => update({ usePostProcess: e.target.checked, preset: "custom" })}
                className="size-4 accent-emerald-600" />
              Post-process sharpening
            </label>
          </div>
        </section>

        {/* Jobs */}
        {jobs.length > 0 && (
          <section className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-kufi text-lg font-semibold">الملفات ({jobs.length})</h2>
              <div className="flex gap-2">
                <button onClick={() => { jobs.forEach((j) => { if (j.originalUrl) URL.revokeObjectURL(j.originalUrl); if (j.resultUrl) URL.revokeObjectURL(j.resultUrl); }); setJobs([]); }} disabled={running}
                  className="rounded-lg border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-50">
                  مسح الكل
                </button>
                {running ? (
                  <button onClick={() => { cancelRef.current = true; }}
                    className="rounded-lg bg-red-600 px-5 py-1.5 text-sm font-semibold text-white hover:bg-red-700">
                    إيقاف ⏹
                  </button>
                ) : (
                  <button onClick={runAll}
                    className="rounded-lg bg-emerald-600 px-5 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700">
                    حسّن الكل ▶
                  </button>
                )}
              </div>
            </div>

            {jobs.map((job) => (
              <div key={job.id} className="flex items-center gap-4 rounded-xl border bg-card p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{job.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmtLabel(job.file.size)}
                    {job.resultSize && ` → ${job.resultSize.w}×${job.resultSize.h}`}
                    {job.outBlob && ` • ${fmtLabel(job.outBlob.size)}`}
                  </p>
                  {job.status === "working" && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-emerald-600 transition-all"
                        style={{ width: `${Math.round(job.progress * 100)}%` }} />
                    </div>
                  )}
                  {job.error && <p className="mt-1 text-xs text-red-500">{job.error}</p>}
                </div>
                {job.status === "done" && job.resultUrl && job.originalUrl && (
                  <button
                    onClick={() => setCompareId(compareId === job.id ? null : job.id)}
                    className="shrink-0 rounded-lg border px-3 py-1.5 text-xs hover:bg-muted"
                    title="مقارنة قبل/بعد">
                    {compareId === job.id ? "إخفاء المقارنة" : "قارن ⟷"}
                  </button>
                )}
                {job.status === "done" && job.resultUrl && (
                  <a href={job.resultUrl} download={`upscaled-${job.file.name.replace(/\.[^.]+$/, "")}.${job.kind === "video" ? "webm" : format}`}
                    className="shrink-0 rounded-lg border border-emerald-500 px-4 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-500/10">
                    تحميل ⬇
                  </a>
                )}
                {job.status === "queued" && <span className="shrink-0 text-xs text-muted-foreground">بالانتظار</span>}
                {job.status === "working" && <span className="shrink-0 animate-pulse text-xs text-emerald-600">يجري التحسين…</span>}
                {!running && (
                  <button onClick={() => removeJob(job.id)} disabled={running}
                    className="shrink-0 rounded-full border px-2 py-0.5 text-xs text-muted-foreground hover:border-red-400 hover:text-red-500"
                    aria-label={`حذف ${job.file.name}`}
                    title="حذف">
                    ✕
                  </button>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Before/After compare — resurrects the dead comparePct state (v2.1) */}
        {compareId && (() => {
          const job = jobs.find((j) => j.id === compareId);
          if (!job?.originalUrl || !job?.resultUrl) return null;
          return (
            <section className="mt-6 rounded-xl border bg-card p-5">
              <h2 className="font-kufi mb-3 text-lg font-semibold">مقارنة قبل/بعد — {job.file.name}</h2>
              <div className="relative select-none overflow-hidden rounded-lg bg-muted"
                style={{ aspectRatio: `${job.resultSize?.w ?? 16} / ${job.resultSize?.h ?? 9}` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={job.originalUrl} alt="قبل" className="absolute inset-0 size-full object-contain" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={job.resultUrl} alt="بعد" className="absolute inset-0 size-full object-contain"
                  style={{ clipPath: `inset(0 0 0 ${comparePct}%)` }} />
                <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-emerald-500" style={{ left: `${comparePct}%` }} />
              </div>
              <input type="range" min={0} max={100} value={comparePct}
                onChange={(e) => setComparePct(Number(e.target.value))}
                className="mt-3 w-full accent-emerald-600" />
              <p className="mt-1 text-center text-xs text-muted-foreground">يسار: الأصل — يمين: المحسّن ({settings.scaleFactor}×)</p>
            </section>
          );
        })()}

        <footer className="mt-12 text-center text-xs text-muted-foreground">
          كل المعالجة على جهازك — WebGL2 · لا رفع · لا تتبع
        </footer>
      </div>
    </main>
  );
}
