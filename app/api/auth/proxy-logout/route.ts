import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  const safeCookies = cookieStore as any;

  // Clear local cookies that control middleware access
  safeCookies.delete("access_token");
  safeCookies.delete("refresh_token");
  safeCookies.delete("user_role");

  // In a full implementation, you'd also optionally call the backend /auth/logout
  // endpoint to blacklist the refresh token on the database side.
  // For now, removing the cookies is enough to safely log the user out of the frontend.

  return NextResponse.json({ message: "Logged out successfully" });
}
