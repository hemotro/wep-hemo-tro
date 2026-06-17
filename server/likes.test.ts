import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "./db";
import {
  addLike,
  removeLike,
  getLikeCount,
  isLikedByUser,
  getTopRatedSeries,
  getLatestSeries,
} from "./db";

describe("Likes System", () => {
  const testUserId = 999;
  const testSeriesId = 1;

  beforeAll(async () => {
    // تنظيف البيانات قبل الاختبار
    await db.delete(require("./db").likes).where(
      require("drizzle-orm").and(
        require("drizzle-orm").eq(require("./db").likes.userId, testUserId),
        require("drizzle-orm").eq(require("./db").likes.seriesId, testSeriesId)
      )
    );
  });

  afterAll(async () => {
    // تنظيف البيانات بعد الاختبار
    await db.delete(require("./db").likes).where(
      require("drizzle-orm").and(
        require("drizzle-orm").eq(require("./db").likes.userId, testUserId),
        require("drizzle-orm").eq(require("./db").likes.seriesId, testSeriesId)
      )
    );
  });

  it("should add a like successfully", async () => {
    const result = await addLike(testUserId, testSeriesId);
    expect(result.success).toBe(true);
  });

  it("should not add duplicate likes", async () => {
    await addLike(testUserId, testSeriesId);
    const result = await addLike(testUserId, testSeriesId);
    expect(result.success).toBe(false);
    expect(result.message).toContain("already");
  });

  it("should get like count correctly", async () => {
    const count = await getLikeCount(testSeriesId);
    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it("should check if user liked a series", async () => {
    const isLiked = await isLikedByUser(testUserId, testSeriesId);
    expect(typeof isLiked).toBe("boolean");
    expect(isLiked).toBe(true);
  });

  it("should remove a like successfully", async () => {
    const result = await removeLike(testUserId, testSeriesId);
    expect(result.success).toBe(true);
  });

  it("should not find like after removal", async () => {
    const isLiked = await isLikedByUser(testUserId, testSeriesId);
    expect(isLiked).toBe(false);
  });

  it("should get top rated series", async () => {
    const topRated = await getTopRatedSeries(5);
    expect(Array.isArray(topRated)).toBe(true);
    expect(topRated.length).toBeLessThanOrEqual(5);
  });

  it("should get latest series", async () => {
    const latest = await getLatestSeries(6);
    expect(Array.isArray(latest)).toBe(true);
    expect(latest.length).toBeLessThanOrEqual(6);
  });

  it("should handle invalid series ID", async () => {
    const result = await addLike(testUserId, 99999);
    expect(result.success).toBe(false);
  });

  it("should handle invalid user ID", async () => {
    const result = await addLike(99999, testSeriesId);
    expect(result.success).toBe(false);
  });
});
