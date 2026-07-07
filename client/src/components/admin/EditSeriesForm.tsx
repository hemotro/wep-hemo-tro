import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface EditSeriesFormProps {
  seriesId: number;
  onSuccess?: () => void;
}

export default function EditSeriesForm({ seriesId, onSuccess }: EditSeriesFormProps) {
  const [formData, setFormData] = useState({
    titleAr: "",
    descriptionAr: "",
    genre: "",
    totalSeasons: 1,
    posterUrl: "",
    bannerUrl: "",
    logoUrl: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // جلب بيانات المسلسل
  const { data: series } = trpc.series.getById.useQuery({ id: seriesId });

  useEffect(() => {
    if (series) {
      setFormData({
        titleAr: series.titleAr || "",
        descriptionAr: series.descriptionAr || "",
        genre: series.genre || "",
        totalSeasons: series.totalSeasons || 1,
        posterUrl: series.posterUrl || "",
        bannerUrl: series.bannerUrl || "",
        logoUrl: series.logoUrl || "",
      });
    }
  }, [series]);

  const updateSeriesMutation = trpc.series.update.useMutation({
    onSuccess: () => {
      alert("تم تحديث المسلسل بنجاح!");
      onSuccess?.();
    },
    onError: (error) => {
      alert("خطأ: " + error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titleAr.trim()) {
      alert("يجب إدخال اسم المسلسل");
      return;
    }

    setIsLoading(true);
    try {
      await updateSeriesMutation.mutateAsync({
        id: seriesId,
        titleAr: formData.titleAr,
        descriptionAr: formData.descriptionAr,
        genre: formData.genre,
        posterUrl: formData.posterUrl || undefined,
        bannerUrl: formData.bannerUrl || undefined,
        logoUrl: formData.logoUrl || undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-card p-4 rounded-lg border">
      <h3 className="text-lg font-semibold">تعديل المسلسل</h3>

      <div>
        <label className="block text-sm font-medium mb-2">اسم المسلسل</label>
        <Input
          placeholder="أدخل اسم المسلسل"
          value={formData.titleAr}
          onChange={(e) =>
            setFormData({ ...formData, titleAr: e.target.value })
          }
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">الوصف</label>
        <Textarea
          placeholder="أدخل وصف المسلسل"
          value={formData.descriptionAr}
          onChange={(e) =>
            setFormData({ ...formData, descriptionAr: e.target.value })
          }
          disabled={isLoading}
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">التصنيف</label>
        <Input
          placeholder="مثال: دراما، أكشن"
          value={formData.genre}
          onChange={(e) =>
            setFormData({ ...formData, genre: e.target.value })
          }
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">عدد المواسم</label>
        <Input
          type="number"
          placeholder="1"
          value={formData.totalSeasons}
          onChange={(e) =>
            setFormData({
              ...formData,
              totalSeasons: parseInt(e.target.value) || 1,
            })
          }
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">رابط البانر (الإعلان)</label>
        <Input
          placeholder="أدخل رابط صورة البانر"
          value={formData.bannerUrl}
          onChange={(e) =>
            setFormData({ ...formData, bannerUrl: e.target.value })
          }
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground mt-1">الصورة التي تظهر فوق الفيديو</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">رابط اللوقو</label>
        <Input
          placeholder="أدخل رابط صورة اللوقو"
          value={formData.logoUrl}
          onChange={(e) =>
            setFormData({ ...formData, logoUrl: e.target.value })
          }
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground mt-1">الصورة التي تظهر تحت البانر</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">رابط الصورة الخارجية (Poster)</label>
        <Input
          placeholder="أدخل رابط صورة المسلسل الخارجية"
          value={formData.posterUrl}
          onChange={(e) =>
            setFormData({ ...formData, posterUrl: e.target.value })
          }
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground mt-1">الصورة التي تظهر في قائمة المسلسلات</p>
      </div>

      <Button
        type="submit"
        disabled={isLoading || !formData.titleAr.trim()}
        className="w-full"
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        حفظ التغييرات
      </Button>
    </form>
  );
}
