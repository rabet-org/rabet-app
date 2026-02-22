import { NextRequest } from "next/server";
import { verifyAccessToken, JwtPayload } from "@/lib/jwt";
import { ApiError } from "@/lib/api-response";

/**
 * Authenticate a request via Bearer token.
 * Returns the JWT payload on success, or a NextResponse error on failure.
 */
export async function authenticate(
  req: NextRequest,
): Promise<JwtPayload | Response> {
  let token = "";

  // 1. Check Authorization header
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }

  // 2. Fallback to HttpOnly cookie (for Client Component fetches)
  if (!token) {
    token = req.cookies.get("access_token")?.value || "";
  }

  if (!token) {
    return ApiError.unauthorized();
  }

  try {
    return verifyAccessToken(token);
  } catch {
    return ApiError.unauthorized("Invalid or expired access token");
  }
}

/**
 * Helper to check if authenticate() returned a user payload or an error response.
 */
export function isAuthenticated(
  result: JwtPayload | Response,
): result is JwtPayload {
  return !(result instanceof Response);
}

/**
 * Require a specific role. Returns an error response if the user doesn't have it.
 */
export function requireRole(payload: JwtPayload, ...roles: string[]) {
  if (!roles.includes(payload.role)) {
    return ApiError.forbidden(
      `This action requires one of the following roles: ${roles.join(", ")}`,
    );
  }
  return null;
}
