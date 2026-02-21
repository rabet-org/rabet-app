import { NextRequest } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { authenticate, isAuthenticated } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

/**
 * POST /api/upload
 * Generic file upload endpoint. Returns the Cloudinary URL.
 * Accepts multipart/form-data with a "file" field and optional "folder" field.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (!isAuthenticated(user)) return user;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) ?? "uploads";

    if (!file) {
      return ApiError.badRequest("file is required");
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return ApiError.badRequest("File size must not exceed 10MB");
    }

    // Determine resource type from mime
    const isImage = file.type.startsWith("image/");
    const isDoc = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ].includes(file.type);

    if (!isImage && !isDoc) {
      return ApiError.badRequest(
        "Only images (jpg, png, webp) and documents (pdf, doc, docx) are allowed",
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadToCloudinary(
      buffer,
      folder,
      isImage ? "image" : "raw",
    );

    return ok({
      url: result.url,
      public_id: result.public_id,
      format: result.format,
      bytes: result.bytes,
    });
  } catch (err) {
    console.error("[POST /api/upload]", err);
    return ApiError.internal();
  }
}
