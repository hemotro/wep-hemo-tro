import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, series, episodes, InsertSeries, InsertEpisode } from "../drizzle/schema";
import { ENV } from './_core/env';
import bcrypt from 'bcrypt';

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

// ===== نظام المصادقة الحقيقي =====

/**
 * تسجيل مستخدم جديد عبر البريد الإلكتروني وكلمة السر
 */
export async function registerUser(email: string, password: string, name: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // التحقق من عدم وجود بريد مسجل بالفعل
  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existingUser.length > 0) {
    throw new Error("البريد الإلكتروني مسجل بالفعل");
  }

  // تشفير كلمة السر
  const hashedPassword = await bcrypt.hash(password, 10);

  // إنشاء مستخدم جديد
  const result = await db.insert(users).values({
    email,
    password: hashedPassword,
    name,
    loginMethod: 'email',
    role: 'user',
    lastSignedIn: new Date(),
  });

  return result;
}

/**
 * تسجيل الدخول عبر البريد الإلكتروني وكلمة السر
 */
export async function loginWithEmail(email: string, password: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // البحث عن المستخدم
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (result.length === 0) {
    throw new Error("البريد الإلكتروني أو كلمة السر غير صحيحة");
  }

  const user = result[0];

  // التحقق من كلمة السر
  if (!user.password) {
    throw new Error("هذا الحساب لم يتم إنشاؤه عبر البريد الإلكتروني");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("البريد الإلكتروني أو كلمة السر غير صحيحة");
  }

  // تحديث آخر وقت تسجيل دخول
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));

  return user;
}

/**
 * البحث عن مستخدم عبر البريد الإلكتروني
 */
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * البحث عن مستخدم عبر Google ID
 */
export async function getUserByGoogleId(googleId: string) {
  const db = await getDb();
  if (!db) {
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * إنشاء أو تحديث مستخدم Google
 */
export async function upsertGoogleUser(googleId: string, email: string, name: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // البحث عن المستخدم الموجود
  const existingUser = await getUserByGoogleId(googleId);
  if (existingUser) {
    // تحديث آخر وقت تسجيل دخول
    await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, existingUser.id));
    return existingUser;
  }

  // إنشاء مستخدم جديد
  const result = await db.insert(users).values({
    googleId,
    email,
    name,
    loginMethod: 'google',
    role: 'user',
    lastSignedIn: new Date(),
  });

  const newUser = await getUserByGoogleId(googleId);
  return newUser;
}

// ===== دوال المسلسلات والحلقات =====

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

export async function getEpisodesBySeriesId(seriesId: number, season?: number) {
  const db = await getDb();
  if (!db) return [];

  if (season) {
    return await db.select().from(episodes)
      .where(eq(episodes.seriesId, seriesId) && eq(episodes.season, season));
  }

  return await db.select().from(episodes).where(eq(episodes.seriesId, seriesId));
}

export async function getEpisodeById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(episodes).where(eq(episodes.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function insertSeries(data: InsertSeries) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(series).values(data);
}

export async function insertEpisode(data: InsertEpisode) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(episodes).values(data);
}
