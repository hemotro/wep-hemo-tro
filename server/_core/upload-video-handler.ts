import { uploadVideoToTelegram } from "../telegram-upload";
import { createEpisode } from "../db";
import type { Express, Response } from "express";

interface UploadRequest {
  file?: {
    buffer: Buffer;
    originalname: string;
    size: number;
  };
  body: {
    seriesId: string;
    season: string;
    episodeNumber: string;
    title: string;
    titleAr: string;
    description?: string;
    descriptionAr?: string;
  };
}

/**
 * معالج رفع الفيديو إلى Telegram
 */
export function setupUploadVideoHandler(app: Express) {
  app.post("/api/upload-video", async (req: UploadRequest, res: Response) => {
    try {
      // التحقق من وجود الملف
      if (!req.file) {
        return res.status(400).json({ error: "لم يتم تحديد ملف فيديو" });
      }

      // استخراج البيانات من الطلب
      const { seriesId, season, episodeNumber, title, titleAr, description, descriptionAr } = req.body;

      // التحقق من البيانات المطلوبة
      if (!seriesId || !season || !episodeNumber || !title || !titleAr) {
        return res.status(400).json({ error: "بيانات ناقصة" });
      }

      const chatId = parseInt(process.env.TELEGRAM_CHAT_ID || "0");
      if (!chatId) {
        return res.status(500).json({ error: "معرف الدردشة غير مكون" });
      }

      // رفع الفيديو إلى Telegram
      const uploadResult = await uploadVideoToTelegram(
        req.file.buffer,
        req.file.originalname,
        chatId,
        {
          seriesId: parseInt(seriesId),
          season: parseInt(season),
          episodeNumber: parseInt(episodeNumber),
          title,
          titleAr,
        }
      );

      // إنشاء الحلقة في قاعدة البيانات
      // استخدم S3 URL إن توفر، وإلا استخدم Telegram fileId
      const videoUrl = uploadResult.s3Url || uploadResult.fileId;
      const videoType = uploadResult.s3Url ? ("mp4" as const) : ("telegram" as const);

      const episodeData = {
        seriesId: parseInt(seriesId),
        season: parseInt(season),
        episodeNumber: parseInt(episodeNumber),
        title,
        titleAr,
        description: description || "",
        descriptionAr: descriptionAr || "",
        videoUrl,
        videoType,
        videoSize: req.file.size,
      };

      const episode = await createEpisode(episodeData);

      res.json({
        success: true,
        message: "تم رفع الفيديو بنجاح",
        episode,
        telegram: uploadResult,
      });
    } catch (error) {
      console.error("Error uploading video:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "فشل رفع الفيديو",
      });
    }
  });
}
