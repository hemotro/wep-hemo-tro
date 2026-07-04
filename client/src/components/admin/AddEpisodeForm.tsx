import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload } from "lucide-react";

type VideoType = "youtube" | "m3u8" | "mp4" | "telegram";

interface FormData {
  seriesId: number;
  season: number;
  episodeNumber: number;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  videoType: VideoType;
  videoUrl: string;
}

export default function AddEpisodeForm() {
  const [formData, setFormData] = useState<FormData>({
    seriesId: 0,
    season: 1,
    episodeNumber: 1,
    title: "",
    titleAr: "",
    description: "",
    descriptionAr: "",
    videoType: "telegram",
    videoUrl: "",
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const createEpisodeMutation = trpc.episodes.create.useMutation({
    onSuccess: () => {
      console.log("تم إضافة الحلقة بنجاح");
      setFormData({
        seriesId: 0,
        season: 1,
        episodeNumber: 1,
        title: "",
        titleAr: "",
        description: "",
        descriptionAr: "",
        videoType: "telegram",
        videoUrl: "",
      });
      setVideoFile(null);
      setUploadProgress(0);
    },
    onError: (error) => {
      console.error("خطأ:", error.message);
    },
  });

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        console.error("حجم الملف كبير جداً (الحد الأقصى 500MB)");
        return;
      }
      setVideoFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      console.error("يجب إدخال عنوان الحلقة");
      return;
    }

    if (!formData.seriesId) {
      console.error("يجب اختيار مسلسل");
      return;
    }

    // التحقق من نوع الفيديو
    if (formData.videoType === "telegram" && !videoFile) {
      console.error("يجب اختيار ملف فيديو");
      return;
    }

    if (formData.videoType !== "telegram" && !formData.videoUrl.trim()) {
      console.error("يجب إدخال رابط الفيديو");
      return;
    }

    setIsLoading(true);
    try {
      let videoUrl = formData.videoUrl;

      // إذا كان نوع الفيديو Telegram، رفع الملف
      if (formData.videoType === "telegram" && videoFile) {
        const formDataToSend = new FormData();
        formDataToSend.append("file", videoFile);
        formDataToSend.append("title", formData.title);
        formDataToSend.append("titleAr", formData.titleAr);
        formDataToSend.append("description", formData.description);
        formDataToSend.append("descriptionAr", formData.descriptionAr);
        formDataToSend.append("seriesId", formData.seriesId.toString());
        formDataToSend.append("season", formData.season.toString());
        formDataToSend.append("episodeNumber", formData.episodeNumber.toString());

        const uploadResponse = await fetch("/api/upload-video", {
          method: "POST",
          body: formDataToSend,
        });

        if (!uploadResponse.ok) {
          throw new Error("فشل رفع الفيديو");
        }

        const uploadData = await uploadResponse.json();
        videoUrl = uploadData.url;
      }

      // إنشاء الحلقة
      await createEpisodeMutation.mutateAsync({
        seriesId: formData.seriesId,
        season: formData.season,
        episodeNumber: formData.episodeNumber,
        title: formData.title,
        titleAr: formData.titleAr,
        description: formData.description,
        descriptionAr: formData.descriptionAr,
        videoUrl: videoUrl,
        videoType: formData.videoType,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">معرف المسلسل</label>
          <Input
            type="number"
            placeholder="1"
            value={formData.seriesId}
            onChange={(e) =>
              setFormData({
                ...formData,
                seriesId: parseInt(e.target.value) || 0,
              })
            }
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">الموسم</label>
          <Input
            type="number"
            placeholder="1"
            value={formData.season}
            onChange={(e) =>
              setFormData({
                ...formData,
                season: parseInt(e.target.value) || 1,
              })
            }
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">رقم الحلقة</label>
          <Input
            type="number"
            placeholder="1"
            value={formData.episodeNumber}
            onChange={(e) =>
              setFormData({
                ...formData,
                episodeNumber: parseInt(e.target.value) || 1,
              })
            }
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">العنوان</label>
          <Input
            placeholder="عنوان الحلقة"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">العنوان (بالعربية)</label>
        <Input
          placeholder="عنوان الحلقة بالعربية"
          value={formData.titleAr}
          onChange={(e) =>
            setFormData({ ...formData, titleAr: e.target.value })
          }
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">الوصف (بالعربية)</label>
        <Textarea
          placeholder="وصف الحلقة بالعربية"
          value={formData.descriptionAr}
          onChange={(e) =>
            setFormData({ ...formData, descriptionAr: e.target.value })
          }
          disabled={isLoading}
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">الوصف (بالإنجليزية)</label>
        <Textarea
          placeholder="وصف الحلقة بالإنجليزية"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          disabled={isLoading}
          rows={3}
        />
      </div>

      {/* اختيار نوع الفيديو */}
      <div>
        <label className="block text-sm font-medium mb-2">نوع الفيديو</label>
        <select
          value={formData.videoType}
          onChange={(e) =>
            setFormData({
              ...formData,
              videoType: e.target.value as VideoType,
              videoUrl: "",
            })
          }
          disabled={isLoading}
          className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
        >
          <option value="telegram">📤 Telegram (رفع الفيديو)</option>
          <option value="youtube">🎬 YouTube (رابط الفيديو)</option>
          <option value="m3u8">📡 HLS Stream (رابط البث)</option>
          <option value="mp4">🎥 MP4 Direct (رابط مباشر)</option>
        </select>
      </div>

      {/* رفع الفيديو أو إدخال الرابط */}
      {formData.videoType === "telegram" ? (
        <div>
          <label className="block text-sm font-medium mb-2">الفيديو (Telegram)</label>
          <div className="border-2 border-dashed border-muted-foreground rounded-lg p-6 text-center">
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
              disabled={isLoading}
              className="hidden"
              id="video-input"
            />
            <label
              htmlFor="video-input"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm">
                {videoFile ? videoFile.name : "اضغط لاختيار ملف الفيديو"}
              </span>
              {videoFile && (
                <span className="text-xs text-muted-foreground">
                  {(videoFile.size / 1024 / 1024).toFixed(2)} MB (الحد الأقصى 500MB)
                </span>
              )}
            </label>
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium mb-2">رابط الفيديو</label>
          <Input
            type="url"
            placeholder="https://example.com/video.mp4"
            value={formData.videoUrl}
            onChange={(e) =>
              setFormData({ ...formData, videoUrl: e.target.value })
            }
            disabled={isLoading}
          />
        </div>
      )}

      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full"
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {isLoading ? "جاري الرفع..." : "إضافة الحلقة"}
      </Button>
    </form>
  );
}
