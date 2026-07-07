import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import { z } from "zod";
import { 
  getAllSeries, getSeriesById, getEpisodesBySeriesId, getEpisodeById, 
  registerUser, loginWithEmail, createAdminUser, createSeries, updateSeries, deleteSeries,
  createEpisode, updateEpisode, deleteEpisode,
  addFavorite, removeFavorite, getUserFavorites, isFavorite,
  addSeriesImage, getSeriesImages, deleteSeriesImage, setDefaultImage,
  createChannel, getAllChannels, getChannelById, updateChannel, deleteChannel,
  updateSeriesPromo, getSeriesPromo,
  createUploadedVideo, getUploadedVideoByEpisodeId, updateEpisodeVideo, deleteUploadedVideo,
  saveWatchHistory, getWatchHistory, getUserSeriesWatchHistory,
  createCategory, getCategories, getCategoryById, updateCategory, deleteCategory,
  addSeriesToCategory, removeSeriesFromCategory, getSeriesByCategory, getCategoriesWithSeries,
  requestPasswordReset, resetPasswordWithToken, verifyPasswordResetToken, resetPasswordWithCode, verifyPasswordResetCode,
  createPlatform, getPlatforms, getPlatformById, updatePlatform, deletePlatform,
  createDisplaySection, getDisplaySections, getDisplaySectionById, updateDisplaySection, deleteDisplaySection,
  addSeriesToDisplaySection, removeSeriesFromDisplaySection, getSeriesByDisplaySection, getDisplaySectionsWithSeries,
  addLike, removeLike, getLikeCount, isLikedByUser, getTopRatedSeries, getLatestSeries
} from "./db";
import { sendPasswordResetEmail } from "./_core/email";
import { storagePut } from "./storage";
import { TRPCError } from "@trpc/server";
import { imageRouter } from "./image-upload.router";
import { telegramRouter } from "./telegram.router";

