import axios from "axios";
import FormData from "form-data";
import { Readable } from "stream";
import { getDb } from "./db";
import { telegramOperations } from "../drizzle/schema";
import { storagePut } from "./storage";

const TELEGRAM_API_URL = "https://api.telegram.org";

/**
 * إرسال الفيديو إلى Telegram Bot ورفعه إلى S3
 */
export async function uploadVideoToTelegram(
  videoBuffer: Buffer,
  fileName: string,
  chatId: number,
  metadata: {
    seriesId: number;
    season: number;
    episodeNumber: number;
    title: string;
    titleAr: string;
  }
) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    throw new Error("TELEGRAM_BOT_TOKEN not configured");
  }

  try {
    // إنشاء FormData لإرسال الفيديو
    const formData = new FormData();
    
    // تحويل Buffer إلى Stream
    const stream = Readable.from(videoBuffer);
    formData.append("video", stream, fileName);
    formData.append("chat_id", chatId.toString());
    formData.append("caption", `
🎬 ${metadata.titleAr}
📺 الموسم: ${metadata.season}
🎞️ الحلقة: ${metadata.episodeNumber}
    `.trim());

    // إرسال الفيديو
    const response = await axios.post(
      `${TELEGRAM_API_URL}/bot${botToken}/sendVideo`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 300000, // 5 دقائق
      }
    );

    if (!response.data.ok) {
      throw new Error(response.data.description || "Failed to upload video");
    }

    const messageId = response.data.result?.message_id;
    const fileId = response.data.result?.video?.file_id;

    if (!messageId || !fileId) {
      throw new Error("Failed to get message_id or file_id from Telegram response");
    }

    // رفع الفيديو إلى S3 أيضاً للعرض السريع
    let s3Url = "";
    try {
      const s3Key = `videos/${metadata.seriesId}/s${metadata.season}e${metadata.episodeNumber}-${Date.now()}.mp4`;
      const s3Result = await storagePut(s3Key, videoBuffer, "video/mp4");
      s3Url = s3Result.url;
      console.log("✅ Video uploaded to S3:", s3Url);
    } catch (s3Error) {
      console.error("⚠️ S3 upload failed (but Telegram succeeded):", s3Error);
    }

    // حفظ معلومات العملية في قاعدة البيانات
    const db = await getDb();
    if (db) {
      await db.insert(telegramOperations).values({
        chatId: process.env.TELEGRAM_CHAT_ID || "",
        userId: "system",
        operationType: "upload_video",
        seriesId: metadata.seriesId,
        messageId: messageId.toString(),
        data: JSON.stringify({
          fileId,
          s3Url,
          season: metadata.season,
          episodeNumber: metadata.episodeNumber,
          title: metadata.title,
          titleAr: metadata.titleAr,
        }),
        status: "completed",
      });
    }

    return {
      success: true,
      messageId,
      fileId,
      url: `tg://openmessage?user_id=${chatId}&message_id=${messageId}`,
      s3Url,
    };
  } catch (error) {
    console.error("Error uploading video to Telegram:", error);

    // حفظ خطأ العملية
    const db = await getDb();
    if (db) {
      await db.insert(telegramOperations).values({
        chatId: process.env.TELEGRAM_CHAT_ID || "",
        userId: "system",
        operationType: "upload_video",
        seriesId: metadata.seriesId,
        data: JSON.stringify(metadata),
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }

    throw error;
  }
}

/**
 * سحب معلومات الفيديو من Telegram
 */
export async function getVideoFromTelegram(fileId: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    throw new Error("TELEGRAM_BOT_TOKEN not configured");
  }

  try {
    // الحصول على معلومات الملف
    const response = await axios.get(
      `${TELEGRAM_API_URL}/bot${botToken}/getFile`,
      {
        params: {
          file_id: fileId,
        },
      }
    );

    if (!response.data.ok) {
      throw new Error(response.data.description || "Failed to get file info");
    }

    const filePath = response.data.result.file_path;
    const fileSize = response.data.result.file_size;

    // بناء رابط التحميل المباشر
    const downloadUrl = `${TELEGRAM_API_URL}/file/bot${botToken}/${filePath}`;

    return {
      success: true,
      downloadUrl,
      fileSize,
      filePath,
    };
  } catch (error) {
    console.error("Error getting video from Telegram:", error);
    throw error;
  }
}

/**
 * الحصول على رابط مباشر للفيديو من Telegram
 */
export async function getTelegramVideoUrl(fileId: string): Promise<string> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    throw new Error("TELEGRAM_BOT_TOKEN not configured");
  }

  try {
    const response = await axios.get(
      `${TELEGRAM_API_URL}/bot${botToken}/getFile`,
      {
        params: {
          file_id: fileId,
        },
      }
    );

    if (!response.data.ok) {
      throw new Error(response.data.description || "Failed to get file info");
    }

    const filePath = response.data.result.file_path;
    return `${TELEGRAM_API_URL}/file/bot${botToken}/${filePath}`;
  } catch (error) {
    console.error("Error getting Telegram video URL:", error);
    throw error;
  }
}
