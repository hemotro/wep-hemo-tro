import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { processVideo } from "@/lib/videoProcessor";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function UploadVideo() {
  const { episodeId } = useParams<{ episodeId: string }>();
  const [, navigate] = useLocation();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [uploadedUrls, setUploadedUrls] = useState<{
    video1080p?: string;
    video720p?: string;
    video480p?: string;
  }>({});

  // TODO: Add updateEpisodeWithQualities mutation
  const updateEpisodeMutation = trpc.episodes.update.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("video/")) {
        setVideoFile(file);
        toast.success("تم اختيار الفيديو بنجاح");
      } else {
        toast.error("يرجى اختيار ملف فيديو صحيح");
      }
    }
  };

  const handleProcessVideo = async () => {
    if (!videoFile) {
      toast.error("يرجى اختيار ملف فيديو أولاً");
      return;
    }

    setIsProcessing(true);
    try {
      toast.loading("جاري معالجة الفيديو...");

      const processedVideos = await processVideo(videoFile, (quality, prog) => {
        setProgress((prev) => ({ ...prev, [quality]: prog }));
      });

      // رفع الفيديوهات إلى Google Cloud Storage
      const urls: Record<string, string> = {};

      // رفع 1080p
      const form1080p = new FormData();
      form1080p.append("file", processedVideos.video1080p, "video_1080p.mp4");
      form1080p.append("quality", "1080p");
      form1080p.append("episodeId", episodeId || "");

      const res1080p = await fetch("/api/upload-video", {
        method: "POST",
        body: form1080p,
      });
      const data1080p = await res1080p.json();
      urls.video1080p = data1080p.url;

      // رفع 720p
      const form720p = new FormData();
      form720p.append("file", processedVideos.video720p, "video_720p.mp4");
      form720p.append("quality", "720p");
      form720p.append("episodeId", episodeId || "");

      const res720p = await fetch("/api/upload-video", {
        method: "POST",
        body: form720p,
      });
      const data720p = await res720p.json();
      urls.video720p = data720p.url;

      // رفع 480p
      const form480p = new FormData();
      form480p.append("file", processedVideos.video480p, "video_480p.mp4");
      form480p.append("quality", "480p");
      form480p.append("episodeId", episodeId || "");

      const res480p = await fetch("/api/upload-video", {
        method: "POST",
        body: form480p,
      });
      const data480p = await res480p.json();
      urls.video480p = data480p.url;

      setUploadedUrls(urls);

      // تحديث الحلقة بروابط الفيديوهات
      if (episodeId) {
        await updateEpisodeMutation.mutateAsync({
          id: parseInt(episodeId),
          videoUrl: urls.video720p, // استخدام 720p كـ default
        });

        toast.success("تم تحميل الفيديو بنجاح!");
        navigate("/admin", { replace: true });
      }
    } catch (error) {
      console.error("Error processing video:", error);
      toast.error("حدث خطأ أثناء معالجة الفيديو");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-6 text-center">تحميل الفيديو</h1>

          {/* اختيار الملف */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">اختر ملف الفيديو</label>
            <Input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              disabled={isProcessing}
              className="cursor-pointer"
            />
            {videoFile && (
              <p className="text-sm text-muted-foreground mt-2">
                الملف المختار: {videoFile.name}
              </p>
            )}
          </div>

          {/* شريط التقدم */}
          {isProcessing && (
            <div className="mb-6 space-y-4">
              <h3 className="font-semibold">جاري المعالجة...</h3>
              {["1080p", "720p", "480p"].map((quality) => (
                <div key={quality}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{quality}</span>
                    <span className="text-sm text-muted-foreground">
                      {progress[quality] || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${progress[quality] || 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* الروابط المرفوعة */}
          {Object.keys(uploadedUrls).length > 0 && (
            <div className="mb-6 p-4 bg-secondary rounded-lg">
              <h3 className="font-semibold mb-3">الفيديوهات المرفوعة:</h3>
              <div className="space-y-2 text-sm">
                {uploadedUrls.video1080p && (
                  <p>
                    <strong>1080p:</strong> ✓ تم الرفع
                  </p>
                )}
                {uploadedUrls.video720p && (
                  <p>
                    <strong>720p:</strong> ✓ تم الرفع
                  </p>
                )}
                {uploadedUrls.video480p && (
                  <p>
                    <strong>480p:</strong> ✓ تم الرفع
                  </p>
                )}
              </div>
            </div>
          )}

          {/* الأزرار */}
          <div className="flex gap-3">
            <Button
              onClick={handleProcessVideo}
              disabled={!videoFile || isProcessing}
              className="flex-1"
            >
              {isProcessing ? "جاري المعالجة..." : "معالجة الفيديو"}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/admin", { replace: true })}
              disabled={isProcessing}
              className="flex-1"
            >
              إلغاء
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
