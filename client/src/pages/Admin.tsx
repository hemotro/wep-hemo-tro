import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Trash2, Play, AlertCircle, Edit2, Link as LinkIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { AdminCodeModal } from "@/components/AdminCodeModal";

export default function Admin() {
  const [, navigate] = useLocation();
  const [selectedSeries, setSelectedSeries] = useState<number | null>(null);
  const [showSeriesForm, setShowSeriesForm] = useState(false);
  const [showEpisodeForm, setShowEpisodeForm] = useState(false);
  const [editingSeriesId, setEditingSeriesId] = useState<number | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);

  // فحص التحقق من الرمز عند تحميل الصفحة
  useEffect(() => {
    const verified = sessionStorage.getItem("adminCodeVerified");
    if (verified === "true") {
      setIsCodeVerified(true);
    } else {
      setShowCodeModal(true);
    }
  }, []);

  const handleCodeSuccess = () => {
    setIsCodeVerified(true);
    setShowCodeModal(false);
    sessionStorage.setItem("adminCodeVerified", "true");
    toast.success("تم الدخول إلى لوحة التحكم!");
  };

  // إذا لم يتم التحقق من الرمز، عرض النموذج فقط
  if (!isCodeVerified) {
    return (
      <>
        <AdminCodeModal
          isOpen={showCodeModal}
          onClose={() => navigate("/")}
          onSuccess={handleCodeSuccess}
        />
      </>
    );
  }

  // Queries و Mutations - يتم استدعاؤها بعد التحقق من الرمز فقط
  const { data: seriesList, refetch: refetchSeries, isLoading: seriesLoading } = trpc.series.list.useQuery(
    undefined,
    { enabled: isCodeVerified }
  );
  const { data: episodes, refetch: refetchEpisodes } = trpc.series.getEpisodes.useQuery(
    { seriesId: selectedSeries || 0 },
    { enabled: isCodeVerified && !!selectedSeries }
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
    descriptionAr: "",
    genre: "",
    posterUrl: "",
  });

  const [episodeForm, setEpisodeForm] = useState({
    episodeNumber: "",
    titleAr: "",
    thumbnailUrl: "",
    videoUrl: "",
  });

  // ==================== معالجات المسلسلات ====================

  const handleAddSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seriesForm.titleAr.trim()) {
      toast.error("اسم المسلسل مطلوب");
      return;
    }

    try {
      if (editingSeriesId) {
        // تعديل مسلسل موجود
        await updateSeriesMutation.mutateAsync({
          id: editingSeriesId,
          titleAr: seriesForm.titleAr,
          descriptionAr: seriesForm.descriptionAr || "",
          genre: seriesForm.genre || "",
          posterUrl: seriesForm.posterUrl || "",
        });
        toast.success("تم تحديث المسلسل بنجاح!");
        setEditingSeriesId(null);
      } else {
        // إضافة مسلسل جديد
        await createSeriesMutation.mutateAsync({
          titleAr: seriesForm.titleAr,
          descriptionAr: seriesForm.descriptionAr || "",
          genre: seriesForm.genre || "",
          posterUrl: seriesForm.posterUrl || "",
        });
        toast.success("تم إضافة المسلسل بنجاح!");
      }
      setSeriesForm({ titleAr: "", descriptionAr: "", genre: "", posterUrl: "" });
      setShowSeriesForm(false);
      refetchSeries();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ");
    }
  };

  const handleDeleteSeries = async (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا المسلسل؟")) {
      try {
        await deleteSeriesMutation.mutateAsync({ id });
        toast.success("تم حذف المسلسل بنجاح!");
        refetchSeries();
      } catch (error: any) {
        toast.error(error.message || "حدث خطأ");
      }
    }
  };

  const handleEditSeries = (series: any) => {
    setEditingSeriesId(series.id);
    setSeriesForm({
      titleAr: series.titleAr,
      descriptionAr: series.descriptionAr || "",
      genre: series.genre || "",
      posterUrl: series.posterUrl || "",
    });
    setShowSeriesForm(true);
  };

  // ==================== معالجات الحلقات ====================

  const handleAddEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeries) {
      toast.error("يرجى اختيار مسلسل أولاً");
      return;
    }

    if (!episodeForm.episodeNumber || !episodeForm.titleAr) {
      toast.error("رقم الحلقة والعنوان مطلوبان");
      return;
    }

    try {
      await createEpisodeMutation.mutateAsync({
        seriesId: selectedSeries,
        episodeNumber: parseInt(episodeForm.episodeNumber),
        titleAr: episodeForm.titleAr,
        thumbnailUrl: episodeForm.thumbnailUrl || "",
        videoUrl: episodeForm.videoUrl || "",
      });
      toast.success("تم إضافة الحلقة بنجاح!");
      setEpisodeForm({
        episodeNumber: "",
        titleAr: "",
        thumbnailUrl: "",
        videoUrl: "",
      });
      setShowEpisodeForm(false);
      refetchEpisodes();
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ");
    }
  };

  const handleDeleteEpisode = async (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه الحلقة؟")) {
      try {
        await deleteEpisodeMutation.mutateAsync({ id });
        toast.success("تم حذف الحلقة بنجاح!");
        refetchEpisodes();
      } catch (error: any) {
        toast.error(error.message || "حدث خطأ");
      }
    }
  };

  const handleUploadVideo = async (episodeId: number) => {
    navigate(`/upload-video/${episodeId}`);
  };

  return (
    <div className="flex-1 pb-20">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">لوحة التحكم الإدارية</h1>
          <Button
            variant="outline"
            onClick={() => {
              sessionStorage.removeItem("adminCodeVerified");
              setIsCodeVerified(false);
              navigate("/");
            }}
          >
            تسجيل خروج
          </Button>
        </div>

        <Tabs defaultValue="series" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="series">المسلسلات</TabsTrigger>
            <TabsTrigger value="episodes">الحلقات</TabsTrigger>
          </TabsList>

          {/* تبويب المسلسلات */}
          <TabsContent value="series" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">إدارة المسلسلات</h2>
              <Button
                onClick={() => {
                  setEditingSeriesId(null);
                  setSeriesForm({ titleAr: "", descriptionAr: "", genre: "", posterUrl: "" });
                  setShowSeriesForm(!showSeriesForm);
                }}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                {showSeriesForm ? "إلغاء" : "إضافة مسلسل"}
              </Button>
            </div>

            {showSeriesForm && (
              <Card>
                <CardHeader>
                  <CardTitle>{editingSeriesId ? "تعديل المسلسل" : "إضافة مسلسل جديد"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddSeries} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">اسم المسلسل</label>
                      <Input
                        value={seriesForm.titleAr}
                        onChange={(e) => setSeriesForm({ ...seriesForm, titleAr: e.target.value })}
                        placeholder="أدخل اسم المسلسل"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">الوصف</label>
                      <Input
                        value={seriesForm.descriptionAr}
                        onChange={(e) =>
                          setSeriesForm({ ...seriesForm, descriptionAr: e.target.value })
                        }
                        placeholder="أدخل وصف المسلسل"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">النوع</label>
                      <Input
                        value={seriesForm.genre}
                        onChange={(e) => setSeriesForm({ ...seriesForm, genre: e.target.value })}
                        placeholder="مثال: درامي، كوميديا"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">رابط الصورة</label>
                      <Input
                        value={seriesForm.posterUrl}
                        onChange={(e) =>
                          setSeriesForm({ ...seriesForm, posterUrl: e.target.value })
                        }
                        placeholder="أدخل رابط صورة المسلسل"
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      {editingSeriesId ? "تحديث" : "إضافة"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {seriesLoading ? (
              <div className="text-center py-8">جاري التحميل...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {seriesList?.map((series: any) => (
                  <Card key={series.id} className="overflow-hidden hover:shadow-lg transition">
                    {series.posterUrl && (
                      <img
                        src={series.posterUrl}
                        alt={series.titleAr}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2">{series.titleAr}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{series.genre}</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditSeries(series)}
                          className="flex-1"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteSeries(series.id)}
                          className="flex-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* تبويب الحلقات */}
          <TabsContent value="episodes" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">اختر مسلسل</label>
                <select
                  value={selectedSeries || ""}
                  onChange={(e) => setSelectedSeries(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full border rounded-md p-2 bg-background"
                >
                  <option value="">-- اختر مسلسل --</option>
                  {seriesList?.map((series: any) => (
                    <option key={series.id} value={series.id}>
                      {series.titleAr}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSeries && (
                <>
                  <Button
                    onClick={() => setShowEpisodeForm(!showEpisodeForm)}
                    className="w-full gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {showEpisodeForm ? "إلغاء" : "إضافة حلقة"}
                  </Button>

                  {showEpisodeForm && (
                    <Card>
                      <CardHeader>
                        <CardTitle>إضافة حلقة جديدة</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleAddEpisode} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">رقم الحلقة</label>
                            <Input
                              type="number"
                              value={episodeForm.episodeNumber}
                              onChange={(e) =>
                                setEpisodeForm({ ...episodeForm, episodeNumber: e.target.value })
                              }
                              placeholder="1"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">عنوان الحلقة</label>
                            <Input
                              value={episodeForm.titleAr}
                              onChange={(e) =>
                                setEpisodeForm({ ...episodeForm, titleAr: e.target.value })
                              }
                              placeholder="أدخل عنوان الحلقة"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">رابط الصورة المصغرة</label>
                            <Input
                              value={episodeForm.thumbnailUrl}
                              onChange={(e) =>
                                setEpisodeForm({ ...episodeForm, thumbnailUrl: e.target.value })
                              }
                              placeholder="أدخل رابط الصورة"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">رابط الفيديو</label>
                            <Input
                              value={episodeForm.videoUrl}
                              onChange={(e) =>
                                setEpisodeForm({ ...episodeForm, videoUrl: e.target.value })
                              }
                              placeholder="أدخل رابط الفيديو"
                            />
                          </div>
                          <Button type="submit" className="w-full">
                            إضافة الحلقة
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  <div className="space-y-2">
                    {episodes?.map((episode: any) => (
                      <Card key={episode.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold">
                              الحلقة {episode.episodeNumber}: {episode.titleAr}
                            </h4>
                            {episode.videoUrl && (
                              <p className="text-sm text-muted-foreground mt-1">
                                <LinkIcon className="w-3 h-3 inline mr-1" />
                                فيديو مرفوع
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUploadVideo(episode.id)}
                              className="gap-2"
                            >
                              <Play className="w-4 h-4" />
                              رفع فيديو
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteEpisode(episode.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
