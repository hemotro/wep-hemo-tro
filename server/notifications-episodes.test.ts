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

describe("Episodes with Direct Video Links - الحلقات برابط مباشر", () => {
  describe("episodes.create", () => {
    it("should create episode with MP4 video URL", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // أولاً إنشاء مسلسل
      const seriesResult = await caller.series.create({
        titleAr: "مسلسل اختبار الفيديوهات",
        genre: "درامي",
      });

      expect(seriesResult.success).toBe(true);

      // ثم إنشاء حلقة برابط MP4
      const episodeResult = await caller.episodes.create({
        seriesId: 1,
        season: 1,
        episodeNumber: 1,
        titleAr: "الحلقة الأولى",
        videoUrl: "https://example.com/videos/episode1.mp4",
      });

      expect(episodeResult.success).toBe(true);
    });

    it("should create episode with M3U8 stream URL", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // إنشاء حلقة برابط M3U8
      const episodeResult = await caller.episodes.create({
        seriesId: 1,
        season: 1,
        episodeNumber: 2,
        titleAr: "الحلقة الثانية",
        videoUrl: "https://example.com/streams/episode2.m3u8",
      });

      expect(episodeResult.success).toBe(true);
    });

    it("should create episode with YouTube URL", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // إنشاء حلقة برابط YouTube
      const episodeResult = await caller.episodes.create({
        seriesId: 1,
        season: 1,
        episodeNumber: 3,
        titleAr: "الحلقة الثالثة",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      });

      expect(episodeResult.success).toBe(true);
    });

    it("should create episode with thumbnail URL", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // إنشاء حلقة مع صورة مصغرة
      const episodeResult = await caller.episodes.create({
        seriesId: 1,
        season: 1,
        episodeNumber: 4,
        titleAr: "حلقة مع صورة مصغرة",
        videoUrl: "https://example.com/videos/episode-with-thumb.mp4",
        thumbnailUrl: "https://example.com/thumbnails/episode-thumb.jpg",
      });

      expect(episodeResult.success).toBe(true);
    });

    it("should require valid video URL", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.episodes.create({
          seriesId: 1,
          season: 1,
          episodeNumber: 5,
          titleAr: "حلقة برابط غير صحيح",
          videoUrl: "not-a-valid-url",
        });
        expect.fail("Should have thrown an error for invalid URL");
      } catch (error: any) {
        expect(error.message).toContain("رابط");
      }
    });
  });

  describe("episodes.getEpisodes", () => {
    it("should retrieve all episodes for a series", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const episodes = await caller.series.getEpisodes({
        seriesId: 1,
      });

      expect(Array.isArray(episodes)).toBe(true);
    });
  });

  describe("episodes.getEpisode", () => {
    it("should retrieve a specific episode", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // أولاً إنشاء حلقة
      const createResult = await caller.episodes.create({
        seriesId: 1,
        season: 1,
        episodeNumber: 10,
        titleAr: "حلقة للاسترجاع",
        videoUrl: "https://example.com/videos/test-episode.mp4",
      });

      expect(createResult.success).toBe(true);
    });
  });
});
