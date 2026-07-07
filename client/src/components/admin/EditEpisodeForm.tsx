import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface EditEpisodeFormProps {
  episodeId: number;
  onSuccess?: () => void;
}

export default function EditEpisodeForm({ episodeId, onSuccess }: EditEpisodeFormProps) {
  const [formData, setFormData] = useState({
    titleAr: "",
    episodeNumber: 1,
  });
  const [isLoading, setIsLoading] = useState(false);

  // بيانات الحلقة سيتم ملؤها مباشرة

  const updateEpisodeMutation = trpc.episodes.update.useMutation({
    onSuccess: () => {
      alert("تم تحديث الحلقة بنجاح!");
      onSuccess?.();
    },
    onError: (error) => {
      alert("خطأ: " + error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titleAr.trim()) {
      alert("يجب إدخال اسم الحلقة");
      return;
    }

    setIsLoading(true);
    try {
      await updateEpisodeMutation.mutateAsync({
        id: episodeId,
        titleAr: formData.titleAr,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-card p-4 rounded-lg border">
      <h3 className="text-lg font-semibold">تعديل الحلقة</h3>

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
