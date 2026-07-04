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
        return res.status(500).json({ error: "Bot token not configured" });
      }

      if (!fileId) {
        return res.status(400).json({ error: "File ID is required" });
      }

      // الخطوة 1: الحصول على معلومات الملف من Telegram
      console.log(`📥 Getting file info for: ${fileId}`);
      const getFileResponse = await axios.get(
        `https://api.telegram.org/bot${botToken}/getFile`,
        {
          params: { file_id: fileId },
          timeout: 10000,
        }
      );

      if (!getFileResponse.data.ok) {
        console.error("❌ Failed to get file info:", getFileResponse.data);
        return res.status(400).json({ error: "Invalid file ID" });
      }

      const filePath = getFileResponse.data.result.file_path;
      const fileSize = getFileResponse.data.result.file_size;

      console.log(`✅ File path: ${filePath}, Size: ${fileSize} bytes`);

      // الخطوة 2: سحب الفيديو من Telegram
      const videoUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

      console.log(`📥 Downloading video from: ${videoUrl}`);

      const videoResponse = await axios.get(videoUrl, {
        responseType: "stream",
        timeout: 300000, // 5 دقائق
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      // الخطوة 3: إرسال الفيديو للمتصفح مع headers صحيحة
      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Content-Length", fileSize);
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Cache-Control", "public, max-age=86400"); // cache لمدة يوم
      res.setHeader("Access-Control-Allow-Origin", "*"); // السماح بـ CORS

      // معالجة Range requests (للتقديم السريع في الفيديو)
      const rangeHeader = req.headers.range;
      if (rangeHeader && rangeHeader.match(/bytes=/)) {
        const parts = rangeHeader.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = end - start + 1;

        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Content-Length": chunksize,
          "Content-Type": "video/mp4",
        });

        // إعادة توجيه الطلب مع Range header
        const rangeResponse = await axios.get(videoUrl, {
          responseType: "stream",
          headers: {
            Range: `bytes=${start}-${end}`,
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });

        rangeResponse.data.pipe(res);
      } else {
        // إرسال الفيديو كاملاً
        videoResponse.data.pipe(res);
      }

      // معالجة الأخطاء
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
}

/**
 * دالة مساعدة للحصول على رابط proxy للفيديو
 */
export function getTelegramProxyUrl(fileId: string): string {
  return `/api/telegram/video/${fileId}`;
}
