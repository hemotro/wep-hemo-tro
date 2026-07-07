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
  title: string;
  titleAr: string;
  description?: string;
  descriptionAr?: string;
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
    title: "",
    titleAr: "",
    description: "",
    descriptionAr: "",
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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

    // التحقق من جميع الحقول المطلوبة
    if (!formData.seriesId) {
      setErrorMessage("❌ يجب اختيار مسلسل");
      return;
    }

    if (!formData.titleAr.trim()) {
      setErrorMessage("❌ يجب إدخال اسم الحلقة بالعربية");
      return;
    }

    if (!formData.title.trim()) {
      setErrorMessage("❌ يجب إدخال اسم الحلقة بالإنجليزية");
      return;
    }

    if (!videoFile) {
      setErrorMessage("❌ يجب اختيار ملف فيديو");
      return;
    }

    if (formData.season < 1) {
      setErrorMessage("❌ رقم الموسم يجب أن يكون أكبر من 0");
      return;
    }

    if (formData.episodeNumber < 1) {
      setErrorMessage("❌ رقم الحلقة يجب أن يكون أكبر من 0");
      return;
    }

    setIsLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("file", videoFile);
      formDataToSend.append("titleAr", formData.titleAr);
      formDataToSend.append("title", formData.title);
      formDataToSend.append("seriesId", formData.seriesId.toString());
      formDataToSend.append("season", formData.season.toString());
      formDataToSend.append("episodeNumber", formData.episodeNumber.toString());
      
      if (formData.description) {
        formDataToSend.append("description", formData.description);
      }
      if (formData.descriptionAr) {
        formDataToSend.append("descriptionAr", formData.descriptionAr);
      }

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
        title: formData.title,
        descriptionAr: formData.descriptionAr,
        description: formData.description,
        videoUrl: uploadData.fileId,
        videoType: "telegram",
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "حدث خطأ غير متوقع";
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
        <label className="block text-sm font-medium mb-2">🎬 اختر المسلسل *</label>
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
            required
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

      {/* الموسم ورقم الحلقة */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">الموسم *</label>
          <Input
            type="number"
            placeholder="1"
            min="1"
            value={formData.season}
            onChange={(e) =>
              setFormData({
                ...formData,
                season: parseInt(e.target.value) || 1,
              })
            }
            disabled={isLoading}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">رقم الحلقة *</label>
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

      {/* اسم الحلقة بالعربية */}
      <div>
        <label className="block text-sm font-medium mb-2">اسم الحلقة بالعربية *</label>
        <Input
          placeholder="أدخل اسم الحلقة بالعربية"
          value={formData.titleAr}
          onChange={(e) =>
            setFormData({ ...formData, titleAr: e.target.value })
          }
          disabled={isLoading}
          required
        />
      </div>

      {/* اسم الحلقة بالإنجليزية */}
      <div>
        <label className="block text-sm font-medium mb-2">اسم الحلقة بالإنجليزية *</label>
        <Input
          placeholder="أدخل اسم الحلقة بالإنجليزية"
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          disabled={isLoading}
          required
        />
      </div>

      {/* الوصف بالعربية (اختياري) */}
      <div>
        <label className="block text-sm font-medium mb-2">الوصف بالعربية (اختياري)</label>
        <Textarea
          placeholder="أدخل وصف الحلقة بالعربية"
          value={formData.descriptionAr || ""}
          onChange={(e) =>
            setFormData({ ...formData, descriptionAr: e.target.value })
          }
          disabled={isLoading}
          rows={3}
        />
      </div>

      {/* الوصف بالإنجليزية (اختياري) */}
      <div>
        <label className="block text-sm font-medium mb-2">الوصف بالإنجليزية (اختياري)</label>
        <Textarea
          placeholder="أدخل وصف الحلقة بالإنجليزية"
          value={formData.description || ""}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          disabled={isLoading}
          rows={3}
        />
      </div>

      {/* رفع الفيديو */}
      <div>
        <label className="block text-sm font-medium mb-2">📤 رفع الفيديو *</label>
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
        disabled={isLoading || !videoFile || !formData.seriesId || !formData.titleAr || !formData.title}
        className="w-full"
        size="lg"
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {isLoading ? "جاري الرفع..." : "✅ إضافة الحلقة"}
      </Button>

      <div className="text-xs text-muted-foreground text-center">
        * الحقول المطلوبة
      </div>
    </form>
  );
}
