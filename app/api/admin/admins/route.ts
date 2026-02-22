import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ok, created, ApiError } from "@/lib/api-response";
import { hashPassword } from "@/lib/password";
import { sendAdminWelcomeEmail } from "@/lib/email";
import { AdminActionType } from "@prisma/client";

/**
 * GET /api/admin/admins
 * Returns all admin-role users.
 */
export async function GET(req: NextRequest) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "admin");
    if (roleError) return roleError;

    const admins = await db.user.findMany({
      where: { role: "admin" },
      select: {
        id: true,
        email: true,
        is_blocked: true,
        email_verified: true,
        created_at: true,
        profile: { select: { full_name: true, avatar_url: true, phone: true } },
      },
      orderBy: { created_at: "asc" },
    });

    return ok(admins);
  } catch (err) {
    console.error("[GET /api/admin/admins]", err);
    return ApiError.internal();
  }
}

/**
 * POST /api/admin/admins
 * Creates a new admin account.
 * Body: { email, full_name }
 * Auto-generates a temporary password, sends welcome email, writes audit log.
 */
export async function POST(req: NextRequest) {
  try {
    const actorPayload = await authenticate(req);
    if (!isAuthenticated(actorPayload)) return actorPayload;

    const roleError = requireRole(actorPayload, "admin");
    if (roleError) return roleError;

    const body = await req.json();
    const { email, full_name, phone } = body;

    if (!email || !full_name) {
      return ApiError.badRequest("email and full_name are required");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return ApiError.badRequest("Invalid email format");
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return ApiError.conflict("An account with this email already exists");
    }

    // Generate a secure temporary password
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
    const tempPassword =
      "Admin@" +
      Array.from({ length: 8 }, () =>
        chars.charAt(Math.floor(Math.random() * chars.length)),
      ).join("");

    const password_hash = await hashPassword(tempPassword);

    // Create user atomically
    const newAdmin = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          role: "admin",
          email_verified: true, // admin-created accounts are pre-verified
          auth: {
            create: {
              password_hash,
              auth_provider: "local",
            },
          },
          profile: {
            create: {
              full_name,
              phone: phone ?? null,
            },
          },
        },
        select: {
          id: true,
          email: true,
          role: true,
          email_verified: true,
          created_at: true,
          profile: { select: { full_name: true, avatar_url: true } },
        },
      });

      // Audit log
      await tx.adminLog.create({
        data: {
          admin_id: actorPayload.sub,
          action_type: AdminActionType.create_admin,
          target_type: "user",
          target_id: user.id,
          details: { email, full_name, created_by: actorPayload.email },
        },
      });

      return user;
    });

    // Send welcome email (non-blocking)
    sendAdminWelcomeEmail(email, full_name, tempPassword).catch(console.error);

    return created({
      admin: newAdmin,
      temp_password: tempPassword, // returned once so the creator can share it if email fails
    });
  } catch (err) {
    console.error("[POST /api/admin/admins]", err);
    return ApiError.internal();
  }
}
