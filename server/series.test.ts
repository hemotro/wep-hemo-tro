import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(user?: AuthenticatedUser): TrpcContext {
  const mockUser: AuthenticatedUser = user || {
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
    user: mockUser,
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

describe("Series Router - المسلسلات", () => {
  describe("series.list", () => {
    it("should return array of series", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.series.list();
      
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("id");
        expect(result[0]).toHaveProperty("titleAr");
        expect(result[0]).toHaveProperty("genre");
      }
    });
  });

  describe("series.getById", () => {
    it("should return series by id", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      // أولاً نحصل على قائمة المسلسلات
      const allSeries = await caller.series.list();
      
      if (allSeries.length > 0) {
        const firstSeriesId = allSeries[0].id;
        const result = await caller.series.getById({ id: firstSeriesId });
        
        expect(result).toBeDefined();
        expect(result?.id).toBe(firstSeriesId);
        expect(result?.titleAr).toBeDefined();
      }
    });

    it("should return null for non-existent series", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.series.getById({ id: 99999 });
      
      expect(result).toBeNull();
    });
  });

  describe("series.getEpisodes", () => {
    it("should return episodes for series", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      const allSeries = await caller.series.list();
      if (allSeries.length > 0) {
        const firstSeriesId = allSeries[0].id;
        const result = await caller.series.getEpisodes({ seriesId: firstSeriesId });
        
        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
          expect(result[0]).toHaveProperty("videoUrl");
          expect(result[0]).toHaveProperty("episodeNumber");
        }
      }
    });

    it("should return empty array for non-existent series", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.series.getEpisodes({ seriesId: 99999 });
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("series.getEpisode", () => {
    it("should return episode by id", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      
      const allSeries = await caller.series.list();
      if (allSeries.length > 0) {
        const firstSeriesId = allSeries[0].id;
        const episodes = await caller.series.getEpisodes({ seriesId: firstSeriesId });
        
        if (episodes.length > 0) {
          const firstEpisodeId = episodes[0].id;
          const result = await caller.series.getEpisode({ id: firstEpisodeId });
          
          expect(result).toBeDefined();
          expect(result?.id).toBe(firstEpisodeId);
        }
      }
    });

    it("should return undefined for non-existent episode", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.series.getEpisode({ id: 99999 });
      
      expect(result).toBeNull();
    });
  });
});
