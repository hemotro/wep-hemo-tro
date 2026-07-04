import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload } from "lucide-react";

interface FormData {
  seriesId: number;
  season: number;
  episodeNumber: number;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
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
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");

  const createEpisodeMutation = trpc.episodes.create.useMutation({
    onSuccess: () => {
      setSuccessMessage("✅ تم إضافة الحلقة بنجاح!");
      setTimeout(() => setSuccessMessage(""), 3000);
      
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
        alert("حجم الملف كبير جداً (الحد الأقصى 500MB)");
        return;
      }
      setVideoFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert("يجب إدخال عنوان الحلقة");
      return;
    }

    if (!formData.titleAr.trim()) {
      alert("يجب إدخال عنوان الحلقة بالعربية");
      return;
    }

    if (!formData.seriesId) {
      alert("يجب اختيار مسلسل");
      return;
    }

    if (!videoFile) {
      alert("يجب اختيار ملف فيديو");
      return;
    }

    setIsLoading(true);
    try {
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
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "فشل رفع الفيديو");
      }

      const uploadData = await uploadResponse.json();

      // إنشاء الحلقة مع Telegram كنوع الفيديو
      await createEpisodeMutation.mutateAsync({
        seriesId: formData.seriesId,
        season: formData.season,
        episodeNumber: formData.episodeNumber,
        title: formData.title,
        titleAr: formData.titleAr,
        description: formData.description,
        descriptionAr: formData.descriptionAr,
        videoUrl: uploadData.url,
        videoType: "telegram",
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "حدث خطأ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {successMessage && (
        <div className="bg-green-500/20 border border-green-500 text-green-600 px-4 py-2 rounded-md">
          {successMessage}
        </div>
      )}

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
          <label className="block text-sm font-medium mb-2">العنوان (English)</label>
          <Input
            placeholder="Episode title in English"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">العنوان (العربية)</label>
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
        <label className="block text-sm font-medium mb-2">الوصف (العربية)</label>
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
        <label className="block text-sm font-medium mb-2">الوصف (English)</label>
        <Textarea
          placeholder="Episode description in English"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          disabled={isLoading}
          rows={3}
        />
      </div>

      {/* رفع الفيديو - Telegram فقط */}
      <div>
        <label className="block text-sm font-medium mb-2">📤 رفع الفيديو (Telegram)</label>
        <div className="border-2 border-dashed border-primary rounded-lg p-6 text-center hover:bg-primary/5 transition-colors">
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
            <Upload className="w-8 h-8 text-primary" />
            <span className="text-sm font-medium">
              {videoFile ? videoFile.name : "اضغط لاختيار ملف الفيديو"}
            </span>
            {videoFile && (
              <span className="text-xs text-muted-foreground">
                {(videoFile.size / 1024 / 1024).toFixed(2)} MB / 500 MB
              </span>
            )}
            <span className="text-xs text-muted-foreground mt-2">
              الصيغ المدعومة: MP4, MKV, AVI, MOV
            </span>
          </label>
        </div>
      </div>

      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading || !videoFile}
        className="w-full"
        size="lg"
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {isLoading ? "جاري الرفع..." : "✅ إضافة الحلقة"}
      </Button>
    </form>
  );
}
