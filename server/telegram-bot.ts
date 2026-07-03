import axios from "axios";
import { getDb } from "./db";
import { telegramBot, telegramOperations } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { storagePut } from "./storage";

const TELEGRAM_API_URL = "https://api.telegram.org";

interface TelegramMessage {
  message_id: number;
  chat: {
    id: number;
    type: string;
  };
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username?: string;
  };
  text?: string;
  document?: {
    file_id: string;
    file_unique_id: string;
    file_size: number;
    mime_type: string;
    file_name: string;
  };
  photo?: Array<{
    file_id: string;
    file_unique_id: string;
    file_size: number;
    width: number;
    height: number;
  }>;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

export class TelegramBotHandler {
  private botToken: string;
  private authorizedChatIds: number[];

  constructor(botToken: string, authorizedChatIds: number[]) {
    this.botToken = botToken;
    this.authorizedChatIds = authorizedChatIds;
  }

  /**
   * التحقق من أن المستخدم مصرح له
   */
  private isAuthorized(chatId: number): boolean {
    return this.authorizedChatIds.includes(chatId);
  }

  /**
   * إرسال رسالة إلى التيليجرام
   */
  async sendMessage(chatId: number, text: string, options?: any): Promise<void> {
    try {
      await axios.post(`${TELEGRAM_API_URL}/bot${this.botToken}/sendMessage`, {
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        ...options,
      });
    } catch (error) {
      console.error("Failed to send Telegram message:", error);
    }
  }

  /**
   * تحميل ملف من التيليجرام
   */
  async downloadFile(fileId: string): Promise<Buffer> {
    try {
      // الحصول على معلومات الملف
      const fileResponse = await axios.get(
        `${TELEGRAM_API_URL}/bot${this.botToken}/getFile`,
        {
          params: { file_id: fileId },
        }
      );

      const filePath = fileResponse.data.result.file_path;

      // تحميل الملف
      const fileData = await axios.get(
        `${TELEGRAM_API_URL}/file/bot${this.botToken}/${filePath}`,
        {
          responseType: "arraybuffer",
        }
      );

      return Buffer.from(fileData.data);
    } catch (error) {
      console.error("Failed to download file from Telegram:", error);
      throw error;
    }
  }

  /**
   * معالجة الرسائل الواردة
   */
  async handleUpdate(update: TelegramUpdate): Promise<void> {
    const message = update.message;
    if (!message) return;

    const chatId = message.chat.id;
    const userId = message.from.id;
    const text = message.text?.trim() || "";

    // التحقق من التفويض
    if (!this.isAuthorized(chatId)) {
      await this.sendMessage(
        chatId,
        "❌ عذراً، أنت غير مصرح باستخدام هذا البوت.\n\nهذا البوت مخصص للمسؤولين فقط."
      );
      return;
    }

    // معالجة الأوامر
    if (text.startsWith("/")) {
      await this.handleCommand(chatId, userId, text);
    } else if (message.document) {
      await this.handleVideoUpload(chatId, userId, message.document);
    } else if (message.photo && message.photo.length > 0) {
      await this.handleImageUpload(chatId, userId, message.photo[0]);
    } else {
      await this.sendMessage(
        chatId,
        "📝 الأوامر المتاحة:\n\n" +
          "/start - بدء البوت\n" +
          "/add_series - إضافة مسلسل جديد\n" +
          "/add_episode - إضافة حلقة جديدة\n" +
          "/help - الحصول على المساعدة\n\n" +
          "أو أرسل ملف فيديو لرفعه"
      );
    }
  }

  /**
   * معالجة الأوامر
   */
  private async handleCommand(
    chatId: number,
    userId: number,
    command: string
  ): Promise<void> {
    const db = await getDb();
    if (!db) {
      await this.sendMessage(chatId, "❌ خطأ في الاتصال بقاعدة البيانات");
      return;
    }

    if (command === "/start") {
      await this.sendMessage(
        chatId,
        "👋 مرحباً بك في بوت إدارة المسلسلات!\n\n" +
          "الأوامر المتاحة:\n" +
          "/add_series - إضافة مسلسل جديد\n" +
          "/add_episode - إضافة حلقة جديدة\n" +
          "/help - الحصول على المساعدة"
      );
    } else if (command === "/add_series") {
      await this.sendMessage(
        chatId,
        "📺 لإضافة مسلسل جديد، أرسل البيانات بالصيغة التالية:\n\n" +
          "<b>الاسم بالعربية</b>\n" +
          "الوصف بالعربية\n" +
          "النوع (مثل: دراما، أكشن، إلخ)\n\n" +
          "ثم أرسل صورة المسلسل"
      );

      // حفظ العملية
      await db.insert(telegramOperations).values({
        chatId: chatId.toString(),
        userId: userId.toString(),
        operationType: "add_series",
        status: "pending",
      });
    } else if (command === "/add_episode") {
      await this.sendMessage(
        chatId,
        "🎬 لإضافة حلقة جديدة، أرسل البيانات بالصيغة التالية:\n\n" +
          "<b>معرف المسلسل</b>\n" +
          "رقم الموسم\n" +
          "رقم الحلقة\n" +
          "الاسم بالعربية\n\n" +
          "ثم أرسل ملف الفيديو"
      );

      // حفظ العملية
      await db.insert(telegramOperations).values({
        chatId: chatId.toString(),
        userId: userId.toString(),
        operationType: "add_episode",
        status: "pending",
      });
    } else if (command === "/help") {
      await this.sendMessage(
        chatId,
        "📖 <b>دليل الاستخدام:</b>\n\n" +
          "1️⃣ <b>إضافة مسلسل:</b>\n" +
          "/add_series ثم اتبع التعليمات\n\n" +
          "2️⃣ <b>إضافة حلقة:</b>\n" +
          "/add_episode ثم اتبع التعليمات\n\n" +
          "3️⃣ <b>رفع فيديو:</b>\n" +
          "أرسل ملف الفيديو مباشرة\n\n" +
          "4️⃣ <b>رفع صورة:</b>\n" +
          "أرسل صورة مباشرة"
      );
    } else {
      await this.sendMessage(
        chatId,
        "❓ أمر غير معروف.\n\nاكتب /help للحصول على المساعدة"
      );
    }
  }

