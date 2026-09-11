import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

interface PhotoSession {
  id: string;
  strip: string;
  rawShots: string[];
  gif?: string;
  video?: string;
  createdAt: number;
}

// In-memory store for photobooth sessions (zero external database needed)
const sessions = new Map<string, PhotoSession>();

// Barcode & session expiration time: 30 minutes
const SESSION_EXPIRY_MS = 30 * 60 * 1000;

// Cleanup sessions older than 30 minutes every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.createdAt > SESSION_EXPIRY_MS) {
      sessions.delete(id);
    }
  }
}, 60 * 1000);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // High payload limits to accommodate 300 DPI base64 image data
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // CORS middleware to support cross-device, mobile browsers, and reverse proxies
  app.use((_req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (_req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", activeSessions: sessions.size });
  });

  // Upload or update session data (supports partial updates for fast progressive sync)
  app.post("/api/session", (req, res) => {
    try {
      const { id, strip, rawShots, gif, video } = req.body;
      const existing = sessions.get(id);

      if (!id || (!strip && !existing)) {
        return res.status(400).json({ error: "Missing required session data" });
      }

      const updatedSession: PhotoSession = {
        id,
        strip: strip || existing?.strip || '',
        rawShots: Array.isArray(rawShots) && rawShots.length > 0 ? rawShots : (existing?.rawShots || []),
        gif: gif || existing?.gif,
        video: video || existing?.video,
        createdAt: existing?.createdAt || Date.now(),
      };

      sessions.set(id, updatedSession);

      // Keep up to 300 recent sessions in memory
      if (sessions.size > 300) {
        const oldestKey = sessions.keys().next().value;
        if (oldestKey) sessions.delete(oldestKey);
      }

      res.json({
        success: true,
        id,
        hasStrip: !!updatedSession.strip,
        hasGif: !!updatedSession.gif,
        hasVideo: !!updatedSession.video,
      });
    } catch (err: any) {
      console.error("Error storing session:", err);
      res.status(500).json({ error: err.message || "Failed to store session" });
    }
  });

  // Get session data for mobile scan viewer (checks 30-minute limit)
  app.get("/api/session/:id", (req, res) => {
    const session = sessions.get(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Sesi foto tidak ditemukan atau sudah kadaluarsa (30 menit)." });
    }

    const now = Date.now();
    const age = now - session.createdAt;
    if (age > SESSION_EXPIRY_MS) {
      sessions.delete(req.params.id);
      return res.status(410).json({
        error: "Barcode dan sesi foto telah kadaluarsa (berlaku maksimal 30 menit).",
        expired: true,
      });
    }

    const remainingMs = Math.max(0, SESSION_EXPIRY_MS - age);
    res.json({
      ...session,
      expiresAt: session.createdAt + SESSION_EXPIRY_MS,
      remainingSeconds: Math.floor(remainingMs / 1000),
    });
  });

  // Direct binary image download route (ideal for mobile browser download triggers)
  app.get("/api/download/:id/strip", (req, res) => {
    const session = sessions.get(req.params.id);
    if (!session || !session.strip || Date.now() - session.createdAt > SESSION_EXPIRY_MS) {
      if (session && Date.now() - session.createdAt > SESSION_EXPIRY_MS) sessions.delete(req.params.id);
      return res.status(410).send("Photo session expired (30 minutes limit)");
    }
    const matches = session.strip.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).send("Invalid base64 image format");
    }
    const buffer = Buffer.from(matches[2], "base64");
    res.writeHead(200, {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="adimasbooth-${session.id}.png"`,
      "Content-Length": buffer.length,
    });
    res.end(buffer);
  });

  // Direct binary GIF download route
  app.get("/api/download/:id/gif", (req, res) => {
    const session = sessions.get(req.params.id);
    if (!session || !session.gif || Date.now() - session.createdAt > SESSION_EXPIRY_MS) {
      if (session && Date.now() - session.createdAt > SESSION_EXPIRY_MS) sessions.delete(req.params.id);
      return res.status(410).send("GIF session expired (30 minutes limit)");
    }
    const matches = session.gif.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).send("Invalid base64 GIF format");
    }
    const buffer = Buffer.from(matches[2], "base64");
    res.writeHead(200, {
      "Content-Type": "image/gif",
      "Content-Disposition": `attachment; filename="adimasbooth-${session.id}.gif"`,
      "Content-Length": buffer.length,
    });
    res.end(buffer);
  });

  // Direct binary Video download route (MP4 / WebM for Instagram/WhatsApp Story)
  app.get("/api/download/:id/video", (req, res) => {
    const session = sessions.get(req.params.id);
    if (!session || !session.video || Date.now() - session.createdAt > SESSION_EXPIRY_MS) {
      if (session && Date.now() - session.createdAt > SESSION_EXPIRY_MS) sessions.delete(req.params.id);
      return res.status(410).send("Video session expired (30 minutes limit)");
    }
    const matches = session.video.match(/^data:([A-Za-z0-9-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).send("Invalid base64 video format");
    }
    const contentType = matches[1] || "video/mp4";
    const ext = contentType.includes("webm") ? "webm" : "mp4";
    const buffer = Buffer.from(matches[2], "base64");
    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="adimasbooth-story-${session.id}.${ext}"`,
      "Content-Length": buffer.length,
    });
    res.end(buffer);
  });

  // Vite development middleware or static production serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
