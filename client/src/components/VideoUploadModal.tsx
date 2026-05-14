import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, X, Play, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useRef } from "react";

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  episodeId: number;
  onSuccess: (videoUrl: string) => void;
}

export function VideoUploadModal({ isOpen, onClose, episodeId, onSuccess }: VideoUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState("");
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadVideoMutation = trpc.videos.upload.useMutation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // التحقق من نوع الملف
    const validTypes = ["video/mp4", "video/x-matroska", "video/x-msvideo", "video/quicktime", "video/mpeg"];
    if (!validTypes.includes(file.type)) {
      toast.error("صيغة الفيديو غير مدعومة. استخدم: MP4, MKV, AVI, MOV");
      return;
    }

    // التحقق من حجم الملف (أقصى 500MB)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`حجم الملف كبير جداً. الحد الأقصى 500MB (حجم الملف: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      return;
    }

    setSelectedFile(file);

    // إنشاء معاينة الفيديو
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
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
      // قراءة الملف كـ ArrayBuffer
      const reader = new FileReader();
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 50;
          setUploadProgress(percentComplete);
        }
      };

      reader.onload = async (e) => {
        try {
          setProcessingStatus("جاري معالجة الفيديو...");
          setUploadProgress(60);

          const arrayBuffer = e.target?.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);

          // إرسال الملف للخادم
          const result = await uploadVideoMutation.mutateAsync({
            episodeId,
            fileName: selectedFile.name,
            fileBuffer: uint8Array as any,
            fileSize: selectedFile.size,
            mimeType: selectedFile.type,
            duration: Math.floor(selectedFile.size / 1024 / 1024 * 60), // تقدير تقريبي,
          });

          setUploadProgress(100);
          setProcessingStatus("تم رفع الفيديو بنجاح!");
          toast.success("تم رفع الفيديو وحفظه بنجاح!");

          setTimeout(() => {
            setSelectedFile(null);
            setUploadProgress(0);
            setProcessingStatus("");
            setIsUploading(false);
            setVideoPreview(null);
            onSuccess(result.url);
            onClose();
          }, 1500);
        } catch (error: any) {
          console.error("Upload error:", error);
          toast.error(error.message || "فشل رفع الفيديو");
          setIsUploading(false);
          setProcessingStatus("");
          setUploadProgress(0);
        }
      };

      reader.onerror = () => {
        toast.error("فشل قراءة الملف");
        setIsUploading(false);
        setProcessingStatus("");
        setUploadProgress(0);
      };

      reader.readAsArrayBuffer(selectedFile);
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "حدث خطأ");
      setIsUploading(false);
      setProcessingStatus("");
      setUploadProgress(0);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setVideoPreview(null);
    setUploadProgress(0);
    setProcessingStatus("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>تحميل فيديو الحلقة</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* تنبيه المتطلبات */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold">المتطلبات:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>الصيغ المدعومة: MP4, MKV, AVI, MOV</li>
                <li>الحد الأقصى للحجم: 500MB</li>
                <li>يُنصح بـ 1080p أو أقل للأداء الأفضل</li>
              </ul>
            </div>
          </div>

          {/* منطقة السحب والإفلات */}
          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-blue-500 hover:bg-gray-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/x-matroska,video/x-msvideo,video/quicktime,video/mpeg"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="font-semibold text-gray-900">اسحب الفيديو هنا أو انقر للاختيار</p>
              <p className="text-sm text-gray-500 mt-1">الحد الأقصى: 500MB</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* معاينة الفيديو */}
              {videoPreview && (
                <div className="relative rounded-lg overflow-hidden bg-black">
                  <video
                    src={videoPreview}
                    controls
                    className="w-full h-64 object-contain"
                  />
                </div>
              )}

              {/* معلومات الملف */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">الملف:</span>
                  <span className="text-sm text-gray-600">{selectedFile.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">الحجم:</span>
                  <span className="text-sm text-gray-600">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">النوع:</span>
                  <span className="text-sm text-gray-600">{selectedFile.type}</span>
                </div>
              </div>

              {/* شريط التقدم */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">{processingStatus}</span>
                    <span className="text-sm text-gray-600">{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* الأزرار */}
              <div className="flex gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? `جاري الرفع (${Math.round(uploadProgress)}%)` : "رفع الفيديو"}
                </Button>
                <Button
                  onClick={handleClearFile}
                  variant="outline"
                  disabled={isUploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
