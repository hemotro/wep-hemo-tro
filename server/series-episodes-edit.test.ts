import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "./db";
import { series as seriesTable, episodes as episodesTable } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Series and Episodes Management", () => {
  let testSeriesId: number;
  let testEpisodeId: number;

  beforeAll(async () => {
    // إنشاء مسلسل اختباري
    const result = await db
      .insert(seriesTable)
      .values({
        title: "Test Series",
        titleAr: "مسلسل اختبار",
        description: "Test Description",
        descriptionAr: "وصف اختبار",
        genre: "Drama",
        totalSeasons: 1,
        totalEpisodes: 1,
        posterUrl: "https://example.com/poster.jpg",
        bannerUrl: "https://example.com/banner.jpg",
        logoUrl: "https://example.com/logo.jpg",
      })
      .returning();

    testSeriesId = result[0].id;
  });

  afterAll(async () => {
    // حذف البيانات الاختبارية
    if (testSeriesId) {
      await db.delete(seriesTable).where(eq(seriesTable.id, testSeriesId));
    }
  });

  describe("Series Poster URL", () => {
    it("should save poster URL when creating a series", async () => {
      const result = await db
        .select()
        .from(seriesTable)
        .where(eq(seriesTable.id, testSeriesId));

      expect(result[0].posterUrl).toBe("https://example.com/poster.jpg");
    });

    it("should update poster URL", async () => {
      await db
        .update(seriesTable)
        .set({ posterUrl: "https://example.com/new-poster.jpg" })
        .where(eq(seriesTable.id, testSeriesId));

      const result = await db
        .select()
        .from(seriesTable)
        .where(eq(seriesTable.id, testSeriesId));

      expect(result[0].posterUrl).toBe("https://example.com/new-poster.jpg");
    });
  });

  describe("Series Banner and Logo URLs", () => {
    it("should save banner URL when creating a series", async () => {
      const result = await db
        .select()
        .from(seriesTable)
        .where(eq(seriesTable.id, testSeriesId));

      expect(result[0].bannerUrl).toBe("https://example.com/banner.jpg");
    });

    it("should save logo URL when creating a series", async () => {
      const result = await db
        .select()
        .from(seriesTable)
        .where(eq(seriesTable.id, testSeriesId));

      expect(result[0].logoUrl).toBe("https://example.com/logo.jpg");
    });

    it("should update banner and logo URLs", async () => {
      await db
        .update(seriesTable)
        .set({
          bannerUrl: "https://example.com/new-banner.jpg",
          logoUrl: "https://example.com/new-logo.jpg",
        })
        .where(eq(seriesTable.id, testSeriesId));

      const result = await db
        .select()
        .from(seriesTable)
        .where(eq(seriesTable.id, testSeriesId));

      expect(result[0].bannerUrl).toBe("https://example.com/new-banner.jpg");
      expect(result[0].logoUrl).toBe("https://example.com/new-logo.jpg");
    });
  });

  describe("Episodes Management", () => {
    it("should create an episode with season and episode number", async () => {
      const result = await db
        .insert(episodesTable)
        .values({
          seriesId: testSeriesId,
          season: 1,
          episodeNumber: 1,
          title: "Test Episode",
          titleAr: "حلقة اختبار",
          videoUrl: "https://example.com/video.mp4",
          videoType: "mp4",
        })
        .returning();

      testEpisodeId = result[0].id;

      expect(result[0].season).toBe(1);
      expect(result[0].episodeNumber).toBe(1);
      expect(result[0].titleAr).toBe("حلقة اختبار");
    });

    it("should update episode title", async () => {
      if (testEpisodeId) {
        await db
          .update(episodesTable)
          .set({ titleAr: "حلقة اختبار محدثة" })
          .where(eq(episodesTable.id, testEpisodeId));

        const result = await db
          .select()
          .from(episodesTable)
          .where(eq(episodesTable.id, testEpisodeId));

        expect(result[0].titleAr).toBe("حلقة اختبار محدثة");
      }
    });

    it("should delete episode", async () => {
      if (testEpisodeId) {
        await db
          .delete(episodesTable)
          .where(eq(episodesTable.id, testEpisodeId));

        const result = await db
          .select()
          .from(episodesTable)
          .where(eq(episodesTable.id, testEpisodeId));

        expect(result.length).toBe(0);
      }
    });
  });

  describe("Series Edit Functionality", () => {
    it("should update series with all fields", async () => {
      await db
        .update(seriesTable)
        .set({
          titleAr: "مسلسل محدث",
          descriptionAr: "وصف محدث",
          genre: "Comedy",
          posterUrl: "https://example.com/updated-poster.jpg",
          bannerUrl: "https://example.com/updated-banner.jpg",
          logoUrl: "https://example.com/updated-logo.jpg",
        })
        .where(eq(seriesTable.id, testSeriesId));

      const result = await db
        .select()
        .from(seriesTable)
        .where(eq(seriesTable.id, testSeriesId));

      expect(result[0].titleAr).toBe("مسلسل محدث");
      expect(result[0].descriptionAr).toBe("وصف محدث");
      expect(result[0].genre).toBe("Comedy");
      expect(result[0].posterUrl).toBe("https://example.com/updated-poster.jpg");
      expect(result[0].bannerUrl).toBe("https://example.com/updated-banner.jpg");
      expect(result[0].logoUrl).toBe("https://example.com/updated-logo.jpg");
    });

    it("should update series with partial fields", async () => {
      await db
        .update(seriesTable)
        .set({
          titleAr: "مسلسل محدث جزئياً",
        })
        .where(eq(seriesTable.id, testSeriesId));

      const result = await db
        .select()
        .from(seriesTable)
        .where(eq(seriesTable.id, testSeriesId));

      expect(result[0].titleAr).toBe("مسلسل محدث جزئياً");
      // يجب أن تبقى الحقول الأخرى كما هي
      expect(result[0].genre).toBe("Comedy");
    });
  });
});
