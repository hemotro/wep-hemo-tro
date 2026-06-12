import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Edit2, Trash2, Upload } from "lucide-react";


export function AdminEditSeries() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [formData, setFormData] = useState({
    titleAr: "",
    title: "",
    descriptionAr: "",
    description: "",
    genre: "",
    posterUrl: "",
    bannerUrl: "",
    totalSeasons: 0,
    totalEpisodes: 0,
  });

  // جلب المسلسلات
  const { data: allSeries, isLoading: loadingSeries, refetch: refetchSeries } = trpc.series.list.useQuery();

  // تحديث المسلسل
  const updateMutation = trpc.series.update.useMutation({
    onSuccess: () => {
      alert("تم تحديث المسلسل بنجاح");
      setIsOpen(false);
      setEditingId(null);
      setFormData({ titleAr: "", title: "", descriptionAr: "", description: "", genre: "", posterUrl: "", bannerUrl: "", totalSeasons: 0, totalEpisodes: 0 });
      refetchSeries();
    },
    onError: (error) => {
      alert(`خطأ: ${error.message}`);
    },
  });

  // حذف المسلسل
  const deleteMutation = trpc.series.delete.useMutation({
    onSuccess: () => {
      alert("تم حذف المسلسل بنجاح");
      refetchSeries();
    },
    onError: (error) => {
      alert(`خطأ: ${error.message}`);
    },
  });

  const handleEdit = (series: any) => {
    setEditingId(series.id);
    setFormData({
      titleAr: series.titleAr,
      title: series.title,
      descriptionAr: series.descriptionAr,
      description: series.description,
      genre: series.genre,
      posterUrl: series.posterUrl || "",
      bannerUrl: series.bannerUrl || "",
      totalSeasons: series.totalSeasons,
      totalEpisodes: series.totalEpisodes,
    });
    setIsOpen(true);
  };

  const handleUploadPoster = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPoster(true);
    try {
      const buffer = await file.arrayBuffer();
      const response = await fetch("/api/trpc/storage.uploadFile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileBuffer: Array.from(new Uint8Array(buffer)),
          mimeType: file.type,
          folder: "posters",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({ ...formData, posterUrl: data.url });
        alert("تم رفع الصورة بنجاح");
      }
    } catch (error) {
      alert(`خطأ في رفع الصورة: ${error}`);
    } finally {
      setIsUploadingPoster(false);
    }
  };

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBanner(true);
    try {
      const buffer = await file.arrayBuffer();
      const response = await fetch("/api/trpc/storage.uploadFile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileBuffer: Array.from(new Uint8Array(buffer)),
          mimeType: file.type,
          folder: "banners",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({ ...formData, bannerUrl: data.url });
        alert("تم رفع الصورة بنجاح");
      }
    } catch (error) {
      alert(`خطأ في رفع الصورة: ${error}`);
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.titleAr || !formData.title) {
      alert("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...formData });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">تعديل المسلسلات</h2>

      {loadingSeries ? (
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : allSeries && allSeries.length > 0 ? (
        <div className="grid gap-4">
          {allSeries.map((series) => (
            <Card key={series.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>{series.titleAr}</CardTitle>
                <div className="flex gap-2">
                  <Dialog open={isOpen && editingId === series.id} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(series)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>تعديل المسلسل</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">الاسم (العربية)</label>
                          <Input
                            value={formData.titleAr}
                            onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">الاسم (English)</label>
                          <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">الوصف (العربية)</label>
                          <textarea
                            value={formData.descriptionAr}
                            onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                            className="w-full border rounded px-3 py-2"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">الوصف (English)</label>
                          <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full border rounded px-3 py-2"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">النوع</label>
                          <Input
                            value={formData.genre}
                            onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">عدد المواسم</label>
                          <Input
                            type="number"
                            value={formData.totalSeasons}
                            onChange={(e) => setFormData({ ...formData, totalSeasons: parseInt(e.target.value) })}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">عدد الحلقات</label>
                          <Input
                            type="number"
                            value={formData.totalEpisodes}
                            onChange={(e) => setFormData({ ...formData, totalEpisodes: parseInt(e.target.value) })}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">صورة المسلسل</label>
                          {formData.posterUrl && (
                            <img src={formData.posterUrl} alt="Poster" className="w-32 h-48 object-cover rounded" />
                          )}
                          <div className="flex gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleUploadPoster}
                              disabled={isUploadingPoster}
                              className="flex-1"
                            />
                            {isUploadingPoster && <Loader2 className="h-4 w-4 animate-spin" />}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">صورة البانر</label>
                          {formData.bannerUrl && (
                            <img src={formData.bannerUrl} alt="Banner" className="w-full h-32 object-cover rounded" />
                          )}
                          <div className="flex gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleUploadBanner}
                              disabled={isUploadingBanner}
                              className="flex-1"
                            />
                            {isUploadingBanner && <Loader2 className="h-4 w-4 animate-spin" />}
                          </div>
                        </div>

                        <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
                          {updateMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              جاري المعالجة...
                            </>
                          ) : (
                            "تحديث المسلسل"
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate({ id: series.id })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{series.descriptionAr}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">لا توجد مسلسلات حالياً</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
