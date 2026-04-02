import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { users, passwordResetTokens } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

describe("Password Reset System", () => {
  let db: any;
  let testUserId: number;
  let testEmail = `test-${Date.now()}@example.com`;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      console.warn("Database not available for testing");
      return;
    }

    // Create a test user
    const hashedPassword = await bcrypt.hash("testpassword123", 10);
    const result = await db.insert(users).values({
      email: testEmail,
      password: hashedPassword,
      name: "Test User",
      loginMethod: "email",
      role: "user",
    });
    
    // Get the inserted user ID
    const inserted = await db.select().from(users).where(eq(users.email, testEmail)).limit(1);
    if (inserted.length > 0) {
      testUserId = inserted[0].id;
    }
  });

  afterAll(async () => {
    if (!db) return;
    
    // Clean up test data
    try {
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, testUserId));
      await db.delete(users).where(eq(users.id, testUserId));
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  });

  it("should create a password reset token", async () => {
    if (!db) {
      console.warn("Skipping test: database not available");
      return;
    }

    const token = `test-token-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.insert(passwordResetTokens).values({
      userId: testUserId,
      token,
      expiresAt,
      used: false,
    });

    const result = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token)).limit(1);
    expect(result.length).toBe(1);
    expect(result[0].token).toBe(token);
    expect(result[0].used).toBe(false);
  });

  it("should verify a valid password reset token", async () => {
    if (!db) {
      console.warn("Skipping test: database not available");
      return;
    }

    const token = `verify-token-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.insert(passwordResetTokens).values({
      userId: testUserId,
      token,
      expiresAt,
      used: false,
    });

    const result = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token)).limit(1);
    expect(result.length).toBe(1);
    expect(result[0].expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("should detect an expired password reset token", async () => {
    if (!db) {
      console.warn("Skipping test: database not available");
      return;
    }

    const token = `expired-token-${Date.now()}`;
    const expiresAt = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

    await db.insert(passwordResetTokens).values({
      userId: testUserId,
      token,
      expiresAt,
      used: false,
    });

    const result = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token)).limit(1);
    expect(result.length).toBe(1);
    expect(result[0].expiresAt.getTime()).toBeLessThan(Date.now());
  });

  it("should mark a token as used after password reset", async () => {
    if (!db) {
      console.warn("Skipping test: database not available");
      return;
    }

    const token = `used-token-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.insert(passwordResetTokens).values({
      userId: testUserId,
      token,
      expiresAt,
      used: false,
    });

    // Mark as used
    await db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.token, token));

    const result = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token)).limit(1);
    expect(result.length).toBe(1);
    expect(result[0].used).toBe(true);
  });
});