  /**
   * معالجة رفع الفيديو
   */
  private async handleVideoUpload(
    chatId: number,
    userId: number,
    document: any
  ): Promise<void> {
    const db = await getDb();
    if (!db) {
      await this.sendMessage(chatId, "❌ خطأ في الاتصال بقاعدة البيانات");
      return;
    }

    try {
      await this.sendMessage(chatId, "⏳ جاري تحميل الفيديو...");

      // تحميل الملف من التيليجرام
      const fileBuffer = await this.downloadFile(document.file_id);

      // رفع إلى S3
      const fileName = document.file_name || `video-${Date.now()}.mp4`;
      const fileKey = `telegram-uploads/${Date.now()}-${fileName}`;

      const { url } = await storagePut(fileKey, fileBuffer, document.mime_type);

      // حفظ العملية
      await db.insert(telegramOperations).values({
        chatId: chatId.toString(),
        userId: userId.toString(),
        operationType: "upload_video",
        status: "completed",
        data: JSON.stringify({
          fileName,
          fileSize: document.file_size,
          mimeType: document.mime_type,
          url,
          fileKey,
        }),
      });

      await this.sendMessage(
        chatId,
        "✅ تم رفع الفيديو بنجاح!\n\n" +
          `<b>الاسم:</b> ${fileName}\n` +
          `<b>الحجم:</b> ${(document.file_size / 1024 / 1024).toFixed(2)} MB\n\n` +
          `الرابط:\n<code>${url}</code>`
      );
    } catch (error) {
      console.error("Video upload error:", error);
      await this.sendMessage(
        chatId,
        "❌ حدث خطأ في رفع الفيديو. حاول مرة أخرى."
      );

      // حفظ الخطأ
      await db.insert(telegramOperations).values({
        chatId: chatId.toString(),
        userId: userId.toString(),
        operationType: "upload_video",
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * معالجة رفع الصورة
   */
  private async handleImageUpload(
    chatId: number,
    userId: number,
    photo: any
  ): Promise<void> {
    const db = await getDb();
    if (!db) {
      await this.sendMessage(chatId, "❌ خطأ في الاتصال بقاعدة البيانات");
      return;
    }

    try {
      await this.sendMessage(chatId, "⏳ جاري تحميل الصورة...");

      // تحميل الملف من التيليجرام
      const fileBuffer = await this.downloadFile(photo.file_id);

      // رفع إلى S3
      const fileName = `image-${Date.now()}.jpg`;
      const fileKey = `telegram-uploads/${Date.now()}-${fileName}`;

      const { url } = await storagePut(fileKey, fileBuffer, "image/jpeg");

      // حفظ العملية
      await db.insert(telegramOperations).values({
        chatId: chatId.toString(),
        userId: userId.toString(),
        operationType: "add_image",
        status: "completed",
        data: JSON.stringify({
          fileName,
          url,
          fileKey,
        }),
      });

      await this.sendMessage(
        chatId,
        "✅ تم رفع الصورة بنجاح!\n\n" +
          `الرابط:\n<code>${url}</code>`
      );
    } catch (error) {
      console.error("Image upload error:", error);
      await this.sendMessage(
        chatId,
        "❌ حدث خطأ في رفع الصورة. حاول مرة أخرى."
      );

      // حفظ الخطأ
      await db.insert(telegramOperations).values({
        chatId: chatId.toString(),
        userId: userId.toString(),
        operationType: "add_image",
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

/**
 * تهيئة Telegram Bot
 */
export async function initializeTelegramBot(
  botToken: string,
  authorizedChatIds: number[]
): Promise<TelegramBotHandler> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database connection failed");
  }

  try {
    // التحقق من وجود البوت في قاعدة البيانات
    const existingBots = await db
      .select()
      .from(telegramBot)
      .where(eq(telegramBot.botToken, botToken))
      .limit(1);

    if (existingBots.length === 0) {
      // إضافة البوت الجديد
      await db.insert(telegramBot).values({
        botToken,
        authorizedChatIds: JSON.stringify(authorizedChatIds),
        isActive: true,
      });
    } else {
      // تحديث البوت الموجود
      await db
        .update(telegramBot)
        .set({
          authorizedChatIds: JSON.stringify(authorizedChatIds),
          isActive: true,
        })
        .where(eq(telegramBot.botToken, botToken));
    }

    console.log("✅ Telegram Bot initialized successfully");
    return new TelegramBotHandler(botToken, authorizedChatIds);
  } catch (error) {
    console.error("Failed to initialize Telegram Bot:", error);
    throw error;
  }
}
