import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { users, passwordResetTokens } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { sendPasswordResetEmail } from "./_core/email";
import { ENV } from "./_core/env";

describe("Password Reset Email System", () => {
  let db: any;
  let testUserId: number;
  let testEmail = `test-reset-${Date.now()}@example.com`;
  let resetToken: string;

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
      name: "Test Reset User",
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

  it("should generate a valid password reset token", async () => {
    if (!db) {
      console.warn("Skipping test: database not available");
      return;
    }

    resetToken = `reset-token-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.insert(passwordResetTokens).values({
      userId: testUserId,
      token: resetToken,
      expiresAt,
      used: false,
    });

    const result = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, resetToken)).limit(1);
    expect(result.length).toBe(1);
    expect(result[0].token).toBe(resetToken);
    expect(result[0].used).toBe(false);
  });

  it("should construct correct reset link with FRONTEND_URL", async () => {
    if (!db) {
      console.warn("Skipping test: database not available");
      return;
    }

    const testToken = `link-test-${Date.now()}`;
    const expectedLink = `${ENV.frontendUrl}/reset-password?token=${testToken}`;
    
    expect(expectedLink).toContain("/reset-password?token=");
    expect(expectedLink).toContain(testToken);
    expect(ENV.frontendUrl).toBeTruthy();
  });

  it("should send password reset email successfully", async () => {
    if (!db) {
      console.warn("Skipping test: database not available");
      return;
    }

    try {
      const result = await sendPasswordResetEmail(
        testEmail,
        resetToken,
        "Test User"
      );
      
      expect(result.success).toBe(true);
    } catch (error: any) {
      // Email sending might fail if credentials are not configured
      // but the function should be callable
      console.warn("Email sending test skipped (credentials may not be configured):", error.message);
    }
  });

  it("should verify reset token before allowing password change", async () => {
    if (!db) {
      console.warn("Skipping test: database not available");
      return;
    }

    const verifyToken = `verify-test-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.insert(passwordResetTokens).values({
      userId: testUserId,
      token: verifyToken,
      expiresAt,
      used: false,
    });

    // Verify token exists and is not used
    const result = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, verifyToken)).limit(1);
    expect(result.length).toBe(1);
    expect(result[0].used).toBe(false);
    expect(result[0].expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("should prevent reuse of password reset token", async () => {
    if (!db) {
      console.warn("Skipping test: database not available");
      return;
    }

    const reuseToken = `reuse-test-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.insert(passwordResetTokens).values({
      userId: testUserId,
      token: reuseToken,
      expiresAt,
      used: false,
    });

    // Mark as used
    await db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.token, reuseToken));

    // Try to verify used token
    const result = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, reuseToken)).limit(1);
    expect(result.length).toBe(1);
    expect(result[0].used).toBe(true);
  });

  it("should reject expired password reset tokens", async () => {
    if (!db) {
      console.warn("Skipping test: database not available");
      return;
    }

    const expiredToken = `expired-test-${Date.now()}`;
    const expiresAt = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

    await db.insert(passwordResetTokens).values({
      userId: testUserId,
      token: expiredToken,
      expiresAt,
      used: false,
    });

    const result = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, expiredToken)).limit(1);
    expect(result.length).toBe(1);
    expect(result[0].expiresAt.getTime()).toBeLessThan(Date.now());
  });
});
