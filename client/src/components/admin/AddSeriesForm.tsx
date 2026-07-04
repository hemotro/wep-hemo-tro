import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

export default function AddSeriesForm() {
  const [formData, setFormData] = useState({
    title: "",
    titleAr: "",
    description: "",
    descriptionAr: "",
    genre: "",
    totalEpisodes: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const createSeriesMutation = trpc.series.create.useMutation({
    onSuccess: () => {
      console.log("تم إضافة المسلسل بنجاح");
      setFormData({
        title: "",
        titleAr: "",
        description: "",
        descriptionAr: "",
        genre: "",
        totalEpisodes: 0,
      });
    },
    onError: (error) => {
      console.error("خطأ:", error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      console.error("يجب إدخال اسم المسلسل");
      return;
    }

    setIsLoading(true);
    try {
      await createSeriesMutation.mutateAsync({
        title: formData.title,
        titleAr: formData.titleAr,
        description: formData.description,
        descriptionAr: formData.descriptionAr,
        genre: formData.genre,
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
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">الوصف (بالعربية)</label>
        <Textarea
          placeholder="أدخل وصف المسلسل بالعربية"
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
          placeholder="أدخل وصف المسلسل بالإنجليزية"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          disabled={isLoading}
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">اسم المسلسل (بالعربية)</label>
        <Input
          placeholder="أدخل اسم المسلسل بالعربية"
          value={formData.titleAr}
          onChange={(e) =>
            setFormData({ ...formData, titleAr: e.target.value })
          }
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">النوع</label>
          <Input
            placeholder="مثال: دراما، أكشن"
            value={formData.genre}
            onChange={(e) =>
              setFormData({ ...formData, genre: e.target.value })
            }
            disabled={isLoading}
          />
        </div>

      </div>

      <div>
        <label className="block text-sm font-medium mb-2">عدد الحلقات</label>
        <Input
          type="number"
          placeholder="0"
          value={formData.totalEpisodes}
          onChange={(e) =>
            setFormData({
              ...formData,
              totalEpisodes: parseInt(e.target.value) || 0,
            })
          }
          disabled={isLoading}
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full"
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {isLoading ? "جاري الإضافة..." : "إضافة المسلسل"}
      </Button>
    </form>
  );
}
