import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { storagePut } from "./storage";
import { addSeriesImage, getSeriesImages, deleteSeriesImage, setDefaultImage, updateSeriesImage } from "./db";

export const imageRouter = router({
  // رفع صورة جديدة
  uploadImage: adminProcedure
    .input(z.object({
      seriesId: z.number(),
      imageType: z.enum(["banner", "poster", "cover"]),
      imageBase64: z.string(),
      fileName: z.string(),
      mimeType: z.string(),
      alt: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        // تحويل Base64 إلى Buffer
        const buffer = Buffer.from(input.imageBase64, "base64");

        // رفع إلى S3
        const fileKey = `series/${input.seriesId}/${input.imageType}-${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        // حفظ في قاعدة البيانات
        const result = await addSeriesImage({
          seriesId: input.seriesId,
          imageType: input.imageType,
          imageUrl: url,
          alt: input.alt || input.fileName,
          isDefault: false,
          displayOrder: 0,
        });

        return {
          success: true,
          message: "تم رفع الصورة بنجاح",
          imageUrl: url,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "فشل رفع الصورة",
        });
      }
    }),

  // الحصول على صور المسلسل
  getSeriesImages: publicProcedure
    .input(z.object({
      seriesId: z.number(),
    }))
    .query(async ({ input }) => {
      try {
        const images = await getSeriesImages(input.seriesId);
        return {
          success: true,
          images,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "فشل جلب الصور",
        });
      }
    }),

  // حذف صورة
  deleteImage: adminProcedure
    .input(z.object({
      imageId: z.number(),
    }))
    .mutation(async ({ input }) => {
      try {
        await deleteSeriesImage(input.imageId);
        return {
          success: true,
          message: "تم حذف الصورة بنجاح",
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "فشل حذف الصورة",
        });
      }
    }),

  // تعيين صورة كافتراضية
  setDefaultImage: adminProcedure
    .input(z.object({
      seriesId: z.number(),
      imageId: z.number(),
    }))
    .mutation(async ({ input }) => {
      try {
        await setDefaultImage(input.seriesId, input.imageId);
        return {
          success: true,
          message: "تم تعيين الصورة كافتراضية بنجاح",
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "فشل تعيين الصورة الافتراضية",
        });
      }
    }),

  // تحديث بيانات الصورة
  updateImage: adminProcedure
    .input(z.object({
      imageId: z.number(),
      alt: z.string().optional(),
      displayOrder: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const { imageId, ...data } = input;
        await updateSeriesImage(imageId, data);
        return {
          success: true,
          message: "تم تحديث الصورة بنجاح",
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "فشل تحديث الصورة",
        });
      }
    }),
});
