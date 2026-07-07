import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload } from "lucide-react";

interface FormData {
  seriesId: number;
  episodeNumber: number;
  titleAr: string;
}

interface Series {
  id: number;
  titleAr: string;
  title?: string;
}

export default function AddEpisodeForm() {
  const [formData, setFormData] = useState<FormData>({
    seriesId: 0,
    episodeNumber: 1,
    titleAr: "",
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [series, setSeries] = useState<Series[]>([]);
  const [loadingSeries, setLoadingSeries] = useState(true);

  // جلب المسلسلات
  const { data: seriesData, isLoading: seriesLoading } = trpc.series.list.useQuery();

  useEffect(() => {
    if (seriesData) {
      setSeries(seriesData);
      setLoadingSeries(false);
    }
  }, [seriesData]);

  const createEpisodeMutation = trpc.episodes.create.useMutation({
    onSuccess: () => {
      setSuccessMessage("✅ تم إضافة الحلقة بنجاح!");
      setErrorMessage("");
      setTimeout(() => setSuccessMessage(""), 3000);
      
      setFormData({
        seriesId: 0,
        episodeNumber: 1,
        titleAr: "",
      });
      setVideoFile(null);
    },
    onError: (error) => {
      console.error("خطأ:", error.message);
      setErrorMessage(error.message);
    },
  });

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        setErrorMessage("حجم الملف كبير جداً (الحد الأقصى 500MB)");
        return;
      }
      setVideoFile(file);
      setErrorMessage("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!formData.seriesId) {
      setErrorMessage("❌ اختر مسلسل");
      return;
    }

    if (!formData.titleAr.trim()) {
      setErrorMessage("❌ أدخل اسم الحلقة");
      return;
    }

    if (!videoFile) {
      setErrorMessage("❌ اختر ملف الفيديو");
      return;
    }

    setIsLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("file", videoFile);
      formDataToSend.append("titleAr", formData.titleAr);
      formDataToSend.append("title", formData.titleAr);
      formDataToSend.append("seriesId", formData.seriesId.toString());
      formDataToSend.append("season", "1");
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

      await createEpisodeMutation.mutateAsync({
        seriesId: formData.seriesId,
        season: 1,
        episodeNumber: formData.episodeNumber,
        titleAr: formData.titleAr,
        title: formData.titleAr,
        videoUrl: uploadData.fileId,
        videoType: "telegram",
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "حدث خطأ";
      setErrorMessage(`❌ ${errorMsg}`);
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedSeries = series.find(s => s.id === formData.seriesId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {successMessage && (
        <div className="bg-green-500/20 border border-green-500 text-green-600 px-4 py-2 rounded-md">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-500/20 border border-red-500 text-red-600 px-4 py-2 rounded-md">
          {errorMessage}
        </div>
      )}

      {/* اختيار المسلسل */}
      <div>
        <label className="block text-sm font-medium mb-2">المسلسل</label>
        {seriesLoading ? (
          <div className="text-center py-4 text-muted-foreground">جاري التحميل...</div>
        ) : (
          <select
            value={formData.seriesId}
            onChange={(e) =>
              setFormData({
                ...formData,
                seriesId: parseInt(e.target.value) || 0,
              })
            }
            disabled={isLoading}
            className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
            required
          >
            <option value="0">-- اختر مسلسل --</option>
            {series.map((s) => (
              <option key={s.id} value={s.id}>
                {s.titleAr}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedSeries && (
        <div className="bg-primary/10 border border-primary rounded-md p-3">
          <p className="text-sm">{selectedSeries.titleAr}</p>
        </div>
      )}

      {/* اسم الحلقة ورقم الحلقة */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">اسم الحلقة</label>
          <Input
            placeholder="مثال: الحلقة الأولى"
            value={formData.titleAr}
            onChange={(e) =>
              setFormData({ ...formData, titleAr: e.target.value })
            }
            disabled={isLoading}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">رقم الحلقة</label>
          <Input
            type="number"
            placeholder="1"
            min="1"
            value={formData.episodeNumber}
            onChange={(e) =>
              setFormData({
                ...formData,
                episodeNumber: parseInt(e.target.value) || 1,
              })
            }
            disabled={isLoading}
            required
          />
        </div>
      </div>

      {/* رفع الفيديو */}
      <div>
        <label className="block text-sm font-medium mb-2">رفع الفيديو</label>
        <div className="border-2 border-dashed border-primary rounded-lg p-6 text-center hover:bg-primary/5 transition-colors">
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            disabled={isLoading}
            className="hidden"
            id="video-input"
            required
          />
          <label
            htmlFor="video-input"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            <Upload className="w-8 h-8 text-primary" />
            <span className="text-sm font-medium">
              {videoFile ? videoFile.name : "اضغط لاختيار الفيديو"}
            </span>
            {videoFile && (
              <span className="text-xs text-muted-foreground">
                {(videoFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
            )}
          </label>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading || !videoFile || !formData.seriesId || !formData.titleAr}
        className="w-full"
        size="lg"
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {isLoading ? "جاري الرفع..." : "إضافة الحلقة"}
      </Button>
    </form>
  );
}
