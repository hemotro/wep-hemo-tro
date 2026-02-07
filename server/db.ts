import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, series, episodes, InsertSeries, InsertEpisode, favorites, InsertFavorite, seriesImages, InsertSeriesImage, channels, Channel, InsertChannel } from "../drizzle/schema";
import { ENV } from './_core/env';
import bcrypt from "bcrypt";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== المستخدمون ====================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function registerUser(email: string, password: string, name: string) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");

  // التحقق من عدم وجود البريد الإلكتروني
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    throw new Error("البريد الإلكتروني مسجل بالفعل");
  }

  // تشفير كلمة السر
  const hashedPassword = await bcrypt.hash(password, 10);

  // إنشاء مستخدم جديد
  const result = await db.insert(users).values({
    email,
    password: hashedPassword,
    name,
    loginMethod: "email",
    role: "user",
  });

  return result;
}

export async function loginWithEmail(email: string, password: string) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (result.length === 0) {
    throw new Error("البريد الإلكتروني أو كلمة السر غير صحيحة");
  }

  const user = result[0];
  if (!user.password) {
    throw new Error("البريد الإلكتروني أو كلمة السر غير صحيحة");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("البريد الإلكتروني أو كلمة السر غير صحيحة");
  }

  return user;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ==================== المسلسلات ====================

export async function getAllSeries() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(series);
}

export async function getSeriesById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(series).where(eq(series.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createSeries(data: InsertSeries) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");

  const result = await db.insert(series).values(data);
  return result;
}

export async function updateSeries(id: number, data: Partial<InsertSeries>) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");

  await db.update(series).set(data).where(eq(series.id, id));
  return await getSeriesById(id);
}

export async function deleteSeries(id: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");

  // حذف جميع الحلقات أولاً
  await db.delete(episodes).where(eq(episodes.seriesId, id));

  // ثم حذف المسلسل
  await db.delete(series).where(eq(series.id, id));
  return { success: true };
}

// ==================== الحلقات ====================

export async function getEpisodesBySeriesId(seriesId: number, season?: number) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(episodes).where(eq(episodes.seriesId, seriesId));
  if (season) {
    query = db.select().from(episodes).where(eq(episodes.seriesId, seriesId));
  }
  return await query;
}

export async function getEpisodeById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(episodes).where(eq(episodes.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createEpisode(data: InsertEpisode) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");

  const result = await db.insert(episodes).values(data);
  return result;
}

export async function updateEpisode(id: number, data: Partial<InsertEpisode>) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");

  await db.update(episodes).set(data).where(eq(episodes.id, id));
  return await getEpisodeById(id);
}

export async function deleteEpisode(id: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");

  await db.delete(episodes).where(eq(episodes.id, id));
  return { success: true };
}

// ==================== المفضلة ====================

export async function addFavorite(userId: number, seriesId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");

  // التحقق من عدم وجود المفضلة بالفعل
  const existing = await db.select().from(favorites).where(
    and(eq(favorites.userId, userId), eq(favorites.seriesId, seriesId))
  ).limit(1);

  if (existing.length > 0) {
    throw new Error("المسلسل موجود بالفعل في المفضلة");
  }

  const result = await db.insert(favorites).values({ userId, seriesId });
  return result;
}

export async function removeFavorite(userId: number, seriesId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");

  await db.delete(favorites).where(
    and(eq(favorites.userId, userId), eq(favorites.seriesId, seriesId))
  );
  return { success: true };
}

export async function getUserFavorites(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(favorites).where(eq(favorites.userId, userId));
  return result;
}

export async function isFavorite(userId: number, seriesId: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db.select().from(favorites).where(
    and(eq(favorites.userId, userId), eq(favorites.seriesId, seriesId))
  ).limit(1);

  return result.length > 0;
}




// ==================== صور المسلسلات ====================

export async function addSeriesImage(data: InsertSeriesImage) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");

  const result = await db.insert(seriesImages).values(data);
  return result;
}

export async function getSeriesImages(seriesId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(seriesImages).where(eq(seriesImages.seriesId, seriesId));
  return result;
}

export async function getSeriesImageByType(seriesId: number, imageType: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(seriesImages).where(
    and(eq(seriesImages.seriesId, seriesId), eq(seriesImages.imageType, imageType))
  ).limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function deleteSeriesImage(imageId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");

  await db.delete(seriesImages).where(eq(seriesImages.id, imageId));
  return { success: true };
}

export async function updateSeriesImage(imageId: number, data: Partial<InsertSeriesImage>) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");

  await db.update(seriesImages).set(data).where(eq(seriesImages.id, imageId));
  return { success: true };
}

export async function setDefaultImage(seriesId: number, imageId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");

  // إزالة الافتراضية من جميع الصور
  await db.update(seriesImages).set({ isDefault: false }).where(eq(seriesImages.seriesId, seriesId));

  // تعيين الصورة الجديدة كافتراضية
  await db.update(seriesImages).set({ isDefault: true }).where(eq(seriesImages.id, imageId));
  return { success: true };
}


// ==================== القنوات المباشرة ====================

export async function createChannel(data: InsertChannel) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");

  const result = await db.insert(channels).values(data);
  return result;
}

export async function getAllChannels() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(channels).where(eq(channels.isActive, true));
  return result;
}

export async function getChannelById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(channels).where(eq(channels.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateChannel(id: number, data: Partial<InsertChannel>) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");

  await db.update(channels).set(data).where(eq(channels.id, id));
  return { success: true };
}

export async function deleteChannel(id: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");

  await db.delete(channels).where(eq(channels.id, id));
  return { success: true };
}

// ==================== البرومو ====================

export async function updateSeriesPromo(seriesId: number, promoUrl: string, promoTitle: string) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");

  await db.update(series).set({ promoUrl, promoTitle }).where(eq(series.id, seriesId));
  return { success: true };
}

export async function getSeriesPromo(seriesId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(series).where(eq(series.id, seriesId)).limit(1);
  if (result.length === 0) return null;

  const s = result[0];
  return {
    promoUrl: s.promoUrl,
    promoTitle: s.promoTitle,
  };
}
