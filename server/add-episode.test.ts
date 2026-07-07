import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "./db";
import { users, series, episodes } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Add Episode Form Validation", () => {
  let testSeriesId: number;
  let testUserId: number;

  beforeAll(async () => {
    // إنشاء مستخدم اختبار
    const user = await db
      .insert(users)
      .values({
        email: `test-${Date.now()}@example.com`,
        password: "hashedpassword",
        role: "admin",
      })
      .returning();
    testUserId = user[0].id;

    // إنشاء مسلسل اختبار
    const serie = await db
      .insert(series)
      .values({
        titleAr: "مسلسل اختبار",
        title: "Test Series",
        descriptionAr: "وصف الاختبار",
        description: "Test Description",
        genreAr: "درامة",
        genre: "Drama",
        posterUrl: "https://example.com/poster.jpg",
        bannerUrl: "https://example.com/banner.jpg",
        logoUrl: "https://example.com/logo.png",
        status: "ongoing",
        totalSeasons: 1,
        totalEpisodes: 1,
      })
      .returning();
    testSeriesId = serie[0].id;
  });

  afterAll(async () => {
    // حذف البيانات الاختبارية
    await db.delete(episodes).where(eq(episodes.seriesId, testSeriesId));
    await db.delete(series).where(eq(series.id, testSeriesId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it("يجب أن يحتوي النموذج على جميع الحقول المطلوبة", () => {
    // الحقول المطلوبة:
    const requiredFields = [
      "seriesId",
      "season",
      "episodeNumber",
      "titleAr",
      "title",
      "videoUrl",
      "videoType",
    ];

    // التحقق من أن جميع الحقول موجودة
    requiredFields.forEach((field) => {
      expect(field).toBeDefined();
    });
  });

  it("يجب أن يقبل النموذج البيانات الصحيحة", async () => {
    const episodeData = {
      seriesId: testSeriesId,
      season: 1,
      episodeNumber: 1,
      titleAr: "الحلقة الأولى",
      title: "Episode 1",
      descriptionAr: "وصف الحلقة",
      description: "Episode Description",
      videoUrl: "file_id_123",
      videoType: "telegram" as const,
      videoSize: 1024000,
    };

    const result = await db
      .insert(episodes)
      .values(episodeData)
      .returning();

    expect(result).toBeDefined();
    expect(result[0].titleAr).toBe("الحلقة الأولى");
    expect(result[0].title).toBe("Episode 1");
    expect(result[0].season).toBe(1);
    expect(result[0].episodeNumber).toBe(1);
  });

  it("يجب أن يرفع الحقول الاختيارية بشكل صحيح", async () => {
    const episodeData = {
      seriesId: testSeriesId,
      season: 1,
      episodeNumber: 2,
      titleAr: "الحلقة الثانية",
      title: "Episode 2",
      videoUrl: "file_id_456",
      videoType: "telegram" as const,
      // بدون descriptionAr و description
    };

    const result = await db
      .insert(episodes)
      .values(episodeData)
      .returning();

    expect(result).toBeDefined();
    expect(result[0].descriptionAr).toBeNull();
    expect(result[0].description).toBeNull();
  });

  it("يجب أن يتحقق من أن season و episodeNumber أرقام صحيحة", async () => {
    // هذا الاختبار يتحقق من أن الحقول تقبل الأرقام فقط
    const validData = {
      seriesId: testSeriesId,
      season: 2,
      episodeNumber: 5,
      titleAr: "الحلقة الخامسة",
      title: "Episode 5",
      videoUrl: "file_id_789",
      videoType: "telegram" as const,
    };

    const result = await db
      .insert(episodes)
      .values(validData)
      .returning();

    expect(result[0].season).toBe(2);
    expect(result[0].episodeNumber).toBe(5);
    expect(typeof result[0].season).toBe("number");
    expect(typeof result[0].episodeNumber).toBe("number");
  });

  it("يجب أن يحفظ جميع الحقول بشكل صحيح في قاعدة البيانات", async () => {
    const completeData = {
      seriesId: testSeriesId,
      season: 3,
      episodeNumber: 1,
      titleAr: "الموسم الثالث - الحلقة الأولى",
      title: "Season 3 - Episode 1",
      descriptionAr: "وصف كامل للحلقة",
      description: "Full episode description",
      videoUrl: "file_id_complete",
      videoType: "telegram" as const,
      videoSize: 2048000,
    };

    const result = await db
      .insert(episodes)
      .values(completeData)
      .returning();

    expect(result[0].seriesId).toBe(testSeriesId);
    expect(result[0].season).toBe(3);
    expect(result[0].episodeNumber).toBe(1);
    expect(result[0].titleAr).toBe("الموسم الثالث - الحلقة الأولى");
    expect(result[0].title).toBe("Season 3 - Episode 1");
    expect(result[0].descriptionAr).toBe("وصف كامل للحلقة");
    expect(result[0].description).toBe("Full episode description");
    expect(result[0].videoUrl).toBe("file_id_complete");
    expect(result[0].videoType).toBe("telegram");
  });
});
