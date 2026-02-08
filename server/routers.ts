import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { 
  getAllSeries, getSeriesById, getEpisodesBySeriesId, getEpisodeById, 
  registerUser, loginWithEmail, createSeries, updateSeries, deleteSeries,
  createEpisode, updateEpisode, deleteEpisode,
  addFavorite, removeFavorite, getUserFavorites, isFavorite,
  addSeriesImage, getSeriesImages, deleteSeriesImage, setDefaultImage,
  createChannel, getAllChannels, getChannelById, updateChannel, deleteChannel,
  updateSeriesPromo, getSeriesPromo,
  createUploadedVideo, getUploadedVideoByEpisodeId, updateEpisodeVideo, deleteUploadedVideo
} from "./db";
import { storagePut } from "./storage";
import { TRPCError } from "@trpc/server";

// إنشاء adminProcedure للعمليات الإدارية فقط
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user?.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'ليس لديك صلاحيات إدارية' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
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
          
          // إنشاء session cookie
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.setHeader("Set-Cookie", `${COOKIE_NAME}=${user.id}; ${Object.entries(cookieOptions)
            .map(([key, value]) => `${key}=${value}`)
            .join("; ")}`);

          return { 
            success: true, 
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
            }
          };
        } catch (error: any) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: error.message || "فشل تسجيل الدخول",
          });
        }
      }),
  }),

  series: router({
    list: protectedProcedure.query(async () => {
      return await getAllSeries();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getSeriesById(input.id);
      }),

    getEpisodes: protectedProcedure
      .input(z.object({ 
        seriesId: z.number(),
        season: z.number().optional()
      }))
      .query(async ({ input }) => {
        return await getEpisodesBySeriesId(input.seriesId, input.season);
      }),

    getEpisode: protectedProcedure
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
        totalSeasons: z.number().optional().default(1),
        currentSeason: z.number().optional().default(1),
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
            totalSeasons: input.totalSeasons,
            currentSeason: input.currentSeason,
            totalEpisodes: 0,
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
        videoUrl: z.string().url("رابط الفيديو غير صحيح"),
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
        videoUrl: z.string().url().optional(),
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
          await addFavorite(ctx.user.id, input.seriesId);
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
          await removeFavorite(ctx.user.id, input.seriesId);
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
          const favorites = await getUserFavorites(ctx.user.id);
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
          const result = await isFavorite(ctx.user.id, input.seriesId);
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
        fileBuffer: z.instanceof(Buffer),
        fileSize: z.number(),
        mimeType: z.string(),
        duration: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          // رفع الملف إلى S3
          const fileKey = `videos/episode-${input.episodeId}-${Date.now()}-${input.fileName}`;
          const { url } = await storagePut(fileKey, input.fileBuffer, input.mimeType);

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
});

export type AppRouter = typeof appRouter;
