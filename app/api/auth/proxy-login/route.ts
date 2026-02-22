import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // Forward the request to our backend login endpoint
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          message: data.message || data.error?.message || "Invalid credentials",
        },
        { status: res.status },
      );
    }

    // Set the cookie!
    // We use Next.js cookies API to set an HttpOnly secure cookie
    const cookieStore = await cookies();

    // Using an assertion to bypass strict TS complaining about .set on a promise,
    // even though we awaited it (some Type definitions are lagging).
    const safeCookies = cookieStore as any;

    safeCookies.set("access_token", data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: data.expires_in, // 30 mins
      path: "/",
    });

    safeCookies.set("refresh_token", data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    // Also set a non-httponly cookie with role for client side navigation hints
    safeCookies.set("user_role", data.user?.role || "client", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: data.expires_in,
      path: "/",
    });

    return NextResponse.json({ ...data, message: "Logged in securely" });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
