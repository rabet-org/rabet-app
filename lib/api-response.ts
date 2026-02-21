import { NextResponse } from "next/server";

// ─── Success responses ────────────────────────────────────

export function ok(data: object, status = 200) {
  return NextResponse.json(data, { status });
}

export function created(data: object) {
  return NextResponse.json(data, { status: 201 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

// ─── Error responses ──────────────────────────────────────

interface ErrorOptions {
  code: string;
  message: string;
  details?: object;
  status: number;
}

function error({ code, message, details, status }: ErrorOptions) {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status },
  );
}

export const ApiError = {
  badRequest: (message: string, details?: object) =>
    error({ code: "BAD_REQUEST", message, details, status: 400 }),

  unauthorized: (message = "Authentication required") =>
    error({ code: "UNAUTHORIZED", message, status: 401 }),

  forbidden: (message = "Insufficient permissions") =>
    error({ code: "FORBIDDEN", message, status: 403 }),

  notFound: (message = "Resource not found") =>
    error({ code: "NOT_FOUND", message, status: 404 }),

  conflict: (message: string) =>
    error({ code: "CONFLICT", message, status: 409 }),

  unprocessable: (message: string) =>
    error({ code: "UNPROCESSABLE", message, status: 422 }),

  internal: (message = "Internal server error") =>
    error({ code: "INTERNAL_ERROR", message, status: 500 }),
};
