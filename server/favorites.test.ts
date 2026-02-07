import { describe, expect, it, beforeAll } from "vitest";
import {
  addFavorite,
  removeFavorite,
  isFavorite,
  getUserFavorites,
  registerUser,
  createSeries,
} from "./db";

describe("Favorites System", () => {
  let testUserId: number;
  let testSeriesId: number;

  beforeAll(async () => {
    // إنشاء مستخدم اختبار
    const userResult = await registerUser(
      `test-fav-${Date.now()}@test.com`,
      "TestPassword123",
      "Test User"
    );
    testUserId = userResult[0].insertId;

    // إنشاء مسلسل اختبار
    const seriesResult = await createSeries({
      titleAr: "مسلسل اختبار المفضلة",
      title: "Test Series Favorites",
      genre: "اختبار",
    });
    testSeriesId = seriesResult[0].insertId;
  });

  describe("Favorites Operations", () => {
    it("should add a series to favorites", async () => {
      const result = await addFavorite(testUserId, testSeriesId);
      expect(result).toBeDefined();
    });

    it("should check if series is in favorites", async () => {
      const result = await isFavorite(testUserId, testSeriesId);
      expect(result).toBe(true);
    });

    it("should get all user favorites", async () => {
      const favorites = await getUserFavorites(testUserId);
      expect(Array.isArray(favorites)).toBe(true);
      expect(favorites.length).toBeGreaterThan(0);
    });

    it("should remove a series from favorites", async () => {
      const result = await removeFavorite(testUserId, testSeriesId);
      expect(result).toEqual({ success: true });
    });

    it("should verify series is removed from favorites", async () => {
      const result = await isFavorite(testUserId, testSeriesId);
      expect(result).toBe(false);
    });
  });
});
