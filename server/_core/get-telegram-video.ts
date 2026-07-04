import { getTelegramVideoUrl } from "../telegram-upload";
import type { Express, Response } from "express";

interface GetVideoRequest {
  query: {
    fileId: string;
  };
}

/**
 * معالج سحب الفيديو من Telegram
 */
export function setupGetTelegramVideoHandler(app: Express) {
  app.get("/api/get-telegram-video", async (req: GetVideoRequest, res: Response) => {
    try {
      const { fileId } = req.query;

      if (!fileId) {
        return res.status(400).json({ error: "معرف الملف مفقود" });
      }

      const videoUrl = await getTelegramVideoUrl(fileId as string);

      res.json({
        success: true,
        url: videoUrl,
      });
    } catch (error) {
      console.error("Error getting Telegram video:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "فشل سحب الفيديو",
      });
    }
  });
}
