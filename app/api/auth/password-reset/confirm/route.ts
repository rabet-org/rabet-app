import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/jwt";
import { hashPassword, isStrongPassword } from "@/lib/password";
import { ok, ApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, new_password } = body;

    if (!token || !new_password) {
      return ApiError.badRequest("token and new_password are required");
    }

    if (!isStrongPassword(new_password)) {
      return ApiError.badRequest(
        "Password must be at least 8 characters with one uppercase letter and one digit",
      );
    }

    const hashed = hashToken(token);

    const auth = await db.userAuth.findFirst({
      where: {
        password_reset_token: hashed,
        password_reset_expires: { gt: new Date() },
      },
    });

    if (!auth) {
      return ApiError.badRequest("Reset token is invalid or has expired");
    }

    const newHash = await hashPassword(new_password);

    await db.$transaction(async (tx) => {
      await tx.userAuth.update({
        where: { id: auth.id },
        data: {
          password_hash: newHash,
          password_reset_token: null,
          password_reset_expires: null,
        },
      });
      // Revoke all existing refresh tokens to force re-login everywhere
      await tx.refreshToken.updateMany({
        where: { user_id: auth.user_id, revoked: false },
        data: { revoked: true, revoked_at: new Date() },
      });
    });

    return ok({ message: "Password reset successfully" });
  } catch (err) {
    console.error("[POST /auth/password-reset/confirm]", err);
    return ApiError.internal();
  }
}
