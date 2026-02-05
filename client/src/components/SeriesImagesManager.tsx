import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Upload } from "lucide-react";

export function SeriesImagesManager({ seriesId }: { seriesId: number }) {
  const [imageUrl, setImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  const { data: images = [], refetch } = trpc.seriesImages.getAll.useQuery({ seriesId });
  const addImage = trpc.seriesImages.add.useMutation();
  const deleteImage = trpc.seriesImages.delete.useMutation();
  const setDefault = trpc.seriesImages.setDefault.useMutation();

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      toast.error("أدخل رابط الصورة");
      return;
    }

    try {
      await addImage.mutateAsync({
        seriesId,
        imageType: "banner",
        imageUrl: imageUrl.trim(),
      });
      toast.success("تمت إضافة الصورة بنجاح!");
      setImageUrl("");
      setPreviewUrl("");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "فشل إضافة الصورة");
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    try {
      await deleteImage.mutateAsync({ imageId });
      toast.success("تم حذف الصورة");
      refetch();
    } catch (error: any) {
      toast.error("فشل حذف الصورة");
    }
  };

  const handleSetDefault = async (imageId: number) => {
    try {
      await setDefault.mutateAsync({ seriesId, imageId });
      toast.success("تم تعيين الصورة الافتراضية");
      refetch();
    } catch (error: any) {
      toast.error("فشل تعيين الصورة");
    }
  };

  const handleUrlChange = (url: string) => {
    setImageUrl(url);
    if (url.trim()) {
      setPreviewUrl(url);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-secondary border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            إضافة صورة البانر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddImage} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                رابط الصورة
              </label>
              <Input
                type="url"
                value={imageUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="bg-background border-border text-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">
                أدخل رابط الصورة مباشرة (JPG, PNG, WebP)
              </p>
            </div>

            {previewUrl && (
              <div className="relative w-full rounded-lg overflow-hidden border-2 border-primary/30 bg-black">
                <img
                  src={previewUrl}
                  alt="معاينة"
                  className="w-full h-48 object-cover"
                  onError={() => {
                    toast.error("فشل تحميل الصورة - تحقق من الرابط");
                    setPreviewUrl("");
                  }}
                />
                <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
                  معاينة
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90" 
              disabled={addImage.isPending || !imageUrl.trim()}
            >
              {addImage.isPending ? "جاري الإضافة..." : "إضافة الصورة"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h3 className="font-bold text-foreground mb-3 text-lg">الصور المرفوعة</h3>
        
        {images.length > 0 ? (
          <div className="space-y-3">
            {images.map((image: any) => (
              <Card key={image.id} className="bg-secondary border-border overflow-hidden">
                <div className="flex gap-4 p-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-border">
                    <img 
                      src={image.imageUrl} 
                      alt="صورة البانر" 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {image.isDefault && (
                        <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-500 font-semibold">
                          افتراضية
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {image.imageUrl}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {!image.isDefault && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetDefault(image.id)}
                        disabled={setDefault.isPending}
                        className="text-xs"
                      >
                        تعيين
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteImage(image.id)}
                      disabled={deleteImage.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-secondary border-border">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">لم يتم إضافة أي صور بعد</p>
              <p className="text-xs text-muted-foreground mt-2">أضف صورة أعلاه لتظهر هنا</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
