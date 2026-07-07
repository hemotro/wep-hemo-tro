import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload } from "lucide-react";

interface FormData {
  seriesId: number;
  season: number;
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
    season: 1,
    episodeNumber: 1,
    titleAr: "",
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");
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
      setTimeout(() => setSuccessMessage(""), 3000);
      
      setFormData({
        seriesId: 0,
        season: 1,
        episodeNumber: 1,
        titleAr: "",
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

    if (!formData.titleAr.trim()) {
      alert("يجب إدخال اسم الحلقة");
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
      formDataToSend.append("titleAr", formData.titleAr);
      formDataToSend.append("seriesId", formData.seriesId.toString());
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
        titleAr: formData.titleAr,
        videoUrl: uploadData.url,
        videoType: "telegram",
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "حدث خطأ");
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

      {/* اختيار المسلسل */}
      <div>
        <label className="block text-sm font-medium mb-2">🎬 اختر المسلسل</label>
        {seriesLoading ? (
          <div className="text-center py-4 text-muted-foreground">جاري تحميل المسلسلات...</div>
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
          >
            <option value="0">-- اختر مسلسل --</option>
            {series.map((s) => (
              <option key={s.id} value={s.id}>
                {s.titleAr} {s.title ? `(${s.title})` : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* عرض المسلسل المختار */}
      {selectedSeries && (
        <div className="bg-primary/10 border border-primary rounded-md p-3">
          <p className="text-sm">
            <span className="font-medium">المسلسل المختار:</span> {selectedSeries.titleAr}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
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
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">اسم الحلقة</label>
        <Input
          placeholder="أدخل اسم الحلقة"
          value={formData.titleAr}
          onChange={(e) =>
            setFormData({ ...formData, titleAr: e.target.value })
          }
          disabled={isLoading}
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
        disabled={isLoading || !videoFile || !formData.seriesId}
        className="w-full"
        size="lg"
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {isLoading ? "جاري الرفع..." : "✅ إضافة الحلقة"}
      </Button>
    </form>
  );
}
