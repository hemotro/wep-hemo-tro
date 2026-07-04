import axios from "axios";
import type { Express, Request, Response } from "express";

/**
 * Proxy endpoint لتشغيل الفيديوهات من Telegram
 * يسحب الفيديو من Telegram ويعيده للمتصفح
 */
export function setupTelegramVideoProxy(app: Express) {
  app.get("/api/telegram/video/:fileId", async (req: Request, res: Response) => {
    try {
      const { fileId } = req.params;
      const botToken = process.env.TELEGRAM_BOT_TOKEN;

      if (!botToken) {
        console.error("❌ Bot token not configured");
        return res.status(500).json({ error: "Bot token not configured" });
      }

      if (!fileId) {
        console.error("❌ File ID is required");
        return res.status(400).json({ error: "File ID is required" });
      }

      console.log(`📥 Getting file info for: ${fileId}`);

      // الخطوة 1: الحصول على معلومات الملف من Telegram
      let getFileResponse;
      try {
        getFileResponse = await axios.get(
          `https://api.telegram.org/bot${botToken}/getFile`,
          {
            params: { file_id: fileId },
            timeout: 10000,
          }
        );
      } catch (error) {
        console.error("❌ Failed to get file info from Telegram:", error);
        return res.status(500).json({ error: "Failed to get file info from Telegram" });
      }

      if (!getFileResponse.data.ok) {
        console.error("❌ Telegram API error:", getFileResponse.data);
        return res.status(400).json({ error: "Invalid file ID or Telegram error" });
      }

      const filePath = getFileResponse.data.result?.file_path;
      const fileSize = getFileResponse.data.result?.file_size;

      if (!filePath) {
        console.error("❌ No file path in Telegram response");
        return res.status(400).json({ error: "No file path found" });
      }

      console.log(`✅ File path: ${filePath}, Size: ${fileSize} bytes`);

      // الخطوة 2: سحب الفيديو من Telegram
      const videoUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
      console.log(`📥 Downloading video from: ${videoUrl}`);

      // معالجة Range requests (للتقديم السريع في الفيديو)
      const rangeHeader = req.headers.range;

      if (rangeHeader && rangeHeader.match(/bytes=/)) {
        // معالجة Range request
        console.log(`📊 Range request: ${rangeHeader}`);
        const parts = rangeHeader.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : (fileSize || 0) - 1;
        const chunksize = end - start + 1;

        try {
          const rangeResponse = await axios.get(videoUrl, {
            responseType: "stream",
            headers: {
              Range: `bytes=${start}-${end}`,
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
            timeout: 300000,
          });

          res.writeHead(206, {
            "Content-Range": `bytes ${start}-${end}/${fileSize || "*"}`,
            "Content-Length": chunksize,
            "Content-Type": "video/mp4",
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=86400",
            "Access-Control-Allow-Origin": "*",
          });

          rangeResponse.data.pipe(res);

          rangeResponse.data.on("error", (error: any) => {
            console.error("❌ Stream error (range):", error);
            if (!res.headersSent) {
              res.status(500).json({ error: "Failed to stream video" });
            }
          });
        } catch (error) {
          console.error("❌ Range request error:", error);
          return res.status(500).json({ error: "Failed to process range request" });
        }
      } else {
        // إرسال الفيديو كاملاً
        try {
          const videoResponse = await axios.get(videoUrl, {
            responseType: "stream",
            timeout: 300000, // 5 دقائق
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
          });

          res.writeHead(200, {
            "Content-Type": "video/mp4",
            "Content-Length": fileSize || "unknown",
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=86400",
            "Access-Control-Allow-Origin": "*",
          });

          videoResponse.data.pipe(res);

          videoResponse.data.on("error", (error: any) => {
            console.error("❌ Stream error:", error);
            if (!res.headersSent) {
              res.status(500).json({ error: "Failed to stream video" });
            }
          });

          res.on("error", (error: any) => {
            console.error("❌ Response error:", error);
          });

          console.log("✅ Video streaming started");
        } catch (error) {
          console.error("❌ Failed to download video from Telegram:", error);
          return res.status(500).json({ error: "Failed to download video from Telegram" });
        }
      }
    } catch (error) {
      console.error("❌ Error in Telegram proxy:", error);

      if (!res.headersSent) {
        res.status(500).json({
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch video from Telegram",
        });
      }
    }
  });

  // Health check endpoint
  app.get("/api/telegram/health", (req: Request, res: Response) => {
    res.json({ status: "ok", message: "Telegram proxy is running" });
  });
}

/**
 * دالة مساعدة للحصول على رابط proxy للفيديو
 */
export function getTelegramProxyUrl(fileId: string): string {
  return `/api/telegram/video/${fileId}`;
}
