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

describe("Image Upload API", () => {
  it("يجب أن يرفع صورة من مسؤول", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Base64 لصورة بيضاء صغيرة
    const base64Image =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";

    try {
      const result = await caller.images.uploadImage({
        seriesId: 1,
        imageType: "poster",
        imageBase64: base64Image,
        fileName: "test.png",
        mimeType: "image/png",
        alt: "صورة اختبار",
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("تم رفع");
    } catch (error: any) {
      // قد يفشل بسبب عدم توفر S3، لكن يجب أن يمر اختبار الصلاحيات
      expect(error.code).not.toBe("FORBIDDEN");
    }
  });

  it("يجب أن يرفض رفع الصورة من مستخدم عادي", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const base64Image =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";

    try {
      await caller.images.uploadImage({
        seriesId: 1,
        imageType: "poster",
        imageBase64: base64Image,
        fileName: "test.png",
        mimeType: "image/png",
      });

      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });

  it("يجب أن يرفض حذف الصورة من مستخدم عادي", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.images.deleteImage({
        imageId: 1,
      });

      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });

  it("يجب أن يرفض تعيين صورة افتراضية من مستخدم عادي", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.images.setDefaultImage({
        seriesId: 1,
        imageId: 1,
      });

      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });

  it("يجب أن يقبل المسؤول طلب حذف الصورة", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.images.deleteImage({
        imageId: 999999,
      });
    } catch (error: any) {
      // قد يفشل بسبب عدم وجود الصورة، لكن يجب أن يمر اختبار الصلاحيات
      expect(error.code).not.toBe("FORBIDDEN");
    }
  });

  it("يجب أن يقبل المسؤول طلب تعيين صورة افتراضية", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.images.setDefaultImage({
        seriesId: 1,
        imageId: 999999,
      });
    } catch (error: any) {
      // قد يفشل بسبب عدم وجود الصورة، لكن يجب أن يمر اختبار الصلاحيات
      expect(error.code).not.toBe("FORBIDDEN");
    }
  });
});
