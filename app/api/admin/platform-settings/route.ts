import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, ApiError } from "@/lib/api-response";
import { authenticate, isAuthenticated } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticate(req);
    if (!isAuthenticated(auth)) return auth;
    if (auth.role !== "admin") {
      return ApiError.forbidden();
    }

    const settings = await db.platformSetting.findMany({
      select: {
        key: true,
        value: true,
        description: true,
        updated_at: true,
      },
    });

    // Convert to key-value object
    const settingsObj = settings.reduce(
      (acc: Record<string, string>, setting: { key: string; value: string }) => {
        acc[setting.key] = setting.value;
        return acc;
      },
      {} as Record<string, string>
    );

    return ok({ data: settingsObj });
  } catch (error) {
    console.error("Error fetching platform settings:", error);
    return ApiError.internal("Failed to fetch platform settings");
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await authenticate(req);
    if (!isAuthenticated(auth)) return auth;
    if (auth.role !== "admin") {
      return ApiError.forbidden();
    }

    const body = await req.json();

    // Update each setting
    const updates = Object.entries(body).map(([key, value]) =>
      db.platformSetting.upsert({
        where: { key },
        update: {
          value: String(value),
          updated_by: auth.sub,
        },
        create: {
          key,
          value: String(value),
          updated_by: auth.sub,
        },
      })
    );

    await Promise.all(updates);

    return ok({ data: { message: "Settings updated successfully" } });
  } catch (error) {
    console.error("Error updating platform settings:", error);
    return ApiError.internal("Failed to update platform settings");
  }
}
