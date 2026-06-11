import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "email",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Admin Secret Code Protection", () => {
  const ctx = createAuthContext();
  const caller = appRouter.createCaller(ctx);

  describe("Secret Code Verification", () => {
    it("should verify correct admin code", async () => {
      const result = await caller.auth.verifyAdminCode({ code: "hemohemo@12" });
      expect(result).toEqual({
        success: true,
        message: "تم التحقق من الرمز بنجاح",
      });
    });

    it("should reject incorrect admin code", async () => {
      try {
        await caller.auth.verifyAdminCode({ code: "wrongcode" });
        expect.fail("Should have thrown an error for incorrect code");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
        expect(error.message).toContain("غير صحيح");
      }
    });

    it("should reject empty admin code", async () => {
      try {
        await caller.auth.verifyAdminCode({ code: "" });
        expect.fail("Should have thrown an error for empty code");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("should be case-sensitive", async () => {
      try {
        await caller.auth.verifyAdminCode({ code: "HEMOHEMO@12" });
        expect.fail("Should have thrown an error for wrong case");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("should handle special characters in code", async () => {
      try {
        await caller.auth.verifyAdminCode({ code: "hemohemo@12 " });
        expect.fail("Should have thrown an error for code with extra space");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("should work for authenticated users", async () => {
      const result = await caller.auth.verifyAdminCode({ code: "hemohemo@12" });
      expect(result.success).toBe(true);
    });
  });

  describe("Admin Panel Access Control", () => {
    it("should allow series list access for authenticated users", async () => {
      const result = await caller.series.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should allow categories list access for authenticated users", async () => {
      const result = await caller.categories.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should allow slider list access for authenticated users", async () => {
      const result = await caller.slider.list();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Admin Operations with Verified Code", () => {
    it("should verify code before allowing admin operations", async () => {
      // أولاً، تحقق من الكود
      const verifyResult = await caller.auth.verifyAdminCode({ code: "hemohemo@12" });
      expect(verifyResult.success).toBe(true);

      // ثم يمكن تنفيذ العمليات الإدارية
      const seriesList = await caller.series.list();
      expect(Array.isArray(seriesList)).toBe(true);
    });
  });
});
