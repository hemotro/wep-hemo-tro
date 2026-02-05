import { describe, it, expect, beforeAll } from "vitest";
import {
  addFavorite,
  removeFavorite,
  isFavorite,
  getUserFavorites,
  addOrUpdateRating,
  getUserRating,
  getAverageRating,
  getSeriesRatings,
  registerUser,
  createSeries,
} from "./db";

describe("Favorites and Ratings System", () => {
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
      expect(favorites[0].seriesId).toBe(testSeriesId);
    });

    it("should not allow duplicate favorite", async () => {
      try {
        await addFavorite(testUserId, testSeriesId);
        expect.fail("Should have thrown an error for duplicate favorite");
      } catch (error: any) {
        expect(error.message).toContain("موجود بالفعل");
      }
    });

    it("should remove series from favorites", async () => {
      const result = await removeFavorite(testUserId, testSeriesId);
      expect(result.success).toBe(true);
    });

    it("should not find series in favorites after removal", async () => {
      const result = await isFavorite(testUserId, testSeriesId);
      expect(result).toBe(false);
    });
  });

  describe("Ratings Operations", () => {
    it("should add a rating to series", async () => {
      const result = await addOrUpdateRating({
        userId: testUserId,
        seriesId: testSeriesId,
        rating: 5,
        comment: "مسلسل رائع جداً",
      });
      expect(result).toBeDefined();
    });

    it("should get user rating for series", async () => {
      const userRating = await getUserRating(testUserId, testSeriesId);
      expect(userRating).not.toBeNull();
      expect(userRating?.rating).toBe(5);
      expect(userRating?.comment).toContain("رائع");
    });

    it("should get average rating for series", async () => {
      const average = await getAverageRating(testSeriesId);
      expect(typeof average).toBe("number");
      expect(average).toBeGreaterThan(0);
      expect(average).toBeLessThanOrEqual(5);
    });

    it("should get all ratings for series", async () => {
      const ratings = await getSeriesRatings(testSeriesId);
      expect(Array.isArray(ratings)).toBe(true);
      expect(ratings.length).toBeGreaterThan(0);
    });

    it("should update existing rating", async () => {
      const result = await addOrUpdateRating({
        userId: testUserId,
        seriesId: testSeriesId,
        rating: 4,
        comment: "جيد جداً",
      });
      expect(result).toBeDefined();

      const userRating = await getUserRating(testUserId, testSeriesId);
      expect(userRating?.rating).toBe(4);
      expect(userRating?.comment).toContain("جيد");
    });

    it("should return 0 average for series with no ratings", async () => {
      const newSeriesResult = await createSeries({
        titleAr: "مسلسل بدون تقييمات",
        title: "Series Without Ratings",
        genre: "اختبار",
      });
      const newSeriesId = newSeriesResult[0].insertId;

      const average = await getAverageRating(newSeriesId);
      expect(average).toBe(0);
    });
  });
});
