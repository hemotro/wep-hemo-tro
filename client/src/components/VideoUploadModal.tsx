import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, X, Play } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  episodeId: number;
  onSuccess: () => void;
}

export function VideoUploadModal({ isOpen, onClose, episodeId, onSuccess }: VideoUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadVideoMutation = trpc.videos.upload.useMutation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // التحقق من نوع الملف
    const validTypes = ["video/mp4", "video/x-matroska", "video/x-msvideo", "video/quicktime"];
    if (!validTypes.includes(file.type)) {
      toast.error("صيغة الفيديو غير مدعومة. استخدم: MP4, MKV, AVI, MOV");
      return;
    }

    // التحقق من حجم الملف (أقصى 2GB)
    const maxSize = 2 * 1024 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("حجم الملف كبير جداً. الحد الأقصى 2GB");
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add("border-blue-500", "bg-blue-50");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("border-blue-500", "bg-blue-50");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove("border-blue-500", "bg-blue-50");

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect({ target: { files: e.dataTransfer.files } } as any);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("يرجى اختيار ملف فيديو");
      return;
    }

    setIsUploading(true);
    setProcessingStatus("جاري تحميل الملف...");

    try {
      // تحويل الملف إلى Base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;

        try {
          setProcessingStatus("جاري معالجة الفيديو...");
          setUploadProgress(30);

      // تحويل Base64 إلى Buffer
              const binaryString = atob(base64Data.split(',')[1]);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const buffer = Buffer.from(bytes);

              // إرسال الملف للخادم
              await uploadVideoMutation.mutateAsync({
                episodeId,
                fileName: selectedFile.name,
                fileBuffer: buffer,
                fileSize: selectedFile.size,
                mimeType: selectedFile.type,
              });

          setUploadProgress(100);
          setProcessingStatus("تم رفع الفيديو بنجاح!");
          toast.success("تم رفع الفيديو وحفظه بنجاح!");

          setTimeout(() => {
            setSelectedFile(null);
            setUploadProgress(0);
            setProcessingStatus("");
            setIsUploading(false);
            onSuccess();
            onClose();
          }, 1500);
        } catch (error: any) {
          toast.error(error.message || "فشل رفع الفيديو");
          setIsUploading(false);
          setProcessingStatus("");
        }
      };

      reader.onerror = () => {
        toast.error("فشل قراءة الملف");
        setIsUploading(false);
        setProcessingStatus("");
      };

      reader.readAsDataURL(selectedFile);
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ");
      setIsUploading(false);
      setProcessingStatus("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تحميل فيديو الحلقة</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* منطقة السحب والإفلات */}
          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm font-medium mb-1">اسحب الفيديو هنا أو انقر للاختيار</p>
              <p className="text-xs text-gray-500">MP4, MKV, AVI, MOV (حد أقصى 2GB)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                {!isUploading && (
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {isUploading && (
                <div className="mt-4 space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 text-center">{processingStatus}</p>
                  <p className="text-xs text-gray-500 text-center">{uploadProgress}%</p>
                </div>
              )}
            </div>
          )}

          {/* الأزرار */}
          <div className="flex gap-3">
            {selectedFile && !isUploading && (
              <Button
                onClick={handleUpload}
                className="flex-1 gap-2"
              >
                <Play className="w-4 h-4" />
                رفع الآن
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? "جاري الرفع..." : "إلغاء"}
            </Button>
          </div>

          {/* معلومات مفيدة */}
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-800">
            <p className="font-medium mb-1">ملاحظات مهمة:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>سيتم معالجة الفيديو تلقائياً إلى 4 جودات</li>
              <li>قد تستغرق المعالجة عدة دقائق حسب حجم الملف</li>
              <li>لا تغلق الصفحة أثناء الرفع</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