// إنشاء adminProcedure للعمليات الإدارية فقط
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  // السماح لأي مستخدم مسجل بالوصول إلى لوحة الإدارة
  if (!ctx.user) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'يجب تسجيل الدخول أولاً' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  images: imageRouter,
  telegram: telegramRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      sdk.clearSessionCookie(ctx.res);
      return {
        success: true,
      } as const;
    }),

    // تسجيل مستخدم جديد
    register: publicProcedure
      .input(z.object({
        email: z.string().email("البريد الإلكتروني غير صحيح"),
        password: z.string().min(6, "كلمة السر يجب أن تكون 6 أحرف على الأقل"),
        name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
      }))
      .mutation(async ({ input }) => {
        try {
          await registerUser(input.email, input.password, input.name);
          return { success: true, message: "تم إنشاء الحساب بنجاح" };
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message || "فشل إنشاء الحساب",
          });
        }
      }),

    // تسجيل الدخول عبر البريد الإلكتروني
    loginEmail: publicProcedure
      .input(z.object({
        email: z.string().email("البريد الإلكتروني غير صحيح"),
        password: z.string().min(6, "كلمة السر غير صحيحة"),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const user = await loginWithEmail(input.email, input.password);
          
          // إنشاء JWT session token
          const sessionToken = sdk.createSessionToken({
            userId: user.id,
            email: user.email || '',
            name: user.name || '',
            role: user.role || 'user',
          });
          
          // حفظ الجلسة في الـ cookie
          sdk.setSessionCookie(ctx.res, sessionToken);

          return { 
            success: true, 
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            }
          };
        } catch (error: any) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: error.message || "فشل تسجيل الدخول",
          });
        }
      }),

    createAdmin: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(2),
      }))
      .mutation(async ({ input }) => {
        try {
          await createAdminUser(input.email, input.password, input.name);
          return { success: true, message: "تم إنشاء حساب المسؤول بنجاح" };
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message || "فشل إنشاء حساب المسؤول",
          });
        }
      }),

    requestPasswordReset: publicProcedure
      .input(z.object({
        email: z.string().email(),
      }))
      .mutation(async ({ input }) => {
        try {
          const { token, code, user } = await requestPasswordReset(input.email);
          
          try {
            await sendPasswordResetEmail(user.email || '', code, user.name || 'المستخدم');
          } catch (emailError) {
            console.error('Email error:', emailError);
          }
          
          return { 
            success: true, 
            message: "تم إرسال كود استعادة كلمة السر إلى بريدك الإلكتروني"
          };
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message || "فشل طلب استعادة كلمة السر",
          });
        }
      }),

    resetPasswordWithCode: publicProcedure
      .input(z.object({
        email: z.string().email(),
        code: z.string(),
        newPassword: z.string().min(6),
      }))
      .mutation(async ({ input }) => {
        try {
          await resetPasswordWithCode(input.email, input.code, input.newPassword);
          return { 
            success: true, 
            message: "تم تحديث كلمة السر بنجاح"
          };
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message || "فشل تحديث كلمة السر",
          });
        }
      }),

    verifyPasswordResetCode: publicProcedure
      .input(z.object({
        email: z.string().email(),
        code: z.string(),
      }))
      .query(async ({ input }) => {
        try {
          const result = await verifyPasswordResetCode(input.email, input.code);
          return result;
        } catch (error: any) {
          return { 
            valid: false, 
            message: error.message || "الكود غير صحيح أو منتهي الصلاحية"
          };
        }
      }),

    verifyPasswordResetToken: publicProcedure
      .input(z.object({
        token: z.string(),
      }))
      .query(async ({ input }) => {
        try {
          const resetToken = await verifyPasswordResetToken(input.token);
          return { 
            success: true, 
            valid: true,
            userId: resetToken.userId
          };
        } catch (error: any) {
          return { 
            success: false, 
            valid: false,
            message: error.message || "الرمز غير صحيح أو منتهي الصلاحية"
          };
        }
      }),

    resetPassword: publicProcedure
      .input(z.object({
        token: z.string(),
        newPassword: z.string().min(6),
      }))
      .mutation(async ({ input }) => {
        try {
          await resetPasswordWithToken(input.token, input.newPassword);
          return { 
            success: true, 
            message: "تم تحديث كلمة السر بنجاح"
          };
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message || "فشل تحديث كلمة السر",
          });
        }
      }),

    verifyAdminCode: publicProcedure
      .input(z.object({
        code: z.string(),
      }))
      .mutation(async ({ input }) => {
        const ADMIN_SECRET_CODE = "hemohemo@12";
        
        if (input.code !== ADMIN_SECRET_CODE) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "الرمز السري غير صحيح",
          });
        }

        return {
          success: true,
          message: "تم التحقق من الرمز بنجاح",
        };
      }),

    sendEmailVerification: publicProcedure
      .input(z.object({
        email: z.string().email(),
      }))
      .mutation(async ({ input }) => {
        try {
          const code = Math.floor(100000 + Math.random() * 900000).toString();
          (global as any).emailVerificationCodes = (global as any).emailVerificationCodes || {};
          (global as any).emailVerificationCodes[input.email] = {
            code,
            expiresAt: Date.now() + 10 * 60 * 1000,
          };
          
          try {
            await sendPasswordResetEmail(input.email, code, 'المستخدم');
          } catch (emailError) {
            console.error('Email error:', emailError);
          }
          
          return {
            success: true,
            message: 'تم إرسال كود التحقق إلى بريدك الإلكتروني',
          };
        } catch (error: any) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message || 'فشل إرسال كود التحقق',
          });
        }
      }),

    verifyEmail: publicProcedure
      .input(z.object({
        email: z.string().email(),
        code: z.string(),
      }))
      .mutation(async ({ input }) => {
        try {
          const verificationData = (global as any).emailVerificationCodes?.[input.email];
          
          if (!verificationData) {
            throw new Error('لم يتم طلب كود تحقق لهذا البريد الإلكتروني');
          }
          
          if (verificationData.expiresAt < Date.now()) {
            delete (global as any).emailVerificationCodes[input.email];
            throw new Error('انتهت صلاحية الكود');
          }
          
          if (verificationData.code !== input.code) {
            throw new Error('الكود غير صحيح');
          }
          
          delete (global as any).emailVerificationCodes[input.email];
          
          return {
            success: true,
            message: 'تم التحقق من البريد الإلكتروني بنجاح',
          };
        } catch (error: any) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message || 'فشل التحقق من الكود',
          });
        }
      })
  }),

  series: router({
    list: publicProcedure.query(async () => {
      return await getAllSeries();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getSeriesById(input.id);
      }),

    getEpisodes: publicProcedure
      .input(z.object({ 
        seriesId: z.number(),
        season: z.number().optional()
      }))
      .query(async ({ input }) => {
        return await getEpisodesBySeriesId(input.seriesId, input.season);
      }),

    getEpisode: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getEpisodeById(input.id);
      }),

    // ==================== عمليات إدارية ====================

    // إضافة مسلسل جديد
    create: adminProcedure
      .input(z.object({
        titleAr: z.string().min(1, "اسم المسلسل مطلوب"),
        title: z.string().optional(),
        descriptionAr: z.string().optional(),
        description: z.string().optional(),
        genre: z.string().optional(),
        posterUrl: z.string().optional(),
        bannerUrl: z.string().optional(),
        logoUrl: z.string().optional(),
        totalSeasons: z.number().optional().default(1),
        currentSeason: z.number().optional().default(1),
        platformId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const result = await createSeries({
            titleAr: input.titleAr,
            title: input.title || input.titleAr,
            descriptionAr: input.descriptionAr,
            description: input.description,
            genre: input.genre,
            posterUrl: input.posterUrl,
            bannerUrl: input.bannerUrl,
            logoUrl: input.logoUrl,
            totalSeasons: input.totalSeasons,
            currentSeason: input.currentSeason,
            totalEpisodes: 0,
            platformId: input.platformId,
          });
          return { success: true, message: "تم إنشاء المسلسل بنجاح" };
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message || "فشل إنشاء المسلسل",
          });
        }
      }),

    // تعديل مسلسل
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        titleAr: z.string().optional(),
        title: z.string().optional(),
        descriptionAr: z.string().optional(),
        description: z.string().optional(),
        genre: z.string().optional(),
        posterUrl: z.string().optional(),
        bannerUrl: z.string().optional(),
        logoUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const { id, ...data } = input;
          const result = await updateSeries(id, data);
          return { success: true, data: result, message: "تم تحديث المسلسل بنجاح" };
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message || "فشل تحديث المسلسل",
          });
        }
      }),

    // حذف مسلسل
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        try {
          await deleteSeries(input.id);
          return { success: true, message: "تم حذف المسلسل بنجاح" };
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message || "فشل حذف المسلسل",
          });
        }
      }),

    // تحديث صورة المسلسل (السلايدر)
    updatePoster: adminProcedure
      .input(z.object({
        seriesId: z.number(),
        posterUrl: z.string().url("رابط الصورة غير صحيح"),
      }))
      .mutation(async ({ input }) => {
        try {
          const result = await updateSeries(input.seriesId, {
            posterUrl: input.posterUrl,
          });
          return { success: true, data: result, message: "تم تحديث صورة المسلسل بنجاح" };
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message || "فشل تحديث صورة المسلسل",
          });
        }
      }),

    // حذف صورة المسلسل
    deleteImage: adminProcedure
      .input(z.object({
        seriesId: z.number(),
      }))
      .mutation(async ({ input }) => {
        try {
          const result = await updateSeries(input.seriesId, {
            posterUrl: null,
          });
          return { success: true, message: "تم حذف صورة المسلسل بنجاح" };
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message || "فشل حذف صورة المسلسل",
          });
        }
      }),
  }),

  episodes: router({
    // إضافة حلقة جديدة
    create: adminProcedure
      .input(z.object({
        seriesId: z.number(),
        season: z.number().default(1),
        episodeNumber: z.number(),
        titleAr: z.string().min(1, "اسم الحلقة مطلوب"),
        title: z.string().optional(),
        descriptionAr: z.string().optional(),
        description: z.string().optional(),
        videoUrl: z.string().min(1, "رابط الفيديو مطلوب"),
        videoType: z.enum(["youtube", "mp4", "m3u8", "telegram"]).default("telegram"),
        video480pUrl: z.string().optional(),
        video720pUrl: z.string().optional(),
        video1080pUrl: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        duration: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const result = await createEpisode({
            seriesId: input.seriesId,
            season: input.season,
            episodeNumber: input.episodeNumber,
            titleAr: input.titleAr,
            title: input.title || input.titleAr,
            descriptionAr: input.descriptionAr,
            description: input.description,
            videoUrl: input.videoUrl,
            videoType: input.videoType,
            video480pUrl: input.video480pUrl,
            video720pUrl: input.video720pUrl,
            video1080pUrl: input.video1080pUrl,
            thumbnailUrl: input.thumbnailUrl,
            duration: input.duration,
          });
          return { success: true, message: "تم إضافة الحلقة بنجاح" };
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message || "فشل إضافة الحلقة",
          });
        }
      }),

    // تعديل حلقة
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        titleAr: z.string().optional(),
        title: z.string().optional(),
        descriptionAr: z.string().optional(),
        description: z.string().optional(),
        videoUrl: z.string().optional(),
        video1080pUrl: z.string().optional(),
        video720pUrl: z.string().optional(),
        video480pUrl: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        duration: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const { id, ...data } = input;
          const result = await updateEpisode(id, data);
          return { success: true, data: result, message: "تم تحديث الحلقة بنجاح" };
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message || "فشل تحديث الحلقة",
          });
        }
      }),

    // حذف حلقة
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        try {
          await deleteEpisode(input.id);
          return { success: true, message: "تم حذف الحلقة بنجاح" };
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message || "فشل حذف الحلقة",
          });
        }
      }),
  }),

  // ==================== المفضلة ====================
  favorites: router({
    add: protectedProcedure
      .input(z.object({ seriesId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        try {
          await addFavorite(ctx.user.userId, input.seriesId);
          return { success: true, message: "تمت إضافة المسلسل إلى المفضلة" };
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message || "فشل إضافة المسلسل إلى المفضلة",
          });
        }
      }),

    remove: protectedProcedure
      .input(z.object({ seriesId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        try {
          await removeFavorite(ctx.user.userId, input.seriesId);
          return { success: true, message: "تمت إزالة المسلسل من المفضلة" };
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message || "فشل إزالة المسلسل من المفضلة",
          });
        }
      }),

    getAll: protectedProcedure
      .query(async ({ ctx }) => {
        try {
          const favorites = await getUserFavorites(ctx.user.userId);
          return favorites;
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "فشل جلب المفضلة",
          });
        }
      }),

    isFavorite: protectedProcedure
      .input(z.object({ seriesId: z.number() }))
      .query(async ({ input, ctx }) => {
        try {
          const result = await isFavorite(ctx.user.userId, input.seriesId);
          return result;
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "فشل التحقق من المفضلة",
          });
        }
      }),
  }),


  // ==================== صور المسلسلات ====================
  seriesImages: router({
    add: adminProcedure
      .input(z.object({
        seriesId: z.number(),
        imageType: z.enum(["banner", "poster", "cover", "thumbnail"]),
        imageUrl: z.string().url(),
        alt: z.string().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const result = await addSeriesImage({
            seriesId: input.seriesId,
            imageType: input.imageType,
            imageUrl: input.imageUrl,
            alt: input.alt,
            isDefault: input.isDefault || false,
          });
          return { success: true, message: "تمت إضافة الصورة بنجاح" };
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message || "فشل إضافة الصورة",
          });
        }
      }),

    getAll: publicProcedure
      .input(z.object({ seriesId: z.number() }))
      .query(async ({ input }) => {
        try {
          const images = await getSeriesImages(input.seriesId);
          return images;
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "فشل جلب الصور",
          });
        }
      }),

    delete: adminProcedure
      .input(z.object({ imageId: z.number() }))
      .mutation(async ({ input }) => {
        try {
          await deleteSeriesImage(input.imageId);
          return { success: true, message: "تم حذف الصورة بنجاح" };
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message || "فشل حذف الصورة",
          });
        }
      }),

    setDefault: adminProcedure
      .input(z.object({ seriesId: z.number(), imageId: z.number() }))
      .mutation(async ({ input }) => {
        try {
          await setDefaultImage(input.seriesId, input.imageId);
          return { success: true, message: "تم تعيين الصورة الافتراضية" };
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message || "فشل تعيين الصورة الافتراضية",
          });
        }
      }),
  }),

  // ==================== البرومو ====================
  promo: router({
    update: adminProcedure
      .input(z.object({
        seriesId: z.number(),
        promoUrl: z.string().url(),
        promoTitle: z.string(),
      }))
      .mutation(async ({ input }) => {
        try {
          await updateSeriesPromo(input.seriesId, input.promoUrl, input.promoTitle);
          return { success: true, message: "تم تحديث البرومو بنجاح" };
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message || "فشل تحديث البرومو",
          });
        }
      }),

    get: publicProcedure
      .input(z.object({ seriesId: z.number() }))
      .query(async ({ input }) => {
        try {
          const promo = await getSeriesPromo(input.seriesId);
          return promo;
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "فشل جلب البرومو",
          });
        }
      }),
  }),

  // ==================== القنوات المباشرة ====================
  channels: router({
    create: adminProcedure
      .input(z.object({
        name: z.string(),
        nameAr: z.string(),
        logoUrl: z.string().url().optional(),
        streamUrl: z.string().url(),
        streamType: z.enum(["m3u8", "youtube"]),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          await createChannel({
            name: input.name,
            nameAr: input.nameAr,
            logoUrl: input.logoUrl,
            streamUrl: input.streamUrl,
            streamType: input.streamType,
            description: input.description,
            descriptionAr: input.descriptionAr,
          });
          return { success: true, message: "تم إضافة القناة بنجاح" };
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message || "فشل إضافة القناة",
          });
        }
      }),

    list: publicProcedure
      .query(async () => {
        try {
          const channelsList = await getAllChannels();
          return channelsList;
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "فشل جلب القنوات",
          });
        }
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        try {
          const channel = await getChannelById(input.id);
          return channel;
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "فشل جلب القناة",
          });
        }
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        nameAr: z.string().optional(),
        logoUrl: z.string().url().optional(),
        streamUrl: z.string().url().optional(),
        streamType: z.enum(["m3u8", "youtube"]).optional(),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const { id, ...data } = input;
          await updateChannel(id, data);
          return { success: true, message: "تم تحديث القناة بنجاح" };
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message || "فشل تحديث القناة",
          });
        }
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        try {
          await deleteChannel(input.id);
          return { success: true, message: "تم حذف القناة بنجاح" };
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message || "فشل حذف القناة",
          });
        }
      }),
  }),

  // ==================== الفيديوهات المرفوعة ====================
  videos: router({
    upload: adminProcedure
      .input(z.object({
        episodeId: z.number(),
        fileName: z.string(),
        fileBuffer: z.any(), // قبول Uint8Array أو Buffer
        fileSize: z.number(),
        mimeType: z.string(),
        duration: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          // رفع الملف إلى S3
          const fileKey = `videos/episode-${input.episodeId}-${Date.now()}-${input.fileName}`;
          // تحويل Uint8Array إلى Buffer إذا لزم الأمر
          const buffer = Buffer.isBuffer(input.fileBuffer) 
            ? input.fileBuffer 
            : Buffer.from(input.fileBuffer);
          const { url } = await storagePut(fileKey, buffer, input.mimeType);

          // حفظ معلومات الفيديو في قاعدة البيانات
          await createUploadedVideo({
            episodeId: input.episodeId,
            fileName: input.fileName,
            fileKey,
            fileUrl: url,
            fileSize: input.fileSize,
            mimeType: input.mimeType,
            duration: input.duration,
            uploadedBy: ctx.user!.id,
          });

          // تحديث الحلقة برابط الفيديو
          await updateEpisodeVideo(input.episodeId, {
            fileUrl: url,
            fileSize: input.fileSize,
            duration: input.duration,
          });

          return { success: true, message: "تم رفع الفيديو بنجاح", url };
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message || "فشل رفع الفيديو",
          });
        }
      }),

    getByEpisode: publicProcedure
      .input(z.object({ episodeId: z.number() }))
      .query(async ({ input }) => {
        try {
          const video = await getUploadedVideoByEpisodeId(input.episodeId);
          return video;
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "فشل جلب الفيديو",
          });
        }
      }),

    delete: adminProcedure
      .input(z.object({ episodeId: z.number() }))
      .mutation(async ({ input }) => {
        try {
          await deleteUploadedVideo(input.episodeId);
          return { success: true, message: "تم حذف الفيديو بنجاح" };
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message || "فشل حذف الفيديو",
          });
        }
       }),
  }),
  
  watchHistory: router({
    save: protectedProcedure
      .input(z.object({
        episodeId: z.number(),
        seriesId: z.number(),
        currentTime: z.number(),
        duration: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          await saveWatchHistory(
            ctx.user!.userId,
            input.episodeId,
            input.seriesId,
            input.currentTime,
            input.duration
          );
          return { success: true };
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "فشل حفظ سجل المشاهدة",
          });
        }
      }),
    
    get: protectedProcedure
      .input(z.object({ episodeId: z.number() }))
      .query(async ({ input, ctx }) => {
        try {
          const history = await getWatchHistory(ctx.user!.userId, input.episodeId);
          return history;
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "فشل جلب سجل المشاهدة",
          });
        }
      }),
    
    getSeriesHistory: protectedProcedure
      .input(z.object({ seriesId: z.number() }))
      .query(async ({ input, ctx }) => {
        try {
          const history = await getUserSeriesWatchHistory(ctx.user!.userId, input.seriesId);
          return history;
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "فشل جلب سجل المسلسل",
          });
        }
      }),
  }),

  categories: router({
    list: publicProcedure.query(async () => {
      return await getCategories();
    }),

    listWithSeries: publicProcedure.query(async () => {
      return await getCategoriesWithSeries();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getCategoryById(input.id);
      }),

    getSeriesByCategory: publicProcedure
      .input(z.object({ categoryId: z.number() }))
      .query(async ({ input }) => {
        return await getSeriesByCategory(input.categoryId);
      }),

    create: adminProcedure
      .input(z.object({
        title: z.string(),
        titleAr: z.string(),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
        icon: z.string().optional(),
        order: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          await createCategory(input);
          return { success: true, message: "تم إنشاء القسم بنجاح" };
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "فشل إنشاء القسم",
          });
        }
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        titleAr: z.string().optional(),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
        icon: z.string().optional(),
        order: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const { id, ...data } = input;
          await updateCategory(id, data);
          return { success: true, message: "تم تحديث القسم بنجاح" };
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "فشل تحديث القسم",
          });
        }
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        try {
          await deleteCategory(input.id);
          return { success: true, message: "تم حذف القسم بنجاح" };
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "فشل حذف القسم",
          });
        }
      }),

    addSeries: adminProcedure
      .input(z.object({
        seriesId: z.number(),
        categoryId: z.number(),
      }))
      .mutation(async ({ input }) => {
        try {
          await addSeriesToCategory(input.seriesId, input.categoryId);
          return { success: true, message: "تم إضافة المسلسل للقسم بنجاح" };
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "فشل إضافة المسلسل",
          });
        }
      }),

    removeSeries: adminProcedure
      .input(z.object({
        seriesId: z.number(),
        categoryId: z.number(),
      }))
      .mutation(async ({ input }) => {
        try {
          await removeSeriesFromCategory(input.seriesId, input.categoryId);
          return { success: true, message: "تم إزالة المسلسل من القسم بنجاح" };
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "فشل إزالة المسلسل",
          });
        }
      }),
  }),

  slider: router({
    list: publicProcedure.query(async () => {
      const { getSlider } = await import("./db");
      return await getSlider();
    }),

    add: adminProcedure
      .input(z.object({
        seriesId: z.number(),
        order: z.number(),
      }))
      .mutation(async ({ input }) => {
        try {
          const { addToSlider } = await import("./db");
          await addToSlider(input.seriesId, input.order);
          return { success: true, message: "تم إضافة المسلسل للسلايدر" };
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message || "فشل إضافة المسلسل",
          });
        }
      }),

    remove: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        try {
          const { removeFromSlider } = await import("./db");
          await removeFromSlider(input.id);
          return { success: true, message: "تم حذف المسلسل من السلايدر" };
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message || "فشل حذف المسلسل",
          });
        }
      }),

    updateOrder: adminProcedure
      .input(z.object({
        id: z.number(),
        order: z.number(),
      }))
      .mutation(async ({ input }) => {
        try {
          const { updateSliderOrder } = await import("./db");
          await updateSliderOrder(input.id, input.order);
          return { success: true, message: "تم تحديث الترتيب" };
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message || "فشل تحديث الترتيب",
          });
        }
      }),
  }),
  
  // ==================== المنصات (Platforms) ====================
  platforms: router({
    list: publicProcedure.query(async () => {
      return await getPlatforms();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getPlatformById(input.id);
      }),

    create: adminProcedure
      .input(z.object({
        name: z.string(),
        nameAr: z.string(),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
        icon: z.string().optional(),
        color: z.string().optional(),
        displayOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          await createPlatform(input);
          return { success: true, message: "تم إنشاء المنصة بنجاح" };
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "فشل إنشاء المنصة",
          });
        }
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        nameAr: z.string().optional(),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
        icon: z.string().optional(),
        color: z.string().optional(),
        isActive: z.boolean().optional(),
        displayOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const { id, ...data } = input;
          await updatePlatform(id, data);
          return { success: true, message: "تم تحديث المنصة بنجاح" };
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "فشل تحديث المنصة",
          });
        }
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        try {
          await deletePlatform(input.id);
          return { success: true, message: "تم حذف المنصة بنجاح" };
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "فشل حذف المنصة",
          });
        }
      }),
  }),

  // ==================== أقسام العرض (Display Sections) ====================
  displaySections: router({
    list: publicProcedure.query(async () => {
      return await getDisplaySections();
    }),

    listWithSeries: publicProcedure.query(async () => {
      return await getDisplaySectionsWithSeries();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getDisplaySectionById(input.id);
      }),

    getSeriesBySection: publicProcedure
      .input(z.object({ displaySectionId: z.number() }))
      .query(async ({ input }) => {
        return await getSeriesByDisplaySection(input.displaySectionId);
      }),

    create: adminProcedure
      .input(z.object({
        name: z.string(),
        nameAr: z.string(),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
        icon: z.string().optional(),
        displayType: z.enum(["carousel", "grid", "list"]).optional(),
        displayOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          await createDisplaySection(input);
          return { success: true, message: "تم إنشاء قسم العرض بنجاح" };
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "فشل إنشاء قسم العرض",
          });
        }
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        nameAr: z.string().optional(),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
        icon: z.string().optional(),
        displayType: z.enum(["carousel", "grid", "list"]).optional(),
        isActive: z.boolean().optional(),
        displayOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const { id, ...data } = input;
          await updateDisplaySection(id, data);
          return { success: true, message: "تم تحديث قسم العرض بنجاح" };
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "فشل تحديث قسم العرض",
          });
        }
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        try {
          await deleteDisplaySection(input.id);
          return { success: true, message: "تم حذف قسم العرض بنجاح" };
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "فشل حذف قسم العرض",
          });
        }
      }),

    addSeries: adminProcedure
      .input(z.object({
        seriesId: z.number(),
        displaySectionId: z.number(),
      }))
      .mutation(async ({ input }) => {
        try {
          await addSeriesToDisplaySection(input.seriesId, input.displaySectionId);
          return { success: true, message: "تم إضافة المسلسل لقسم العرض بنجاح" };
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "فشل إضافة المسلسل",
          });
        }
      }),

    removeSeries: adminProcedure
      .input(z.object({
        seriesId: z.number(),
        displaySectionId: z.number(),
      }))
      .mutation(async ({ input }) => {
        try {
          await removeSeriesFromDisplaySection(input.seriesId, input.displaySectionId);
          return { success: true, message: "تم إزالة المسلسل من قسم العرض بنجاح" };
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "فشل إزالة المسلسل",
          });
        }
      }),
  }),

  // ==================== Seed Real Data ====================
  seedRealData: adminProcedure.mutation(async () => {
    try {
      const { createSeries, createEpisode, addSeriesToCategory, getCategories } = await import("./db");
      
      // إضافة مسلسلات حقيقية
      const seriesData = [
        {
          titleAr: "صراع العروش",
          title: "Game of Thrones",
          descriptionAr: "ملحمة درامية عن الصراع على العرش",
          description: "Epic drama about the struggle for the throne",
          genre: "Drama",
          posterUrl: "https://via.placeholder.com/300x450?text=Game+of+Thrones",
          totalSeasons: 8,
          totalEpisodes: 73,
        },
        {
          titleAr: "الأصدقاء",
          title: "Friends",
          descriptionAr: "مسلسل كوميدي عن مجموعة أصدقاء",
          description: "Comedy about a group of friends",
          genre: "Comedy",
          posterUrl: "https://via.placeholder.com/300x450?text=Friends",
          totalSeasons: 10,
          totalEpisodes: 236,
        },
        {
          titleAr: "مسلسل الرجل العنكبوت",
          title: "Spider-Man",
          descriptionAr: "مسلسل أكشن عن الرجل العنكبوت",
          description: "Action series about Spider-Man",
          genre: "Action",
          posterUrl: "https://via.placeholder.com/300x450?text=Spider-Man",
          totalSeasons: 3,
          totalEpisodes: 39,
        },
      ];

      const createdSeries: any[] = [];
      for (const series of seriesData) {
        const result = await createSeries(series);
        createdSeries.push(result);
      }

      // إضافة حلقات لأول مسلسل
      if (createdSeries.length > 0) {
        const firstSeriesId = (createdSeries[0] as any).id;
        for (let i = 1; i <= 5; i++) {
          await createEpisode({
            seriesId: firstSeriesId,
            season: 1,
            episodeNumber: i,
            titleAr: `الحلقة ${i}`,
            title: `Episode ${i}`,
            descriptionAr: `وصف الحلقة ${i}`,
            description: `Description of episode ${i}`,
            videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            videoType: "youtube",
          });
        }
      }

      // الحصول على الأقسام
      const categories = await getCategories();

      // ربط المسلسلات بالأقسام
      for (let i = 0; i < createdSeries.length && i < categories.length; i++) {
        await addSeriesToCategory((createdSeries[i] as any).id, (categories[i] as any).id);
      }

      return {
        success: true,
        message: `تم إضافة ${createdSeries.length} مسلسلات حقيقية بنجاح!`,
        seriesCount: createdSeries.length,
      };
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "فشل إضافة البيانات",
      });
    }
  }),
  // ==================== Likes ====================
  likes: router({
    addLike: protectedProcedure
      .input(z.object({ seriesId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.id) throw new TRPCError({ code: 'UNAUTHORIZED' });
        const result = await addLike(ctx.user.id, input.seriesId);
        if (!result.success) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: result.message });
        }
        return result;
      }),
    
    removeLike: protectedProcedure
      .input(z.object({ seriesId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.id) throw new TRPCError({ code: 'UNAUTHORIZED' });
        return await removeLike(ctx.user.id, input.seriesId);
      }),
    
    getLikeCount: publicProcedure
      .input(z.object({ seriesId: z.number() }))
      .query(async ({ input }) => {
        return await getLikeCount(input.seriesId);
      }),
    
    isLiked: protectedProcedure
      .input(z.object({ seriesId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user?.id) return false;
        return await isLikedByUser(ctx.user.id, input.seriesId);
      }),
    
    getTopRated: publicProcedure
      .input(z.object({ limit: z.number().default(5) }))
      .query(async ({ input }) => {
        return await getTopRatedSeries(input.limit);
      }),
    
    getLatest: publicProcedure
      .input(z.object({ limit: z.number().default(6) }))
      .query(async ({ input }) => {
        return await getLatestSeries(input.limit);
      }),
  }),
});
export type AppRouter = typeof appRouter;

export const ADMIN_SECRET_CODE = "hemohemo@12";
