import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  password: text("password"),
  googleId: varchar("googleId", { length: 255 }).unique(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * جدول المسلسلات
 */
export const series = mysqlTable("series", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  titleAr: varchar("titleAr", { length: 255 }).notNull(),
  description: text("description"),
  descriptionAr: text("descriptionAr"),
  genre: varchar("genre", { length: 255 }),
  posterUrl: varchar("posterUrl", { length: 500 }),
  totalSeasons: int("totalSeasons").default(1),
  currentSeason: int("currentSeason").default(1),
  totalEpisodes: int("totalEpisodes").default(0),
  rating: varchar("rating", { length: 10 }),
  promoUrl: varchar("promoUrl", { length: 500 }), // رابط فيديو البرومو
  promoTitle: varchar("promoTitle", { length: 255 }), // عنوان البرومو
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Series = typeof series.$inferSelect;
export type InsertSeries = typeof series.$inferInsert;

/**
 * جدول صور المسلسلات
 */
export const seriesImages = mysqlTable("seriesImages", {
  id: int("id").autoincrement().primaryKey(),
  seriesId: int("seriesId").notNull(),
  imageType: varchar("imageType", { length: 50 }).notNull(), // banner, poster, cover, etc
  imageUrl: varchar("imageUrl", { length: 500 }).notNull(),
  alt: varchar("alt", { length: 255 }),
  isDefault: boolean("isDefault").default(false), // الصورة الافتراضية
  displayOrder: int("displayOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SeriesImage = typeof seriesImages.$inferSelect;
export type InsertSeriesImage = typeof seriesImages.$inferInsert;

/**
 * جدول الحلقات
 */
export const episodes = mysqlTable("episodes", {
  id: int("id").autoincrement().primaryKey(),
  seriesId: int("seriesId").notNull(),
  season: int("season").notNull(),
  episodeNumber: int("episodeNumber").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  titleAr: varchar("titleAr", { length: 255 }).notNull(),
  description: text("description"),
  descriptionAr: text("descriptionAr"),
  videoUrl: varchar("videoUrl", { length: 500 }).notNull(),
  thumbnailUrl: varchar("thumbnailUrl", { length: 500 }),
  duration: int("duration"),
  releaseDate: timestamp("releaseDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Episode = typeof episodes.$inferSelect;
export type InsertEpisode = typeof episodes.$inferInsert;

/**
 * جدول المفضلة
 */
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  seriesId: int("seriesId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

/**
 * جدول القنوات المباشرة
 */
export const channels = mysqlTable("channels", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }).notNull(),
  logoUrl: varchar("logoUrl", { length: 500 }),
  streamUrl: varchar("streamUrl", { length: 500 }).notNull(), // رابط m3u8 أو يوتيوب
  streamType: mysqlEnum("streamType", ["m3u8", "youtube"]).notNull(),
  description: text("description"),
  descriptionAr: text("descriptionAr"),
  isActive: boolean("isActive").default(true),
  displayOrder: int("displayOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Channel = typeof channels.$inferSelect;
export type InsertChannel = typeof channels.$inferInsert;

