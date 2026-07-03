import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TelegramBotHandler, initializeTelegramBot } from "./telegram-bot";
import { getDb } from "./db";
import { telegramBot } from "../drizzle/schema";
import { eq } from "drizzle-orm";

let botHandler: TelegramBotHandler | null = null;

// تهيئة البوت عند بدء التطبيق
export async function initTelegramRouter() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatIdStr = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatIdStr) {
    console.warn("⚠️ Telegram Bot Token or Chat ID not configured");
    return;
  }

  try {
    const chatId = parseInt(chatIdStr, 10);
    botHandler = await initializeTelegramBot(botToken, [chatId]);
    console.log("✅ Telegram Bot initialized");
  } catch (error) {
    console.error("❌ Failed to initialize Telegram Bot:", error);
  }
}

export const telegramRouter = router({
  /**
   * استقبال webhook من Telegram
   */
  webhook: publicProcedure
    .input(z.object({
      update_id: z.number(),
      message: z.object({
        message_id: z.number(),
        chat: z.object({
          id: z.number(),
          type: z.string(),
        }),
        from: z.object({
          id: z.number(),
          is_bot: z.boolean(),
          first_name: z.string(),
          username: z.string().optional(),
        }),
        text: z.string().optional(),
        document: z.object({
          file_id: z.string(),
          file_unique_id: z.string(),
          file_size: z.number(),
          mime_type: z.string(),
          file_name: z.string(),
        }).optional(),
        photo: z.array(z.object({
          file_id: z.string(),
          file_unique_id: z.string(),
          file_size: z.number(),
          width: z.number(),
          height: z.number(),
        })).optional(),
      }).optional(),
    }).passthrough())
    .mutation(async ({ input }) => {
      if (!botHandler) {
        return { success: false, error: "Bot not initialized" };
      }

      try {
        await botHandler.handleUpdate(input as any);
        return { success: true };
      } catch (error) {
        console.error("Webhook error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
      }
    }),

  /**
   * إرسال رسالة اختبار
   */
  sendTestMessage: publicProcedure
    .input(z.object({
      message: z.string(),
    }))
    .mutation(async ({ input }) => {
      if (!botHandler) {
        return { success: false, error: "Bot not initialized" };
      }

      try {
        const db = await getDb();
        if (!db) {
          return { success: false, error: "Database not available" };
        }

        // الحصول على معرفات الدردشات المصرح بها
        const bots = await db.select().from(telegramBot).limit(1);
        
        if (bots.length === 0) {
          return { success: false, error: "No bot configured" };
        }

        const authorizedChatIds = JSON.parse(bots[0].authorizedChatIds || "[]");
        
        for (const chatId of authorizedChatIds) {
          await botHandler.sendMessage(chatId, input.message);
        }

        return { success: true };
      } catch (error) {
        console.error("Send message error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
      }
    }),

  /**
   * الحصول على معلومات البوت
   */
  getBotInfo: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) {
        return { configured: false };
      }

      const bots = await db.select().from(telegramBot).limit(1);
      
      if (bots.length === 0) {
        return { configured: false };
      }

      const bot = bots[0];
      return {
        configured: true,
        isActive: bot.isActive,
        botUsername: bot.botUsername,
        authorizedChatIds: JSON.parse(bot.authorizedChatIds || "[]"),
      };
    } catch (error) {
      console.error("Get bot info error:", error);
      return { configured: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }),
});
