import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getAllSeries, getSeriesById, getEpisodesBySeriesId, getEpisodeById, registerUser, loginWithEmail } from "./db";
import { TRPCError } from "@trpc/server";

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
  }),
});

export type AppRouter = typeof appRouter;
