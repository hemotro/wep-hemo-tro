import { Request, Response } from "express";
import { COOKIE_NAME } from "@shared/const";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRY = "7d";

export interface SessionPayload {
  userId: number;
  id?: number;
  email: string;
  name: string;
  role?: string;
}

class SDK {
  /**
   * إنشاء JWT token للجلسة
   */
  createSessionToken(payload: SessionPayload): string {
    const payloadWithId = {
      ...payload,
      id: payload.id || payload.userId,
    };
    return jwt.sign(payloadWithId, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  }

  /**
   * التحقق من JWT token
   */
  verifySessionToken(token: string): SessionPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as SessionPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * استخراج الـ cookie من الطلب
   */
  getSessionCookie(req: Request): string | null {
    const cookies = req.headers.cookie || "";
    const cookieArray = cookies.split(";");
    
    for (const cookie of cookieArray) {
      const [name, value] = cookie.trim().split("=");
      if (name === COOKIE_NAME && value) {
        return decodeURIComponent(value);
      }
    }
    
    return null;
  }

  /**
   * حفظ الجلسة في الـ cookie
   */
  setSessionCookie(res: Response, token: string): void {
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });
  }

  /**
   * حذف الجلسة من الـ cookie
   */
  clearSessionCookie(res: Response): void {
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: -1,
      path: "/",
    });
  }

  /**
   * التحقق من الجلسة
   */
  async authenticateRequest(req: Request): Promise<any | null> {
    const token = this.getSessionCookie(req);
    if (!token) {
      return null;
    }

    const session = this.verifySessionToken(token);
    if (!session) {
      return null;
    }

    return session;
  }
}

export const sdk = new SDK();
