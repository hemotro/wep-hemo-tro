import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

export default function AddSeriesForm() {
  const [formData, setFormData] = useState({
    titleAr: "",
    descriptionAr: "",
    genre: "",
    totalSeasons: 1,
    status: "ongoing" as "ongoing" | "completed",
    bannerUrl: "",
    logoUrl: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const createSeriesMutation = trpc.series.create.useMutation({
    onSuccess: () => {
      alert("تم إضافة المسلسل بنجاح!");
      setFormData({
        titleAr: "",
        descriptionAr: "",
        genre: "",
        totalSeasons: 1,
        status: "ongoing",
        bannerUrl: "",
        logoUrl: "",
      });
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
      await createSeriesMutation.mutateAsync({
        titleAr: formData.titleAr,
        descriptionAr: formData.descriptionAr,
        genre: formData.genre,
        totalSeasons: formData.totalSeasons,
        bannerUrl: formData.bannerUrl || undefined,
        logoUrl: formData.logoUrl || undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div className="grid grid-cols-2 gap-4">
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



      <Button
        type="submit"
        disabled={isLoading || !formData.titleAr.trim()}
        className="w-full"
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {isLoading ? "جاري الإضافة..." : "إضافة المسلسل"}
      </Button>
    </form>
  );
}
