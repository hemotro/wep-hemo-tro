import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;

/**
 * تهيئة FFmpeg
 */
export async function initFFmpeg() {
  if (ffmpeg?.loaded) {
    return ffmpeg;
  }

  ffmpeg = new FFmpeg();

  const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm";
  ffmpeg.on("log", ({ type, message }) => {
    console.log(`[FFmpeg ${type}]`, message);
  });

  ffmpeg.on("progress", ({ progress, time }) => {
    console.log(`Progress: ${(progress * 100).toFixed(2)}% (${time}ms)`);
  });

  try {
    await ffmpeg.load({
      coreURL: `${baseURL}/ffmpeg-core.js`,
      wasmURL: `${baseURL}/ffmpeg-core.wasm`,
      workerURL: `${baseURL}/ffmpeg-core.worker.js`,
    });
  } catch (error) {
    console.error("Failed to load FFmpeg:", error);
    throw error;
  }

  return ffmpeg;
}

/**
 * معالجة الفيديو وتحويله إلى جودات متعددة
 */
export async function processVideo(
  videoFile: File,
  onProgress?: (quality: string, progress: number) => void
): Promise<{
  video1080p: Blob;
  video720p: Blob;
  video480p: Blob;
}> {
  const ff = await initFFmpeg();

  if (!ff.loaded) {
    throw new Error("FFmpeg is not loaded");
  }

  const inputName = `input_${Date.now()}.mp4`;
  const output1080p = `output_1080p_${Date.now()}.mp4`;
  const output720p = `output_720p_${Date.now()}.mp4`;
  const output480p = `output_480p_${Date.now()}.mp4`;

  try {
    // كتابة الملف المدخل
    await ff.writeFile(inputName, await fetchFile(videoFile));

    // معالجة 1080p
    onProgress?.("1080p", 0);
    await ff.exec([
      "-i",
      inputName,
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "23",
      "-s",
      "1920x1080",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      output1080p,
    ]);
    onProgress?.("1080p", 100);

    // معالجة 720p
    onProgress?.("720p", 0);
    await ff.exec([
      "-i",
      inputName,
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "23",
      "-s",
      "1280x720",
      "-c:a",
      "aac",
      "-b:a",
      "96k",
      output720p,
    ]);
    onProgress?.("720p", 100);

    // معالجة 480p
    onProgress?.("480p", 0);
    await ff.exec([
      "-i",
      inputName,
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "28",
      "-s",
      "854x480",
      "-c:a",
      "aac",
      "-b:a",
      "64k",
      output480p,
    ]);
    onProgress?.("480p", 100);

    // قراءة الملفات المعالجة
    const video1080pData = (await ff.readFile(output1080p)) as Uint8Array;
    const video720pData = (await ff.readFile(output720p)) as Uint8Array;
    const video480pData = (await ff.readFile(output480p)) as Uint8Array;

    // تحويل إلى Blob
    const video1080p = new Blob([new Uint8Array(video1080pData)], { type: "video/mp4" });
    const video720p = new Blob([new Uint8Array(video720pData)], { type: "video/mp4" });
    const video480p = new Blob([new Uint8Array(video480pData)], { type: "video/mp4" });

    // حذف الملفات المؤقتة
    await ff.deleteFile(inputName);
    await ff.deleteFile(output1080p);
    await ff.deleteFile(output720p);
    await ff.deleteFile(output480p);

    return {
      video1080p,
      video720p,
      video480p,
    };
  } catch (error) {
    console.error("Error processing video:", error);
    throw error;
  }
}
