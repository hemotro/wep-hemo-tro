import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const adminUser: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "email",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user: adminUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      setHeader: () => {},
    } as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const regularUser: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "email",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user: regularUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      setHeader: () => {},
    } as TrpcContext["res"],
  };
}

describe("Admin Operations - العمليات الإدارية", () => {
  describe("series.create", () => {
    it("should allow admin to create series", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.series.create({
        titleAr: "مسلسل اختبار",
        genre: "درما",
      });

      expect(result.success).toBe(true);
    });

    it("should deny non-admin from creating series", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.series.create({
          titleAr: "مسلسل اختبار",
          genre: "درما",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("صلاحيات");
      }
    });
  });

  describe("series.update", () => {
    it("should allow admin to update series", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // أولاً إنشاء مسلسل
      const createResult = await caller.series.create({
        titleAr: "مسلسل للتحديث",
        genre: "رعب",
      });

      // ثم الحصول على المسلسلات
      const seriesList = await caller.series.list();
      if (seriesList.length > 0) {
        const seriesId = seriesList[0].id;
        const updateResult = await caller.series.update({
          id: seriesId,
          genre: "درما - رعب",
        });

        expect(updateResult.success).toBe(true);
      }
    });

    it("should deny non-admin from updating series", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.series.update({
          id: 1,
          genre: "درما",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("صلاحيات");
      }
    });
  });

  describe("series.delete", () => {
    it("should deny non-admin from deleting series", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.series.delete({ id: 1 });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("صلاحيات");
      }
    });
  });

  describe("episodes.create", () => {
    it("should allow admin to create episode", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const seriesList = await caller.series.list();
      if (seriesList.length > 0) {
        const result = await caller.episodes.create({
          seriesId: seriesList[0].id,
          episodeNumber: 1,
          titleAr: "حلقة اختبار",
          videoUrl: "https://youtu.be/test123",
        });

        expect(result.success).toBe(true);
      }
    });

    it("should deny non-admin from creating episode", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.episodes.create({
          seriesId: 1,
          episodeNumber: 1,
          titleAr: "حلقة اختبار",
          videoUrl: "https://youtu.be/test123",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("صلاحيات");
      }
    });
  });

  describe("episodes.delete", () => {
    it("should deny non-admin from deleting episode", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.episodes.delete({ id: 1 });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("صلاحيات");
      }
    });
  });
});
