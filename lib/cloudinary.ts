import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  url: string;
  public_id: string;
  format: string;
  bytes: number;
}

/**
 * Upload a file buffer to Cloudinary.
 * @param buffer - Raw file buffer
 * @param folder - Cloudinary folder path (e.g. "provider-docs")
 * @param resourceType - "image" | "raw" (for PDFs, docs)
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  resourceType: "image" | "raw" = "image",
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        allowed_formats:
          resourceType === "image"
            ? ["jpg", "jpeg", "png", "webp"]
            : ["pdf", "doc", "docx"],
      },
      (error, result) => {
        if (error || !result)
          return reject(error ?? new Error("Upload failed"));
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          bytes: result.bytes,
        });
      },
    );
    stream.end(buffer);
  });
}

/**
 * Delete a file from Cloudinary by public_id.
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: "image" | "raw" = "image",
): Promise<void> {
  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
}

export default cloudinary;
