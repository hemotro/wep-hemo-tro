import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2, Upload, Edit2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminImages() {
  const { data: seriesList, isLoading } = trpc.series.list.useQuery();
  const [selectedSeries, setSelectedSeries] = useState<number | null>(null);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSeriesId, setEditingSeriesId] = useState<number | null>(null);

  // Mutations
  const updatePosterMutation = trpc.series.updatePoster.useMutation();
  const deleteImageMutation = trpc.series.deleteImage.useMutation();
  const utils = trpc.useUtils();

  const handleUpdatePoster = async (seriesId: number) => {
    if (!newImageUrl.trim()) {
      alert("الرجاء إدخال رابط الصورة");
      return;
    }

    try {
      await updatePosterMutation.mutateAsync({
        seriesId,
        posterUrl: newImageUrl,
      });
      
      // تحديث البيانات
      await utils.series.list.invalidate();
      
      setNewImageUrl("");
      setEditingSeriesId(null);
      setIsDialogOpen(false);
      alert("تم تحديث الصورة بنجاح");
    } catch (error) {
      console.error("خطأ في تحديث الصورة:", error);
      alert("حدث خطأ في تحديث الصورة");
    }
  };

  const handleDeleteImage = async (seriesId: number) => {
    if (!confirm("هل أنت متأكد من حذف الصورة؟")) return;

    try {
      await deleteImageMutation.mutateAsync({ seriesId });
      
      // تحديث البيانات
      await utils.series.list.invalidate();
      
      alert("تم حذف الصورة بنجاح");
    } catch (error) {
      console.error("خطأ في حذف الصورة:", error);
      alert("حدث خطأ في حذف الصورة");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل المسلسلات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">إدارة صور المسلسلات</h1>
        <p className="text-muted-foreground">تغيير وحذف صور السلايدر والمسلسلات</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {seriesList?.map((series) => (
          <Card key={series.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative aspect-video bg-muted overflow-hidden">
              {series.posterUrl ? (
                <img
                  src={series.posterUrl}
                  alt={series.titleAr}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-background">
                  <p className="text-muted-foreground">بدون صورة</p>
                </div>
              )}

              {/* زر الحذف */}
              <button
                onClick={() => handleDeleteImage(series.id)}
                disabled={deleteImageMutation.isPending}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
                title="حذف الصورة"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-foreground line-clamp-2">
                  {series.titleAr}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {series.totalEpisodes} حلقة
                </p>
              </div>

              <Dialog open={isDialogOpen && editingSeriesId === series.id} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  setEditingSeriesId(null);
                  setNewImageUrl("");
                }
              }}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setEditingSeriesId(series.id);
                      setNewImageUrl(series.posterUrl || "");
                      setIsDialogOpen(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    تغيير الصورة
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>تغيير صورة المسلسل</DialogTitle>
                    <DialogDescription>
                      {series.titleAr}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    {/* معاينة الصورة الجديدة */}
                    {newImageUrl && (
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                        <img
                          src={newImageUrl}
                          alt="معاينة"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "";
                          }}
                        />
                      </div>
                    )}

                    {/* حقل إدخال الرابط */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        رابط الصورة
                      </label>
                      <Input
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        className="w-full"
                      />
                    </div>

                    {/* أزرار الإجراء */}
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsDialogOpen(false);
                          setEditingSeriesId(null);
                          setNewImageUrl("");
                        }}
                      >
                        إلغاء
                      </Button>
                      <Button
                        onClick={() => handleUpdatePoster(series.id)}
                        disabled={updatePosterMutation.isPending}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {updatePosterMutation.isPending ? "جاري التحديث..." : "تحديث"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </Card>
        ))}
      </div>

      {(!seriesList || seriesList.length === 0) && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">لا توجد مسلسلات</p>
        </div>
      )}
    </div>
  );
}
