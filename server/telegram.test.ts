import { describe, it, expect, beforeAll } from "vitest";
import axios from "axios";

const TELEGRAM_API_URL = "https://api.telegram.org";
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

describe("Telegram Bot Integration", () => {
  it("should validate bot token by getting bot info", async () => {
    if (!botToken) {
      throw new Error("TELEGRAM_BOT_TOKEN is not set");
    }

    try {
      const response = await axios.get(
        `${TELEGRAM_API_URL}/bot${botToken}/getMe`
      );

      expect(response.status).toBe(200);
      expect(response.data.ok).toBe(true);
      expect(response.data.result).toBeDefined();
      expect(response.data.result.is_bot).toBe(true);
      
      console.log("✅ Bot info:", {
        username: response.data.result.username,
        first_name: response.data.result.first_name,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to validate bot token: ${error.response?.data?.description || error.message}`
        );
      }
      throw error;
    }
  });

  it("should validate chat ID by sending a test message", async () => {
    if (!botToken || !chatId) {
      throw new Error("TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set");
    }

    try {
      const response = await axios.post(
        `${TELEGRAM_API_URL}/bot${botToken}/sendMessage`,
        {
          chat_id: chatId,
          text: "🧪 اختبار الاتصال - Test Connection",
          parse_mode: "HTML",
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.ok).toBe(true);
      expect(response.data.result).toBeDefined();
      expect(response.data.result.message_id).toBeDefined();

      console.log("✅ Test message sent successfully");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to send test message: ${error.response?.data?.description || error.message}`
        );
      }
      throw error;
    }
  });

  it("should have valid environment variables", () => {
    expect(botToken).toBeDefined();
    expect(botToken).toMatch(/^\d+:[\w-]+$/); // Format: 123456:ABC-DEF...
    
    expect(chatId).toBeDefined();
    const chatIdNum = parseInt(chatId!);
    expect(Math.abs(chatIdNum)).toBeGreaterThan(0); // Chat ID can be negative for groups

    console.log("✅ Environment variables are valid");
  });
});
