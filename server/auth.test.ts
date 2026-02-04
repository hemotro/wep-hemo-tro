import { describe, it, expect, beforeAll } from "vitest";
import { registerUser, loginWithEmail, getUserByEmail } from "./db";

describe("Authentication System", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "TestPassword123";
  const testName = "Test User";

  it("should register a new user with email and password", async () => {
    const result = await registerUser(testEmail, testPassword, testName);
    expect(result).toBeDefined();
  });

  it("should not allow duplicate email registration", async () => {
    try {
      await registerUser(testEmail, testPassword, testName);
      expect.fail("Should have thrown an error for duplicate email");
    } catch (error: any) {
      expect(error.message).toContain("البريد الإلكتروني مسجل بالفعل");
    }
  });

  it("should login with correct email and password", async () => {
    const user = await loginWithEmail(testEmail, testPassword);
    expect(user).toBeDefined();
    expect(user.email).toBe(testEmail);
    expect(user.name).toBe(testName);
    expect(user.loginMethod).toBe("email");
  });

  it("should fail login with incorrect password", async () => {
    try {
      await loginWithEmail(testEmail, "WrongPassword");
      expect.fail("Should have thrown an error for incorrect password");
    } catch (error: any) {
      expect(error.message).toContain("البريد الإلكتروني أو كلمة السر غير صحيحة");
    }
  });

  it("should fail login with non-existent email", async () => {
    try {
      await loginWithEmail("nonexistent@example.com", testPassword);
      expect.fail("Should have thrown an error for non-existent email");
    } catch (error: any) {
      expect(error.message).toContain("البريد الإلكتروني أو كلمة السر غير صحيحة");
    }
  });

  it("should retrieve user by email", async () => {
    const user = await getUserByEmail(testEmail);
    expect(user).toBeDefined();
    expect(user?.email).toBe(testEmail);
    expect(user?.name).toBe(testName);
  });

  it("should not retrieve non-existent user by email", async () => {
    const user = await getUserByEmail("nonexistent@example.com");
    expect(user).toBeUndefined();
  });
});
