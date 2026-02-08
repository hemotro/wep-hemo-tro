'use client';

import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Trash2, Play, AlertCircle, Edit2 } from "lucide-react";
import { useState } from "react";
import { SeriesImagesManager } from "@/components/SeriesImagesManager";

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
    videoUrl: "",
    thumbnailUrl: "",
    videoFile: null as File | null,
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
      toast.error(error.message || "فشل العملية");
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

  const handleDeleteSeries = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا المسلسل؟")) return;
    
    try {
      await deleteSeriesMutation.mutateAsync({ id });
      toast.success("تم حذف المسلسل بنجاح!");
      setSelectedSeries(null);
      refetchSeries();
    } catch (error: any) {
      toast.error(error.message || "فشل الحذف");
    }
  };

  // ==================== معالجات الحلقات ====================

  const handleAddEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeries) {
      toast.error("اختر مسلسل أولاً");
      return;
    }
    if (!episodeForm.titleAr.trim()) {
      toast.error("اسم الحلقة مطلوب");
      return;
    }
    if (!episodeForm.videoFile && !episodeForm.videoUrl) {
      toast.error("يجب رفع فيديو أو إدخال رابط يوتيوب");
      return;
    }

    try {
      const episodeNumber = parseInt(episodeForm.episodeNumber) || (episodes?.length || 0) + 1;
      
      // إنشاء الحلقة أولاً
      const createdEpisode = await createEpisodeMutation.mutateAsync({
        seriesId: selectedSeries,
        season: 1,
        episodeNumber,
        titleAr: episodeForm.titleAr,
        videoUrl: episodeForm.videoUrl || "",
        thumbnailUrl: episodeForm.thumbnailUrl || undefined,
      });

      // إذا تم رفع ملف فيديو، قم برفعه
      if (episodeForm.videoFile && createdEpisode && 'id' in createdEpisode) {
        const fileBuffer = await episodeForm.videoFile.arrayBuffer();
        await uploadVideoMutation.mutateAsync({
          episodeId: (createdEpisode as any).id,
          fileName: episodeForm.videoFile.name,
          fileBuffer: new Uint8Array(fileBuffer) as any,
          fileSize: episodeForm.videoFile.size,
          mimeType: episodeForm.videoFile.type,
          duration: 0,
        });
      }
      
      toast.success("تم إضافة الحلقة بنجاح!");
      setEpisodeForm({ episodeNumber: "", titleAr: "", videoUrl: "", thumbnailUrl: "", videoFile: null });
      setShowEpisodeForm(false);
      refetchEpisodes();
    } catch (error: any) {
      toast.error(error.message || "فشل إضافة الحلقة");
    }
  };

  const handleDeleteEpisode = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه الحلقة؟")) return;
    
    try {
      await deleteEpisodeMutation.mutateAsync({ id });
      toast.success("تم حذف الحلقة بنجاح!");
      refetchEpisodes();
    } catch (error: any) {
      toast.error(error.message || "فشل الحذف");
    }
  };

  // ==================== واجهة المستخدم ====================

  return (
    <div className="flex-1 pb-20 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">لوحة التحكم</h1>
          <p className="text-muted-foreground">إدارة المسلسلات والحلقات</p>
        </div>

        <Tabs defaultValue="series" className="w-full">
          <TabsList>
            <TabsTrigger value="series">المسلسلات</TabsTrigger>
            <TabsTrigger value="episodes">الحلقات</TabsTrigger>
            <TabsTrigger value="images">إدارة الصور</TabsTrigger>
            <TabsTrigger value="promo">البرومو</TabsTrigger>
            <TabsTrigger value="channels">القنوات المباشرة</TabsTrigger>
          </TabsList>

          {/* ==================== تبويب المسلسلات ==================== */}
          <TabsContent value="series" className="space-y-4">
            <Button
              onClick={() => {
                setEditingSeriesId(null);
                setSeriesForm({ titleAr: "", descriptionAr: "", genre: "", posterUrl: "" });
                setShowSeriesForm(!showSeriesForm);
              }}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              {showSeriesForm ? "إلغاء" : "إضافة مسلسل جديد"}
            </Button>

            {showSeriesForm && (
              <Card className="bg-secondary border-border">
                <CardHeader>
                  <CardTitle>{editingSeriesId ? "تعديل المسلسل" : "إضافة مسلسل جديد"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddSeries} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        اسم المسلسل
                      </label>
                      <Input
                        value={seriesForm.titleAr}
                        onChange={(e) => setSeriesForm(prev => ({ ...prev, titleAr: e.target.value }))}
                        placeholder="أدخل اسم المسلسل"
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
                        placeholder="أدخل وصف المسلسل..."
                        rows={4}
                        className="w-full p-2 rounded-lg bg-background border border-border text-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        التصنيف
                      </label>
                      <Input
                        value={seriesForm.genre}
                        onChange={(e) => setSeriesForm(prev => ({ ...prev, genre: e.target.value }))}
                        placeholder="مثال: درامي، رعب، كوميديا"
                        className="bg-background border-border text-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        رابط البانر (URL)
                      </label>
                      <Input
                        type="url"
                        value={seriesForm.posterUrl}
                        onChange={(e) => setSeriesForm(prev => ({ ...prev, posterUrl: e.target.value }))}
                        placeholder="https://example.com/banner.jpg"
                        className="bg-background border-border text-foreground"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        أدخل رابط الصورة مباشرة (JPG, PNG, WebP)
                      </p>
                      {seriesForm.posterUrl && (
                        <div className="mt-3 relative w-full h-32 rounded-lg overflow-hidden border border-border bg-black">
                          <img 
                            src={seriesForm.posterUrl} 
                            alt="معاينة" 
                            className="w-full h-full object-cover"
                            onError={() => {
                              toast.error("فشل تحميل الصورة - تحقق من الرابط");
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={createSeriesMutation.isPending || updateSeriesMutation.isPending}>
                      {editingSeriesId ? "تحديث المسلسل" : "إضافة المسلسل"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {seriesList?.map((series: any) => (
                <Card
                  key={series.id}
                  className={`cursor-pointer transition-all ${
                    selectedSeries === series.id
                      ? "bg-primary/10 border-primary"
                      : "bg-secondary border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedSeries(series.id)}
                >
                  <CardContent className="p-4">
                    {series.posterUrl && (
                      <div className="mb-3 relative w-full h-32 rounded-lg overflow-hidden border border-border">
                        <img src={series.posterUrl} alt={series.titleAr} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <h4 className="font-semibold text-foreground mb-1">{series.titleAr}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{series.genre}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditSeries(series);
                        }}
                        className="flex-1"
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        تعديل
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSeries(series.id);
                        }}
                        className="flex-1"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        حذف
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ==================== تبويب الحلقات ==================== */}
          <TabsContent value="episodes" className="space-y-4">
            {!selectedSeries ? (
              <Card className="bg-secondary border-border">
                <CardContent className="p-6 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">اختر مسلسل من التبويب السابق لإضافة الحلقات</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Button
                  onClick={() => setShowEpisodeForm(!showEpisodeForm)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {showEpisodeForm ? "إلغاء" : "إضافة حلقة جديدة"}
                </Button>

                {showEpisodeForm && (
                  <Card className="bg-secondary border-border">
                    <CardHeader>
                      <CardTitle>إضافة حلقة جديدة</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleAddEpisode} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            رقم الحلقة (اختياري)
                          </label>
                          <Input
                            type="number"
                            value={episodeForm.episodeNumber}
                            onChange={(e) => setEpisodeForm(prev => ({ ...prev, episodeNumber: e.target.value }))}
                            placeholder={`سيتم تعيين الرقم تلقائياً: ${(episodes?.length || 0) + 1}`}
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
                            placeholder="أدخل اسم الحلقة"
                            className="bg-background border-border text-foreground"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            رفع ملف الفيديو
                          </label>
                          <Input
                            type="file"
                            accept="video/*"
                            onChange={(e) => setEpisodeForm(prev => ({ ...prev, videoFile: e.target.files?.[0] || null }))}
                            className="bg-background border-border text-foreground"
                          />
                          {episodeForm.videoFile && (
                            <p className="text-sm text-green-600 mt-2">✓ تم اختيار: {episodeForm.videoFile.name}</p>
                          )}
                        </div>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border"></div>
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-secondary text-muted-foreground">أو</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            رابط يوتيوب (بديل)
                          </label>
                          <Input
                            value={episodeForm.videoUrl}
                            onChange={(e) => setEpisodeForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                            placeholder="https://youtu.be/..."
                            className="bg-background border-border text-foreground"
                          />
                          {episodeForm.videoUrl && (
                            <div className="mt-3 relative w-full h-48 rounded-lg overflow-hidden border border-border bg-black">
                              <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${episodeForm.videoUrl.split('youtu.be/')[1]?.split('?')[0] || episodeForm.videoUrl.split('v=')[1]?.split('&')[0]}`}
                                title="معاينة"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              ></iframe>
                            </div>
                          )}
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
                          <p className="text-xs text-muted-foreground mt-1">
                            اختياري: صورة مصغرة للحلقة بحجم 16:9
                          </p>
                        </div>

                        <Button type="submit" className="w-full" disabled={createEpisodeMutation.isPending}>
                          إضافة الحلقة
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-2">
                  {episodes?.map((episode: any) => (
                    <Card key={episode.id} className="bg-secondary border-border">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Play className="w-4 h-4 text-primary" />
                            <h4 className="font-semibold text-foreground">الحلقة {episode.episodeNumber}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">{episode.titleAr}</p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteEpisode(episode.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* ==================== تبويب إدارة الصور ==================== */}
          <TabsContent value="images" className="space-y-4">
            {selectedSeries ? (
              <SeriesImagesManager seriesId={selectedSeries} />
            ) : (
              <Card className="bg-secondary border-border">
                <CardContent className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">اختر مسلسلاً من تبويب المسلسلات أولاً</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ==================== تبويب البرومو ==================== */}
          <TabsContent value="promo" className="space-y-4">
            <PromoManager seriesId={selectedSeries} />
          </TabsContent>

          {/* ==================== تبويب القنوات ==================== */}
          <TabsContent value="channels" className="space-y-4">
            <ChannelsManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ==================== مكون إدارة البرومو ====================
function PromoManager({ seriesId }: { seriesId: number | null }) {
  const [promoUrl, setPromoUrl] = useState("");
  const [promoTitle, setPromoTitle] = useState("");
  const updatePromoMutation = trpc.promo.update.useMutation();
  const { data: promo } = trpc.promo.get.useQuery(
    { seriesId: seriesId || 0 },
    { enabled: !!seriesId }
  );

  const handleUpdatePromo = async () => {
    if (!seriesId || !promoUrl.trim()) {
      toast.error("اختر مسلسلاً وأدخل رابط البرومو");
      return;
    }

    try {
      await updatePromoMutation.mutateAsync({
        seriesId,
        promoUrl,
        promoTitle: promoTitle || "برومو",
      });
      toast.success("تم تحديث البرومو بنجاح");
      setPromoUrl("");
      setPromoTitle("");
    } catch (error: any) {
      toast.error(error.message || "فشل تحديث البرومو");
    }
  };

  if (!seriesId) {
    return (
      <Card className="bg-secondary border-border">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">اختر مسلسلاً من تبويب المسلسلات أولاً</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-secondary border-border">
      <CardHeader>
        <CardTitle>إضافة برومو</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {promo && promo.promoUrl && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm text-primary mb-2">البرومو الحالي:</p>
            <p className="text-sm text-foreground break-all">{promo.promoUrl}</p>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            رابط البرومو (YouTube أو فيديو)
          </label>
          <Input
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={promoUrl}
            onChange={(e) => setPromoUrl(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            عنوان البرومو (اختياري)
          </label>
          <Input
            placeholder="مثل: البرومو الرسمي"
            value={promoTitle}
            onChange={(e) => setPromoTitle(e.target.value)}
          />
        </div>
        <Button
          onClick={handleUpdatePromo}
          disabled={updatePromoMutation.isPending}
          className="w-full"
        >
          {updatePromoMutation.isPending ? "جاري التحديث..." : "تحديث البرومو"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ==================== مكون إدارة القنوات ====================
function ChannelsManager() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    nameAr: "",
    logoUrl: "",
    streamUrl: "",
    streamType: "youtube" as "youtube" | "m3u8",
    descriptionAr: "",
  });

  const { data: channels = [], refetch } = trpc.channels.list.useQuery();
  const createChannelMutation = trpc.channels.create.useMutation();
  const deleteChannelMutation = trpc.channels.delete.useMutation();

  const handleCreateChannel = async () => {
    if (!formData.nameAr.trim() || !formData.streamUrl.trim()) {
      toast.error("ملء الحقول المطلوبة");
      return;
    }

    try {
      await createChannelMutation.mutateAsync({
        name: formData.name || formData.nameAr,
        nameAr: formData.nameAr,
        logoUrl: formData.logoUrl || undefined,
        streamUrl: formData.streamUrl,
        streamType: formData.streamType,
        descriptionAr: formData.descriptionAr || undefined,
      });
      toast.success("تم إضافة القناة بنجاح");
      setFormData({
        name: "",
        nameAr: "",
        logoUrl: "",
        streamUrl: "",
        streamType: "youtube",
        descriptionAr: "",
      });
      setShowForm(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "فشل إضافة القناة");
    }
  };

  const handleDeleteChannel = async (id: number) => {
    try {
      await deleteChannelMutation.mutateAsync({ id });
      toast.success("تم حذف القناة بنجاح");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "فشل حذف القناة");
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowForm(!showForm)} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        {showForm ? "إلغاء" : "إضافة قناة جديدة"}
      </Button>

      {showForm && (
        <Card className="bg-secondary border-border">
          <CardHeader>
            <CardTitle>إضافة قناة مباشرة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                اسم القناة (عربي)
              </label>
              <Input
                placeholder="مثل: قناة العربية"
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                اسم القناة (انجليزي)
              </label>
              <Input
                placeholder="Channel Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                رابط اللوقو (اختياري)
              </label>
              <Input
                type="url"
                placeholder="https://example.com/logo.png"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                نوع البث
              </label>
              <select
                value={formData.streamType}
                onChange={(e) => setFormData({ ...formData, streamType: e.target.value as "youtube" | "m3u8" })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
              >
                <option value="youtube">YouTube</option>
                <option value="m3u8">M3U8 Stream</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                رابط البث
              </label>
              <Input
                type="url"
                placeholder="https://www.youtube.com/watch?v=... أو https://example.com/stream.m3u8"
                value={formData.streamUrl}
                onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                الوصف (اختياري)
              </label>
              <Input
                placeholder="وصف القناة"
                value={formData.descriptionAr}
                onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
              />
            </div>
            <Button
              onClick={handleCreateChannel}
              disabled={createChannelMutation.isPending}
              className="w-full"
            >
              {createChannelMutation.isPending ? "جاري الإضافة..." : "إضافة القناة"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* قائمة القنوات */}
      <div className="space-y-2">
        {channels.length === 0 ? (
          <Card className="bg-secondary border-border">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">لا توجد قنوات بعد</p>
            </CardContent>
          </Card>
        ) : (
          channels.map((channel) => (
            <Card key={channel.id} className="bg-secondary border-border">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{channel.nameAr}</h3>
                  <p className="text-sm text-muted-foreground">{channel.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {channel.streamType === "youtube" ? "YouTube" : "M3U8"}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteChannel(channel.id)}
                  disabled={deleteChannelMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
