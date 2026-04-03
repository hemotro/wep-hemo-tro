import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, bigint } from "drizzle-orm/mysql-core";

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
  emailVerified: boolean("emailVerified").default(false),
  emailVerificationCode: varchar("emailVerificationCode", { length: 10 }),
  emailVerificationExpiry: timestamp("emailVerificationExpiry"),
  rememberMe: boolean("rememberMe").default(false),
  passwordResetToken: varchar("passwordResetToken", { length: 255 }),
  passwordResetExpiry: timestamp("passwordResetExpiry"),
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
  videoType: mysqlEnum("videoType", ["youtube", "m3u8", "mp4"]).default("youtube"),
  videoSize: int("videoSize"),
  videoDuration: int("videoDuration"),
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



/**
 * جدول تخزين الفيديوهات المرفوعة
 */
export const uploadedVideos = mysqlTable("uploadedVideos", {
  id: int("id").autoincrement().primaryKey(),
  episodeId: int("episodeId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(),
  fileSize: int("fileSize").notNull(),
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  duration: int("duration"),
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UploadedVideo = typeof uploadedVideos.$inferSelect;
export type InsertUploadedVideo = typeof uploadedVideos.$inferInsert;


/**
 * جدول تتبع المشاهدة - لحفظ آخر موضع مشاهدة للمستخدم
 */
export const watchHistory = mysqlTable("watchHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  episodeId: int("episodeId").notNull(),
  seriesId: int("seriesId").notNull(),
  currentTime: int("currentTime").default(0), // الموضع الحالي بالثواني
  duration: int("duration").default(0), // مدة الفيديو بالثواني
  isCompleted: boolean("isCompleted").default(false), // هل تمت مشاهدة الحلقة كاملة
  lastWatchedAt: timestamp("lastWatchedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WatchHistory = typeof watchHistory.$inferSelect;
export type InsertWatchHistory = typeof watchHistory.$inferInsert;


/**
 * جدول الأقسام الديناميكية (مثل: رمضان 2025، آخر التحميلات، إلخ)
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  titleAr: varchar("titleAr", { length: 255 }).notNull(),
  description: text("description"),
  descriptionAr: text("descriptionAr"),
  icon: varchar("icon", { length: 500 }),
  order: int("order").default(0),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * جدول ربط المسلسلات بالأقسام (علاقة many-to-many)
 */
export const seriesCategories = mysqlTable("seriesCategories", {
  id: int("id").autoincrement().primaryKey(),
  seriesId: int("seriesId").notNull(),
  categoryId: int("categoryId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SeriesCategory = typeof seriesCategories.$inferSelect;
export type InsertSeriesCategory = typeof seriesCategories.$inferInsert;


/**
 * جدول رموز التحقق من البريد الإلكتروني
 */
export const emailVerificationTokens = mysqlTable("emailVerificationTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 255 }).unique().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type InsertEmailVerificationToken = typeof emailVerificationTokens.$inferInsert;

/**
 * جدول رموز استعادة كلمة السر - يحتوي على كود رقمي 6 أرقام
 */
export const passwordResetTokens = mysqlTable("passwordResetTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 255 }).unique().notNull(),
  code: varchar("code", { length: 6 }).notNull(), // كود رقمي 6 أرقام
  expiresAt: timestamp("expiresAt").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;
