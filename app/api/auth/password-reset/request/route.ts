import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { generateOpaqueToken, hashToken } from "@/lib/jwt";
import { sendPasswordResetEmail } from "@/lib/email";
import { ok, ApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return ApiError.badRequest("email is required");
    }

    // Always return success to prevent email enumeration
    const user = await db.user.findUnique({
      where: { email },
      include: { auth: true },
    });

    if (user && user.auth && user.auth.auth_provider === "local") {
      const token = generateOpaqueToken();
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.userAuth.update({
        where: { user_id: user.id },
        data: {
          password_reset_token: hashToken(token),
          password_reset_expires: expires,
        },
      });

      sendPasswordResetEmail(email, token).catch(console.error);
    }

    return ok({
      message:
        "If an account with that email exists, a reset link has been sent",
    });
  } catch (err) {
    console.error("[POST /auth/password-reset/request]", err);
    return ApiError.internal();
  }
}
