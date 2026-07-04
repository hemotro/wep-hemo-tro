import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload } from "lucide-react";

export default function AddEpisodeForm() {
  const [formData, setFormData] = useState({
    seriesId: 0,
    season: 1,
    episodeNumber: 1,
    title: "",
    titleAr: "",
    description: "",
    descriptionAr: "",
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

    if (!videoFile) {
      console.error("يجب اختيار ملف فيديو");
      return;
    }

    if (!formData.seriesId) {
      console.error("يجب اختيار مسلسل");
      return;
    }

    setIsLoading(true);
    try {
      // رفع الفيديو إلى Telegram عبر البوت
      const formDataToSend = new FormData();
      formDataToSend.append("file", videoFile);
      formDataToSend.append("title", formData.title);
      formDataToSend.append("titleAr", formData.titleAr);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("descriptionAr", formData.descriptionAr);
      formDataToSend.append("seriesId", formData.seriesId.toString());
      formDataToSend.append("season", formData.season.toString());
      formDataToSend.append("episodeNumber", formData.episodeNumber.toString());

      // رفع الفيديو
      const uploadResponse = await fetch("/api/upload-video", {
        method: "POST",
        body: formDataToSend,
      });

      if (!uploadResponse.ok) {
        throw new Error("فشل رفع الفيديو");
      }

      const uploadData = await uploadResponse.json();

      // إنشاء الحلقة مع رابط الفيديو
      await createEpisodeMutation.mutateAsync({
        seriesId: formData.seriesId,
        season: formData.season,
        episodeNumber: formData.episodeNumber,
        title: formData.title,
        titleAr: formData.titleAr,
        description: formData.description,
        descriptionAr: formData.descriptionAr,
        videoUrl: uploadData.url,
        videoType: "mp4",
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

      {/* رفع الفيديو */}
      <div>
        <label className="block text-sm font-medium mb-2">الفيديو</label>
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
                {(videoFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
            )}
          </label>
        </div>
      </div>

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
        disabled={isLoading || !videoFile}
        className="w-full"
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {isLoading ? "جاري الرفع..." : "إضافة الحلقة"}
      </Button>
    </form>
  );
}
