import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Lock } from "lucide-react";

interface AdminCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminCodeModal({ isOpen, onClose, onSuccess }: AdminCodeModalProps) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const verifyCodeMutation = trpc.auth.verifyAdminCode.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      toast.error("يرجى إدخال الرمز السري");
      return;
    }

    setIsLoading(true);
    try {
      await verifyCodeMutation.mutateAsync({ code });
      toast.success("تم التحقق من الرمز بنجاح!");
      setCode("");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "الرمز السري غير صحيح");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            <DialogTitle>لوحة التحكم الإدارية</DialogTitle>
          </div>
          <DialogDescription>
            يرجى إدخال الرمز السري للوصول إلى لوحة التحكم
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">الرمز السري</label>
            <Input
              type="password"
              placeholder="أدخل الرمز السري"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "جاري التحقق..." : "تحقق"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
