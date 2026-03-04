import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Trash2, Play, AlertCircle, Edit2, Link as LinkIcon } from "lucide-react";
import { useState } from "react";
import { SeriesImagesManager } from "@/components/SeriesImagesManager";
import { useNotifications } from "@/components/Notifications";

export default function Admin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedSeries, setSelectedSeries] = useState<number | null>(null);
  const [showSeriesForm, setShowSeriesForm] = useState(false);
  const [showEpisodeForm, setShowEpisodeForm] = useState(false);
  const [editingSeriesId, setEditingSeriesId] = useState<number | null>(null);


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
  const updateSeriesMutation = trpc.series.update.useMutation();
  const deleteSeriesMutation = trpc.series.delete.useMutation();
  const createEpisodeMutation = trpc.episodes.create.useMutation();
  const updateEpisodeMutation = trpc.episodes.update.useMutation();
  const deleteEpisodeMutation = trpc.episodes.delete.useMutation();
  const uploadVideoMutation = trpc.videos.upload.useMutation();

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
    videoType: "mp4" as "mp4" | "m3u8",
  });

  const [isUploading, setIsUploading] = useState(false);
  const { success: notifySuccess, error: notifyError } = useNotifications();

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
      toast.error(error.message || "فشل إضافة المسلسل");
    }
  };

  // ==================== معالجات الحلقات ====================

  const handleAddEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeries) {
      notifyError("خطأ", "اختر مسلسل أولاً");
      return;
    }
    if (!episodeForm.titleAr.trim()) {
      notifyError("خطأ", "اسم الحلقة مطلوب");
      return;
    }
    if (!episodeForm.videoUrl.trim()) {
      notifyError("خطأ", "يجب إدخال رابط الفيديو (mp4 أو m3u8)");
      return;
    }

    try {
      setIsUploading(true);
      const episodeNumber = parseInt(episodeForm.episodeNumber) || (episodes?.length || 0) + 1;
      
      // إنشاء الحلقة برابط الفيديو مباشرة
      await createEpisodeMutation.mutateAsync({
        seriesId: selectedSeries,
        season: 1,
        episodeNumber,
        titleAr: episodeForm.titleAr,
        videoUrl: episodeForm.videoUrl,
        thumbnailUrl: episodeForm.thumbnailUrl || undefined,
      });
      
      notifySuccess("تم بنجاح!", `تمت إضافة الحلقة ${episodeNumber} بنجاح`);
      setEpisodeForm({ episodeNumber: "", titleAr: "", thumbnailUrl: "", videoUrl: "", videoType: "mp4" });
      setShowEpisodeForm(false);
      refetchEpisodes();
    } catch (error: any) {
      notifyError("خطأ", error.message || "فشل إضافة الحلقة");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteEpisode = async (episodeId: number) => {
    if (!confirm("هل تريد حذف هذه الحلقة؟")) return;
    try {
      await deleteEpisodeMutation.mutateAsync({ id: episodeId });
      toast.success("تم حذف الحلقة بنجاح!");
      refetchEpisodes();
    } catch (error: any) {
      toast.error(error.message || "فشل حذف الحلقة");
    }
  };

  const handleDeleteSeries = async (seriesId: number) => {
    if (!confirm("هل تريد حذف هذا المسلسل؟")) return;
    try {
      await deleteSeriesMutation.mutateAsync({ id: seriesId });
      toast.success("تم حذف المسلسل بنجاح!");
      setSelectedSeries(null);
      refetchSeries();
    } catch (error: any) {
      toast.error(error.message || "فشل حذف المسلسل");
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

  return (
    <div className="flex-1 pb-20 px-4 py-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">لوحة التحكم</h1>
        <p className="text-muted-foreground">إدارة المسلسلات والحلقات والقنوات</p>
      </div>

      <Tabs defaultValue="series" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="series">المسلسلات</TabsTrigger>
          <TabsTrigger value="episodes" disabled={!selectedSeries}>الحلقات</TabsTrigger>
          <TabsTrigger value="images" disabled={!selectedSeries}>الصور</TabsTrigger>
          <TabsTrigger value="channels">القنوات</TabsTrigger>
          <TabsTrigger value="promo">البرومو</TabsTrigger>
        </TabsList>

        {/* تبويب المسلسلات */}
        <TabsContent value="series">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>المسلسلات</CardTitle>
            </CardHeader>
            <CardContent>
              {!showSeriesForm ? (
                <Button onClick={() => setShowSeriesForm(true)} className="mb-6">
                  <Plus className="w-4 h-4 mr-2" />
                  إضافة مسلسل جديد
                </Button>
              ) : (
                <form onSubmit={handleAddSeries} className="mb-6 p-4 bg-secondary rounded-lg">
                  <h3 className="font-bold mb-4 text-foreground">
                    {editingSeriesId ? "تعديل المسلسل" : "إضافة مسلسل جديد"}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        اسم المسلسل
                      </label>
                      <Input
                        value={seriesForm.titleAr}
                        onChange={(e) => setSeriesForm(prev => ({ ...prev, titleAr: e.target.value }))}
                        placeholder="اسم المسلسل"
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        الوصف
                      </label>
                      <textarea
                        value={seriesForm.descriptionAr}
                        onChange={(e) => setSeriesForm(prev => ({ ...prev, descriptionAr: e.target.value }))}
                        placeholder="وصف المسلسل"
                        className="w-full p-2 bg-background border border-border rounded text-foreground"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        النوع
                      </label>
                      <Input
                        value={seriesForm.genre}
                        onChange={(e) => setSeriesForm(prev => ({ ...prev, genre: e.target.value }))}
                        placeholder="مثال: درامي، أكشن"
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        رابط البانر
                      </label>
                      <Input
                        type="url"
                        value={seriesForm.posterUrl}
                        onChange={(e) => setSeriesForm(prev => ({ ...prev, posterUrl: e.target.value }))}
                        placeholder="https://example.com/poster.jpg"
                        className="bg-background border-border text-foreground"
                      />
                      {seriesForm.posterUrl && (
                        <img src={seriesForm.posterUrl} alt="معاينة" className="mt-3 h-32 rounded-lg object-cover" />
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">
                        {editingSeriesId ? "تحديث" : "إضافة"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowSeriesForm(false);
                          setEditingSeriesId(null);
                          setSeriesForm({ titleAr: "", descriptionAr: "", genre: "", posterUrl: "" });
                        }}
                        className="flex-1"
                      >
                        إلغاء
                      </Button>
                    </div>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {seriesLoading ? (
                  <p className="text-muted-foreground">جاري التحميل...</p>
                ) : seriesList && seriesList.length > 0 ? (
                  seriesList.map((series: any) => (
                    <div
                      key={series.id}
                      className={`p-4 rounded-lg border cursor-pointer transition ${
                        selectedSeries === series.id
                          ? "bg-primary/10 border-primary"
                          : "bg-secondary border-border hover:bg-secondary/80"
                      }`}
                      onClick={() => setSelectedSeries(series.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-bold text-foreground">{series.titleAr}</h3>
                          <p className="text-sm text-muted-foreground">{series.genre}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditSeries(series);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSeries(series.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">لا توجد مسلسلات</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب الحلقات */}
        <TabsContent value="episodes">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>الحلقات</CardTitle>
            </CardHeader>
            <CardContent>
              {!showEpisodeForm ? (
                <Button onClick={() => setShowEpisodeForm(true)} className="mb-6">
                  <Plus className="w-4 h-4 mr-2" />
                  إضافة حلقة جديدة
                </Button>
              ) : (
                <form onSubmit={handleAddEpisode} className="mb-6 p-4 bg-secondary rounded-lg">
                  <h3 className="font-bold mb-4 text-foreground">إضافة حلقة جديدة</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        رقم الحلقة
                      </label>
                      <Input
                        type="number"
                        value={episodeForm.episodeNumber}
                        onChange={(e) => setEpisodeForm(prev => ({ ...prev, episodeNumber: e.target.value }))}
                        placeholder="1"
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        اسم الحلقة
                      </label>
                      <Input
                        value={episodeForm.titleAr}
                        onChange={(e) => setEpisodeForm(prev => ({ ...prev, titleAr: e.target.value }))}
                        placeholder="اسم الحلقة"
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        <LinkIcon className="w-4 h-4 inline mr-2" />
                        رابط الفيديو
                      </label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEpisodeForm(prev => ({ ...prev, videoType: "mp4" }))}
                            className={`flex-1 py-2 px-3 rounded text-sm font-medium transition ${episodeForm.videoType === "mp4" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"}`}
                          >
                            MP4
                          </button>
                          <button
                            type="button"
                            onClick={() => setEpisodeForm(prev => ({ ...prev, videoType: "m3u8" }))}
                            className={`flex-1 py-2 px-3 rounded text-sm font-medium transition ${episodeForm.videoType === "m3u8" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"}`}
                          >
                            M3U8
                          </button>
                        </div>
                        <Input
                          type="url"
                          value={episodeForm.videoUrl}
                          onChange={(e) => setEpisodeForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                          placeholder={episodeForm.videoType === "mp4" ? "https://example.com/video.mp4" : "https://example.com/stream.m3u8"}
                          className="bg-background border-border text-foreground"
                        />
                        <p className="text-xs text-muted-foreground">
                          {episodeForm.videoType === "mp4" ? "أدخل رابط ملف فيديو MP4" : "أدخل رابط بث M3U8 (HLS)"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        رابط الصورة المصغرة (اختياري)
                      </label>
                      <Input
                        type="url"
                        value={episodeForm.thumbnailUrl}
                        onChange={(e) => setEpisodeForm(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                        placeholder="https://example.com/thumbnail.jpg"
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" disabled={isUploading} className="flex-1">
                        {isUploading ? "جاري الرفع..." : "إضافة الحلقة"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowEpisodeForm(false);
                          setEpisodeForm({ episodeNumber: "", titleAr: "", thumbnailUrl: "", videoUrl: "", videoType: "mp4" });
                        }}
                        className="flex-1"
                      >
                        إلغاء
                      </Button>
                    </div>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {episodes && episodes.length > 0 ? (
                  episodes.map((episode: any) => (
                    <div key={episode.id} className="p-4 rounded-lg bg-secondary border border-border">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-bold text-foreground">
                            الحلقة {episode.episodeNumber}: {episode.titleAr}
                          </h3>
                          {episode.thumbnailUrl && (
                            <img src={episode.thumbnailUrl} alt="thumbnail" className="mt-2 h-20 rounded object-cover" />
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteEpisode(episode.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">لا توجد حلقات</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب الصور */}
        <TabsContent value="images">
          {selectedSeries && <SeriesImagesManager seriesId={selectedSeries} />}
        </TabsContent>

        {/* تبويب القنوات */}
        <TabsContent value="channels">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>إدارة القنوات</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">قم بزيارة صفحة البث المباشر لإدارة القنوات</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب البرومو */}
        <TabsContent value="promo">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>إدارة البرومو</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">قم بإضافة فيديوهات ترويجية للمسلسلات</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
