import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Upload } from "lucide-react";

export default function Admin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedSeries, setSelectedSeries] = useState<number | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<number | null>(null);

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
  const { data: seriesList, refetch: refetchSeries } = trpc.series.list.useQuery();
  const { data: episodes, refetch: refetchEpisodes } = trpc.series.getEpisodes.useQuery(
    { seriesId: selectedSeries || 0 },
    { enabled: !!selectedSeries }
  );

  const createSeriesMutation = trpc.series.create.useMutation();
  const updateSeriesMutation = trpc.series.update.useMutation();
  const deleteSeriesMutation = trpc.series.delete.useMutation();
  const createEpisodeMutation = trpc.episodes.create.useMutation();
  const updateEpisodeMutation = trpc.episodes.update.useMutation();
  const deleteEpisodeMutation = trpc.episodes.delete.useMutation();

  // ==================== نماذج ====================

  const [seriesForm, setSeriesForm] = useState({
    titleAr: "",
    genre: "",
    posterUrl: "",
  });

  const [episodeForm, setEpisodeForm] = useState({
    episodeNumber: "",
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

    createSeriesMutation.mutate(
      {
        titleAr: seriesForm.titleAr,
        genre: seriesForm.genre,
        posterUrl: seriesForm.posterUrl,
      },
      {
        onSuccess: () => {
          toast.success("تم إضافة المسلسل بنجاح!");
          setSeriesForm({ titleAr: "", genre: "", posterUrl: "" });
          setPosterFile(null);
          refetchSeries();
        },
        onError: (error: any) => {
          toast.error(error.message || "فشل إضافة المسلسل");
        },
      }
    );
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

    createEpisodeMutation.mutate(
      {
        seriesId: selectedSeries,
        episodeNumber: parseInt(episodeForm.episodeNumber) || 1,
        titleAr: episodeForm.titleAr,
        videoUrl: episodeForm.videoUrl,
      },
      {
        onSuccess: () => {
          toast.success("تم إضافة الحلقة بنجاح!");
          setEpisodeForm({ episodeNumber: "", titleAr: "", videoUrl: "" });
          refetchEpisodes();
        },
        onError: (error: any) => {
          toast.error(error.message || "فشل إضافة الحلقة");
        },
      }
    );
  };

  const handleDeleteSeries = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا المسلسل؟")) {
      deleteSeriesMutation.mutate(
        { id },
        {
          onSuccess: () => {
            toast.success("تم حذف المسلسل بنجاح!");
            refetchSeries();
          },
          onError: (error: any) => {
            toast.error(error.message || "فشل حذف المسلسل");
          },
        }
      );
    }
  };

  const handleDeleteEpisode = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه الحلقة؟")) {
      deleteEpisodeMutation.mutate(
        { id },
        {
          onSuccess: () => {
            toast.success("تم حذف الحلقة بنجاح!");
            refetchEpisodes();
          },
          onError: (error: any) => {
            toast.error(error.message || "فشل حذف الحلقة");
          },
        }
      );
    }
  };

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPosterFile(file);
    // في الإصدار الحقيقي، ستحتاج إلى رفع الصورة إلى S3 أو خادم
    // وتحديث URL البانر
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
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">لوحة التحكم</h1>
        <p className="text-muted-foreground mb-6">إدارة المسلسلات والحلقات</p>

        <Tabs defaultValue="series" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="series">المسلسلات</TabsTrigger>
            <TabsTrigger value="episodes">الحلقات</TabsTrigger>
          </TabsList>

          {/* ==================== تبويب المسلسلات ==================== */}
          <TabsContent value="series" className="space-y-6">
            {/* نموذج إضافة مسلسل */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  إضافة مسلسل جديد
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddSeries} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      اسم المسلسل (عربي)
                    </label>
                    <Input
                      placeholder="مثال: تخاريف"
                      value={seriesForm.titleAr}
                      onChange={(e) =>
                        setSeriesForm({ ...seriesForm, titleAr: e.target.value })
                      }
                      required
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
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      البانر
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handlePosterUpload}
                        className="flex-1"
                      />
                      {posterFile && (
                        <span className="text-sm text-green-500 flex items-center">
                          ✓ تم اختيار الصورة
                        </span>
                      )}
                    </div>
                    {seriesForm.posterUrl && (
                      <div className="mt-2">
                        <img
                          src={seriesForm.posterUrl}
                          alt="معاينة البانر"
                          className="w-32 h-48 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={createSeriesMutation.isPending}
                  >
                    {createSeriesMutation.isPending ? "جاري الإضافة..." : "إضافة المسلسل"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* قائمة المسلسلات */}
            <Card>
              <CardHeader>
                <CardTitle>المسلسلات الموجودة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {seriesList?.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{s.titleAr}</p>
                        <p className="text-sm text-muted-foreground">{s.genre}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedSeries(s.id)}
                        >
                          عرض الحلقات
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
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== تبويب الحلقات ==================== */}
          <TabsContent value="episodes" className="space-y-6">
            {!selectedSeries ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    اختر مسلسل من تبويب المسلسلات لإدارة الحلقات
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* نموذج إضافة حلقة */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      إضافة حلقة جديدة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddEpisode} className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          رقم الحلقة
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
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          اسم الحلقة
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
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          رابط يوتيوب
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
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90"
                        disabled={createEpisodeMutation.isPending}
                      >
                        {createEpisodeMutation.isPending
                          ? "جاري الإضافة..."
                          : "إضافة الحلقة"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* قائمة الحلقات */}
                <Card>
                  <CardHeader>
                    <CardTitle>الحلقات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {episodes?.map((ep) => (
                        <div
                          key={ep.id}
                          className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                        >
                          <div>
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
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
