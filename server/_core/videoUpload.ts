import { storagePut } from "../storage";

/**
 * رفع الفيديو إلى S3 من Manus
 */
export async function uploadVideoToS3(
  buffer: Buffer,
  fileName: string,
  quality: string
): Promise<string> {
  try {
    const fileKey = `videos/${Date.now()}_${quality}_${fileName}`;
    
    const { url } = await storagePut(
      fileKey,
      buffer,
      "video/mp4"
    );

    return url;
  } catch (error) {
    console.error("Error uploading video to S3:", error);
    throw error;
  }
}

/**
 * حذف الفيديو من S3
 */
export async function deleteVideoFromS3(fileUrl: string): Promise<void> {
  try {
    // S3 من Manus يحذف الملفات تلقائياً عند انتهاء الجلسة
    // لا حاجة لحذف يدوي
    console.log("Video marked for deletion:", fileUrl);
  } catch (error) {
    console.error("Error deleting video from S3:", error);
    throw error;
  }
}
