import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/jwt";
import { ok, ApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return ApiError.badRequest("token is required");
    }

    const hashed = hashToken(token);

    // ── Find the auth record with this token ─────────────
    const auth = await db.userAuth.findFirst({
      where: {
        email_verification_token: hashed,
        email_verification_token_expires: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!auth) {
      return ApiError.badRequest(
        "Verification token is invalid or has expired",
      );
    }

    if (auth.user.email_verified) {
      return ok({ message: "Email is already verified" });
    }

    // ── Mark as verified ─────────────────────────────────
    const now = new Date();
    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: auth.user_id },
        data: { email_verified: true, email_verified_at: now },
      });
      await tx.userAuth.update({
        where: { id: auth.id },
        data: {
          email_verification_token: null,
          email_verification_token_expires: null,
        },
      });
    });

    return ok({
      message: "Email verified successfully",
      user: {
        id: auth.user.id,
        email_verified: true,
        email_verified_at: now,
      },
    });
  } catch (err) {
    console.error("[POST /auth/verify-email]", err);
    return ApiError.internal();
  }
}
