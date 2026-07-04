import "dotenv/config";
import express from "express";
// @ts-ignore
import fileUpload from "express-fileupload";
import type { Request } from "express";

// @ts-ignore
import type { UploadedFile } from "express-fileupload";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { uploadVideoToS3 } from "./videoUpload";
import { initTelegramRouter } from "../telegram.router";
import { setupGetTelegramVideoHandler } from "./get-telegram-video";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "500mb" }));
  app.use(express.urlencoded({ limit: "500mb", extended: true }));
  
  // File upload middleware
  app.use(fileUpload());
  
  // Initialize Telegram Bot
  await initTelegramRouter();
  
  // Setup handlers
  setupGetTelegramVideoHandler(app);
  
  // Telegram webhook endpoint
  app.post("/api/telegram/webhook", async (req, res) => {
    try {
      const update = req.body;
      // معالجة الـ webhook من خلال tRPC
      res.json({ ok: true });
    } catch (error) {
      console.error("Telegram webhook error:", error);
      res.status(500).json({ ok: false });
    }
  });

  // Video upload endpoint - Upload to Telegram
  app.post("/api/upload-video", async (req: any, res) => {
    try {
      const file = req.files?.file as any;
      const { seriesId, season, episodeNumber, title, titleAr, description, descriptionAr } = req.body;

      if (!file) {
        return res.status(400).json({ error: "لم يتم تحديد ملف فيديو" });
      }

      if (!seriesId || !season || !episodeNumber || !title || !titleAr) {
        return res.status(400).json({ error: "بيانات ناقصة" });
      }

      const { uploadVideoToTelegram } = await import("../telegram-upload");
      const buffer = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data);
      const chatId = parseInt(process.env.TELEGRAM_CHAT_ID || "0");

      if (!chatId) {
        return res.status(500).json({ error: "معرف الدردشة غير مكون" });
      }

      const uploadResult = await uploadVideoToTelegram(
        buffer,
        file.name,
        chatId,
        {
          seriesId: parseInt(seriesId),
          season: parseInt(season),
          episodeNumber: parseInt(episodeNumber),
          title,
          titleAr,
        }
      );

      res.json({
        success: true,
        url: uploadResult.fileId,
        messageId: uploadResult.messageId,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "فشل رفع الفيديو" });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
