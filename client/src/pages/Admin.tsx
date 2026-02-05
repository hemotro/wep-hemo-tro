import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Trash2, Play, AlertCircle } from "lucide-react";

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
  const [youtubePreview, setYoutubePreview] = useState<string>("");

  // ==================== معالجات ====================

  const extractYoutubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const handleYoutubeUrlChange = (url: string) => {
    setEpisodeForm({ ...episodeForm, videoUrl: url });
    
    const youtubeId = extractYoutubeId(url);
    if (youtubeId) {
      setYoutubePreview(`https://www.youtube.com/embed/${youtubeId}`);
      toast.success("تم التعرف على رابط يوتيوب بنجاح!");
    } else {
      setYoutubePreview("");
    }
  };

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
    if (!episodeForm.titleAr.trim()) {
      toast.error("اسم الحلقة مطلوب");
      return;
    }
    if (!episodeForm.videoUrl.trim()) {
      toast.error("رابط يوتيوب مطلوب");
      return;
    }

    const youtubeId = extractYoutubeId(episodeForm.videoUrl);
    if (!youtubeId) {
      toast.error("رابط يوتيوب غير صحيح. تأكد من الرابط");
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
      setEpisodeForm({ episodeNumber: String(parseInt(episodeForm.episodeNumber) + 1), titleAr: "", videoUrl: "" });
      setYoutubePreview("");
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
              <h3 className="text-lg font-semibold text-foreground">المسلسلات الموجودة</h3>
              {seriesLoading ? (
                <p className="text-muted-foreground">جاري التحميل...</p>
              ) : seriesList && seriesList.length > 0 ? (
                seriesList.map((series) => (
                  <Card
                    key={series.id}
                    className={`cursor-pointer transition-all ${
                      selectedSeries === series.id
                        ? "bg-primary/10 border-primary"
                        : "bg-secondary border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedSeries(series.id)}
                  >
                    <CardContent className="p-4 flex justify-between items-center">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{series.titleAr}</h4>
                        <p className="text-sm text-muted-foreground">{series.genre}</p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSeries(series.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-muted-foreground">لا توجد مسلسلات حالياً</p>
              )}
            </div>
          </TabsContent>

          {/* ==================== تبويب الحلقات ==================== */}
          <TabsContent value="episodes" className="space-y-6">
            {/* اختيار المسلسل */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                اختر المسلسل *
              </label>
              <select
                value={selectedSeries || ""}
                onChange={(e) => setSelectedSeries(Number(e.target.value) || null)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
              >
                <option value="">-- اختر مسلسل --</option>
                {seriesList?.map((series) => (
                  <option key={series.id} value={series.id}>
                    {series.titleAr}
                  </option>
                ))}
              </select>
            </div>

            {selectedSeries && (
              <>
                {/* زر إضافة حلقة */}
                <Button
                  onClick={() => setShowEpisodeForm(!showEpisodeForm)}
                  className="w-full bg-primary hover:bg-primary/90 h-12 text-base"
                >
                  <Plus className="w-5 h-5 ml-2" />
                  إضافة حلقة جديدة
                </Button>

                {/* نموذج إضافة حلقة محسّن */}
                {showEpisodeForm && (
                  <Card className="bg-secondary border-primary/20">
                    <CardHeader>
                      <CardTitle>إضافة حلقة جديدة من يوتيوب</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleAddEpisode} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-foreground mb-2 block">
                              رقم الحلقة *
                            </label>
                            <Input
                              type="number"
                              min="1"
                              value={episodeForm.episodeNumber}
                              onChange={(e) =>
                                setEpisodeForm({ ...episodeForm, episodeNumber: e.target.value })
                              }
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
                                setEpisodeForm({ ...episodeForm, titleAr: e.target.value })
                              }
                              className="bg-background border-border"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">
                            رابط يوتيوب *
                          </label>
                          <div className="space-y-2">
                            <Input
                              placeholder="https://youtu.be/... أو https://www.youtube.com/watch?v=..."
                              value={episodeForm.videoUrl}
                              onChange={(e) => handleYoutubeUrlChange(e.target.value)}
                              className="bg-background border-border"
                            />
                            {!youtubePreview && episodeForm.videoUrl && (
                              <div className="flex items-center gap-2 text-yellow-500 text-sm">
                                <AlertCircle className="w-4 h-4" />
                                <span>رابط يوتيوب غير صحيح</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* معاينة الفيديو */}
                        {youtubePreview && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">معاينة الفيديو</label>
                            <div className="relative w-full bg-black rounded-lg overflow-hidden">
                              <iframe
                                width="100%"
                                height="300"
                                src={youtubePreview}
                                title="معاينة الفيديو"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 pt-4">
                          <Button
                            type="submit"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            disabled={createEpisodeMutation.isPending || !youtubePreview}
                          >
                            {createEpisodeMutation.isPending ? "جاري الإضافة..." : "إضافة الحلقة"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowEpisodeForm(false);
                              setYoutubePreview("");
                            }}
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
                  <h3 className="text-lg font-semibold text-foreground">الحلقات</h3>
                  {episodes && episodes.length > 0 ? (
                    episodes.map((episode) => (
                      <Card key={episode.id} className="bg-secondary border-border hover:border-primary/50">
                        <CardContent className="p-4 flex justify-between items-center">
                          <div className="flex items-center gap-3 flex-1">
                            <Play className="w-5 h-5 text-primary" />
                            <div>
                              <h4 className="font-semibold text-foreground">
                                الحلقة {episode.episodeNumber}: {episode.titleAr}
                              </h4>
                              <p className="text-xs text-muted-foreground truncate">{episode.videoUrl}</p>
                            </div>
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
                    ))
                  ) : (
                    <p className="text-muted-foreground">لا توجد حلقات لهذا المسلسل</p>
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
