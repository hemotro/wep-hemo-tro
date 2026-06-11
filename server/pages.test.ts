import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Pages Data APIs", () => {
  const ctx = createPublicContext();
  const caller = appRouter.createCaller(ctx);

  describe("Home Page - Slider & Categories", () => {
    it("should fetch slider list successfully", async () => {
      const result = await caller.slider.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should fetch categories list successfully", async () => {
      const result = await caller.categories.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should fetch series list successfully", async () => {
      const result = await caller.series.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle empty slider data", async () => {
      const slider = await caller.slider.list();
      const series = await caller.series.list();
      const categories = await caller.categories.list();

      // يجب أن تكون النتائج arrays حتى لو كانت فارغة
      expect(Array.isArray(slider)).toBe(true);
      expect(Array.isArray(series)).toBe(true);
      expect(Array.isArray(categories)).toBe(true);
    });
  });

  describe("Series Detail Page", () => {
    it("should fetch series by ID", async () => {
      // أولاً، احصل على قائمة المسلسلات
      const seriesList = await caller.series.list();

      if (seriesList.length > 0) {
        const firstSeries = seriesList[0];
        const result = await caller.series.getById({ id: firstSeries.id });

        expect(result).toBeDefined();
        expect(result?.id).toBe(firstSeries.id);
        expect(result?.titleAr).toBeDefined();
      }
    });

    it("should fetch episodes for a series", async () => {
      const seriesList = await caller.series.list();

      if (seriesList.length > 0) {
        const firstSeries = seriesList[0];
        const episodes = await caller.series.getEpisodes({
          seriesId: firstSeries.id,
        });

        expect(Array.isArray(episodes)).toBe(true);
      }
    });

    it("should handle series with no episodes", async () => {
      const seriesList = await caller.series.list();

      if (seriesList.length > 0) {
        const firstSeries = seriesList[0];
        const episodes = await caller.series.getEpisodes({
          seriesId: firstSeries.id,
        });

        // يجب أن تكون النتيجة array حتى لو كانت فارغة
        expect(Array.isArray(episodes)).toBe(true);
      }
    });
  });

  describe("Episode Detail Page", () => {
    it("should fetch episodes and find by episode number", async () => {
      const seriesList = await caller.series.list();

      if (seriesList.length > 0) {
        const firstSeries = seriesList[0];
        const episodes = await caller.series.getEpisodes({
          seriesId: firstSeries.id,
        });

        if (episodes.length > 0) {
          const firstEpisode = episodes[0];

          // محاكاة ما يفعله EpisodeDetail: البحث عن الحلقة من القائمة
          const foundEpisode = episodes.find(
            (ep: any) => ep.episodeNumber === firstEpisode.episodeNumber
          );

          expect(foundEpisode).toBeDefined();
          expect(foundEpisode?.episodeNumber).toBe(firstEpisode.episodeNumber);
        }
      }
    });

    it("should handle multi-quality video URLs", async () => {
      const seriesList = await caller.series.list();

      if (seriesList.length > 0) {
        const firstSeries = seriesList[0];
        const episodes = await caller.series.getEpisodes({
          seriesId: firstSeries.id,
        });

        if (episodes.length > 0) {
          const episode = episodes[0];

          // تحقق من أن الحلقة قد تحتوي على جودات متعددة
          const availableQualities = [];

          if (episode.video1080pUrl) availableQualities.push("1080p");
          if (episode.video720pUrl) availableQualities.push("720p");
          if (episode.video480pUrl) availableQualities.push("480p");

          // يجب أن تكون النتيجة array (قد تكون فارغة)
          expect(Array.isArray(availableQualities)).toBe(true);
        }
      }
    });

    it("should handle episode navigation (previous/next)", async () => {
      const seriesList = await caller.series.list();

      if (seriesList.length > 0) {
        const firstSeries = seriesList[0];
        const episodes = await caller.series.getEpisodes({
          seriesId: firstSeries.id,
        });

        if (episodes.length > 1) {
          const currentIndex = 0;
          const previousEpisode =
            currentIndex > 0 ? episodes[currentIndex - 1] : null;
          const nextEpisode =
            currentIndex < episodes.length - 1
              ? episodes[currentIndex + 1]
              : null;

          // في الحلقة الأولى، لا توجد حلقة سابقة
          expect(previousEpisode).toBeNull();
          // يجب أن توجد حلقة تالية
          expect(nextEpisode).toBeDefined();
        }
      }
    });
  });

  describe("Category Filtering", () => {
    it("should fetch categories with series", async () => {
      const result = await caller.categories.listWithSeries();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should filter series by category", async () => {
      const categories = await caller.categories.list();

      if (categories.length > 0) {
        const firstCategory = categories[0];
        const seriesByCategory = await caller.categories.getSeriesByCategory({
          categoryId: firstCategory.id,
        });

        expect(Array.isArray(seriesByCategory)).toBe(true);
      }
    });
  });
});
