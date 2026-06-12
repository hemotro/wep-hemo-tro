import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit2, ChevronUp, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminDisplaySections } from "./AdminDisplaySections";
import { AdminEditSeries } from "./AdminEditSeries";
import { AdminChannels } from "./AdminChannels";

export function AdminNew() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("series");
  const [adminCode, setAdminCode] = useState("");
  // الدخول التلقائي - حفظ دائم بدون انتهاء صلاحية
  const [isCodeVerified, setIsCodeVerified] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("adminCodeVerified") === "true";
    }
    return false;
  });
  const [showCodeModal, setShowCodeModal] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("adminCodeVerified") !== "true";
    }
    return true;
  });
  
  const verifyCodeMutation = trpc.auth.verifyAdminCode.useMutation();
  const seedRealDataMutation = trpc.seedRealData.useMutation();
  
  const handleVerifyCode = async () => {
    if (!adminCode) {
      toast.error("يرجى إدخال الرمز السري");
      return;
    }
    
    try {
      await verifyCodeMutation.mutateAsync({ code: adminCode });
      setIsCodeVerified(true);
      setShowCodeModal(false);
      // حفظ دائم بدون انتهاء صلاحية
      localStorage.setItem("adminCodeVerified", "true");
      // حفظ وقت التحقق (اختياري للمراجعة)
      localStorage.setItem("adminCodeVerifiedAt", new Date().toISOString());
      toast.success("تم التحقق بنجاح - الدخول التلقائي مفعل");
    } catch (error) {
      toast.error("الرمز السري غير صحيح");
      setAdminCode("");
    }
  };
  
  if (!isCodeVerified) {
    return (
      <Dialog open={showCodeModal} onOpenChange={(open) => {
        // منع إغلاق الـ Dialog بدون تحقق صحيح
        if (!open) return;
        setShowCodeModal(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>التحقق من الوصول</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">يرجى إدخال الرمز السري للوصول إلى لوحة الإدارة</p>
            <Input
              type="password"
              placeholder="الرمز السري"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
            />
            <Button
              onClick={handleVerifyCode}
              disabled={verifyCodeMutation.isPending}
              className="w-full"
            >
              {verifyCodeMutation.isPending ? "جاري التحقق..." : "تحقق"}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              ستبقى مسجل دخول بعد التحقق الناجح
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ==================== إدارة المسلسلات ====================
  const { data: seriesList, refetch: refetchSeries } = trpc.series.list.useQuery();
  const createSeriesMutation = trpc.series.create.useMutation();
  const updateSeriesMutation = trpc.series.update.useMutation();
  const deleteSeriesMutation = trpc.series.delete.useMutation();

  const [seriesForm, setSeriesForm] = useState({
    titleAr: "",
    descriptionAr: "",
    genre: "",
    posterUrl: "",
    status: "ongoing" as "ongoing" | "completed",
  });

  const handleCreateSeries = async () => {
    if (!seriesForm.titleAr) {
      toast.error("اسم المسلسل مطلوب");
      return;
    }

    try {
      await createSeriesMutation.mutateAsync({
        titleAr: seriesForm.titleAr,
        descriptionAr: seriesForm.descriptionAr,
        genre: seriesForm.genre,
        posterUrl: seriesForm.posterUrl,
      });
      toast.success("تم إضافة المسلسل بنجاح");
      setSeriesForm({ titleAr: "", descriptionAr: "", genre: "", posterUrl: "", status: "ongoing" });
      refetchSeries();
    } catch (error) {
      toast.error("حدث خطأ في إضافة المسلسل");
    }
  };

  const handleDeleteSeries = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا المسلسل؟")) return;
    try {
      await deleteSeriesMutation.mutateAsync({ id });
      toast.success("تم حذف المسلسل بنجاح");
      refetchSeries();
    } catch (error) {
      toast.error("حدث خطأ في حذف المسلسل");
    }
  };

  // ==================== إدارة الحلقات ====================
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null);
  const { data: episodes, refetch: refetchEpisodes } = trpc.series.getEpisodes.useQuery(
    { seriesId: selectedSeriesId || 0 },
    { enabled: !!selectedSeriesId }
  );

  const createEpisodeMutation = trpc.episodes.create.useMutation();
  const updateEpisodeMutation = trpc.episodes.update.useMutation();
  const deleteEpisodeMutation = trpc.episodes.delete.useMutation();

  const [episodeForm, setEpisodeForm] = useState({
    episodeNumber: "",
    titleAr: "",
    descriptionAr: "",
    videoUrl: "",
    videoType: "youtube" as "youtube" | "mp4" | "m3u8",
    video480pUrl: "",
    video720pUrl: "",
    video1080pUrl: "",
  });

  const handleCreateEpisode = async () => {
    if (!selectedSeriesId || !episodeForm.episodeNumber || !episodeForm.titleAr || !episodeForm.videoUrl) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    try {
      await createEpisodeMutation.mutateAsync({
        seriesId: selectedSeriesId,
        episodeNumber: parseInt(episodeForm.episodeNumber),
        titleAr: episodeForm.titleAr,
        descriptionAr: episodeForm.descriptionAr,
        videoUrl: episodeForm.videoUrl,
        videoType: episodeForm.videoType,
        video480pUrl: episodeForm.video480pUrl || undefined,
        video720pUrl: episodeForm.video720pUrl || undefined,
        video1080pUrl: episodeForm.video1080pUrl || undefined,
      });
      toast.success("تم إضافة الحلقة بنجاح");
      setEpisodeForm({
        episodeNumber: "",
        titleAr: "",
        descriptionAr: "",
        videoUrl: "",
        videoType: "youtube",
        video480pUrl: "",
        video720pUrl: "",
        video1080pUrl: "",
      });
      refetchEpisodes();
    } catch (error) {
      toast.error("حدث خطأ في إضافة الحلقة");
    }
  };

  const handleDeleteEpisode = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه الحلقة؟")) return;
    try {
      await deleteEpisodeMutation.mutateAsync({ id });
      toast.success("تم حذف الحلقة بنجاح");
      refetchEpisodes();
    } catch (error) {
      toast.error("حدث خطأ في حذف الحلقة");
    }
  };

  // ==================== إدارة الأقسام ====================
  const { data: categories, refetch: refetchCategories } = trpc.categories.list.useQuery();
  const createCategoryMutation = trpc.categories.create.useMutation();
  const deleteCategoryMutation = trpc.categories.delete.useMutation();

  const [categoryForm, setCategoryForm] = useState({
    nameAr: "",
    descriptionAr: "",
  });

  const handleCreateCategory = async () => {
    if (!categoryForm.nameAr) {
      toast.error("اسم القسم مطلوب");
      return;
    }

    try {
      await createCategoryMutation.mutateAsync({
        titleAr: categoryForm.nameAr,
        descriptionAr: categoryForm.descriptionAr,
        title: categoryForm.nameAr,
      });
      toast.success("تم إضافة القسم بنجاح");
      setCategoryForm({ nameAr: "", descriptionAr: "" });
      refetchCategories();
    } catch (error) {
      toast.error("حدث خطأ في إضافة القسم");
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا القسم؟")) return;
    try {
      await deleteCategoryMutation.mutateAsync({ id });
      toast.success("تم حذف القسم بنجاح");
      refetchCategories();
    } catch (error) {
      toast.error("حدث خطأ في حذف القسم");
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-foreground">لوحة الإدارة</h1>
          <Button
            onClick={async () => {
              try {
                await seedRealDataMutation.mutateAsync();
                toast.success("تم إضافة مسلسلات حقيقية!");
                setTimeout(() => window.location.reload(), 1000);
              } catch (error: any) {
                toast.error(error.message || "فشل");
              }
            }}
            disabled={seedRealDataMutation.isPending}
            className="gap-2"
          >
            {seedRealDataMutation.isPending ? "جاري..." : "إضافة مسلسلات حقيقية"}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-8 mb-6">
            <TabsTrigger value="series">المسلسلات</TabsTrigger>
            <TabsTrigger value="episodes">الحلقات</TabsTrigger>
            <TabsTrigger value="categories">الأقسام</TabsTrigger>
            <TabsTrigger value="slider">السلايدر</TabsTrigger>
            <TabsTrigger value="images">الصور</TabsTrigger>
            <TabsTrigger value="displaySections">أقسام العرض</TabsTrigger>
            <TabsTrigger value="editSeries">تعديل المسلسلات</TabsTrigger>
            <TabsTrigger value="channels">القنوات</TabsTrigger>
          </TabsList>

          {/* ==================== تبويب المسلسلات ==================== */}
          <TabsContent value="series" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إضافة مسلسل جديد</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="اسم المسلسل (عربي)"
                  value={seriesForm.titleAr}
                  onChange={(e) => setSeriesForm({ ...seriesForm, titleAr: e.target.value })}
                />
                <Input
                  placeholder="الوصف (عربي)"
                  value={seriesForm.descriptionAr}
                  onChange={(e) => setSeriesForm({ ...seriesForm, descriptionAr: e.target.value })}
                />
                <Input
                  placeholder="النوع (مثال: درما، كوميديا)"
                  value={seriesForm.genre}
                  onChange={(e) => setSeriesForm({ ...seriesForm, genre: e.target.value })}
                />
                <Input
                  placeholder="رابط الصورة"
                  value={seriesForm.posterUrl}
                  onChange={(e) => setSeriesForm({ ...seriesForm, posterUrl: e.target.value })}
                />
                <Button onClick={handleCreateSeries} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  إضافة مسلسل
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {seriesList?.map((series) => (
                <Card key={series.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{series.titleAr}</h3>
                        <p className="text-sm text-muted-foreground">{series.descriptionAr}</p>
                        <p className="text-sm text-muted-foreground mt-2">النوع: {series.genre}</p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteSeries(series.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ==================== تبويب الحلقات ==================== */}
          <TabsContent value="episodes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>اختر مسلسل</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  value={selectedSeriesId || ""}
                  onChange={(e) => setSelectedSeriesId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                >
                  <option value="">-- اختر مسلسل --</option>
                  {seriesList?.map((series) => (
                    <option key={series.id} value={series.id}>
                      {series.titleAr}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>

            {selectedSeriesId && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>إضافة حلقة جديدة</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      placeholder="رقم الحلقة"
                      type="number"
                      value={episodeForm.episodeNumber}
                      onChange={(e) => setEpisodeForm({ ...episodeForm, episodeNumber: e.target.value })}
                    />
                    <Input
                      placeholder="اسم الحلقة"
                      value={episodeForm.titleAr}
                      onChange={(e) => setEpisodeForm({ ...episodeForm, titleAr: e.target.value })}
                    />
                    <Input
                      placeholder="وصف الحلقة"
                      value={episodeForm.descriptionAr}
                      onChange={(e) => setEpisodeForm({ ...episodeForm, descriptionAr: e.target.value })}
                    />
                    <div className="space-y-2">
                      <label className="text-sm font-medium">نوع الفيديو</label>
                      <select
                        value={episodeForm.videoType}
                        onChange={(e) => setEpisodeForm({ ...episodeForm, videoType: e.target.value as "youtube" | "mp4" | "m3u8" })}
                        className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                      >
                        <option value="youtube">YouTube</option>
                        <option value="mp4">MP4 (رفع مباشر)</option>
                        <option value="m3u8">M3U8 (Streaming)</option>
                      </select>
                    </div>
                    <Input
                      placeholder="رابط الفيديو الرئيسي"
                      value={episodeForm.videoUrl}
                      onChange={(e) => setEpisodeForm({ ...episodeForm, videoUrl: e.target.value })}
                    />
                    <Input
                      placeholder="رابط جودة 480p (اختياري)"
                      value={episodeForm.video480pUrl}
                      onChange={(e) => setEpisodeForm({ ...episodeForm, video480pUrl: e.target.value })}
                    />
                    <Input
                      placeholder="رابط جودة 720p (اختياري)"
                      value={episodeForm.video720pUrl}
                      onChange={(e) => setEpisodeForm({ ...episodeForm, video720pUrl: e.target.value })}
                    />
                    <Input
                      placeholder="رابط جودة 1080p (اختياري)"
                      value={episodeForm.video1080pUrl}
                      onChange={(e) => setEpisodeForm({ ...episodeForm, video1080pUrl: e.target.value })}
                    />
                    <Button onClick={handleCreateEpisode} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      إضافة حلقة
                    </Button>
                  </CardContent>
                </Card>

                <div className="grid gap-4">
                  {episodes?.map((episode) => (
                    <Card key={episode.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold">الحلقة {episode.episodeNumber}</h3>
                            <p className="text-sm font-medium">{episode.titleAr}</p>
                            <p className="text-sm text-muted-foreground">{episode.descriptionAr}</p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteEpisode(episode.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* ==================== تبويب الأقسام ==================== */}
          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إضافة قسم جديد</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="اسم القسم"
                  value={categoryForm.nameAr}
                  onChange={(e) => setCategoryForm({ ...categoryForm, nameAr: e.target.value })}
                />
                <Input
                  placeholder="وصف القسم (اختياري)"
                  value={categoryForm.descriptionAr}
                  onChange={(e) => setCategoryForm({ ...categoryForm, descriptionAr: e.target.value })}
                />
                <Button onClick={handleCreateCategory} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  إضافة قسم
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {categories?.map((category) => (
                <Card key={category.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{category.titleAr}</h3>
                        <p className="text-sm text-muted-foreground">{category.descriptionAr}</p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ==================== تبويب السلايدر ==================== */}
          <TabsContent value="slider" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إدارة السلايدر</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">اختر المسلسلات التي تريد عرضها في السلايدر وحدد ترتيبها</p>
                <div className="grid gap-4">
                  {seriesList?.map((series) => (
                    <div key={series.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <span>{series.titleAr}</span>
                      <Button size="sm" variant="outline">
                        إضافة للسلايدر
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== تبويب الصور ==================== */}
          <TabsContent value="images" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إدارة صور المسلسلات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">تعديل صور المسلسلات والأقسام</p>
                <div className="grid gap-4">
                  {seriesList?.map((series) => (
                    <div key={series.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <span className="font-medium">{series.titleAr}</span>
                        {series.posterUrl && (
                          <img src={series.posterUrl} alt={series.titleAr} className="w-16 h-24 mt-2 rounded" />
                        )}
                      </div>
                      <Button size="sm" variant="outline">
                        تعديل الصورة
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* ==================== تبويب أقسام العرض ==================== */}
          <TabsContent value="displaySections" className="space-y-6">
            <AdminDisplaySections />
          </TabsContent>
          {/* ==================== تبويب تعديل المسلسلات ==================== */}
          <TabsContent value="editSeries" className="space-y-6">
            <AdminEditSeries />
          </TabsContent>
          {/* ==================== تبويب القنوات ==================== */}
          <TabsContent value="channels" className="space-y-6">
            <AdminChannels />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
