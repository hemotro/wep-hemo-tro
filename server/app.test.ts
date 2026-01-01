import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(user?: AuthenticatedUser): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("hemo tro app - Basic Tests", () => {
  describe("auth.me", () => {
    it("should return undefined when user is not authenticated", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.me();
      expect(result).toBeUndefined();
    });

    it("should return user data when authenticated", async () => {
      const user: AuthenticatedUser = {
        id: 1,
        openId: "test-user-123",
        email: "test@example.com",
        name: "Test User",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const ctx = createMockContext(user);
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.me();

      expect(result).toEqual(user);
      expect(result?.name).toBe("Test User");
      expect(result?.email).toBe("test@example.com");
    });
  });

  describe("app structure", () => {
    it("should have router with procedures", () => {
      expect(appRouter._def.procedures).toBeDefined();
      expect(typeof appRouter._def.procedures).toBe("object");
    });

    it("should be callable with createCaller", () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      expect(caller).toBeDefined();
    });

    it("should have auth procedures available", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      expect(caller.auth).toBeDefined();
      expect(caller.auth.me).toBeDefined();
      expect(caller.auth.logout).toBeDefined();
    });
  });
});
