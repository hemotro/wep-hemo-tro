import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Trash2, Star, Upload, ArrowLeft } from "lucide-react";
import { ImageUploadPreview } from "@/components/ImageUploadPreview";

interface SeriesWithImages {
  id: number;
  titleAr: string;
  images: Array<{
    id: number;
    imageType: string;
    imageUrl: string;
    isDefault: boolean;
  }>;
}

export default function AdminSeriesImages() {
  const [, navigate] = useLocation();
  const [selectedSeries, setSelectedSeries] = useState<SeriesWithImages | null>(null);
  const [selectedImageType, setSelectedImageType] = useState<"banner" | "poster" | "cover">("poster");
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: seriesList, isLoading } = trpc.series.list.useQuery();
  const { data: seriesImages, refetch: refetchImages } = trpc.images.getSeriesImages.useQuery(
    { seriesId: selectedSeries?.id || 0 },
    { enabled: !!selectedSeries }
  );

  const uploadImageMutation = trpc.images.uploadImage.useMutation();
  const deleteImageMutation = trpc.images.deleteImage.useMutation();
  const setDefaultImageMutation = trpc.images.setDefaultImage.useMutation();

  const handleImageSelect = (file: File, previewUrl: string) => {
    setUploadingFile(file);
    setPreview(previewUrl);
  };

  const handleUploadImage = async () => {
    if (!uploadingFile || !selectedSeries) {
      toast.error("يرجى اختيار صورة ومسلسل");
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(",")[1];

        await uploadImageMutation.mutateAsync({
          seriesId: selectedSeries.id,
          imageType: selectedImageType,
          imageBase64: base64Data,
          fileName: uploadingFile.name,
          mimeType: uploadingFile.type,
          alt: `${selectedSeries.titleAr} - ${selectedImageType}`,
        });

        toast.success("تم رفع الصورة بنجاح!");
        setUploadingFile(null);
        setPreview(null);
        refetchImages();
      };
      reader.readAsDataURL(uploadingFile);
    } catch (error: any) {
      toast.error(error.message || "فشل رفع الصورة");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (confirm("هل أنت متأكد من حذف هذه الصورة؟")) {
      try {
        await deleteImageMutation.mutateAsync({ imageId });
        toast.success("تم حذف الصورة بنجاح!");
        refetchImages();
      } catch (error: any) {
        toast.error(error.message || "فشل حذف الصورة");
      }
    }
  };

  const handleSetDefaultImage = async (imageId: number) => {
    if (!selectedSeries) return;

    try {
      await setDefaultImageMutation.mutateAsync({
        seriesId: selectedSeries.id,
        imageId,
      });
      toast.success("تم تعيين الصورة كافتراضية!");
      refetchImages();
    } catch (error: any) {
      toast.error(error.message || "فشل تعيين الصورة الافتراضية");
    }
  };

  const getImageTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      banner: "البنر",
      poster: "البوستر",
      cover: "الغلاف",
    };
    return labels[type] || type;
  };

  if (!selectedSeries) {
    return (
      <div className="flex-1 pb-20">
        <div className="max-w-7xl mx-auto p-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">إدارة صور المسلسلات</h1>
            <p className="text-muted-foreground mt-2">
              اختر مسلسلاً لإدارة صوره (بنر، بوستر، غلاف)
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {seriesList?.map((series: any) => (
                <Card
                  key={series.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() =>
                    setSelectedSeries({
                      id: series.id,
                      titleAr: series.titleAr,
                      images: [],
                    })
                  }
                >
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{series.titleAr}</h3>
                    <p className="text-sm text-muted-foreground">
                      {series.genre && `${series.genre} • `}
                      {series.totalEpisodes} حلقة
                    </p>
                    <Button className="w-full mt-4" size="sm">
                      إدارة الصور
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 pb-20">
      <div className="max-w-6xl mx-auto p-4">
        {/* رأس الصفحة */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedSeries(null)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{selectedSeries.titleAr}</h1>
            <p className="text-muted-foreground">إدارة الصور</p>
          </div>
        </div>

        {/* التبويبات */}
        <Tabs defaultValue="poster" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="poster">البوستر</TabsTrigger>
            <TabsTrigger value="banner">البنر</TabsTrigger>
            <TabsTrigger value="cover">الغلاف</TabsTrigger>
          </TabsList>

          {/* تبويب البوستر */}
          <TabsContent value="poster" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* رفع الصورة */}
              <div>
                <ImageUploadPreview
                  onImageSelect={handleImageSelect}
                  imageType="poster"
                  currentImage={
                    seriesImages?.images?.find((img) => img.imageType === "poster")
                      ?.imageUrl
                  }
                />
                <Button
                  onClick={handleUploadImage}
                  disabled={!uploadingFile || isUploading}
                  className="w-full mt-4"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? "جاري الرفع..." : "رفع البوستر"}
                </Button>
              </div>

              {/* الصور الموجودة */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">الصور الموجودة</h3>
                {seriesImages?.images
                  ?.filter((img) => img.imageType === "poster")
                  .map((image) => (
                    <Card key={image.id} className="overflow-hidden">
                      <div className="relative aspect-video bg-muted">
                        <img
                          src={image.imageUrl}
                          alt="بوستر"
                          className="w-full h-full object-cover"
                        />
                        {image.isDefault && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            افتراضية
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3 flex gap-2">
                        {!image.isDefault && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleSetDefaultImage(image.id)
                            }
                            className="flex-1"
                          >
                            <Star className="w-4 h-4 mr-1" />
                            اجعلها افتراضية
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteImage(image.id)}
                          className="flex-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                {!seriesImages?.images?.some((img) => img.imageType === "poster") && (
                  <p className="text-muted-foreground text-center py-8">
                    لا توجد صور بعد
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* تبويب البنر */}
          <TabsContent value="banner" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <ImageUploadPreview
                  onImageSelect={(file, preview) => {
                    setSelectedImageType("banner");
                    handleImageSelect(file, preview);
                  }}
                  imageType="banner"
                  currentImage={
                    seriesImages?.images?.find((img) => img.imageType === "banner")
                      ?.imageUrl
                  }
                />
                <Button
                  onClick={handleUploadImage}
                  disabled={!uploadingFile || isUploading || selectedImageType !== "banner"}
                  className="w-full mt-4"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? "جاري الرفع..." : "رفع البنر"}
                </Button>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-lg">الصور الموجودة</h3>
                {seriesImages?.images
                  ?.filter((img) => img.imageType === "banner")
                  .map((image) => (
                    <Card key={image.id} className="overflow-hidden">
                      <div className="relative bg-muted h-32">
                        <img
                          src={image.imageUrl}
                          alt="بنر"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="p-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteImage(image.id)}
                          className="flex-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                {!seriesImages?.images?.some((img) => img.imageType === "banner") && (
                  <p className="text-muted-foreground text-center py-8">
                    لا توجد صور بعد
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* تبويب الغلاف */}
          <TabsContent value="cover" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <ImageUploadPreview
                  onImageSelect={(file, preview) => {
                    setSelectedImageType("cover");
                    handleImageSelect(file, preview);
                  }}
                  imageType="cover"
                  currentImage={
                    seriesImages?.images?.find((img) => img.imageType === "cover")
                      ?.imageUrl
                  }
                />
                <Button
                  onClick={handleUploadImage}
                  disabled={!uploadingFile || isUploading || selectedImageType !== "cover"}
                  className="w-full mt-4"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? "جاري الرفع..." : "رفع الغلاف"}
                </Button>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-lg">الصور الموجودة</h3>
                {seriesImages?.images
                  ?.filter((img) => img.imageType === "cover")
                  .map((image) => (
                    <Card key={image.id} className="overflow-hidden">
                      <div className="relative aspect-square bg-muted">
                        <img
                          src={image.imageUrl}
                          alt="غلاف"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="p-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteImage(image.id)}
                          className="flex-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                {!seriesImages?.images?.some((img) => img.imageType === "cover") && (
                  <p className="text-muted-foreground text-center py-8">
                    لا توجد صور بعد
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
