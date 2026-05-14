import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadPreviewProps {
  onImageSelect: (file: File, preview: string) => void;
  imageType: "banner" | "poster" | "cover";
  currentImage?: string;
}

export function ImageUploadPreview({
  onImageSelect,
  imageType,
  currentImage,
}: ImageUploadPreviewProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    // التحقق من نوع الملف
    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار ملف صورة");
      return;
    }

    // التحقق من حجم الملف (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 5MB");
      return;
    }

    // إنشاء معاينة
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      onImageSelect(file, result);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const getImageTypeLabel = () => {
    const labels: Record<string, string> = {
      banner: "صورة البنر",
      poster: "صورة البوستر",
      cover: "صورة الغلاف",
    };
    return labels[imageType] || "الصورة";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">{getImageTypeLabel()}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* منطقة الرفع */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? "border-primary bg-primary/10"
              : "border-muted-foreground/30 hover:border-primary/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-3">
            <Upload className="w-8 h-8 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">
                اسحب الصورة هنا أو انقر للاختيار
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                PNG, JPG, GIF (حد أقصى 5MB)
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2"
            >
              <Upload className="w-4 h-4 mr-2" />
              اختر صورة
            </Button>
          </div>
        </div>

        {/* المعاينة */}
        {preview && (
          <div className="space-y-3">
            <div className="relative">
              <img
                src={preview}
                alt="معاينة الصورة"
                className="w-full h-auto rounded-lg border border-border object-cover max-h-96"
              />
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 text-sm text-muted-foreground">
              <ImageIcon className="w-4 h-4 flex-shrink-0" />
              <span>تم اختيار صورة - جاهزة للحفظ</span>
            </div>
          </div>
        )}

        {/* الصورة الحالية */}
        {currentImage && !preview && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              الصورة الحالية:
            </p>
            <img
              src={currentImage}
              alt="الصورة الحالية"
              className="w-full h-auto rounded-lg border border-border object-cover max-h-96"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
