import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("Series Image Management", () => {
  it("يجب رفض تحديث الصورة من مستخدم عادي", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.series.updatePoster({
        seriesId: 1,
        posterUrl: "https://example.com/new.jpg",
      });

      // لا يجب أن نصل هنا
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
      expect(error.message).toContain("صلاحيات");
    }
  });

  it("يجب رفض حذف الصورة من مستخدم عادي", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.series.deleteImage({
        seriesId: 1,
      });

      // لا يجب أن نصل هنا
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
      expect(error.message).toContain("صلاحيات");
    }
  });

  it("يجب رفض رابط صورة غير صحيح من مسؤول", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.series.updatePoster({
        seriesId: 1,
        posterUrl: "not-a-valid-url",
      });

      // لا يجب أن نصل هنا
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.code).toBe("BAD_REQUEST");
    }
  });

  it("يجب أن يقبل المسؤول طلب تحديث الصورة بدون رفع", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      // هذا سيفشل لأن المسلسل غير موجود، لكن سيمر اختبار الصلاحيات
      await caller.series.updatePoster({
        seriesId: 999999,
        posterUrl: "https://example.com/new.jpg",
      });
    } catch (error: any) {
      // يجب أن يكون الخطأ من قاعدة البيانات وليس من الصلاحيات
      expect(error.code).not.toBe("FORBIDDEN");
    }
  });

  it("يجب أن يقبل المسؤول طلب حذف الصورة بدون رفع", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      // هذا سيفشل لأن المسلسل غير موجود، لكن سيمر اختبار الصلاحيات
      await caller.series.deleteImage({
        seriesId: 999999,
      });
    } catch (error: any) {
      // يجب أن يكون الخطأ من قاعدة البيانات وليس من الصلاحيات
      expect(error.code).not.toBe("FORBIDDEN");
    }
  });
});
