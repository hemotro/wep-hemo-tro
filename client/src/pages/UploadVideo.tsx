import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { processVideo } from "@/lib/videoProcessor";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Upload, AlertCircle } from "lucide-react";

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
    video360p?: string;
  }>({});

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

  const uploadToS3 = async (blob: Blob, quality: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", blob, `video_${quality}.mp4`);
    formData.append("quality", quality);

    const response = await fetch("/api/upload-video", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`فشل رفع الفيديو بجودة ${quality}`);
    }

    const data = await response.json();
    return data.url;
  };

  const handleProcessVideo = async () => {
    if (!videoFile) {
      toast.error("يرجى اختيار ملف فيديو أولاً");
      return;
    }

    if (!episodeId) {
      toast.error("معرّف الحلقة غير صحيح");
      return;
    }

    setIsProcessing(true);
    try {
      toast.loading("جاري معالجة الفيديو...");

      // معالجة الفيديو إلى جودات متعددة
      const processedVideos = await processVideo(videoFile, (quality, prog) => {
        setProgress((prev) => ({ ...prev, [quality]: prog }));
      });

      toast.loading("جاري رفع الفيديوهات إلى السحابة...");

      // رفع الفيديوهات إلى S3
      const urls: Record<string, string> = {};

      // رفع 1080p
      try {
        urls.video1080p = await uploadToS3(processedVideos.video1080p, "1080p");
        toast.success("تم رفع 1080p بنجاح");
      } catch (error) {
        console.error("Error uploading 1080p:", error);
        toast.error("فشل رفع 1080p");
      }

      // رفع 720p
      try {
        urls.video720p = await uploadToS3(processedVideos.video720p, "720p");
        toast.success("تم رفع 720p بنجاح");
      } catch (error) {
        console.error("Error uploading 720p:", error);
        toast.error("فشل رفع 720p");
      }

      // رفع 480p
      try {
        urls.video480p = await uploadToS3(processedVideos.video480p, "480p");
        toast.success("تم رفع 480p بنجاح");
      } catch (error) {
        console.error("Error uploading 480p:", error);
        toast.error("فشل رفع 480p");
      }

      // رفع 360p
      try {
        urls.video360p = await uploadToS3(processedVideos.video360p, "360p");
        toast.success("تم رفع 360p بنجاح");
      } catch (error) {
        console.error("Error uploading 360p:", error);
        toast.error("فشل رفع 360p");
      }

      setUploadedUrls(urls);

      // تحديث الحلقة بروابط الفيديوهات
      if (episodeId && urls.video720p) {
        await updateEpisodeMutation.mutateAsync({
          id: parseInt(episodeId),
          videoUrl: urls.video720p,
          video1080pUrl: urls.video1080p,
          video720pUrl: urls.video720p,
          video480pUrl: urls.video480p,
        });

        toast.success("تم تحميل الفيديو بنجاح!");
        // حفظ رابط 360p في localStorage للمرجع
        if (urls.video360p) {
          localStorage.setItem(`episode-${episodeId}-360p`, urls.video360p);
        }
        setTimeout(() => {
          navigate("/admin", { replace: true });
        }, 2000);
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
          <div className="flex items-center gap-2 mb-6">
            <Upload className="w-6 h-6" />
            <h1 className="text-2xl font-bold">تحميل الفيديو متعدد الجودات</h1>
          </div>

          {/* تنبيه معلومات */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">معلومات مهمة:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>سيتم تحويل الفيديو تلقائياً إلى 4 جودات (1080p, 720p, 480p, 360p)</li>
                <li>قد تستغرق المعالجة عدة دقائق حسب حجم الملف</li>
                <li>تأكد من استقرار اتصالك بالإنترنت</li>
              </ul>
            </div>
          </div>

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
                ✓ الملف المختار: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* شريط التقدم - المعالجة */}
          {isProcessing && Object.keys(progress).length > 0 && (
            <div className="mb-6 space-y-4">
              <h3 className="font-semibold">جاري المعالجة والرفع...</h3>
              {["1080p", "720p", "480p", "360p"].map((quality) => {
                if (progress[quality] === undefined) return null;
                return (
                  <div key={quality}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">⚙️ معالجة {quality}</span>
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
                );
              })}
            </div>
          )}

          {/* الروابط المرفوعة */}
          {Object.keys(uploadedUrls).length > 0 && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold mb-3 text-green-900">الفيديوهات المرفوعة بنجاح:</h3>
              <div className="space-y-2 text-sm">
                {uploadedUrls.video1080p && (
                  <p className="text-green-800">
                    <strong>1080p:</strong> ✓ تم الرفع
                  </p>
                )}
                {uploadedUrls.video720p && (
                  <p className="text-green-800">
                    <strong>720p:</strong> ✓ تم الرفع
                  </p>
                )}
                {uploadedUrls.video480p && (
                  <p className="text-green-800">
                    <strong>480p:</strong> ✓ تم الرفع
                  </p>
                )}
                {uploadedUrls.video360p && (
                  <p className="text-green-800">
                    <strong>360p:</strong> ✓ تم الرفع
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
              {isProcessing ? "جاري المعالجة..." : "معالجة ورفع الفيديو"}
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
