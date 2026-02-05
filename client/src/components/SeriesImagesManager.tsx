import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export function SeriesImagesManager({ seriesId }: { seriesId: number }) {
  const [imageType, setImageType] = useState<"banner" | "poster" | "cover" | "thumbnail">("banner");
  const [imageUrl, setImageUrl] = useState("");
  const [alt, setAlt] = useState("");

  const { data: images = [], refetch } = trpc.seriesImages.getAll.useQuery({ seriesId });
  const addImage = trpc.seriesImages.add.useMutation();
  const deleteImage = trpc.seriesImages.delete.useMutation();
  const setDefault = trpc.seriesImages.setDefault.useMutation();

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      toast.error("أدخل رابط الصورة");
      return;
    }

    try {
      await addImage.mutateAsync({
        seriesId,
        imageType,
        imageUrl,
        alt: alt || undefined,
      });
      toast.success("تمت إضافة الصورة بنجاح");
      setImageUrl("");
      setAlt("");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "فشل إضافة الصورة");
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    try {
      await deleteImage.mutateAsync({ imageId });
      toast.success("تم حذف الصورة بنجاح");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "فشل حذف الصورة");
    }
  };

  const handleSetDefault = async (imageId: number) => {
    try {
      await setDefault.mutateAsync({ seriesId, imageId });
      toast.success("تم تعيين الصورة الافتراضية");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "فشل تعيين الصورة");
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-secondary border-border">
        <CardHeader>
          <CardTitle>إضافة صورة جديدة</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddImage} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">نوع الصورة</label>
              <select
                value={imageType}
                onChange={(e) => setImageType(e.target.value as any)}
                className="w-full p-2 rounded-lg bg-background border border-border text-foreground"
              >
                <option value="banner">بانر (Banner)</option>
                <option value="poster">ملصق (Poster)</option>
                <option value="cover">غلاف (Cover)</option>
                <option value="thumbnail">صورة مصغرة (Thumbnail)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">رابط الصورة</label>
              <Input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="bg-background border-border text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">النص البديل (اختياري)</label>
              <Input
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="وصف الصورة"
                className="bg-background border-border text-foreground"
              />
            </div>

            <Button type="submit" className="w-full" disabled={addImage.isPending}>
              {addImage.isPending ? "جاري الإضافة..." : "إضافة الصورة"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h3 className="font-semibold text-foreground">الصور المرفوعة</h3>
        {images.length > 0 ? (
          images.map((image: any) => (
            <Card key={image.id} className="bg-secondary border-border">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden border border-border flex-shrink-0">
                    <img src={image.imageUrl} alt={image.alt} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 rounded text-xs bg-primary/20 text-primary font-semibold">
                        {image.imageType}
                      </span>
                      {image.isDefault && (
                        <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-500 font-semibold">
                          افتراضية
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{image.alt || image.imageUrl}</p>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {!image.isDefault && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetDefault(image.id)}
                        disabled={setDefault.isPending}
                      >
                        تعيين افتراضية
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
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-secondary border-border">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">لم يتم رفع أي صور بعد</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
