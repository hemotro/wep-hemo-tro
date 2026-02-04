import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Trash2, ChevronDown } from "lucide-react";

export default function Admin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedSeries, setSelectedSeries] = useState<number | null>(null);
  const [showSeriesForm, setShowSeriesForm] = useState(false);
  const [showEpisodeForm, setShowEpisodeForm] = useState(false);

  // فحص الصلاحيات
  if (user?.role !== "admin") {
    return (
      <div className="flex-1 pb-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">غير مصرح</h1>
          <p className="text-muted-foreground">ليس لديك صلاحيات إدارية</p>
        </div>
      </div>
    );
  }

  // Queries و Mutations
  const { data: seriesList, refetch: refetchSeries, isLoading: seriesLoading } = trpc.series.list.useQuery();
  const { data: episodes, refetch: refetchEpisodes } = trpc.series.getEpisodes.useQuery(
    { seriesId: selectedSeries || 0 },
    { enabled: !!selectedSeries }
  );

  const createSeriesMutation = trpc.series.create.useMutation();
  const deleteSeriesMutation = trpc.series.delete.useMutation();
  const createEpisodeMutation = trpc.episodes.create.useMutation();
  const deleteEpisodeMutation = trpc.episodes.delete.useMutation();

  // ==================== نماذج ====================

  const [seriesForm, setSeriesForm] = useState({
    titleAr: "",
    genre: "",
    posterUrl: "",
  });

  const [episodeForm, setEpisodeForm] = useState({
    episodeNumber: "1",
    titleAr: "",
    videoUrl: "",
  });

  const [posterFile, setPosterFile] = useState<File | null>(null);

  // ==================== معالجات ====================

  const handleAddSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seriesForm.titleAr.trim()) {
      toast.error("اسم المسلسل مطلوب");
      return;
    }

    try {
      await createSeriesMutation.mutateAsync({
        titleAr: seriesForm.titleAr,
        genre: seriesForm.genre || "",
        posterUrl: seriesForm.posterUrl || "",
      });
      
      toast.success("تم إضافة المسلسل بنجاح!");
      setSeriesForm({ titleAr: "", genre: "", posterUrl: "" });
      setPosterFile(null);
      setShowSeriesForm(false);
      refetchSeries();
    } catch (error: any) {
      toast.error(error.message || "فشل إضافة المسلسل");
    }
  };

  const handleAddEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeries) {
      toast.error("اختر مسلسل أولاً");
      return;
    }
    if (!episodeForm.titleAr.trim() || !episodeForm.videoUrl.trim()) {
      toast.error("اسم الحلقة ورابط الفيديو مطلوبان");
      return;
    }

    try {
      await createEpisodeMutation.mutateAsync({
        seriesId: selectedSeries,
        episodeNumber: parseInt(episodeForm.episodeNumber) || 1,
        titleAr: episodeForm.titleAr,
        videoUrl: episodeForm.videoUrl,
      });
      
      toast.success("تم إضافة الحلقة بنجاح!");
      setEpisodeForm({ episodeNumber: "1", titleAr: "", videoUrl: "" });
      setShowEpisodeForm(false);
      refetchEpisodes();
    } catch (error: any) {
      toast.error(error.message || "فشل إضافة الحلقة");
    }
  };

  const handleDeleteSeries = async (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا المسلسل؟")) {
      try {
        await deleteSeriesMutation.mutateAsync({ id });
        toast.success("تم حذف المسلسل بنجاح!");
        if (selectedSeries === id) setSelectedSeries(null);
        refetchSeries();
      } catch (error: any) {
        toast.error(error.message || "فشل حذف المسلسل");
      }
    }
  };

  const handleDeleteEpisode = async (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه الحلقة؟")) {
      try {
        await deleteEpisodeMutation.mutateAsync({ id });
        toast.success("تم حذف الحلقة بنجاح!");
        refetchEpisodes();
      } catch (error: any) {
        toast.error(error.message || "فشل حذف الحلقة");
      }
    }
  };

  const handlePosterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPosterFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setSeriesForm({
        ...seriesForm,
        posterUrl: event.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex-1 pb-20 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">لوحة التحكم</h1>
        <p className="text-muted-foreground mb-6">إدارة المسلسلات والحلقات</p>

        <Tabs defaultValue="series" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="series">المسلسلات</TabsTrigger>
            <TabsTrigger value="episodes">الحلقات</TabsTrigger>
          </TabsList>

          {/* ==================== تبويب المسلسلات ==================== */}
          <TabsContent value="series" className="space-y-6">
            {/* زر إضافة مسلسل */}
            <Button
              onClick={() => setShowSeriesForm(!showSeriesForm)}
              className="w-full bg-primary hover:bg-primary/90 h-12 text-base"
            >
              <Plus className="w-5 h-5 ml-2" />
              إضافة مسلسل جديد
            </Button>

            {/* نموذج إضافة مسلسل */}
            {showSeriesForm && (
              <Card className="bg-secondary border-primary/20">
                <CardHeader>
                  <CardTitle>إضافة مسلسل جديد</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddSeries} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        اسم المسلسل (عربي) *
                      </label>
                      <Input
                        placeholder="مثال: تخاريف"
                        value={seriesForm.titleAr}
                        onChange={(e) =>
                          setSeriesForm({ ...seriesForm, titleAr: e.target.value })
                        }
                        required
                        className="bg-background border-border"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        التصنيف
                      </label>
                      <Input
                        placeholder="مثال: رعب - درما"
                        value={seriesForm.genre}
                        onChange={(e) =>
                          setSeriesForm({ ...seriesForm, genre: e.target.value })
                        }
                        className="bg-background border-border"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        البانر (الصورة)
                      </label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handlePosterUpload}
                        className="bg-background border-border"
                      />
                      {seriesForm.posterUrl && (
                        <div className="mt-3">
                          <p className="text-sm text-green-500 mb-2">✓ تم اختيار الصورة</p>
                          <img
                            src={seriesForm.posterUrl}
                            alt="معاينة البانر"
                            className="w-32 h-48 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        type="submit"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={createSeriesMutation.isPending}
                      >
                        {createSeriesMutation.isPending ? "جاري الإضافة..." : "إضافة المسلسل"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowSeriesForm(false)}
                        className="flex-1"
                      >
                        إلغاء
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* قائمة المسلسلات */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">المسلسلات الموجودة</h2>
              {seriesLoading ? (
                <p className="text-muted-foreground">جاري التحميل...</p>
              ) : seriesList && seriesList.length > 0 ? (
                seriesList.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-4 bg-secondary rounded-lg border border-border hover:border-primary/50 transition"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{s.titleAr}</p>
                      <p className="text-sm text-muted-foreground">{s.genre || "بدون تصنيف"}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={selectedSeries === s.id ? "default" : "outline"}
                        onClick={() => setSelectedSeries(selectedSeries === s.id ? null : s.id)}
                      >
                        {selectedSeries === s.id ? "مخفي" : "عرض الحلقات"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteSeries(s.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">لا توجد مسلسلات حتى الآن</p>
              )}
            </div>
          </TabsContent>

          {/* ==================== تبويب الحلقات ==================== */}
          <TabsContent value="episodes" className="space-y-6">
            {!selectedSeries ? (
              <Card className="bg-secondary">
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    اختر مسلسل من تبويب المسلسلات لإدارة الحلقات
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* زر إضافة حلقة */}
                <Button
                  onClick={() => setShowEpisodeForm(!showEpisodeForm)}
                  className="w-full bg-primary hover:bg-primary/90 h-12 text-base"
                >
                  <Plus className="w-5 h-5 ml-2" />
                  إضافة حلقة جديدة
                </Button>

                {/* نموذج إضافة حلقة */}
                {showEpisodeForm && (
                  <Card className="bg-secondary border-primary/20">
                    <CardHeader>
                      <CardTitle>إضافة حلقة جديدة</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleAddEpisode} className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">
                            رقم الحلقة *
                          </label>
                          <Input
                            type="number"
                            placeholder="1"
                            value={episodeForm.episodeNumber}
                            onChange={(e) =>
                              setEpisodeForm({
                                ...episodeForm,
                                episodeNumber: e.target.value,
                              })
                            }
                            min="1"
                            className="bg-background border-border"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">
                            اسم الحلقة *
                          </label>
                          <Input
                            placeholder="مثال: الحلقة الأولى"
                            value={episodeForm.titleAr}
                            onChange={(e) =>
                              setEpisodeForm({
                                ...episodeForm,
                                titleAr: e.target.value,
                              })
                            }
                            required
                            className="bg-background border-border"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">
                            رابط يوتيوب *
                          </label>
                          <Input
                            type="url"
                            placeholder="https://youtu.be/..."
                            value={episodeForm.videoUrl}
                            onChange={(e) =>
                              setEpisodeForm({
                                ...episodeForm,
                                videoUrl: e.target.value,
                              })
                            }
                            required
                            className="bg-background border-border"
                          />
                        </div>

                        <div className="flex gap-2 pt-4">
                          <Button
                            type="submit"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            disabled={createEpisodeMutation.isPending}
                          >
                            {createEpisodeMutation.isPending
                              ? "جاري الإضافة..."
                              : "إضافة الحلقة"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowEpisodeForm(false)}
                            className="flex-1"
                          >
                            إلغاء
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {/* قائمة الحلقات */}
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground">الحلقات</h2>
                  {episodes && episodes.length > 0 ? (
                    episodes.map((ep) => (
                      <div
                        key={ep.id}
                        className="flex items-center justify-between p-4 bg-secondary rounded-lg border border-border hover:border-primary/50 transition"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground">
                            الحلقة {ep.episodeNumber}: {ep.titleAr}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {ep.videoUrl}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteEpisode(ep.id)}
                          className="ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">لا توجد حلقات حتى الآن</p>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
